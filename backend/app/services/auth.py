from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from app.middleware.errors import AppError
from app.models import User
from app.schemas.auth import (
    LoginRequest,
    LoginResponse,
    MfaVerifyRequest,
    PublicKeyLookupResponse,
    RegisterRequest,
    RegisterResponse,
)
from app.utils.security import (
    create_mfa_challenge_token,
    create_session_token,
    generate_mfa_secret,
    get_totp_uri,
    hash_password,
    verify_password,
    verify_totp,
)


def register_user(db: Session, payload: RegisterRequest) -> RegisterResponse:
    if db.query(User).filter((User.username == payload.username) | (User.email == payload.email)).first():
        raise AppError("Username or email already registered.", status_code=409)

    mfa_secret = generate_mfa_secret()
    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        mfa_secret=mfa_secret,
        long_term_public_key=payload.long_term_public_key,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(
        message="Registration successful. Set up MFA using the provisioning URI, then log in.",
        username=user.username,
        mfa_provisioning_uri=get_totp_uri(mfa_secret, user.username),
    )


def login_user(db: Session, payload: LoginRequest) -> LoginResponse:
    user = (
        db.query(User)
        .filter((User.username == payload.username_or_email) | (User.email == payload.username_or_email))
        .first()
    )
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise AppError("Invalid credentials.", status_code=401)

    challenge = create_mfa_challenge_token(user.id, user.username)
    return LoginResponse(
        mfa_required=True,
        mfa_challenge_token=challenge,
        message="Password verified. Complete MFA to continue.",
    )


def verify_mfa(db: Session, payload: MfaVerifyRequest, challenge_token: str) -> LoginResponse:
    from app.utils.security import decode_token

    token_payload = decode_token(challenge_token)
    if token_payload is None or token_payload.get("type") != "mfa_challenge":
        raise AppError("Invalid or expired MFA challenge.", status_code=401)

    user = db.get(User, int(token_payload["sub"]))
    if user is None:
        raise AppError("User not found.", status_code=404)

    if user.username != payload.username_or_email and user.email != payload.username_or_email:
        raise AppError("MFA challenge does not match user.", status_code=401)

    if not user.mfa_secret or not verify_totp(user.mfa_secret, payload.code):
        raise AppError("Invalid MFA code.", status_code=401)

    session = create_session_token(user.id, user.username, user.is_admin)
    return LoginResponse(
        mfa_required=False,
        session_token=session,
        message="Authentication successful.",
    )


def lookup_public_key(
    db: Session,
    username: Optional[str] = None,
    email: Optional[str] = None,
) -> PublicKeyLookupResponse:
    if not username and not email:
        raise AppError("Provide username or email for lookup.", status_code=400)

    query = db.query(User)
    if username:
        user = query.filter(User.username == username).first()
    else:
        user = query.filter(User.email == email).first()

    if user is None:
        return PublicKeyLookupResponse(found=False, message="Receiver not found.")

    return PublicKeyLookupResponse(
        found=True,
        username=user.username,
        public_key=user.long_term_public_key,
    )
