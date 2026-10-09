'use client';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ArticleCoverImageField from './ArticleCoverImageField';
import { ArticleMetadataSchema, type ArticleMetadata } from '../document-schema';
import type { ArticleSeoSettings } from '../document-schema';
import type { ArticleOnPageAnalysis, AnalysisTarget } from '../analysis/on-page-analysis';
import ArticleOnPagePanel from './ArticleOnPagePanel';
import { useCloseArticleMetadataDrawer } from './ArticleWorkspace';

type MetadataSection = 'general' | 'seo' | 'author' | 'sources' | 'onpage';
type SetArticleField = <K extends keyof ArticleMetadata>(key: K, value: ArticleMetadata[K]) => void;

interface ArticleMetadataSidebarProps {
  metadata: ArticleMetadata;
  setField: SetArticleField;
  newTag: string;
  onNewTagChange: (value: string) => void;
  onAddTag: () => void;
  sourceLabel: string;
  onSourceLabelChange: (value: string) => void;
  sourceUrl: string;
  onSourceUrlChange: (value: string) => void;
  onAddSource: () => void;
  openSections: Record<MetadataSection, boolean>;
  onSectionOpenChange: (section: MetadataSection, open: boolean) => void;
  seoSettings: ArticleSeoSettings;
  analysis: ArticleOnPageAnalysis | null;
  analysisIsCurrent: boolean;
  onSeoSettingsChange: (settings: ArticleSeoSettings) => void;
  onAnalysisTargetClick: (target: AnalysisTarget) => void;
}

export type { MetadataSection };

