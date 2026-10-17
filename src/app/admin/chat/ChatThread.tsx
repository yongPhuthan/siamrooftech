'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Clock3, ImagePlus, Info, LoaderCircle, RefreshCw, Send, UserRoundX } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';
import Image from 'next/image';
import { Avatar } from './ConversationList';
import { googleTone, LEAD_STAGE } from './chat-ui';
import type { ChatMessage, ConversationDetail } from './types';

interface Props {
  detail: ConversationDetail;
  draft: string;
  sending: boolean;
  uploadProgress: number | null;
  profileButtonRef: React.RefObject<HTMLButtonElement>;
  onDraftChange(value: string): void;
  onSendText(): void;
  onSendImage(file: File): void;
  onRetry(message: ChatMessage): void;
  onOpenProfile(): void;
  onBack(): void;
  onScrollPosition(value: number): void;
  initialScrollPosition: number | null;
}

export default function ChatThread(props: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    if (props.initialScrollPosition !== null) element.scrollTop = props.initialScrollPosition;
    else element.scrollTop = element.scrollHeight;
  }, [props.detail.conversation.conversation_id, props.initialScrollPosition]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const closeToBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 180;
    if (closeToBottom) element.scrollTop = element.scrollHeight;
  }, [props.detail.messages.length]);

  const lead = props.detail.profile.leads.find((item) => item.lead_id === props.detail.conversation.active_lead_id) ?? props.detail.profile.leads[0];
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-slate-50">
      <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 md:px-5">
        <button type="button" onClick={props.onBack} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden" aria-label="กลับไปรายการสนทนา"><ArrowLeft className="h-5 w-5" /></button>
        <button ref={props.profileButtonRef} type="button" onClick={props.onOpenProfile} className="flex min-w-0 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <Avatar name={props.detail.conversation.display_name} src={props.detail.conversation.picture_url} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-slate-950">{props.detail.conversation.display_name}</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              {props.detail.conversation.is_following === false ? <><UserRoundX className="h-3 w-3" /> ไม่ได้ติดตาม</> : <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> ติดตาม LINE OA</>}
            </span>
          </span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          {lead && <span className={`hidden rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset sm:inline-flex ${LEAD_STAGE[lead.status].className}`}>{LEAD_STAGE[lead.status].label}</span>}
          <span className={`hidden items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset lg:inline-flex ${googleTone(props.detail.conversation.google_health.state)}`}><HealthIcon state={props.detail.conversation.google_health.state} /> {props.detail.conversation.google_health.label}</span>
          <button type="button" onClick={props.onOpenProfile} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"><Info className="h-4 w-4" /><span className="hidden sm:inline">ข้อมูลลูกค้า</span></button>
        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={(event) => props.onScrollPosition(event.currentTarget.scrollTop)}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 md:px-8"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {props.detail.messages.map((message) => <MessageBubble key={message.message_id} message={message} onRetry={props.onRetry} />)}
          {props.detail.messages.length === 0 && <p className="py-20 text-center text-sm text-slate-500">ยังไม่มีข้อความในการสนทนานี้</p>}
        </div>
      </div>

      <footer className="shrink-0 border-t border-slate-200 bg-white p-3 md:px-6 md:py-4">
        {props.uploadProgress !== null && <div className="mx-auto mb-2 max-w-3xl"><div className="mb-1 flex justify-between text-xs text-slate-500"><span>กำลังส่งรูปภาพ</span><span>{props.uploadProgress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-blue-600 transition-all" style={{ width: `${props.uploadProgress}%` }} /></div></div>}
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) props.onSendImage(file); event.currentTarget.value = ''; }} />
          <button disabled={props.sending} type="button" onClick={() => fileRef.current?.click()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label="แนบรูปภาพ"><ImagePlus className="h-5 w-5" /></button>
          <textarea
            value={props.draft}
            onChange={(event) => props.onDraftChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); props.onSendText(); } }}
            rows={1}
            placeholder="พิมพ์ข้อความ…"
            className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
          />
          <button disabled={props.sending || !props.draft.trim()} type="button" onClick={props.onSendText} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-200" aria-label="ส่งข้อความ">{props.sending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}</button>
        </div>
        <p className="mx-auto mt-1 max-w-3xl pl-12 text-[10px] text-slate-400">Enter เพื่อส่ง · Shift + Enter ขึ้นบรรทัดใหม่</p>
      </footer>
    </section>
  );
}

