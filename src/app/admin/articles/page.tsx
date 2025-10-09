"use client";

import { useState, useEffect } from "react";
import { Article } from "../../../lib/firestore";
import ArticlesList from "../../../components/admin/ArticlesList";
import ArticleForm from "../../../components/admin/ArticleForm";

type TabFilter = "ทั้งหมด" | "เผยแพร่" | "ฉบับร่าง";

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>("ทั้งหมด");

  const fetchArticles = async () => {
    try {
      console.log('🔄 Fetching articles from /api/articles');

      // Admin request - include drafts
      const response = await fetch('/api/articles?includeDrafts=true');
      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Articles data:', data);

        const articlesData = Array.isArray(data) ? data : [];
        console.log('📋 Number of articles:', articlesData.length);

        setArticles(articlesData);
      } else {
        console.error('❌ API response not ok:', response.status, await response.text());
        setArticles([]);
      }
    } catch (error) {
      console.error('❌ Error fetching articles:', error);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setShowForm(true);
  };

  const handleDelete = async (article: Article) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบบทความ "${article.title}"?`)) {
      try {
        const response = await fetch(`/api/articles/${article.slug}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setArticles(articles.filter(a => a.id !== article.id));
          alert('ลบบทความสำเร็จ');
        } else {
          alert('เกิดข้อผิดพลาดในการลบบทความ');
        }
      } catch (error) {
        console.error('Error deleting article:', error);
        alert('เกิดข้อผิดพลาดในการลบบทความ');
      }
    }
  };

  const handleTogglePublish = async (article: Article) => {
    try {
      const newStatus = !article.isPublished;
      const response = await fetch(`/api/articles/${article.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setArticles(articles.map(a =>
          a.id === article.id ? { ...a, isPublished: newStatus } : a
        ));
        alert(`${newStatus ? 'เผยแพร่' : 'ยกเลิกเผยแพร่'}บทความสำเร็จ`);
      } else {
        alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingArticle(null);
    fetchArticles();
  };

  const handleNewArticle = () => {
    setEditingArticle(null);
    setShowForm(true);
  };

  // Filter articles based on active tab
  const filteredArticles = articles.filter(article => {
    if (activeTab === "เผยแพร่") return article.isPublished === true;
    if (activeTab === "ฉบับร่าง") return article.isPublished === false;
    return true; // ทั้งหมด
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        {/* Form Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {editingArticle ? 'แก้ไขบทความ' : 'เพิ่มบทความใหม่'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {editingArticle ? 'แก้ไขข้อมูลบทความที่มีอยู่' : 'เพิ่มบทความใหม่เข้าสู่ระบบ'}
            </p>
          </div>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingArticle(null);
            }}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100 shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            ยกเลิก
          </button>
        </div>

        <ArticleForm
          article={editingArticle}
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">จัดการบทความ</h1>
          <p className="mt-1 text-sm text-gray-500">
            แก้ไข เพิ่ม หรือลบบทความในระบบ
          </p>
        </div>
        <button
          onClick={handleNewArticle}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors active:bg-blue-800 shadow-sm"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          เพิ่มบทความใหม่
        </button>
      </div>

      {/* Tab Filters - Hick's Law: 3 options only */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['ทั้งหมด', 'เผยแพร่', 'ฉบับร่าง'] as TabFilter[]).map((tab) => {
            const count = tab === 'ทั้งหมด'
              ? articles.length
              : tab === 'เผยแพร่'
              ? articles.filter(a => a.isPublished === true).length
              : articles.filter(a => a.isPublished === false).length;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab}
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-semibold
                  ${activeTab === tab ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                `}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีบทความ</h3>
          <p className="mt-1 text-sm text-gray-500">
            เริ่มต้นสร้างบทความใหม่ได้เลย
          </p>
        </div>
      ) : (
        <ArticlesList
          articles={filteredArticles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onTogglePublish={handleTogglePublish}
        />
      )}

      {/* Mobile FAB - Fitts's Law: Large touch target at reachable position */}
      <button
        onClick={handleNewArticle}
        className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center"
        aria-label="เพิ่มบทความใหม่"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>
  );
}
