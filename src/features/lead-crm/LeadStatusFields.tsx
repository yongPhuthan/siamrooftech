'use client';
import type { CrmStage } from './contracts';
import { STAGE_LABELS } from './contracts';
import { buttonClass, fieldClass } from './client';

const descriptions: Record<string, string> = {
  pending: 'มีผู้ติดต่อทักเข้ามาแล้ว แต่ยังตรวจคุณสมบัติไม่ครบ',
  qualified: 'ผ่านคุณสมบัติครบ 3 ข้อ และกำลังติดตามเพื่อปิดการขาย',
  site_visit_completed: 'เข้าดูหน้างานแล้ว และกำลังติดตามเพื่อปิดการขาย',
  won: 'ลูกค้าตกลงซื้อบริการแล้ว ต้องบันทึกยอดขายและกำไรจริง',
};
export default function LeadStatusFields({ stage, onChange }: { stage: CrmStage; onChange(stage: CrmStage): void }) {
  const closed = stage === 'lost' || stage === 'disqualified';
  const main = stage === 'quoted' || stage === 'assessment' ? 'qualified' : stage;
  return <div className="space-y-3">
    {closed ? <div className="space-y-3 rounded-lg bg-slate-100 p-4"><p className="text-sm font-semibold text-slate-800">จบการติดตาม · {STAGE_LABELS[stage]}</p><p className="text-xs text-slate-600">ยังไม่มีการขายสำเร็จสำหรับงานนี้</p><button type="button" className={buttonClass} onClick={() => onChange('pending')}>กลับมาติดตามลูกค้า</button></div> : <>
      <label className="block space-y-1.5 text-sm font-medium text-slate-700"><span>สถานะลูกค้า</span><select aria-label="สถานะลูกค้า" className={fieldClass} value={main} onChange={(event) => onChange(event.target.value as CrmStage)}><option value="pending">Lead · ผู้ติดต่อใหม่</option><option value="qualified">Qualified Lead · ผ่านคุณสมบัติ</option><option value="site_visit_completed">Site Visit Completed · ดูหน้างานแล้ว</option><option value="won">Converted Lead · ซื้อบริการแล้ว</option></select></label>
      <p className="text-xs leading-relaxed text-slate-500">{descriptions[main]}</p>
      {main === 'qualified' && <details className="text-xs text-slate-500"><summary className="cursor-pointer py-2">รายละเอียดการติดตาม</summary><label className="mt-2 block space-y-1.5"><span>ความคืบหน้า</span><select aria-label="ความคืบหน้า" className={fieldClass} value={stage} onChange={(event) => onChange(event.target.value as CrmStage)}><option value="qualified">กำลังคุยรายละเอียด</option><option value="quoted">ขอใบเสนอราคา</option><option value="assessment">นัดประเมินงาน</option></select></label></details>}
      <details className="text-xs text-slate-500"><summary className="cursor-pointer py-2">จบการติดตามโดยไม่มีการขาย</summary><p className="py-2">เลือกผลการติดตาม แล้วกดบันทึกข้อมูลลูกค้า</p><div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={() => onChange('lost')}>ปิดการขายไม่ได้</button><button type="button" className={buttonClass} onClick={() => onChange('disqualified')}>ไม่ตรงเงื่อนไขบริการ</button></div></details>
    </>}
  </div>;
}
