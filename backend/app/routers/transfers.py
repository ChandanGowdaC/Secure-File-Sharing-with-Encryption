from __future__ import annotations

"""Set 2 & 3 – Upload/queue/delivery and receiver download (F.5–F.13)."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db
from app.models import User
from app.schemas.transfers import (
    DeliverTransferResponse,
    DownloadAckRequest,
    PendingTransfersResponse,
    ReceivedTransfersResponse,
    UploadTransferRequest,
    UploadTransferResponse,
)
from app.services.transfers import (
    acknowledge_download as acknowledge_download_service,
    deliver_transfer as deliver_transfer_service,
    list_pending as list_pending_service,
    list_received as list_received_service,
    upload_transfer as upload_transfer_service,
)

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.post("/upload", response_model=UploadTransferResponse, status_code=status.HTTP_201_CREATED)
def upload_encrypted_transfer(
    payload: UploadTransferRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UploadTransferResponse:
    """F.9 – Queue encrypted blob, nonce, tag, and sender ephemeral public key."""
    return upload_transfer_service(db, sender=current_user, payload=payload)


@router.get("/pending", response_model=PendingTransfersResponse)
def list_pending_for_receiver(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PendingTransfersResponse:
    """F.10 – List pending transfers when receiver comes online."""
    return list_pending_service(db, receiver=current_user)


@router.post("/{transfer_id}/deliver", response_model=DeliverTransferResponse)
def deliver_transfer(
    transfer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DeliverTransferResponse:
    """F.11 – Deliver queued blob to receiver and purge server copy."""
    return deliver_transfer_service(db, receiver=current_user, transfer_id=transfer_id)


@router.get("/received", response_model=ReceivedTransfersResponse)
def list_received_transfers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ReceivedTransfersResponse:
    """F.12/F.13 – List transfers delivered to the authenticated receiver."""
    return list_received_service(db, receiver=current_user)


@router.post("/{transfer_id}/download-ack", status_code=status.HTTP_204_NO_CONTENT)
def acknowledge_download(
    transfer_id: str,
    payload: DownloadAckRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    """F.13/F.14 – Acknowledge successful download and log metadata event."""
    acknowledge_download_service(db, receiver=current_user, transfer_id=transfer_id, success=payload.success)

