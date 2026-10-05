from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.transfers import TransferStatus


class TransferLogQuery(BaseModel):
    username: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = Field(default=100, ge=1, le=500)


class TransferLogEntry(BaseModel):
    transfer_id: str
    sender: str
    receiver: str
    timestamp: datetime
    status: TransferStatus


class TransferLogResponse(BaseModel):
    entries: List[TransferLogEntry]
