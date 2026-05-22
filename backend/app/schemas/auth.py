from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional

class OrganizationRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str
    organization_code: str = Field(..., min_length=3, max_length=50)
    name: Optional[str] = None
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        if 'password' in values and v != values['password']:
            raise ValueError('passwords do not match')
        return v
    
    @validator('organization_code')
    def code_uppercase(cls, v):
        return v.upper()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_type: str  # "organization" or "user"
    email: str
    organization_code: Optional[str] = None

class TokenData(BaseModel):
    email: str
    user_type: str
    user_id: int
    organization_id: Optional[int] = None