from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import SessionLocal, init_db
from app.middleware.errors import register_exception_handlers
from app.models import User
from app.routers import admin, auth, transfers
from app.utils.security import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB tables
    init_db()
    
    # Seed admin user if not existing
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == settings.admin_username).first()
        if not admin_user:
            admin_user = User(
                username=settings.admin_username,
                email=settings.admin_email,
                hashed_password=hash_password(settings.admin_password),
                long_term_public_key="SYSTEM_ADMIN_PUBKEY",
                is_admin=True,
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="REST API for secure, end-to-end encrypted file sharing.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(transfers.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)


@app.get("/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}

