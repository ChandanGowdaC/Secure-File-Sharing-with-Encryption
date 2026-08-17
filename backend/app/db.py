from __future__ import annotations

"""Database session and engine setup."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.models import Base

db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_transfer_file_size_column()


def _ensure_transfer_file_size_column() -> None:
    inspector = inspect(engine)
    if "transfers" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("transfers")}
    if "file_size_bytes" in columns:
        return
    column_type = "INTEGER" if db_url.startswith("sqlite") else "INT"
    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE transfers ADD COLUMN file_size_bytes {column_type}"))


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
