import type { Editor } from '@tiptap/core';

export function setArticleHeading(editor: Editor, level: 2 | 3) {
  // Convert the selected text block in place. Inserting a fresh empty heading
  // replaces a non-empty text selection and loses the author's highlighted text.
  return editor.chain().focus().setNode('heading', { level }).run();
}
