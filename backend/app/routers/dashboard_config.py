from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
import json
import os
import uuid

router = APIRouter(prefix="/api/dashboard-config", tags=["dashboard-config"])

CONFIG_FILE = "dashboard_config.json"

class ChartConfig(BaseModel):
    id: str
    title: str
    datasource_id: str
    chart_type: str # 'bar', 'line', 'area'
    x_column: str
    y_column: str
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

def load_config():
    if not os.path.exists(CONFIG_FILE):
        return []
    with open(CONFIG_FILE, "r") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []

def save_config(data):
    with open(CONFIG_FILE, "w") as f:
        json.dump(data, f, indent=2)

@router.get("/sections", response_model=List[SectionConfig])
def get_sections():
    config = load_config()
    # Simple migration/validation if needed, or just return
    return config

@router.post("/sections", response_model=SectionConfig)
def create_section(section: SectionConfigCreate):
    config = load_config()
    new_section = {
        "id": str(uuid.uuid4()),
        "title": section.title,
        "layout_columns": section.layout_columns or 2,
        "charts": []
    }
    config.append(new_section)
    save_config(config)
    return new_section

@router.put("/sections/{id}", response_model=SectionConfig)
def update_section(id: str, section_update: SectionConfigUpdate):
    config = load_config()
    section = next((s for s in config if s["id"] == id), None)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    if section_update.title is not None:
        section["title"] = section_update.title
    if section_update.layout_columns is not None:
        section["layout_columns"] = section_update.layout_columns
        
    save_config(config)
    return section

@router.delete("/sections/{id}")
def delete_section(id: str):
    config = load_config()
    new_config = [s for s in config if s["id"] != id]
    if len(config) == len(new_config):
        raise HTTPException(status_code=404, detail="Section not found")
    save_config(new_config)
    return {"message": "Section deleted"}

@router.post("/sections/{section_id}/charts", response_model=ChartConfig)
def add_chart(section_id: str, chart: ChartConfigCreate):
    config = load_config()
    section = next((s for s in config if s["id"] == section_id), None)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    new_chart = chart.dict()
    new_chart["id"] = str(uuid.uuid4())
    
    if "charts" not in section:
        section["charts"] = []
    
    section["charts"].append(new_chart)
    save_config(config)
    return new_chart

@router.delete("/sections/{section_id}/charts/{chart_id}")
def delete_chart(section_id: str, chart_id: str):
    config = load_config()
    section = next((s for s in config if s["id"] == section_id), None)
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    
    original_count = len(section.get("charts", []))
    section["charts"] = [c for c in section["charts"] if c["id"] != chart_id]
    
    if len(section["charts"]) == original_count:
         raise HTTPException(status_code=404, detail="Chart not found")
         
    save_config(config)
    return {"message": "Chart deleted"}
