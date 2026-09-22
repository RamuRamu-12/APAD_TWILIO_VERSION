"""SQLAlchemy engine and session — SQLite (local) or PostgreSQL (Neon/production)."""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import get_settings


def _normalize_database_url(url: str) -> str:
    """SQLAlchemy 2 expects postgresql:// (not legacy postgres://)."""
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url


def _build_engine():
    settings = get_settings()
    url = _normalize_database_url(settings.database_url)

    connect_args: dict = {}
    engine_kwargs: dict = {}

    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    else:
        # Neon / Postgres: avoid stale connections on serverless poolers
        engine_kwargs["pool_pre_ping"] = True
        engine_kwargs["pool_recycle"] = 300
        engine_kwargs["pool_size"] = settings.db_pool_size
        engine_kwargs["max_overflow"] = settings.db_max_overflow

    return create_engine(url, connect_args=connect_args, **engine_kwargs)


settings = get_settings()
engine = _build_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _ensure_ad_completion_gate_column() -> None:
    from sqlalchemy import inspect, text

    insp = inspect(engine)
    if "ad_completions" not in insp.get_table_names():
        return
    columns = {col["name"] for col in insp.get_columns("ad_completions")}
    if "gate" in columns:
        return
    with engine.begin() as conn:
        conn.execute(
            text(
                "ALTER TABLE ad_completions ADD COLUMN gate VARCHAR(32) DEFAULT 'login'"
            )
        )


def _ensure_campaign_priority_column() -> None:
    from sqlalchemy import inspect, text

    insp = inspect(engine)
    if "campaigns" not in insp.get_table_names():
        return
    columns = {col["name"] for col in insp.get_columns("campaigns")}
    if "priority" in columns:
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE campaigns ADD COLUMN priority INTEGER DEFAULT 0"))


def _ensure_user_email_column() -> None:
    from sqlalchemy import inspect, text

    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        return
    columns = {col["name"] for col in insp.get_columns("users")}
    if "email" in columns:
        return
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR(255)"))
        conn.execute(
            text(
                "UPDATE users SET email = LOWER(mobile) || '@legacy.apad.app' "
                "WHERE email IS NULL OR email = ''"
            )
        )


def _migrate_mobiles_to_e164() -> None:
    from sqlalchemy import inspect, text

    from app.config import get_settings
    from app.models.user import User
    from app.utils.phone import normalize_mobile

    settings = get_settings()
    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        return

    if settings.is_postgres:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ALTER COLUMN mobile TYPE VARCHAR(20)"))

    db = SessionLocal()
    try:
        for user in db.query(User).all():
            if user.mobile.startswith("+"):
                continue
            digits = "".join(c for c in user.mobile if c.isdigit())
            if len(digits) == 10:
                new_mobile = f"+91{digits}"
            else:
                try:
                    new_mobile = normalize_mobile(user.mobile, settings.default_phone_region)
                except ValueError:
                    continue
            if new_mobile == user.mobile:
                continue
            conflict = (
                db.query(User)
                .filter(User.mobile == new_mobile, User.id != user.id)
                .first()
            )
            if conflict:
                continue
            user.mobile = new_mobile
        db.commit()
    finally:
        db.close()


def _ensure_user_marketing_opt_in_column() -> None:
    from sqlalchemy import inspect, text

    insp = inspect(engine)
    if "users" not in insp.get_table_names():
        return
    columns = {col["name"] for col in insp.get_columns("users")}
    if "marketing_opt_in" in columns and "marketing_consent_updated_at" in columns:
        return
    with engine.begin() as conn:
        if "marketing_opt_in" not in columns:
            # Postgres rejects BOOLEAN DEFAULT 0 (integer); FALSE works on Postgres and SQLite.
            conn.execute(
                text("ALTER TABLE users ADD COLUMN marketing_opt_in BOOLEAN DEFAULT FALSE")
            )
        if "marketing_consent_updated_at" not in columns:
            conn.execute(
                text("ALTER TABLE users ADD COLUMN marketing_consent_updated_at TIMESTAMP")
            )


def _ensure_ad_completion_gate_video_columns() -> None:
    from sqlalchemy import inspect, text

    insp = inspect(engine)
    if "ad_completions" not in insp.get_table_names():
        return
    columns = {col["name"] for col in insp.get_columns("ad_completions")}
    with engine.begin() as conn:
        if "location_gate_video_id" not in columns:
            conn.execute(
                text(
                    "ALTER TABLE ad_completions ADD COLUMN location_gate_video_id INTEGER"
                )
            )
        # SQLite cannot ALTER nullable easily; new DBs get nullable campaign_id from model.


def init_db() -> None:
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_campaign_priority_column()
    _ensure_ad_completion_gate_column()
    _ensure_ad_completion_gate_video_columns()
    _ensure_user_email_column()
    _ensure_user_marketing_opt_in_column()
    _migrate_mobiles_to_e164()


def check_db_connection() -> bool:
    """Return True if the database accepts a connection."""
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return True
