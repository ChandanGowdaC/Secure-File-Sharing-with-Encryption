from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=8)
    long_term_public_key: str = Field(..., description="Base64-encoded DH public key (client-generated)")


class RegisterResponse(BaseModel):
    message: str
    username: str


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class LoginResponse(BaseModel):
    mfa_required: bool
    session_token: Optional[str] = None
    message: str


class MfaVerifyRequest(BaseModel):
    username_or_email: str
    code: str = Field(..., min_length=6, max_length=6)


class PublicKeyLookupResponse(BaseModel):
    found: bool
    username: Optional[str] = None
    public_key: Optional[str] = None
    message: Optional[str] = None
