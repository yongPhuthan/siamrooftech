'use client';

import type { AdminArticleSummary } from '@/features/articles/admin-types';

interface ArticlesListProps {
  articles: AdminArticleSummary[];
  onEdit: (article: AdminArticleSummary) => void;
}

function statusLabel(article: AdminArticleSummary): string {
  if (article.legacy) return 'ต้องเขียนใหม่';
  if (article.status === 'published-with-draft-changes') return 'มีฉบับเผยแพร่ · มี draft แก้ไข';
  if (article.status === 'published') return 'เผยแพร่แล้ว';
  return 'ฉบับร่าง';
}

export default function ArticlesList({ articles, onEdit }: ArticlesListProps) {
  if (articles.length === 0) return <div className="rounded border border-slate-200 bg-white p-8 text-center text-slate-600">ยังไม่มีบทความ</div>;
  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => (
        <li key={article.id} className="rounded border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="font-semibold text-slate-900">{article.title || 'บทความไม่มีชื่อ'}</h2>{article.slug && <p className="mt-1 break-all text-xs text-slate-500">/articles/{article.slug}</p>}</div>
            <span className={`shrink-0 rounded px-2 py-1 text-xs ${article.legacy ? 'bg-amber-100 text-amber-900' : article.hasPublishedSnapshot ? 'bg-green-100 text-green-900' : 'bg-slate-100 text-slate-700'}`}>{statusLabel(article)}</span>
          </div>
          {article.updatedAt && <p className="mt-3 text-xs text-slate-500">บันทึกร่าง {new Date(article.updatedAt).toLocaleString('th-TH')}</p>}
          {article.legacy ? <p className="mt-4 text-sm text-slate-600">ข้อมูลจากระบบเดิมยังเก็บไว้ แต่ไม่แสดงบนเว็บไซต์ กรุณาสร้างบทความใหม่และเขียนเนื้อหาใหม่</p> : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => onEdit(article)} className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">แก้ไข draft</button>
              {article.hasPublishedSnapshot && article.slug && <a href={`/articles/${article.slug}`} target="_blank" rel="noopener noreferrer" className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">ดูหน้าสาธารณะ</a>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
