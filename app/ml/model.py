"""
Machine Learning model for student performance prediction.
Uses Random Forest Classifier as the primary model.
"""
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
from typing import Dict, Any, Optional, Tuple

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "trained_model")
MODEL_PATH = os.path.join(MODEL_DIR, "rf_model.joblib")
ENCODERS_PATH = os.path.join(MODEL_DIR, "encoders.joblib")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.joblib")

FEATURE_COLUMNS = [
    "Attendance_Percent",
    "Internal_Marks",
    "Assignment_Score",
    "Lab_Performance",
    "Previous_Semester_Marks",
    "Backlog_Count",
    "Study_Hours_Per_Day",
    "Semester",
    "Joining_Year",
    "Branch_Encoded",
    "Previous_Performance_Encoded",
]

TARGET_COLUMN = "Semester_Performance"

_model: Optional[RandomForestClassifier] = None
_encoders: Optional[Dict] = None
_metrics: Optional[Dict] = None


def prepare_features(df: pd.DataFrame, encoders: Optional[Dict] = None, fit: bool = False) -> Tuple[pd.DataFrame, Dict]:
    """Prepare features for ML model."""
    df = df.copy()
    
    # Filter out Upcoming semesters - they don't have real data
    df = df[df["Semester_Status"] != "Upcoming"].copy()
    
    if encoders is None:
        encoders = {}
    
    # Encode Branch
    if fit or "branch_encoder" not in encoders:
        le_branch = LabelEncoder()
        df["Branch_Encoded"] = le_branch.fit_transform(df["Branch"].astype(str))
        encoders["branch_encoder"] = le_branch
    else:
        le_branch = encoders["branch_encoder"]
        # Handle unseen labels
        df["Branch_Encoded"] = df["Branch"].apply(
            lambda x: le_branch.transform([x])[0] if x in le_branch.classes_ else -1
        )
    
    # Encode Previous Performance
    df["Previous_Performance"] = df["Previous_Performance"].fillna("None").replace("", "None")
    if fit or "prev_perf_encoder" not in encoders:
        le_prev = LabelEncoder()
        df["Previous_Performance_Encoded"] = le_prev.fit_transform(df["Previous_Performance"].astype(str))
        encoders["prev_perf_encoder"] = le_prev
    else:
        le_prev = encoders["prev_perf_encoder"]
        df["Previous_Performance_Encoded"] = df["Previous_Performance"].apply(
            lambda x: le_prev.transform([x])[0] if x in le_prev.classes_ else 0
        )
    
    # Fill numeric NaN
    for col in ["Attendance_Percent", "Internal_Marks", "Assignment_Score", 
                 "Lab_Performance", "Previous_Semester_Marks", "Backlog_Count", "Study_Hours_Per_Day"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    
    # Encode target
    if fit or "target_encoder" not in encoders:
        le_target = LabelEncoder()
        le_target.fit(["Low", "Medium", "High"])  # Explicit order
        encoders["target_encoder"] = le_target
    
    return df, encoders


def train_model(df: pd.DataFrame) -> Dict[str, Any]:
    """Train the Random Forest model."""
    global _model, _encoders, _metrics
    
    os.makedirs(MODEL_DIR, exist_ok=True)
    
    # Prepare features
    df_prepared, encoders = prepare_features(df, fit=True)
    
    le_target = encoders["target_encoder"]
    
    # Build feature matrix
    X = df_prepared[FEATURE_COLUMNS].values
    y = le_target.transform(df_prepared[TARGET_COLUMN].astype(str))
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Train Random Forest
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test)
    y_pred_proba = model.predict_proba(X_test)
    
    target_names = le_target.classes_.tolist()
    
    metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, average="weighted")), 4),
        "recall": round(float(recall_score(y_test, y_pred, average="weighted")), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, average="weighted")), 4),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "target_names": target_names,
        "feature_importance": {
            FEATURE_COLUMNS[i]: round(float(v), 4)
            for i, v in enumerate(model.feature_importances_)
        },
        "classification_report": classification_report(y_test, y_pred, target_names=target_names, output_dict=True),
        "train_size": len(X_train),
        "test_size": len(X_test),
    }
    
    # Save
    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoders, ENCODERS_PATH)
    joblib.dump(metrics, METRICS_PATH)
    
    _model = model
    _encoders = encoders
    _metrics = metrics
    
    return metrics


