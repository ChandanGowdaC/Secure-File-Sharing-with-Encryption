from __future__ import annotations

import base64
import uuid
from typing import List

from sqlalchemy.orm import Session, joinedload

from app.middleware.errors import AppError
from app.models import Transfer, User
from app.schemas.transfers import (
    DeliverTransferResponse,
    PendingTransfersResponse,
    ReceivedTransferItem,
    ReceivedTransfersResponse,
    TransferStatus,
    TransferSummary,
    UploadTransferRequest,
    UploadTransferResponse,
)
from app.services.audit import log_event
from app.services.storage import BlobStorageBackend, get_blob_storage


def _object_key(transfer_id: str) -> str:
    return f"transfers/{transfer_id}.bin"


def upload_transfer(
    db: Session,
    sender: User,
    payload: UploadTransferRequest,
    storage: BlobStorageBackend | None = None,
) -> UploadTransferResponse:
    storage = storage or get_blob_storage()
    receiver = db.query(User).filter(User.username == payload.receiver_username).first()
    if receiver is None:
        raise AppError("Receiver not found.", status_code=404, internal_detail="receiver_lookup_failed")

    if receiver.id == sender.id:
        raise AppError("Cannot send a file to yourself.", status_code=400)

    try:
        ciphertext = base64.b64decode(payload.ciphertext)
    except Exception as exc:
        raise AppError("Corrupted upload payload.", status_code=400, internal_detail=str(exc)) from exc

    transfer_id = str(uuid.uuid4())
    object_key = _object_key(transfer_id)

    try:
        storage.save_blob(object_key, ciphertext)
    except Exception as exc:
        raise AppError("Storage failure while queueing file.", status_code=503, internal_detail=str(exc)) from exc

    transfer = Transfer(
        transfer_id=transfer_id,
        sender_id=sender.id,
        receiver_id=receiver.id,
        status=TransferStatus.pending.value,
        blob_path=object_key,
        nonce=payload.nonce,
        auth_tag=payload.auth_tag,
        sender_ephemeral_public_key=payload.sender_ephemeral_public_key,
        original_filename=payload.original_filename,
    )
    db.add(transfer)
    db.commit()
    db.refresh(transfer)

    log_event(db, transfer, "queued")
    log_event(db, transfer, "upload")

    return UploadTransferResponse(
        transfer_id=transfer_id,
        status=TransferStatus.pending,
        message="Encrypted file queued for delivery.",
    )


def list_pending(db: Session, receiver: User) -> PendingTransfersResponse:
    transfers = (
        db.query(Transfer)
        .options(joinedload(Transfer.sender))
        .filter(Transfer.receiver_id == receiver.id, Transfer.status == TransferStatus.pending.value)
        .all()
    )
    return PendingTransfersResponse(
        transfers=[
            TransferSummary(
                transfer_id=t.transfer_id,
                sender=t.sender.username,
                receiver=receiver.username,
                status=TransferStatus.pending,
            )
            for t in transfers
        ]
    )


def deliver_transfer(
    db: Session,
    receiver: User,
    transfer_id: str,
    storage: BlobStorageBackend | None = None,
) -> DeliverTransferResponse:
    storage = storage or get_blob_storage()
    transfer = (
        db.query(Transfer)
        .options(joinedload(Transfer.sender))
        .filter(Transfer.transfer_id == transfer_id, Transfer.receiver_id == receiver.id)
        .first()
    )
    if transfer is None:
        raise AppError("Transfer not found.", status_code=404)

    if transfer.status != TransferStatus.pending.value:
        raise AppError("Transfer is not pending delivery.", status_code=400)

    if not transfer.blob_path:
        raise AppError("Encrypted blob missing from storage.", status_code=404, internal_detail="missing_blob_path")

    try:
        ciphertext = storage.read_blob(transfer.blob_path)
    except Exception as exc:
        raise AppError("Storage failure while retrieving file.", status_code=503, internal_detail=str(exc)) from exc

    transfer.status = TransferStatus.delivered.value
    db.commit()

    log_event(db, transfer, "delivered")

    response = DeliverTransferResponse(
        transfer_id=transfer.transfer_id,
        ciphertext=base64.b64encode(ciphertext).decode("ascii"),
        nonce=transfer.nonce,
        auth_tag=transfer.auth_tag,
        sender_ephemeral_public_key=transfer.sender_ephemeral_public_key,
        sender=transfer.sender.username,
        original_filename=transfer.original_filename,
    )

    try:
        storage.delete_blob(transfer.blob_path)
        transfer.blob_path = None
        db.commit()
    except Exception as exc:
        raise AppError("Delivery succeeded but storage cleanup failed.", status_code=503, internal_detail=str(exc)) from exc

    return response


def list_received(db: Session, receiver: User) -> ReceivedTransfersResponse:
    transfers = (
        db.query(Transfer)
        .options(joinedload(Transfer.sender))
        .filter(
            Transfer.receiver_id == receiver.id,
            Transfer.status.in_([TransferStatus.delivered.value, TransferStatus.downloaded.value]),
        )
        .order_by(Transfer.updated_at.desc())
        .all()
    )

    items: List[ReceivedTransferItem] = []
    for transfer in transfers:
        items.append(
            ReceivedTransferItem(
                transfer_id=transfer.transfer_id,
                sender=transfer.sender.username,
                status=TransferStatus(transfer.status),
                nonce=transfer.nonce,
                auth_tag=transfer.auth_tag,
                sender_ephemeral_public_key=transfer.sender_ephemeral_public_key,
                original_filename=transfer.original_filename,
                ciphertext=None,
            )
        )

    return ReceivedTransfersResponse(transfers=items)


def acknowledge_download(db: Session, receiver: User, transfer_id: str, success: bool) -> None:
    transfer = (
        db.query(Transfer)
        .filter(Transfer.transfer_id == transfer_id, Transfer.receiver_id == receiver.id)
        .first()
    )
    if transfer is None:
        raise AppError("Transfer not found.", status_code=404)

    if not success:
        log_event(db, transfer, "download_failed", details="Client reported decryption failure")
        raise AppError("Decryption or integrity verification failed.", status_code=400)

    transfer.status = TransferStatus.downloaded.value
    db.commit()
    log_event(db, transfer, "downloaded")


def deliver_all_pending(db: Session, receiver: User) -> List[DeliverTransferResponse]:
    pending = list_pending(db, receiver).transfers
    delivered: List[DeliverTransferResponse] = []
    for item in pending:
        delivered.append(deliver_transfer(db, receiver, item.transfer_id))
    return delivered
