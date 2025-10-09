"use client";

import { useState, useEffect } from "react";
import { Article } from "../../lib/firestore";
import ImageUpload from "./ImageUpload";
import { UploadResult } from "../../app/lib/cloudflare/uploadImage";

interface ArticleFormProps {
  article?: Article | null;
  onSuccess?: () => void;
}

type TabName = "พื้นฐาน" | "เนื้อหา" | "SEO";

const categories = [
  "เทคนิคและคำแนะนำ",
  "การดูแลรักษา",
  "การติดตั้ง",
  "แนะนำผลิตภัณฑ์",
  "ข่าวสาร",
  "อื่นๆ",
];

export default function ArticleForm({ article, onSuccess }: ArticleFormProps) {
  const [currentTab, setCurrentTab] = useState<TabName>("พื้นฐาน");
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
    // SEO fields
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [] as string[],
    isPublished: false,
  });

  const [tagInput, setTagInput] = useState("");
  const [seoKeywordInput, setSeoKeywordInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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
        seoKeywords: article.seoKeywords || [],
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

  const tabs: TabName[] = ["พื้นฐาน", "เนื้อหา", "SEO"];

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
      {/* Goal Gradient: Progress Bar */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab, i) => {
          const tabIndex = tabs.indexOf(currentTab);
          const isCompleted = i < tabIndex;
          const isCurrent = i === tabIndex;

          return (
            <div
              key={tab}
              className={`h-1 flex-1 rounded transition-all duration-300 ${
                isCompleted || isCurrent ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>

      {/* Tab Navigation - Hick's Law: 3 options */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setCurrentTab(tab)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${currentTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Last Saved Indicator */}
      {lastSaved && (
        <div className="text-sm text-gray-500 text-right">
          บันทึกล่าสุด: {lastSaved.toLocaleTimeString('th-TH')}
        </div>
      )}

      {/* Tab 1: พื้นฐาน */}
      {currentTab === "พื้นฐาน" && (
        <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              หัวข้อบทความ <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="เช่น: 5 เทคนิคการเลือกกันสาดพับได้ที่เหมาะกับร้านอาหาร"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              สรุปย่อ (Excerpt) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.excerpt}
              onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="สรุปเนื้อหาบทความสั้นๆ 2-3 ประโยค"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">{formData.excerpt.length}/200 ตัวอักษร</p>
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              รูปหน้าปก
            </label>
            {formData.featured_image ? (
              <div className="space-y-2">
                <img
                  src={formData.featured_image}
                  alt="Featured"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, featured_image: "" }))}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  ลบรูป
                </button>
              </div>
            ) : (
              <ImageUpload
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

          {/* Category & Author */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ผู้เขียน
              </label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tags - Miller's Law: max 7 tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              แท็ก (Tags) <span className="text-xs text-gray-500">สูงสุด 7 แท็ก</span>
            </label>
            <div className="flex gap-2 mb-2">
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder="พิมพ์แท็กแล้วกด Enter"
                disabled={formData.tags.length >= 7}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={formData.tags.length >= 7}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Publish Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublished"
              checked={formData.isPublished}
              onChange={(e) => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
            />
            <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
              เผยแพร่ทันที
            </label>
          </div>
        </div>
      )}

      {/* Tab 2: เนื้อหา */}
      {currentTab === "เนื้อหา" && (
        <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เนื้อหาบทความ <span className="text-red-500">*</span>
            </label>
            <div className="text-xs text-gray-500 mb-2">
              รองรับ Markdown: **ตัวหนา**, *ตัวเอียง*, [ลิงก์](url)
            </div>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={20}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm"
              placeholder="เขียนเนื้อหาบทความที่นี่..."
            />
            {formData.read_time && (
              <p className="text-xs text-gray-500 mt-1">
                เวลาอ่าน: {formData.read_time} (คำนวณอัตโนมัติ)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: SEO */}
      {currentTab === "SEO" && (
        <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200">
          {/* SEO Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Title (หัวข้อสำหรับ SEO)
            </label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, seoTitle: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="ถ้าไม่ระบุจะใช้หัวข้อบทความ"
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.seoTitle.length}/60 ตัวอักษร (แนะนำ 50-60)
            </p>
          </div>

          {/* SEO Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Description (คำอธิบายสำหรับ SEO)
            </label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, seoDescription: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              placeholder="ถ้าไม่ระบุจะใช้สรุปย่อ"
              maxLength={160}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.seoDescription.length}/160 ตัวอักษร (แนะนำ 120-160)
            </p>
          </div>

          {/* SEO Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SEO Keywords (คำสำคัญสำหรับ SEO)
            </label>
            <div className="flex gap-2 mb-2">
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
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                placeholder='เช่น "กันสาดพับได้" (กด Enter เพื่อเพิ่ม)'
              />
              <button
                type="button"
                onClick={addSeoKeyword}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.seoKeywords.map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeSeoKeyword(keyword)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            {formData.seoKeywords.length === 0 && (
              <p className="text-xs text-amber-600 mt-2">
                💡 แนะนำให้เพิ่ม &quot;กันสาดพับได้&quot; เป็นคำสำคัญ SEO
              </p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL Slug
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent font-mono text-sm"
              placeholder="url-slug-here"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL จริง: /articles/{formData.slug || 'your-slug'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation & Submit */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex gap-2">
          {currentTab !== "พื้นฐาน" && (
            <button
              type="button"
              onClick={() => {
                const currentIndex = tabs.indexOf(currentTab);
                setCurrentTab(tabs[currentIndex - 1]);
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← ย้อนกลับ
            </button>
          )}
          {currentTab !== "SEO" && (
            <button
              type="button"
              onClick={() => {
                const currentIndex = tabs.indexOf(currentTab);
                setCurrentTab(tabs[currentIndex + 1]);
              }}
              className="px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              ต่อไป →
            </button>
          )}
        </div>

        {/* Fitts's Law: Large submit button */}
        <button
          type="submit"
          disabled={submitting}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {submitting ? 'กำลังบันทึก...' : article ? 'บันทึกการแก้ไข' : 'เผยแพร่บทความ'}
        </button>
      </div>
    </form>
  );
}
