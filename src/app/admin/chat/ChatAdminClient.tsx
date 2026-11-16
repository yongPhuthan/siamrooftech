'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import imageCompression from 'browser-image-compression';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import { adminFetch } from '@/lib/admin-fetch';
import ChatThread from './ChatThread';
import ConversationList from './ConversationList';
import CustomerProfileDrawer from './CustomerProfileDrawer';
import type { ChatMessage, ConversationDetail, ConversationSummary, ConversationsResponse } from './types';
import { previewConversations, previewDetail } from './preview-fixture';

type RetryPayload = { kind: 'text'; text: string } | { kind: 'image'; original: File; preview: File };

export default function ChatAdminClient() {
  const preview = process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
  return preview ? <ChatWorkspace preview /> : <AdminAuthGate><ChatWorkspace /></AdminAuthGate>;
}

function ChatWorkspace({ preview = false }: { preview?: boolean }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>(preview ? previewConversations : []);
  const [selectedId, setSelectedId] = useState<string | null>(preview ? previewDetail.conversation.conversation_id : null);
  const [detail, setDetail] = useState<ConversationDetail | null>(preview ? previewDetail : null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const scrollPositions = useRef<Record<string, number>>({});
  const retryPayloads = useRef(new Map<string, RetryPayload>());
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const loadConversations = useCallback(async () => {
    if (preview) { setConversations(previewConversations); return; }
    const params = new URLSearchParams({ filter, limit: '80' });
    if (query.trim()) params.set('q', query.trim());
    const response = await adminFetch(`/api/admin/chat-proxy/chat/conversations?${params}`);
    if (!response.ok) throw new Error('โหลดรายการแชทไม่สำเร็จ');
    const data = await response.json() as ConversationsResponse;
    setConversations(data.conversations);
    setSelectedId((current) => current ?? data.conversations[0]?.conversation_id ?? null);
  }, [filter, preview, query]);

  const loadDetail = useCallback(async (conversationId: string, quiet = false) => {
    if (preview) { if (conversationId === previewDetail.conversation.conversation_id) setDetail(previewDetail); return; }
    if (!quiet) setLoadingDetail(true);
    try {
      const response = await adminFetch(`/api/admin/chat-proxy/chat/conversations/${encodeURIComponent(conversationId)}`);
      if (!response.ok) throw new Error('โหลดข้อความไม่สำเร็จ');
      const data = await response.json() as ConversationDetail;
      setDetail((current) => {
        if (!current || current.conversation.conversation_id !== conversationId) return data;
        const local = current.messages.filter((message) => message.local_state);
        const serverIds = new Set(data.messages.map((message) => message.message_id));
        return { ...data, messages: [...data.messages, ...local.filter((message) => !serverIds.has(message.message_id))] };
      });
      if (data.receive_cursor) {
        await adminFetch(`/api/admin/chat-proxy/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ cursor: data.receive_cursor }),
        });
        setConversations((items) => items.map((item) => item.conversation_id === conversationId ? { ...item, unread_count: 0 } : item));
      }
    } finally {
      if (!quiet) setLoadingDetail(false);
    }
  }, [preview]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLoadingList(true);
      loadConversations().catch((error) => console.error(error)).finally(() => setLoadingList(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId).catch((error) => console.error(error));
  }, [loadDetail, selectedId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      loadConversations().catch((error) => console.error(error));
      if (selectedId) loadDetail(selectedId, true).catch((error) => console.error(error));
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [loadConversations, loadDetail, selectedId]);

  function selectConversation(conversation: ConversationSummary) {
    setSelectedId(conversation.conversation_id);
    setMobileChatOpen(true);
    setProfileOpen(false);
  }

  function addOptimistic(conversationId: string, payload: RetryPayload, preview?: string): ChatMessage {
    const clientKey = crypto.randomUUID();
    retryPayloads.current.set(clientKey, payload);
    const message: ChatMessage = {
      message_id: `local:${clientKey}`,
      direction: 'outbound',
      type: payload.kind,
      text: payload.kind === 'text' ? payload.text : null,
      occurred_at: new Date().toISOString(),
      occurred_at_local: new Date().toISOString(),
      is_unsent: false,
      attachment: null,
      local_state: 'pending',
      local_preview: preview,
      client_key: clientKey,
    };
    setDetail((current) => current?.conversation.conversation_id === conversationId ? { ...current, messages: [...current.messages, message] } : current);
    return message;
  }

  async function transmit(conversationId: string, optimistic: ChatMessage, payload: RetryPayload) {
    const key = optimistic.client_key!;
    let body: BodyInit;
    const headers = new Headers({ 'idempotency-key': key });
    if (payload.kind === 'text') {
      headers.set('content-type', 'application/json');
      body = JSON.stringify({ text: payload.text });
    } else {
      const form = new FormData();
      form.append('original', payload.original);
      form.append('preview', payload.preview);
      body = form;
    }
    try {
      const response = await adminFetch(`/api/admin/chat-proxy/chat/conversations/${encodeURIComponent(conversationId)}/messages`, { method: 'POST', headers, body });
      const result = await response.json();
      if (!response.ok) {
        const state = result.delivery_state === 'unknown' ? 'unknown' : 'failed';
        setDetail((current) => current ? { ...current, messages: current.messages.map((message) => message.client_key === key ? { ...message, local_state: state, error: result.error } : message) } : current);
        return;
      }
      retryPayloads.current.delete(key);
      setDetail((current) => current ? { ...current, messages: current.messages.filter((message) => message.client_key !== key) } : current);
      await loadDetail(conversationId, true);
      if (optimistic.local_preview?.startsWith('blob:')) URL.revokeObjectURL(optimistic.local_preview);
      await loadConversations();
    } catch (error) {
      setDetail((current) => current ? { ...current, messages: current.messages.map((message) => message.client_key === key ? { ...message, local_state: 'unknown', error: String(error) } : message) } : current);
    }
  }

  async function sendText() {
    if (!selectedId || sending) return;
    const text = (drafts[selectedId] ?? '').trim();
    if (!text) return;
    setDrafts((items) => ({ ...items, [selectedId]: '' }));
    setSending(true);
    const payload: RetryPayload = { kind: 'text', text };
    const optimistic = addOptimistic(selectedId, payload);
    await transmit(selectedId, optimistic, payload);
    setSending(false);
  }

  async function sendImage(file: File) {
    if (!selectedId || sending) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) return window.alert('รองรับเฉพาะ JPEG และ PNG');
    if (file.size > 10 * 1024 * 1024) return window.alert('รูปต้นฉบับต้องไม่เกิน 10 MB');
    setSending(true);
    setUploadProgress(15);
    let previewUrl = '';
    try {
      const preview = await imageCompression(file, { maxSizeMB: 0.95, maxWidthOrHeight: 1600, useWebWorker: true, fileType: file.type });
      setUploadProgress(55);
      previewUrl = URL.createObjectURL(preview);
      const payload: RetryPayload = { kind: 'image', original: file, preview };
      const optimistic = addOptimistic(selectedId, payload, previewUrl);
      setUploadProgress(80);
      await transmit(selectedId, optimistic, payload);
      setUploadProgress(100);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'เตรียมรูปไม่สำเร็จ');
    } finally {
      window.setTimeout(() => setUploadProgress(null), 350);
      setSending(false);
    }
  }

  async function retry(message: ChatMessage) {
    if (!selectedId || !message.client_key) return;
    const oldPayload = retryPayloads.current.get(message.client_key);
    if (!oldPayload) return;
    retryPayloads.current.delete(message.client_key);
    setDetail((current) => current ? { ...current, messages: current.messages.filter((item) => item.message_id !== message.message_id) } : current);
    const optimistic = addOptimistic(selectedId, oldPayload, message.local_preview);
    await transmit(selectedId, optimistic, oldPayload);
  }

  const visibleDetail = detail?.conversation.conversation_id === selectedId ? detail : null;
  return (
    <div className="relative flex h-full min-h-0 overflow-hidden bg-white">
      <div className={`${mobileChatOpen ? 'hidden' : 'block'} h-full w-full md:block md:w-auto`}>
        <ConversationList conversations={conversations} selectedId={selectedId} query={query} filter={filter} loading={loadingList} onQueryChange={setQuery} onFilterChange={setFilter} onSelect={selectConversation} />
      </div>
      <div className={`${mobileChatOpen ? 'flex' : 'hidden'} h-full min-w-0 flex-1 md:flex`}>
        {visibleDetail ? (
          <ChatThread
            detail={visibleDetail}
            draft={drafts[selectedId!] ?? ''}
            sending={sending}
            uploadProgress={uploadProgress}
            profileButtonRef={profileButtonRef}
            onDraftChange={(value) => setDrafts((items) => ({ ...items, [selectedId!]: value }))}
            onSendText={sendText}
            onSendImage={sendImage}
            onRetry={retry}
            onOpenProfile={() => setProfileOpen(true)}
            onBack={() => { setMobileChatOpen(false); setProfileOpen(false); }}
            onScrollPosition={(value) => { scrollPositions.current[selectedId!] = value; }}
            initialScrollPosition={scrollPositions.current[selectedId!] ?? null}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center bg-slate-50 text-sm text-slate-500">{loadingDetail ? 'กำลังโหลดข้อความ…' : 'เลือกการสนทนาเพื่อเริ่มต้น'}</div>
        )}
      </div>
      {visibleDetail && <CustomerProfileDrawer detail={visibleDetail} open={profileOpen} returnFocusRef={profileButtonRef} onClose={() => setProfileOpen(false)} onRefresh={() => loadDetail(selectedId!, true)} />}
    </div>
  );
}
