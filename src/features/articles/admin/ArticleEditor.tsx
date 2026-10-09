'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import type { Editor, JSONContent } from '@tiptap/core';
import { Popover } from '@base-ui/react/popover';
import { Type } from 'lucide-react';
import { ArticleDocumentSchema, type ArticleDocument } from '../document-schema';
import { collectArticleHeadings, type ArticleHeading } from '../heading-outline';
import { uploadImageToCloudflare } from '@/app/lib/cloudflare/uploadImage';
import { useArticleWorkspaceTheme, useArticleWorkspaceToolbarHost } from './ArticleWorkspace';
import { createArticleEditorExtensions } from './editor-extensions';
import { createHeadingId } from './heading-id';

interface ArticleEditorProps {
  document: ArticleDocument;
  onChange: (document: ArticleDocument) => void;
  onOutlineChange: (headings: ArticleHeading[]) => void;
  onActiveHeadingChange: (headingId: string | undefined) => void;
  focusHeadingId?: string;
  focusTextRange?: { kind: 'text' | 'image'; from: number; to: number; token: number };
  onCompositionChange: (composing: boolean) => void;
  onHeadingFocused: (headingId: string) => void;
  onUploadError: (message: string) => void;
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => { URL.revokeObjectURL(url); resolve({ width: image.naturalWidth, height: image.naturalHeight }); };
    image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('อ่านขนาดไฟล์ภาพไม่ได้')); };
    image.src = url;
  });
}

