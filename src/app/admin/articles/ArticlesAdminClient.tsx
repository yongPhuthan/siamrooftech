'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AdminArticleSummary } from '@/features/articles/admin-types';
import type { ArticleRecordV1 } from '@/features/articles/publication-policy';
import ArticlesList from '@/components/admin/ArticlesList';
import ArticleForm from '@/components/admin/ArticleForm';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import { adminFetch } from '@/lib/admin-fetch';
import { useAdminWorkspace } from '@/components/admin/AdminWorkspaceContext';

type TabFilter = 'ทั้งหมด' | 'เผยแพร่' | 'ฉบับร่าง' | 'ต้องเขียนใหม่';

export default function ArticlesAdminClient() {
  return <AdminAuthGate><AdminArticlesContent /></AdminAuthGate>;
}

function AdminArticlesContent() {
  const { setWorkspaceMode } = useAdminWorkspace();
  const [articles, setArticles] = useState<AdminArticleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<ArticleRecordV1 | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('ทั้งหมด');
  const [error, setError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const fetchArticles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await adminFetch('/api/admin/articles');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'โหลดรายการบทความไม่สำเร็จ');
      setArticles(Array.isArray(data) ? data : []);
      setError('');
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'โหลดรายการบทความไม่สำเร็จ');
      setArticles([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchArticles(); }, [fetchArticles]);
  useEffect(() => () => setWorkspaceMode('default'), [setWorkspaceMode]);

  const handleEdit = async (summary: AdminArticleSummary) => {
    try {
      const response = await adminFetch(`/api/admin/articles/${summary.id}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'เปิด draft ไม่สำเร็จ');
      setEditingArticle(data);
      setWorkspaceMode('article-editor');
      setShowForm(true);
    } catch (editError) {
      setError(editError instanceof Error ? editError.message : 'เปิด draft ไม่สำเร็จ');
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (activeTab === 'เผยแพร่') return article.hasPublishedSnapshot;
    if (activeTab === 'ฉบับร่าง') return !article.legacy && !article.hasPublishedSnapshot;
    if (activeTab === 'ต้องเขียนใหม่') return article.legacy;
    return true;
  });

  const openNewArticle = () => {
    setEditingArticle(null);
    setWorkspaceMode('article-editor');
    setShowForm(true);
  };

  const leaveEditor = () => {
    if (hasUnsavedChanges && !globalThis.confirm('มีการแก้ไขที่ยังไม่บันทึก ออกจากหน้านี้หรือไม่?')) return;
    setWorkspaceMode('default');
    setShowForm(false);
    setEditingArticle(null);
    setHasUnsavedChanges(false);
    void fetchArticles();
  };

  if (loading) return <div className="flex min-h-[50vh] items-center justify-center"><p role="status">กำลังโหลดบทความ…</p></div>;

  if (showForm) return <ArticleForm key={editingArticle?.id ?? 'new-article'} article={editingArticle} onBack={leaveEditor} onSuccess={() => { void fetchArticles(true); }} onUnsavedChange={setHasUnsavedChanges} />;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">จัดการบทความ</h1><p className="mt-1 text-sm text-slate-600">ฉบับร่างและบทความเผยแพร่แยกข้อมูลกัน</p></div>
        <button type="button" onClick={openNewArticle} className="rounded bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800">สร้างบทความใหม่</button>
      </div>
      {error && <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}<button type="button" onClick={() => void fetchArticles()} className="ml-3 underline">ลองใหม่</button></p>}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="กรองบทความ">
        {(['ทั้งหมด', 'เผยแพร่', 'ฉบับร่าง', 'ต้องเขียนใหม่'] as TabFilter[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={`rounded border px-3 py-2 text-sm ${activeTab === tab ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-slate-300 bg-white text-slate-700'}`}>{tab} <span className="ml-1 text-xs">{tab === 'ทั้งหมด' ? articles.length : tab === 'เผยแพร่' ? articles.filter((item) => item.hasPublishedSnapshot).length : tab === 'ฉบับร่าง' ? articles.filter((item) => !item.legacy && !item.hasPublishedSnapshot).length : articles.filter((item) => item.legacy).length}</span></button>)}
      </div>
      <ArticlesList articles={filteredArticles} onEdit={handleEdit} />
    </div>
  );
}
