"""
Student Performance Prediction System - FastAPI Backend
Main application entry point.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import students, dashboard, analytics, prediction, dataset, auth, reports
from .services.data_service import load_dataset
from .ml.model import train_model, load_model

app = FastAPI(
    title="Student Performance Prediction System",
    description="Analyze • Predict • Improve",
    version="1.0.0",
)

# CORS - allow frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(students.router)
app.include_router(analytics.router)
app.include_router(prediction.router)
app.include_router(dataset.router)
app.include_router(reports.router)


@app.on_event("startup")
async def startup_event():
    """Load dataset and train model on startup."""
    print("[INFO] Loading dataset...")
    df = load_dataset()
    print(f"[OK] Dataset loaded: {len(df)} records, {df['Student_ID'].nunique()} unique students")
    
    # Check if model exists, if not train
    model, _, _ = load_model()
    if model is None:
        print("[INFO] Training ML model...")
        metrics = train_model(df)
        print(f"[OK] Model trained - Accuracy: {metrics['accuracy']:.2%}")
    else:
        print("[OK] ML model loaded from disk")


@app.get("/")
def root():
    return {
        "message": "Student Performance Prediction System API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/api/train-model")
def retrain_model():
    """Retrain the ML model."""
    try:
        df = load_dataset()
        metrics = train_model(df)
        return {"success": True, "metrics": metrics}
    except Exception as e:
        return {"success": False, "error": str(e)}
