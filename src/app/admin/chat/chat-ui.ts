import type { LeadStage } from './types';

export const LEAD_STAGE: Record<LeadStage, { label: string; className: string }> = {
  pending: { label: 'Lead', className: 'bg-slate-100 text-slate-700 ring-slate-200' },
  assessment: { label: 'Qualified Lead · นัดประเมิน', className: 'bg-purple-50 text-purple-700 ring-purple-200' },
  new: { label: 'ใหม่', className: 'bg-sky-50 text-sky-700 ring-sky-200' },
  contacted: { label: 'ติดต่อแล้ว', className: 'bg-blue-50 text-blue-700 ring-blue-200' },
  qualified: { label: 'Qualified Lead', className: 'bg-indigo-50 text-indigo-700 ring-indigo-200' },
  quoted: { label: 'Qualified Lead · ขอใบเสนอราคา', className: 'bg-violet-50 text-violet-700 ring-violet-200' },
  site_visit_completed: { label: 'Site Visit Completed · ดูหน้างานแล้ว', className: 'bg-cyan-50 text-cyan-800 ring-cyan-200' },
  won: { label: 'Converted Lead', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  lost: { label: 'ปิดการขายไม่ได้', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
  disqualified: { label: 'ไม่ตรงเงื่อนไขบริการ', className: 'bg-slate-100 text-slate-600 ring-slate-200' },
};

export function googleTone(state: string): string {
  if (state === 'succeeded') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  if (state === 'failed' || state === 'partial_success') return 'bg-red-50 text-red-700 ring-red-200';
  if (state === 'ingest_accepted' || state === 'processing' || state === 'pending') return 'bg-amber-50 text-amber-800 ring-amber-200';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

export function formatChatTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

export function maskedIdentifier(value: unknown): string {
  if (typeof value !== 'string' || !value) return '—';
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}
