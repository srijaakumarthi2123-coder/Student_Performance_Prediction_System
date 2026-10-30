"""
API routes for ML prediction.
"""
import json
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException
from ..models.schemas import PredictionRequest
from ..ml.model import predict_performance, get_model_metrics, load_model
from ..services.data_service import get_student_by_id

router = APIRouter(prefix="/api", tags=["prediction"])

PREDICTION_HISTORY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "prediction_history.json"
)


def load_prediction_history():
    """Load prediction history from file."""
    if os.path.exists(PREDICTION_HISTORY_PATH):
        try:
            with open(PREDICTION_HISTORY_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return []
    return []


def save_prediction_history(history):
    """Save prediction history to file."""
    with open(PREDICTION_HISTORY_PATH, "w") as f:
        json.dump(history, f, indent=2)


@router.post("/predict")
def predict(request: PredictionRequest):
    """Make a performance prediction."""
    try:
        model, _, _ = load_model()
        if model is None:
            raise HTTPException(status_code=400, detail="Model not trained. Please train the model first via /api/train-model.")
        
        input_data = {
            "branch": request.branch,
            "joining_year": request.joining_year,
            "semester": request.semester,
            "attendance": request.attendance,
            "previous_semester_marks": request.previous_semester_marks,
            "internal_marks": request.internal_marks,
            "assignment_score": request.assignment_score,
            "lab_performance": request.lab_performance,
            "backlog_count": request.backlog_count,
            "study_hours": request.study_hours,
            "previous_performance": request.previous_performance,
        }
        
        result = predict_performance(input_data)
        
        # Look up student name if ID provided
        student_name = ""
        if request.student_id:
            student = get_student_by_id(request.student_id)
            if student:
                student_name = student.get("student_name", "")
        
        # Save to history
        history = load_prediction_history()
        now = datetime.now()
        max_id = max([h.get("id", 0) for h in history], default=0)
        history_entry = {
            "id": max_id + 1,
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S"),
            "student_id": request.student_id or "Manual Entry",
            "student_name": student_name or request.student_id or "Manual Entry",
            "branch": request.branch,
            "joining_year": request.joining_year,
            "semester": request.semester,
            "inputs": input_data,
            "performance": result["performance"],
            "risk_level": result["risk_level"],
            "probability": result["probability"],
        }
        history.insert(0, history_entry)
        save_prediction_history(history)
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predictions")
def get_predictions(
    search: str = "",
    branch: str = "All",
    year: str = "All",
    semester: str = "All",
    performance: str = "All"
):
    """Get prediction history with optional filters."""
    try:
        history = load_prediction_history()
        if search:
            search_lower = search.lower()
            history = [
                h for h in history
                if search_lower in str(h.get("student_id", "")).lower()
                or search_lower in str(h.get("student_name", "")).lower()
                or search_lower in str(h.get("branch", "")).lower()
            ]
        if branch and branch != "All":
            history = [
                h for h in history
                if h.get("branch") == branch or h.get("inputs", {}).get("branch") == branch
            ]
        if year and year != "All":
            history = [
                h for h in history
                if str(h.get("joining_year", h.get("inputs", {}).get("joining_year", ""))) == str(year)
            ]
        if semester and semester != "All":
            history = [
                h for h in history
                if str(h.get("semester", h.get("inputs", {}).get("semester", ""))) == str(semester)
            ]
        if performance and performance != "All":
            history = [
                h for h in history
                if str(h.get("performance", "")).lower() == performance.lower()
            ]
        return {"predictions": history, "total": len(history)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/predictions/{prediction_id}")
def delete_prediction(prediction_id: int):
    """Delete a prediction record by ID."""
    try:
        history = load_prediction_history()
        new_history = [h for h in history if h.get("id") != prediction_id]
        if len(new_history) == len(history):
            raise HTTPException(status_code=404, detail="Prediction record not found")
        save_prediction_history(new_history)
        return {"success": True, "message": "Prediction record deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/model-performance")
def model_performance():
    """Get model performance metrics."""
    try:
        metrics = get_model_metrics()
        if metrics is None:
            raise HTTPException(status_code=400, detail="Model not trained yet.")
        return metrics
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

