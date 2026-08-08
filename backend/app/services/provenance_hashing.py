import hashlib
import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any


def _json_default(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def canonical_json(value: Any) -> str:
    return json.dumps(
        value,
        default=_json_default,
        ensure_ascii=True,
        separators=(",", ":"),
        sort_keys=True,
    )


def sha3_512_text(value: str) -> str:
    digest = hashlib.sha3_512(value.encode("utf-8")).hexdigest()
    return f"sha3-512:{digest}"


def content_hash(value: Any) -> str:
    if isinstance(value, bytes):
        digest = hashlib.sha3_512(value).hexdigest()
        return f"sha3-512:{digest}"
    if isinstance(value, str):
        return sha3_512_text(value)
    return sha3_512_text(canonical_json(value))


def ledger_entry_hash(
    *, position: int, token_id: str, record_hash: str, previous_hash: str | None
) -> str:
    return sha3_512_text(
        canonical_json(
            {
                "position": position,
                "previous_hash": previous_hash,
                "record_hash": record_hash,
                "token_id": token_id,
            }
        )
    )
