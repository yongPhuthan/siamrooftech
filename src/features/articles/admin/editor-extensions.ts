import StarterKit from '@tiptap/starter-kit';
import { Extension, type JSONContent } from '@tiptap/core';
import UniqueID from '@tiptap/extension-unique-id';
import ImageExtension from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import { Fragment, Node as ProseMirrorNode, Slice } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
import { createHeadingId } from './heading-id';

function markdownTextToNodes(text: string, makeId: () => string): JSONContent[] {
  const nodes: JSONContent[] = [];
  let paragraphLines: string[] = [];
  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    nodes.push({ type: 'paragraph', content: [{ type: 'text', text: paragraphLines.join(' ') }] });
    paragraphLines = [];
  };

  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      flushParagraph();
      continue;
    }
    const match = /^(#{1,6})[\t ]+(.+?)\s*#*\s*$/.exec(line);
    if (!match) {
      paragraphLines.push(line);
      continue;
    }

    flushParagraph();
    const level = match[1].length;
    const label = match[2].trim();
    // Article title is the single H1. Keep pasted H1 text in the document as a
    // paragraph; the author can move it to the title field when appropriate.
    if (level === 2 || level === 3) {
      nodes.push({ type: 'heading', attrs: { level, id: makeId() }, content: [{ type: 'text', text: label }] });
    } else {
      nodes.push({ type: 'paragraph', content: [{ type: 'text', text: label }] });
    }
  }
  flushParagraph();
  return nodes;
}

function createMarkdownHeadingPaste(makeId: () => string) {
  return Extension.create({
    name: 'articleMarkdownHeadingPaste',
    addProseMirrorPlugins() {
      return [new Plugin({
        props: {
          handlePaste(view, event) {
            const clipboard = event.clipboardData;
            if (!clipboard || clipboard.getData('text/html')) return false;
            const text = clipboard.getData('text/plain');
            if (!/^#{2,3}[\t ]+\S/m.test(text)) return false;
            const content = markdownTextToNodes(text, makeId)
              .map((node) => view.state.schema.nodeFromJSON(node));
            if (!content.length) return false;
            event.preventDefault();
            view.dispatch(view.state.tr.replaceSelection(new Slice(Fragment.fromArray(content), 0, 0)).scrollIntoView());
            return true;
          },
        },
      })];
    },
  });
}

function createHeadingIdentity(makeId: () => string) {
  return Extension.create({
    name: 'articleHeadingIdentity',
    addProseMirrorPlugins() {
      return [new Plugin({
        appendTransaction(_transactions, _oldState, newState) {
          const transaction = newState.tr;
          newState.doc.descendants((node, position) => {
            if (node.type.name === 'heading' && (typeof node.attrs.id !== 'string' || !node.attrs.id.trim())) {
              transaction.setNodeMarkup(position, undefined, { ...node.attrs, id: makeId() });
            }
          });
          return transaction.docChanged ? transaction : null;
        },
        props: {
          transformPasted(slice) {
            const mapFragment = (fragment: Fragment): Fragment => {
              const nodes: ProseMirrorNode[] = [];
              fragment.forEach((node) => {
                if (node.type.name === 'heading') {
                  nodes.push(node.type.create({ ...node.attrs, id: makeId() }, node.content, node.marks));
                } else if (node.content.size > 0) {
                  nodes.push(node.copy(mapFragment(node.content)));
                } else {
                  nodes.push(node);
                }
              });
              return Fragment.fromArray(nodes);
            };
            return new Slice(mapFragment(slice.content), slice.openStart, slice.openEnd);
          },
        },
      })];
    },
  });
}

const HeadingImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: { default: null },
      height: { default: null },
      decorative: { default: false },
      caption: { default: null },
    };
  },
});

export function createArticleEditorExtensions(makeId: () => string = createHeadingId) {
  return [
    StarterKit.configure({ heading: { levels: [2, 3] }, link: false, codeBlock: false, hardBreak: false, horizontalRule: false, underline: false }),
    createMarkdownHeadingPaste(makeId),
    createHeadingIdentity(makeId),
    UniqueID.configure({ types: ['heading'], generateID: () => makeId() }),
    HeadingImage.configure({ inline: false, allowBase64: false }),
    Link.configure({ openOnClick: false, protocols: ['mailto'], HTMLAttributes: { rel: 'noopener noreferrer' } }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
  ];
}
