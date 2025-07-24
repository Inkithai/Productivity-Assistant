import secrets

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import assistant, extraction, health, planner, prioritization, search, summarization


def create_app() -> FastAPI:
    app = FastAPI(title="Productivity Assistant AI", version="0.1.0")

    @app.middleware("http")
    async def verify_service_token(request: Request, call_next):
        if request.url.path.startswith("/api/v1"):
            provided = request.headers.get("x-service-token", "")
            expected = get_settings().ai_service_token
            if not secrets.compare_digest(provided, expected):
                return JSONResponse(status_code=401, content={"detail": "invalid service token"})
        return await call_next(request)

    app.include_router(health.router)
    app.include_router(extraction.router, prefix="/api/v1")
    app.include_router(prioritization.router, prefix="/api/v1")
    app.include_router(summarization.router, prefix="/api/v1")
    app.include_router(assistant.router, prefix="/api/v1")
    app.include_router(search.router, prefix="/api/v1")
    app.include_router(planner.router, prefix="/api/v1")
    return app


app = create_app()
