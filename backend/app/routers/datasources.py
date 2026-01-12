from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import shutil
from app.auth_utils import get_current_active_user, User

router = APIRouter(prefix="/api/datasources", tags=["datasources"])

GLOBAL_DB_FILE = "datasources.json"

def get_user_datasource_path(username: str):
    user_dir = os.path.join("users", username)
    os.makedirs(user_dir, exist_ok=True)
    return os.path.join(user_dir, "datasources.json")

class DataSource(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    type: str # 'csv', 'excel', 'database', 'google_sheets'
    path: str # File path or URL
    columns: List[str]


class DataSourceCreate(BaseModel):

    name: str
    description: Optional[str] = None
    type: str
    path: str
    columns: List[str]

class PreviewURLRequest(BaseModel):
    url: str
    type: str = "google_sheets"

def load_db(user: User):
    user_path = get_user_datasource_path(user.username)
    
    # Migration for Admin: Copy global file if user doesn't have one
    if not os.path.exists(user_path):
        if user.username == "admin" and os.path.exists(GLOBAL_DB_FILE):
             shutil.copy(GLOBAL_DB_FILE, user_path)
    
    if not os.path.exists(user_path):
        return []
        
    with open(user_path, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_db(data, user: User):
    user_path = get_user_datasource_path(user.username)
    with open(user_path, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/", response_model=List[DataSource])
def get_datasources(current_user: User = Depends(get_current_active_user)):
    return load_db(current_user)

@router.post("/", response_model=DataSource)
def create_datasource(ds: DataSourceCreate, current_user: User = Depends(get_current_active_user)):
    db = load_db(current_user)
    import uuid
    new_ds = ds.dict()
    new_ds["id"] = str(uuid.uuid4())
    db.append(new_ds)
    save_db(db, current_user)
    return new_ds

@router.delete("/{id}")
def delete_datasource(id: str, current_user: User = Depends(get_current_active_user)):
    db = load_db(current_user)
    new_db = [d for d in db if d["id"] != id]
    if len(db) == len(new_db):
        raise HTTPException(status_code=404, detail="Datasource not found")
    save_db(new_db, current_user)
    return {"message": "Datasource deleted"}

from app.services.data_processing import process_file, get_full_data
import pandas as pd

@router.post("/preview-url")
def preview_url_datasource(request: PreviewURLRequest):
    try:
        preview = process_file(request.url)
        return {"preview": preview, "url": request.url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing URL: {str(e)}")

@router.get("/{id}/data")
def get_datasource_data(id: str, 
                        current_user: User = Depends(get_current_active_user),
                        start_date: Optional[str] = None, 
                        end_date: Optional[str] = None, 
                        date_column: Optional[str] = None, 
                        sort_by: Optional[str] = None,
                        x_column: Optional[str] = None,
                        y_column: Optional[str] = None,
                        y_column_2: Optional[str] = None,
                        breakdown_column: Optional[str] = None,
                        filter_column: Optional[str] = None,
                        filter_value: Optional[str] = None,
                        group_by: Optional[str] = 'day'):
    db = load_db(current_user)
    ds = next((d for d in db if d["id"] == id), None)
    if not ds:
        raise HTTPException(status_code=404, detail="Datasource not found")
    
    try:
        # always use get_full_data now to ensure we have the DF for filtering/sorting
        df = get_full_data(ds["path"])
        
        if date_column and (start_date or end_date) and date_column in df.columns:
            # Clean whitespace just in case and convert
            # using infer_datetime_format=True (deprecated in new pandas but safe usually) or just standard
            df[date_column] = pd.to_datetime(df[date_column].astype(str).str.strip(), errors='coerce')
            
            # Check for NaTs
            nat_count = df[date_column].isna().sum()
            
            try:
                # Fix: Make end_date include the full day (up to 23:59:59.999)
                start_dt = pd.to_datetime(start_date) if start_date else pd.Timestamp.min
                end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1) if end_date else pd.Timestamp.max
                
                mask = (df[date_column] >= start_dt) & (df[date_column] < end_dt)
                df = df.loc[mask]

            except Exception as e:
                pass
        

        # Arbitrary Generic Filter (for cascading breakdowns)
        if filter_column and filter_value and filter_column in df.columns:
            # Simple string equality for now. Could be extended.
            # Convert column to string for comparison to be safe?
            # Or try to infer type of filter_value?
            # For now, let's assume categorical string filtering which is the use case.
            df = df[df[filter_column].astype(str) == str(filter_value)]

        # Aggregation Logic
        if x_column and y_column and x_column in df.columns and y_column in df.columns:
            try:
                 # Ensure Y column is numeric for summing
                 df[y_column] = pd.to_numeric(df[y_column], errors='coerce')
                 y_cols = [y_column]
                 if y_column_2 and y_column_2 in df.columns:
                     df[y_column_2] = pd.to_numeric(df[y_column_2], errors='coerce')
                     y_cols.append(y_column_2)
                 
                 # Handle Time Grouping
                 group_cols = [x_column]

                 if group_by in ['week', 'month']:
                     # Ensure X is datetime for time grouping
                     df[x_column] = pd.to_datetime(df[x_column], errors='coerce')
                     
                     if group_by == 'week':
                         # Group by week (starting Monday)
                         df[x_column] = df[x_column].dt.to_period('W').apply(lambda r: r.start_time)
                     elif group_by == 'month':
                         # Group by month
                         df[x_column] = df[x_column].dt.to_period('M').apply(lambda r: r.start_time)
                
                 # Add breakdown column to grouping if present
                 if breakdown_column and breakdown_column in df.columns:
                     group_cols.append(breakdown_column)

                 # Group by X (and breakdown) and sum Y, keeping columns as valid (as_index=False)
                 df_grouped = df.groupby(group_cols, as_index=False)[y_cols].sum()
                 
                 # --- ZERO FILLING LOGIC START ---
                 # Only apply if sorting by time or grouping by time is evident
                 if group_by: # group_by acts as a proxy for time-series intent here
                    try:
                        # Determine Date Range
                        # Use request params if available, else data min/max
                        current_min = df_grouped[x_column].min()
                        current_max = df_grouped[x_column].max()
                         
                        range_start = pd.to_datetime(start_date) if start_date else current_min
                        range_end = pd.to_datetime(end_date) if end_date else current_max
                        
                        if pd.notna(range_start) and pd.notna(range_end):
                            freq_map = {'day': 'D', 'week': 'W-MON', 'month': 'MS'}
                            freq = freq_map.get(group_by, 'D')
                            
                            # Create full date index
                            full_idx = pd.date_range(start=range_start, end=range_end, freq=freq)
                            
                            if breakdown_column and breakdown_column in df_grouped.columns:
                                # For breakdown: pivot -> reindex -> unpivot
                                pivot_df = df_grouped.set_index([x_column, breakdown_column])[y_column].unstack(fill_value=0)
                                pivot_df = pivot_df.reindex(full_idx, fill_value=0)
                                # Stack back to long format
                                df_grouped = pivot_df.stack().reset_index()
                                # Rename columns back to original names (stack creates 'level_1' or similar)
                                df_grouped.columns = [x_column, breakdown_column, y_column]
                            else:
                                # For simple chart: set index -> reindex -> reset index
                                df_grouped = df_grouped.set_index(x_column).reindex(full_idx, fill_value=0)
                                df_grouped.index.name = x_column
                                df_grouped = df_grouped.reset_index()
                                
                    except Exception as e:
                        print(f"Zero-filling error: {e}")
                        # Fallback to original grouped data if reindexing fails
                        pass

                 df = df_grouped
                 # --- ZERO FILLING LOGIC END ---
            except Exception as e:
                 print(f"Aggregation error: {e}")
                 pass # Continue without aggregation if fails
            
            
        # Sorting Logic
        if sort_by and sort_by in df.columns:
            # Check if column is likely date to ensure proper sort
            # (Pandas usually handles this if types are inferred, but let's be safe for common cases)
            try:
                # Attempt to sort
                df = df.sort_values(by=sort_by)
            except Exception:
                pass # If sort fails, ignore

        # Clean NaNs for JSON
        df = df.where(pd.notnull(df), None)
        
        return {
            "columns": df.columns.tolist(),
            "rows": df.to_dict(orient="records")
        }

    except Exception as e:
        print(f"Error processing file for data retrieval: {e}")
        raise HTTPException(status_code=500, detail=f"Error reading data file: {str(e)}")
