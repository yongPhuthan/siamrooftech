"use client";

import { ContentAnalysis } from '../../../types/article';
import { getReadabilityLabel, getReadabilityColor } from '../../../lib/articles/readability';

interface ReadabilityScoreProps {
  analysis: ContentAnalysis;
  compact?: boolean;
}

/**
 * Readability Score Component
 * Displays content readability metrics
 */
export default function ReadabilityScore({ analysis, compact = false }: ReadabilityScoreProps) {
  const { readabilityScore, wordCount, sentenceCount, avgWordsPerSentence } = analysis;

  const label = getReadabilityLabel(readabilityScore);
  const colorClass = getReadabilityColor(readabilityScore);

  // Compact view for sidebar
  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-sm text-gray-700">อ่านง่าย</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className={`text-sm font-semibold ${colorClass}`}>
              {readabilityScore}/100
            </div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
          {getScoreEmoji(readabilityScore)}
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          ความอ่านง่าย
        </h3>
        <span className={`text-2xl font-bold ${colorClass}`}>
          {readabilityScore}
          <span className="text-sm text-gray-500">/100</span>
        </span>
      </div>

      {/* Score Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">ระดับ: <span className={`font-medium ${colorClass}`}>{label}</span></span>
          <span className="text-2xl">{getScoreEmoji(readabilityScore)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getScoreBarColor(readabilityScore)}`}
            style={{ width: `${readabilityScore}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{wordCount}</div>
          <div className="text-xs text-gray-500">คำ</div>
        </div>
        <div className="text-center border-l border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{sentenceCount}</div>
          <div className="text-xs text-gray-500">ประโยค</div>
        </div>
        <div className="text-center border-l border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{avgWordsPerSentence.toFixed(1)}</div>
          <div className="text-xs text-gray-500">คำ/ประโยค</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
        <p className="text-xs text-purple-800 leading-relaxed">
          {getRecommendation(avgWordsPerSentence)}
        </p>
      </div>
    </div>
  );
}

/**
 * Get emoji for score
 */
function getScoreEmoji(score: number): string {
  if (score >= 80) return '🎉';
  if (score >= 60) return '😊';
  if (score >= 40) return '😐';
  if (score >= 20) return '😕';
  return '😰';
}

/**
 * Get score bar color
 */
function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * Get recommendation based on avg words per sentence
 */
function getRecommendation(avgWords: number): string {
  if (avgWords > 30) {
    return '💡 ประโยคยาวเกินไป ควรแบ่งเป็นประโยคสั้นๆ (15-20 คำ) เพื่อให้อ่านง่ายขึ้น';
  }
  if (avgWords < 5) {
    return '💡 ประโยคสั้นเกินไป ลองรวมประโยคที่เกี่ยวข้องกันเพื่อให้ลื่นไหลขึ้น';
  }
  if (avgWords >= 15 && avgWords <= 20) {
    return '✅ ยอดเยี่ยม! ความยาวประโยคเหมาะสมสำหรับการอ่าน';
  }
  return '👍 ดีแล้ว! ความยาวประโยคอยู่ในเกณฑ์ที่อ่านง่าย';
}
