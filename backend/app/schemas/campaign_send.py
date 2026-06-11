from pydantic import BaseModel, Field


class SendCampaignEmailRequest(BaseModel):
    campaign_id: int
    user_ids: list[int] = Field(..., min_length=1)


class SendCampaignEmailResult(BaseModel):
    user_id: int
    email: str | None = None
    status: str
    url: str | None = None
    message: str | None = None


class SendCampaignEmailResponse(BaseModel):
    sent: int
    skipped: int
    failed: int
    results: list[SendCampaignEmailResult]
