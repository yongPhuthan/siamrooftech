"use client";

import { useEffect, useState } from 'react';
import { ArticleExtended } from '../../../types/article';
import { analyzeSEO, getSeoStatusLabel, getSeoStatusColor } from '../../../lib/articles/seo-analyzer';
import SerpPreview from './SerpPreview';
import ReadabilityScore from './ReadabilityScore';
import PublishChecklist from './PublishChecklist';
import TopicCoverage from './TopicCoverage';

interface SeoPanelProps {
  article: Partial<ArticleExtended>;
  onAutoFix?: (field: string, value: string) => void;
}

/**
 * SEO Panel Component
 * Main panel showing all SEO metrics and suggestions
 * Combines all SEO components in one view
 */
export default function SeoPanel({ article, onAutoFix }: SeoPanelProps) {
  const [analyzedArticle, setAnalyzedArticle] = useState<ArticleExtended | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'preview'>('overview');

  // Auto-analyze when article content changes
  useEffect(() => {
    const analyzeContent = async () => {
      if (!article.title && !article.content) {
        setAnalyzedArticle(null);
        return;
      }

      setIsAnalyzing(true);
      try {
        const result = await analyzeSEO(article);
        setAnalyzedArticle(result);
      } catch (error) {
        console.error('Error analyzing SEO:', error);
      } finally {
        setIsAnalyzing(false);
      }
    };

    // Debounce analysis (wait 500ms after last change)
    const timeoutId = setTimeout(analyzeContent, 500);
    return () => clearTimeout(timeoutId);
  }, [article.title, article.content, article.excerpt, article.slug, article.seoTitle, article.seoDescription]);

  if (isAnalyzing && !analyzedArticle) {
    return (
      <div className="sticky top-6 bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">กำลังวิเคราะห์ SEO...</span>
        </div>
      </div>
    );
  }

  if (!analyzedArticle || !analyzedArticle.seoReadiness) {
    return (
      <div className="sticky top-6 bg-white border border-gray-200 rounded-xl p-6">
        <p className="text-sm text-gray-500 text-center">
          เริ่มเขียนเนื้อหาเพื่อดูการวิเคราะห์ SEO
        </p>
      </div>
    );
  }

  const { seoReadiness, contentAnalysis, topicCoverage } = analyzedArticle;
  const score = seoReadiness.score;
  const statusLabel = getSeoStatusLabel(score);
  const statusColor = getSeoStatusColor(score);

  return (
    <div className="sticky top-6 space-y-4">
      {/* Main Score Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {/* Score Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">คะแนน SEO</h3>
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Circular Score */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            {/* Background circle */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - score / 100)}`}
                className={getScoreCircleColor(score)}
                strokeLinecap="round"
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreTextColor(score)}`}>
                {score}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {contentAnalysis?.wordCount || 0}
            </div>
            <div className="text-xs text-gray-500">คำ</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {topicCoverage?.coverageScore || 0}%
            </div>
            <div className="text-xs text-gray-500">ครอบคลุม</div>
          </div>
        </div>

        {/* Tabs - Hick's Law: Limited choices */}
        <div className="flex gap-2 border-b border-gray-200">
          {['overview', 'checklist', 'preview'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 px-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' && '📊 ภาพรวม'}
              {tab === 'checklist' && '✅ เช็กลิสต์'}
              {tab === 'preview' && '🔍 พรีวิว'}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Readability */}
          {contentAnalysis && (
            <ReadabilityScore analysis={contentAnalysis} compact />
          )}

          {/* Topic Coverage */}
          {topicCoverage && (
            <TopicCoverage coverage={topicCoverage} compact />
          )}

          {/* Top Suggestions */}
          {seoReadiness.suggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">💡 คำแนะนำ</h4>
              <ul className="space-y-2">
                {seoReadiness.suggestions.slice(0, 3).map((suggestion, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span className="flex-1">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {activeTab === 'checklist' && (
        <PublishChecklist article={analyzedArticle} />
      )}

      {activeTab === 'preview' && (
        <SerpPreview
          title={article.title || ''}
          seoTitle={article.seoTitle}
          excerpt={article.excerpt || ''}
          seoDescription={article.seoDescription}
          slug={article.slug || ''}
        />
      )}
    </div>
  );
}

/**
 * Get score circle color
 */
function getScoreCircleColor(score: number): string {
  if (score >= 90) return 'text-green-500';
  if (score >= 70) return 'text-blue-500';
  if (score >= 50) return 'text-yellow-500';
  if (score >= 30) return 'text-orange-500';
  return 'text-red-500';
}

/**
 * Get score text color
 */
function getScoreTextColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 30) return 'text-orange-600';
  return 'text-red-600';
}
