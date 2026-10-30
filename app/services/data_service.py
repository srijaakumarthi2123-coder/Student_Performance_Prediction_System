"""
Data service for loading and processing student performance dataset.
"""
import os
import pandas as pd
import numpy as np
from typing import Optional, Dict, Any, List

DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                            "dataset", "student_performance_complete_yearwise_correct_rollno.csv")

BRANCH_ORDER = ["CSE", "DS", "ECE", "AI", "IT", "EEE", "MECH", "CIVIL"]

VALID_BRANCHES = set(BRANCH_ORDER)
VALID_YEARS = {2023, 2024, 2025, 2026}

# Academic semester logic
SEMESTER_MAP = {
    2023: {"completed": [1,2,3,4,5,6], "current": 7, "upcoming": [8]},
    2024: {"completed": [1,2,3,4], "current": 5, "upcoming": [6]},
    2025: {"completed": [1,2], "current": 3, "upcoming": [4]},
    2026: {"completed": [], "current": 1, "upcoming": [2]},
}

REQUIRED_COLUMNS = [
    "Student_ID", "Student_Name", "Joining_Year", "Branch", "Semester",
    "Semester_Status", "Age", "Attendance_Percent", "Internal_Marks",
    "Assignment_Score", "Lab_Performance", "Previous_Semester_Marks",
    "Previous_Performance", "Backlog_Count", "Study_Hours_Per_Day",
    "Semester_Performance", "Pass_At_Risk"
]

_df: Optional[pd.DataFrame] = None


def load_dataset(path: Optional[str] = None) -> pd.DataFrame:
    """Load the student performance dataset."""
    global _df
    file_path = path or DATASET_PATH
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset not found at {file_path}")
    
    df = pd.read_csv(file_path)
    
    # Clean up data types
    df["Joining_Year"] = df["Joining_Year"].astype(int)
    df["Semester"] = df["Semester"].astype(int)
    df["Age"] = pd.to_numeric(df["Age"], errors="coerce").fillna(18).astype(int)
    df["Attendance_Percent"] = pd.to_numeric(df["Attendance_Percent"], errors="coerce").fillna(0)
    df["Internal_Marks"] = pd.to_numeric(df["Internal_Marks"], errors="coerce").fillna(0)
    df["Assignment_Score"] = pd.to_numeric(df["Assignment_Score"], errors="coerce").fillna(0)
    df["Lab_Performance"] = pd.to_numeric(df["Lab_Performance"], errors="coerce").fillna(0)
    df["Previous_Semester_Marks"] = pd.to_numeric(df["Previous_Semester_Marks"], errors="coerce").fillna(0)
    df["Backlog_Count"] = pd.to_numeric(df["Backlog_Count"], errors="coerce").fillna(0).astype(int)
    df["Study_Hours_Per_Day"] = pd.to_numeric(df["Study_Hours_Per_Day"], errors="coerce").fillna(0)
    
    # Fill missing categorical values
    df["Semester_Performance"] = df["Semester_Performance"].fillna("Medium")
    df["Pass_At_Risk"] = df["Pass_At_Risk"].fillna("Pass")
    df["Previous_Performance"] = df["Previous_Performance"].fillna("")
    df["Semester_Status"] = df["Semester_Status"].fillna("Completed")
    df["Gender"] = df["Gender"].fillna("Unknown")
    
    _df = df
    return df


def get_dataset() -> pd.DataFrame:
    """Get the current dataset, loading if necessary."""
    global _df
    if _df is None:
        _df = load_dataset()
    return _df


def reload_dataset(path: Optional[str] = None) -> pd.DataFrame:
    """Force reload the dataset."""
    global _df
    _df = None
    return load_dataset(path)


