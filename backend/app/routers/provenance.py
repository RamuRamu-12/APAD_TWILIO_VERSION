import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_admin_user
from app.models.campaign import Campaign
from app.models.provenance import ProvenanceToken
from app.models.user import User
from app.schemas.provenance import (
    CampaignProvenanceResponse,
    MerkleBatchResponse,
    ProvenanceIntakeRequest,
    ProvenanceLineageResponse,
    ProvenanceTokenResponse,
    ProvenanceTransformRequest,
    ProvenanceVerifyRequest,
    ProvenanceVerifyResponse,
)
from app.services.provenance_batcher import finalize_pending_batch
from app.services.provenance_tokenizer import (
    create_provenance_token,
    ensure_campaign_creative_token,
    get_campaign_provenance_token,
)
from app.services.provenance_verifier import get_lineage, get_token_or_404, verify_token

router = APIRouter(prefix="/provenance", tags=["provenance"])


def _token_response(token: ProvenanceToken) -> ProvenanceTokenResponse:
    transform_meta = {}
    if token.transform_meta_json:
        transform_meta = json.loads(token.transform_meta_json)
    return ProvenanceTokenResponse(
        token_id=token.token_id,
        content_hash=token.content_hash,
        parent_token_id=token.parent_token_id,
        source_id=token.source_id,
        stage=token.stage,
        asset_ref=token.asset_ref,
        related_entity_type=token.related_entity_type,
        related_entity_id=token.related_entity_id,
        transform_meta=transform_meta,
        sig_classical=token.sig_classical,
        sig_pqc=token.sig_pqc,
        ledger_anchor=token.ledger_anchor,
        schema_version=token.schema_version,
        created_at=token.created_at,
    )


@router.post("/batches/finalize", response_model=MerkleBatchResponse)
def finalize_merkle_batch(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return finalize_pending_batch(db)


@router.get("/campaigns", response_model=list[CampaignProvenanceResponse])
def list_campaign_provenance(
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    campaigns = db.query(Campaign).order_by(Campaign.id.desc()).all()
    return [
        CampaignProvenanceResponse(
            campaign_id=campaign.id,
            campaign_name=campaign.name,
            creative_url=campaign.creative_url,
            image_url=campaign.image_url,
            provenance_token=(
                _token_response(token)
                if (token := get_campaign_provenance_token(db, campaign.id))
                else None
            ),
        )
        for campaign in campaigns
    ]


@router.post("/intake", response_model=ProvenanceTokenResponse)
def create_intake_token(
    data: ProvenanceIntakeRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    if data.campaign_id is not None:
        campaign = db.query(Campaign).filter(Campaign.id == data.campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        return _token_response(
            ensure_campaign_creative_token(db, campaign, source_id=data.source_id)
        )

    if data.content_value is None:
        raise HTTPException(
            status_code=400, detail="Provide content_value or campaign_id for intake"
        )

    token = create_provenance_token(
        db,
        content_value=data.content_value,
        source_id=data.source_id,
        stage=data.stage,
        asset_ref=data.asset_ref,
        transform_meta=data.transform_meta,
        sig_classical=data.sig_classical,
        sig_pqc=data.sig_pqc,
    )
    return _token_response(token)


@router.post("/transform", response_model=ProvenanceTokenResponse)
def create_transform_token(
    data: ProvenanceTransformRequest,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    token = create_provenance_token(
        db,
        content_value=data.content_value,
        source_id=data.source_id,
        stage=data.stage,
        parent_token_id=data.parent_token_id,
        asset_ref=data.asset_ref,
        transform_meta=data.transform_meta,
        sig_classical=data.sig_classical,
        sig_pqc=data.sig_pqc,
    )
    return _token_response(token)


@router.get("/tokens/{token_id}", response_model=ProvenanceTokenResponse)
def read_token(
    token_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return _token_response(get_token_or_404(db, token_id))


@router.get("/tokens/{token_id}/lineage", response_model=ProvenanceLineageResponse)
def read_lineage(
    token_id: str,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    return ProvenanceLineageResponse(
        token_id=token_id,
        lineage=[_token_response(token) for token in get_lineage(db, token_id)],
    )


@router.post("/tokens/{token_id}/verify", response_model=ProvenanceVerifyResponse)
def verify_provenance_token(
    token_id: str,
    data: ProvenanceVerifyRequest | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_admin_user),
):
    result = verify_token(
        db,
        token_id,
        content_value=data.content_value if data else None,
    )
    return ProvenanceVerifyResponse(**result)
