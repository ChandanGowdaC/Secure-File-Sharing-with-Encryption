"""Set 1 – User registration, login, MFA, public-key directory (F.1–F.4)."""

from typing import Optional

from fastapi import APIRouter, status

from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MfaVerifyRequest,
    PublicKeyLookupResponse,
    RegisterRequest,
    RegisterResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest) -> RegisterResponse:
    """F.1 – Register user and store long-term DH public key."""
    raise NotImplementedError


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    """F.2 – Authenticate credentials; MFA required before full session."""
    raise NotImplementedError


@router.post("/mfa/verify", response_model=LoginResponse)
async def verify_mfa(payload: MfaVerifyRequest) -> LoginResponse:
    """F.3 – Verify one-time MFA code and issue session token."""
    raise NotImplementedError


@router.get("/users/public-key", response_model=PublicKeyLookupResponse)
async def lookup_public_key(username: Optional[str] = None, email: Optional[str] = None) -> PublicKeyLookupResponse:
    """F.4 – Lookup receiver long-term public key by username or email."""
    raise NotImplementedError
