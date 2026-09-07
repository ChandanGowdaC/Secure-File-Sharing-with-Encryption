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

