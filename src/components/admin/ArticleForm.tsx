"use client";

import { useState, useEffect, useMemo } from "react";
import { Article, ArticleBlock } from "../../lib/firestore";
import ArticleBlockEditor, { BlockData as BlockEditorBlock } from "./ArticleBlockEditor";
import ArticlePreviewModal from "./ArticlePreviewModal";
import { PRIMARY_KEYWORD } from "../../types/article";

interface ArticleFormProps {
  article?: Article | null;
  onSuccess?: () => void;
}

const MAX_SLUG_WORDS = 6;

const generateSeoSlug = (title: string, category: string, tags: string[]): string => {
  const sources = [title, ...tags.slice(0, 2), category].join(" ").toLowerCase();

  const cleaned = sources
    .replace(/\d+/g, " ")
    .replace(/[^a-z\u0E00-\u0E7F\s-]/g, " ")
    .replace(/-{2,}/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) {
    return "article";
  }

  const seen = new Set<string>();
  const words: string[] = [];

  cleaned.split(" ").forEach((word) => {
    const trimmedWord = word.replace(/^-+|-+$/g, "");
    if (!trimmedWord || trimmedWord.length < 2) return;
    if (seen.has(trimmedWord)) return;
    seen.add(trimmedWord);
    words.push(trimmedWord);
  });

  const limitedWords = words.slice(0, MAX_SLUG_WORDS);
  if (limitedWords.length === 0) {
    return "article";
  }

  let slug = limitedWords.join("-");
  if (slug.length > 80) {
    slug = limitedWords
      .slice(0, Math.max(1, MAX_SLUG_WORDS - 1))
      .join("-");
  }

  return slug.replace(/-+/g, "-").replace(/(^-|-$)/g, "") || "article";
};

const categories = [
  "เทคนิคและคำแนะนำ",
  "การดูแลรักษา",
  "การติดตั้ง",
  "แนะนำผลิตภัณฑ์",
  "ข่าวสาร",
  "อื่นๆ",
];

