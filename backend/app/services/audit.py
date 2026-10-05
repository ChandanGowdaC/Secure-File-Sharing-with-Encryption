from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session, aliased

from app.models import Transfer, User
from app.schemas.admin import TransferLogEntry as TransferLogEntrySchema
from app.schemas.admin import TransferLogQuery, TransferLogResponse
from app.schemas.transfers import TransferStatus


def log_event(db: Session, transfer: Transfer, event_type: str, details: Optional[str] = None) -> None:
    from app.models import TransferLogEntry

    entry = TransferLogEntry(transfer_id=transfer.id, event_type=event_type, details=details)
    db.add(entry)
    db.commit()


def get_transfer_logs(db: Session, query: TransferLogQuery) -> TransferLogResponse:
    sender = aliased(User)
    receiver = aliased(User)

    q = (
        db.query(Transfer, sender, receiver)
        .join(sender, Transfer.sender_id == sender.id)
        .join(receiver, Transfer.receiver_id == receiver.id)
        .order_by(Transfer.created_at.desc())
    )

    if query.username:
        q = q.filter((sender.username == query.username) | (receiver.username == query.username))
    if query.date_from:
        q = q.filter(Transfer.created_at >= query.date_from)
    if query.date_to:
        q = q.filter(Transfer.created_at <= query.date_to)

    rows = q.limit(query.limit).all()

    entries = [
        TransferLogEntrySchema(
            transfer_id=transfer.transfer_id,
            sender=sender_user.username,
            receiver=receiver_user.username,
            timestamp=transfer.created_at,
            status=TransferStatus(transfer.status),
        )
        for transfer, sender_user, receiver_user in rows
    ]

    return TransferLogResponse(entries=entries)
