"""
API routes for dataset management.
"""
import os
import shutil
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from ..services.data_service import (
    get_dataset_info, get_dataset_preview, validate_csv,
    reload_dataset, DATASET_PATH
)

router = APIRouter(prefix="/api", tags=["dataset"])


@router.get("/dataset/info")
def dataset_info():
    """Get dataset metadata."""
    try:
        return get_dataset_info()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/dataset/preview")
def dataset_preview(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    search: str = Query(""),
):
    """Get paginated dataset preview."""
    try:
        return get_dataset_preview(page, page_size, search)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-dataset")
async def upload_dataset(file: UploadFile = File(...)):
    """Upload and validate a new dataset CSV."""
    try:
        if not file.filename.endswith(".csv"):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
        # Save to temp location
        temp_path = DATASET_PATH + ".tmp"
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Validate
        validation = validate_csv(temp_path)
        
        if not validation.get("valid", False):
            os.remove(temp_path)
            return {
                "success": False,
                "message": "Validation failed",
                "validation": validation,
            }
        
        # Backup old dataset
        if os.path.exists(DATASET_PATH):
            backup_path = DATASET_PATH + ".bak"
            shutil.copy2(DATASET_PATH, backup_path)
        
        # Replace dataset
        shutil.move(temp_path, DATASET_PATH)
        
        # Reload
        reload_dataset()
        
        return {
            "success": True,
            "message": "Dataset uploaded and validated successfully.",
            "validation": validation,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/dataset/refresh")
def refresh_dataset():
    """Refresh/reload the dataset."""
    try:
        reload_dataset()
        return {"success": True, "message": "Dataset refreshed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
