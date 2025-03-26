from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from pydantic import BaseModel, EmailStr, validator

from app.database.database import get_db
from app.models.models import User
from app.auth.auth import get_password_hash, get_current_active_user

router = APIRouter()

# Pydantic models for validation
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None
    
    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    @validator('username')
    def username_format(cls, v):
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if not all(c.isalnum() or c in '._-' for c in v):
            raise ValueError('Username must contain only alphanumeric characters')
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    is_active: bool
    
    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    
    @validator('password')
    def password_strength(cls, v):
        if v is not None and len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if username already exists
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user profile"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user(user_data: UserUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    """Update current user's profile"""
    # Update email if provided and not already taken
    if user_data.email and user_data.email != current_user.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = user_data.email
    
    # Update full name if provided
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
    
    # Update password if provided
    if user_data.password:
        current_user.hashed_password = get_password_hash(user_data.password)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user
