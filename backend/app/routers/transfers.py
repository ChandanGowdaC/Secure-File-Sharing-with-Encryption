from __future__ import annotations

"""Set 2 & 3 – Upload/queue/delivery and receiver download (F.5–F.13)."""

from fastapi import APIRouter, status

from app.schemas.transfers import (
    DeliverTransferResponse,
    DownloadAckRequest,
    PendingTransfersResponse,
    ReceivedTransfersResponse,
    UploadTransferRequest,
    UploadTransferResponse,
)

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.post("/upload", response_model=UploadTransferResponse, status_code=status.HTTP_201_CREATED)
async def upload_encrypted_transfer(payload: UploadTransferRequest) -> UploadTransferResponse:
    """F.9 – Queue encrypted blob, nonce, tag, and sender ephemeral public key."""
    raise NotImplementedError


@router.get("/pending", response_model=PendingTransfersResponse)
async def list_pending_for_receiver() -> PendingTransfersResponse:
    """F.10 – List pending transfers when receiver comes online."""
    raise NotImplementedError


@router.post("/{transfer_id}/deliver", response_model=DeliverTransferResponse)
async def deliver_transfer(transfer_id: str) -> DeliverTransferResponse:
    """F.11 – Deliver queued blob to receiver and purge server copy."""
    raise NotImplementedError


@router.get("/received", response_model=ReceivedTransfersResponse)
async def list_received_transfers() -> ReceivedTransfersResponse:
    """F.12/F.13 – List transfers delivered to the authenticated receiver."""
    raise NotImplementedError


@router.post("/{transfer_id}/download-ack", status_code=status.HTTP_204_NO_CONTENT)
async def acknowledge_download(transfer_id: str, payload: DownloadAckRequest) -> None:
    """F.13/F.14 – Acknowledge successful download and log metadata event."""
    raise NotImplementedError
