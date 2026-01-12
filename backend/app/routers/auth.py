from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from typing import Optional
import os
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests

from app.auth_utils import (
    Token, User, UserInDB, verify_password, get_password_hash,
    create_access_token, get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES,
    load_db, save_db, get_user
)

router = APIRouter(tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Ensure at least one user exists for testing
fake_db = load_db()
if not fake_db:
    # default admin/admin
    default_user = UserInDB(
        username="admin",
        email="admin@example.com",
        full_name="Admin User",
        hashed_password=get_password_hash("admin"),
        disabled=False
    )
    fake_db["admin"] = default_user.dict()
    save_db(fake_db)

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    db = load_db()
    user = get_user(db, form_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None

@router.post("/register", response_model=User)
async def register_user(user: UserCreate):
    db = load_db()
    if user.username in db:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    user_in_db = UserInDB(
        **user.dict(),
        hashed_password=hashed_password,
        disabled=False
    )
    
    db[user.username] = user_in_db.dict()
    save_db(db)
    
    # Create user directory for dashboard config
    user_dir = os.path.join("users", user.username)
    os.makedirs(user_dir, exist_ok=True)
    
    return user_in_db

class GoogleToken(BaseModel):
    token: str

@router.post("/google-token", response_model=Token)
async def google_login(google_token: GoogleToken):
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(
            google_token.token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        email = idinfo['email']
        name = idinfo.get('name', '')
        
        # User ID from Google (sub) or just email as username?
        # Let's use email as username for simplicity or create a derived username
        username = email # Simple strategy
        
        db = load_db()
        
        # Check if user exists
        user = get_user(db, username)
        
        if not user:
            # Create user automatically
            # We don't have a password, so we set a random/unusable one or handle it.
            # Here we set a long random string that user won't know, forcing Google Login
            import secrets
            random_password = secrets.token_urlsafe(16)
            hashed_password = get_password_hash(random_password)
            
            user_in_db = UserInDB(
                username=username,
                email=email,
                full_name=name,
                hashed_password=hashed_password,
                disabled=False
            )
            
            db[username] = user_in_db.dict()
            save_db(db)
            
            # Create user directory
            user_dir = os.path.join("users", username)
            os.makedirs(user_dir, exist_ok=True)
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}
        
    except ValueError as e:
        # Invalid token
        raise HTTPException(status_code=400, detail=f"Invalid Google Token: {str(e)}")
