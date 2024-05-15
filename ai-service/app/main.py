from fastapi import FastAPI

from app.routers import extraction, health


def create_app() -> FastAPI:
    app = FastAPI(title="Productivity Assistant AI", version="0.1.0")
    app.include_router(health.router)
    app.include_router(extraction.router)
    return app


app = create_app()
