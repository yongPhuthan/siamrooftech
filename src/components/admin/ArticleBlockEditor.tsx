'use client';

import { useState, useEffect, MutableRefObject } from 'react';
import ImageUpload, { ImageUploadRef, SelectedFile } from './ImageUpload';
import { ArticleBlock } from '@/lib/firestore';

export interface BlockData {
  id: string;
  content: string;
  imageUploadRef: MutableRefObject<ImageUploadRef | null>;
  order_index: number;
  image?: string;
  localImagePreview?: string;
  imageRemoved?: boolean;
}

interface ArticleBlockEditorProps {
  initialBlocks?: ArticleBlock[];
  onChange: (blocks: BlockData[]) => void;
}

export default function ArticleBlockEditor({ initialBlocks = [], onChange }: ArticleBlockEditorProps) {
  const [blocks, setBlocks] = useState<BlockData[]>(() => {
    // Initialize from existing blocks if provided
    if (initialBlocks.length > 0) {
      return initialBlocks.map((block, index) => ({
        id: block.id || `block-${Date.now()}-${index}`,
        content: block.content || '',
        imageUploadRef: { current: null } as MutableRefObject<ImageUploadRef | null>,
        order_index: block.order_index || index,
        image: block.image,
        localImagePreview: undefined,
        imageRemoved: false,
      }));
    }
    // Start with one empty block
    return [{
      id: `block-${Date.now()}-0`,
      content: '',
      imageUploadRef: { current: null } as MutableRefObject<ImageUploadRef | null>,
      order_index: 0,
      image: undefined,
      localImagePreview: undefined,
      imageRemoved: false,
    }];
  });

  // Notify parent whenever blocks change
  useEffect(() => {
    onChange(blocks);
  }, [blocks, onChange]);

  const addBlock = () => {
    const newBlock: BlockData = {
      id: `block-${Date.now()}`,
      content: '',
      imageUploadRef: { current: null } as MutableRefObject<ImageUploadRef | null>,
      order_index: blocks.length,
      image: undefined,
      localImagePreview: undefined,
      imageRemoved: false,
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const removeBlock = (blockId: string) => {
    if (blocks.length <= 1) {
      alert('ต้องมีอย่างน้อย 1 ส่วน');
      return;
    }
    setBlocks(prev => {
      const filtered = prev.filter(b => b.id !== blockId);
      // Re-index order
      return filtered.map((block, index) => ({
        ...block,
        order_index: index,
      }));
    });
  };

  const updateBlockContent = (blockId: string, content: string) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === blockId ? { ...block, content } : block
      )
    );
  };

  const moveBlockUp = (blockId: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index <= 0) return prev;

      const newBlocks = [...prev];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];

      // Re-index order
      return newBlocks.map((block, i) => ({
        ...block,
        order_index: i,
      }));
    });
  };

  const moveBlockDown = (blockId: string) => {
    setBlocks(prev => {
      const index = prev.findIndex(b => b.id === blockId);
      if (index >= prev.length - 1) return prev;

      const newBlocks = [...prev];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];

      // Re-index order
      return newBlocks.map((block, i) => ({
        ...block,
        order_index: i,
      }));
    });
  };

  const handleImageSelectionChange = (blockId: string, files: SelectedFile[]) => {
    setBlocks(prev =>
      prev.map(block => {
        if (block.id !== blockId) return block;
        if (files.length === 0) {
          return {
            ...block,
            localImagePreview: undefined,
          };
        }
        return {
          ...block,
          localImagePreview: files[0]?.preview,
          imageRemoved: false,
        };
      })
    );
  };

  const clearBlockImage = (blockId: string) => {
    const targetBlock = blocks.find(block => block.id === blockId);
    targetBlock?.imageUploadRef.current?.reset();

    setBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? {
              ...block,
              image: undefined,
              localImagePreview: undefined,
              imageRemoved: true,
            }
          : block
      )
    );
  };

  const triggerBlockImageSelect = (blockId: string) => {
    const targetBlock = blocks.find(block => block.id === blockId);
    targetBlock?.imageUploadRef.current?.triggerFileSelect();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">
            เนื้อหาต่อเนื่อง
          </h3>
          <span className="text-sm text-gray-500">
            ({blocks.length} ส่วน)
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        <svg
          className="h-4 w-4 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a1 1 0 00-.894.553l-3 6a1 1 0 001.788.894L8.618 11h2.764l.724 1.447a1 1 0 001.788-.894l-3-6A1 1 0 0010 5zm0 3.618L11.236 9H8.764L10 8.618z"
            clipRule="evenodd"
          />
        </svg>
        <p>
          แต่ละส่วนประกอบด้วยรูปภาพด้านบนและข้อความด้านล่าง ช่วยให้เล่าเรื่องได้ต่อเนื่องและชัดเจน
        </p>
      </div>

      {/* Blocks List */}
      <div className="space-y-6">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
          >
            {/* Block Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 text-sm font-medium text-gray-700 bg-white">
                  {index + 1}
                </span>
                <span className="text-sm font-medium text-gray-700">
                  เนื้อหาส่วนที่ {index + 1}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
     
                {/* Delete */}
                <button
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  disabled={blocks.length <= 1}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-2 py-1 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="ลบเนื้อหาส่วนนี้"
                >
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 2a2 2 0 00-2 2v1H4.75a.75.75 0 100 1.5h10.5a.75.75 0 100-1.5H14v-1a2 2 0 00-2-2H8zm5 3H7v-1a.5.5 0 01.5-.5h5a.5.5 0 01.5.5v1z" />
                    <path d="M6.5 8.25a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zM9.75 8.25a.75.75 0 011.5 0v5.5a.75.75 0 01-1.5 0v-5.5zM13 8.25a.75.75 0 00-1.5 0v5.5a.75.75 0 001.5 0v-5.5z" />
                    <path d="M5.5 6.5h9l-.42 7.043A2 2 0 0012.082 15.5H7.918a2 2 0 01-1.998-1.957L5.5 6.5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Block Content */}
            <div className="p-4 sm:p-6 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  รูปภาพ (ไม่บังคับ)
                </label>
                {(block.localImagePreview || block.image) && (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-gray-200">
                      <img
                        src={block.localImagePreview || block.image}
                        alt={`รูปประกอบบล็อกที่ ${index + 1}`}
                        className="w-full max-h-64 object-cover"
                      />
                      {block.localImagePreview && (
                        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
                          รูปใหม่ (ยังไม่อัปโหลด)
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => triggerBlockImageSelect(block.id)}
                        className="flex-1 sm:flex-none rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                      >
                        เปลี่ยนรูป
                      </button>
                      <button
                        type="button"
                        onClick={() => clearBlockImage(block.id)}
                        className="flex-1 sm:flex-none rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                      >
                        ลบรูป
                      </button>
                    </div>
                  </div>
                )}
                <ImageUpload
                  ref={(ref) => {
                    if (ref) {
                      block.imageUploadRef.current = ref;
                    }
                  }}
                  onUpload={() => {
                    // Upload happens on form submit, not here
                  }}
                  maxFiles={1}
                  multiple={false}
                  showUploadArea={!(block.localImagePreview || block.image)}
                  className={(block.localImagePreview || block.image) ? 'hidden' : ''}
                  onSelectedFilesChange={(files) => handleImageSelectionChange(block.id, files)}
                />
                {!block.localImagePreview && !block.image && (
                  <div className="mt-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
                    เพิ่มรูปเพื่อเล่าเรื่องแบบเต็มอารมณ์ รูปจะอยู่เหนือเนื้อหาส่วนนี้
                  </div>
                )}
              </div>

              {/* Content Textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  เนื้อหาส่วนนี้ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={block.content}
                  onChange={(e) => updateBlockContent(block.id, e.target.value)}
                  rows={8}
                  required
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y leading-relaxed"
                  placeholder={`เขียนเนื้อหาสำหรับเนื้อหาส่วนที่ ${index + 1}...

ตัวอย่าง:
## หัวข้อย่อย
เนื้อหาในส่วนนี้...

- รายการที่ 1
- รายการที่ 2`}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {block.content.split(/\s+/).filter(w => w.length > 0).length} คำ
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Block Button (Bottom) */}
      <div className="pt-4">
        <button
          type="button"
          onClick={addBlock}
          className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400"
        >
          + เพิ่มเนื้อหาส่วนที่ {blocks.length + 1}
        </button>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        💡 <strong>หมายเหตุ:</strong> รูปภาพทั้งหมดจะถูกอัปโหลดเมื่อคุณกดปุ่ม &quot;บันทึก/เผยแพร่&quot; ด้านล่าง
      </div>
    </div>
  );
}
