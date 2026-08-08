import json
import secrets
from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.campaign import Campaign
from app.models.provenance import LedgerEntry, ProvenanceSource, ProvenanceToken
from app.services.provenance_hashing import (
    canonical_json,
    content_hash,
    ledger_entry_hash,
    sha3_512_text,
)

DEFAULT_SOURCE_ID = "apad_system"
CAMPAIGN_CREATIVE_STAGE = "campaign_creative_intake"


def _stable_timestamp(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo:
        value = value.astimezone(timezone.utc).replace(tzinfo=None)
    return value.isoformat()


def ensure_source(
    db: Session,
    source_id: str = DEFAULT_SOURCE_ID,
    *,
    name: str | None = None,
    source_type: str = "system",
) -> ProvenanceSource:
    source = db.query(ProvenanceSource).filter(ProvenanceSource.source_id == source_id).first()
    if source:
        return source

    source = ProvenanceSource(
        source_id=source_id,
        name=name or source_id.replace("_", " ").title(),
        source_type=source_type,
    )
    db.add(source)
    db.flush()
    return source


def token_record_payload(token: ProvenanceToken) -> dict[str, Any]:
    transform_meta = {}
    if token.transform_meta_json:
        transform_meta = json.loads(token.transform_meta_json)

    return {
        "token_id": token.token_id,
        "content_hash": token.content_hash,
        "parent_token_id": token.parent_token_id,
        "source_id": token.source_id,
        "stage": token.stage,
        "asset_ref": token.asset_ref,
        "related_entity_type": token.related_entity_type,
        "related_entity_id": token.related_entity_id,
        "transform_meta": transform_meta,
        "timestamp": _stable_timestamp(token.created_at),
        "sig_classical": token.sig_classical,
        "sig_pqc": token.sig_pqc,
        "schema_version": token.schema_version,
    }


def hash_token_record(token: ProvenanceToken) -> str:
    return sha3_512_text(canonical_json(token_record_payload(token)))


def _latest_ledger_entry(db: Session) -> LedgerEntry | None:
    return db.query(LedgerEntry).order_by(LedgerEntry.position.desc()).first()


def append_ledger_entry(db: Session, token: ProvenanceToken) -> LedgerEntry:
    latest = _latest_ledger_entry(db)
    position = latest.position + 1 if latest else 1
    previous_hash = latest.entry_hash if latest else None
    record_hash = hash_token_record(token)
    entry_hash = ledger_entry_hash(
        position=position,
        token_id=token.token_id,
        record_hash=record_hash,
        previous_hash=previous_hash,
    )
    entry = LedgerEntry(
        position=position,
        token_id=token.token_id,
        record_hash=record_hash,
        previous_hash=previous_hash,
        entry_hash=entry_hash,
    )
    db.add(entry)
    token.ledger_anchor = f"ledger:{entry_hash}"
    db.flush()
    return entry


def create_provenance_token(
    db: Session,
    *,
    content_value: Any,
    source_id: str = DEFAULT_SOURCE_ID,
    stage: str,
    parent_token_id: str | None = None,
    asset_ref: str | None = None,
    related_entity_type: str | None = None,
    related_entity_id: int | None = None,
    transform_meta: dict[str, Any] | None = None,
    sig_classical: str | None = None,
    sig_pqc: str | None = None,
    commit: bool = True,
) -> ProvenanceToken:
    ensure_source(db, source_id)
    if parent_token_id:
        parent = (
            db.query(ProvenanceToken)
            .filter(ProvenanceToken.token_id == parent_token_id)
            .first()
        )
        if not parent:
            raise HTTPException(status_code=404, detail="Parent provenance token not found")

    token = ProvenanceToken(
        token_id=f"apt_{secrets.token_hex(16)}",
        content_hash=content_hash(content_value),
        parent_token_id=parent_token_id,
        source_id=source_id,
        stage=stage,
        asset_ref=asset_ref,
        related_entity_type=related_entity_type,
        related_entity_id=related_entity_id,
        transform_meta_json=canonical_json(transform_meta or {}),
        sig_classical=sig_classical,
        sig_pqc=sig_pqc,
        created_at=datetime.now(timezone.utc),
    )
    db.add(token)
    db.flush()
    append_ledger_entry(db, token)
    if commit:
        db.commit()
        db.refresh(token)
    return token


def campaign_creative_payload(campaign: Campaign) -> dict[str, Any]:
    return {
        "campaign_id": campaign.id,
        "name": campaign.name,
        "title_template": campaign.title_template,
        "description": campaign.description,
        "image_url": campaign.image_url,
        "creative_url": campaign.creative_url,
        "creative_type": campaign.creative_type,
        "min_watch_seconds": campaign.min_watch_seconds,
        "promo_suffix": campaign.promo_suffix,
    }


def get_campaign_provenance_token(
    db: Session, campaign_id: int
) -> ProvenanceToken | None:
    return (
        db.query(ProvenanceToken)
        .filter(
            ProvenanceToken.related_entity_type == "campaign",
            ProvenanceToken.related_entity_id == campaign_id,
            ProvenanceToken.stage == CAMPAIGN_CREATIVE_STAGE,
        )
        .order_by(ProvenanceToken.id.desc())
        .first()
    )


def ensure_campaign_creative_token(
    db: Session,
    campaign: Campaign,
    *,
    source_id: str = DEFAULT_SOURCE_ID,
) -> ProvenanceToken:
    existing = get_campaign_provenance_token(db, campaign.id)
    if existing:
        return existing

    return create_provenance_token(
        db,
        content_value=campaign_creative_payload(campaign),
        source_id=source_id,
        stage=CAMPAIGN_CREATIVE_STAGE,
        asset_ref=campaign.creative_url,
        related_entity_type="campaign",
        related_entity_id=campaign.id,
        transform_meta={
            "tool": "apad_campaign_admin",
            "image_url": campaign.image_url,
            "creative_type": campaign.creative_type,
        },
    )
