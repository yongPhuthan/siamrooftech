export type LeadStage = 'site_visit_completed' | 'pending' | 'assessment' | 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost' | 'disqualified';

export interface GoogleHealth {
  state: string;
  label: string;
}

export interface ConversationSummary {
  conversation_id: string;
  display_name: string;
  picture_url: string | null;
  is_following: boolean | null;
  last_event_at: string | null;
  unread_count: number;
  latest_message: { id: string; type: string; text: string | null; direction: string; occurred_at: string } | null;
  active_lead: { id: string; ref_code: string; status: LeadStage } | null;
  google_health: GoogleHealth;
  attention_reason: string | null;
}

export interface ChatMessage {
  message_id: string;
  direction: 'inbound' | 'outbound';
  type: string;
  text: string | null;
  occurred_at: string;
  occurred_at_local: string;
  is_unsent: boolean;
  attachment: null | {
    kind: string;
    status: string;
    content_type: string | null;
    file_name: string | null;
    url: string | null;
    preview_url: string | null;
    external_url: string | null;
  };
  local_state?: 'pending' | 'failed' | 'unknown';
  local_preview?: string;
  client_key?: string;
  error?: string;
}

export interface LeadView {
  lead_id: string;
  ref_code: string;
  created_at: string;
  status: LeadStage;
  status_updated_at: string | null;
  attribution: Record<string, string | number | null>;
  match: { conversation_id: string | null; matched_at: string | null; match_method: 'ref_code' | 'manual' | null };
  value: { persona_value: number | null; estimated_value: number | null; actual_value: number | null; currency: string };
  ads_sync: { state: string; last_value: number | null; last_sent_at: string | null; last_error: string | null };
  notes: string | null;
}

export interface ConversationDetail {
  conversation: {
    conversation_id: string;
    display_name: string;
    picture_url: string | null;
    is_following: boolean | null;
    active_lead_id: string | null;
    google_health: GoogleHealth;
  };
  messages: ChatMessage[];
  receive_cursor: string | null;
  profile: {
    leads: LeadView[];
    unmatched_candidates: LeadView[];
    events: Array<Record<string, unknown>>;
    ads_jobs: Array<Record<string, any>>;
    ads_attempts: Array<Record<string, unknown>>;
  };
}

export interface ConversationsResponse {
  conversations: ConversationSummary[];
  pagination: { has_more: boolean; next_cursor: string | null };
}