export default function ArticleMetadataSidebar(props: ArticleMetadataSidebarProps) {
  const { metadata, setField, openSections, onSectionOpenChange } = props;
  const closeDrawer = useCloseArticleMetadataDrawer();

  return (
    <div className="space-y-3">
      <MetadataSection title="ข้อมูลทั่วไป" open={openSections.general} onOpenChange={(open) => onSectionOpenChange('general', open)}>
        <div className="space-y-3">
          <Field label="URL ภาษาอังกฤษ" field="metadata.slug"><div className="flex items-center gap-1"><span className="shrink-0 text-xs text-slate-500">/articles/</span><input value={metadata.slug} onChange={(event) => setField('slug', event.target.value)} className="article-admin-input min-w-0" placeholder="stored-english-slug" autoCapitalize="none" /></div><small className="block text-xs font-normal leading-relaxed text-slate-500">ใช้ตัวพิมพ์เล็ก a–z, 0–9 และขีดคั่นคำ การเปลี่ยน URL ที่เผยแพร่แล้วทำให้ URL เก่าตอบ 404</small></Field>
          <Field label="คำโปรย" field="metadata.excerpt"><textarea value={metadata.excerpt} onChange={(event) => setField('excerpt', event.target.value)} rows={3} className="article-admin-input" /></Field>
          <Field label="หมวดหมู่" field="metadata.category"><input value={metadata.category} onChange={(event) => setField('category', event.target.value)} className="article-admin-input" /></Field>
          <Field label="หัวข้อหลัก" field="metadata.topic"><input value={metadata.topic} onChange={(event) => setField('topic', event.target.value)} className="article-admin-input" /></Field>
          <Field label="เจตนาการค้นหา" field="metadata.intent"><select value={metadata.intent ?? ''} onChange={(event) => setField('intent', event.target.value ? event.target.value as NonNullable<ArticleMetadata['intent']> : undefined)} className="article-admin-input"><option value="">ยังไม่ระบุ</option><option value="informational">ข้อมูล</option><option value="commercial">พิจารณาสินค้า</option><option value="transactional">ติดต่อหรือซื้อ</option><option value="mixed">ผสม</option></select></Field>
          <div data-article-field="metadata.coverImage"><ArticleCoverImageField imageUrl={metadata.coverImage} altText={metadata.coverAlt} onImageChange={(value) => setField('coverImage', value)} onAltChange={(value) => setField('coverAlt', value)} /></div>
          <Field label="แท็ก">
            <div className="flex gap-2"><input value={props.newTag} onChange={(event) => props.onNewTagChange(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), props.onAddTag())} className="article-admin-input min-w-0 flex-1" /><button type="button" onClick={props.onAddTag} className="article-editor-tool shrink-0">เพิ่ม</button></div>
            <ul className="mt-2 flex flex-wrap gap-1.5">{metadata.tags.map((tag) => <li key={tag} className="inline-flex max-w-full items-center gap-1 rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs"><span className="break-all">{tag}</span><button type="button" aria-label={`ลบแท็ก ${tag}`} onClick={() => setField('tags', metadata.tags.filter((value) => value !== tag))} className="shrink-0 rounded px-1 hover:bg-slate-200">×</button></li>)}</ul>
          </Field>
        </div>
      </MetadataSection>

      <MetadataSection title="SEO" open={openSections.seo} onOpenChange={(open) => onSectionOpenChange('seo', open)}>
        <div className="space-y-3">
          <Field label="SEO title" field="metadata.seoTitle"><input value={metadata.seoTitle} onChange={(event) => setField('seoTitle', event.target.value)} className="article-admin-input" /></Field>
          <Field label="Meta description" field="metadata.seoDescription"><textarea value={metadata.seoDescription} onChange={(event) => setField('seoDescription', event.target.value)} rows={4} className="article-admin-input" /></Field>
        </div>
      </MetadataSection>

      <MetadataSection title="ผู้เขียนและผู้ตรวจทาน" open={openSections.author} onOpenChange={(open) => onSectionOpenChange('author', open)}>
        <div className="space-y-3">
          <Field label="ผู้เขียน / องค์กร" field="metadata.authorName"><input value={metadata.authorName} onChange={(event) => setField('authorName', event.target.value)} className="article-admin-input" /></Field>
          <Field label="ประเภทผู้เขียน" field="metadata.authorType"><select value={metadata.authorType ?? ''} onChange={(event) => setField('authorType', event.target.value ? event.target.value as 'Person' | 'Organization' : undefined)} className="article-admin-input"><option value="">ยังไม่ระบุ</option><option value="Person">บุคคล</option><option value="Organization">องค์กร</option></select></Field>
          <Field label="URL ผู้เขียน" field="metadata.authorUrl"><input value={metadata.authorUrl ?? ''} onChange={(event) => setField('authorUrl', event.target.value || undefined)} className="article-admin-input" /></Field>
          <Field label="ผู้ตรวจทาน" field="metadata.reviewerName"><input value={metadata.reviewerName ?? ''} onChange={(event) => setField('reviewerName', event.target.value || undefined)} className="article-admin-input" /></Field>
          <Field label="ประเภทผู้ตรวจทาน" field="metadata.reviewerType"><select value={metadata.reviewerType ?? ''} onChange={(event) => setField('reviewerType', event.target.value ? event.target.value as 'Person' | 'Organization' : undefined)} className="article-admin-input"><option value="">ยังไม่ระบุ</option><option value="Person">บุคคล</option><option value="Organization">องค์กร</option></select></Field>
          <Field label="URL ผู้ตรวจทาน" field="metadata.reviewerUrl"><input value={metadata.reviewerUrl ?? ''} onChange={(event) => setField('reviewerUrl', event.target.value || undefined)} className="article-admin-input" /></Field>
        </div>
      </MetadataSection>

      <MetadataSection title="แหล่งอ้างอิง" open={openSections.sources} onOpenChange={(open) => onSectionOpenChange('sources', open)}>
        <div className="space-y-3">
          <Field label="ชื่อแหล่งข้อมูล"><input value={props.sourceLabel} onChange={(event) => props.onSourceLabelChange(event.target.value)} placeholder="ชื่อแหล่งข้อมูล" className="article-admin-input" /></Field>
          <Field label="URL"><input value={props.sourceUrl} onChange={(event) => props.onSourceUrlChange(event.target.value)} placeholder="https://…" className="article-admin-input" /></Field>
          <button type="button" onClick={props.onAddSource} className="article-editor-tool w-full">เพิ่มแหล่งอ้างอิง</button>
          <ul className="space-y-2 text-xs">{metadata.sources.map((source, index) => <li key={`${source.url}-${index}`} className="flex min-w-0 items-start gap-2"><a href={source.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 break-all text-blue-700 underline">{source.label}</a><button type="button" aria-label={`ลบแหล่งอ้างอิง ${source.label}`} onClick={() => setField('sources', metadata.sources.filter((_, itemIndex) => itemIndex !== index))} className="shrink-0 underline">ลบ</button></li>)}</ul>
        </div>
      </MetadataSection>

      <MetadataSection title="ตรวจ On-page" open={openSections.onpage} onOpenChange={(open) => onSectionOpenChange('onpage', open)}>
        <ArticleOnPagePanel settings={props.seoSettings} analysis={props.analysis} isCurrent={props.analysisIsCurrent} onSettingsChange={props.onSeoSettingsChange} onTargetClick={(target) => { closeDrawer(); props.onAnalysisTargetClick(target); }} />
      </MetadataSection>
    </div>
  );
}

function MetadataSection({ title, open, onOpenChange, children }: { title: string; open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <section className="overflow-hidden rounded border border-slate-200 bg-white">
        <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-3 text-left text-sm font-semibold hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
          {title}<span aria-hidden="true" className="ml-2 text-slate-500">{open ? '−' : '+'}</span>
        </CollapsibleTrigger>
        <CollapsibleContent className={open ? 'border-t border-slate-100 p-3' : 'hidden'}>{children}</CollapsibleContent>
      </section>
    </Collapsible>
  );
}

function Field({ label, children, field }: { label: string; children: React.ReactNode; field?: string }) {
  return <label data-article-field={field} className="block min-w-0 space-y-1 text-sm font-medium text-slate-800">{label}{children}</label>;
}
