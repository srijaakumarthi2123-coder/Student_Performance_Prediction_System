"""
Pydantic models for API request/response schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False


class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user: Optional[Dict[str, str]] = None


class PredictionRequest(BaseModel):
    student_id: Optional[str] = ""
    branch: str = "CSE"
    joining_year: int = 2024
    semester: int = 1
    attendance: float = 75.0
    previous_semester_marks: float = 60.0
    internal_marks: float = 60.0
    assignment_score: float = 70.0
    lab_performance: float = 70.0
    backlog_count: int = 0
    study_hours: float = 4.0
    previous_performance: str = ""


class PredictionResponse(BaseModel):
    performance: str
    risk_level: str
    risk_description: str
    probability: float
    class_probabilities: Dict[str, float]
    top_factors: List[Dict[str, Any]]
    attendance_status: str
    backlog_status: str
    previous_performance: str
