from pydantic import BaseModel, EmailStr
from pydantic.types import constr
from typing import Annotated, Optional
from datetime import datetime
import uuid

# Company Models
class CompanyRegistration(BaseModel):
    name: Annotated[str, constr(min_length=2, max_length=255)]
    email: EmailStr
    password: Annotated[str, constr(min_length=8)]
    registered_address: Optional[str] = None

class CompanyResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    registered_address: Optional[str]
    created_at: datetime
    updated_at: datetime

# User Models
class UserRegistration(BaseModel):
    full_name: Annotated[str, constr(min_length=2, max_length=255)]
    email: EmailStr
    company_id: uuid.UUID
    password: Annotated[str, constr(min_length=8)]

class UserResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    company_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# User Login Model
class UserLogin(BaseModel):
    email: EmailStr
    password: str
class LoginLogRegistration(BaseModel):
    user_id: uuid.UUID
class LoginLogResponse(BaseModel):
    id: int
    user_id: uuid.UUID
    login_time: datetime

# Document Models
class DocumentMetadata(BaseModel):
    id: str  # Format: INV-XXXX-XXXX
    name: str
    original_filename: str
    file_hash: str
    file_path: str
    user_id: uuid.UUID
    user_email: str
    user_name: Optional[str] = None
    timestamp: datetime
    status: str = "active"
    size: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    name: str
    file_hash: str
    user_id: uuid.UUID
    timestamp: str
    status: str
    size: Optional[str] = None
