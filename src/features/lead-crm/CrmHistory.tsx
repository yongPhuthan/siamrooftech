'use client';
import { useEffect, useRef, useState } from 'react';
import { CRM_API, crmDate, crmRequest, buttonClass, fieldClass } from './client';

interface Message { message_id: string; display_name: string | null; conversation_id: string;
  direction: string; text: string | null; message_type: string; occurred_at: number; is_unsent: number; has_media: number }
interface Page { messages: Message[]; next_cursor: string | null; coverage: string }
export default function CrmHistory({ conversationId, embedded = false }: { conversationId?: string; embedded?: boolean }) {
  const [days, setDays] = useState('7');
  const [q, setQ] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState<Page | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const params = new URLSearchParams({ days, q: search });
  if (conversationId) params.set('conversation_id', conversationId);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const query = params.toString();
  const currentQuery = useRef(query);
  useEffect(() => {
    currentQuery.current = query;
    const controller = new AbortController();
    setError(''); setPage(null); setBusy(true);
    crmRequest<Page>(`/messages?${query}`, undefined, controller.signal).then(setPage)
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [query]);
  async function more() {
    if (!page?.next_cursor) return;
    setBusy(true); setError('');
    try {
      const next = await crmRequest<Page>(`/messages?${query}&cursor=${encodeURIComponent(page.next_cursor)}`);
      if (currentQuery.current !== query) return;
      setPage((old) => ({ ...next, messages: [...(old?.messages ?? []), ...next.messages] }));
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <section className={embedded ? 'space-y-4' : 'space-y-4 rounded-xl border border-slate-200 bg-white p-4'}>
    {!embedded && <h3 className="font-semibold text-slate-900">ประวัติการสนทนา</h3>}
    <p className="text-xs leading-relaxed text-slate-500">แสดงข้อความลูกค้าที่ระบบได้รับ คำตอบจากพนักงานใน LINE OA Manager อาจไม่มีในประวัตินี้ · เก็บ 365 วัน</p>
    <div className="flex flex-wrap items-start gap-3">
      <select className={fieldClass + ' max-w-36'} aria-label="ช่วงประวัติ" value={days} onChange={(event) => { setDays(event.target.value); setFrom(''); setTo(''); }}>
        {[1, 3, 7, 30, 45].map((day) => <option key={day} value={day}>{day} วัน รวมวันนี้</option>)}
      </select>
      <details className="min-w-0 text-xs text-slate-600"><summary className="cursor-pointer py-3">กำหนดวันที่เอง{from || to ? ' · ใช้อยู่' : ''}</summary><div className="flex flex-wrap gap-2 pt-2"><label>ตั้งแต่<input className={fieldClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>ถึง<input className={fieldClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></div></details>
    </div>
    <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setSearch(q); }}>
      <input className={fieldClass} aria-label="ค้นข้อความ" placeholder="ค้นข้อความภาษาไทย" maxLength={200} value={q} onChange={(event) => setQ(event.target.value)} />
      <button className={buttonClass}>ค้นหา</button>
    </form>
    <details className="text-xs text-slate-600"><summary className="cursor-pointer py-2">ดาวน์โหลดประวัติแชท</summary><p className="py-2 text-slate-500">ดาวน์โหลดครบตามช่วงวันที่และคำค้นที่เลือก · TXT สำหรับอ่าน / JSONL สำหรับนำไปประมวลผล</p><div className="flex flex-wrap gap-2 text-sm"><a className={buttonClass} href={`${CRM_API}/export?${query}&format=txt`}>ดาวน์โหลด TXT</a><a className={buttonClass} href={`${CRM_API}/export?${query}&format=jsonl`}>ดาวน์โหลด JSONL</a></div></details>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="max-h-96 space-y-3 overflow-y-auto">
      {page?.messages.map((message) => <article key={message.message_id} className="rounded-lg bg-slate-50 p-3 text-sm">
        <p className="text-xs text-slate-500">{message.display_name ?? 'ลูกค้า LINE'} · {crmDate(message.occurred_at)} · {message.direction === 'inbound' ? 'ลูกค้า' : 'ฝั่งร้าน'}</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{message.is_unsent ? '[ข้อความถูกยกเลิก]' : message.text ?? `[${message.message_type}]`}</p>
        {!message.is_unsent && message.has_media === 1 && <a className="mt-2 inline-block text-blue-700 underline" href={`/api/admin/chat-proxy/chat-history/media/${encodeURIComponent(message.message_id)}`} target="_blank" rel="noopener noreferrer">เปิดไฟล์แนบ</a>}
      </article>)}
      {page && !page.messages.length && <p className="text-sm text-slate-500">ไม่พบข้อความในช่วงนี้</p>}
    </div>
    {busy && <p role="status" className="text-sm text-slate-500">กำลังโหลด…</p>}
    {page?.next_cursor && <button type="button" className={buttonClass} disabled={busy} onClick={more}>โหลดข้อความถัดไป</button>}
  </section>;
}
