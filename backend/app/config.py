from __future__ import annotations

from typing import List, Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Secure File Sharing with Encryption"
    debug: bool = True
    api_prefix: str = "/api/v1"

    database_url: str = "sqlite:///./secure_file_sharing.db"
    # Automatically wipe database tables and users on every deployment startup
    reset_database_on_startup: bool = True

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    mfa_challenge_expire_minutes: int = 5
    password_reset_expire_minutes: int = 30
    frontend_url: str = "http://localhost:5173"

    # Object storage – encrypted blobs never live in the repo tree
    # Use "s3" with MinIO locally or AWS S3 in production; "local" is dev-only fallback
    storage_backend: Literal["s3", "local"] = "local"
    s3_endpoint_url: Optional[str] = "http://localhost:9000"
    s3_access_key_id: str = "minioadmin"
    s3_secret_access_key: str = "minioadmin"
    s3_bucket_name: str = "secure-file-blobs"
    s3_region: str = "us-east-1"

    local_blob_path: str = "/tmp/secure-file-blobs"
    max_upload_size_bytes: int = 100 * 1024 * 1024

    cors_origins: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"]

    admin_username: str = "admin"
    admin_password: str = "admin123456"
    admin_email: str = "admin@example.com"

    # SMTP Configuration for Email 2FA
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    smtp_tls: bool = True

    # HTTP Email API (Port 443 - Recommended on Render/Vercel free tier)
    resend_api_key: Optional[str] = None
    resend_from: Optional[str] = "onboarding@resend.dev"
    brevo_api_key: Optional[str] = None


settings = Settings()
