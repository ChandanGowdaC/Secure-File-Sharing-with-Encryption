"""Set 1 – User registration, login, MFA, public-key directory (F.1–F.4)."""

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MfaVerifyRequest,
    PublicKeyLookupResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.services.auth import (
    login_user,
    lookup_public_key as lookup_public_key_service,
    register_user,
    verify_mfa as verify_mfa_service,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> RegisterResponse:
    """F.1 – Register user and store long-term DH public key."""
    return register_user(db, payload)


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> LoginResponse:
    """F.2 – Authenticate credentials; MFA required before full session."""
    return login_user(db, payload)


@router.post("/mfa/verify", response_model=LoginResponse)
def verify_mfa(
    payload: MfaVerifyRequest,
    x_mfa_challenge: Optional[str] = Header(None, alias="X-MFA-Challenge"),
    db: Session = Depends(get_db),
) -> LoginResponse:
    """F.3 – Verify one-time MFA code and issue session token."""
    challenge_token = payload.mfa_challenge_token or x_mfa_challenge
    if not challenge_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="MFA challenge token missing.")
    return verify_mfa_service(db, payload, challenge_token)


@router.get("/users/public-key", response_model=PublicKeyLookupResponse)
def lookup_public_key(
    username: Optional[str] = None,
    email: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PublicKeyLookupResponse:
    """F.4 – Lookup receiver long-term public key by username or email."""
    return lookup_public_key_service(db, username=username, email=email)

