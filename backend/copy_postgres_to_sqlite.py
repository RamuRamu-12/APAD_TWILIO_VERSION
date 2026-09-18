"""Copy all tables from DATABASE_URL (Postgres/Neon) into local sqlite:///./apad.db."""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import MetaData, create_engine, inspect, select, text

BACKEND_DIR = Path(__file__).resolve().parent
os.chdir(BACKEND_DIR)
sys.path.insert(0, str(BACKEND_DIR))


def _read_database_url() -> str:
    env_path = BACKEND_DIR / ".env"
    if not env_path.exists():
        return (os.getenv("DATABASE_URL") or "").strip()
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or not line.startswith("DATABASE_URL="):
            continue
        return line.split("=", 1)[1].strip().strip('"').strip("'")
    return (os.getenv("DATABASE_URL") or "").strip()

TABLE_ORDER = [
    "users",
    "campaigns",
    "targeting_rules",
    "generated_tokens",
    "otp_logs",
    "ad_completions",
    "analytics_events",
]


def _normalize_src_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    parsed = urlparse(url)
    query = [
        (k, v)
        for k, v in parse_qsl(parsed.query, keep_blank_values=True)
        if k != "channel_binding"
    ]
    if "sslmode" not in {k for k, _ in query} and parsed.scheme.startswith("postgresql"):
        query.append(("sslmode", "require"))
    return urlunparse(parsed._replace(query=urlencode(query)))


def main() -> None:
    src_url = _read_database_url()
    if not src_url:
        raise SystemExit("DATABASE_URL is not set")
    if src_url.startswith("sqlite"):
        raise SystemExit("DATABASE_URL is already SQLite; nothing to copy")

    src_url = _normalize_src_url(src_url)
    sqlite_path = BACKEND_DIR / "apad.db"
    dst_url = f"sqlite:///{sqlite_path.as_posix()}"

    src_engine = create_engine(src_url, pool_pre_ping=True)
    with src_engine.connect() as conn:
        conn.execute(text("SELECT 1"))

    src_insp = inspect(src_engine)
    src_tables = set(src_insp.get_table_names())
    if not src_tables:
        raise SystemExit("Source database has no tables")

    if sqlite_path.exists():
        bak = BACKEND_DIR / "apad.db.bak"
        shutil.copy2(sqlite_path, bak)
        sqlite_path.unlink()
        print(f"Backed up existing SQLite file to {bak.name}")

    from app.database import Base
    from app import models  # noqa: F401

    dst_engine = create_engine(dst_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=dst_engine)

    src_meta = MetaData()
    reflect_names = [t for t in TABLE_ORDER if t in src_tables]
    extra = sorted(src_tables - set(TABLE_ORDER))
    reflect_names.extend(extra)
    src_meta.reflect(bind=src_engine, only=reflect_names)

    dst_meta = MetaData()
    dst_meta.reflect(bind=dst_engine)

    copied: list[str] = []
    with dst_engine.begin() as dst_conn:
        dst_conn.execute(text("PRAGMA foreign_keys=OFF"))
        for name in reflect_names:
            if name not in dst_meta.tables:
                print(f"skip {name} (not in SQLite schema)")
                continue
            src_table = src_meta.tables[name]
            dst_table = dst_meta.tables[name]
            common = [c.name for c in dst_table.columns if c.name in src_table.c]
            if not common:
                print(f"skip {name} (no overlapping columns)")
                continue
            with src_engine.connect() as src_conn:
                rows = src_conn.execute(select(*[src_table.c[c] for c in common])).mappings().all()
            payload = [dict(row) for row in rows]
            for row in payload:
                for col in dst_table.columns:
                    if col.name in row:
                        continue
                    if col.nullable:
                        row[col.name] = None
                    elif getattr(col.type, "python_type", None) is bool:
                        row[col.name] = False
                    elif getattr(col.type, "python_type", None) is int:
                        row[col.name] = 0
            if payload:
                dst_conn.execute(dst_table.insert(), payload)
            copied.append(f"{name}={len(payload)}")
            print(f"copied {name}: {len(payload)} rows")

    print("SQLite ready:", sqlite_path)
    print("tables:", ", ".join(copied))


if __name__ == "__main__":
    main()