def validate_csv(file_path: str) -> Dict[str, Any]:
    """Validate a CSV file for required columns."""
    try:
        df = pd.read_csv(file_path)
        columns = list(df.columns)
        missing = [col for col in REQUIRED_COLUMNS if col not in columns]
        extra = [col for col in columns if col not in REQUIRED_COLUMNS and col not in ["Department", "Extracurricular"]]
        
        return {
            "valid": len(missing) == 0,
            "total_columns": len(columns),
            "columns": columns,
            "missing_columns": missing,
            "extra_columns": extra,
            "total_rows": len(df),
            "unique_students": df["Student_ID"].nunique() if "Student_ID" in columns else 0,
            "branches": sorted(df["Branch"].unique().tolist()) if "Branch" in columns else [],
            "joining_years": sorted(df["Joining_Year"].unique().tolist()) if "Joining_Year" in columns else [],
            "missing_values": {col: int(df[col].isna().sum()) for col in columns if df[col].isna().sum() > 0},
        }
    except Exception as e:
        return {"valid": False, "error": str(e)}


def get_unique_students() -> pd.DataFrame:
    """Get unique students (current active semester record for each)."""
    df = get_dataset()
    current_mask = df["Semester_Status"] == "Current"
    if current_mask.any():
        idx = df[current_mask].groupby("Student_ID")["Semester"].idxmax()
        missing_ids = set(df["Student_ID"]) - set(df.loc[idx, "Student_ID"])
        if missing_ids:
            other_idx = df[df["Student_ID"].isin(missing_ids)].groupby("Student_ID")["Semester"].idxmax()
            all_idx = pd.concat([idx, other_idx])
            return df.loc[all_idx].reset_index(drop=True)
        return df.loc[idx].reset_index(drop=True)
    
    idx = df.groupby("Student_ID")["Semester"].idxmax()
    return df.loc[idx].reset_index(drop=True)


def calculate_student_cgpa(student_id: str, df: pd.DataFrame) -> float:
    """Calculate actual CGPA for a student across completed and current semesters."""
    st_rows = df[(df["Student_ID"] == student_id) & (df["Semester_Status"].isin(["Completed", "Current"]))]
    if st_rows.empty:
        st_rows = df[df["Student_ID"] == student_id]
    
    sgpas = []
    for _, row in st_rows.iterrows():
        score = (float(row["Internal_Marks"]) + float(row["Assignment_Score"]) + float(row["Lab_Performance"])) / 3.0
        if pd.notna(row["Previous_Semester_Marks"]) and float(row["Previous_Semester_Marks"]) > 0:
            score = (score + float(row["Previous_Semester_Marks"])) / 2.0
        sgpas.append(score / 10.0)
    
    if not sgpas:
        return 7.5
    
    cgpa = round(float(np.mean(sgpas)), 2)
    return float(max(1.0, min(10.0, cgpa)))


