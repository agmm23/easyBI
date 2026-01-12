from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import uuid
import shutil
from app.auth_utils import get_current_active_user, User

router = APIRouter(prefix="/api/dashboard-config", tags=["dashboard-config"])

# Legacy config file for migration
LEGACY_CONFIG_FILE = "dashboard_config.json"

class ChartConfig(BaseModel):
    id: str
    title: str
    datasource_id: str
    chart_type: str # 'bar', 'line', 'area'
    x_column: str
    y_column: str
    y_column_2: Optional[str] = None
    chart_type_2: Optional[str] = 'line'
    date_column: Optional[str] = None
    breakdown_x_column: Optional[str] = None
    breakdown_chart_type: Optional[str] = 'bar'
    breakdown_x_column_2: Optional[str] = None
    breakdown_chart_type_2: Optional[str] = 'bar'

class ChartConfigCreate(BaseModel):
    title: str
    datasource_id: str
    chart_type: str
    x_column: str
    y_column: str
    y_column_2: Optional[str] = None
    chart_type_2: Optional[str] = 'line'
    date_column: Optional[str] = None
    breakdown_x_column: Optional[str] = None
    breakdown_chart_type: Optional[str] = 'bar'
    breakdown_x_column_2: Optional[str] = None
    breakdown_chart_type_2: Optional[str] = 'bar'

class SectionConfig(BaseModel):
    id: str
    title: str
    layout_columns: Optional[int] = 2
    charts: List[ChartConfig] = []

class SectionConfigCreate(BaseModel):
    title: str
    layout_columns: Optional[int] = 2

class SectionConfigUpdate(BaseModel):
    title: Optional[str] = None
    layout_columns: Optional[int] = None

def get_user_config_path(username: str):
    user_dir = os.path.join("users", username)
    os.makedirs(user_dir, exist_ok=True)
    return os.path.join(user_dir, "dashboard_config.json")

def load_config(user: User):
    config_path = get_user_config_path(user.username)
    
    # Auto-migration for admin if user config doesn't exist but legacy does
    if not os.path.exists(config_path) and user.username == "admin" and os.path.exists(LEGACY_CONFIG_FILE):
        try:
            shutil.copy(LEGACY_CONFIG_FILE, config_path)
        except Exception:
            pass # Fail silently, return empty

    if not os.path.exists(config_path):
        return []
        
    with open(config_path, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_config(data, user: User):
    config_path = get_user_config_path(user.username)
    with open(config_path, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/sections", response_model=List[SectionConfig])
def get_sections(current_user: User = Depends(get_current_active_user)):
    config = load_config(current_user)
    return config

@router.post("/sections", response_model=SectionConfig)
def create_section(section: SectionConfigCreate, current_user: User = Depends(get_current_active_user)):
    config = load_config(current_user)
    new_section = {
        "id": str(uuid.uuid4()),
        "title": section.title,
        "layout_columns": section.layout_columns or 2,
        "charts": []
    }
    config.append(new_section)
    save_config(config, current_user)
    return new_section

@router.put("/sections/{id}", response_model=SectionConfig)
def update_section(id: str, section_update: SectionConfigUpdate, current_user: User = Depends(get_current_active_user)):
    config = load_config(current_user)
    section = next((s for s in config if s["id"] == id), None)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if section_update.title is not None:
        section["title"] = section_update.title
    if section_update.layout_columns is not None:
        section["layout_columns"] = section_update.layout_columns
        
    save_config(config, current_user)
    return section

@router.delete("/sections/{id}")
def delete_section(id: str, current_user: User = Depends(get_current_active_user)):
    config = load_config(current_user)
    new_config = [s for s in config if s["id"] != id]
    if len(config) == len(new_config):
        raise HTTPException(status_code=404, detail="Section not found")
    save_config(new_config, current_user)
    return {"message": "Section deleted"}

@router.post("/sections/{section_id}/charts", response_model=ChartConfig)
def add_chart(section_id: str, chart: ChartConfigCreate, current_user: User = Depends(get_current_active_user)):
    config = load_config(current_user)
    section = next((s for s in config if s["id"] == section_id), None)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    new_chart = chart.dict()
    new_chart["id"] = str(uuid.uuid4())
    
    if "charts" not in section:
        section["charts"] = []
    
    section["charts"].append(new_chart)
    save_config(config, current_user)
    return new_chart

@router.delete("/sections/{section_id}/charts/{chart_id}")
def delete_chart(section_id: str, chart_id: str, current_user: User = Depends(get_current_active_user)):
    config = load_config(current_user)
    section = next((s for s in config if s["id"] == section_id), None)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    original_count = len(section.get("charts", []))
    section["charts"] = [c for c in section["charts"] if c["id"] != chart_id]
    
    if len(section["charts"]) == original_count:
         raise HTTPException(status_code=404, detail="Chart not found")
         
    save_config(config, current_user)
    return {"message": "Chart deleted"}
