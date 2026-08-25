import { handleWebhook } from './webhook';
import { handleReadApi } from './read-api';
import { handleOutboundMessage } from './internal';
import { processMediaQueueBatch } from './media';
import type { Env, MediaQueueMessage } from './types';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/line/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    if (url.pathname === '/internal/messages/outbound') {
      return handleOutboundMessage(request, env);
    }

    if (url.pathname === '/chat-history' || url.pathname.startsWith('/chat-history/')) {
      return handleReadApi(request, env, url);
    }

    return new Response('not found', { status: 404 });
  },

  async queue(batch: MessageBatch<MediaQueueMessage>, env: Env): Promise<void> {
    await processMediaQueueBatch(batch, env);
  },
};
