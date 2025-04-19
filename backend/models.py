from pydantic import BaseModel, EmailStr, constr

class UserRegistration(BaseModel):
    username: constr(min_length=3, max_length=50)
    full_name: constr(min_length=2, max_length=100)
    email: EmailStr
    company_name: constr(min_length=2, max_length=100)
    password: constr(min_length=8)

class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    email: str
    company_name: str 
    