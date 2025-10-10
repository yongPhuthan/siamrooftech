"use client";

import { ArticleExtended, PublishChecklist as ChecklistType } from '../../../types/article';
import { isReadyToPublish } from '../../../lib/articles/seo-analyzer';

interface PublishChecklistProps {
  article: ArticleExtended;
  onFix?: (checkId: string) => void;
}

/**
 * Publish Checklist Component
 * Pre-publish validation checklist with auto-fix capabilities
 * Follows Laws of UX: Goal Gradient Effect (progress), Fitts's Law (large fix buttons)
 */
export default function PublishChecklist({ article, onFix }: PublishChecklistProps) {
  if (!article.seoReadiness) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <p className="text-sm text-yellow-800">
          กำลังวิเคราะห์... กรุณารอสักครู่
        </p>
      </div>
    );
  }

  const { checks, score, criticalIssues, warnings } = article.seoReadiness;

  const readyToPublish = isReadyToPublish(article);

  // Build checklist items
  const checklistItems = [
    {
      id: 'title',
      label: 'มีหัวข้อที่เหมาะสมสำหรับ SEO',
      status: checks.titleOptimal,
      severity: 'critical' as const,
    },
    {
      id: 'description',
      label: 'มีคำอธิบายที่เหมาะสมสำหรับ SEO',
      status: checks.descriptionOptimal,
      severity: 'critical' as const,
    },
    {
      id: 'keyword-title',
      label: 'มีคีย์เวิร์ดในหัวข้อ',
      status: checks.keywordInTitle,
      severity: 'critical' as const,
    },
    {
      id: 'keyword-first',
      label: 'มีคีย์เวิร์ดในย่อหน้าแรก',
      status: checks.keywordInFirstParagraph,
      severity: 'recommended' as const,
    },
    {
      id: 'keyword-headings',
      label: 'มีคีย์เวิร์ดในหัวข้อย่อย',
      status: checks.keywordInHeadings,
      severity: 'recommended' as const,
    },
    {
      id: 'internal-links',
      label: 'มีลิงก์ภายในอย่างน้อย 2 ลิงก์',
      status: checks.hasInternalLinks,
      severity: 'recommended' as const,
    },
    {
      id: 'image-alt',
      label: 'รูปภาพทุกรูปมี alt text',
      status: checks.allImagesHaveAlt,
      severity: 'critical' as const,
    },
    {
      id: 'slug',
      label: 'URL slug เหมาะสมสำหรับ SEO',
      status: checks.slugOptimal,
      severity: 'critical' as const,
    },
    {
      id: 'readability',
      label: 'เนื้อหาอ่านง่าย (คะแนน ≥ 60)',
      status: checks.readabilityGood,
      severity: 'recommended' as const,
    },
    {
      id: 'duplicate',
      label: 'ไม่ซ้ำกับบทความอื่น',
      status: checks.noDuplicateTitle,
      severity: 'critical' as const,
    },
  ];

  const critical = checklistItems.filter(item => item.severity === 'critical');
  const recommended = checklistItems.filter(item => item.severity === 'recommended');

  const criticalPassed = critical.filter(item => item.status).length;
  const recommendedPassed = recommended.filter(item => item.status).length;

  const overallPercentage = Math.round(
    ((criticalPassed + recommendedPassed) / checklistItems.length) * 100
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            เช็กลิสต์ก่อนเผยแพร่
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            ตรวจสอบความพร้อมสำหรับ SEO
          </p>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <div className="text-xs text-gray-500">คะแนน SEO</div>
        </div>
      </div>

      {/* Overall Progress - Goal Gradient Effect */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">ความพร้อมโดยรวม</span>
          <span className={`font-semibold ${getScoreColor(overallPercentage)}`}>
            {overallPercentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${getProgressBarColor(overallPercentage)}`}
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>

      {/* Status Banner */}
      {readyToPublish ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900">พร้อมเผยแพร่!</p>
            <p className="text-xs text-green-700">บทความผ่านเกณฑ์ SEO แล้ว</p>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <span className="text-3xl">⚠️</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-yellow-900">ยังไม่พร้อมเผยแพร่</p>
            <p className="text-xs text-yellow-700">
              พบปัญหา {criticalIssues.length} รายการที่ต้องแก้ไข
            </p>
          </div>
        </div>
      )}

      {/* Critical Checks */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500"></div>
          <h4 className="text-sm font-semibold text-gray-900">
            เกณฑ์สำคัญ ({criticalPassed}/{critical.length})
          </h4>
        </div>
        <div className="space-y-2">
          {critical.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onFix={onFix}
            />
          ))}
        </div>
      </div>

      {/* Recommended Checks */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <h4 className="text-sm font-semibold text-gray-900">
            แนะนำ ({recommendedPassed}/{recommended.length})
          </h4>
        </div>
        <div className="space-y-2">
          {recommended.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              onFix={onFix}
            />
          ))}
        </div>
      </div>

      {/* Critical Issues List */}
      {criticalIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-red-900">🚫 ปัญหาสำคัญที่ต้องแก้ไข:</p>
          <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
            {criticalIssues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-semibold text-yellow-900">⚠️ ข้อควรปรับปรุง:</p>
          <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
            {warnings.slice(0, 3).map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Checklist Item Component
 */
function ChecklistItem({
  item,
  onFix,
}: {
  item: { id: string; label: string; status: boolean; severity: 'critical' | 'recommended' };
  onFix?: (checkId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {item.status ? (
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : (
          <div className={`w-6 h-6 rounded-full ${
            item.severity === 'critical' ? 'bg-red-100' : 'bg-yellow-100'
          } flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${
              item.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex-1 text-sm text-gray-700">
        {item.label}
      </div>

      {/* Fix Button - Fitts's Law: Large touch target */}
      {!item.status && onFix && (
        <button
          onClick={() => onFix(item.id)}
          className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
        >
          แก้ไข
        </button>
      )}
    </div>
  );
}

/**
 * Get score color
 */
function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 70) return 'text-blue-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 30) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get progress bar color
 */
function getProgressBarColor(percentage: number): string {
  if (percentage >= 90) return 'bg-green-500';
  if (percentage >= 70) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}
