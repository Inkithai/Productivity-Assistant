from fastapi import FastAPI

from app.routers import extraction, health, prioritization, summarization


def create_app() -> FastAPI:
    app = FastAPI(title="Productivity Assistant AI", version="0.1.0")
    app.include_router(health.router)
    app.include_router(extraction.router, prefix="/api/v1")
    app.include_router(prioritization.router, prefix="/api/v1")
    app.include_router(summarization.router, prefix="/api/v1")
    return app


app = create_app()
