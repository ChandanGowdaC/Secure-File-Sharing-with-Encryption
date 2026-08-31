from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class TransferStatus(str, Enum):
    pending = "pending"
    delivered = "delivered"
    downloaded = "downloaded"


class UploadTransferRequest(BaseModel):
    receiver_username: str
    ciphertext: str = Field(..., description="Base64-encoded encrypted file blob")
    nonce: str = Field(..., description="Base64-encoded AES-GCM nonce")
    auth_tag: str = Field(..., description="Base64-encoded AES-GCM authentication tag")
    sender_ephemeral_public_key: str = Field(..., description="Base64-encoded ephemeral DH public key")
    original_filename: Optional[str] = None


class UploadTransferResponse(BaseModel):
    transfer_id: str
    status: TransferStatus
    message: str


class TransferSummary(BaseModel):
    transfer_id: str
    sender: str
    receiver: str
    status: TransferStatus


class PendingTransfersResponse(BaseModel):
    transfers: List[TransferSummary]


class DeliverTransferResponse(BaseModel):
    transfer_id: str
    ciphertext: str
    nonce: str
    auth_tag: str
    sender_ephemeral_public_key: str
    sender: str
    original_filename: Optional[str] = None


class ReceivedTransferItem(BaseModel):
    transfer_id: str
    sender: str
    status: TransferStatus
    ciphertext: Optional[str] = None
    nonce: Optional[str] = None
    auth_tag: Optional[str] = None
    sender_ephemeral_public_key: Optional[str] = None
    original_filename: Optional[str] = None



class ReceivedTransfersResponse(BaseModel):
    transfers: List[ReceivedTransferItem]


class DownloadAckRequest(BaseModel):
    success: bool = True