export default function ArticleForm({ article, onSuccess }: ArticleFormProps) {
  const [blocks, setBlocks] = useState<BlockEditorBlock[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    featured_image: "",
    category: categories[0],
    author: "Siamrooftech",
    tags: [] as string[],
    slug: "",
    read_time: "",
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [PRIMARY_KEYWORD] as string[],
    isPublished: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [seoKeywordInput, setSeoKeywordInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const initialBlocks = useMemo<ArticleBlock[]>(() => {
    if (!article) return [];

    if (article.blocks && article.blocks.length > 0) {
      const sorted = [...article.blocks].sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
      );
      return sorted.map((block, index) => ({
        ...block,
        order_index: index,
      }));
    }

    if (article.content) {
      return [
        {
          id: article.id ? `legacy-${article.id}` : `legacy-${Date.now()}`,
          content: article.content,
          image: article.featured_image,
          order_index: 0,
          created_at: article.updated_at || article.created_at || new Date().toISOString(),
        },
      ];
    }

    return [];
  }, [article]);

  const previewBlocks = useMemo<ArticleBlock[]>(() => {
    return blocks.reduce<ArticleBlock[]>((acc, block, index) => {
      const trimmedContent = block.content.trim();
      const previewImage =
        block.localImagePreview || (!block.imageRemoved ? block.image : undefined);

      if (!trimmedContent && !previewImage) {
        return acc;
      }

      acc.push({
        id: block.id,
        content: trimmedContent,
        image: previewImage,
        order_index: index,
      });

      return acc;
    }, []);
  }, [blocks]);

  const canPreview = previewBlocks.length > 0 || formData.title.trim().length > 0;

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || "",
        excerpt: article.excerpt || "",
        content: article.content || "",
        featured_image: article.featured_image || "",
        category: article.category || categories[0],
        author: article.author || "Siamrooftech",
        tags: article.tags || [],
        slug: article.slug || "",
        read_time: article.read_time || "",
        seoTitle: article.seoTitle || "",
        seoDescription: article.seoDescription || "",
        seoKeywords:
          article.seoKeywords && article.seoKeywords.length > 0
            ? article.seoKeywords
            : [PRIMARY_KEYWORD],
        isPublished: article.isPublished || false,
      });
    }
  }, [article]);

  useEffect(() => {
    if (article) return;

    const title = formData.title.trim();
    if (!title) {
      setFormData(prev => (prev.slug === "" ? prev : { ...prev, slug: "" }));
      return;
    }

    const nextSlug = generateSeoSlug(title, formData.category, formData.tags);
    setFormData(prev => (prev.slug === nextSlug ? prev : { ...prev, slug: nextSlug }));
  }, [article, formData.title, formData.category, formData.tags]);

  useEffect(() => {
    const combinedContent = blocks
      .map(block => block.content.trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();

    const wordCount = combinedContent
      ? combinedContent.split(/\s+/).filter(Boolean).length
      : 0;
    const minutes = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 200)) : 0;
    const nextReadTime = minutes > 0 ? `${minutes} นาที` : "";

    setFormData(prev => {
      if (prev.content === combinedContent && prev.read_time === nextReadTime) {
        return prev;
      }
      return {
        ...prev,
        content: combinedContent,
        read_time: nextReadTime,
      };
    });
  }, [blocks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const allUploadPromises: Promise<any>[] = [];
      const blockUploadMap: Record<string, number> = {};

      blocks.forEach(block => {
        const selectedFiles = block.imageUploadRef.current?.getSelectedFiles();
        if (selectedFiles && selectedFiles.length > 0) {
          const uploadPromise = block.imageUploadRef.current?.uploadFiles();
          if (uploadPromise) {
            blockUploadMap[block.id] = allUploadPromises.length;
            allUploadPromises.push(uploadPromise);
          }
        }
      });

      let allUploadResults: any[] = [];
      if (allUploadPromises.length > 0) {
        try {
          allUploadResults = await Promise.all(allUploadPromises);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          alert("การอัพโหลดรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง");
          setSubmitting(false);
          return;
        }
      }

      const builtBlocks: ArticleBlock[] = [];
      blocks.forEach(block => {
        const uploadIndex = blockUploadMap[block.id];
        const hasUpload = uploadIndex !== undefined;
        let imageUrl = "";

        if (hasUpload) {
          const uploadResults = allUploadResults[uploadIndex];
          if (uploadResults && uploadResults.length > 0) {
            imageUrl = uploadResults[0].mediumUrl || uploadResults[0].originalUrl || "";
          }
        } else if (!block.imageRemoved) {
          imageUrl = block.image || "";
        }

        const trimmedContent = block.content.trim();
        const finalImage = imageUrl || undefined;

        if (!trimmedContent && !finalImage) {
          return;
        }

        const originalBlock = article?.blocks?.find(existing => existing.id === block.id);

        builtBlocks.push({
          id: block.id,
          image: finalImage,
          content: trimmedContent,
          order_index: builtBlocks.length,
          created_at: originalBlock?.created_at || new Date().toISOString(),
        });
      });

      const combinedContent = builtBlocks
        .map(block => block.content)
        .filter(Boolean)
        .join("\n\n");

      const featuredImageFromBlocks = builtBlocks.find(block => block.image)?.image || "";

      const finalSlug = formData.slug || generateSeoSlug(formData.title.trim(), formData.category, formData.tags);

      const articleData = {
        ...formData,
        slug: finalSlug,
        content: combinedContent,
        featured_image: featuredImageFromBlocks || "",
        authoringMode: "blocks" as const,
        blocks: builtBlocks,
      };

      const url = article ? `/api/articles/${article.slug}` : "/api/articles";
      const method = article ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        setLastSaved(new Date());
        alert(article ? "แก้ไขบทความสำเร็จ" : "สร้างบทความสำเร็จ");

        blocks.forEach(block => {
          block.imageUploadRef.current?.reset();
        });

        setBlocks(prev =>
          prev.map(block => {
            const savedBlock = builtBlocks.find(b => b.id === block.id);
            return {
              ...block,
              image: savedBlock?.image,
              localImagePreview: undefined,
              imageRemoved: savedBlock ? !savedBlock.image : block.imageRemoved,
            };
          })
        );

        setFormData(prev => ({
          ...prev,
          featured_image: featuredImageFromBlocks || "",
        }));

        onSuccess?.();
      } else {
        const error = await response.json();
        alert(`เกิดข้อผิดพลาด: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error("Error submitting article:", error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const addSeoKeyword = () => {
    if (seoKeywordInput.trim() && !formData.seoKeywords.includes(seoKeywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, seoKeywordInput.trim()],
      }));
      setSeoKeywordInput("");
    }
  };

  const removeSeoKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(k => k !== keyword),
    }));
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-28">
        <div className="space-y-6">
          {lastSaved && (
            <div className="text-xs text-gray-500 text-center bg-green-50 py-2 rounded-lg">
              ✓ บันทึกล่าสุด: {lastSaved.toLocaleTimeString('th-TH')}
            </div>
          )}

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900">
                  📝 ข้อมูลหลัก
                </h3>
                {formData.read_time && (
                  <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                    ⏱️ เวลาอ่านประมาณ {formData.read_time}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  หัวข้อบทความ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น: 5 เทคนิคการเลือกกันสาดพับได้"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  สรุปย่อ <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="สรุปเนื้อหาบทความสั้นๆ 2-3 ประโยค"
                  maxLength={200}
                />
                <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/200 ตัวอักษร</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    หมวดหมู่ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white pr-10 cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    ผู้เขียน
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  แท็ก <span className="text-xs text-gray-500">(สูงสุด 7 แท็ก)</span>
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="พิมพ์แท็กแล้วกด Enter"
                    disabled={formData.tags.length >= 7}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={formData.tags.length >= 7}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    เพิ่ม
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6 space-y-5">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-gray-900">
                  📱 เนื้อหาต่อเนื่อง (Mobile-first)
                </h3>
                <p className="text-sm text-gray-500">
                  เพิ่มรูปและข้อความทีละส่วน ให้ผู้อ่านเลื่อนอ่านบนมือถือได้ต่อเนื่องแบบหน้าเดียว
                </p>
              </div>
              <ArticleBlockEditor
                key={article?.id ?? "new-article"}
                initialBlocks={initialBlocks}
                onChange={(updatedBlocks) => setBlocks(updatedBlocks)}
              />
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-4 sm:p-6 space-y-5">
              <h3 className="text-base font-semibold text-gray-900">
                🔍 การตั้งค่า SEO
              </h3>

              <div className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                รูปหน้าปกจะเลือกจากรูปบล็อกแรกที่มีภาพโดยอัตโนมัติ
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  URL Slug <span className="text-xs text-gray-500">(ระบบสร้างให้อัตโนมัติ)</span>
                </label>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <span className="text-sm text-gray-500">/articles/</span>
                  <span className="font-mono text-sm text-gray-900 truncate max-w-[70%] text-right">
                    {formData.slug || "กำลังสร้าง..."}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ระบบเลือกคำสำคัญที่อ่านง่าย อนาคต-proof และใช้ตัวพิมพ์เล็ก + ขีดกลางให้โดยอัตโนมัติ
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  SEO Title <span className="text-xs text-gray-500">(ถ้าไม่ระบุจะใช้หัวข้อบทความ)</span>
                </label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ถ้าไม่ระบุจะใช้หัวข้อบทความ"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.seoTitle.length}/60 ตัวอักษร
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  SEO Description <span className="text-xs text-gray-500">(ถ้าไม่ระบุจะใช้สรุปย่อ)</span>
                </label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="ถ้าไม่ระบุจะใช้สรุปย่อ"
                  maxLength={160}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.seoDescription.length}/160 ตัวอักษร
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  คำสำคัญ SEO <span className="text-xs text-gray-500">(สูงสุด 10 คำ)</span>
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-800">
                    💡 ค่าเริ่มต้น: &quot;{PRIMARY_KEYWORD}&quot; ถูกเพิ่มให้อัตโนมัติเพื่อช่วย SEO
                  </p>
                </div>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={seoKeywordInput}
                    onChange={(e) => setSeoKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSeoKeyword();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="เพิ่มคำสำคัญเพิ่มเติม"
                    disabled={formData.seoKeywords.length >= 10}
                  />
                  <button
                    type="button"
                    onClick={addSeoKeyword}
                    disabled={formData.seoKeywords.length >= 10}
                    className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-medium"
                  >
                    เพิ่ม
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.seoKeywords.map((keyword, index) => (
                    <span
                      key={keyword}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                        index === 0 && keyword === PRIMARY_KEYWORD
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {keyword}
                      {index === 0 && keyword === PRIMARY_KEYWORD && (
                        <span className="ml-1 text-[10px]">★</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeSeoKeyword(keyword)}
                        className="ml-2 text-gray-600 hover:text-gray-800 font-bold"
                        disabled={index === 0 && keyword === PRIMARY_KEYWORD}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                disabled={!canPreview}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
       
                ดูพรีวิว
              </button>
              <label className="flex items-center justify-between sm:justify-start gap-2 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>{formData.isPublished ? '✓ พร้อมเผยแพร่' : 'บันทึกเป็นฉบับร่าง'}</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
            >
              {submitting
                ? 'กำลังบันทึก...'
                : article
                  ? 'บันทึกการแก้ไข'
                  : formData.isPublished
                    ? 'เผยแพร่เลย'
                    : 'บันทึกฉบับร่าง'}
            </button>
          </div>
        </div>
      </form>

      <ArticlePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        title={formData.title}
        excerpt={formData.excerpt}
        blocks={previewBlocks}
        author={formData.author}
        category={formData.category}
      />
    </>
  );
}
