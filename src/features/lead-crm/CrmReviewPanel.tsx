'use client';
import { Avatar } from '@/components/admin/CustomerAvatar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Check, ArrowRight } from 'lucide-react';
import { STAGE_LABELS, stageProbability, reviewProblem, reviewValue, type CrmDetail, type CrmHealth, type LeadReview, type ValuationVersion, type CrmStage } from './contracts';
import { buttonClass, primaryButtonClass, crmDate, crmRequest, fieldClass } from './client';
import { CrmBadge, CrmDisclosure, DeliveryNotice, jobLabel, money } from './CrmUi';
import CrmHistory from './CrmHistory';
import LeadStatusFields from './LeadStatusFields';

const gates = [{ key: 'service', label: 'ระบุบริการหรือปัญหาชัดเจน' }, { key: 'area', label: 'อยู่ในพื้นที่และขอบเขตรับงาน' }, { key: 'intent', label: 'ต้องการดำเนินการต่อ เช่น ขอราคา / นัดประเมิน' }] as const;
const matchLabels: Record<string, string> = { timestamp: 'ตามเวลาคลิกและข้อความ', follow_timestamp: 'ตามเวลาเพิ่มเพื่อน', manual: 'Admin เลือกคู่' };

export default function CrmReviewPanel({ leadId, onRefresh }: { leadId: string; onRefresh?: () => void | Promise<void> }) {
  const [detail, setDetail] = useState<CrmDetail | null>(null);
  const [health, setHealth] = useState<CrmHealth | null>(null);
  const [versions, setVersions] = useState<ValuationVersion[]>([]);
  const [review, setReview] = useState<LeadReview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const refreshParent = useRef(onRefresh);
  useEffect(() => { refreshParent.current = onRefresh; }, [onRefresh]);
  const load = useCallback(async (signal?: AbortSignal) => {
    const [data, formulas, status] = await Promise.all([
      crmRequest<CrmDetail>(`/leads/${leadId}`, undefined, signal),
      crmRequest<ValuationVersion[]>('/valuations', undefined, signal),
      crmRequest<CrmHealth>('/health', undefined, signal),
    ]);
    if (signal?.aborted) return;
    setDetail(data); setVersions(formulas); setHealth(status); setConfirmOpen(false);
    const old = data.lead.review_json ? JSON.parse(data.lead.review_json) as LeadReview : null;
    const setting = stageProbability(data.lead.status, formulas);
    setReview({ revision: data.lead.revision, stage: data.lead.status,
      service: old?.service ?? 'unknown', area: old?.area ?? 'unknown', intent: old?.intent ?? 'unknown',
      reason: old?.reason ?? '', probability: setting.probability, expected_profit: old?.expected_profit ?? null,
      value: null, actual_profit: old?.actual_profit ?? null, sales_amount: old?.sales_amount ?? null, valuation_version_id: setting.version_id,
      approve: false, confirm_match: false, confirm_final_zero: false });
  }, [leadId]);
  useEffect(() => {
    const controller = new AbortController(); setDetail(null); setError(''); setNotice('');
    load(controller.signal).catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [load]);
  useEffect(() => {
    if (!['pending', 'ingest_accepted', 'processing'].includes(detail?.jobs[0]?.state ?? '')) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      crmRequest<CrmDetail>(`/leads/${leadId}`, undefined, controller.signal)
        .then(async (data) => {
          if (controller.signal.aborted) return;
          setDetail(data);
          if (!['pending', 'ingest_accepted', 'processing'].includes(data.jobs[0]?.state ?? '')) await refreshParent.current?.();
        })
        .catch(() => { /* Keep the last known state; the refresh control remains available. */ });
    }, 5000);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [detail, leadId]);
  async function mutate(path: string, body: unknown, success = 'บันทึกข้อมูลแล้ว') {
    setBusy(true); setError(''); setNotice('');
    try { await crmRequest(path, body); await load(); await onRefresh?.(); setNotice(success); }
    catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  }
  if (!detail || !review) return <div className="rounded-xl border border-slate-200 bg-white p-6">{error ? <p role="alert" className="text-red-700">{error}</p> : <p role="status" className="text-sm text-slate-500">กำลังโหลดข้อมูลลูกค้า…</p>}</div>;
  const lead = detail.lead;
  const patch = (values: Partial<LeadReview>) => { setNotice(''); setReview((old) => old ? { ...old, ...values } : old); };
  const attribution: Record<string, string> = lead.attribution_raw ? JSON.parse(lead.attribution_raw) : {};
  const value = reviewValue(review);
  const latestJob = detail.jobs[0];
  const matched = Boolean(lead.touch_id);
  const live = health?.delivery_mode === 'live';
  const approvalBlocked = !health?.delivery_mode ? 'ยังตรวจโหมดการส่งไม่สำเร็จ' : !matched ? 'ต้องจับคู่คลิกโฆษณาก่อนยืนยันมูลค่า' : !(lead.gclid || lead.gbraid || lead.wbraid) ? 'ไม่มีรหัสคลิกโฆษณาสำหรับส่ง Google' : !lead.first_message_at ? 'รอข้อความแรกจากลูกค้า' : detail.conversion && detail.conversion.state !== 'active' ? 'รายการนี้ถูกถอนหรืออยู่ระหว่างถอนแล้ว' : value === null ? 'ระบุมูลค่าก่อนยืนยันมูลค่า' : latestJob && latestJob.state !== 'succeeded' ? 'รอผลรายการก่อนหน้า หรือแก้ปัญหาการส่งก่อน' : value === 0 && !detail.jobs.some((job) => live ? job.mode === 'live' && job.is_simulation !== 1 : job.mode === 'dry_run' || job.is_simulation === 1) ? 'มูลค่า 0 ก่อนส่งครั้งแรก บันทึกข้อมูลลูกค้าได้ แต่ยังส่งมูลค่าไม่ได้' : null;
  const closed = review.stage === 'lost' || review.stage === 'disqualified';
  return <div className="min-w-0 space-y-3">
    <header className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><Avatar name={detail.profile?.display_name ?? 'ลูกค้า LINE'} src={detail.profile?.picture_url ?? null} /><div className="min-w-0"><h2 className="break-words text-lg font-semibold text-slate-900">{detail.profile?.display_name ?? 'ลูกค้า LINE'}</h2><p className="mt-1 text-xs text-slate-500">เริ่มคุย {crmDate(lead.first_message_at)}</p></div></div>
        <button type="button" className={buttonClass} aria-label="โหลดข้อมูลลูกค้าล่าสุด" disabled={busy} onClick={() => { setError(''); void load().catch((err: Error) => setError(err.message)); }}><RefreshCw className="h-4 w-4" aria-hidden="true" /></button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><CrmBadge tone={lead.status === 'won' ? 'green' : 'blue'}>{STAGE_LABELS[lead.status]}</CrmBadge><CrmBadge tone={matched ? 'green' : 'amber'}>{matched ? 'มีคู่คลิกโฆษณา' : 'ยังไม่มีคู่โฆษณา'}</CrmBadge><CrmBadge tone={lead.review_state === 'approved' ? 'blue' : 'neutral'}>{lead.review_state === 'approved' ? 'ยืนยันมูลค่าแล้ว' : lead.review_state === 'reviewed' ? 'บันทึกข้อมูลแล้ว' : 'ยังไม่ประเมิน'}</CrmBadge></div>
      <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-slate-100 pt-3"><span className="text-sm text-slate-500">มูลค่าโฆษณาที่บันทึกไว้</span><strong className="text-lg text-slate-900">{money(lead.estimated_value)}</strong></div>
    </header>

    <CrmDisclosure title="ประวัติแชทของลูกค้า" description="เปิดอ่านข้อความและค้นประวัติก่อนประเมินคุณภาพลูกค้า">
      <CrmHistory conversationId={lead.conversation_id} embedded />
    </CrmDisclosure>
    <CrmDisclosure key={`attribution-${lead.touch_id ?? 'none'}`} title="ที่มาจากโฆษณาและการจับคู่" description={matched ? `${attribution.utm_campaign || attribution.srt_campaignid || 'มีข้อมูลคลิก'} · ${matchLabels[lead.match_method ?? ''] || 'รอตรวจวิธีจับคู่'}` : 'ยังจับคู่ไม่ได้ · เปิดเพื่อดูคลิกที่เป็นไปได้'} initiallyOpen={!matched}>
      <p className="text-sm text-slate-700">คลิก LINE {crmDate(detail.touch?.clicked_at)}</p><p className="mt-1 break-all text-xs text-slate-500">{detail.touch?.landing_path ?? 'ยังไม่มีหน้าที่จับคู่'}</p>
      <dl className="mt-4 space-y-2 text-sm">{(['utm_campaign', 'srt_campaignid', 'srt_adgroupid', 'srt_adid', 'srt_keyword', 'srt_matchtype', 'srt_device', 'srt_network', 'srt_location'] as const).map((key) => <div key={key} className="grid grid-cols-2 gap-3"><dt className="text-slate-500">{{ utm_campaign: 'แคมเปญ (UTM)', srt_campaignid: 'Campaign ID', srt_adgroupid: 'Ad Group ID', srt_adid: 'Ad ID', srt_keyword: 'Keyword ที่ซื้อ', srt_matchtype: 'Match type', srt_device: 'อุปกรณ์', srt_network: 'เครือข่าย', srt_location: 'Location ID' }[key]}</dt><dd className="break-all text-slate-900">{attribution[key] || 'ไม่ได้รับข้อมูล'}</dd></div>)}</dl>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">การจับคู่ตามเวลาเป็นการระบุที่มาตามกติกาธุรกิจ · Keyword คือคำที่ตั้งซื้อ ไม่ใช่คำค้นจริงของบุคคล · ไม่มีข้อมูล CPC รายคลิก</p>
      {detail.evidence.truncated && <p role="alert" className="mt-3 text-sm text-amber-800">มีหลายคลิกเกินขอบเขตตรวจอัตโนมัติ กรุณาตรวจด้วยมือ</p>}
      {!detail.conversion && detail.evidence.candidates.map((candidate) => <div key={candidate.click_id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-xs"><span>{candidate.touch?.landing_id} · ห่าง {Number((candidate.delta_ms / 60000).toFixed(1))} นาที · {matchLabels[candidate.method]}</span><button type="button" disabled={busy || candidate.click_id === lead.touch_id} className={buttonClass} onClick={() => mutate(`/leads/${leadId}/match`, { revision: lead.revision, click_id: candidate.click_id }, 'เลือกคู่คลิกแล้ว กรุณาตรวจข้อมูลก่อนยืนยันมูลค่า')}>{candidate.click_id === lead.touch_id ? 'คู่ที่เลือกอยู่' : 'เลือกคู่นี้'}</button></div>)}
      <details className="mt-4 text-xs text-slate-500"><summary className="cursor-pointer py-2">หลักฐานเวลาและประวัติการเปลี่ยนคู่</summary>{detail.matches.map((match) => <div key={match.id} className="mt-2 border-t pt-2"><p>{crmDate(match.at)} · {match.actor}</p><pre className="mt-2 overflow-auto whitespace-pre-wrap break-all">{match.evidence_json}</pre></div>)}</details>
    </CrmDisclosure>

    <form className="overflow-hidden rounded-xl border border-slate-200 bg-white" onSubmit={(event) => {
      event.preventDefault();
      const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      const approve = submitter?.value === 'approve';
      if (approve && approvalBlocked) { setError(approvalBlocked); return; }
      const payload = { ...review, approve, confirm_match: approve && review.confirm_match, confirm_final_zero: approve && review.confirm_final_zero };
      const problem = reviewProblem(payload);
      if (problem) { setError(problem.includes('Gate') ? 'กรุณาเลือก “ผ่าน” ให้ครบทั้ง 3 ข้อก่อนใช้สถานะนี้' : problem); return; }
      void mutate(`/leads/${leadId}/review`, payload, approve ? live ? 'ยืนยันมูลค่าแล้ว · รอผลการส่งให้ Google Ads' : 'ยืนยันมูลค่าแล้ว · โหมดทดสอบ: ไม่ได้ส่งข้อมูลให้ Google Ads' : 'บันทึกข้อมูลลูกค้าแล้ว · ยังไม่ได้ยืนยันมูลค่าสำหรับ Google Ads');
    }}>
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5"><h3 className="font-semibold text-slate-900">ข้อมูลลูกค้าและมูลค่าโฆษณา</h3><p className="mt-1 text-xs text-slate-500">บันทึกสถานะลูกค้า แล้วเลือกว่าจะใช้มูลค่านี้กับ Google Ads หรือไม่</p></div>
      <fieldset disabled={busy} className="min-w-0 space-y-6 p-4 disabled:opacity-70 sm:p-5">
        <section className="space-y-4" aria-labelledby="quality-heading"><h4 id="quality-heading" className="text-sm font-semibold text-slate-900">สถานะลูกค้า</h4>
          <LeadStatusFields stage={review.stage} onChange={(stage: CrmStage) => {
            const setting = stageProbability(stage, versions);
            patch({ stage, probability: setting.probability, valuation_version_id: setting.version_id, value: null });
            setConfirmOpen(false);
          }} />
          <div><h5 className="text-sm font-medium text-slate-800">ตรวจคุณสมบัติลูกค้า</h5><p className="mt-1 text-xs leading-relaxed text-slate-500">ตั้งแต่ Qualified Lead ขึ้นไป ต้องผ่านครบทั้ง 3 ข้อ</p></div>
          <div className="divide-y divide-slate-100">{gates.map(({ key, label }) => <div key={key} role="group" aria-labelledby={`${leadId}-${key}-label`} className="grid min-w-0 gap-2 py-3 xl:grid-cols-[minmax(0,1fr)_220px] xl:items-center"><p id={`${leadId}-${key}-label`} className="text-sm text-slate-700">{label}</p><div className="grid grid-cols-3 gap-2">{([{ value: 'unknown', label: 'ยังไม่ทราบ' }, { value: 'pass', label: 'ผ่าน' }, { value: 'fail', label: 'ไม่ผ่าน' }] as const).map((choice) => <label key={choice.value} className={`flex min-h-10 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-2 text-xs focus-within:ring-2 focus-within:ring-blue-500 ${review[key] === choice.value ? choice.value === 'pass' ? 'border-emerald-500 bg-emerald-50 font-medium text-emerald-800' : choice.value === 'fail' ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-400 bg-slate-100 font-medium text-slate-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}><input className="sr-only" type="radio" name={`${leadId}-${key}`} aria-label={`${label}: ${choice.label}`} checked={review[key] === choice.value} onChange={() => patch({ [key]: choice.value })} />{choice.label}</label>)}</div></div>)}</div>
        </section>
        {review.stage === 'won' ? <section className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4" aria-labelledby="actual-heading"><div><h4 id="actual-heading" className="font-semibold text-emerald-950">ผลขายจริง</h4><p className="mt-1 text-xs leading-relaxed text-emerald-900">บันทึกยอดขายและกำไรจริงของงานนี้ เพื่อยืนยัน Converted Lead</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><NumberField label="ยอดขาย (บาท)" value={review.sales_amount} required onChange={(number) => patch({ sales_amount: number })} /><NumberField label="กำไรจริง (บาท)" value={review.actual_profit} required min={-1e9} onChange={(number) => patch({ actual_profit: number })} /></div>
          <p className="text-sm font-medium text-emerald-900">โอกาสปิดการขาย 100% · ขายสำเร็จแล้ว</p><p className="text-xs leading-relaxed text-emerald-900">กำไรจริง = ยอดขาย − ต้นทุนให้บริการ โดยยังไม่หักค่าโฆษณา</p><p className="text-xs leading-relaxed text-emerald-900">Google Ads จะใช้กำไรจริงเป็นมูลค่า Conversion ไม่ใช้ยอดขาย</p>
        </section> : closed ? <p className="rounded-lg bg-slate-100 p-4 text-sm text-slate-700">จบการติดตาม · มูลค่า 0 บาท</p> : <section className="space-y-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4" aria-labelledby="estimate-heading"><div><h4 id="estimate-heading" className="font-semibold text-blue-950">ประมาณการก่อนปิดการขาย</h4><p className="mt-1 text-xs leading-relaxed text-slate-600">มูลค่า Conversion = โอกาสปิดการขายตามสถานะ × กำไรประมาณการ</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5 text-sm"><p className="font-medium text-slate-700">โอกาสปิดการขายตามสถานะ</p><output aria-label="โอกาสปิดการขายตามสถานะ" className="block rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 font-semibold text-slate-900">{Number(((review.probability ?? 0) * 100).toFixed(2))}%</output><p className="text-xs text-slate-500">ใช้ค่าเดียวกันทั้งสถานะ · แก้ได้ที่ตั้งค่าโอกาสปิดการขาย</p></div><NumberField label="กำไรประมาณการ (บาท)" value={review.expected_profit} onChange={(number) => { setConfirmOpen(false); patch({ expected_profit: number }); }} /></div>
          <p className="text-xs leading-relaxed text-slate-600">กำไรที่คาดว่าจะได้เมื่อขายงานนี้สำเร็จ หลังต้นทุนให้บริการ ก่อนหักค่าโฆษณา</p>
          {detail.reviews[0] && JSON.parse(detail.reviews[0].review_json).probability !== review.probability && <p className="text-xs text-amber-800">กำลังใช้เปอร์เซ็นต์ตามสถานะปัจจุบัน มูลค่าที่เคยบันทึกไว้จะเปลี่ยนเมื่อกดบันทึก และจะส่งปรับ Google เมื่อยืนยันมูลค่าเท่านั้น</p>}
        </section>}
        <section className="space-y-4 border-t border-slate-100 pt-5" aria-labelledby="save-heading"><div><h4 id="save-heading" className="text-sm font-semibold text-slate-900">บันทึกข้อมูลลูกค้า</h4><p className="mt-1 text-xs leading-relaxed text-slate-500">เก็บสถานะและข้อมูลกำไรไว้ใน CRM โดยยังไม่ส่งมูลค่าให้ Google Ads</p></div>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>หมายเหตุการประเมิน (จำเป็น)</span><textarea aria-label="หมายเหตุการประเมิน" required rows={2} maxLength={2000} placeholder="เช่น ลูกค้าอยู่ในพื้นที่รับงานและขอใบเสนอราคา" className={fieldClass} value={review.reason} onChange={(event) => patch({ reason: event.target.value })} /></label>
          <button type="submit" name="action" value="draft" className={buttonClass}>บันทึกข้อมูลลูกค้า</button>
        </section>
        <section className="space-y-4 border-t-2 border-blue-100 pt-5" aria-labelledby="ads-heading"><div><h4 id="ads-heading" className="font-semibold text-blue-950">มูลค่า Conversion สำหรับ Google Ads</h4><p className="mt-1 text-xs leading-relaxed text-slate-500">ใช้บอก Google Ads ว่าลูกค้าจากโฆษณารายนี้มีมูลค่าเท่าไร</p></div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4"><p className="text-xs font-medium text-blue-700">มูลค่าที่จะใช้กับโฆษณา</p><p className="mt-1 text-2xl font-semibold tracking-tight text-blue-950">{money(value)}</p>{review.stage !== 'won' && review.probability !== null && review.expected_profit !== null && <p className="mt-2 text-xs leading-relaxed text-blue-800">โอกาสปิดการขาย {Number((review.probability * 100).toFixed(2))}% × กำไรประมาณการ {money(review.expected_profit)}</p>}<p className="mt-2 text-xs leading-relaxed text-blue-800">{review.stage === 'won' ? 'ใช้กำไรจริงของงานนี้แทนมูลค่าประมาณการเดิม' : 'ใช้ค่าล่าสุดของลูกค้ารายนี้ ไม่บวกสะสมกับมูลค่าครั้งก่อน'}</p></div>
          <DeliveryNotice mode={health?.delivery_mode} />
          <button type="button" disabled={Boolean(approvalBlocked)} aria-expanded={confirmOpen} className={primaryButtonClass} onClick={() => { setError(''); setConfirmOpen(true); }}>ใช้มูลค่านี้กับ Google Ads<ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
          <p className="text-xs leading-relaxed text-slate-500">{approvalBlocked || 'กดเพื่อตรวจสอบและยืนยัน ระบบจะบันทึกข้อมูลลูกค้าพร้อมมูลค่าที่เลือก'}</p>
          {confirmOpen && <div className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4" role="region" aria-label="ยืนยันมูลค่าสำหรับ Google Ads"><h5 className="text-sm font-semibold text-blue-950">ยืนยันใช้มูลค่า {money(value)} กับลูกค้ารายนี้</h5><p className="text-xs leading-relaxed text-blue-800">{live ? 'เมื่อยืนยัน ระบบจะบันทึกข้อมูลและส่งมูลค่านี้ให้ Google Ads อัตโนมัติ แล้วรอผลประมวลผล' : 'ขณะนี้เป็นโหมดทดสอบ เมื่อยืนยัน ระบบจะบันทึกข้อมูลและจำลองการส่ง โดยไม่ส่งข้อมูลให้ Google Ads'}</p><p className="text-xs text-slate-600">คลิก LINE {crmDate(detail.touch?.clicked_at)} → เริ่มสนทนา {crmDate(lead.first_message_at)}</p>
            <label className="flex items-start gap-2 text-sm text-slate-800"><input className="mt-1 accent-blue-600" type="checkbox" checked={review.confirm_match} onChange={(event) => patch({ confirm_match: event.target.checked })} />ตรวจข้อมูลลูกค้าและที่มาจากโฆษณาแล้ว</label>
            {value === 0 && <label className="flex items-start gap-2 rounded-lg bg-amber-100 p-3 text-sm text-amber-950"><input className="mt-1" type="checkbox" checked={review.confirm_final_zero} onChange={(event) => patch({ confirm_final_zero: event.target.checked })} />ยืนยัน 0 บาทเป็นผลสุดท้าย การถอนรายการที่ส่ง Google แล้วอาจปรับกลับไม่ได้</label>}
            <div className="flex flex-wrap gap-2"><button type="submit" name="action" value="approve" disabled={!review.confirm_match || (value === 0 && !review.confirm_final_zero) || Boolean(approvalBlocked)} className={primaryButtonClass}><Check className="h-4 w-4" aria-hidden="true" />บันทึกและยืนยันมูลค่า</button><button type="button" className={buttonClass} onClick={() => setConfirmOpen(false)}>กลับไปแก้ไข</button></div>
          </div>}
        </section>
      </fieldset>
      {(busy || notice || error) && <div className="border-t border-slate-100 px-4 py-3 sm:px-5">{busy && <p role="status" className="text-sm text-slate-500">กำลังบันทึก…</p>}{notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</div>}
    </form>

    <CrmDisclosure title="ผลการส่งมูลค่าให้ Google Ads" description={latestJob ? jobLabel(latestJob) : 'ยังไม่ได้ยืนยันมูลค่า'}>
      <p className="mb-3 text-xs leading-relaxed text-slate-500">Google รับคำขอแล้ว → กำลังประมวลผล → ยืนยันผลสำเร็จ · รายการทดสอบไม่มีการส่งจริง</p>
      {!detail.jobs.length && <p className="text-sm text-slate-500">เมื่อยืนยันมูลค่า ผลการส่งจะแสดงที่นี่</p>}
      <div className="space-y-3">{detail.jobs.map((job) => <article key={job.job_id} className="rounded-lg border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><CrmBadge tone={job.state === 'failed' || job.state === 'partial_success' ? 'red' : job.mode === 'dry_run' || job.is_simulation === 1 ? 'blue' : job.state === 'succeeded' ? 'green' : 'amber'}>{jobLabel(job)}</CrmBadge><strong className="text-sm text-slate-900">{money(job.conversion_value)}</strong></div><p className="mt-2 text-xs text-slate-500">{job.kind === 'initial' ? 'ส่งมูลค่าครั้งแรก' : 'ปรับมูลค่ารายการเดิม'} · {crmDate(job.created_at)}</p>{job.error && <p className="mt-2 break-words text-xs text-red-700">{job.error}</p>}<details className="mt-2 text-xs text-slate-500"><summary className="cursor-pointer py-1">ข้อมูลทางเทคนิค</summary><p className="break-all">Request ID: {job.google_request_id ?? 'ยังไม่มี'}</p><p className="break-all">Transaction ID: {detail.conversion?.transaction_id ?? 'ยังไม่มี'}</p><p>เวลา Conversion: {crmDate(detail.conversion?.event_at)}</p></details></article>)}</div>
      {latestJob?.state === 'failed' && <button className={buttonClass + ' mt-3'} disabled={busy} onClick={() => mutate(`/leads/${leadId}/retry`, { revision: lead.revision, job_id: latestJob.job_id }, 'เริ่มตรวจสถานะหรือลองส่งรายการเดิมอีกครั้งแล้ว')}>ตรวจสถานะ / ลองรายการเดิมอีกครั้ง</button>}
    </CrmDisclosure>
    <CrmDisclosure title="ประวัติมูลค่าโฆษณา" description={detail.reviews.length ? `บันทึกแล้ว ${detail.reviews.length} ครั้ง · ดูเหตุผลและมูลค่าแต่ละครั้ง` : 'ยังไม่มีข้อมูลการประเมิน'}>
      <div className="space-y-4">{detail.reviews.map((item) => { const saved = JSON.parse(item.review_json) as LeadReview; return <article className="border-l-2 border-slate-200 pl-4" key={item.id}><div className="flex flex-wrap items-baseline justify-between gap-2"><strong className="text-sm text-slate-900">{money(item.value)}</strong><span className="text-xs text-slate-500">{crmDate(item.at)}</span></div><p className="mt-1 text-xs text-slate-500">{STAGE_LABELS[saved.stage]} · {saved.approve ? 'ยืนยันมูลค่าโฆษณา' : 'บันทึกข้อมูลลูกค้า'}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-700">{saved.reason}</p><details className="mt-2 text-xs text-slate-500"><summary className="cursor-pointer py-1">ผู้บันทึกและรายละเอียดการคำนวณ</summary><p className="break-all">{item.actor}</p><p>โอกาสปิดการขาย: {saved.probability == null ? 'ไม่ได้ระบุ' : `${saved.probability * 100}%`} · กำไรประมาณการ: {money(saved.expected_profit)}</p><p>ยอดขาย: {money(saved.sales_amount)} · กำไรจริง: {money(saved.actual_profit)}</p></details></article>; })}</div>
    </CrmDisclosure>
  </div>;
}
function NumberField({ label, value, onChange, min = 0, max = 1e9, required = false }: {
  label: string; value: number | null; onChange(value: number | null): void; min?: number; max?: number; required?: boolean;
}) {
  return <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>{label}</span><input aria-label={label} required={required} className={fieldClass} type="number" min={min} max={max} step="any" inputMode="decimal" value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? null : Number(event.target.value))} /></label>;
}
