"""
API routes for dashboard statistics.
"""
from fastapi import APIRouter, HTTPException
from ..services.data_service import get_dashboard_stats

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/dashboard")
def dashboard():
    """Get all dashboard statistics."""
    try:
        return get_dashboard_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
