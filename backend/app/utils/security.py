from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

import pyotp
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)



def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def generate_mfa_secret() -> str:
    return pyotp.random_base32()


def verify_totp(secret: str, code: str) -> bool:
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def get_totp_uri(secret: str, username: str) -> str:
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=settings.app_name)


import secrets
import hashlib
import hmac


def generate_email_otp() -> str:
    """Generate secure 6-digit numeric OTP for email 2FA."""
    return f"{secrets.randbelow(1000000):06d}"


def hash_otp(otp: str) -> str:
    """Generate SHA256 HMAC for storing OTP in challenge token."""
    return hmac.new(settings.secret_key.encode(), otp.encode(), hashlib.sha256).hexdigest()


def create_token(data: Dict[str, Any], expires_delta: timedelta) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + expires_delta
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def create_session_token(user_id: int, username: str, is_admin: bool = False) -> str:
    return create_token(
        {"sub": str(user_id), "username": username, "is_admin": is_admin, "type": "session"},
        timedelta(minutes=settings.access_token_expire_minutes),
    )


def create_mfa_challenge_token(user_id: int, username: str, otp: Optional[str] = None) -> str:
    token_data: Dict[str, Any] = {
        "sub": str(user_id),
        "username": username,
        "type": "mfa_challenge",
    }
    if otp:
        token_data["otp_hash"] = hash_otp(otp)

    return create_token(
        token_data,
        timedelta(minutes=settings.mfa_challenge_expire_minutes),
    )


def verify_email_otp(submitted_code: str, token_payload: Dict[str, Any]) -> bool:
    expected_hash = token_payload.get("otp_hash")
    if not expected_hash:
        return False
    submitted_hash = hash_otp(submitted_code)
    return hmac.compare_digest(expected_hash, submitted_hash)


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError:
        return None