export default function ArticleEditor({ document, onChange, onOutlineChange, onActiveHeadingChange, focusHeadingId, focusTextRange, onCompositionChange, onHeadingFocused, onUploadError }: ArticleEditorProps) {
  const theme = useArticleWorkspaceTheme();
  const toolbarHost = useArticleWorkspaceToolbarHost();
  const [imageAlt, setImageAlt] = useState('');
  const [imageIsDecorative, setImageIsDecorative] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formattingToolsOpen, setFormattingToolsOpen] = useState(false);
  const selectionRange = useRef<{ from: number; to: number } | null>(null);
  const extensions = useMemo(() => createArticleEditorExtensions(), []);

  const handleUpdate = useCallback(({ editor }: { editor: Editor }) => {
    const parsed = ArticleDocumentSchema.safeParse(editor.getJSON());
    if (!parsed.success) return;
    onChange(parsed.data);
    onOutlineChange(collectArticleHeadings(parsed.data));
  }, [onChange, onOutlineChange]);

  const editor = useEditor({
    extensions,
    content: document,
    immediatelyRender: false,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'article-editor-content min-h-[48rem] max-w-none px-0 py-5 outline-none sm:py-8',
        'aria-label': 'เนื้อหาบทความ',
      },
    },
  });

  const editorUiState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      paragraph: currentEditor?.isActive('paragraph') ?? false,
      heading2: currentEditor?.isActive('heading', { level: 2 }) ?? false,
      heading3: currentEditor?.isActive('heading', { level: 3 }) ?? false,
      bold: currentEditor?.isActive('bold') ?? false,
      italic: currentEditor?.isActive('italic') ?? false,
      bulletList: currentEditor?.isActive('bulletList') ?? false,
      orderedList: currentEditor?.isActive('orderedList') ?? false,
      table: currentEditor?.isActive('table') ?? false,
      link: currentEditor?.isActive('link') ?? false,
      canUndo: currentEditor?.can().undo() ?? false,
      canRedo: currentEditor?.can().redo() ?? false,
    }),
  });

  useEffect(() => {
    if (!editor) return;
    const incomingDocument = JSON.stringify(document);
    onOutlineChange(collectArticleHeadings(document));
    if (JSON.stringify(editor.getJSON()) !== incomingDocument) editor.commands.setContent(document, { emitUpdate: false });
  }, [document, editor, onOutlineChange]);

  useEffect(() => {
    if (!editor || !focusHeadingId) return;
    let textPosition: number | undefined;
    editor.state.doc.forEach((node, position) => {
      if (node.type.name === 'heading' && node.attrs.id === focusHeadingId) textPosition = position + 1;
    });
    if (textPosition === undefined) return;
    editor.chain().focus().setTextSelection(textPosition).run();
    const headingElement = editor.view.nodeDOM(textPosition - 1);
    if (headingElement instanceof HTMLElement && typeof headingElement.scrollIntoView === 'function') {
      headingElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    onHeadingFocused(focusHeadingId);
  }, [editor, focusHeadingId, onHeadingFocused]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const start = () => onCompositionChange(true);
    const end = () => onCompositionChange(false);
    dom.addEventListener('compositionstart', start);
    dom.addEventListener('compositionend', end);
    return () => {
      dom.removeEventListener('compositionstart', start);
      dom.removeEventListener('compositionend', end);
      onCompositionChange(false);
    };
  }, [editor, onCompositionChange]);

  useEffect(() => {
    if (!editor || !focusTextRange) return;
    try {
      if (focusTextRange.kind === 'image' && editor.state.doc.nodeAt(focusTextRange.from)?.type.name === 'image') {
        editor.chain().focus().setNodeSelection(focusTextRange.from).run();
        const node = editor.view.nodeDOM(focusTextRange.from);
        if (node instanceof HTMLElement) node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else if (focusTextRange.kind === 'text' && focusTextRange.from < focusTextRange.to && focusTextRange.to <= editor.state.doc.content.size) {
        editor.chain().focus().setTextSelection({ from: focusTextRange.from, to: focusTextRange.to }).run();
        const domAt = editor.view.domAtPos(focusTextRange.from);
        const element = domAt.node instanceof HTMLElement ? domAt.node : domAt.node.parentElement;
        element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    } catch {
      // Analysis evidence can become stale while the editor changes; never move the cursor to an invalid position.
    }
  }, [editor, focusTextRange]);

  useEffect(() => {
    if (!editor) return;
    const updateActiveHeading = () => {
      const position = editor.state.selection.from;
      let activeHeadingId: string | undefined;
      editor.state.doc.forEach((node, nodePosition) => {
        if (node.type.name === 'heading' && nodePosition <= position) activeHeadingId = node.attrs.id as string;
      });
      onActiveHeadingChange(activeHeadingId);
    };
    editor.on('selectionUpdate', updateActiveHeading);
    editor.on('transaction', updateActiveHeading);
    updateActiveHeading();
    return () => {
      editor.off('selectionUpdate', updateActiveHeading);
      editor.off('transaction', updateActiveHeading);
    };
  }, [editor, onActiveHeadingChange]);

  const captureSelection = () => {
    if (!editor) return;
    selectionRange.current = { from: editor.state.selection.from, to: editor.state.selection.to };
  };

  const applyLink = (href: string) => {
    if (!editor || !href.trim()) return false;
    const value = href.trim();
    if (!(value.startsWith('/') && !value.startsWith('//'))) {
      try { if (!['http:', 'https:', 'mailto:'].includes(new URL(value).protocol)) return false; }
      catch { return false; }
    }
    const external = /^https?:\/\//i.test(value);
    const range = selectionRange.current;
    const chain = editor.chain().focus();
    if (range) chain.setTextSelection(range);
    const result = chain.extendMarkRange('link').setLink({ href: value, target: external ? '_blank' : '_self' }).run();
    selectionRange.current = null;
    return result;
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !editor) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      onUploadError('เลือกไฟล์ภาพขนาดไม่เกิน 5 MB');
      return;
    }
    setUploadingImage(true);
    onUploadError('');
    try {
      const [{ width, height }, result] = await Promise.all([readImageDimensions(file), uploadImageToCloudflare(file)]);
      const src = result.mediumUrl || result.originalUrl;
      if (!src) throw new Error('บริการอัปโหลดไม่ได้ส่ง URL กลับมา');
      const range = selectionRange.current;
      const chain = editor.chain().focus();
      if (range) chain.setTextSelection(range);
      chain.insertContent({ type: 'image', attrs: {
        src,
        alt: imageIsDecorative ? '' : imageAlt.trim(),
        title: file.name,
        width,
        height,
        decorative: imageIsDecorative,
      } } as JSONContent).run();
      selectionRange.current = null;
      setImageAlt('');
      setImageIsDecorative(false);
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'อัปโหลดภาพไม่สำเร็จ');
    } finally {
      setUploadingImage(false);
    }
  };

  const addHeading = (level: 2 | 3) => {
    if (!editor) return;
    editor.chain().focus().insertContent({ type: 'heading', attrs: { level, id: createHeadingId() } }).run();
  };

  const toolbar = [
    { label: 'ย่อหน้า', active: editorUiState?.paragraph ?? false, disabled: false, run: (instance: Editor) => instance.chain().focus().setParagraph().run() },
    { label: 'ตัวหนา', active: editorUiState?.bold ?? false, disabled: false, run: (instance: Editor) => instance.chain().focus().toggleBold().run() },
    { label: 'ตัวเอียง', active: editorUiState?.italic ?? false, disabled: false, run: (instance: Editor) => instance.chain().focus().toggleItalic().run() },
    { label: 'รายการ', active: editorUiState?.bulletList ?? false, disabled: false, run: (instance: Editor) => instance.chain().focus().toggleBulletList().run() },
    { label: 'ลำดับเลข', active: editorUiState?.orderedList ?? false, disabled: false, run: (instance: Editor) => instance.chain().focus().toggleOrderedList().run() },
    { label: 'ตาราง', active: editorUiState?.table ?? false, disabled: false, run: (instance: Editor) => instance.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
    { label: 'ย้อนกลับ', active: false, disabled: !(editorUiState?.canUndo ?? false), run: (instance: Editor) => instance.chain().focus().undo().run() },
    { label: 'ทำซ้ำ', active: false, disabled: !(editorUiState?.canRedo ?? false), run: (instance: Editor) => instance.chain().focus().redo().run() },
  ];

  return (
    <section className="min-w-0" aria-label="ตัวแก้ไขบทความ">
      {toolbarHost && createPortal(
        <Popover.Root open={formattingToolsOpen} onOpenChange={setFormattingToolsOpen}>
          <Popover.Trigger onMouseDown={(event) => event.preventDefault()} className="article-editor-tool inline-flex size-9 items-center justify-center p-0" aria-label="เครื่องมือจัดรูปแบบ" title="เครื่องมือจัดรูปแบบ" aria-expanded={formattingToolsOpen}>
            <Type aria-hidden="true" size={17} strokeWidth={1.8} />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={6} className="z-[70]">
              <Popover.Popup data-article-theme={theme} className="article-workspace-popover w-[min(92vw,560px)] rounded border border-slate-200 bg-white p-3 shadow-xl outline-none">
                <div role="toolbar" aria-label="เครื่องมือจัดรูปแบบบทความ" className="flex flex-wrap items-center gap-1.5">
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => addHeading(2)} disabled={!editor} aria-pressed={editorUiState?.heading2 ?? false} className={`article-editor-tool ${(editorUiState?.heading2 ?? false) ? 'border-blue-300 bg-blue-50 text-blue-800' : ''}`} aria-label="เพิ่มหัวข้อ H2">H2</button>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => addHeading(3)} disabled={!editor} aria-pressed={editorUiState?.heading3 ?? false} className={`article-editor-tool ${(editorUiState?.heading3 ?? false) ? 'border-blue-300 bg-blue-50 text-blue-800' : ''}`} aria-label="เพิ่มหัวข้อ H3">H3</button>
                  <span aria-hidden="true" className="mx-1 h-6 border-l border-slate-200" />
                  {toolbar.map((item) => <button key={item.label} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => editor && item.run(editor)} className={`article-editor-tool ${item.active ? 'border-blue-300 bg-blue-50 text-blue-800' : ''}`} aria-label={item.label} aria-pressed={['ตัวหนา', 'ตัวเอียง', 'รายการ', 'ลำดับเลข'].includes(item.label) ? item.active : undefined} disabled={!editor || item.disabled}>{item.label}</button>)}
                  <LinkPopover theme={theme} onOpen={captureSelection} onApply={applyLink} />
                  <ImagePopover theme={theme} onOpen={captureSelection} onUpload={uploadImage} uploading={uploadingImage} imageAlt={imageAlt} onImageAltChange={setImageAlt} decorative={imageIsDecorative} onDecorativeChange={setImageIsDecorative} />
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>,
        toolbarHost,
      )}
      <div className="min-h-[60vh] pb-24" onClick={() => editor?.commands.focus()}><EditorContent editor={editor} /></div>
    </section>
  );
}