def get_student_by_id(student_id: str) -> Optional[Dict[str, Any]]:
    """Get a student's complete profile."""
    df = get_dataset()
    student_records = df[df["Student_ID"] == student_id].sort_values("Semester")
    
    if student_records.empty:
        return None
    
    # Pick the Current semester record if present, otherwise latest completed
    current_recs = student_records[student_records["Semester_Status"] == "Current"]
    if not current_recs.empty:
        current_rec = current_recs.iloc[0]
    else:
        completed_recs = student_records[student_records["Semester_Status"] == "Completed"]
        if not completed_recs.empty:
            current_rec = completed_recs.iloc[-1]
        else:
            current_rec = student_records.iloc[-1]
            
    latest = current_rec
    
    # Calculate overall CGPA
    overall_cgpa = calculate_student_cgpa(student_id, df)
    
    # Build semester history
    semester_history = []
    joining_year = int(latest["Joining_Year"])
    sem_info = SEMESTER_MAP.get(joining_year, {})
    
    for _, row in student_records.iterrows():
        status = row["Semester_Status"]
        if status in ["Completed", "Current"]:
            sem_score = (float(row["Internal_Marks"]) + float(row["Assignment_Score"]) + float(row["Lab_Performance"])) / 3.0
            if pd.notna(row["Previous_Semester_Marks"]) and float(row["Previous_Semester_Marks"]) > 0:
                sem_score = (sem_score + float(row["Previous_Semester_Marks"])) / 2.0
            sem_cgpa = float(max(1.0, min(10.0, round(sem_score / 10.0, 2))))
        else:
            sem_cgpa = None

        semester_history.append({
            "semester": int(row["Semester"]),
            "status": status,
            "cgpa": sem_cgpa,
            "attendance": round(float(row["Attendance_Percent"]), 1),
            "internal_marks": round(float(row["Internal_Marks"]), 1),
            "assignment_score": round(float(row["Assignment_Score"]), 1),
            "lab_performance": round(float(row["Lab_Performance"]), 1),
            "previous_semester_marks": round(float(row["Previous_Semester_Marks"]), 1) if pd.notna(row["Previous_Semester_Marks"]) else None,
            "backlog_count": int(row["Backlog_Count"]),
            "study_hours": round(float(row["Study_Hours_Per_Day"]), 1),
            "performance": row["Semester_Performance"],
            "risk": row["Pass_At_Risk"],
        })
    
    # Add upcoming semesters
    existing_semesters = set(int(row["Semester"]) for _, row in student_records.iterrows())
    upcoming_sems = sem_info.get("upcoming", [])
    for sem in upcoming_sems:
        if sem not in existing_semesters:
            semester_history.append({
                "semester": sem,
                "status": "Upcoming",
                "cgpa": None,
                "attendance": None,
                "internal_marks": None,
                "assignment_score": None,
                "lab_performance": None,
                "previous_semester_marks": None,
                "backlog_count": None,
                "study_hours": None,
                "performance": None,
                "risk": None,
            })
    
    return {
        "student_id": latest["Student_ID"],
        "student_name": latest["Student_Name"],
        "joining_year": int(latest["Joining_Year"]),
        "branch": latest["Branch"],
        "department": latest.get("Department", ""),
        "gender": latest["Gender"],
        "age": int(latest["Age"]),
        "current_semester": int(latest["Semester"]),
        "semester_status": latest["Semester_Status"],
        "cgpa": overall_cgpa,
        "attendance": round(float(latest["Attendance_Percent"]), 1),
        "internal_marks": round(float(latest["Internal_Marks"]), 1),
        "assignment_score": round(float(latest["Assignment_Score"]), 1),
        "lab_performance": round(float(latest["Lab_Performance"]), 1),
        "previous_semester_marks": round(float(latest["Previous_Semester_Marks"]), 1) if pd.notna(latest["Previous_Semester_Marks"]) else None,
        "previous_performance": latest["Previous_Performance"] if pd.notna(latest["Previous_Performance"]) else "",
        "backlog_count": int(latest["Backlog_Count"]),
        "study_hours": round(float(latest["Study_Hours_Per_Day"]), 1),
        "current_performance": latest["Semester_Performance"],
        "pass_at_risk": latest["Pass_At_Risk"],
        "extracurricular": latest.get("Extracurricular", "No"),
        "semester_history": semester_history,
    }


def get_dashboard_stats() -> Dict[str, Any]:
    """Get dashboard statistics calculated from the dataset."""
    df = get_dataset()
    unique = get_unique_students()
    total = len(unique)
    
    # Branch-wise counts
    branch_counts = {}
    for branch in BRANCH_ORDER:
        count = len(unique[unique["Branch"] == branch])
        branch_counts[branch] = count
    
    # Year-wise counts
    year_counts = {}
    for year in sorted(df["Joining_Year"].unique()):
        year_counts[str(year)] = len(unique[unique["Joining_Year"] == year])
    
    # Performance distribution
    perf_dist = unique["Semester_Performance"].value_counts().to_dict()
    
    # Risk distribution
    risk_dist = unique["Pass_At_Risk"].value_counts().to_dict()
    at_risk = risk_dist.get("At-Risk", 0)
    
    # Students per current semester
    semester_dist = {}
    for sem in range(1, 9):
        semester_dist[str(sem)] = len(unique[unique["Semester"] == sem])
    
    # Branch-wise risk
    branch_risk = {}
    for branch in BRANCH_ORDER:
        branch_data = unique[unique["Branch"] == branch]
        branch_risk[branch] = {
            "pass": len(branch_data[branch_data["Pass_At_Risk"] == "Pass"]),
            "at_risk": len(branch_data[branch_data["Pass_At_Risk"] == "At-Risk"]),
        }
    
    # Other branches count (IT, EEE, MECH, CIVIL)
    other_branches = sum(branch_counts.get(b, 0) for b in ["IT", "EEE", "MECH", "CIVIL"])
    
    # Attendance vs Performance scatter data
    scatter_data = []
    sample = unique.sample(min(200, len(unique)), random_state=42)
    for _, row in sample.iterrows():
        scatter_data.append({
            "attendance": round(float(row["Attendance_Percent"]), 1),
            "marks": round(float(row["Internal_Marks"]), 1),
            "performance": row["Semester_Performance"],
        })
    
    return {
        "total_students": total,
        "branch_counts": branch_counts,
        "cse_students": branch_counts.get("CSE", 0),
        "ds_students": branch_counts.get("DS", 0),
        "ece_students": branch_counts.get("ECE", 0),
        "ai_students": branch_counts.get("AI", 0),
        "other_branches": other_branches,
        "year_counts": year_counts,
        "performance_distribution": perf_dist,
        "risk_distribution": risk_dist,
        "at_risk_students": at_risk,
        "current_students": len(unique[unique["Semester_Status"] == "Current"]),
        "semester_distribution": semester_dist,
        "branch_risk": branch_risk,
        "scatter_data": scatter_data,
    }


