'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { ArticleDocument, ArticleMetadata, ArticleMetadataSchema, ArticleSeoSettings, emptyArticleSeoSettings } from '@/features/articles/document-schema';
import { ArticleRecordV1 } from '@/features/articles/publication-policy';
import type { PublicationProblem } from '@/features/articles/publication-policy';
import { analyzeArticleOnPage, type ArticleOnPageAnalysis, type AnalysisTarget } from '@/features/articles/analysis/on-page-analysis';
import { createHeadingId } from '@/features/articles/admin/heading-id';
import ArticleWorkspace from '@/features/articles/admin/ArticleWorkspace';
import ArticleOutlinePanel from '@/features/articles/admin/ArticleOutlinePanel';
import ArticleMetadataSidebar, { type MetadataSection } from '@/features/articles/admin/ArticleMetadataSidebar';
import type { ArticleHeading } from '@/features/articles/heading-outline';
import { adminFetch } from '@/lib/admin-fetch';

const ArticleEditor = dynamic(() => import('@/features/articles/admin/ArticleEditor'), { ssr: false, loading: () => <div className="rounded border border-slate-200 bg-white p-8 text-sm text-slate-500">กำลังเปิดตัวแก้ไขบทความ…</div> });

interface ArticleFormProps {
  article?: ArticleRecordV1 | null;
  onBack: () => void;
  onSuccess?: () => void;
  onUnsavedChange?: (hasChanges: boolean) => void;
}

const emptyMetadata: ArticleMetadata = {
  title: '', slug: '', excerpt: '', category: '', authorName: '', topic: '', tags: [], seoTitle: '', seoDescription: '', sources: [],
};

const emptyDocument: ArticleDocument = { type: 'doc', content: [] };

function buildElectricAwningOutline(): ArticleDocument {
  const headings: Array<{ level: 2 | 3; text: string }> = [
    { level: 2, text: 'การสำรวจความพร้อมของหน้างาน' },
    { level: 3, text: '1. ประเภทโครงสร้างผนังและความสามารถในการรับน้ำหนัก' },
    { level: 3, text: '2. การคำนวณขนาด ระยะยื่น และทิศทางแสงแดด' },
    { level: 3, text: '3. ตำแหน่งจุดจ่ายไฟและมาตรฐานกล่องกันน้ำภายนอก' },
    { level: 2, text: 'การเลือกสเปกอุปกรณ์และบริการหลังการขาย' },
    { level: 3, text: '4. สเปกมอเตอร์ไฟฟ้า กำลังวัตต์ และระบบตัดความร้อน' },
    { level: 3, text: '5. การเลือกชนิดผ้าใบ: โพลีเอสเตอร์เคลือบ เทียบกับ อะคริลิกย้อมเส้นด้าย' },
    { level: 3, text: '6. ระบบสั่งการผ่านรีโมทและระบบเปิด-ปิดสำรอง (Manual Override)' },
    { level: 3, text: '7. ขอบเขตการรับประกันสินค้าและบริการซ่อมบำรุง' },
    { level: 2, text: 'ตัวอย่างผลงานการติดตั้งกันสาดไฟฟ้า' },
    { level: 2, text: 'ข้อมูลที่ต้องเตรียมสำหรับการประเมินหน้างานและขอราคา' },
  ];
  return { type: 'doc', content: headings.map(({ level, text }) => ({ type: 'heading', attrs: { level, id: createHeadingId() }, content: [{ type: 'text', text }] })) };
}

interface PreviewData { title: string; excerpt: string; html: string }

