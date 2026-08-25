import type { LineWebhookEvent, LineWebhookEventSource, MediaQueueMessage } from './types';

export function conversationIdFor(source: LineWebhookEventSource | undefined): string | null {
  if (!source) return null;
  if (source.type === 'user' && source.userId) return `user:${source.userId}`;
  if (source.type === 'group' && source.groupId) return `group:${source.groupId}`;
  if (source.type === 'room' && source.roomId) return `room:${source.roomId}`;
  return null;
}

export interface PreparedStatements {
  eventInsert: D1PreparedStatement[];
  messageInsert: D1PreparedStatement[];
  unsendUpdate: D1PreparedStatement[];
  conversationUpsert: D1PreparedStatement[];
  followUpdate: D1PreparedStatement[];
}

/**
 * Builds the D1 statements needed to persist one webhook delivery's events,
 * plus the queue messages (media downloads, profile fetches) that must be
 * enqueued after the D1 batch commits successfully.
 */
export function prepareEventStatements(
  db: D1Database,
  deliveryId: number,
  events: LineWebhookEvent[],
  receivedAt: number,
): { statements: D1PreparedStatement[]; queueMessages: MediaQueueMessage[] } {
  const statements: D1PreparedStatement[] = [];
  const queueMessages: MediaQueueMessage[] = [];
  const touchedConversations = new Map<
    string,
    { sourceType: string; lineUserId: string | null; messageCount: number }
  >();

  for (const event of events) {
    const conversationId = conversationIdFor(event.source);
    if (!conversationId) continue; // beacon/accountLink events etc. without a user source — skip normalization, still in raw audit

    if (!touchedConversations.has(conversationId)) {
      touchedConversations.set(conversationId, {
        sourceType: event.source!.type,
        lineUserId: event.source!.userId ?? null,
        messageCount: 0,
      });
    }
    if (event.type === 'message') {
      touchedConversations.get(conversationId)!.messageCount += 1;
    }

    statements.push(
      db
        .prepare(
          `INSERT OR IGNORE INTO events
             (webhook_event_id, delivery_id, event_type, mode, is_redelivery,
              occurred_at, conversation_id, source_type, source_user_id, raw_event, received_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          event.webhookEventId,
          deliveryId,
          event.type,
          event.mode ?? null,
          event.deliveryContext.isRedelivery ? 1 : 0,
          event.timestamp,
          conversationId,
          event.source!.type,
          event.source!.userId ?? null,
          JSON.stringify(event),
          receivedAt,
        ),
    );

    if (event.type === 'message') {
      const msg = (event as any).message;
      const attachmentKind = ['image', 'video', 'audio', 'file'].includes(msg.type)
        ? (msg.type as 'image' | 'video' | 'audio' | 'file')
        : null;

      statements.push(
        db
          .prepare(
            `INSERT OR IGNORE INTO messages
               (message_id, webhook_event_id, conversation_id, direction, actor, sender_user_id,
                message_type, text, quoted_message_id, payload, occurred_at, media_status, created_at)
             VALUES (?, ?, ?, 'inbound', 'user', ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            msg.id,
            event.webhookEventId,
            conversationId,
            event.source!.userId ?? null,
            msg.type,
            msg.text ?? null,
            msg.quotedMessageId ?? null,
            JSON.stringify(msg),
            event.timestamp,
            attachmentKind ? 'pending' : null,
            receivedAt,
          ),
      );

      if (attachmentKind) {
        const isExternal = msg.contentProvider?.type === 'external';
        statements.push(
          db
            .prepare(
              `INSERT OR IGNORE INTO attachments
                 (message_id, kind, content_provider, external_url, content_type, byte_size, file_name, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            )
            .bind(
              msg.id,
              attachmentKind,
              msg.contentProvider?.type ?? 'line',
              msg.contentProvider?.originalContentUrl ?? null,
              null,
              msg.fileSize ?? null,
              msg.fileName ?? null,
              isExternal ? 'skipped' : 'pending',
            ),
        );

        if (!isExternal) {
          queueMessages.push({ kind: 'attachment', messageId: msg.id, attachmentKind });
        }
      }
    }

    if (event.type === 'unsend') {
      const unsendMessageId = (event as any).unsend.messageId;
      statements.push(
        db
          .prepare(`UPDATE messages SET is_unsent = 1, unsent_at = ? WHERE message_id = ?`)
          .bind(event.timestamp, unsendMessageId),
      );
    }

    if (event.type === 'follow' || event.type === 'unfollow') {
      statements.push(
        db
          .prepare(
            `INSERT INTO conversations (conversation_id, source_type, line_user_id, first_event_at, last_event_at, is_following)
             VALUES (?, ?, ?, ?, ?, ?)
             ON CONFLICT(conversation_id) DO UPDATE SET is_following = excluded.is_following, last_event_at = excluded.last_event_at`,
          )
          .bind(
            conversationId,
            event.source!.type,
            event.source!.userId ?? null,
            event.timestamp,
            event.timestamp,
            event.type === 'follow' ? 1 : 0,
          ),
      );
    }
  }

  for (const [conversationId, info] of touchedConversations) {
    statements.push(
      db
        .prepare(
          `INSERT INTO conversations (conversation_id, source_type, line_user_id, first_event_at, last_event_at, message_count)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(conversation_id) DO UPDATE SET
             last_event_at = MAX(conversations.last_event_at, excluded.last_event_at),
             first_event_at = MIN(COALESCE(conversations.first_event_at, excluded.first_event_at), excluded.first_event_at),
             message_count = conversations.message_count + excluded.message_count`,
        )
        .bind(conversationId, info.sourceType, info.lineUserId, receivedAt, receivedAt, info.messageCount),
    );

    if (info.lineUserId) {
      queueMessages.push({ kind: 'profile', conversationId, lineUserId: info.lineUserId });
    }
  }

  return { statements, queueMessages };
}
