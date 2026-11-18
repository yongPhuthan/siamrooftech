import { z } from 'zod';

// This module is shared by the browser, Next.js proxy and standalone Worker.
// It contains contracts and pure policy only; no bindings or browser globals.
export { LANDING_REGISTRY, ATTRIBUTION_KEYS } from './attribution';
export type { LandingId } from './attribution';
import { LANDING_REGISTRY, ATTRIBUTION_KEYS } from './attribution';
const attributionShape = Object.fromEntries(ATTRIBUTION_KEYS.map((key) => [key, z.string().max(512).optional()])) as Record<(typeof ATTRIBUTION_KEYS)[number], z.ZodOptional<z.ZodString>>;
export const attributionSchema = z.object(attributionShape).strict();
export const adsTouchSchema = z.object({
  click_id: z.string().uuid(),
  session_id: z.string().uuid(),
  landing_id: z.enum(['electric-awning', 'retractable-awning', 'chatgpt-electric-awning']),
  landing_path: z.string().max(256),
  attribution: attributionSchema,
}).strict().refine((value) => LANDING_REGISTRY[value.landing_id] === value.landing_path, 'landing does not match registry');
export type AdsTouch = z.infer<typeof adsTouchSchema>;
export const gateSchema = z.enum(['pass', 'fail', 'unknown']);
export const stageSchema = z.enum(['pending', 'qualified', 'quoted', 'assessment', 'site_visit_completed', 'won', 'lost', 'disqualified']);
export type CrmStage = z.infer<typeof stageSchema>;
export const revisionSchema = z.number().int().nonnegative();
export const reviewSchema = z.object({
  revision: revisionSchema,
  stage: stageSchema,
  service: gateSchema,
  area: gateSchema,
  intent: gateSchema,
  reason: z.string().trim().min(1).max(2000),
  probability: z.number().min(0).max(1).nullable(),
  expected_profit: z.number().finite().nonnegative().max(1e9).nullable(),
  value: z.number().finite().nonnegative().max(1e9).nullable(),
  actual_profit: z.number().finite().min(-1e9).max(1e9).nullable(),
  sales_amount: z.number().finite().nonnegative().max(1e9).nullable().default(null),
  valuation_version_id: z.string().uuid().nullable(),
  approve: z.boolean(),
  confirm_match: z.boolean(),
  confirm_final_zero: z.boolean(),
}).strict();
export type LeadReview = z.infer<typeof reviewSchema>;
export const valuationSchema = z.object({
  stage: z.enum(['pending', 'qualified', 'site_visit_completed']),
  label: z.string().trim().min(1).max(120),
  probability: z.number().min(0).max(1),
  expected_profit: z.number().finite().nonnegative().max(1e9).default(0),
  enabled: z.boolean(),
  supersedes_id: z.string().uuid().nullable().default(null),
}).strict();
export type ValuationVersion = z.infer<typeof valuationSchema> & { id: string; created_at: number; actor: string };
// Initial business settings explicitly chosen by the owner. Later revisions live in D1.
export const PROBABILITY_STAGES = ['pending', 'qualified', 'site_visit_completed'] as const;
export type ProbabilityStage = (typeof PROBABILITY_STAGES)[number];
export const DEFAULT_STAGE_PROBABILITIES: Record<ProbabilityStage, number> = {
  pending: 0.10, qualified: 0.25, site_visit_completed: 0.75,
};
export function probabilityStage(stage: CrmStage): ProbabilityStage | null {
  // A booked appointment is still Qualified; it does not prove a completed visit.
  if (stage === 'quoted' || stage === 'assessment') return 'qualified';
  return PROBABILITY_STAGES.includes(stage as ProbabilityStage) ? stage as ProbabilityStage : null;
}
export function stageProbability(stage: CrmStage, versions: ValuationVersion[]): { probability: number; version_id: string | null } {
  const key = probabilityStage(stage);
  if (!key) return { probability: stage === 'won' ? 1 : 0, version_id: null };
  const version = versions.find((item) => item.enabled && item.stage === key);
  return { probability: version?.probability ?? DEFAULT_STAGE_PROBABILITIES[key], version_id: version?.id ?? null };
}
export interface AttributionMatch {
  click_id: string;
  method: 'timestamp' | 'follow_timestamp' | 'manual';
  anchor_at: number;
  delta_ms: number;
  tier: 'near' | 'review';
}
export interface ConversionRecord {
  lead_id: string;
  transaction_id: string;
  event_at: number;
  state: 'active' | 'retraction_pending' | 'retracted';
}
export function reviewValue(review: LeadReview): number | null {
  if (review.stage === 'lost' || review.stage === 'disqualified') return 0;
  if (review.stage === 'won') return review.actual_profit === null ? null : Math.max(0, review.actual_profit);
  if (review.probability !== null && review.expected_profit !== null) {
    return Math.round(review.probability * review.expected_profit * 100) / 100;
  }
  return null;
}
export function reviewProblem(review: LeadReview): string | null {
  if (review.stage === 'won' && (review.sales_amount == null || review.actual_profit === null)) return 'กรอกยอดขายและกำไรจริงก่อนบันทึก Converted Lead';
  if (review.stage === 'won' && review.actual_profit !== null && review.sales_amount != null && review.actual_profit > review.sales_amount) return 'กำไรจริงต้องไม่มากกว่ายอดขาย';
  if (['qualified', 'quoted', 'assessment', 'site_visit_completed', 'won'].includes(review.stage) &&
      [review.service, review.area, review.intent].some((gate) => gate !== 'pass')) return 'กรุณายืนยัน Qualified Gate ทั้งสามข้อ';
  if (review.approve && (!review.confirm_match || reviewValue(review) === null)) return 'ต้องตรวจคู่และระบุมูลค่าก่อนอนุมัติ';
  if (review.approve && review.stage === 'disqualified' && reviewValue(review) !== 0) return 'รายการที่ไม่เกี่ยวข้องต้องมีมูลค่า 0';
  if (review.approve && reviewValue(review) === 0 && !review.confirm_final_zero) return 'ต้องยืนยันมูลค่า 0 เป็นผลสุดท้าย';
  return null;
}
export function chooseMatch(
  clicks: Array<{ click_id: string; clicked_at: number }>, firstMessageAt: number, follows: number[],
): { candidates: AttributionMatch[]; selected: AttributionMatch | null } {
  const direct = clicks.filter((click) => click.clicked_at <= firstMessageAt && firstMessageAt - click.clicked_at <= 30 * 60_000);
  let candidates: AttributionMatch[] = direct.map((click) => ({ click_id: click.click_id, method: 'timestamp', anchor_at: firstMessageAt,
    delta_ms: firstMessageAt - click.clicked_at, tier: firstMessageAt - click.clicked_at <= 10 * 60_000 ? 'near' : 'review' }));
  if (!candidates.length) {
    candidates = clicks.flatMap((click): AttributionMatch[] => {
      const follow = follows.filter((at) => at <= firstMessageAt && at >= click.clicked_at && at - click.clicked_at <= 30 * 60_000).sort((a, b) => a - b)[0];
      return follow === undefined ? [] : [{ click_id: click.click_id, method: 'follow_timestamp', anchor_at: follow,
        delta_ms: follow - click.clicked_at, tier: 'review' }];
    });
  }
  candidates.sort((a, b) => a.delta_ms - b.delta_ms || a.click_id.localeCompare(b.click_id));
  const first = candidates[0];
  return { candidates, selected: first && first.tier === 'near' && candidates[1]?.delta_ms !== first.delta_ms ? first : null };
}

