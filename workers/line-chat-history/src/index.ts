import { handleWebhook } from './webhook';
import { handleReadApi } from './read-api';
import { handleLeadsApi } from './leads-api';
import { handleOutboundMessage } from './internal';
import { processMediaQueueBatch } from './media';
import { processAdsSyncQueueBatch } from './ads-sync';
import type { AdsSyncQueueMessage, Env, MediaQueueMessage } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/line/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    if (url.pathname === '/internal/messages/outbound') {
      return handleOutboundMessage(request, env);
    }

    if (url.pathname === '/internal/leads/intake' || url.pathname === '/leads' || url.pathname.startsWith('/leads/')) {
      return handleLeadsApi(request, env, url);
    }

    if (url.pathname === '/ads-sync/jobs') {
      return handleLeadsApi(request, env, url);
    }

    if (url.pathname === '/chat-history' || url.pathname.startsWith('/chat-history/')) {
      return handleReadApi(request, env, url);
    }

    return new Response('not found', { status: 404 });
  },

  async queue(batch: MessageBatch<MediaQueueMessage | AdsSyncQueueMessage>, env: Env): Promise<void> {
    if (batch.queue === 'line-ads-sync') {
      await processAdsSyncQueueBatch(batch as MessageBatch<AdsSyncQueueMessage>, env);
      return;
    }
    await processMediaQueueBatch(batch as MessageBatch<MediaQueueMessage>, env);
  },
};
