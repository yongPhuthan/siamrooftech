'use client';

import type { CSSProperties, ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import type { PublicationProblem } from '../publication-policy';

type WorkspacePanel = 'outline' | 'metadata' | null;

const CloseOutlineDrawerContext = createContext<() => void>(() => undefined);
const CloseMetadataDrawerContext = createContext<() => void>(() => undefined);

export function useCloseArticleOutlineDrawer() {
  return useContext(CloseOutlineDrawerContext);
}

export function useCloseArticleMetadataDrawer() {
  return useContext(CloseMetadataDrawerContext);
}

interface ArticleWorkspaceProps {
  title: string;
  onTitleChange: (title: string) => void;
  onBack: () => void;
  saveState: string;
  actions: ReactNode;
  outline: ReactNode;
  metadata: ReactNode;
  issues: PublicationProblem[];
  onIssueClick: (problem: PublicationProblem) => void;
  children: ReactNode;
}

export default function ArticleWorkspace({ title, onTitleChange, onBack, saveState, actions, outline, metadata, issues, onIssueClick, children }: ArticleWorkspaceProps) {
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);
  const [metadataCollapsed, setMetadataCollapsed] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [openPanel, setOpenPanel] = useState<WorkspacePanel>(null);

  const outlineVisible = !focusMode && !outlineCollapsed;
  const metadataVisible = !focusMode && !metadataCollapsed;
  const gridStyle = {
    '--article-outline-width': outlineVisible ? '240px' : '0px',
    '--article-metadata-width': metadataVisible ? '320px' : '0px',
  } as CSSProperties;

  return (
    <div className="article-authoring-workspace flex h-dvh min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900" style={gridStyle}>
      <header className="z-20 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-slate-200 bg-white px-3 py-2 sm:px-4">
        <div className="flex w-full min-w-0 flex-none flex-wrap items-center gap-2 md:w-auto md:flex-1">
          <button type="button" onClick={onBack} className="article-editor-tool shrink-0" aria-label="กลับรายการบทความ">← <span className="hidden sm:inline">กลับรายการ</span></button>
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">ตัวแก้ไขบทความ</span>
          <div className="hidden items-center gap-2 xl:flex">
            <button type="button" onClick={() => { setFocusMode(false); setOutlineCollapsed((value) => !value); }} aria-pressed={outlineVisible} className="article-editor-tool">{outlineVisible ? 'ซ่อน TOC' : 'แสดง TOC'}</button>
            <button type="button" onClick={() => { setFocusMode(false); setMetadataCollapsed((value) => !value); }} aria-pressed={metadataVisible} className="article-editor-tool">{metadataVisible ? 'ซ่อนข้อมูล' : 'แสดงข้อมูล'}</button>
          </div>
          <div className="hidden items-center gap-2 md:flex xl:hidden">
            <button type="button" onClick={() => setOpenPanel('outline')} className="article-editor-tool">สารบัญ</button>
            <button type="button" onClick={() => setMetadataCollapsed((value) => !value)} aria-pressed={metadataVisible} className="article-editor-tool">{metadataVisible ? 'ซ่อนข้อมูล' : 'แสดงข้อมูล'}</button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button type="button" onClick={() => setOpenPanel('outline')} className="article-editor-tool">สารบัญ</button>
            <button type="button" onClick={() => setOpenPanel('metadata')} className="article-editor-tool">ข้อมูล</button>
          </div>
          <button type="button" onClick={() => { setFocusMode((value) => !value); setOpenPanel(null); }} aria-pressed={focusMode} className="hidden article-editor-tool md:inline-flex xl:hidden">{focusMode ? 'ออกจากโหมดโฟกัส' : 'โหมดโฟกัส'}</button>
          <button type="button" onClick={() => { setFocusMode((value) => !value); setOpenPanel(null); }} aria-pressed={focusMode} className="hidden article-editor-tool xl:inline-flex">{focusMode ? 'ออกจากโหมดโฟกัส' : 'โหมดโฟกัส'}</button>
        </div>

        <div className="flex w-full shrink-0 items-center justify-end gap-2 md:w-auto">
          <span role="status" className={`hidden text-xs sm:inline ${saveState.startsWith('มี') ? 'text-amber-800' : 'text-slate-500'}`}>{saveState}</span>
          {actions}
        </div>
        <div className="flex w-full items-center gap-2 border-t border-slate-100 pt-2 md:hidden">
          <button type="button" onClick={() => setFocusMode((value) => !value)} aria-pressed={focusMode} className="article-editor-tool">{focusMode ? 'ออกจากโหมดโฟกัส' : 'โหมดโฟกัส'}</button>
          <span role="status" className={`min-w-0 truncate text-xs ${saveState.startsWith('มี') ? 'text-amber-800' : 'text-slate-500'}`}>{saveState}</span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_var(--article-metadata-width)] xl:grid-cols-[var(--article-outline-width)_minmax(0,1fr)_var(--article-metadata-width)]" style={gridStyle}>
        <aside className={`hidden min-h-0 min-w-0 flex-col overflow-y-auto border-r border-slate-200 bg-white ${outlineVisible ? 'xl:flex' : ''}`} aria-label="สารบัญบทความ">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3"><h2 className="font-semibold">โครงร่าง / TOC</h2><p className="mt-1 text-xs text-slate-500">เลือกหัวข้อเพื่อไปเขียนต่อ</p></div>
          <div className="min-w-0 p-3">{outline}</div>
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-[760px] px-4 py-6 sm:px-8 sm:py-10">
            {issues.length > 0 && <section className="mb-5 rounded border border-amber-200 bg-amber-50 p-3" aria-labelledby="article-workspace-issues">
              <h2 id="article-workspace-issues" className="text-sm font-semibold text-amber-950">พบ {issues.length} รายการที่ต้องแก้ก่อนเผยแพร่</h2>
              <ul className="mt-2 space-y-1">{issues.map((issue, index) => <li key={`${issue.field}-${index}`}><button type="button" onClick={() => {
                if (issue.field.startsWith('metadata.')) {
                  setFocusMode(false);
                  setMetadataCollapsed(false);
                  if (globalThis.matchMedia('(max-width: 767px)').matches) setOpenPanel('metadata');
                } else if (issue.field.startsWith('document#')) {
                  setFocusMode(false);
                  if (globalThis.matchMedia('(min-width: 1280px)').matches) setOutlineCollapsed(false);
                  setOpenPanel(null);
                  onIssueClick(issue);
                  return;
                }
                onIssueClick(issue);
                if (issue.field.startsWith('metadata.')) window.setTimeout(() => {
                  const field = Array.from(globalThis.document.querySelectorAll<HTMLElement>(`[data-article-field="${issue.field}"]`)).find((element) => element.getClientRects().length > 0);
                  const target = field?.matches('input, textarea, select, button') ? field : field?.querySelector<HTMLElement>('input, textarea, select, button');
                  target?.focus();
                }, 100);
              }} className="text-left text-xs leading-relaxed text-amber-900 underline decoration-amber-500 underline-offset-2">{issue.message}</button></li>)}</ul>
            </section>}
            <label htmlFor="article-title" className="sr-only">ชื่อบทความ</label>
            <input id="article-title" data-article-field="metadata.title" value={title} onChange={(event) => onTitleChange(event.target.value)} className="mb-5 w-full border-0 border-b border-transparent bg-transparent px-0 py-2 text-3xl font-bold leading-tight text-slate-950 outline-none placeholder:text-slate-300 focus:border-blue-500 focus:ring-0 sm:text-4xl" placeholder="ชื่อบทความ" />
            {children}
          </div>
        </main>

        <aside className={`hidden min-h-0 min-w-0 flex-col overflow-y-auto border-l border-slate-200 bg-white ${metadataVisible ? 'md:flex' : ''}`} aria-label="ข้อมูลบทความ">
          <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3"><h2 className="font-semibold">ข้อมูลบทความ</h2><p className="mt-1 text-xs text-slate-500">จัดการรายละเอียดและการค้นหา</p></div>
          <div className="min-w-0 p-3">{metadata}</div>
        </aside>
      </div>

      <ResponsivePanel open={openPanel === 'outline'} onOpenChange={(open) => setOpenPanel(open ? 'outline' : null)} title="โครงร่าง / TOC">
        <CloseOutlineDrawerContext.Provider value={() => setOpenPanel(null)}>{outline}</CloseOutlineDrawerContext.Provider>
      </ResponsivePanel>
      <ResponsivePanel open={openPanel === 'metadata'} onOpenChange={(open) => setOpenPanel(open ? 'metadata' : null)} title="ข้อมูลบทความ">
        <CloseMetadataDrawerContext.Provider value={() => setOpenPanel(null)}>{metadata}</CloseMetadataDrawerContext.Provider>
      </ResponsivePanel>
    </div>
  );
}

function ResponsivePanel({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: ReactNode }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-slate-950/40" />
        <Dialog.Popup className="fixed inset-y-0 left-0 z-50 flex h-dvh w-[min(90vw,360px)] flex-col overflow-y-auto border-r border-slate-200 bg-white shadow-xl outline-none">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <Dialog.Title className="font-semibold">{title}</Dialog.Title>
            <Dialog.Close className="article-editor-tool" aria-label="ปิดแผง">ปิด</Dialog.Close>
          </div>
          <div className="min-w-0 p-3">{children}</div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
