'use client';

import type { ArticleOnPageAnalysis, AnalysisFinding, AnalysisTarget } from '../analysis/on-page-analysis';
import type { ArticleSeoSettings } from '../document-schema';

interface ArticleOnPagePanelProps {
  settings: ArticleSeoSettings;
  analysis: ArticleOnPageAnalysis | null;
  isCurrent: boolean;
  onSettingsChange: (settings: ArticleSeoSettings) => void;
  onTargetClick: (target: AnalysisTarget) => void;
}

export default function ArticleOnPagePanel({ settings, analysis, isCurrent, onSettingsChange, onTargetClick }: ArticleOnPagePanelProps) {
  const updateList = (key: 'secondaryKeywords' | 'primaryAliases', value: string) => {
    onSettingsChange({ ...settings, [key]: value.split('\n').map((item) => item.trim()).filter(Boolean) });
  };

  return (
    <div className="space-y-4" aria-label="ตรวจ On-page SEO">
      <div className="space-y-3">
        <Field field="seoSettings.primaryKeyword" label="คำหลัก">
          <input value={settings.primaryKeyword ?? ''} maxLength={120} onChange={(event) => onSettingsChange({ ...settings, primaryKeyword: event.target.value })} className="article-admin-input" placeholder="คำหรือวลีหลัก" />
        </Field>
        <Field field="seoSettings.secondaryKeywords" label="คำรอง (หนึ่งรายการต่อบรรทัด)">
          <textarea value={settings.secondaryKeywords.join('\n')} rows={3} onChange={(event) => updateList('secondaryKeywords', event.target.value)} className="article-admin-input" placeholder="คำหรือวลีรอง" />
        </Field>
        <Field field="seoSettings.primaryAliases" label="คำเรียกใกล้เคียงของคำหลัก">
          <textarea value={settings.primaryAliases.join('\n')} rows={3} onChange={(event) => updateList('primaryAliases', event.target.value)} className="article-admin-input" placeholder="เพิ่มเฉพาะคำที่ยืนยันว่าใช้แทนกันได้" />
        </Field>
        <p className="text-xs leading-relaxed text-slate-500">ระบบจับคำและวลีจากข้อความจริง ไม่เดาคำพ้องและไม่กำหนดความหนาแน่นที่ต้องผ่าน จำนวนคำภาษาไทยเป็นค่าประมาณ</p>
      </div>

      {!analysis ? <p className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">รอวิเคราะห์หลังหยุดแก้ไข 400 ms…</p> : <>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="คำในเนื้อหาโดยประมาณ" value={analysis.wordCount === null ? 'ตรวจไม่ได้' : analysis.wordCount.toLocaleString('th-TH')} />
          <Stat label="ส่วนหัวข้อ" value={analysis.headings.length.toLocaleString('th-TH')} />
          <Stat label="ลิงก์ใน / ภายนอก" value={`${analysis.links.internal} / ${analysis.links.external}`} />
          <Stat label="รูปภาพ" value={analysis.images.total.toLocaleString('th-TH')} />
        </div>

        <section className="rounded border border-slate-200 bg-white p-3" aria-label="ตัวอย่างผลค้นหาโดยประมาณ">
          <h3 className="mb-2 text-xs font-semibold text-slate-700">ตัวอย่างผลค้นหาโดยประมาณ</h3>
          <p className="truncate text-xs text-emerald-800">เว็บไซต์ › {analysis.previewPath}</p>
          <p className="mt-1 line-clamp-2 text-base leading-snug text-blue-800">{analysis.title.value || 'SEO title ยังว่าง'}</p>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600">{analysis.description.value || 'Meta description ยังว่าง'}</p>
          <p className="mt-2 text-[11px] text-slate-500">Title {analysis.title.characters} อักขระ · Description {analysis.description.characters} อักขระ; Google อาจเลือกข้อความอื่นตามคำค้น</p>
        </section>

        <section className="space-y-2" aria-label="ผลตรวจคีย์เวิร์ด">
          <h3 className="text-sm font-semibold text-slate-900">คำและตำแหน่งที่พบ</h3>
          <p className="text-xs leading-relaxed text-slate-500">สูตรความถี่: จำนวนครั้งที่พบ ÷ จำนวนคำในเนื้อหา × 100; แสดงเพื่อประกอบการอ่านเท่านั้น ไม่มีเปอร์เซ็นต์เป้าหมาย</p>
          {analysis.keywords.length === 0 ? <p className="text-sm text-slate-500">เพิ่มคำหลักหรือคำรองเพื่อเริ่มตรวจ</p> : analysis.keywords.map((keyword) => (
            <div key={`${keyword.kind}:${keyword.phrase}`} className="rounded border border-slate-200 bg-white p-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><p className="break-words text-sm font-medium text-slate-900">{keyword.phrase}</p><p className="text-xs text-slate-500">{keyword.kind === 'primary' ? 'คำหลัก' : keyword.kind === 'alias' ? 'คำเรียกใกล้เคียง' : 'คำรอง'}</p></div>
                <span className="shrink-0 text-right text-xs tabular-nums text-slate-600"><span className="block">{keyword.occurrences} ครั้ง{keyword.perHundredWords === null ? '' : ` · ${keyword.perHundredWords.toFixed(2)}/100 คำ`}</span><span className="mt-1 block">{analysis.wordCount === null ? 'ต้องตรวจเอง' : keyword.occurrences ? 'พบแล้ว' : 'ควรพิจารณา'}</span></span>
              </div>
              {keyword.locations.filter((location) => location.count > 0).length > 0 && <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                {keyword.locations.filter((location) => location.count > 0).map((location) => <li key={location.label}>
                  <TargetButton current={isCurrent} target={location.target} onClick={onTargetClick}>{location.label} · {location.count}</TargetButton>
                </li>)}
              </ul>}
            </div>
          ))}
        </section>

        <section className="space-y-2" aria-label="ผลตรวจ On-page">
          <h3 className="text-sm font-semibold text-slate-900">รายการตรวจ</h3>
          {analysis.findings.map((finding) => <FindingRow key={finding.id} finding={finding} current={isCurrent} onClick={onTargetClick} />)}
        </section>
        <p className="text-[11px] leading-relaxed text-slate-500">กฎ {analysis.ruleset} · ผลเป็นการตรวจเชิงโครงสร้างจากข้อมูลในเครื่อง ไม่ทำนายอันดับ การจัดทำดัชนี หรือการอ้างอิงโดย AI</p>
      </>}
    </div>
  );
}