def load_model() -> Tuple[Optional[RandomForestClassifier], Optional[Dict], Optional[Dict]]:
    """Load the trained model."""
    global _model, _encoders, _metrics
    
    if _model is not None:
        return _model, _encoders, _metrics
    
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        _model = joblib.load(MODEL_PATH)
        _encoders = joblib.load(ENCODERS_PATH)
        _metrics = joblib.load(METRICS_PATH) if os.path.exists(METRICS_PATH) else {}
        return _model, _encoders, _metrics
    
    return None, None, None


def predict_performance(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Make a prediction for a student."""
    model, encoders, _ = load_model()
    
    if model is None or encoders is None:
        raise ValueError("Model not trained. Please train the model first.")
    
    le_branch = encoders["branch_encoder"]
    le_prev = encoders["prev_perf_encoder"]
    le_target = encoders["target_encoder"]
    
    # Encode branch
    branch = input_data.get("branch", "CSE")
    if branch in le_branch.classes_:
        branch_encoded = le_branch.transform([branch])[0]
    else:
        branch_encoded = 0
    
    # Encode previous performance
    prev_perf = input_data.get("previous_performance", "None")
    if not prev_perf:
        prev_perf = "None"
    if prev_perf in le_prev.classes_:
        prev_perf_encoded = le_prev.transform([prev_perf])[0]
    else:
        prev_perf_encoded = 0
    
    # Build feature vector
    features = np.array([[
        float(input_data.get("attendance", 75)),
        float(input_data.get("internal_marks", 60)),
        float(input_data.get("assignment_score", 70)),
        float(input_data.get("lab_performance", 70)),
        float(input_data.get("previous_semester_marks", 60)),
        int(input_data.get("backlog_count", 0)),
        float(input_data.get("study_hours", 4)),
        int(input_data.get("semester", 1)),
        int(input_data.get("joining_year", 2024)),
        branch_encoded,
        prev_perf_encoded,
    ]])
    
    # Predict
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    
    predicted_class = le_target.inverse_transform([prediction])[0]
    
    # Probability for each class
    class_probs = {}
    for i, cls in enumerate(le_target.classes_):
        class_probs[cls] = round(float(probabilities[i]) * 100, 1)
    
    max_prob = round(float(max(probabilities)) * 100, 1)
    
    # Determine risk level
    risk_level = "At-Risk" if predicted_class == "Low" else "Pass"
    risk_description = "High Risk" if predicted_class == "Low" else ("Medium Risk" if predicted_class == "Medium" else "Low Risk")
    
    # Feature importance for this prediction
    feature_importances = dict(zip(FEATURE_COLUMNS, model.feature_importances_))
    top_factors = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Attendance status
    attendance = float(input_data.get("attendance", 75))
    attendance_status = "Good" if attendance >= 75 else ("Warning" if attendance >= 60 else "Critical")
    
    # Backlog status
    backlogs = int(input_data.get("backlog_count", 0))
    backlog_status = "Clear" if backlogs == 0 else ("Warning" if backlogs <= 2 else "Critical")
    
    return {
        "performance": predicted_class,
        "risk_level": risk_level,
        "risk_description": risk_description,
        "probability": max_prob,
        "class_probabilities": class_probs,
        "top_factors": [
            {"feature": f.replace("_Encoded", "").replace("_", " "), "importance": round(float(imp) * 100, 1)}
            for f, imp in top_factors
        ],
        "attendance_status": attendance_status,
        "backlog_status": backlog_status,
        "previous_performance": prev_perf,
    }


def get_model_metrics() -> Optional[Dict[str, Any]]:
    """Get model performance metrics."""
    _, _, metrics = load_model()
    return metrics
