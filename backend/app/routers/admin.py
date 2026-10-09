from __future__ import annotations

"""Set 3 – Admin transfer log viewing (F.15)."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.deps import get_db, require_admin
from app.models import User
from app.schemas.admin import TransferLogQuery, TransferLogResponse
from app.services.audit import get_transfer_logs

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/logs", response_model=TransferLogResponse)
def view_transfer_logs(
    query: TransferLogQuery = Depends(),
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> TransferLogResponse:
    """F.15 – View metadata-only transfer log entries."""
    void = admin_user
    return get_transfer_logs(db, query)


from app.schemas.admin import ActivityLogResponse, UsersListResponse
from fastapi.responses import StreamingResponse
import io

@router.get("/activity-logs", response_model=ActivityLogResponse)
def view_activity_logs(
    username: str = None,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from app.services.audit import get_activity_logs
    return get_activity_logs(db, username=username)

@router.get("/users", response_model=UsersListResponse)
def list_users(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from app.services.audit import get_all_users
    return get_all_users(db)

@router.get("/activity-logs/{username}/pdf")
def get_user_activity_pdf(
    username: str,
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    from app.services.audit import generate_user_activity_pdf
    pdf_bytes = generate_user_activity_pdf(db, username)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=activity_log_{username}.pdf"}
    )
