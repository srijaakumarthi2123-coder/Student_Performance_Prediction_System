"""
API routes for authentication.
"""
from fastapi import APIRouter, HTTPException
from ..models.schemas import LoginRequest, LoginResponse

router = APIRouter(prefix="/api", tags=["auth"])

# Simple admin credentials for demonstration
ADMIN_CREDENTIALS = {
    "admin": "admin123",
    "admin@spp.edu": "admin123",
}


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """Authenticate admin user."""
    username = request.username.strip()
    password = request.password.strip()
    
    if username in ADMIN_CREDENTIALS and ADMIN_CREDENTIALS[username] == password:
        return LoginResponse(
            success=True,
            message="Login successful",
            token="spp-admin-token-2024",
            user={
                "username": username,
                "role": "admin",
                "name": "Administrator",
            }
        )
    
    raise HTTPException(
        status_code=401,
        detail="Invalid username or password"
    )


@router.post("/logout")
def logout():
    """Logout."""
    return {"success": True, "message": "Logged out successfully"}
