'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ChevronDown, Clock3, Copy, RefreshCw, UserRound, X, XCircle } from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';
import { Avatar } from './ConversationList';
import { googleTone, LEAD_STAGE, maskedIdentifier } from './chat-ui';
import type { ConversationDetail, LeadStage, LeadView } from './types';

interface Props {
  detail: ConversationDetail;
  open: boolean;
  returnFocusRef: React.RefObject<HTMLButtonElement>;
  onClose(): void;
  onRefresh(): Promise<void>;
}

const STAGES: LeadStage[] = ['new', 'contacted', 'qualified', 'quoted', 'won', 'lost'];

export default function CustomerProfileDrawer({ detail, open, returnFocusRef, onClose, onRefresh }: Props) {
  const [selectedLeadId, setSelectedLeadId] = useState(detail.conversation.active_lead_id);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSelectedLeadId(detail.conversation.active_lead_id), [detail.conversation.active_lead_id]);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        returnFocusRef.current?.focus();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open, returnFocusRef]);

  const lead = detail.profile.leads.find((item) => item.lead_id === selectedLeadId) ?? detail.profile.leads[0] ?? null;
  const jobs = useMemo(() => detail.profile.ads_jobs.filter((job) => job.lead_id === lead?.lead_id), [detail.profile.ads_jobs, lead?.lead_id]);
  const latestJob = jobs[0] ?? null;

  async function updateLead(path: string, body: unknown) {
    if (!lead) return;
    setSaving(true);
    try {
      const response = await adminFetch(`/api/admin/lead-proxy/leads/${encodeURIComponent(lead.lead_id)}/${path}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'บันทึกไม่สำเร็จ');
      await onRefresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function matchCandidate(candidate: LeadView) {
    if (!window.confirm(`ยืนยันผูก ${candidate.ref_code} กับ ${detail.conversation.display_name}?`)) return;
    setSaving(true);
    try {
      const response = await adminFetch(`/api/admin/lead-proxy/leads/${encodeURIComponent(candidate.lead_id)}/match`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversation_id: detail.conversation.conversation_id, actor: 'admin:chat' }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'จับคู่ไม่สำเร็จ');
      await onRefresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'จับคู่ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  async function retryAds() {
    if (!latestJob || latestJob.state !== 'failed') return;
    if (!window.confirm('ยืนยันส่ง conversion นี้ให้ Google ใหม่ โดยใช้ transaction ID เดิม?')) return;
    setSaving(true);
    try {
      const response = await adminFetch(`/api/admin/chat-proxy/chat/conversations/${encodeURIComponent(detail.conversation.conversation_id)}/ads-retry`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ job_id: latestJob.job_id, confirmed: true }),
      });
      if (!response.ok) throw new Error((await response.json()).error || 'เริ่มส่งใหม่ไม่สำเร็จ');
      await onRefresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'เริ่มส่งใหม่ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  const health = detail.conversation.google_health;
  return (
    <div className="absolute inset-0 z-30 flex justify-end bg-slate-950/20 md:bg-transparent" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="flex h-full w-full flex-col bg-white shadow-2xl md:w-[460px] md:border-l md:border-slate-200" role="dialog" aria-modal="true" aria-label="ข้อมูลลูกค้า">
        <div className="flex items-start gap-3 border-b border-slate-200 p-5">
          <Avatar name={detail.conversation.display_name} src={detail.conversation.picture_url} size="lg" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-slate-950">{detail.conversation.display_name}</h2>
            <p className="text-xs text-slate-500">{detail.conversation.is_following === false ? 'ไม่ได้ติดตาม LINE OA' : 'กำลังติดตาม LINE OA'}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {lead && <StatusPill className={LEAD_STAGE[lead.status].className}>{LEAD_STAGE[lead.status].label}</StatusPill>}
              <StatusPill className={googleTone(health.state)}>{iconForHealth(health.state)} {health.label}</StatusPill>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="ปิดข้อมูลลูกค้า"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4">
          {!lead ? (
            <Section title="Attribution" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}>
              <p className="text-sm text-slate-600">ยังไม่มี Lead ที่ผูกกับการสนทนานี้</p>
              <CandidateList candidates={detail.profile.unmatched_candidates} saving={saving} onMatch={matchCandidate} />
            </Section>
          ) : (
            <>
              {detail.profile.leads.length > 1 && (
                <label className="mb-3 block text-xs font-medium text-slate-600">Lead ที่กำลังดู
                  <select value={lead.lead_id} onChange={(event) => setSelectedLeadId(event.target.value)} className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                    {detail.profile.leads.map((item) => <option key={item.lead_id} value={item.lead_id}>{item.ref_code} · {LEAD_STAGE[item.status].label}</option>)}
                  </select>
                </label>
              )}
              <Section title="Lead" icon={<UserRound className="h-4 w-4 text-blue-600" />}>
                <label className="block text-xs font-medium text-slate-600">สถานะ
                  <select disabled={saving} value={lead.status} onChange={(event) => updateLead('status', { status: event.target.value, actor: 'admin:chat' })} className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                    {STAGES.map((stage) => <option key={stage} value={stage}>{LEAD_STAGE[stage].label}</option>)}
                  </select>
                </label>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <ValueEditor label="มูลค่าประเมิน" value={lead.value.estimated_value} disabled={saving} onSave={(value) => updateLead('value', { value, field: 'estimated_value', actor: 'admin:chat' })} />
                  <ValueEditor label="มูลค่าจริง" value={lead.value.actual_value} disabled={saving} onSave={(value) => updateLead('value', { value, field: 'actual_value', actor: 'admin:chat' })} />
                </div>
                <NotesEditor value={lead.notes} disabled={saving} onSave={(notes) => updateLead('notes', { notes, actor: 'admin:chat' })} />
              </Section>

              <Section title="Attribution" icon={lead.match.match_method ? <CheckCircle2 className="h-4 w-4 text-blue-600" /> : <AlertTriangle className="h-4 w-4 text-amber-500" />}>
                <KeyValue label="สถานะ" value={lead.match.match_method === 'ref_code' ? 'Exact match' : lead.match.match_method === 'manual' ? 'Manual match' : hasClickId(lead) ? 'Unmatched' : 'Organic / Unknown'} />
                <KeyValue label="Campaign" value={String(lead.attribution.utm_campaign || lead.attribution.srt_campaignid || '—')} />
                <KeyValue label="Ad group" value={String(lead.attribution.srt_adgroupid || '—')} />
                <KeyValue label="Keyword" value={String(lead.attribution.srt_keyword || lead.attribution.utm_term || '—')} />
                <KeyValue label="Match / Device" value={`${lead.attribution.srt_matchtype || '—'} / ${lead.attribution.srt_device || '—'}`} />
                <KeyValue label="Landing page" value={String(lead.attribution.landing_page || '—')} />
                {(['gclid', 'gbraid', 'wbraid'] as const).map((key) => lead.attribution[key] && <CopyValue key={key} label={key.toUpperCase()} value={String(lead.attribution[key])} />)}
              </Section>

              <Section title="Conversion" icon={<Clock3 className="h-4 w-4 text-violet-600" />}>
                <KeyValue label="Conversion action" value={String(latestJob?.request_payload?.destinations?.[0]?.productDestinationId || '—')} />
                <CopyValue label="Transaction ID" value={lead.lead_id} />
                <KeyValue label="Event time" value={lead.created_at} />
                <KeyValue label="มูลค่าล่าสุด" value={latestJob ? `${Number(latestJob.conversion_value).toLocaleString('th-TH')} ${latestJob.currency}` : '—'} />
                <p className="mt-2 text-xs text-slate-500">ข้อมูล conversion แยกจากสถานะที่ Google ประมวลผลด้านล่าง</p>
              </Section>

              <Section title="Data Manager" icon={iconForHealth(health.state)}>
                <div className={`mb-3 rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-inset ${googleTone(health.state)}`}>{health.label}</div>
                <CopyValue label="Request ID" value={String(latestJob?.google_request_id || '—')} />
                <KeyValue label="ตรวจล่าสุด" value={String(latestJob?.last_checked_at || 'ยังไม่ตรวจ')} />
                {latestJob?.error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{humanizeError(String(latestJob.error))}</p>}
                {latestJob?.diagnostics && <details className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"><summary className="flex cursor-pointer items-center gap-1 font-medium"><ChevronDown className="h-3 w-3" /> Technical response</summary><pre className="mt-2 overflow-auto whitespace-pre-wrap">{JSON.stringify(latestJob.diagnostics, null, 2)}</pre></details>}
                <button disabled={saving || latestJob?.state !== 'failed'} onClick={retryAds} type="button" className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><RefreshCw className="h-4 w-4" /> ลองส่งใหม่</button>
              </Section>

              <Section title="Lead history" icon={<Clock3 className="h-4 w-4 text-slate-500" />}>
                <div className="space-y-3">
                  {detail.profile.events.filter((event) => event.lead_id === lead.lead_id).map((event, index) => (
                    <div key={`${event.at}-${index}`} className="border-l-2 border-slate-200 pl-3 text-xs">
                      <p className="font-medium text-slate-700">{historyLabel(String(event.kind))}</p>
                      <p className="text-slate-500">{String(event.from_value || '—')} → {String(event.to_value || '—')}</p>
                      <p className="mt-0.5 text-slate-400">{String(event.at)}</p>
                    </div>
                  ))}
                  {detail.profile.events.length === 0 && <p className="text-sm text-slate-500">ยังไม่มีประวัติ</p>}
                </div>
              </Section>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="mb-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">{icon}{title}</h3>{children}</section>;
}

function StatusPill({ className, children }: { className: string; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${className}`}>{children}</span>;
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return <div className="flex gap-3 border-b border-slate-100 py-2 text-xs last:border-0"><span className="w-28 shrink-0 text-slate-500">{label}</span><span className="min-w-0 break-words font-medium text-slate-700">{value}</span></div>;
}

function CopyValue({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center gap-2 border-b border-slate-100 py-2 text-xs"><span className="w-28 shrink-0 text-slate-500">{label}</span><code className="min-w-0 flex-1 truncate text-slate-700">{maskedIdentifier(value)}</code><button type="button" onClick={() => navigator.clipboard.writeText(value)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label={`คัดลอก ${label}`}><Copy className="h-3.5 w-3.5" /></button></div>;
}

function ValueEditor({ label, value, disabled, onSave }: { label: string; value: number | null; disabled: boolean; onSave(value: number): void }) {
  const [draft, setDraft] = useState(value?.toString() ?? '');
  useEffect(() => setDraft(value?.toString() ?? ''), [value]);
  return <label className="text-xs font-medium text-slate-600">{label}<div className="mt-1 flex"><input disabled={disabled} inputMode="decimal" value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { const next = Number(draft); if (next > 0 && next !== value) onSave(next); }} className="h-9 min-w-0 flex-1 rounded-l-lg border border-slate-200 px-2 text-sm outline-none focus:border-blue-400" /><span className="flex items-center rounded-r-lg border border-l-0 border-slate-200 bg-slate-50 px-2 text-xs text-slate-500">THB</span></div></label>;
}

function NotesEditor({ value, disabled, onSave }: { value: string | null; disabled: boolean; onSave(value: string): void }) {
  const [draft, setDraft] = useState(value ?? '');
  useEffect(() => setDraft(value ?? ''), [value]);
  return <label className="mt-3 block text-xs font-medium text-slate-600">Notes<textarea disabled={disabled} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={() => { if (draft.trim() !== (value ?? '')) onSave(draft.trim()); }} rows={3} className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm font-normal outline-none focus:border-blue-400 focus:bg-white" placeholder="บันทึกข้อมูลที่ต้องติดตาม…" /></label>;
}

function CandidateList({ candidates, saving, onMatch }: { candidates: LeadView[]; saving: boolean; onMatch(candidate: LeadView): void }) {
  if (!candidates.length) return <p className="mt-3 text-xs text-slate-500">ไม่พบ candidate ในช่วงเวลา ±15 นาที</p>;
  return <div className="mt-3 space-y-2">{candidates.map((candidate) => <button disabled={saving} key={candidate.lead_id} onClick={() => onMatch(candidate)} type="button" className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs hover:bg-amber-100"><span className="font-semibold text-amber-900">{candidate.ref_code}</span><span className="mt-1 block text-amber-700">{candidate.attribution.utm_campaign || 'ไม่ทราบ campaign'} · {new Date(candidate.created_at).toLocaleString('th-TH')}</span></button>)}</div>;
}

function hasClickId(lead: LeadView) { return Boolean(lead.attribution.gclid || lead.attribution.gbraid || lead.attribution.wbraid); }
function humanizeError(error: string) { return error.includes('DENIED_CONSENT') ? 'Google ไม่รับข้อมูลเนื่องจากสถานะ consent' : error.includes('EVENT_TOO_OLD') ? 'Conversion เก่าเกินช่วงเวลาที่ Google รองรับ' : error.length > 240 ? `${error.slice(0, 240)}…` : error; }
function historyLabel(kind: string) { return ({ match: 'จับคู่ Lead', status_change: 'เปลี่ยนสถานะ', value_change: 'เปลี่ยนมูลค่า', notes_change: 'แก้ไขโน้ต', ads_sync: 'ส่งให้ Google' } as Record<string, string>)[kind] ?? kind; }
function iconForHealth(state: string) { if (state === 'succeeded') return <CheckCircle2 className="h-4 w-4" />; if (state === 'failed' || state === 'partial_success') return <XCircle className="h-4 w-4" />; return <Clock3 className="h-4 w-4" />; }
