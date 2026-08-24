from __future__ import annotations

"""SQLAlchemy ORM models (User DB, Transfer Queue, Metadata Log)."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    mfa_secret: Mapped[str | None] = mapped_column(String(64), nullable=True)
    long_term_public_key: Mapped[str] = mapped_column(Text)
    is_admin: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sent_transfers: Mapped[list["Transfer"]] = relationship(back_populates="sender", foreign_keys="Transfer.sender_id")
    received_transfers: Mapped[list["Transfer"]] = relationship(
        back_populates="receiver", foreign_keys="Transfer.receiver_id"
    )


class Transfer(Base):
    __tablename__ = "transfers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    transfer_id: Mapped[str] = mapped_column(String(36), unique=True, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    receiver_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    status: Mapped[str] = mapped_column(String(32), default="pending")
    blob_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    nonce: Mapped[str] = mapped_column(Text)
    auth_tag: Mapped[str] = mapped_column(Text)
    sender_ephemeral_public_key: Mapped[str] = mapped_column(Text)
    original_filename: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    sender: Mapped["User"] = relationship(back_populates="sent_transfers", foreign_keys=[sender_id])
    receiver: Mapped["User"] = relationship(back_populates="received_transfers", foreign_keys=[receiver_id])
    log_entries: Mapped[list["TransferLogEntry"]] = relationship(back_populates="transfer")


class TransferLogEntry(Base):
    __tablename__ = "transfer_log_entries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    transfer_id: Mapped[int] = mapped_column(ForeignKey("transfers.id"))
    event_type: Mapped[str] = mapped_column(String(32))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    details: Mapped[str | None] = mapped_column(Text, nullable=True)

    transfer: Mapped["Transfer"] = relationship(back_populates="log_entries")
