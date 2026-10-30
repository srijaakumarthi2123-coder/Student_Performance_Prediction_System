"""
API routes for reports and CSV export.
"""
import io
import csv
from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import StreamingResponse
from ..services.data_service import (
    get_unique_students, get_dataset, get_risk_analysis, get_analytics, BRANCH_ORDER
)

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/reports/overall")
def overall_report():
    """Get overall performance report data."""
    try:
        unique = get_unique_students()
        total = len(unique)
        
        perf_dist = unique["Semester_Performance"].value_counts().to_dict()
        risk_dist = unique["Pass_At_Risk"].value_counts().to_dict()
        
        avg_attendance = round(float(unique["Attendance_Percent"].mean()), 1)
        avg_internal = round(float(unique["Internal_Marks"].mean()), 1)
        avg_assignment = round(float(unique["Assignment_Score"].mean()), 1)
        avg_lab = round(float(unique["Lab_Performance"].mean()), 1)
        
        return {
            "report_name": "Overall Student Performance Report",
            "total_students": total,
            "performance_distribution": perf_dist,
            "risk_distribution": risk_dist,
            "averages": {
                "attendance": avg_attendance,
                "internal_marks": avg_internal,
                "assignment_score": avg_assignment,
                "lab_performance": avg_lab,
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/branch")
def branch_report(branch: str = Query("", description="Filter by branch")):
    """Get branch-wise report data."""
    try:
        analytics = get_analytics(branch=branch)
        return {
            "report_name": f"Branch-wise Performance Report{(' - ' + branch) if branch and branch != 'All' else ''}",
            "data": analytics["branch_performance"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/at-risk")
def at_risk_report():
    """Get at-risk student report."""
    try:
        risk_data = get_risk_analysis()
        return {
            "report_name": "At-Risk Student Report",
            "total_at_risk": risk_data["total_at_risk"],
            "total_on_track": risk_data["total_on_track"],
            "students": risk_data["risk_students"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/semester")
def semester_report(semester: str = Query("", description="Filter by semester")):
    """Get semester report."""
    try:
        analytics = get_analytics(semester=semester)
        return {
            "report_name": f"Semester Performance Report{(' - Semester ' + semester) if semester and semester != 'All' else ''}",
            "data": analytics["semester_performance"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/year")
def year_report(joining_year: str = Query("", description="Filter by year")):
    """Get joining year report."""
    try:
        analytics = get_analytics(joining_year=joining_year)
        return {
            "report_name": f"Joining Year Report{(' - ' + joining_year) if joining_year and joining_year != 'All' else ''}",
            "data": analytics["year_performance"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/export/{report_type}")
def export_report(
    report_type: str,
    branch: str = Query("", description="Filter by branch"),
    joining_year: str = Query("", description="Filter by year"),
    semester: str = Query("", description="Filter by semester"),
):
    """Export report data as CSV."""
    try:
        unique = get_unique_students()
        
        # Apply filters
        if branch and branch != "All":
            unique = unique[unique["Branch"] == branch]
        if joining_year and joining_year != "All":
            unique = unique[unique["Joining_Year"] == int(joining_year)]
        if semester and semester != "All":
            unique = unique[unique["Semester"] == int(semester)]
        
        if report_type == "at-risk":
            unique = unique[unique["Pass_At_Risk"] == "At-Risk"]
        
        # Build CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        headers = ["S.No", "Student ID", "Name", "Branch", "Joining Year", "Semester", 
                   "Status", "Attendance", "Internal Marks", "Performance", "Risk"]
        writer.writerow(headers)
        
        for i, (_, row) in enumerate(unique.iterrows()):
            writer.writerow([
                i + 1,
                row["Student_ID"],
                row["Student_Name"],
                row["Branch"],
                int(row["Joining_Year"]),
                int(row["Semester"]),
                row["Semester_Status"],
                round(float(row["Attendance_Percent"]), 1),
                round(float(row["Internal_Marks"]), 1),
                row["Semester_Performance"],
                row["Pass_At_Risk"],
            ])
        
        output.seek(0)
        filename = f"{report_type}_report.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
