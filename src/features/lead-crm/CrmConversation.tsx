'use client';
import { useCallback, useEffect, useState } from 'react';
import { type CrmLeadView, STAGE_LABELS } from './contracts';
import { buttonClass, crmRequest, fieldClass } from './client';
import CrmReviewPanel from './CrmReviewPanel';
import CrmHistory from './CrmHistory';
export default function CrmConversation({ conversationId, onRefresh }: { conversationId: string; onRefresh?: () => Promise<void> }) {
  const [leads, setLeads] = useState<CrmLeadView[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    const rows = await crmRequest<CrmLeadView[]>(`/conversations/${encodeURIComponent(conversationId)}`, undefined, signal);
    setLeads(rows); setSelected((old) => rows.some((lead) => lead.lead_id === old) ? old : rows[0]?.lead_id ?? '');
  }, [conversationId]);
  useEffect(() => { const controller = new AbortController(); load(controller.signal).catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); }); return () => controller.abort(); }, [load]);
  const lead = leads.find((row) => row.lead_id === selected);
  const last = leads[0];
  return <div className="space-y-4">
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {leads.length > 1 && <label className="block text-sm">งานของผู้ติดต่อนี้<select className={fieldClass} value={selected} onChange={(event) => setSelected(event.target.value)}>
      {leads.map((row) => <option key={row.lead_id} value={row.lead_id}>{row.model_version === 2 ? STAGE_LABELS[row.status] : 'Legacy'} · {row.lead_id.slice(0, 8)}</option>)}
    </select></label>}
    {lead?.model_version === 2 ? <CrmReviewPanel key={lead.lead_id} leadId={lead.lead_id} onRefresh={async () => { await load(); await onRefresh?.(); }} /> : <>
      <p className="text-sm text-slate-500">{lead ? 'ข้อมูล Legacy อ่านได้เท่านั้น ไม่มีการส่งหรือปรับค่าอัตโนมัติ' : 'รอข้อความแรกจากลูกค้าเพื่อเริ่มบันทึกงาน'}</p>
      {lead && <details><summary className="text-sm">รายละเอียด Legacy</summary><pre className="overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(lead, null, 2)}</pre></details>}
      <CrmHistory conversationId={conversationId} />
    </>}
    {last && (last.model_version !== 2 || ['won', 'lost', 'disqualified'].includes(last.status)) && <form className="space-y-2 rounded-xl border bg-white p-4" onSubmit={async (event) => {
      event.preventDefault(); setBusy(true); setError('');
      try {
        const created = await crmRequest<CrmLeadView>(`/conversations/${encodeURIComponent(conversationId)}/opportunities`, { previous_id: last.lead_id, revision: last.revision, reason });
        await load(); setSelected(created.lead_id); setReason('');
      } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
    }}><h3 className="font-semibold">เริ่มงานใหม่ของผู้ติดต่อเดิม</h3><p className="text-xs text-slate-500">ใช้เมื่อเป็นคนละงานจริง งานใหม่รอข้อความที่เข้ามาหลังสร้าง ไม่ใช้ข้อความเก่าซ้ำ</p>
      <input required maxLength={2000} aria-label="เหตุผลเริ่มงานใหม่" className={fieldClass} value={reason} onChange={(event) => setReason(event.target.value)} />
      <button className={buttonClass} disabled={busy}>เพิ่มงานใหม่</button>
    </form>}
  </div>;
}
