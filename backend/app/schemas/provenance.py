from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ProvenanceIntakeRequest(BaseModel):
    campaign_id: int | None = None
    content_value: Any | None = None
    source_id: str = "apad_system"
    stage: str = "intake"
    asset_ref: str | None = None
    transform_meta: dict[str, Any] = Field(default_factory=dict)
    sig_classical: str | None = None
    sig_pqc: str | None = None


class ProvenanceTransformRequest(BaseModel):
    parent_token_id: str
    content_value: Any
    source_id: str = "apad_system"
    stage: str
    asset_ref: str | None = None
    transform_meta: dict[str, Any] = Field(default_factory=dict)
    sig_classical: str | None = None
    sig_pqc: str | None = None


class ProvenanceVerifyRequest(BaseModel):
    content_value: Any | None = None


class ProvenanceTokenResponse(BaseModel):
    token_id: str
    content_hash: str
    parent_token_id: str | None
    source_id: str
    stage: str
    asset_ref: str | None
    related_entity_type: str | None
    related_entity_id: int | None
    transform_meta: dict[str, Any]
    sig_classical: str | None
    sig_pqc: str | None
    ledger_anchor: str | None
    schema_version: str
    created_at: datetime


class ProvenanceLineageResponse(BaseModel):
    token_id: str
    lineage: list[ProvenanceTokenResponse]


class CampaignProvenanceResponse(BaseModel):
    campaign_id: int
    campaign_name: str
    creative_url: str
    image_url: str
    provenance_token: ProvenanceTokenResponse | None


class ProvenanceVerifyResponse(BaseModel):
    token_id: str
    valid: bool
    errors: list[str]
    content_hash: str
    ledger_anchor: str | None
    ledger_position: int | None


class MerkleBatchResponse(BaseModel):
    batch_id: str
    merkle_root: str
    entry_count: int
    anchor_status: str
    anchor_provider: str | None
    anchor_tx_id: str | None
    anchored_at: datetime | None
    created_at: datetime