export function bangkokRange(days: number, now = Date.now()): { from: number; to: number } {
  const localDay = Math.floor((now + 7 * 3600_000) / 86400_000);
  return { from: (localDay - days + 1) * 86400_000 - 7 * 3600_000, to: now + 1 };
}

export interface CrmLeadView {
  lead_id: string; conversation_id: string; created_at: number; first_message_at: number | null;
  revision: number; model_version: number; status: CrmStage; review_state: string;
  review_json: string | null; touch_id: string | null; match_method: string | null;
  estimated_value: number | null; actual_value: number | null;
  gclid: string | null; gbraid: string | null; wbraid: string | null;
  attribution_raw: string | null; ads_state: string; ads_last_error: string | null;
  display_name?: string | null; picture_url?: string | null; last_message_at?: number;
}
export interface CrmJobView {
  job_id: string; kind: string; conversion_value: number; state: string; mode: string;
  is_simulation: number; error: string | null; created_at: number; google_request_id: string | null;
}
export interface CrmDetail {
  lead: CrmLeadView;
  profile: { display_name: string | null; picture_url: string | null } | null;
  conversion: ConversionRecord | null;
  touch: { clicked_at: number; received_at: number; landing_path: string; landing_id: string } | null;
  evidence: { candidates: Array<AttributionMatch & { touch?: { attribution_json: string; landing_id: string } }>; truncated: boolean };
  matches: Array<{ id: string; at: number; actor: string; selected_click_id: string | null; evidence_json: string }>;
  reviews: Array<{ id: string; revision: number; at: number; actor: string; value: number | null; review_json: string }>;
  jobs: CrmJobView[];
}
export interface CrmHealth {
  delivery_mode: 'dry_run' | 'live';
  retention: { state: string; started_at: number; messages_deleted: number } | null;
  pending: { count: number; oldest_at: number | null };
}
export const STAGE_LABELS: Record<CrmStage, string> = {
  pending: 'Lead', qualified: 'Qualified Lead', quoted: 'Qualified Lead · ขอใบเสนอราคา', assessment: 'Qualified Lead · นัดประเมิน',
  site_visit_completed: 'Site Visit Completed · ดูหน้างานแล้ว', won: 'Converted Lead', lost: 'ปิดการขายไม่ได้', disqualified: 'ไม่ตรงเงื่อนไขบริการ',
};
