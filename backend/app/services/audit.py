from __future__ import annotations

import io
from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, aliased

from app.middleware.errors import AppError
from app.models import ActivityLog, Transfer, User
from app.schemas.admin import (
    ActivityLogEntry,
    ActivityLogResponse,
    TransferLogEntry as TransferLogEntrySchema,
    TransferLogQuery,
    TransferLogResponse,
    UserInfoEntry,
    UsersListResponse,
)
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
        clean = query.username.strip().lower()
        q = q.filter((func.lower(sender.username) == clean) | (func.lower(receiver.username) == clean))
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


def log_activity(
    db: Session,
    user_id: int | None,
    username: str,
    action: str,
    details: str | None = None,
    ip_address: str | None = None,
) -> None:
    entry = ActivityLog(
        user_id=user_id,
        username=username,
        action=action,
        details=details,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()


def get_activity_logs(db: Session, username: str | None = None, limit: int = 500) -> ActivityLogResponse:
    q = db.query(ActivityLog).order_by(ActivityLog.timestamp.desc())
    if username and username.strip():
        q = q.filter(func.lower(ActivityLog.username) == username.strip().lower())
    rows = q.limit(limit).all()
    entries = [
        ActivityLogEntry(
            id=row.id,
            username=row.username,
            action=row.action,
            details=row.details,
            ip_address=row.ip_address,
            timestamp=row.timestamp,
        )
        for row in rows
    ]
    return ActivityLogResponse(entries=entries)


def get_all_users(db: Session) -> UsersListResponse:
    users = db.query(User).order_by(User.created_at.desc()).all()
    entries = [
        UserInfoEntry(
            username=u.username,
            email=u.email,
            is_admin=u.is_admin,
            last_login_at=u.last_login_at,
            created_at=u.created_at,
        )
        for u in users
    ]
    return UsersListResponse(users=entries)


def generate_user_activity_pdf(db: Session, username: str) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    clean_name = username.strip().lower()
    user = db.query(User).filter(func.lower(User.username) == clean_name).first()
    logs = (
        db.query(ActivityLog)
        .filter(func.lower(ActivityLog.username) == clean_name)
        .order_by(ActivityLog.timestamp.desc())
        .all()
    )

    if not user and not logs:
        raise AppError(f"User '{username}' not found and no activity logs exist", status_code=404)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    elements = []

    display_name = user.username if user else username
    elements.append(Paragraph(f"Activity Log Audit Report - {display_name}", styles["Title"]))
    elements.append(Spacer(1, 10))

    if user:
        last_login_str = user.last_login_at.strftime("%Y-%m-%d %H:%M:%S UTC") if user.last_login_at else "Never"
        user_info = (
            f"<b>Email:</b> {user.email}<br/>"
            f"<b>Account Status:</b> {'Active (Admin)' if user.is_admin else 'Active (Standard User)'}<br/>"
            f"<b>Registered At:</b> {user.created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}<br/>"
            f"<b>Last Login:</b> {last_login_str}"
        )
    else:
        user_info = (
            "<b>Account Status:</b> Deleted / Inactive (Audit Records Preserved for Forensic & Legal Inquiry)<br/>"
            "<b>User Identity:</b> Verified Historical Username"
        )
    elements.append(Paragraph(user_info, styles["Normal"]))
    elements.append(Spacer(1, 14))

    data = [["Timestamp (UTC)", "Action", "Details", "IP Address"]]
    if logs:
        for log in logs:
            data.append([
                log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                log.action,
                log.details or "-",
                log.ip_address or "-",
            ])
    else:
        data.append(["-", "No recorded activities", "-", "-"])

    table = Table(data, colWidths=[120, 100, 220, 100])
    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, 0), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("TOPPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#f8fafc")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 1), (-1, -1), 9),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ])
    )
    elements.append(table)

    elements.append(Spacer(1, 14))
    elements.append(
        Paragraph(
            f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')} — Secure File Sharing System Audit Record",
            styles["Italic"],
        )
    )

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
