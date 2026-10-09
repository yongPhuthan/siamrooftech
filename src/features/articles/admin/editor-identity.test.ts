// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { Editor, JSONContent } from '@tiptap/core';
import { DOMParser as ProseMirrorDOMParser, Fragment, Slice } from '@tiptap/pm/model';
import { createArticleEditorExtensions } from './editor-extensions';
import { ArticleDocumentSchema } from '../document-schema';
import { collectArticleHeadings } from '../heading-outline';
import { setArticleHeading } from './editor-commands';

const idOne = 'section-11111111-1111-4111-8111-111111111111';
const idTwo = 'section-22222222-2222-4222-8222-222222222222';

function getHeadings(editor: Editor) {
  return editor.getJSON().content?.filter((node) => node.type === 'heading') ?? [];
}

describe('Tiptap persistent heading identity', () => {
  let editor: Editor | undefined;

  afterEach(() => {
    editor?.destroy();
    editor = undefined;
  });

  it('preserves heading IDs through edits, reorder, and save/reload while assigning a new ID to a duplicate', () => {
    let generated = 0;
    editor = new Editor({
      element: document.createElement('div'),
      extensions: createArticleEditorExtensions(() => `section-33333333-3333-4333-8333-${String(++generated).padStart(12, '0')}`),
      content: {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 2, id: idOne }, content: [{ type: 'text', text: 'หัวข้อหนึ่ง' }] },
          { type: 'heading', attrs: { level: 3, id: idTwo }, content: [{ type: 'text', text: 'หัวข้อสอง' }] },
        ],
      },
    });

    editor.commands.insertContentAt({ from: 1, to: 1 + 'หัวข้อหนึ่ง'.length }, [{ type: 'text', text: 'หัวข้อที่แก้ไข' }]);
    expect(getHeadings(editor)[0].attrs?.id).toBe(idOne);

    const ordered: JSONContent = { type: 'doc', content: [getHeadings(editor)[1], getHeadings(editor)[0]] };
    editor.commands.setContent(ordered);
    expect(getHeadings(editor).map((node) => node.attrs?.id)).toEqual([idTwo, idOne]);

    const saved = JSON.parse(JSON.stringify(editor.getJSON())) as JSONContent;
    editor.commands.setContent(saved);
    expect(getHeadings(editor).map((node) => node.attrs?.id)).toEqual([idTwo, idOne]);

    editor.commands.setTextSelection(editor.state.doc.content.size);
    const copiedHeading = editor.schema.nodeFromJSON({ type: 'heading', attrs: { level: 2, id: idOne }, content: [{ type: 'text', text: 'หัวข้อซ้ำ' }] });
    const copiedSlice = new Slice(Fragment.from(copiedHeading), 0, 0);
    editor.view.someProp('handleDOMEvents', (handlers) => handlers.paste?.(editor!.view, new ClipboardEvent('paste')));
    let transformedSlice = copiedSlice;
    editor.view.someProp('transformPasted', (transform) => { transformedSlice = transform(copiedSlice, editor!.view, false); });
    editor.view.dispatch(editor.state.tr.replaceSelection(transformedSlice));
    const finalIds = getHeadings(editor).map((node) => node.attrs?.id as string);
    expect(finalIds).toHaveLength(3);
    expect(new Set(finalIds).size).toBe(3);
    expect(finalIds.slice(0, 2)).toEqual([idTwo, idOne]);
    expect(finalIds[2]).toMatch(/^section-/);
  });

  it('recognizes H2/H3 when plain Markdown is pasted and keeps H1 out of the body outline', () => {
    let generated = 0;
    editor = new Editor({
      element: document.createElement('div'),
      extensions: createArticleEditorExtensions(() => `section-33333333-3333-4333-8333-${String(++generated).padStart(12, '0')}`),
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });

    const clipboardEvent = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(clipboardEvent, 'clipboardData', { value: {
      getData: (type: string) => type === 'text/plain' ? '# บทความ\n\n## หัวข้อหลัก\nเนื้อหาหนึ่ง\n### หัวข้อย่อย\nเนื้อหาสอง' : '',
    } });
    let handled = false;
    editor.view.someProp('handlePaste', (handler) => {
      handled = handler(editor!.view, clipboardEvent, new Slice(Fragment.empty, 0, 0)) === true;
      return handled;
    });

    expect(handled).toBe(true);
    expect(getHeadings(editor).map((node) => {
      const child = node.content?.[0];
      return {
        level: node.attrs?.level,
        text: child && 'text' in child ? child.text : undefined,
        id: node.attrs?.id,
      };
    })).toEqual([
      { level: 2, text: 'หัวข้อหลัก', id: 'section-33333333-3333-4333-8333-000000000001' },
      { level: 3, text: 'หัวข้อย่อย', id: 'section-33333333-3333-4333-8333-000000000002' },
    ]);
    expect(editor.getJSON().content?.[0]).toMatchObject({ type: 'paragraph', content: [{ type: 'text', text: 'บทความ' }] });
    const parsed = ArticleDocumentSchema.safeParse(editor.getJSON());
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(collectArticleHeadings(parsed.data).map(({ level, text }) => ({ level, text }))).toEqual([
      { level: 2, text: 'หัวข้อหลัก' },
      { level: 3, text: 'หัวข้อย่อย' },
    ]);
  });

  it('continues to parse rich HTML H2/H3 through Tiptap HTML paste handling', () => {
    editor = new Editor({
      element: document.createElement('div'),
      extensions: createArticleEditorExtensions(),
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });
    const source = document.createElement('div');
    source.innerHTML = '<h1>ชื่อบทความ</h1><h2>หัวข้อหลัก</h2><h3>หัวข้อย่อย</h3>';
    const pasted = ProseMirrorDOMParser.fromSchema(editor.schema).parseSlice(source);
    let transformed = pasted;
    editor.view.someProp('transformPasted', (transform) => { transformed = transform(pasted, editor!.view, false); });
    editor.view.dispatch(editor.state.tr.replaceSelection(transformed));

    expect(getHeadings(editor).map((node) => node.attrs?.level)).toEqual([2, 3]);
    expect(getHeadings(editor).every((node) => typeof node.attrs?.id === 'string' && node.attrs.id.length > 0)).toBe(true);
    expect(editor.getJSON().content?.[0]).toMatchObject({ type: 'paragraph', content: [{ type: 'text', text: 'ชื่อบทความ' }] });
  });

  it('repairs missing heading IDs after an imported document receives its next editor transaction', () => {
    let generated = 0;
    editor = new Editor({
      element: document.createElement('div'),
      extensions: createArticleEditorExtensions(() => `section-44444444-4444-4444-8444-${String(++generated).padStart(12, '0')}`),
      content: '<h2>หัวข้อที่นำเข้า</h2><h3>หัวข้อย่อยที่นำเข้า</h3>',
    });

    editor.commands.insertContentAt(editor.state.doc.content.size, { type: 'paragraph', content: [{ type: 'text', text: 'เนื้อหา' }] });
    const parsed = ArticleDocumentSchema.safeParse(editor.getJSON());
    expect(parsed.success).toBe(true);
    expect(getHeadings(editor).map((node) => node.attrs?.id)).toEqual([
      'section-44444444-4444-4444-8444-000000000001',
      'section-44444444-4444-4444-8444-000000000002',
    ]);
    if (parsed.success) expect(collectArticleHeadings(parsed.data).map(({ text }) => text)).toEqual(['หัวข้อที่นำเข้า', 'หัวข้อย่อยที่นำเข้า']);
  });

  it('accepts common pasted article structures including blockquotes, lists, and tables', () => {
    editor = new Editor({
      element: document.createElement('div'),
      extensions: createArticleEditorExtensions(),
      content: { type: 'doc', content: [{ type: 'paragraph' }] },
    });
    editor.commands.insertContent('<blockquote><p>คำโปรย</p></blockquote><h2>ส่วนหลัก</h2><p>เนื้อหา</p><ul><li><p>รายการ</p></li></ul><ol start="2"><li><p>ลำดับ</p></li></ol><table><tbody><tr><th><p>ช่วงเวลา</p></th><td><p>ทันที</p></td></tr></tbody></table>');
    const parsed = ArticleDocumentSchema.safeParse(editor.getJSON());
    expect(parsed.success).toBe(true);
  });

  it('preserves highlighted text and marks when changing its paragraph to H2 or H3', () => {
    editor = new Editor({
      element: document.createElement('div'),
      extensions: createArticleEditorExtensions(),
      content: { type: 'doc', content: [{ type: 'paragraph', content: [
        { type: 'text', text: 'ข้อความ ' },
        { type: 'text', text: 'ที่เลือก', marks: [{ type: 'bold' }] },
      ] }] },
    });
    const originalText = editor.getText();
    editor.commands.setTextSelection({ from: 9, to: 15 });

    expect(setArticleHeading(editor, 2)).toBe(true);

    expect(getHeadings(editor)).toHaveLength(1);
    expect(getHeadings(editor)[0]).toMatchObject({ attrs: { level: 2 } });
    expect(getHeadings(editor)[0].attrs?.id).toMatch(/^section-/);
    expect(getHeadings(editor)[0].content?.map((node) => 'text' in node ? node.text : '').join('')).toBe(originalText);
    expect(getHeadings(editor)[0].content?.find((node) => 'text' in node && node.text === 'ที่เลือก')).toMatchObject({ text: 'ที่เลือก', marks: [{ type: 'bold' }] });

    const headingId = getHeadings(editor)[0].attrs?.id;
    expect(setArticleHeading(editor, 3)).toBe(true);
    expect(getHeadings(editor)[0].content?.map((node) => 'text' in node ? node.text : '').join('')).toBe(originalText);
    expect(getHeadings(editor)).toHaveLength(1);
    expect(getHeadings(editor)[0].attrs).toEqual({ level: 3, id: headingId });
  });
});
