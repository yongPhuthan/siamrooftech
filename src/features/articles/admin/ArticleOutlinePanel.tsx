'use client';

import { useState } from 'react';
import { buildArticleOutline, type ArticleHeading } from '../heading-outline';
import { useCloseArticleOutlineDrawer } from './ArticleWorkspace';

interface ArticleOutlinePanelProps {
  headings: ArticleHeading[];
  activeHeadingId?: string;
  onSelectHeading: (id: string) => void;
}

export default function ArticleOutlinePanel({ headings, activeHeadingId, onSelectHeading }: ArticleOutlinePanelProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const closeDrawer = useCloseArticleOutlineDrawer();
  const outline = buildArticleOutline(headings);

  if (!outline.length) return <p className="px-2 py-3 text-sm text-slate-500">เพิ่ม H2 หรือ H3 เพื่อเริ่มวางโครงบทความ</p>;

  return (
    <nav aria-label="โครงร่างบทความ">
      <ol className="space-y-1 text-sm">
        {outline.map((section) => {
          const collapsed = collapsedGroups.includes(section.id);
          const setCollapsed = (value: boolean) => setCollapsedGroups((current) => value ? [...new Set([...current, section.id])] : current.filter((id) => id !== section.id));
          return (
            <li key={section.id}>
              <div className="flex min-w-0 items-start gap-1">
                <button type="button" onClick={() => { onSelectHeading(section.id); closeDrawer(); }} aria-current={activeHeadingId === section.id ? 'location' : undefined} className={`min-w-0 flex-1 rounded px-2 py-2 text-left leading-snug hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${activeHeadingId === section.id ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-700'}`}>
                  <span className="block break-words">{section.text || 'หัวข้อยังไม่มีชื่อ'}</span>
                  {section.incomplete && <span className="mt-1 block text-xs font-normal text-amber-700">ยังไม่มีเนื้อหา</span>}
                </button>
                {section.children.length > 0 && <button type="button" onClick={() => setCollapsed(!collapsed)} className="article-editor-tool mt-1 shrink-0 px-2" aria-label={`${collapsed ? 'ขยาย' : 'ยุบ'}หัวข้อ ${section.text || 'ที่ไม่มีชื่อ'}`} aria-expanded={!collapsed}>{collapsed ? '+' : '−'}</button>}
              </div>
              {section.children.length > 0 && !collapsed && <ol className="ml-3 border-l border-slate-200 pl-2">
                {section.children.map((heading) => <li key={heading.id}>
                  <button type="button" onClick={() => { onSelectHeading(heading.id); closeDrawer(); }} aria-current={activeHeadingId === heading.id ? 'location' : undefined} className={`w-full rounded px-2 py-2 text-left leading-snug hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${activeHeadingId === heading.id ? 'bg-blue-50 font-semibold text-blue-800' : 'text-slate-600'}`}>
                    <span className="block break-words">{heading.text || 'หัวข้อยังไม่มีชื่อ'}</span>
                    {heading.incomplete && <span className="mt-1 block text-xs font-normal text-amber-700">ยังไม่มีเนื้อหา</span>}
                  </button>
                </li>)}
              </ol>}
            </li>
          );
        })}
      </ol>
      <p className="mt-5 border-t border-slate-100 px-2 pt-3 text-xs leading-relaxed text-slate-500">บันทึกร่างได้แม้มีเฉพาะหัวข้อ ส่วนที่ยังไม่มีเนื้อหาจะไม่ผ่านการเผยแพร่</p>
    </nav>
  );
}
