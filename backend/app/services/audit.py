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

def log_activity(db: Session, user_id: int, username: str, action: str, details: str | None = None, ip_address: str | None = None) -> None:
    from app.models import ActivityLog
    entry = ActivityLog(user_id=user_id, username=username, action=action, details=details, ip_address=ip_address)
    db.add(entry)
    db.commit()


def get_activity_logs(db: Session, username: str | None = None, limit: int = 500) -> ActivityLogResponse:
    from app.models import ActivityLog
    from app.schemas.admin import ActivityLogResponse, ActivityLogEntry
    q = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc())
    if username:
        q = q.filter(ActivityLog.username == username)
    rows = q.limit(limit).all()
    entries = [ActivityLogEntry(id=row.id, username=row.username, action=row.action, details=row.details, ip_address=row.ip_address, timestamp=row.timestamp) for row in rows]
    return ActivityLogResponse(entries=entries)


def get_all_users(db: Session):
    from app.schemas.admin import UsersListResponse, UserInfoEntry
    users = db.query(User).order_by(User.created_at.desc()).all()
    entries = [UserInfoEntry(username=u.username, email=u.email, is_admin=u.is_admin, last_login_at=u.last_login_at, created_at=u.created_at) for u in users]
    return UsersListResponse(users=entries)


def generate_user_activity_pdf(db: Session, username: str) -> bytes:
    import io
    from datetime import datetime
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib import colors
    from app.models import ActivityLog
    from app.middleware.errors import AppError
    
    user = db.query(User).filter(User.username == username).first()
    logs = db.query(ActivityLog).filter(ActivityLog.username == username).order_by(ActivityLog.timestamp.desc()).all()
    if not user and not logs:
        raise AppError("User not found and no activity logs exist", status_code=404)
        
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []
    
    elements.append(Paragraph(f"Activity Log Report - {username}", styles['Title']))
    elements.append(Spacer(1, 12))
    
    if user:
        user_info = f"Email: {user.email}<br/>Account Status: Active<br/>Created At: {user.created_at.strftime('%Y-%m-%d %H:%M:%S')}<br/>Last Login: {user.last_login_at.strftime('%Y-%m-%d %H:%M:%S') if user.last_login_at else 'Never'}"
    else:
        user_info = "Account Status: Deleted / Inactive (Audit Records Preserved for Investigation)<br/>Email: N/A"
    elements.append(Paragraph(user_info, styles['Normal']))
    elements.append(Spacer(1, 12))
    
    data = [["Timestamp", "Action", "Details", "IP Address"]]
    for log in logs:
        data.append([
            log.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            log.action,
            log.details or "-",
            log.ip_address or "-"
        ])
        
    table = Table(data)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elements.append(table)
    
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Generated at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", styles['Italic']))
    
    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
