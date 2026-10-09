// @vitest-environment happy-dom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it } from 'vitest';
import type { ArticleDocument } from '../document-schema';
import type { ArticleHeading } from '../heading-outline';
import ArticleEditor from './ArticleEditor';
import ArticleOutlinePanel from './ArticleOutlinePanel';
import ArticleWorkspace from './ArticleWorkspace';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root;
let container: HTMLDivElement;

afterEach(async () => {
  await act(async () => { root?.unmount(); });
  container?.remove();
});

it('updates the visible outline when pasted rich text adds H2 and H3 headings', async () => {
  const initial: ArticleDocument = { type: 'doc', content: [{ type: 'paragraph' }] };
  function Harness({ initial }: { initial: ArticleDocument }) {
    const [document, setDocument] = useState(initial);
    const [headings, setHeadings] = useState<ArticleHeading[]>([]);
    return createElement(ArticleWorkspace, {
      title: 'บทความทดสอบ', onTitleChange: () => undefined, onBack: () => undefined,
      saveState: 'บันทึกแล้ว', actions: createElement('div'), metadata: createElement('div'),
      issues: [], onIssueClick: () => undefined,
      outline: createElement(ArticleOutlinePanel, { headings, onSelectHeading: () => undefined }),
    }, createElement(ArticleEditor, {
        document,
        onChange: setDocument,
        onOutlineChange: setHeadings,
        onActiveHeadingChange: () => undefined,
        onCompositionChange: () => undefined,
        onHeadingFocused: () => undefined,
        onUploadError: () => undefined,
      }));
  }
  container = globalThis.document.createElement('div');
  globalThis.document.body.append(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(Harness, { initial })); });

  const editor = container.querySelector<HTMLElement>('[contenteditable="true"]');
  expect(editor).toBeTruthy();
  const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(paste, 'clipboardData', { value: {
    getData: (type: string) => type === 'text/html' ? '<h2>หัวข้อหลัก</h2><p>เนื้อหา</p><h3>หัวข้อย่อย</h3>' : '',
  } });
  await act(async () => { editor!.dispatchEvent(paste); });

  expect(container.querySelector('[aria-label="โครงร่างบทความ"]')?.textContent).toContain('หัวข้อหลัก');
  expect(container.querySelector('[aria-label="โครงร่างบทความ"]')?.textContent).toContain('หัวข้อย่อย');
});

it('keeps highlighted text and immediately lists a new heading created from the toolbar', async () => {
  const initial: ArticleDocument = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'ข้อความที่เลือก' }] }] };
  function Harness() {
    const [document, setDocument] = useState(initial);
    const [headings, setHeadings] = useState<ArticleHeading[]>([]);
    return createElement(ArticleWorkspace, {
      title: 'บทความทดสอบ', onTitleChange: () => undefined, onBack: () => undefined,
      saveState: 'บันทึกแล้ว', actions: createElement('div'), metadata: createElement('div'),
      issues: [], onIssueClick: () => undefined,
      outline: createElement(ArticleOutlinePanel, { headings, onSelectHeading: () => undefined }),
    }, createElement(ArticleEditor, {
        document,
        onChange: setDocument,
        onOutlineChange: setHeadings,
        onActiveHeadingChange: () => undefined,
        onCompositionChange: () => undefined,
        onHeadingFocused: () => undefined,
        onUploadError: () => undefined,
      }));
  }
  container = globalThis.document.createElement('div');
  globalThis.document.body.append(container);
  root = createRoot(container);
  await act(async () => { root.render(createElement(Harness)); });

  const editor = container.querySelector<HTMLElement>('[contenteditable="true"]')!;
  const text = editor.querySelector('p')?.firstChild;
  expect(text?.textContent).toBe('ข้อความที่เลือก');
  const range = globalThis.document.createRange();
  range.selectNodeContents(text!);
  globalThis.window.getSelection()?.removeAllRanges();
  globalThis.window.getSelection()?.addRange(range);

  await act(async () => { container.querySelector<HTMLButtonElement>('[aria-label="เครื่องมือจัดรูปแบบ"]')?.click(); });
  await act(async () => { [...globalThis.document.body.querySelectorAll<HTMLButtonElement>('button')].find((button) => button.getAttribute('aria-label') === 'เพิ่มหัวข้อ H2')?.click(); });

  expect(editor.querySelector('h2')?.textContent).toBe('ข้อความที่เลือก');
  expect(container.querySelector('[aria-label="โครงร่างบทความ"]')?.textContent).toContain('ข้อความที่เลือก');
});
