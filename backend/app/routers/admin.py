from __future__ import annotations

"""Set 3 – Admin transfer log and user activity audit viewing (F.15)."""

import io
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.deps import get_db, require_admin
from app.models import User
from app.schemas.admin import (
    ActivityLogResponse,
    TransferLogQuery,
    TransferLogResponse,
    UsersListResponse,
)
from app.services.audit import (
    generate_user_activity_pdf,
    get_activity_logs,
    get_all_users,
    get_transfer_logs,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/logs", response_model=TransferLogResponse)
def view_transfer_logs(
    query: TransferLogQuery = Depends(),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> TransferLogResponse:
    """F.15 – View metadata-only transfer log entries."""
    _ = admin_user
    return get_transfer_logs(db, query)


@router.get("/activity-logs", response_model=ActivityLogResponse)
def view_activity_logs(
    username: Optional[str] = Query(None, description="Filter activity logs by username"),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ActivityLogResponse:
    """View user activity audit trail for forensics/enquiry."""
    _ = admin_user
    return get_activity_logs(db, username=username)


@router.get("/users", response_model=UsersListResponse)
def list_users(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> UsersListResponse:
    """List all registered users with their last login and roles."""
    _ = admin_user
    return get_all_users(db)


@router.get("/activity-logs/{username}/pdf")
def get_user_activity_pdf(
    username: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    """Generate and download legal/police enquiry activity log PDF report for a user."""
    _ = admin_user
    pdf_bytes = generate_user_activity_pdf(db, username)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=activity_log_{username}.pdf"},
    )


@router.post("/reset-database")
@router.get("/reset-database")
def reset_database(
    admin_user: User = Depends(require_admin),
) -> dict[str, str]:
    """Wipe all database tables, users, transfers, and activity logs. Restores default admin."""
    _ = admin_user
    from app.db import reset_entire_system
    return reset_entire_system()


@router.post("/emergency-reset")
@router.get("/emergency-reset")
def emergency_reset() -> dict[str, str]:
    """Emergency system reset endpoint to wipe all database tables and restore default admin."""
    from app.db import reset_entire_system
    return reset_entire_system()

