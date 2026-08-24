from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.errors import register_exception_handlers
from app.routers import admin, auth, transfers

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="REST API for secure, end-to-end encrypted file sharing.",
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
