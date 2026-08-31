from __future__ import annotations

from typing import List, Literal, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Secure File Sharing with Encryption"
    debug: bool = True
    api_prefix: str = "/api/v1"

    database_url: str = "sqlite:///./secure_file_sharing.db"

    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 60
    mfa_challenge_expire_minutes: int = 5

    # Object storage – encrypted blobs never live in the repo tree
    # Use "s3" with MinIO locally or AWS S3 in production; "local" is dev-only fallback
    storage_backend: Literal["s3", "local"] = "local"
    s3_endpoint_url: Optional[str] = "http://localhost:9000"
    s3_access_key_id: str = "minioadmin"
    s3_secret_access_key: str = "minioadmin"
    s3_bucket_name: str = "secure-file-blobs"
    s3_region: str = "us-east-1"

    local_blob_path: str = "/tmp/secure-file-blobs"

    cors_origins: List[str] = ["http://localhost:5173"]

    admin_username: str = "admin"
    admin_password: str = "admin123456"
    admin_email: str = "admin@example.com"


settings = Settings()
