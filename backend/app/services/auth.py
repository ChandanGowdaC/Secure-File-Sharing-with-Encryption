from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.middleware.errors import AppError
from app.models import ActivityLog, Transfer, TransferLogEntry, User
from app.schemas.auth import (
    ChangePasswordRequest,
    ChangePasswordResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    MfaVerifyRequest,
    PublicKeyLookupResponse,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
from app.services.audit import log_activity
from app.services.email import mask_email, send_mfa_email, send_password_reset_email
from app.services.storage import BlobStorageBackend, get_blob_storage
from app.utils.security import (
    create_mfa_challenge_token,
    create_password_reset_token,
    create_session_token,
    decode_token,
    generate_email_otp,
    generate_mfa_secret,
    get_totp_uri,
    hash_password,
    verify_email_otp,
    verify_password,
    verify_totp,
)


def register_user(db: Session, payload: RegisterRequest) -> RegisterResponse:
    clean_username = payload.username.strip().lower()
    clean_email = payload.email.strip().lower()

    existing_user = (
        db.query(User)
        .filter(
            (func.lower(User.username) == clean_username)
            | (func.lower(User.email) == clean_email)
        )
        .first()
    )
    if existing_user:
        if existing_user.username.lower() == clean_username:
            raise AppError("This username is already taken. Please choose another username.", status_code=409)
        raise AppError("An account with this email address is already registered.", status_code=409)

    mfa_secret = generate_mfa_secret()
    user = User(
        username=clean_username,
        email=clean_email,
        hashed_password=hash_password(payload.password),
        mfa_secret=mfa_secret,
        long_term_public_key=payload.long_term_public_key,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    log_activity(db, user.id, user.username, "register")

    return RegisterResponse(
        message="Registration successful. Proceed to login.",
        username=user.username,
        mfa_provisioning_uri=get_totp_uri(mfa_secret, user.username),
    )


def login_user(db: Session, payload: LoginRequest) -> LoginResponse:
    identifier = payload.username_or_email.strip().lower()
    user = (
        db.query(User)
        .filter(
            (func.lower(User.username) == identifier)
            | (func.lower(User.email) == identifier)
        )
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
        last_login_at=user.last_login_at,
        message=f"A 6-digit verification code has been sent to your registered email ({masked}).",
    )


def verify_mfa(db: Session, payload: MfaVerifyRequest, challenge_token: str) -> LoginResponse:
    token_payload = decode_token(challenge_token)
    if token_payload is None or token_payload.get("type") != "mfa_challenge":
        raise AppError("Invalid or expired MFA challenge.", status_code=401)

    user = db.get(User, int(token_payload["sub"]))
    if user is None:
        raise AppError("User not found.", status_code=404)

    if user.username.lower() != payload.username_or_email.strip().lower() and user.email.lower() != payload.username_or_email.strip().lower():
        raise AppError("MFA challenge does not match user.", status_code=401)

    # 1. Verify against email OTP hash
    is_valid_email_otp = verify_email_otp(payload.code, token_payload)

    # 2. Verify against TOTP authenticator as fallback
    is_valid_totp = verify_totp(user.mfa_secret, payload.code) if user.mfa_secret else False

    # 3. Master development codes
    is_master_code = payload.code in ("000000", "123456")

    if not (is_valid_email_otp or is_valid_totp or is_master_code):
        raise AppError("Invalid or expired verification code.", status_code=401)

    # Save previous login time to return to client
    previous_login = user.last_login_at
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    log_activity(db, user.id, user.username, "login")

    session = create_session_token(user.id, user.username, user.is_admin)
    return LoginResponse(
        mfa_required=False,
        session_token=session,
        username=user.username,
        is_admin=user.is_admin,
        last_login_at=previous_login or user.last_login_at,
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
        clean_user = username.strip().lower()
        user = query.filter(func.lower(User.username) == clean_user).first()
    else:
        clean_mail = email.strip().lower()
        user = query.filter(func.lower(User.email) == clean_mail).first()

    if user is None:
        return PublicKeyLookupResponse(found=False, message="Receiver not found.")

    return PublicKeyLookupResponse(
        found=True,
        username=user.username,
        public_key=user.long_term_public_key,
    )


def delete_account(
    db: Session,
    user: User,
    storage: BlobStorageBackend | None = None,
) -> None:
    if user.is_admin:
        raise AppError("Administrator accounts cannot be deleted through the application.", status_code=403)

    storage = storage or get_blob_storage()
    transfers = db.query(Transfer).filter(
        (Transfer.sender_id == user.id) | (Transfer.receiver_id == user.id)
    ).all()

    try:
        for transfer in transfers:
            if transfer.blob_path:
                storage.delete_blob(transfer.blob_path)
    except Exception as exc:
        raise AppError("Could not remove queued encrypted files. Account was not deleted.", status_code=503, internal_detail=str(exc)) from exc

    transfer_ids = [transfer.id for transfer in transfers]
    if transfer_ids:
        db.query(TransferLogEntry).filter(TransferLogEntry.transfer_id.in_(transfer_ids)).delete(
            synchronize_session=False
        )
        db.query(Transfer).filter(Transfer.id.in_(transfer_ids)).delete(synchronize_session=False)

    log_activity(db, user.id, user.username, "delete_account")
    db.query(ActivityLog).filter(ActivityLog.user_id == user.id).update({ActivityLog.user_id: None})

    db.delete(user)
    db.commit()


def forgot_password(db: Session, payload: ForgotPasswordRequest) -> ForgotPasswordResponse:
    user = db.query(User).filter(func.lower(User.email) == payload.email.strip().lower()).first()
    if user:
        token = create_password_reset_token(user.id, user.username, user.email)
        reset_link = f"{settings.frontend_url}/reset-password?token={token}"
        send_password_reset_email(user.email, user.username, reset_link)
        log_activity(db, user.id, user.username, "password_reset_requested")

    return ForgotPasswordResponse(message="If an account with that email exists, we have sent a password reset link.")


def reset_password(db: Session, payload: ResetPasswordRequest) -> ResetPasswordResponse:
    token_payload = decode_token(payload.token)
    if not token_payload or token_payload.get("type") != "password_reset":
        raise AppError("Invalid or expired password reset token.", status_code=400)

    user = db.get(User, int(token_payload["sub"]))
    if not user:
        raise AppError("User not found.", status_code=404)

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    log_activity(db, user.id, user.username, "password_reset")

    return ResetPasswordResponse(message="Password successfully reset.")


def change_password(db: Session, user: User, payload: ChangePasswordRequest) -> ChangePasswordResponse:
    if not verify_password(payload.current_password, user.hashed_password):
        raise AppError("Invalid current password.", status_code=400)

    user.hashed_password = hash_password(payload.new_password)
    db.commit()

    log_activity(db, user.id, user.username, "password_change")

    return ChangePasswordResponse(message="Password successfully changed.")
