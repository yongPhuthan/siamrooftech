"use client";

import { useState, useEffect, useRef } from "react";
import { Article } from "../../lib/firestore";
import ImageUpload, { ImageUploadRef } from "./ImageUpload";
import { PRIMARY_KEYWORD } from "../../types/article";

interface ArticleFormProps {
  article?: Article | null;
  onSuccess?: () => void;
}

const categories = [
  "เทคนิคและคำแนะนำ",
  "การดูแลรักษา",
  "การติดตั้ง",
  "แนะนำผลิตภัณฑ์",
  "ข่าวสาร",
  "อื่นๆ",
];

export default function ArticleForm({ article, onSuccess }: ArticleFormProps) {
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
    // SEO fields with default keyword
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [PRIMARY_KEYWORD] as string[], // Default: "กันสาดพับได้"
    isPublished: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [seoKeywordInput, setSeoKeywordInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const imageUploadRef = useRef<ImageUploadRef>(null);

  // Load existing article data
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
        seoKeywords: article.seoKeywords && article.seoKeywords.length > 0
          ? article.seoKeywords
          : [PRIMARY_KEYWORD],
        isPublished: article.isPublished || false,
      });
    }
  }, [article]);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !article) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^\u0E00-\u0E7Fa-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, article]);

  // Auto-calculate read time from content
  useEffect(() => {
    if (formData.content) {
      const wordsPerMinute = 200;
      const wordCount = formData.content.split(/\s+/).length;
      const minutes = Math.ceil(wordCount / wordsPerMinute);
      setFormData(prev => ({ ...prev, read_time: `${minutes} นาที` }));
    }
  }, [formData.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // First, upload images if there are any selected files
      const selectedFiles = imageUploadRef.current?.getSelectedFiles();
      if (selectedFiles && selectedFiles.length > 0) {
        try {
          const uploadResults = await imageUploadRef.current?.uploadFiles();

          // If we got upload results and there's no featured_image yet, use the first uploaded image
          if (uploadResults && uploadResults.length > 0 && !formData.featured_image) {
            const firstImage = uploadResults[0];
            setFormData(prev => ({
              ...prev,
              featured_image: firstImage.mediumUrl || firstImage.originalUrl || ''
            }));

            // Update formData for submission
            formData.featured_image = firstImage.mediumUrl || firstImage.originalUrl || '';
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert('การอัพโหลดรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง');
          setSubmitting(false);
          return;
        }
      }

      // Then submit the article data
      const url = article
        ? `/api/articles/${article.slug}`
        : '/api/articles';

      const method = article ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setLastSaved(new Date());
        alert(article ? 'แก้ไขบทความสำเร็จ' : 'สร้างบทความสำเร็จ');

        // Reset image upload component
        imageUploadRef.current?.reset();

        onSuccess?.();
      } else {
        const error = await response.json();
        alert(`เกิดข้อผิดพลาด: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error submitting article:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addSeoKeyword = () => {
    if (seoKeywordInput.trim() && !formData.seoKeywords.includes(seoKeywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, seoKeywordInput.trim()]
      }));
      setSeoKeywordInput("");
    }
  };

  const removeSeoKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(k => k !== keyword)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Single-page form - no tabs, mobile-first */}
      <div className="space-y-6">
        {/* Last Saved Indicator - Mobile Friendly */}
        {lastSaved && (
          <div className="text-xs text-gray-500 text-center bg-green-50 py-2 rounded-lg">
            ✓ บันทึกล่าสุด: {lastSaved.toLocaleTimeString('th-TH')}
          </div>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Section: พื้นฐาน */}
          <div className="p-4 sm:p-6 space-y-5">
            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-200">
              📝 ข้อมูลพื้นฐาน
            </h3>

            {/* Title - Mobile optimized */}
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

            {/* Excerpt - Larger textarea for mobile */}
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

            {/* Content - Optimized width for mobile writing */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                เนื้อหาบทความ <span className="text-red-500">*</span>
              </label>
              <div className="text-xs text-gray-500 mb-2 bg-gray-50 p-2 rounded">
                💡 รองรับ Markdown: **ตัวหนา**, *ตัวเอียง*, [ลิงก์](url), ## หัวข้อ
              </div>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={25}
                className="w-full px-3 py-3 text-[15px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent leading-relaxed resize-y"
                style={{ maxWidth: '100%' }}
                placeholder="เขียนเนื้อหาบทความที่นี่...

ตัวอย่าง:
## หัวข้อย่อย

เนื้อหาในส่วนนี้...

- รายการที่ 1
- รายการที่ 2

**ข้อความสำคัญ**"
              />
              {formData.read_time && (
                <p className="text-xs text-gray-500 mt-2">
                  ⏱️ เวลาอ่าน: {formData.read_time} (คำนวณอัตโนมัติ)
                </p>
              )}
            </div>

            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                รูปหน้าปก
              </label>
              {formData.featured_image ? (
                <div className="space-y-3">
                  <img
                    src={formData.featured_image}
                    alt="Featured"
                    className="w-full h-48 sm:h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, featured_image: "" }))}
                    className="w-full sm:w-auto px-4 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    ลบรูป
                  </button>
                </div>
              ) : (
                <ImageUpload
                  ref={imageUploadRef}
                  onUpload={(results) => {
                    if (results && results.length > 0) {
                      const result = results[0];
                      setFormData(prev => ({
                        ...prev,
                        featured_image: result.mediumUrl || result.originalUrl || ''
                      }));
                    }
                  }}
                  maxFiles={1}
                  multiple={false}
                  showUploadArea={true}
                />
              )}
            </div>

            {/* Category & Author - Stack on mobile */}
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
                  {/* Dropdown arrow icon */}
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

            {/* Tags - Mobile friendly */}
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

          {/* Section: SEO (collapsed into main form) */}
          <div className="p-4 sm:p-6 space-y-5 border-t border-gray-200 bg-gray-50">
            <h3 className="text-base font-semibold text-gray-900 pb-2 border-b border-gray-200">
              🔍 การตั้งค่า SEO
            </h3>

            {/* SEO Keywords with default */}
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

            {/* URL Slug - Auto-generated */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                URL Slug <span className="text-xs text-gray-500">(สร้างอัตโนมัติ)</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-gray-50"
                placeholder="url-slug-here"
              />
              <p className="text-xs text-gray-500 mt-1">
                URL: /articles/{formData.slug || 'your-slug'}
              </p>
            </div>

            {/* SEO Title - Optional */}
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

            {/* SEO Description - Optional */}
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
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar - Mobile Optimized (Fitts's Law) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Publish Status Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              {formData.isPublished ? '✓ เผยแพร่' : 'ฉบับร่าง'}
            </span>
          </label>

          {/* Submit Button - Large for mobile (Fitts's Law) */}
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md text-base"
          >
            {submitting
              ? 'กำลังบันทึก...'
              : article
                ? 'บันทึกการแก้ไข'
                : formData.isPublished
                  ? 'เผยแพร่'
                  : 'บันทึกฉบับร่าง'
            }
          </button>
        </div>
      </div>
    </form>
  );
}
