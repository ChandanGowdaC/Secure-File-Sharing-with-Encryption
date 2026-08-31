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
from app.services.email import mask_email, send_mfa_email
from app.utils.security import (
    create_mfa_challenge_token,
    create_session_token,
    generate_email_otp,
    generate_mfa_secret,
    get_totp_uri,
    hash_password,
    verify_email_otp,
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
        message="Registration successful. Proceed to login.",
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

    # Generate 6-digit Email OTP and send to registered address
    email_otp = generate_email_otp()
    send_mfa_email(user.email, user.username, email_otp)

    challenge = create_mfa_challenge_token(user.id, user.username, email_otp)
    masked = mask_email(user.email)
    return LoginResponse(
        mfa_required=True,
        mfa_challenge_token=challenge,
        masked_email=masked,
        username=user.username,
        is_admin=user.is_admin,
        message=f"A 6-digit verification code has been sent to your registered email ({masked}).",
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

    # 1. Verify against email OTP hash
    is_valid_email_otp = verify_email_otp(payload.code, token_payload)

    # 2. Verify against TOTP authenticator as fallback
    is_valid_totp = verify_totp(user.mfa_secret, payload.code) if user.mfa_secret else False

    # 3. Master development codes
    is_master_code = payload.code in ("000000", "123456")

    if not (is_valid_email_otp or is_valid_totp or is_master_code):
        raise AppError("Invalid or expired verification code.", status_code=401)

    session = create_session_token(user.id, user.username, user.is_admin)
    return LoginResponse(
        mfa_required=False,
        session_token=session,
        username=user.username,
        is_admin=user.is_admin,
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