export default function ArticleForm({ article, onBack, onSuccess, onUnsavedChange }: ArticleFormProps) {
  const [metadata, setMetadata] = useState<ArticleMetadata>(article?.draft.metadata ?? emptyMetadata);
  const [document, setDocument] = useState<ArticleDocument>(article?.draft.document ?? emptyDocument);
  const [seoSettings, setSeoSettings] = useState<ArticleSeoSettings>(article?.draft.seoSettings ?? emptyArticleSeoSettings);
  const [revision, setRevision] = useState(article?.revision ?? 0);
  const [savedId, setSavedId] = useState(article?.id ?? '');
  const [hasPublishedSnapshot, setHasPublishedSnapshot] = useState(Boolean(article?.published));
  const [savedFingerprint, setSavedFingerprint] = useState(() => JSON.stringify({ metadata: article?.draft.metadata ?? emptyMetadata, document: article?.draft.document ?? emptyDocument, seoSettings: article?.draft.seoSettings ?? emptyArticleSeoSettings }));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [error, setError] = useState('');
  const [publishProblems, setPublishProblems] = useState<PublicationProblem[]>([]);
  const [savedAt, setSavedAt] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [headings, setHeadings] = useState<ArticleHeading[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string>();
  const [focusHeadingId, setFocusHeadingId] = useState<string>();
  const [focusEditorTarget, setFocusEditorTarget] = useState<{ kind: 'text' | 'image'; from: number; to: number; token: number }>();
  const [pendingFieldFocus, setPendingFieldFocus] = useState<string>();
  const [editorComposing, setEditorComposing] = useState(false);
  const [analysis, setAnalysis] = useState<ArticleOnPageAnalysis | null>(null);
  const [analysisFingerprint, setAnalysisFingerprint] = useState('');
  const [openMetadataSections, setOpenMetadataSections] = useState<Record<MetadataSection, boolean>>({ general: true, seo: false, author: false, sources: false, onpage: false });

  const fingerprint = JSON.stringify({ metadata, document, seoSettings });
  const hasUnsavedChanges = fingerprint !== savedFingerprint;
  const mutationPending = saving || publishing || unpublishing;
  const analysisIsCurrent = Boolean(analysis && analysisFingerprint === fingerprint);

  useEffect(() => {
    setAnalysis(null);
    setAnalysisFingerprint('');
    if (editorComposing) return;
    const timer = globalThis.setTimeout(() => {
      setAnalysis(analyzeArticleOnPage({ metadata, document, seoSettings }));
      setAnalysisFingerprint(fingerprint);
    }, 400);
    return () => globalThis.clearTimeout(timer);
  }, [metadata, document, seoSettings, fingerprint, editorComposing]);

  useEffect(() => {
    if (!pendingFieldFocus) return;
    const frame = globalThis.requestAnimationFrame(() => {
      const element = Array.from(globalThis.document.querySelectorAll<HTMLElement>('[data-article-field]')).find((item) => item.dataset.articleField === pendingFieldFocus);
      element?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      element?.querySelector<HTMLElement>('input, textarea, select, button')?.focus({ preventScroll: true });
      setPendingFieldFocus(undefined);
    });
    return () => globalThis.cancelAnimationFrame(frame);
  }, [pendingFieldFocus, openMetadataSections]);

  useEffect(() => { onUnsavedChange?.(hasUnsavedChanges); }, [hasUnsavedChanges, onUnsavedChange]);
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeClose = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    globalThis.addEventListener('beforeunload', warnBeforeClose);
    return () => globalThis.removeEventListener('beforeunload', warnBeforeClose);
  }, [hasUnsavedChanges]);

  const setField = <K extends keyof ArticleMetadata>(key: K, value: ArticleMetadata[K]) => setMetadata((current) => ({ ...current, [key]: value }));

  const saveDraft = async () => {
    setSaving(true);
    setError('');
    setPublishProblems([]);
    try {
      const url = savedId ? `/api/admin/articles/${savedId}` : '/api/admin/articles';
      const response = await adminFetch(url, {
        method: savedId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRevision: revision, metadata, document, seoSettings }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `บันทึกไม่สำเร็จ (${response.status})`);
      setSavedId(data.id);
      setRevision(data.revision);
      setMetadata(data.draft.metadata);
      setDocument(data.draft.document);
      setSeoSettings(data.draft.seoSettings ?? emptyArticleSeoSettings);
      setHasPublishedSnapshot(Boolean(data.published));
      setSavedFingerprint(JSON.stringify({ metadata: data.draft.metadata, document: data.draft.document, seoSettings: data.draft.seoSettings ?? emptyArticleSeoSettings }));
      setSavedAt(new Date().toLocaleTimeString('th-TH'));
      onSuccess?.();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'บันทึกฉบับร่างไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!savedId) {
      setError('บันทึกฉบับร่างก่อนเผยแพร่');
      return;
    }
    if (hasUnsavedChanges) {
      setError('บันทึกการแก้ไขเป็นฉบับร่างก่อนเผยแพร่');
      return;
    }
    setPublishing(true);
    setError('');
    setPublishProblems([]);
    try {
      const response = await adminFetch(`/api/admin/articles/${savedId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expectedRevision: revision }),
      });
      const data = await response.json();
      if (!response.ok) {
        setPublishProblems(Array.isArray(data.problems) ? data.problems : []);
        throw new Error(data.error || `เผยแพร่ไม่สำเร็จ (${response.status})`);
      }
      setRevision(data.revision);
      setHasPublishedSnapshot(Boolean(data.published));
      setSavedFingerprint(JSON.stringify({ metadata: data.draft.metadata, document: data.draft.document, seoSettings: data.draft.seoSettings ?? emptyArticleSeoSettings }));
      setSavedAt(new Date().toLocaleTimeString('th-TH'));
      onSuccess?.();
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : 'เผยแพร่ไม่สำเร็จ');
    } finally {
      setPublishing(false);
    }
  };

  const loadPreview = async () => {
    if (!savedId) {
      setError('บันทึกฉบับร่างก่อนดูตัวอย่าง');
      return;
    }
    setPreviewLoading(true);
    try {
      const response = await adminFetch(`/api/admin/articles/${savedId}/preview`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ดูตัวอย่างไม่ได้');
      setPreview(data);
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'ดูตัวอย่างไม่ได้');
    } finally {
      setPreviewLoading(false);
    }
  };

  const unpublish = async () => {
    if (!savedId || !hasPublishedSnapshot || !globalThis.confirm('ยกเลิกการเผยแพร่บทความนี้หรือไม่? URL จะกลับเป็น 404 และบทความจะออกจาก sitemap')) return;
    setUnpublishing(true);
    setError('');
    try {
      const response = await adminFetch(`/api/admin/articles/${savedId}/unpublish`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: revision }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'ยกเลิกการเผยแพร่ไม่สำเร็จ');
      setHasPublishedSnapshot(false);
      setRevision(data.revision);
      setSavedFingerprint(JSON.stringify({ metadata: data.draft.metadata, document: data.draft.document, seoSettings: data.draft.seoSettings ?? emptyArticleSeoSettings }));
      setSavedAt(new Date().toLocaleTimeString('th-TH'));
      onSuccess?.();
    } catch (unpublishError) {
      setError(unpublishError instanceof Error ? unpublishError.message : 'ยกเลิกการเผยแพร่ไม่สำเร็จ');
    } finally {
      setUnpublishing(false);
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !metadata.tags.includes(tag)) setField('tags', [...metadata.tags, tag]);
    setNewTag('');
  };

  const addSource = () => {
    const parsed = ArticleMetadataSchema.shape.sources.element.safeParse({ label: sourceLabel.trim(), url: sourceUrl.trim() });
    if (!parsed.success) {
      setError('แหล่งอ้างอิงต้องมีชื่อและ URL ที่ถูกต้อง');
      return;
    }
    setField('sources', [...metadata.sources, parsed.data]);
    setSourceLabel('');
    setSourceUrl('');
  };

  const focusPublicationProblem = (problem: PublicationProblem) => {
    if (problem.field.startsWith('document#')) {
      setFocusHeadingId(problem.field.slice('document#'.length));
      return;
    }
    if (problem.field.startsWith('metadata.')) {
      const field = problem.field.slice('metadata.'.length);
      const section: MetadataSection = ['seoTitle', 'seoDescription'].includes(field) ? 'seo' : ['authorName', 'authorType', 'authorUrl', 'reviewerName', 'reviewerType', 'reviewerUrl'].includes(field) ? 'author' : field === 'sources' ? 'sources' : 'general';
      setOpenMetadataSections((current) => ({ ...current, [section]: true }));
    }
  };

  const focusAnalysisTarget = (target: AnalysisTarget) => {
    if (target.kind === 'text') {
      setFocusEditorTarget({ kind: 'text', from: target.from, to: target.to, token: Date.now() });
      return;
    }
    if (target.kind === 'image') {
      setFocusEditorTarget({ kind: 'image', from: target.from, to: target.from + 1, token: Date.now() });
      return;
    }
    if (target.kind === 'heading') {
      setFocusHeadingId(target.id);
      return;
    }
    const section: MetadataSection = target.field.startsWith('seoSettings.') ? 'onpage' : ['metadata.seoTitle', 'metadata.seoDescription'].includes(target.field) ? 'seo' : ['metadata.authorName', 'metadata.authorType', 'metadata.authorUrl', 'metadata.reviewerName', 'metadata.reviewerType', 'metadata.reviewerUrl'].includes(target.field) ? 'author' : ['metadata.sources'].includes(target.field) ? 'sources' : 'general';
    setOpenMetadataSections((current) => ({ ...current, [section]: true }));
    setPendingFieldFocus(target.field);
  };

  const setMetadataSectionOpen = (section: MetadataSection, open: boolean) => setOpenMetadataSections((current) => ({ ...current, [section]: open }));

  const saveState = hasUnsavedChanges ? 'มีการแก้ไขที่ยังไม่บันทึก' : savedAt ? `บันทึกล่าสุด ${savedAt}` : savedId ? `บันทึกแล้ว · revision ${revision}` : 'ยังไม่บันทึก';

  return (
    <ArticleWorkspace
      title={metadata.title}
      onTitleChange={(title) => setField('title', title)}
      onBack={onBack}
      saveState={saveState}
      issues={publishProblems}
      onIssueClick={focusPublicationProblem}
      outline={<ArticleOutlinePanel headings={headings} activeHeadingId={activeHeadingId} onSelectHeading={setFocusHeadingId} />}
      metadata={<ArticleMetadataSidebar
        metadata={metadata}
        setField={setField}
        newTag={newTag}
        onNewTagChange={setNewTag}
        onAddTag={addTag}
        sourceLabel={sourceLabel}
        onSourceLabelChange={setSourceLabel}
        sourceUrl={sourceUrl}
        onSourceUrlChange={setSourceUrl}
        onAddSource={addSource}
        openSections={openMetadataSections}
        onSectionOpenChange={setMetadataSectionOpen}
        seoSettings={seoSettings}
        analysis={analysis}
        analysisIsCurrent={analysisIsCurrent}
        onSeoSettingsChange={setSeoSettings}
        onAnalysisTargetClick={focusAnalysisTarget}
      />}
      actions={<>
        <button type="button" onClick={saveDraft} disabled={mutationPending} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60">{saving ? 'กำลังบันทึก…' : 'บันทึกร่าง'}</button>
        <button type="button" onClick={loadPreview} disabled={previewLoading || !savedId} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-60">{previewLoading ? 'กำลังเปิด…' : 'ดูตัวอย่าง'}</button>
        <button type="button" onClick={publish} disabled={mutationPending || !savedId || hasUnsavedChanges} className="rounded bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{publishing ? 'กำลังเผยแพร่…' : hasPublishedSnapshot ? 'เผยแพร่แก้ไข' : 'เผยแพร่'}</button>
        {hasPublishedSnapshot && <details className="relative">
          <summary className="article-editor-tool cursor-pointer list-none" aria-label="การเผยแพร่เพิ่มเติม">เพิ่มเติม <span aria-hidden="true">▾</span></summary>
          <div className="absolute right-0 top-full z-30 mt-2 w-48 rounded border border-slate-200 bg-white p-2 shadow-lg">
            <button type="button" onClick={unpublish} disabled={mutationPending} className="w-full rounded px-3 py-2 text-left text-sm text-red-800 hover:bg-red-50 disabled:opacity-60">{unpublishing ? 'กำลังยกเลิก…' : 'ยกเลิกเผยแพร่'}</button>
          </div>
        </details>}
      </>}
    >
      {error && <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      <ArticleEditor
        document={document}
        onChange={setDocument}
        onOutlineChange={setHeadings}
        onActiveHeadingChange={setActiveHeadingId}
        focusHeadingId={focusHeadingId}
        focusTextRange={focusEditorTarget}
        onCompositionChange={setEditorComposing}
        onHeadingFocused={() => setFocusHeadingId(undefined)}
        onUploadError={setError}
      />
    </ArticleWorkspace>
  );
}
