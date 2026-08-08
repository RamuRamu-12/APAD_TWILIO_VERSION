import secrets

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.provenance import LedgerEntry, MerkleBatch
from app.services.merkle import build_merkle_root


def finalize_pending_batch(db: Session, *, limit: int = 1000) -> MerkleBatch:
    entries = (
        db.query(LedgerEntry)
        .filter(LedgerEntry.batch_id.is_(None))
        .order_by(LedgerEntry.position.asc())
        .limit(limit)
        .all()
    )
    if not entries:
        raise HTTPException(status_code=404, detail="No pending ledger entries to batch")

    batch = MerkleBatch(
        batch_id=f"mb_{secrets.token_hex(12)}",
        merkle_root=build_merkle_root([entry.entry_hash for entry in entries]),
        entry_count=len(entries),
    )
    db.add(batch)
    db.flush()

    for entry in entries:
        entry.batch_id = batch.batch_id

    db.commit()
    db.refresh(batch)
    return batch
