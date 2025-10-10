/**
 * Topic Coverage Detector
 * Detects coverage of important topics for "กันสาดพับได้"
 */

import { TopicCoverage, TOPIC_COVERAGE_KEYWORDS } from '../../types/article';

/**
 * Check if content covers a specific topic
 */
function checkTopicCoverage(content: string, keywords: ReadonlyArray<string>): boolean {
  if (!content || keywords.length === 0) return false;

  const lowerContent = content.toLowerCase();

  // Topic is covered if at least one keyword is found
  return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
}

/**
 * Detect all topic coverage
 */
export function detectTopicCoverage(content: string): TopicCoverage {
  if (!content) {
    return {
      topics: {
        pricing: false,
        types: false,
        materials: false,
        installation: false,
        maintenance: false,
        pros: false,
        cons: false,
        faq: false,
      },
      coverageScore: 0,
      missingTopics: [],
      suggestions: [],
    };
  }

  const topics = {
    pricing: checkTopicCoverage(content, TOPIC_COVERAGE_KEYWORDS.pricing),
    types: checkTopicCoverage(content, TOPIC_COVERAGE_KEYWORDS.types),
    materials: checkTopicCoverage(content, TOPIC_COVERAGE_KEYWORDS.materials),
    installation: checkTopicCoverage(content, TOPIC_COVERAGE_KEYWORDS.installation),
    maintenance: checkTopicCoverage(content, TOPIC_COVERAGE_KEYWORDS.maintenance),
    pros: checkTopicCoverage(content, TOPIC_COVERAGE_KEYWORDS.pros),
    cons: checkTopicCoverage(content, TOPIC_COVERAGE_KEYWORDS.cons),
    faq: checkTopicCoverage(content, TOPIC_COVERAGE_KEYWORDS.faq),
  };

  // Calculate coverage score
  const topicKeys = Object.keys(topics) as (keyof typeof topics)[];
  const coveredCount = topicKeys.filter(key => topics[key]).length;
  const coverageScore = Math.round((coveredCount / topicKeys.length) * 100);

  // Generate missing topics list
  const topicLabels: { [K in keyof typeof topics]: string } = {
    pricing: 'ราคา',
    types: 'ประเภท',
    materials: 'วัสดุ',
    installation: 'การติดตั้ง',
    maintenance: 'การดูแลรักษา',
    pros: 'ข้อดี/ประโยชน์',
    cons: 'ข้อจำกัด/ข้อเสีย',
    faq: 'คำถามที่พบบ่อย',
  };

  const missingTopics = topicKeys
    .filter(key => !topics[key])
    .map(key => topicLabels[key]);

  // Generate suggestions
  const suggestions = generateTopicSuggestions(topics, content);

  return {
    topics,
    coverageScore,
    missingTopics,
    suggestions,
  };
}

/**
 * Generate suggestions for missing topics
 */
function generateTopicSuggestions(
  topics: TopicCoverage['topics'],
  content: string
): string[] {
  const suggestions: string[] = [];

  if (!topics.pricing) {
    suggestions.push('ลองเพิ่มหัวข้อ "ราคากันสาดพับได้" หรือ "งบประมาณที่ควรเตรียม"');
  }

  if (!topics.types) {
    suggestions.push('ควรเพิ่มส่วน "ประเภทของกันสาดพับได้" เช่น ผ้าใบ, อะลูมิเนียม, มือหมุน, ไฟฟ้า');
  }

  if (!topics.materials) {
    suggestions.push('แนะนำให้เพิ่มข้อมูลเกี่ยวกับวัสดุและคุณภาพของผ้าใบและโครงสร้าง');
  }

  if (!topics.installation) {
    suggestions.push('เพิ่มส่วน "วิธีการติดตั้ง" หรือ "ขั้นตอนการติดตั้งกันสาดพับได้"');
  }

  if (!topics.maintenance) {
    suggestions.push('ควรมีคำแนะนำเรื่อง "การดูแลรักษา" หรือ "วิธีทำความสะอาดกันสาดพับได้"');
  }

  if (!topics.pros) {
    suggestions.push('เพิ่มส่วน "ข้อดี" หรือ "ประโยชน์ของกันสาดพับได้"');
  }

  if (!topics.cons) {
    suggestions.push('ควรระบุ "ข้อจำกัด" หรือ "สิ่งที่ควรพิจารณา" เพื่อความน่าเชื่อถือ');
  }

  if (!topics.faq) {
    suggestions.push('เพิ่มส่วน "คำถามที่พบบ่อย (FAQ)" เพื่อครอบคลุมข้อสงสัยของผู้อ่าน');
  }

  // Additional contextual suggestions
  const hasHeadings = /^#{2,3}\s+/m.test(content);
  if (!hasHeadings && suggestions.length > 0) {
    suggestions.push('💡 เริ่มต้นด้วยการเพิ่มหัวข้อย่อย (## หรือ ###) เพื่อแบ่งเนื้อหา');
  }

  return suggestions;
}

