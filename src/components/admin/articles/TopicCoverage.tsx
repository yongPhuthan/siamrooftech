"use client";

import { TopicCoverage as TopicCoverageType } from '../../../types/article';
import { getTopicCoverageLabel, getTopicCoverageColor } from '../../../lib/articles/topic-detector';

interface TopicCoverageProps {
  coverage: TopicCoverageType;
  compact?: boolean;
}

/**
 * Topic Coverage Component
 * Shows which important topics are covered in the article
 */
export default function TopicCoverage({ coverage, compact = false }: TopicCoverageProps) {
  const { topics, coverageScore, missingTopics, suggestions } = coverage;

  const label = getTopicCoverageLabel(coverageScore);
  const colorClass = getTopicCoverageColor(coverageScore);

  const topicList = [
    { key: 'pricing' as const, label: 'ราคา', icon: '💰' },
    { key: 'types' as const, label: 'ประเภท', icon: '📋' },
    { key: 'materials' as const, label: 'วัสดุ', icon: '🧵' },
    { key: 'installation' as const, label: 'การติดตั้ง', icon: '🔧' },
    { key: 'maintenance' as const, label: 'การดูแล', icon: '🧹' },
    { key: 'pros' as const, label: 'ข้อดี', icon: '✅' },
    { key: 'cons' as const, label: 'ข้อจำกัด', icon: '⚠️' },
    { key: 'faq' as const, label: 'FAQ', icon: '❓' },
  ];

  // Compact view for sidebar
  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">📚 ความครอบคลุม</h4>
          <span className={`text-sm font-semibold ${colorClass}`}>
            {coverageScore}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressBarColor(coverageScore)}`}
            style={{ width: `${coverageScore}%` }}
          />
        </div>

        {/* Topic Grid */}
        <div className="grid grid-cols-4 gap-2">
          {topicList.map((topic) => (
            <div
              key={topic.key}
              className={`flex flex-col items-center p-2 rounded-lg ${
                topics[topic.key]
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-gray-50 border border-gray-200 opacity-50'
              }`}
              title={topic.label}
            >
              <span className="text-lg">{topic.icon}</span>
              <span className="text-[10px] text-gray-600 mt-1 truncate w-full text-center">
                {topic.label}
              </span>
            </div>
          ))}
        </div>

        {/* Missing Topics */}
        {missingTopics.length > 0 && missingTopics.length <= 3 && (
          <div className="text-xs text-orange-600">
            <span className="font-medium">ยังไม่มี:</span> {missingTopics.join(', ')}
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">📚</span>
          ความครอบคลุมหัวข้อ
        </h3>
        <div className="text-right">
          <div className={`text-2xl font-bold ${colorClass}`}>
            {coverageScore}%
          </div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">ครอบคลุม {Object.values(topics).filter(Boolean).length}/8 หัวข้อ</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getProgressBarColor(coverageScore)}`}
            style={{ width: `${coverageScore}%` }}
          />
        </div>
      </div>

      {/* Topic List */}
      <div className="grid grid-cols-2 gap-3">
        {topicList.map((topic) => (
          <div
            key={topic.key}
            className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
              topics[topic.key]
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            <span className="text-2xl">{topic.icon}</span>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900">{topic.label}</div>
              <div className={`text-xs ${topics[topic.key] ? 'text-green-600' : 'text-gray-500'}`}>
                {topics[topic.key] ? '✓ มีแล้ว' : '○ ยังไม่มี'}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900">💡 คำแนะนำ:</p>
          <ul className="space-y-1">
            {suggestions.slice(0, 3).map((suggestion, i) => (
              <li key={i} className="text-xs text-blue-800 flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span className="flex-1">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-600 leading-relaxed">
          <strong>เกี่ยวกับความครอบคลุม:</strong> บทความที่ครอบคลุมหัวข้อสำคัญจะช่วยให้ติดอันดับการค้นหาได้ดีขึ้น
          เนื่องจากตอบโจทย์ผู้ใช้ได้หลากหลายมากขึ้น
        </p>
      </div>
    </div>
  );
}

/**
 * Get progress bar color
 */
function getProgressBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}
