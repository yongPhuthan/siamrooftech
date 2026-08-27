export interface Env {
  CHAT_DB: D1Database;
  CHAT_MEDIA: R2Bucket;
  MEDIA_QUEUE: Queue<MediaQueueMessage>;
  ADS_QUEUE: Queue<AdsSyncQueueMessage>;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  CHAT_HISTORY_READ_TOKEN: string;
  CHAT_HISTORY_WRITE_TOKEN: string;
  LEADS_INTAKE_TOKEN: string;
  MEDIA_MAX_BYTES: string;
  // Google Ads Data Manager sync (see ads-sync.ts)
  ADS_SYNC_MODE: 'dry_run' | 'live';
  ADS_CUSTOMER_ID: string;
  ADS_CONVERSION_ACTION_ID: string;
  GOOGLE_SA_CLIENT_EMAIL: string;
  GOOGLE_SA_PRIVATE_KEY: string;
}

export type MediaQueueMessage =
  | {
      kind: 'attachment';
      messageId: string;
      attachmentKind: 'image' | 'video' | 'audio' | 'file';
    }
  | {
      kind: 'profile';
      conversationId: string;
      lineUserId: string;
    };

export interface AdsSyncQueueMessage {
  jobId: string;
}

// --- LINE webhook payload shapes (subset actually consumed) ---

export interface LineWebhookBody {
  destination: string;
  events: LineWebhookEvent[];
}

export interface LineWebhookEventSource {
  type: 'user' | 'group' | 'room';
  userId?: string;
  groupId?: string;
  roomId?: string;
}

interface LineWebhookEventBase {
  type: string;
  mode?: 'active' | 'standby';
  timestamp: number;
  source?: LineWebhookEventSource;
  webhookEventId: string;
  deliveryContext: { isRedelivery: boolean };
  replyToken?: string;
}

export interface LineMessageEventMessage {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
  text?: string;
  quoteToken?: string;
  quotedMessageId?: string;
  fileName?: string;
  fileSize?: number;
  contentProvider?: { type: 'line' | 'external'; originalContentUrl?: string };
  title?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  packageId?: string;
  stickerId?: string;
}

export interface LineMessageEvent extends LineWebhookEventBase {
  type: 'message';
  message: LineMessageEventMessage;
}

export interface LineUnsendEvent extends LineWebhookEventBase {
  type: 'unsend';
  unsend: { messageId: string };
}

export interface LineFollowEvent extends LineWebhookEventBase {
  type: 'follow';
}

export interface LineUnfollowEvent extends LineWebhookEventBase {
  type: 'unfollow';
}

export type LineWebhookEvent =
  | LineMessageEvent
  | LineUnsendEvent
  | LineFollowEvent
  | LineUnfollowEvent
  | (LineWebhookEventBase & { type: Exclude<string, 'message' | 'unsend' | 'follow' | 'unfollow'> });

// --- D1 row shapes ---

export interface MessageRow {
  message_id: string;
  webhook_event_id: string | null;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  actor: 'user' | 'bot';
  sender_user_id: string | null;
  message_type: string;
  text: string | null;
  quoted_message_id: string | null;
  payload: string;
  occurred_at: number;
  is_unsent: number;
  unsent_at: number | null;
  edited_at: number | null;
  media_status: string | null;
  created_at: number;
}

export interface AttachmentRow {
  message_id: string;
  kind: string;
  content_provider: string;
  external_url: string | null;
  r2_key: string | null;
  preview_r2_key: string | null;
  content_type: string | null;
  byte_size: number | null;
  file_name: string | null;
  sha256: string | null;
  status: string;
  attempts: number;
  last_error: string | null;
  fetched_at: number | null;
}

export interface ConversationRow {
  conversation_id: string;
  source_type: string;
  line_user_id: string | null;
  display_name: string | null;
  picture_url: string | null;
  profile_fetched_at: number | null;
  first_event_at: number | null;
  last_event_at: number | null;
  message_count: number;
  is_following: number | null;
}

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quoted'
  | 'won'
  | 'lost'
  | 'disqualified';

export type LeadPersona = 'homeowner' | 'procurement' | 'contractor';

export type AdsState = 'not_sent' | 'sent' | 'restated' | 'failed' | 'skipped';

export interface LeadRow {
  lead_id: string;
  ref_code: string;
  created_at: number;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  lead_persona: LeadPersona | null;
  lead_quality_score: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  srt_campaignid: string | null;
  srt_adgroupid: string | null;
  srt_keyword: string | null;
  srt_matchtype: string | null;
  srt_device: string | null;
  landing_page: string | null;
  attribution_raw: string | null;
  conversation_id: string | null;
  matched_at: number | null;
  match_method: 'ref_code' | 'manual' | null;
  status: LeadStatus;
  status_updated_at: number | null;
  persona_value: number | null;
  estimated_value: number | null;
  actual_value: number | null;
  currency: string;
  ads_state: AdsState;
  ads_last_value: number | null;
  ads_last_sent_at: number | null;
  ads_last_error: string | null;
  notes: string | null;
}

export interface LeadEventRow {
  id: number;
  lead_id: string;
  at: number;
  actor: string;
  kind: 'match' | 'status_change' | 'value_change' | 'ads_sync';
  from_value: string | null;
  to_value: string | null;
  reason: string | null;
  payload: string | null;
}

export interface AdsSyncJobRow {
  job_id: string;
  lead_id: string;
  created_at: number;
  kind: 'initial' | 'restatement';
  conversion_value: number;
  currency: string;
  mode: 'dry_run' | 'live';
  state: 'pending' | 'succeeded' | 'failed';
  attempts: number;
  request_payload: string | null;
  response_body: string | null;
  error: string | null;
  completed_at: number | null;
}
