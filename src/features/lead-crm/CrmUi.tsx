'use client';
import { useState, type ReactNode } from 'react';
import { ChevronDown, FlaskConical, Radio } from 'lucide-react';
import type { CrmJobView } from './contracts';

export function CrmDisclosure({ title, description, children, initiallyOpen = false }: {
  title: string; description?: string; children: ReactNode; initiallyOpen?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  return <details className="group rounded-xl border border-slate-200 bg-white" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 [&::-webkit-details-marker]:hidden">
      <span className="min-w-0"><span className="block text-sm font-semibold text-slate-900">{title}</span>{description && <span className="mt-1 block text-xs leading-relaxed text-slate-500">{description}</span>}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    {open && <div className="border-t border-slate-100 p-4">{children}</div>}
  </details>;
}
export function CrmBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red' }) {
  const colors = { neutral: 'bg-slate-100 text-slate-600', blue: 'bg-blue-50 text-blue-700', green: 'bg-emerald-50 text-emerald-800', amber: 'bg-amber-50 text-amber-800', red: 'bg-red-50 text-red-700' };
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${colors[tone]}`}>{children}</span>;
}
export function DeliveryNotice({ mode }: { mode: 'dry_run' | 'live' | undefined }) {
  const live = mode === 'live';
  const Icon = live ? Radio : FlaskConical;
  return <div className={`flex items-start gap-3 rounded-xl border p-4 ${live ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
    <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
    <div><p className="text-sm font-semibold">{live ? 'เปิดส่งข้อมูล Google แล้ว' : mode === 'dry_run' ? 'โหมดทดสอบ · ยังไม่ส่งข้อมูลให้ Google' : 'กำลังตรวจโหมดการส่งข้อมูล'}</p>
      <p className="mt-1 text-xs leading-relaxed">{live ? 'เมื่อยืนยันมูลค่า ระบบจะส่งข้อมูลอัตโนมัติ แล้วแสดงผลประมวลผลจาก Google Ads' : mode === 'dry_run' ? 'การยืนยันมูลค่าในตอนนี้จะบันทึกและจำลองการส่งเท่านั้น ไม่มีข้อมูลส่งให้ Google Ads' : 'รอให้ระบบตรวจสอบเสร็จก่อนยืนยันมูลค่า'}</p>
    </div>
  </div>;
}
export function deliveryLabel(state: string): string {
  return ({ not_sent: 'ยังไม่ส่ง', pending: 'รอส่ง', ingest_accepted: 'Google รับคำขอแล้ว', processing: 'Google กำลังประมวลผล', succeeded: 'Google ยืนยันสำเร็จ', partial_success: 'สำเร็จบางส่วน · ต้องตรวจ', failed: 'ส่งไม่สำเร็จ', dry_run: 'ทดสอบแล้ว · ไม่ได้ส่ง Google' } as Record<string, string>)[state] ?? 'รอตรวจสถานะ';
}
export function jobLabel(job: CrmJobView): string {
  if (job.mode === 'dry_run' || job.is_simulation === 1) return job.state === 'succeeded' ? 'ทดสอบผ่าน · ไม่ได้ส่ง Google' : job.state === 'failed' ? 'ทดสอบไม่ผ่าน' : 'รอทดสอบ · ไม่ได้ส่ง Google';
  return deliveryLabel(job.state);
}
export function money(value: number | null | undefined) {
  return value == null ? 'ยังไม่กำหนด' : `${value.toLocaleString('th-TH', { maximumFractionDigits: 2 })} บาท`;
}
