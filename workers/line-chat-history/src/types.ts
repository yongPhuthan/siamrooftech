export interface Env {
  CHAT_DB: D1Database;
  CHAT_MEDIA: R2Bucket;
  MEDIA_QUEUE: Queue<MediaQueueMessage>;
  LINE_CHANNEL_SECRET: string;
  LINE_CHANNEL_ACCESS_TOKEN: string;
  CHAT_HISTORY_READ_TOKEN: string;
  CHAT_HISTORY_WRITE_TOKEN: string;
  MEDIA_MAX_BYTES: string;
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
