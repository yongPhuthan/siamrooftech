'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/admin/CustomerAvatar';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import { PROBABILITY_STAGES, stageProbability, STAGE_LABELS, type CrmHealth, type CrmLeadView, type ProbabilityStage, type ValuationVersion } from './contracts';
import { buttonClass, primaryButtonClass, crmDate, crmRequest, fieldClass } from './client';
import { CrmBadge, CrmDisclosure, deliveryLabel, money } from './CrmUi';
import CrmReviewPanel from './CrmReviewPanel';
import CrmHistory from './CrmHistory';

export default function CrmWorkspace() {
  return <AdminAuthGate><Workspace /></AdminAuthGate>;
}
function Workspace() {
  const [leads, setLeads] = useState<CrmLeadView[]>([]);
  const [queue, setQueue] = useState('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<CrmHealth | null>(null);
  const [tab, setTab] = useState<'leads' | 'history' | 'formulas'>('leads');
  const query = new URLSearchParams({ queue, q: search }).toString();
  const currentQuery = useRef(query);
  const load = useCallback(async (signal?: AbortSignal) => {
    const [data, status] = await Promise.all([
      crmRequest<{ leads: CrmLeadView[]; next_cursor: string | null }>(`/leads?${query}`, undefined, signal),
      crmRequest<NonNullable<typeof health>>('/health', undefined, signal),
    ]);
    if (signal?.aborted || currentQuery.current !== query) return;
    setLeads(data.leads); setNext(data.next_cursor); setHealth(status);
  }, [query]);
  useEffect(() => {
    currentQuery.current = query;
    const controller = new AbortController(); setBusy(true); setError('');
    load(controller.signal).catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [load, query]);
  async function more() {
    if (!next) return;
    setBusy(true);
    try {
      const data = await crmRequest<{ leads: CrmLeadView[]; next_cursor: string | null }>(`/leads?${query}&cursor=${encodeURIComponent(next)}`);
      if (currentQuery.current !== query) return;
      setLeads((old) => [...old, ...data.leads]); setNext(data.next_cursor);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  }
  return <main className="min-h-full space-y-5 bg-slate-50 p-4 text-slate-900 sm:p-6">
    <header className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold tracking-tight">CRM ผู้ติดต่อ</h1><p className="mt-1.5 text-sm text-slate-500">บันทึกสถานะ กำไรประมาณการ และผลขายจริงของลูกค้า</p></div><CrmBadge tone={health?.delivery_mode === 'live' ? 'green' : 'amber'}>{health?.delivery_mode === 'live' ? 'เปิดส่ง Google แล้ว' : health?.delivery_mode === 'dry_run' ? 'โหมดทดสอบ · ไม่ส่ง Google' : 'กำลังตรวจโหมดการส่ง'}</CrmBadge></header>
    <nav className="flex flex-wrap gap-x-5 gap-y-1 border-b border-slate-200" aria-label="ส่วน CRM">
      {([{ key: 'leads', label: 'ผู้ติดต่อ' }, { key: 'history', label: 'ค้นประวัติแชท' }, { key: 'formulas', label: 'ตั้งค่าโอกาสปิดการขาย' }] as const)
        .map(({ key, label }) => <button key={key} className={`min-h-11 border-b-2 px-1 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${tab === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}
    </nav>
    {tab === 'history' ? <CrmHistory /> : tab === 'formulas' ? <Formulas /> : <>
      <form className="flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); setSearch(q); }}>
        <input className={fieldClass + ' max-w-md'} placeholder="ค้นชื่อผู้ติดต่อ Keyword หรือข้อความ" aria-label="ค้น Lead" value={q} maxLength={200} onChange={(event) => setQ(event.target.value)} />
        <select className={fieldClass + ' max-w-48'} aria-label="กรองผู้ติดต่อ" value={queue} onChange={(event) => setQueue(event.target.value)}>
          <option value="all">ทั้งหมด</option><option value="pending">รอประเมิน/ยืนยันมูลค่า</option><option value="overdue">เกิน 7 วัน</option><option value="unmatched">ยังจับคู่ไม่ได้</option><option value="errors">ส่ง Google มีปัญหา</option>
        </select><button className={primaryButtonClass}>ค้นหา</button><button type="button" className={buttonClass} disabled={busy} onClick={() => { setError(''); void load().catch((err: Error) => setError(err.message)); }}>รีเฟรช</button>
      </form>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      {busy && <p role="status">กำลังโหลด…</p>}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.65fr)]">
        <div className="min-w-0 space-y-2 lg:sticky lg:top-5"><div className="flex items-baseline justify-between gap-2 pb-1"><h2 className="text-sm font-semibold">รายชื่อผู้ติดต่อ</h2><span className="text-xs text-slate-500">ประเมินภายใน 7 วัน</span></div><div className="max-h-80 space-y-2 overflow-y-auto lg:max-h-[70vh]">
          {!busy && !leads.length && !error && <p className="rounded-lg bg-white p-5 text-sm text-slate-500">ยังไม่มีผู้ติดต่อที่ส่งข้อความเข้าระบบ CRM นี้</p>}
          {leads.map((lead) => <button key={lead.lead_id} onClick={() => setSelected(lead.lead_id)} aria-pressed={selected === lead.lead_id} className={`block w-full rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selected === lead.lead_id ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 bg-white hover:border-blue-300'}`}>
            <span className="flex items-center gap-3"><Avatar name={lead.display_name ?? 'ลูกค้า LINE'} src={lead.picture_url ?? null} /><span className="min-w-0"><span className="block truncate text-sm font-semibold">{lead.display_name ?? 'ลูกค้า LINE'}</span><span className="mt-0.5 block text-xs text-slate-500">{crmDate(lead.last_message_at)}</span></span></span>
            <span className="mt-3 flex flex-wrap gap-1.5"><CrmBadge tone={lead.status === 'won' ? 'green' : 'neutral'}>{STAGE_LABELS[lead.status]}</CrmBadge>{!lead.touch_id && <CrmBadge tone="amber">ยังไม่จับคู่</CrmBadge>}</span>
            <span className="mt-3 flex flex-wrap items-baseline justify-between gap-1 border-t border-slate-200/60 pt-2"><span className={`text-xs ${lead.review_state === 'approved' ? 'text-blue-700' : 'text-slate-500'}`}>{lead.review_state === 'approved' ? 'ยืนยันมูลค่าแล้ว' : lead.review_state === 'reviewed' ? 'บันทึกข้อมูลแล้ว' : 'รอประเมิน'}</span><span className="text-sm font-semibold">{money(lead.estimated_value)}</span></span>
            {lead.ads_state !== 'not_sent' && <span className={`mt-1.5 block text-xs ${['failed', 'partial_success'].includes(lead.ads_state) ? 'text-red-700' : 'text-slate-500'}`}>{deliveryLabel(lead.ads_state)}</span>}
          </button>)}
          </div>
          {next && <button className={buttonClass} disabled={busy} onClick={more}>โหลดรายชื่อถัดไป</button>}
        </div>
        {selected ? <CrmReviewPanel key={selected} leadId={selected} onRefresh={() => load()} /> : <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><div><p className="font-medium text-slate-700">เลือกผู้ติดต่อเพื่อประเมินลูกค้า</p><p className="mt-2 text-sm text-slate-500">ดูประวัติแชท ตรวจคุณภาพ และกำหนดมูลค่าของลูกค้า</p></div></div>}
      </div>
    </>}
    {health && <CrmDisclosure title="สถานะระบบและการเก็บข้อมูล" description={health.retention?.state === 'failed' ? 'มีปัญหาลบข้อมูลครบอายุ · กรุณาตรวจสอบ' : `คิวที่รอดำเนินการ ${health.pending.count} รายการ · แชทเก็บ 365 วัน`}><p role={health.retention?.state === 'failed' ? 'alert' : undefined} className={`text-xs leading-relaxed ${health.retention?.state === 'failed' ? 'text-red-700' : 'text-slate-500'}`}>ลบแชทครบอายุล่าสุด: {health.retention ? `${crmDate(health.retention.started_at)} · ${health.retention.state === 'succeeded' ? 'สำเร็จ' : health.retention.state === 'failed' ? 'มีปัญหา' : 'กำลังดำเนินการ'} · ${health.retention.messages_deleted} ข้อความ` : 'ยังไม่รันรอบแรก'} · เวลาทั้งหมดแสดงตามกรุงเทพฯ</p></CrmDisclosure>}
  </main>;
}
interface Cohort { cohort: string; total: number; won: number; lost: number; disqualified: number; open: number; oldest_at: number; actual_profit: number | null; sales_amount: number | null }
function Formulas() {
  const [versions, setVersions] = useState<ValuationVersion[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [stage, setStage] = useState<ProbabilityStage>('qualified');
  const [label, setLabel] = useState('');
  const [probability, setProbability] = useState('25');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    const [formulas, stats] = await Promise.all([crmRequest<ValuationVersion[]>('/valuations', undefined, signal), crmRequest<Cohort[]>('/summary', undefined, signal)]);
    if (signal?.aborted) return;
    setVersions(formulas); setCohorts(stats); setLoaded(true);
    setProbability(String(stageProbability('qualified', formulas).probability * 100)); setStage('qualified');
  }, []);
  useEffect(() => { const controller = new AbortController(); load(controller.signal).catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); }); return () => controller.abort(); }, [load]);
  if (!loaded) return <p role={error ? 'alert' : 'status'} className={error ? 'text-red-700' : 'text-slate-500'}>{error || 'กำลังโหลดค่ากลาง…'}</p>;
  return <div className="space-y-5">
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div><h2 className="font-semibold">โอกาสปิดการขายตามสถานะ</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">ลูกค้าทุกคนในสถานะเดียวกันใช้เปอร์เซ็นต์เดียวกัน กำไรประมาณการกรอกแยกตามงาน</p></div>
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[...PROBABILITY_STAGES, 'won' as const].map((key) => <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 p-4"><dt className="text-sm text-slate-600">{STAGE_LABELS[key]}</dt><dd className="mt-2 text-2xl font-semibold text-slate-900">{Number((stageProbability(key, versions).probability * 100).toFixed(2))}%</dd></div>)}</dl>
      <p className="text-xs leading-relaxed text-slate-500">เปอร์เซ็นต์ไม่ลดตามจำนวนวันที่ผ่านไป ปรับค่ากลางเมื่อมีข้อมูลจริงเพิ่มขึ้น · Converted Lead ใช้ 100% และกำไรจริงเสมอ</p>
      <CrmDisclosure title="ปรับเปอร์เซ็นต์กลาง" description="ลูกค้าที่บันทึกไว้แล้วจะไม่ถูกปรับมูลค่าหรือส่ง Google อัตโนมัติ"><form className="max-w-xl space-y-4" onSubmit={async (event) => {
        event.preventDefault(); setBusy(true); setError(''); setNotice('');
        try {
          await crmRequest('/valuations', { stage, label, probability: Number(probability) / 100, enabled: true, supersedes_id: versions.find((version) => version.stage === stage && version.enabled)?.id ?? null });
          await load(); setNotice('บันทึกเปอร์เซ็นต์กลางแล้ว มูลค่าลูกค้าเดิมยังไม่เปลี่ยน'); setLabel('');
        } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
      }}>
        <label className="block text-sm">สถานะที่ต้องการปรับ<select aria-label="สถานะที่ต้องการปรับ" disabled={busy} className={fieldClass} value={stage} onChange={(event) => { const key = event.target.value as ProbabilityStage; setStage(key); setProbability(String(stageProbability(key, versions).probability * 100)); }}>{PROBABILITY_STAGES.map((key) => <option key={key} value={key}>{STAGE_LABELS[key]}</option>)}</select></label>
        <label className="block text-sm">โอกาสปิดการขาย (%)<input aria-label="โอกาสปิดการขาย (%)" required type="number" min="0" max="100" step="any" disabled={busy} className={fieldClass} value={probability} onChange={(event) => setProbability(event.target.value)} /></label>
        <label className="block text-sm">เหตุผลที่ปรับ<input aria-label="เหตุผลที่ปรับ" required maxLength={120} disabled={busy} placeholder="เช่น ทบทวนตามข้อมูลปิดการขายเดือนนี้" className={fieldClass} value={label} onChange={(event) => setLabel(event.target.value)} /></label>
        <button className={primaryButtonClass} disabled={busy}>บันทึกเปอร์เซ็นต์กลาง</button>
        {error && <p role="alert" className="text-red-700">{error}</p>}{notice && <p role="status" className="text-green-700">{notice}</p>}
      </form></CrmDisclosure>
      <CrmDisclosure title="ประวัติการปรับเปอร์เซ็นต์" description="ตรวจดูค่ากลางที่เคยใช้และเหตุผลการเปลี่ยน"><div className="space-y-2"><p className="text-xs text-slate-500">ค่าเริ่มต้น: Lead 10% · Qualified Lead 25% · Site Visit Completed 75% · Converted Lead 100%</p>{versions.map((version) => <article className="rounded-lg border p-3 text-sm" key={version.id}>{STAGE_LABELS[version.stage]} · {Number((version.probability * 100).toFixed(2))}% · {version.label} · {version.enabled ? 'ใช้งานอยู่' : 'เก็บประวัติ'} · {crmDate(version.created_at)}</article>)}</div></CrmDisclosure>
    </section>
    <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">ผลขาย แยกตามเดือนที่ลูกค้าเริ่มคุย</h2>
      <p className="my-2 text-xs leading-relaxed text-slate-500">งานที่ยังติดตามอยู่ไม่นับเป็นงานที่ปิดไม่ได้ ใช้ข้อมูลนี้ทบทวนสูตรทุก 1–2 เดือน ระบบไม่เปลี่ยนโอกาสปิดการขายให้เอง · ยอดขายรวมเฉพาะรายการที่กรอกยอดขายแล้ว</p>
      <table className="w-full text-left text-sm"><thead><tr>{['เดือน', 'ทั้งหมด', 'ซื้อแล้ว', 'ปิดการขายไม่ได้', 'ไม่ตรงเงื่อนไข', 'ยังติดตาม', 'อายุข้อมูล', 'ยอดขาย', 'กำไรจริง'].map((heading) => <th className="whitespace-nowrap p-2" key={heading}>{heading}</th>)}</tr></thead>
        <tbody>{cohorts.map((row) => <tr className="border-t" key={row.cohort}><td className="p-2">{row.cohort}</td><td>{row.total}</td><td>{row.won}</td><td>{row.lost}</td><td>{row.disqualified}</td><td>{row.open}</td><td>{Math.floor((Date.now() - row.oldest_at) / 86400000)} วัน</td><td>{row.sales_amount?.toLocaleString('th-TH') ?? '—'}</td><td>{row.actual_profit?.toLocaleString('th-TH') ?? '—'}</td></tr>)}</tbody></table>
    </section>
  </div>;
}