function LinkPopover({ theme, onOpen, onApply }: { theme: 'light' | 'dark'; onOpen: () => void; onApply: (href: string) => boolean }) {
  const [href, setHref] = useState('');
  const [error, setError] = useState('');
  return (
    <Popover.Root onOpenChange={(open) => { if (open) { onOpen(); setError(''); } }}>
      <Popover.Trigger onMouseDown={(event) => event.preventDefault()} className="article-editor-tool" aria-label="เพิ่มหรือแก้ลิงก์">ลิงก์</Popover.Trigger>
      <Popover.Portal><Popover.Positioner sideOffset={8} className="z-50"><Popover.Popup data-article-theme={theme} className="article-workspace-popover w-[min(92vw,360px)] rounded border border-slate-200 bg-white p-4 shadow-xl outline-none">
        <Popover.Title className="mb-3 font-semibold">เพิ่มลิงก์ในข้อความที่เลือก</Popover.Title>
        <label className="block space-y-1 text-sm font-medium">URL<input autoFocus value={href} onChange={(event) => setHref(event.target.value)} placeholder="https://… หรือ /projects/slug" className="article-admin-input" onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), onApply(href) ? undefined : setError('URL ไม่ถูกต้องหรือยังไม่ได้เลือกข้อความ'))} /></label>
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
        <div className="mt-3 flex justify-end gap-2"><Popover.Close className="article-editor-tool">ยกเลิก</Popover.Close><Popover.Close onClick={(event) => { if (!onApply(href)) { event.preventDefault(); setError('URL ไม่ถูกต้องหรือยังไม่ได้เลือกข้อความ'); } }} className="rounded border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-medium text-white">ใส่ลิงก์</Popover.Close></div>
      </Popover.Popup></Popover.Positioner></Popover.Portal>
    </Popover.Root>
  );
}

