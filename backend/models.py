from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime
import uuid

# users model
class UserRegistration(BaseModel):
    full_name: constr(min_length=2, max_length=100)
    email: EmailStr
    company_id: UUID
    password: constr(min_length=8)

class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    company_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# companies model
class CompanyRegistration(BaseModel):
    name: str
    email: EmailStr
    registered_address: Optional[str] = None
    password: str 

class CompanyResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# login_log model
class LoginLogResponse(BaseModel):
    id: int
    user_id: uuid.UUID
    login_time: datetime