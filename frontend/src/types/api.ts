export interface User {
  id: number;
  name: string;
  mobile: string;
  email: string;
  age: number;
  gender: string;
  area: string;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export type AdGate = "login" | "otp_request" | "email";

export interface AdWatchPayload {
  gate: AdGate;
  campaign_id: number;
  campaign_name: string;
  user_mobile: string;
  user_name: string;
  personalized_title: string;
  description: string;
  image_url: string;
  creative_url: string;
  creative_type: string;
  min_watch_seconds: number;
  provenance_token_id?: string | null;
}

export interface SendOtpResponse {
  masked_mobile: string;
  expires_in: number;
  message: string;
  otp_for_screen?: string | null;
  sms_preview?: string | null;
}

export interface TargetingRule {
  id: number;
  min_age: number;
  max_age: number;
  gender: string;
  area: string;
}

export interface Campaign {
  id: number;
  name: string;
  title_template: string;
  description: string;
  image_url: string;
  creative_url: string;
  creative_type: string;
  min_watch_seconds: number;
  promo_suffix: string;
  priority: number;
  is_active: boolean;
  targeting_rules?: TargetingRule[];
}

export interface CampaignRecommendation {
  id: number;
  name: string;
  personalized_title: string;
}

export interface TokenLink {
  token: string;
  user_id: number;
  user_name: string;
  url: string;
  provenance_token_id?: string | null;
}

export interface AnalyticsRow {
  event_type: string;
  count: number;
}

export interface UserSearchParams {
  min_age?: number;
  max_age?: number;
  gender?: string;
  area?: string;
  q?: string;
}

export interface SendCampaignEmailRequest {
  campaign_id: number;
  user_ids: number[];
}

export interface SendCampaignEmailResult {
  user_id: number;
  email?: string | null;
  status: string;
  url?: string | null;
  message?: string | null;
}

export interface SendCampaignEmailResponse {
  sent: number;
  skipped: number;
  failed: number;
  results: SendCampaignEmailResult[];
}

export interface ProvenanceToken {
  token_id: string;
  content_hash: string;
  parent_token_id?: string | null;
  source_id: string;
  stage: string;
  asset_ref?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: number | null;
  transform_meta: Record<string, unknown>;
  sig_classical?: string | null;
  sig_pqc?: string | null;
  ledger_anchor?: string | null;
  schema_version: string;
  created_at: string;
}

export interface CampaignProvenance {
  campaign_id: number;
  campaign_name: string;
  creative_url: string;
  image_url: string;
  provenance_token?: ProvenanceToken | null;
}

export interface ProvenanceVerifyResult {
  token_id: string;
  valid: boolean;
  errors: string[];
  content_hash: string;
  ledger_anchor?: string | null;
  ledger_position?: number | null;
}

export interface ProvenanceLineage {
  token_id: string;
  lineage: ProvenanceToken[];
}

export interface MerkleBatch {
  batch_id: string;
  merkle_root: string;
  entry_count: number;
  anchor_status: string;
  anchor_provider?: string | null;
  anchor_tx_id?: string | null;
  anchored_at?: string | null;
  created_at: string;
}
