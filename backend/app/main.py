from contextlib import asynccontextmanager
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import SessionLocal, init_db, reset_entire_system
from app.middleware.errors import register_exception_handlers
from app.models import User
from app.routers import admin, auth, transfers
from app.utils.security import hash_password


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fully wipe database tables, registered users, and blobs on startup/redeploy if reset is enabled
    if settings.reset_database_on_startup:
        reset_entire_system()
    else:
        init_db(reset=False)
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
            else:
                admin_user.is_admin = True
                admin_user.hashed_password = hash_password(settings.admin_password)
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
    allow_origins=["*"] if "*" in settings.cors_origins else settings.cors_origins,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(transfers.router, prefix=settings.api_prefix)
app.include_router(admin.router, prefix=settings.api_prefix)

# Fallback inclusion without prefix for reverse proxies or clients without /api/v1
if settings.api_prefix:
    app.include_router(auth.router)
    app.include_router(transfers.router)
    app.include_router(admin.router)


@app.get("/health")
@app.get(f"{settings.api_prefix}/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/reset-database")
@app.post("/emergency-reset")
@app.post(f"{settings.api_prefix}/reset-database")
@app.post(f"{settings.api_prefix}/emergency-reset")
@app.get("/reset-database")
@app.get("/emergency-reset")
@app.get(f"{settings.api_prefix}/emergency-reset")
def direct_emergency_reset() -> Dict[str, str]:
    """Top-level emergency reset endpoint to clear all tables and restore default admin."""
    return reset_entire_system()

