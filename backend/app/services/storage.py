from __future__ import annotations

import os
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    boto3 = None
    ClientError = Exception
    BOTO3_AVAILABLE = False


from app.config import settings


class BlobStorageBackend(ABC):
    @abstractmethod
    def save_blob(self, object_key: str, data: bytes) -> str:
        """Persist ciphertext; return storage key."""

    @abstractmethod
    def read_blob(self, object_key: str) -> bytes:
        """Fetch ciphertext bytes."""

    @abstractmethod
    def delete_blob(self, object_key: str) -> None:
        """Remove ciphertext after successful delivery."""


class S3BlobStorage(BlobStorageBackend):
    """AWS S3 or any S3-compatible provider (MinIO, DigitalOcean Spaces, etc.)."""

    def __init__(self) -> None:
        self.bucket = settings.s3_bucket_name
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            aws_access_key_id=settings.s3_access_key_id,
            aws_secret_access_key=settings.s3_secret_access_key,
            region_name=settings.s3_region,
        )
        self._ensure_bucket()

    def _ensure_bucket(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.bucket)
        except ClientError:
            create_kwargs: dict = {"Bucket": self.bucket}
            if settings.s3_region and settings.s3_region != "us-east-1":
                create_kwargs["CreateBucketConfiguration"] = {"LocationConstraint": settings.s3_region}
            self.client.create_bucket(**create_kwargs)

    def save_blob(self, object_key: str, data: bytes) -> str:
        self.client.put_object(Bucket=self.bucket, Key=object_key, Body=data, ServerSideEncryption="AES256")
        return object_key

    def read_blob(self, object_key: str) -> bytes:
        response = self.client.get_object(Bucket=self.bucket, Key=object_key)
        return response["Body"].read()

    def delete_blob(self, object_key: str) -> None:
        self.client.delete_object(Bucket=self.bucket, Key=object_key)


class LocalBlobStorage(BlobStorageBackend):
    """Dev-only fallback when S3/MinIO is unavailable."""

    def __init__(self, base_path: Optional[str] = None) -> None:
        self.base_path = Path(base_path or settings.local_blob_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _full_path(self, object_key: str) -> Path:
        safe_key = object_key.replace("..", "").lstrip("/")
        return self.base_path / safe_key

    def save_blob(self, object_key: str, data: bytes) -> str:
        path = self._full_path(object_key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return object_key

    def read_blob(self, object_key: str) -> bytes:
        return self._full_path(object_key).read_bytes()

    def delete_blob(self, object_key: str) -> None:
        path = self._full_path(object_key)
        if path.exists():
            os.remove(path)


def get_blob_storage() -> BlobStorageBackend:
    if settings.storage_backend == "s3" and BOTO3_AVAILABLE:
        try:
            return S3BlobStorage()
        except Exception:
            # Fallback to local storage if S3 bucket connection fails in dev
            return LocalBlobStorage()
    return LocalBlobStorage()

