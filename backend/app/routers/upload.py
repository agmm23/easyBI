from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.data_processing import process_file
import shutil
import os

router = APIRouter(prefix="/api/upload", tags=["upload"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the file immediately to preview structure
        preview = process_file(file_path)
        return {"filename": file.filename, "preview": preview}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
