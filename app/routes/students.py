"""
API routes for student-related operations.
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from ..services.data_service import (
    get_students_list, get_student_by_id, get_student_performance_trend,
    get_unique_students, add_student, BRANCH_ORDER
)

class StudentCreateSchema(BaseModel):
    student_id: str
    student_name: str
    branch: str = "CSE"
    joining_year: int = 2024
    gender: str = "Male"
    current_semester: int = 5
    attendance: float = 85.0
    internal_marks: float = 75.0
    assignment_score: float = 80.0
    lab_performance: float = 80.0
    previous_semester_marks: float = 75.0
    backlog_count: int = 0
    study_hours: float = 4.0
    extracurricular: str = "No"

router = APIRouter(prefix="/api", tags=["students"])


@router.get("/students")
def list_students(
    search: str = Query("", description="Search by ID, name, or branch"),
    branch: str = Query("", description="Filter by branch"),
    joining_year: str = Query("", description="Filter by joining year"),
    semester: str = Query("", description="Filter by semester"),
    status: str = Query("", description="Filter by status"),
    performance: str = Query("", description="Filter by performance"),
    risk: str = Query("", description="Filter by risk"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get paginated list of students with filters."""
    try:
        return get_students_list(search, branch, joining_year, semester, status, performance, risk, page, page_size)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}")
def get_student(student_id: str):
    """Get a specific student's profile."""
    try:
        student = get_student_by_id(student_id)
        if student is None:
            raise HTTPException(status_code=404, detail=f"Student {student_id} not found")
        return student
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/students/{student_id}/trend")
def get_trend(student_id: str):
    """Get performance trend for a student."""
    try:
        trend = get_student_performance_trend(student_id)
        if not trend:
            raise HTTPException(status_code=404, detail=f"No trend data found for {student_id}")
        return trend
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/branches")
def get_branches():
    """Get list of branches in order."""
    return {"branches": BRANCH_ORDER}


@router.get("/years")
def get_years():
    """Get list of joining years."""
    from ..services.data_service import get_dataset
    df = get_dataset()
    return {"years": sorted(df["Joining_Year"].unique().tolist())}


@router.get("/semesters")
def get_semesters():
    """Get list of semesters."""
    return {"semesters": list(range(1, 9))}


@router.post("/students")
def create_student(student: StudentCreateSchema):
    """Add a new student to the system."""
    try:
        result = add_student(student.dict())
        return {"success": True, "message": f"Student {student.student_id} added successfully.", "student": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
