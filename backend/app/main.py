from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import check_db_connection, init_db, SessionLocal
from app.routers import (
    ads,
    analytics,
    auth,
    campaigns,
    location_gate_videos,
    locations,
    marketing,
    otp,
    preview,
    tokens,
    users,
)
from app.services.gate_video import seed_location_gate_videos
from app.services.location_service import seed_locations_if_empty
from app.seed import seed_demo_data

import logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    try:
        check_db_connection()
        logger.info(
            "Database connected (%s)",
            "PostgreSQL" if settings.is_postgres else "SQLite",
        )
    except Exception as exc:
        logger.error("Database connection failed: %s", exc)
        raise

    init_db()
    db = SessionLocal()
    try:
        seed_locations_if_empty(db)
        seed_location_gate_videos(db)
    finally:
        db.close()
    if settings.seed_demo_data:
        db = SessionLocal()
        try:
            seed_demo_data(db)
        finally:
            db.close()
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = settings.api_prefix
app.include_router(auth.router, prefix=api)
app.include_router(users.router, prefix=api)
app.include_router(campaigns.router, prefix=api)
app.include_router(location_gate_videos.router, prefix=api)
app.include_router(locations.router, prefix=api)
app.include_router(tokens.router, prefix=api)
app.include_router(ads.router, prefix=api)
app.include_router(otp.router, prefix=api)
app.include_router(analytics.router, prefix=api)
app.include_router(marketing.router, prefix=api)
app.include_router(preview.router)


@app.get("/health")
def health():
    db_ok = False
    try:
        db_ok = check_db_connection()
    except Exception:
        pass
    return {
        "status": "ok" if db_ok else "degraded",
        "app": settings.app_name,
        "database": "connected" if db_ok else "unavailable",
        "db_driver": "postgresql" if settings.is_postgres else "sqlite",
    }
