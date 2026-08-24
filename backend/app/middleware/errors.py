from __future__ import annotations

"""Set 3 – Centralized, non-revealing error handling (F.16)."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, message: str, status_code: int = 400, internal_detail: str | None = None):
        self.message = message
        self.status_code = status_code
        self.internal_detail = internal_detail


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        # TODO: log exc.internal_detail to Metadata / Log DB without exposing crypto material
        return JSONResponse(status_code=exc.status_code, content={"error": exc.message})

    @app.exception_handler(NotImplementedError)
    async def not_implemented_handler(_: Request, __: NotImplementedError) -> JSONResponse:
        return JSONResponse(status_code=501, content={"error": "Endpoint not yet implemented."})

    @app.exception_handler(Exception)
    async def generic_error_handler(_: Request, __: Exception) -> JSONResponse:
        return JSONResponse(status_code=500, content={"error": "An unexpected error occurred."})
