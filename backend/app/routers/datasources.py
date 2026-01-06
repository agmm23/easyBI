from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import json
import os

router = APIRouter(prefix="/api/datasources", tags=["datasources"])

DB_FILE = "datasources.json"

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

def load_db():
    if not os.path.exists(DB_FILE):
        return []
    with open(DB_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/", response_model=List[DataSource])
def get_datasources():
    return load_db()

@router.post("/", response_model=DataSource)
def create_datasource(ds: DataSourceCreate):
    db = load_db()
    import uuid
    new_ds = ds.dict()
    new_ds["id"] = str(uuid.uuid4())
    db.append(new_ds)
    save_db(db)
    return new_ds

@router.delete("/{id}")
def delete_datasource(id: str):
    db = load_db()
    new_db = [d for d in db if d["id"] != id]
    if len(db) == len(new_db):
        raise HTTPException(status_code=404, detail="Datasource not found")
    save_db(new_db)
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
                        start_date: Optional[str] = None, 
                        end_date: Optional[str] = None, 
                        date_column: Optional[str] = None, 
                        sort_by: Optional[str] = None,
                        x_column: Optional[str] = None,
                        y_column: Optional[str] = None,
                        group_by: Optional[str] = 'day'):
    db = load_db()
    ds = next((d for d in db if d["id"] == id), None)
    if not ds:
        raise HTTPException(status_code=404, detail="Datasource not found")
    
    try:
        # always use get_full_data now to ensure we have the DF for filtering/sorting
        df = get_full_data(ds["path"])
        
        if date_column and (start_date or end_date) and date_column in df.columns:
            # print(f"--- FILTER DEBUG START ---") # Cleaning up old print too if desired, or keeping it

            print(f"Filtering column '{date_column}'")
            print(f"Range: {start_date} to {end_date}")
            print(f"Sample data BEFORE conversion (first 5): {df[date_column].astype(str).head(5).tolist()}")
            
            # Clean whitespace just in case and convert
            # using infer_datetime_format=True (deprecated in new pandas but safe usually) or just standard
            df[date_column] = pd.to_datetime(df[date_column].astype(str).str.strip(), errors='coerce')
            
            print(f"Sample data AFTER conversion (first 5): {df[date_column].head(5).tolist()}")
            
            # Check for NaTs
            nat_count = df[date_column].isna().sum()
            if nat_count > 0:
                print(f"WARNING: {nat_count} rows could not be converted to dates and became NaT (Not a Time).")
            
            try:
                # Fix: Make end_date include the full day (up to 23:59:59.999)
                # If start_date is missing, default to min date
                start_dt = pd.to_datetime(start_date) if start_date else pd.Timestamp.min
                # If end_date is missing, default to max date
                end_dt = pd.to_datetime(end_date) + pd.Timedelta(days=1) if end_date else pd.Timestamp.max
                
                print(f"Filter Interval: [{start_dt}] to strictly less than [{end_dt}]")
                
                mask = (df[date_column] >= start_dt) & (df[date_column] < end_dt)
                df = df.loc[mask]
                print(f"Rows remaining: {len(df)}")

            except Exception as e:
                print(f"Date conversion error (out of bounds or invalid): {e}")
                # If dates are invalid (e.g. year 0002 while typing), we can either return empty or all data.
                # Returning empty avoids showing misleading data.
                return {"columns": df.columns.tolist(), "rows": []}

            # print(f"--- FILTER DEBUG END ---")

        # Aggregation Logic
        if x_column and y_column and x_column in df.columns and y_column in df.columns:
            try:
                 # Ensure Y column is numeric for summing
                 df[y_column] = pd.to_numeric(df[y_column], errors='coerce')
                 
                 # Handle Time Grouping
                 if group_by in ['week', 'month']:
                     # Ensure X is datetime for time grouping
                     df[x_column] = pd.to_datetime(df[x_column], errors='coerce')
                     
                     if group_by == 'week':
                         # Group by week (starting Monday)
                         df[x_column] = df[x_column].dt.to_period('W').apply(lambda r: r.start_time)
                     elif group_by == 'month':
                         # Group by month
                         df[x_column] = df[x_column].dt.to_period('M').apply(lambda r: r.start_time)

                 # Group by X and sum Y, keeping X as valid column (as_index=False)
                 df = df.groupby(x_column, as_index=False)[y_column].sum()
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
