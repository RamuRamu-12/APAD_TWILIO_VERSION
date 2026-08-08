from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.provenance import LedgerEntry, ProvenanceToken
from app.services.provenance_hashing import content_hash, ledger_entry_hash
from app.services.provenance_tokenizer import hash_token_record


def get_token_or_404(db: Session, token_id: str) -> ProvenanceToken:
    token = db.query(ProvenanceToken).filter(ProvenanceToken.token_id == token_id).first()
    if not token:
        raise HTTPException(status_code=404, detail="Provenance token not found")
    return token


def get_lineage(db: Session, token_id: str) -> list[ProvenanceToken]:
    lineage: list[ProvenanceToken] = []
    seen: set[str] = set()
    cursor = get_token_or_404(db, token_id)

    while cursor:
        if cursor.token_id in seen:
            raise HTTPException(status_code=409, detail="Cycle detected in provenance lineage")
        seen.add(cursor.token_id)
        lineage.append(cursor)
        if not cursor.parent_token_id:
            break
        cursor = get_token_or_404(db, cursor.parent_token_id)

    return lineage


def _verify_ledger_chain(db: Session) -> list[str]:
    errors: list[str] = []
    entries = db.query(LedgerEntry).order_by(LedgerEntry.position.asc()).all()
    previous_hash: str | None = None

    for expected_position, entry in enumerate(entries, start=1):
        if entry.position != expected_position:
            errors.append(f"Ledger position gap at {entry.position}")
        if entry.previous_hash != previous_hash:
            errors.append(f"Previous hash mismatch at ledger position {entry.position}")

        expected_hash = ledger_entry_hash(
            position=entry.position,
            token_id=entry.token_id,
            record_hash=entry.record_hash,
            previous_hash=entry.previous_hash,
        )
        if entry.entry_hash != expected_hash:
            errors.append(f"Entry hash mismatch at ledger position {entry.position}")

        previous_hash = entry.entry_hash

    return errors


def verify_token(
    db: Session,
    token_id: str,
    *,
    content_value: Any | None = None,
) -> dict[str, Any]:
    token = get_token_or_404(db, token_id)
    entry = (
        db.query(LedgerEntry).filter(LedgerEntry.token_id == token.token_id).first()
    )
    errors: list[str] = []

    if not entry:
        errors.append("Missing ledger entry")
    else:
        expected_record_hash = hash_token_record(token)
        if entry.record_hash != expected_record_hash:
            errors.append("Token record hash does not match ledger record hash")

    if token.parent_token_id:
        parent = (
            db.query(ProvenanceToken)
            .filter(ProvenanceToken.token_id == token.parent_token_id)
            .first()
        )
        if not parent:
            errors.append("Parent provenance token is missing")

    if content_value is not None:
        supplied_hash = content_hash(content_value)
        if supplied_hash != token.content_hash:
            errors.append("Supplied content does not match token content hash")

    errors.extend(_verify_ledger_chain(db))

    return {
        "token_id": token.token_id,
        "valid": not errors,
        "errors": errors,
        "content_hash": token.content_hash,
        "ledger_anchor": token.ledger_anchor,
        "ledger_position": entry.position if entry else None,
    }
