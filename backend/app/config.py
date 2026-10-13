from __future__ import annotations

from typing import List, Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Secure File Sharing with Encryption"
    debug: bool = True
    api_prefix: str = "/api/v1"

    database_url: str = "sqlite:///./secure_file_sharing.db"
    # Keep database tables, users, and blobs persistent across restarts
    reset_database_on_startup: bool = False

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    mfa_challenge_expire_minutes: int = 5
    password_reset_expire_minutes: int = 30
    frontend_url: str = "https://secure-file-sharing-with-encryption-tau.vercel.app"

    # Object storage – encrypted blobs never live in the repo tree
    # Backblaze B2 (100% free forever, S3-compatible, no credit card required)
    storage_backend: Literal["s3", "local"] = "s3"
    s3_endpoint_url: Optional[str] = "https://s3.us-east-005.backblazeb2.com"
    s3_access_key_id: str = "005ebfbd19cd8f80000000001"
    s3_secret_access_key: str = "K0053VwL457PkobnnPOqlz8IWU2zQKI"
    s3_bucket_name: str = "sfs-blobs-chandangowdac"
    s3_region: str = "us-east-005"

    local_blob_path: str = "storage/blobs"
    blob_storage_path: Optional[str] = None
    max_upload_size_bytes: int = 100 * 1024 * 1024

    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]

    admin_username: str = "admin"
    admin_password: str = "admin123456"
    admin_email: str = "admin@example.com"

    # SMTP Configuration for Email 2FA
    smtp_host: Optional[str] = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: Optional[str] = "securefilesharing303.project@gmail.com"
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = "securefilesharing303.project@gmail.com"
    smtp_tls: bool = True

    # HTTP Email API (Port 443 - Recommended on Render/Vercel free tier)
    resend_api_key: Optional[str] = None
    resend_from: Optional[str] = "onboarding@resend.dev"
    brevo_api_key: Optional[str] = None
    brevo_sender_email: Optional[str] = "securefilesharing303.project@gmail.com"


settings = Settings()
