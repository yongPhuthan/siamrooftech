"use client";

import { SerpPreviewData, SEO_LIMITS } from '../../../types/article';

interface SerpPreviewProps {
  title: string;
  seoTitle?: string;
  excerpt: string;
  seoDescription?: string;
  slug: string;
  baseUrl?: string;
}

/**
 * SERP Preview Component
 * Shows how the article will appear in Google search results
 * Follows Laws of UX: Aesthetic-Usability Effect, Jakob's Law (familiar Google UI)
 */
export default function SerpPreview({
  title,
  seoTitle,
  excerpt,
  seoDescription,
  slug,
  baseUrl = 'siamrooftech.com'
}: SerpPreviewProps) {
  // Use seoTitle/seoDescription if available, fallback to title/excerpt
  const displayTitle = seoTitle || title || 'ไม่มีหัวข้อ';
  const displayDescription = seoDescription || excerpt || 'ไม่มีคำอธิบาย';

  // Truncate if too long
  const isTitleTruncated = displayTitle.length > SEO_LIMITS.TITLE_MAX;
  const isDescriptionTruncated = displayDescription.length > SEO_LIMITS.DESCRIPTION_MAX;

  const truncatedTitle = isTitleTruncated
    ? displayTitle.substring(0, SEO_LIMITS.TITLE_MAX - 3) + '...'
    : displayTitle;

  const truncatedDescription = isDescriptionTruncated
    ? displayDescription.substring(0, SEO_LIMITS.DESCRIPTION_MAX - 3) + '...'
    : displayDescription;

  const fullUrl = `${baseUrl}/articles/${slug || 'your-article'}`;

  const titleLength = displayTitle.length;
  const descriptionLength = displayDescription.length;

  // Calculate status
  const titleStatus = getTitleStatus(titleLength);
  const descriptionStatus = getDescriptionStatus(descriptionLength);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          แสดงในผลค้นหา Google
        </h3>
        <span className="text-xs text-gray-500">ตัวอย่าง SERP</span>
      </div>

      {/* Google Search Result Preview */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-1">
        {/* URL */}
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-[10px] font-bold">S</span>
          </div>
          <div className="text-gray-700 truncate font-normal">
            {fullUrl}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-blue-600 text-xl font-normal hover:underline cursor-pointer leading-snug">
          {truncatedTitle}
        </h4>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {truncatedDescription}
        </p>
      </div>

      {/* Stats and Warnings */}
      <div className="grid grid-cols-2 gap-4">
        {/* Title Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">หัวข้อ</span>
            <span className={`font-medium ${titleStatus.color}`}>
              {titleLength}/{SEO_LIMITS.TITLE_MAX}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${titleStatus.bgColor}`}
              style={{ width: `${Math.min(100, (titleLength / SEO_LIMITS.TITLE_OPTIMAL) * 100)}%` }}
            />
          </div>
          {titleStatus.message && (
            <p className={`text-xs ${titleStatus.color}`}>
              {titleStatus.icon} {titleStatus.message}
            </p>
          )}
        </div>

        {/* Description Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">คำอธิบาย</span>
            <span className={`font-medium ${descriptionStatus.color}`}>
              {descriptionLength}/{SEO_LIMITS.DESCRIPTION_MAX}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${descriptionStatus.bgColor}`}
              style={{ width: `${Math.min(100, (descriptionLength / SEO_LIMITS.DESCRIPTION_OPTIMAL) * 100)}%` }}
            />
          </div>
          {descriptionStatus.message && (
            <p className={`text-xs ${descriptionStatus.color}`}>
              {descriptionStatus.icon} {descriptionStatus.message}
            </p>
          )}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
        <p className="text-xs text-blue-800">
          <strong>💡 เคล็ดลับ:</strong> หัวข้อ {SEO_LIMITS.TITLE_MIN}-{SEO_LIMITS.TITLE_OPTIMAL} ตัวอักษร
          และคำอธิบาย {SEO_LIMITS.DESCRIPTION_MIN}-{SEO_LIMITS.DESCRIPTION_OPTIMAL} ตัวอักษร
          จะแสดงผลได้ดีที่สุดในผลค้นหา
        </p>
      </div>
    </div>
  );
}

/**
 * Get title status
 */
function getTitleStatus(length: number): {
  color: string;
  bgColor: string;
  icon: string;
  message?: string;
} {
  if (length === 0) {
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      icon: '❌',
      message: 'ยังไม่มีหัวข้อ',
    };
  }

  if (length < SEO_LIMITS.TITLE_MIN) {
    return {
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      icon: '⚠️',
      message: 'สั้นเกินไป',
    };
  }

  if (length <= SEO_LIMITS.TITLE_OPTIMAL) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      icon: '✅',
      message: 'ความยาวเหมาะสม',
    };
  }

  if (length <= SEO_LIMITS.TITLE_MAX) {
    return {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      icon: '⚠️',
      message: 'ใช้ได้แต่ยาวไปนิด',
    };
  }

  return {
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    icon: '❌',
    message: 'ยาวเกินไป จะถูกตัด',
  };
}

/**
 * Get description status
 */
function getDescriptionStatus(length: number): {
  color: string;
  bgColor: string;
  icon: string;
  message?: string;
} {
  if (length === 0) {
    return {
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      icon: '❌',
      message: 'ยังไม่มีคำอธิบาย',
    };
  }

  if (length < SEO_LIMITS.DESCRIPTION_MIN) {
    return {
      color: 'text-orange-600',
      bgColor: 'bg-orange-500',
      icon: '⚠️',
      message: 'สั้นเกินไป',
    };
  }

  if (length <= SEO_LIMITS.DESCRIPTION_OPTIMAL) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      icon: '✅',
      message: 'ความยาวเหมาะสม',
    };
  }

  if (length <= SEO_LIMITS.DESCRIPTION_MAX) {
    return {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-500',
      icon: '⚠️',
      message: 'ใช้ได้แต่ยาวไปนิด',
    };
  }

  return {
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    icon: '❌',
    message: 'ยาวเกินไป จะถูกตัด',
  };
}