function MessageBubble({ message, onRetry }: { message: ChatMessage; onRetry(message: ChatMessage): void }) {
  if (message.is_unsent) return <div className="self-center rounded-full bg-slate-200 px-3 py-1.5 text-xs text-slate-500">ข้อความนี้ถูกยกเลิกการส่ง</div>;
  const outbound = message.direction === 'outbound';
  const attachmentUrl = message.attachment?.preview_url || message.attachment?.url || message.attachment?.external_url;
  const mediaUrl = message.local_preview || (message.attachment?.kind === 'image' ? attachmentUrl : null);
  return (
    <div className={`flex max-w-[82%] flex-col ${outbound ? 'self-end items-end' : 'self-start items-start'}`}>
      <div className={`overflow-hidden rounded-2xl text-sm shadow-sm ${outbound ? 'rounded-br-md bg-blue-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'} ${message.local_state === 'failed' || message.local_state === 'unknown' ? 'ring-2 ring-red-300' : ''}`}>
        {mediaUrl && <AuthenticatedMedia path={mediaUrl} alt="รูปภาพในแชท" />}
        {message.attachment && message.attachment.kind !== 'image' && attachmentUrl && <AttachmentLink path={attachmentUrl} label={message.attachment.file_name || `เปิดไฟล์ ${message.attachment.kind}`} />}
        {message.attachment && !mediaUrl && <div className="flex items-center gap-2 p-3 text-xs"><AlertCircle className="h-4 w-4" />{message.attachment.status === 'expired' ? 'ไฟล์หมดอายุแล้ว' : 'ไฟล์ยังไม่พร้อม'}</div>}
        {message.text && <p className="whitespace-pre-wrap break-words px-3.5 py-2.5">{message.text}</p>}
      </div>
      <span className={`mt-1 flex items-center gap-1 text-[10px] ${message.local_state === 'failed' || message.local_state === 'unknown' ? 'text-red-600' : 'text-slate-400'}`}>
        {new Date(message.occurred_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        {message.local_state === 'pending' && <><Clock3 className="h-3 w-3" /> กำลังส่ง</>}
        {!message.local_state && outbound && <Check className="h-3 w-3" />}
        {message.local_state === 'failed' && <button type="button" onClick={() => onRetry(message)} className="inline-flex items-center gap-1 font-medium underline"><RefreshCw className="h-3 w-3" /> ลองใหม่</button>}
        {message.local_state === 'unknown' && <span className="font-medium">ไม่ทราบผลการส่ง — ตรวจใน LINE ก่อน</span>}
      </span>
    </div>
  );
}

function AuthenticatedMedia({ path, alt }: { path: string; alt: string }) {
  const [source, setSource] = useState(path.startsWith('blob:') || path.startsWith('http') ? path : '');
  useEffect(() => {
    if (path.startsWith('blob:') || path.startsWith('http')) { setSource(path); return; }
    let objectUrl = '';
    let active = true;
    adminFetch(`/api/admin/chat-proxy${path}`).then((response) => {
      if (!response.ok) throw new Error('media unavailable');
      return response.blob();
    }).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setSource(objectUrl);
    }).catch(() => setSource(''));
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [path]);
  if (!source) return <div className="flex h-40 w-60 items-center justify-center bg-slate-100 text-xs text-slate-400"><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> กำลังโหลดรูป</div>;
  return <Image unoptimized width={960} height={720} src={source} alt={alt} className="h-auto max-h-80 w-auto max-w-full object-cover" />;
}

function AttachmentLink({ path, label }: { path: string; label: string }) {
  const [opening, setOpening] = useState(false);
  async function openAttachment() {
    setOpening(true);
    try {
      if (path.startsWith('http')) { window.open(path, '_blank', 'noopener,noreferrer'); return; }
      const response = await adminFetch(`/api/admin/chat-proxy${path}`);
      if (!response.ok) throw new Error('เปิดไฟล์ไม่สำเร็จ');
      const objectUrl = URL.createObjectURL(await response.blob());
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } finally {
      setOpening(false);
    }
  }
  return <button type="button" disabled={opening} onClick={openAttachment} className="flex min-w-56 items-center gap-2 p-3 text-left text-xs font-medium underline disabled:opacity-60">{opening ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}{label}</button>;
}

function HealthIcon({ state }: { state: string }) { return state === 'succeeded' ? <Check className="h-3 w-3" /> : state === 'failed' || state === 'partial_success' ? <AlertCircle className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />; }
