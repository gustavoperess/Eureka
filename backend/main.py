from fastapi import FastAPI, Depends, HTTPException
from auth import verify_token
from supabase import create_client, Client
from models import UserRegistration, UserResponse
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

app = FastAPI()

# Initialize Supabase client with error handling
try:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Missing Supabase credentials in environment variables")
        
    supabase: Client = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"Error initializing Supabase client: {e}")
    raise

# Initialize password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.get("/")
def read_root():
    return {"message": "FastAPI backend is up!"}

@app.get("/protected")
def protected_route(user=Depends(verify_token)):
    return {"message": "You are authenticated!", "user": user}

@app.post("/register", response_model=UserResponse)
async def register_user(user_data: UserRegistration):
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        # Hash the password
        hashed_password = pwd_context.hash(user_data.password)
        
        # Store additional user data in Supabase database
        data = {
            "id": auth_response.user.id,
            "username": user_data.username,
            "full_name": user_data.full_name,
            "email": user_data.email,
            "company_name": user_data.company_name,
            "password_hash": hashed_password
        }
        
        # Insert user data into the 'users' table
        result = supabase.table("users").insert(data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create user record")
        
        # Return user data without the password hash
        return UserResponse(
            id=data["id"],
            username=data["username"],
            full_name=data["full_name"],
            email=data["email"],
            company_name=data["company_name"]
        )
        
    except Exception as e:
        print(f"Error in register_user: {str(e)}")  # Add logging
        raise HTTPException(status_code=400, detail=str(e))
