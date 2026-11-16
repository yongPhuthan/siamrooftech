import { handleCrmApi } from './crm-api';
import { dispatchCrmOutbox } from './crm-outbox';
import { purgeChatHistory } from './crm-retention';
import { reconcileUnmatched } from './crm';
import { handleWebhook } from './webhook';
import { handleReadApi } from './read-api';
import { handleLeadsApi } from './leads-api';
import { handleOutboundMessage } from './internal';
import { processMediaQueueBatch } from './media';
import { processAdsSyncQueueBatch } from './ads-sync';
import { processAdsDiagnostics } from './ads-sync';
import { handleChatApi } from './chat-api';
import { servePublicOutboundMedia } from './outbound';
import type { AdsSyncQueueMessage, Env, MediaQueueMessage } from './types';

export default {
  async fetch(request: Request, env: Env, ctx?: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/crm/') || url.pathname === '/internal/leads/intake') {
      const response = await handleCrmApi(request, env, url);
      if (response.ok && request.method === 'POST' && /^\/crm\/leads\/[^/]+\/(review|retry)$/.test(url.pathname)) {
        // Review/outbox has committed already. Queue failure cannot undo approval;
        // the scheduled dispatcher remains the recovery path.
        const wakeup = dispatchCrmOutbox(env).catch(() => console.error('CRM outbox wakeup failed'));
        if (ctx) ctx.waitUntil(wakeup);
        else await wakeup;
      }
      return response;
    }

    if (url.pathname === '/line/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }

    const publicMedia = /^\/chat-public\/media\/([^/]+)\/(original|preview)$/.exec(url.pathname);
    if (publicMedia && request.method === 'GET') {
      return servePublicOutboundMedia(env, publicMedia[1], publicMedia[2]);
    }

    if (url.pathname === '/chat/conversations' || url.pathname.startsWith('/chat/conversations/')) {
      return handleChatApi(request, env, url);
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
    if (batch.queue === 'line-ads-sync' || batch.queue === 'line-ads-sync-staging' || batch.queue === 'line-ads-sync-local') {
      await processAdsSyncQueueBatch(batch as MessageBatch<AdsSyncQueueMessage>, env);
      return;
    }
    if (!['line-media-fetch', 'line-media-fetch-staging', 'line-media-fetch-local'].includes(batch.queue)) throw new Error('unrecognized queue');
    await processMediaQueueBatch(batch as MessageBatch<MediaQueueMessage>, env);
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil((async () => {
      await processAdsDiagnostics(env);
      await dispatchCrmOutbox(env);
      await reconcileUnmatched(env);
      await purgeChatHistory(env);
    })());
  },
};