function ImagePopover({ theme, onOpen, onUpload, uploading, imageAlt, onImageAltChange, decorative, onDecorativeChange }: { theme: 'light' | 'dark'; onOpen: () => void; onUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>; uploading: boolean; imageAlt: string; onImageAltChange: (value: string) => void; decorative: boolean; onDecorativeChange: (value: boolean) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <Popover.Root onOpenChange={(open) => { if (open) onOpen(); }}>
      <Popover.Trigger onMouseDown={(event) => event.preventDefault()} className="article-editor-tool" aria-label="แทรกรูปภาพ">รูปภาพ</Popover.Trigger>
      <Popover.Portal><Popover.Positioner sideOffset={8} className="z-50"><Popover.Popup data-article-theme={theme} className="article-workspace-popover w-[min(92vw,360px)] rounded border border-slate-200 bg-white p-4 shadow-xl outline-none">
        <Popover.Title className="mb-3 font-semibold">แทรกรูปภาพ</Popover.Title>
        <label className="block space-y-1 text-sm font-medium">คำอธิบายภาพ<input value={imageAlt} onChange={(event) => onImageAltChange(event.target.value)} disabled={decorative} className="article-admin-input" placeholder="อธิบายสิ่งสำคัญในภาพ" /></label>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={decorative} onChange={(event) => onDecorativeChange(event.target.checked)} />ภาพตกแต่ง</label>
        <input ref={fileInput} type="file" accept="image/*" onChange={onUpload} disabled={uploading} className="sr-only" aria-label="เลือกไฟล์ภาพ" />
        <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} className="mt-4 w-full rounded border border-blue-700 bg-blue-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">{uploading ? 'กำลังอัปโหลด…' : 'เลือกภาพและแทรก'}</button>
      </Popover.Popup></Popover.Positioner></Popover.Portal>
    </Popover.Root>
  );
}