/**
 * Get topic coverage level label
 */
export function getTopicCoverageLabel(score: number): string {
  if (score >= 80) return 'ครอบคลุมดีเยี่ยม';
  if (score >= 60) return 'ครอบคลุมดี';
  if (score >= 40) return 'ครอบคลุมพอใช้';
  if (score >= 20) return 'ครอบคลุมน้อย';
  return 'ควรเพิ่มเนื้อหา';
}

/**
 * Get topic coverage color for UI
 */
export function getTopicCoverageColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get recommended topics based on article category
 */
export function getRecommendedTopics(category: string): string[] {
  const recommendations: { [key: string]: string[] } = {
    'เทคนิคและคำแนะนำ': [
      'ควรครอบคลุม: ประเภท, วัสดุ, ข้อดี-ข้อเสีย',
      'แนะนำเพิ่ม FAQ สำหรับข้อสงสัยทั่วไป',
    ],
    'การดูแลรักษา': [
      'ควรครอบคลุม: การดูแล, วัสดุ, ข้อควรระวัง',
      'เพิ่มคำแนะนำการทำความสะอาดตามประเภทวัสดุ',
    ],
    'การติดตั้ง': [
      'ควรครอบคลุม: วิธีติดตั้ง, วัสดุ, ขั้นตอน',
      'แนะนำเพิ่มรูปภาพประกอบแต่ละขั้นตอน',
    ],
    'แนะนำผลิตภัณฑ์': [
      'ควรครอบคลุม: ประเภท, ราคา, ข้อดี-ข้อเสีย',
      'เพิ่มข้อมูลเปรียบเทียบกับคู่แข่ง',
    ],
  };

  return recommendations[category] || [
    'ครอบคลุมหัวข้อสำคัญอย่างน้อย 5 จาก 8 หัวข้อ',
  ];
}

/**
 * Check if content is comprehensive enough for SEO
 */
export function isContentComprehensive(coverage: TopicCoverage, wordCount: number): boolean {
  // Need at least 50% topic coverage and 300+ words
  return coverage.coverageScore >= 50 && wordCount >= 300;
}

/**
 * Generate heading suggestions based on missing topics
 */
export function generateHeadingSuggestions(missingTopics: string[]): string[] {
  const headingSuggestions: { [key: string]: string } = {
    'ราคา': '## ราคากันสาดพับได้แต่ละประเภท',
    'ประเภท': '## ประเภทของกันสาดพับได้',
    'วัสดุ': '## วัสดุและคุณภาพกันสาดพับได้',
    'การติดตั้ง': '## วิธีการติดตั้งกันสาดพับได้',
    'การดูแลรักษา': '## การดูแลและบำรุงรักษากันสาดพับได้',
    'ข้อดี/ประโยชน์': '## ข้อดีของกันสาดพับได้',
    'ข้อจำกัด/ข้อเสีย': '## ข้อควรพิจารณาก่อนเลือก',
    'คำถามที่พบบ่อย': '## คำถามที่พบบ่อย (FAQ)',
  };

  return missingTopics
    .map(topic => headingSuggestions[topic])
    .filter(Boolean);
}