def get_students_list(
    search: str = "",
    branch: str = "",
    joining_year: str = "",
    semester: str = "",
    status: str = "",
    performance: str = "",
    risk: str = "",
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    """Get paginated student list with filters."""
    unique = get_unique_students()
    
    # Apply filters
    if search:
        search_lower = search.lower()
        unique = unique[
            unique["Student_ID"].str.lower().str.contains(search_lower) |
            unique["Student_Name"].str.lower().str.contains(search_lower) |
            unique["Branch"].str.lower().str.contains(search_lower)
        ]
    
    if branch and branch != "All":
        unique = unique[unique["Branch"] == branch]
    
    if joining_year and joining_year != "All":
        unique = unique[unique["Joining_Year"] == int(joining_year)]
    
    if semester and semester != "All":
        unique = unique[unique["Semester"] == int(semester)]
    
    if status and status != "All":
        unique = unique[unique["Semester_Status"] == status]
    
    if performance and performance != "All":
        unique = unique[unique["Semester_Performance"] == performance]
    
    if risk and risk != "All":
        unique = unique[unique["Pass_At_Risk"] == risk]
    
    total = len(unique)
    total_pages = max(1, (total + page_size - 1) // page_size)
    page = max(1, min(page, total_pages))
    
    start = (page - 1) * page_size
    end = start + page_size
    page_data = unique.iloc[start:end]
    
    df_full = get_dataset()
    students = []
    for i, (_, row) in enumerate(page_data.iterrows()):
        sid = row["Student_ID"]
        cgpa = calculate_student_cgpa(sid, df_full)

        students.append({
            "sno": start + i + 1,
            "student_id": row["Student_ID"],
            "student_name": row["Student_Name"],
            "branch": row["Branch"],
            "joining_year": int(row["Joining_Year"]),
            "current_semester": int(row["Semester"]),
            "semester": int(row["Semester"]),
            "cgpa": cgpa,
            "age": int(row["Age"]),
            "attendance": round(float(row["Attendance_Percent"]), 1),
            "performance": str(row["Semester_Performance"]) if pd.notna(row["Semester_Performance"]) and str(row["Semester_Performance"]).strip() else "Medium",
            "risk": str(row["Pass_At_Risk"]) if pd.notna(row["Pass_At_Risk"]) and str(row["Pass_At_Risk"]).strip() else "Pass",
        })
    
    return {
        "students": students,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


def get_analytics(branch: str = "", joining_year: str = "", semester: str = "") -> Dict[str, Any]:
    """Get analytics data."""
    df = get_dataset()
    unique = get_unique_students()
    
    # Apply filters
    if branch and branch != "All":
        unique = unique[unique["Branch"] == branch]
        df = df[df["Branch"] == branch]
    if joining_year and joining_year != "All":
        unique = unique[unique["Joining_Year"] == int(joining_year)]
        df = df[df["Joining_Year"] == int(joining_year)]
    if semester and semester != "All":
        unique = unique[unique["Semester"] == int(semester)]
        df = df[df["Semester"] == int(semester)]
    
    # Branch performance
    branch_perf = {}
    for b in BRANCH_ORDER:
        bdata = unique[unique["Branch"] == b]
        if len(bdata) > 0:
            branch_perf[b] = {
                "avg_attendance": round(float(bdata["Attendance_Percent"].mean()), 1),
                "avg_internal": round(float(bdata["Internal_Marks"].mean()), 1),
                "avg_assignment": round(float(bdata["Assignment_Score"].mean()), 1),
                "avg_lab": round(float(bdata["Lab_Performance"].mean()), 1),
                "high": len(bdata[bdata["Semester_Performance"] == "High"]),
                "medium": len(bdata[bdata["Semester_Performance"] == "Medium"]),
                "low": len(bdata[bdata["Semester_Performance"] == "Low"]),
                "at_risk": len(bdata[bdata["Pass_At_Risk"] == "At-Risk"]),
                "total": len(bdata),
            }
    
    # Year-wise performance
    year_perf = {}
    for y in sorted(unique["Joining_Year"].unique()):
        ydata = unique[unique["Joining_Year"] == y]
        year_perf[str(y)] = {
            "avg_attendance": round(float(ydata["Attendance_Percent"].mean()), 1),
            "avg_internal": round(float(ydata["Internal_Marks"].mean()), 1),
            "high": len(ydata[ydata["Semester_Performance"] == "High"]),
            "medium": len(ydata[ydata["Semester_Performance"] == "Medium"]),
            "low": len(ydata[ydata["Semester_Performance"] == "Low"]),
            "total": len(ydata),
        }
    
    # Semester-wise performance
    semester_perf = {}
    all_semesters = sorted(df["Semester"].unique())
    for s in all_semesters:
        sdata = df[df["Semester"] == s]
        semester_perf[str(s)] = {
            "avg_attendance": round(float(sdata["Attendance_Percent"].mean()), 1),
            "avg_internal": round(float(sdata["Internal_Marks"].mean()), 1),
            "high": len(sdata[sdata["Semester_Performance"] == "High"]),
            "medium": len(sdata[sdata["Semester_Performance"] == "Medium"]),
            "low": len(sdata[sdata["Semester_Performance"] == "Low"]),
            "total": len(sdata),
        }
    
    # Backlog analysis
    backlog_dist = unique["Backlog_Count"].value_counts().sort_index().to_dict()
    backlog_dist = {str(k): int(v) for k, v in backlog_dist.items()}
    
    # Study hours analysis
    bins = [0, 2, 4, 6, 8, 10, 24]
    labels = ["0-2", "2-4", "4-6", "6-8", "8-10", "10+"]
    study_hours_dist = pd.cut(unique["Study_Hours_Per_Day"], bins=bins, labels=labels, right=False).value_counts().sort_index().to_dict()
    study_hours_dist = {str(k): int(v) for k, v in study_hours_dist.items()}
    
    # Attendance analysis by performance
    attendance_by_perf = {}
    for perf in ["High", "Medium", "Low"]:
        pdata = unique[unique["Semester_Performance"] == perf]
        if len(pdata) > 0:
            attendance_by_perf[perf] = round(float(pdata["Attendance_Percent"].mean()), 1)
    
    return {
        "branch_performance": branch_perf,
        "year_performance": year_perf,
        "semester_performance": semester_perf,
        "backlog_distribution": backlog_dist,
        "study_hours_distribution": study_hours_dist,
        "attendance_by_performance": attendance_by_perf,
        "performance_distribution": unique["Semester_Performance"].value_counts().to_dict(),
        "risk_distribution": unique["Pass_At_Risk"].value_counts().to_dict(),
        "total_students": len(unique),
    }


def get_risk_analysis(branch: str = "", joining_year: str = "", semester: str = "") -> Dict[str, Any]:
    """Get risk analysis data."""
    unique = get_unique_students()
    
    if branch and branch != "All":
        unique = unique[unique["Branch"] == branch]
    if joining_year and joining_year != "All":
        unique = unique[unique["Joining_Year"] == int(joining_year)]
    if semester and semester != "All":
        unique = unique[unique["Semester"] == int(semester)]
    
    at_risk = unique[unique["Pass_At_Risk"] == "At-Risk"]
    on_track = unique[unique["Pass_At_Risk"] == "Pass"]
    
    # Risk by branch
    risk_by_branch = {}
    for b in BRANCH_ORDER:
        bdata = unique[unique["Branch"] == b]
        risk_by_branch[b] = {
            "total": len(bdata),
            "at_risk": len(bdata[bdata["Pass_At_Risk"] == "At-Risk"]),
            "pass": len(bdata[bdata["Pass_At_Risk"] == "Pass"]),
        }
    
    # Risk by semester
    risk_by_semester = {}
    for s in sorted(unique["Semester"].unique()):
        sdata = unique[unique["Semester"] == s]
        risk_by_semester[str(s)] = {
            "total": len(sdata),
            "at_risk": len(sdata[sdata["Pass_At_Risk"] == "At-Risk"]),
            "pass": len(sdata[sdata["Pass_At_Risk"] == "Pass"]),
        }
    
    # Risk by year
    risk_by_year = {}
    for y in sorted(unique["Joining_Year"].unique()):
        ydata = unique[unique["Joining_Year"] == y]
        risk_by_year[str(y)] = {
            "total": len(ydata),
            "at_risk": len(ydata[ydata["Pass_At_Risk"] == "At-Risk"]),
            "pass": len(ydata[ydata["Pass_At_Risk"] == "Pass"]),
        }
    
    # At-risk students table
    risk_students = []
    for i, (_, row) in enumerate(at_risk.iterrows()):
        risk_students.append({
            "sno": i + 1,
            "student_id": row["Student_ID"],
            "student_name": row["Student_Name"],
            "branch": row["Branch"],
            "semester": int(row["Semester"]),
            "attendance": round(float(row["Attendance_Percent"]), 1),
            "backlogs": int(row["Backlog_Count"]),
            "performance": row["Semester_Performance"],
            "risk": row["Pass_At_Risk"],
        })
    
    return {
        "total_at_risk": len(at_risk),
        "total_on_track": len(on_track),
        "total": len(unique),
        "risk_by_branch": risk_by_branch,
        "risk_by_semester": risk_by_semester,
        "risk_by_year": risk_by_year,
        "risk_students": risk_students,
    }


def get_dataset_info() -> Dict[str, Any]:
    """Get dataset metadata."""
    df = get_dataset()
    return {
        "total_records": len(df),
        "unique_students": df["Student_ID"].nunique(),
        "columns": list(df.columns),
        "branches": sorted(df["Branch"].unique().tolist()),
        "joining_years": sorted(df["Joining_Year"].unique().tolist()),
        "semesters": sorted(df["Semester"].unique().tolist()),
        "missing_values": {col: int(df[col].isna().sum()) for col in df.columns if df[col].isna().sum() > 0},
        "data_types": {col: str(df[col].dtype) for col in df.columns},
    }


def get_dataset_preview(page: int = 1, page_size: int = 50, search: str = "") -> Dict[str, Any]:
    """Get a paginated preview of the raw dataset."""
    df = get_dataset()
    
    if search:
        search_lower = search.lower()
        mask = df.apply(lambda row: any(search_lower in str(v).lower() for v in row), axis=1)
        df = df[mask]
    
    total = len(df)
    total_pages = max(1, (total + page_size - 1) // page_size)
    page = max(1, min(page, total_pages))
    start = (page - 1) * page_size
    end = start + page_size
    
    records = df.iloc[start:end].to_dict("records")
    # Convert numpy types
    clean_records = []
    for r in records:
        clean = {}
        for k, v in r.items():
            if pd.isna(v):
                clean[k] = None
            elif isinstance(v, (np.integer,)):
                clean[k] = int(v)
            elif isinstance(v, (np.floating,)):
                clean[k] = round(float(v), 2)
            else:
                clean[k] = v
        clean_records.append(clean)
    
    return {
        "records": clean_records,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "columns": list(get_dataset().columns),
    }


def get_student_performance_trend(student_id: str) -> List[Dict[str, Any]]:
    """Get semester-wise performance trend for a student."""
    df = get_dataset()
    student_data = df[df["Student_ID"] == student_id].sort_values("Semester")
    
    trend = []
    for _, row in student_data.iterrows():
        if row["Semester_Status"] != "Upcoming":
            trend.append({
                "semester": int(row["Semester"]),
                "attendance": round(float(row["Attendance_Percent"]), 1),
                "internal_marks": round(float(row["Internal_Marks"]), 1),
                "assignment_score": round(float(row["Assignment_Score"]), 1),
                "lab_performance": round(float(row["Lab_Performance"]), 1),
                "performance": row["Semester_Performance"],
                "risk": row["Pass_At_Risk"],
            })
    
    return trend


def add_student(student_data: Dict[str, Any]) -> Dict[str, Any]:
    """Add a new student to the dataset."""
    df = get_dataset()
    sid = str(student_data.get("student_id", "")).strip().upper()
    name = str(student_data.get("student_name", "")).strip()
    branch = str(student_data.get("branch", "CSE")).strip()
    joining_year = int(student_data.get("joining_year", 2024))
    gender = str(student_data.get("gender", "Male")).strip()
    curr_sem = int(student_data.get("current_semester", 5))
    attendance = float(student_data.get("attendance", 85.0))
    internal_marks = float(student_data.get("internal_marks", 75.0))
    assignment_score = float(student_data.get("assignment_score", 80.0))
    lab_performance = float(student_data.get("lab_performance", 80.0))
    prev_marks = float(student_data.get("previous_semester_marks", 75.0))
    backlog_count = int(student_data.get("backlog_count", 0))
    study_hours = float(student_data.get("study_hours", 4.0))
    extracurricular = str(student_data.get("extracurricular", "No"))
    
    if not sid:
        raise ValueError("Roll Number / Student ID is required.")
    if not name:
        raise ValueError("Student Name is required.")
        
    if sid in df["Student_ID"].values:
        raise ValueError(f"Student ID '{sid}' already exists.")
        
    avg_score = (attendance + internal_marks + assignment_score + lab_performance) / 4.0
    if avg_score >= 80 and backlog_count == 0:
        performance = "High"
        risk = "Pass"
    elif avg_score >= 60 and backlog_count <= 1:
        performance = "Medium"
        risk = "Pass"
    else:
        performance = "Low"
        risk = "At-Risk"
        
    dept_map = {
        "CSE": "Computer Science & Engineering",
        "DS": "Data Science",
        "ECE": "Electronics & Communication Engineering",
        "AI": "Artificial Intelligence & Machine Learning",
        "IT": "Information Technology",
        "EEE": "Electrical & Electronics Engineering",
        "MECH": "Mechanical Engineering",
        "CIVIL": "Civil Engineering"
    }
    department = dept_map.get(branch, f"{branch} Department")
    age = 17 + (curr_sem // 2)
    
    new_rows = []
    for sem in range(1, curr_sem + 1):
        status = "Current" if sem == curr_sem else "Completed"
        new_rows.append({
            "Student_ID": sid,
            "Student_Name": name,
            "Joining_Year": joining_year,
            "Department": department,
            "Branch": branch,
            "Gender": gender,
            "Semester": sem,
            "Semester_Status": status,
            "Age": age,
            "Attendance_Percent": attendance if sem == curr_sem else round(attendance * (0.96 ** (curr_sem - sem)), 1),
            "Internal_Marks": internal_marks if sem == curr_sem else round(internal_marks * (0.97 ** (curr_sem - sem)), 1),
            "Assignment_Score": assignment_score,
            "Lab_Performance": lab_performance,
            "Previous_Semester_Marks": prev_marks if sem > 1 else np.nan,
            "Previous_Performance": performance if sem > 1 else "",
            "Backlog_Count": backlog_count,
            "Study_Hours_Per_Day": study_hours,
            "Extracurricular": extracurricular,
            "Semester_Performance": performance,
            "Pass_At_Risk": risk
        })
        
    new_df = pd.DataFrame(new_rows)
    updated_df = pd.concat([df, new_df], ignore_index=True)
    
    updated_df.to_csv(DATASET_PATH, index=False)
    reload_dataset()
    
    return {
        "student_id": sid,
        "student_name": name,
        "branch": branch,
        "joining_year": joining_year,
        "current_semester": curr_sem,
        "performance": performance,
        "risk": risk
    }