function Field({ field, label, children }: { field: string; label: string; children: React.ReactNode }) {
  return <label data-article-field={field} className="block space-y-1 text-xs font-medium text-slate-700">{label}{children}</label>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded border border-slate-200 bg-slate-50 p-2"><p className="text-[11px] leading-snug text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p></div>;
}

function FindingRow({ finding, current, onClick }: { finding: AnalysisFinding; current: boolean; onClick: (target: AnalysisTarget) => void }) {
  const statusLabel = finding.status === 'found' ? 'พบแล้ว' : finding.status === 'consider' ? 'ควรพิจารณา' : 'ต้องตรวจเอง';
  const body = <><span className={`mt-1 block h-2 w-2 shrink-0 rounded-full ${finding.status === 'found' ? 'bg-emerald-600' : finding.status === 'consider' ? 'bg-amber-500' : 'bg-slate-400'}`} aria-hidden="true" /><span className="min-w-0"><span className="block text-sm font-medium text-slate-800">{finding.title}</span><span className="mt-1 block text-[11px] font-medium text-slate-500">{statusLabel}</span><span className="mt-1 block text-xs leading-relaxed text-slate-600">{finding.reason}</span><span className="mt-1 block break-words text-xs text-slate-500">{finding.evidence}</span></span></>;
  return finding.target ? <button type="button" disabled={!current} onClick={() => onClick(finding.target!)} className="flex w-full gap-2 rounded border border-slate-200 bg-white p-2.5 text-left hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-60">{body}</button> : <div className="flex gap-2 rounded border border-slate-200 bg-white p-2.5">{body}</div>;
}

function TargetButton({ children, target, current, onClick }: { children: React.ReactNode; target?: AnalysisTarget; current: boolean; onClick: (target: AnalysisTarget) => void }) {
  if (!target) return <span className="text-xs text-slate-600">{children}</span>;
  return <button type="button" disabled={!current} onClick={() => onClick(target)} className="w-full text-left text-xs text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 disabled:cursor-default disabled:text-slate-500 disabled:no-underline">{children}</button>;
}
