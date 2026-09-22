export interface User {
  id: number;
  name: string;
  mobile: string;
  email: string;
  age: number;
  gender: string;
  area: string;
  role: string;
  marketing_opt_in?: boolean;
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
  location_gate_video_id?: number | null;
  campaign_name: string;
  user_mobile: string;
  user_name: string;
  personalized_title: string;
  description: string;
  image_url: string;
  creative_url: string;
  creative_type: string;
  min_watch_seconds: number;
  location_name?: string | null;
}

export interface SendOtpResponse {
  masked_mobile: string;
  expires_in: number;
  message: string;
  otp_for_screen?: string | null;
  sms_preview?: string | null;
}

export interface GateVideo {
  id: number;
  area: string;
  youtube_url: string;
  title: string;
  min_watch_seconds: number;
  is_active: boolean;
}

export interface Location {
  id: number;
  name: string;
  is_active: boolean;
}

export interface GateVideoCatalog {
  locations: Location[];
  global_area_key: string;
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
  marketing_opt_in?: boolean;
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

export interface CampaignCreateResponse extends Campaign {
  email_send?: SendCampaignEmailResponse | null;
}
