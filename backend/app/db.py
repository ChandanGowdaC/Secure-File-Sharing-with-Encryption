from __future__ import annotations

"""Database session and engine setup."""

from collections.abc import Generator

from sqlalchemy import create_engine, inspect, text
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


def init_db(reset: bool = False) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    _ensure_transfer_file_size_column()
    _ensure_user_last_login_column()
    _ensure_activity_logs_table()


def _ensure_transfer_file_size_column() -> None:
    inspector = inspect(engine)
    if "transfers" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("transfers")}
    column_type = "INTEGER" if db_url.startswith("sqlite") else "INT"
    if "file_size_bytes" not in columns:
        with engine.begin() as connection:
            connection.execute(text(f"ALTER TABLE transfers ADD COLUMN file_size_bytes {column_type}"))
    try:
        with engine.begin() as connection:
            connection.execute(text("UPDATE transfers SET file_size_bytes = 1024 WHERE file_size_bytes IS NULL"))
    except Exception:
        pass


def _ensure_user_last_login_column() -> None:
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        return
    columns = {column["name"] for column in inspector.get_columns("users")}
    if "last_login_at" in columns:
        return
    column_type = "DATETIME" if db_url.startswith("sqlite") else "TIMESTAMP"
    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE users ADD COLUMN last_login_at {column_type}"))


def _ensure_activity_logs_table() -> None:
    inspector = inspect(engine)
    if "activity_logs" not in inspector.get_table_names():
        Base.metadata.tables["activity_logs"].create(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
