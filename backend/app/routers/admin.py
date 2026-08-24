from __future__ import annotations

"""Set 3 – Admin transfer log viewing (F.15)."""

from fastapi import APIRouter

from app.schemas.admin import TransferLogQuery, TransferLogResponse

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/logs", response_model=TransferLogResponse)
async def view_transfer_logs(query: TransferLogQuery = TransferLogQuery()) -> TransferLogResponse:
    """F.15 – View metadata-only transfer log entries."""
    raise NotImplementedError
