"""
API routes for analytics.
"""
from fastapi import APIRouter, Query, HTTPException
from ..services.data_service import get_analytics, get_risk_analysis

router = APIRouter(prefix="/api", tags=["analytics"])


@router.get("/analytics")
def analytics(
    branch: str = Query("", description="Filter by branch"),
    joining_year: str = Query("", description="Filter by joining year"),
    semester: str = Query("", description="Filter by semester"),
):
    """Get analytics data."""
    try:
        return get_analytics(branch, joining_year, semester)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-analysis")
def risk_analysis(
    branch: str = Query("", description="Filter by branch"),
    joining_year: str = Query("", description="Filter by joining year"),
    semester: str = Query("", description="Filter by semester"),
):
    """Get risk analysis data."""
    try:
        return get_risk_analysis(branch, joining_year, semester)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
