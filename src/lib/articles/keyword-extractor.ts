/**
 * Keyword Extractor and Analysis
 * Extracts and analyzes keywords for SEO optimization
 */

import { KeywordAnalysis, PRIMARY_KEYWORD, SEO_LIMITS } from '../../types/article';

/**
 * Thai stop words (common words to exclude)
 */
const THAI_STOP_WORDS = new Set([
  'และ', 'ที่', 'ใน', 'ของ', 'เป็น', 'การ', 'ได้', 'มี', 'จะ', 'ไป', 'มา',
  'แล้ว', 'ให้', 'กับ', 'จาก', 'โดย', 'ซึ่ง', 'ถ้า', 'แต่', 'เพราะ', 'หรือ',
  'ว่า', 'นี้', 'นั้น', 'เหล่า', 'ทั้ง', 'ผล', 'ทำ', 'อยู่', 'นั่น', 'คือ',
  'อัน', 'ไว้', 'ถึง', 'ตาม', 'เมื่อ', 'ใช้', 'แห่ง', 'ตัว', 'ขึ้น', 'ลง',
]);

const ENGLISH_STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can',
  'of', 'to', 'in', 'for', 'with', 'from', 'by', 'about', 'into', 'through',
]);

/**
 * Extract words from text (Thai and English)
 */
function extractWords(text: string): string[] {
  if (!text) return [];

  // Convert to lowercase
  const lower = text.toLowerCase();

  // Extract Thai words (sequences of Thai characters)
  const thaiWords = lower.match(/[\u0E00-\u0E7F]+/g) || [];

  // Extract English words
  const englishWords = lower.match(/[a-z]+/g) || [];

  return [...thaiWords, ...englishWords];
}

/**
 * Filter stop words
 */
function filterStopWords(words: string[]): string[] {
  return words.filter(word => {
    if (word.length <= 2) return false;
    if (THAI_STOP_WORDS.has(word)) return false;
    if (ENGLISH_STOP_WORDS.has(word)) return false;
    return true;
  });
}

/**
 * Count word frequency
 */
function countFrequency(words: string[]): Map<string, number> {
  const freq = new Map<string, number>();

  words.forEach(word => {
    freq.set(word, (freq.get(word) || 0) + 1);
  });

  return freq;
}

/**
 * Extract top keywords from text
 */
export function extractKeywords(text: string, maxKeywords: number = SEO_LIMITS.KEYWORDS_MAX): string[] {
  if (!text) return [];

  // Extract and filter words
  const words = extractWords(text);
  const filtered = filterStopWords(words);

  // Count frequency
  const freq = countFrequency(filtered);

  // Sort by frequency
  const sorted = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);

  // Always include primary keyword if not in list
  if (!sorted.some(k => k.includes(PRIMARY_KEYWORD.toLowerCase().split(' ')[0]))) {
    sorted.unshift(PRIMARY_KEYWORD);
  }

  return sorted.slice(0, maxKeywords);
}

/**
 * Analyze keyword usage in content
 */
export function analyzeKeyword(content: string, keyword: string): KeywordAnalysis {
  if (!content || !keyword) {
    return {
      keyword,
      found: false,
      positions: {
        inTitle: false,
        inFirstParagraph: false,
        inHeadings: 0,
        inContent: 0,
      },
      density: 0,
      prominence: 0,
      suggestions: [],
      relatedKeywords: [],
    };
  }

  const lowerContent = content.toLowerCase();
  const lowerKeyword = keyword.toLowerCase();

  // Find all occurrences
  const regex = new RegExp(lowerKeyword.replace(/\s+/g, '\\s+'), 'gi');
  const matches = lowerContent.match(regex) || [];
  const totalOccurrences = matches.length;

  // Check positions
  const lines = content.split('\n');
  const firstLine = lines[0]?.toLowerCase() || '';
  const firstParagraph = content.split('\n\n')[0]?.toLowerCase() || '';

  const inTitle = firstLine.includes(lowerKeyword);
  const inFirstParagraph = firstParagraph.includes(lowerKeyword);

  // Count in headings
  const headingMatches = content.match(/^#{1,6}\s+.+$/gm) || [];
  const inHeadings = headingMatches.filter(h => h.toLowerCase().includes(lowerKeyword)).length;

  // Calculate density
  const words = extractWords(content);
  const density = words.length > 0 ? (totalOccurrences / words.length) * 100 : 0;

  // Calculate prominence score (0-100)
  let prominence = 0;
  if (inTitle) prominence += 30;
  if (inFirstParagraph) prominence += 20;
  if (inHeadings > 0) prominence += Math.min(20, inHeadings * 5);
  if (density >= SEO_LIMITS.OPTIMAL_KEYWORD_DENSITY) prominence += 20;
  if (density > 0 && density < SEO_LIMITS.MAX_KEYWORD_DENSITY) prominence += 10;

  // Generate suggestions
  const suggestions: string[] = [];

  if (!inTitle) {
    suggestions.push(`ลองเพิ่ม "${keyword}" ในหัวข้อหลัก (H1)`);
  }

  if (!inFirstParagraph) {
    suggestions.push(`ควรมี "${keyword}" ในย่อหน้าแรก`);
  }

  if (inHeadings === 0) {
    suggestions.push(`เพิ่ม "${keyword}" ในหัวข้อย่อย (H2 หรือ H3)`);
  }

  if (density === 0) {
    suggestions.push(`ไม่พบคีย์เวิร์ด "${keyword}" ในเนื้อหา - ควรเพิ่มเข้าไป`);
  } else if (density < 1) {
    suggestions.push(`ความหนาแน่นของคีย์เวิร์ดต่ำ (${density.toFixed(2)}%) - ควรเพิ่มให้ถึง 1-2%`);
  } else if (density > SEO_LIMITS.MAX_KEYWORD_DENSITY) {
    suggestions.push(`ความหนาแน่นของคีย์เวิร์ดสูงเกินไป (${density.toFixed(2)}%) - อาจถูกมองว่ายัดคีย์เวิร์ด`);
  }

  // Find related keywords (simple implementation)
  const relatedKeywords = findRelatedKeywords(keyword);

  return {
    keyword,
    found: totalOccurrences > 0,
    positions: {
      inTitle,
      inFirstParagraph,
      inHeadings,
      inContent: totalOccurrences,
    },
    density: Math.round(density * 100) / 100,
    prominence: Math.min(100, prominence),
    suggestions,
    relatedKeywords,
  };
}

/**
 * Find related keywords (synonyms and variations)
 */
function findRelatedKeywords(keyword: string): string[] {
  const related: { [key: string]: string[] } = {
    'กันสาดพับได้': [
      'กันสาดผ้าใบ',
      'กันสาดหน้าร้าน',
      'กันสาดระเบียง',
      'retractable awning',
      'กันสาดไฟฟ้า',
      'กันสาดมือหมุน',
    ],
    'ราคา': [
      'ค่าใช้จ่าย',
      'เท่าไหร่',
      'งบประมาณ',
      'ต้นทุน',
    ],
    'ติดตั้ง': [
      'การติดตั้ง',
      'วิธีติดตั้ง',
      'ขั้นตอนติดตั้ง',
      'installation',
    ],
    'ดูแล': [
      'บำรุงรักษา',
      'ทำความสะอาด',
      'การดูแล',
      'maintenance',
    ],
  };

  const lowerKeyword = keyword.toLowerCase();

  // Find exact match
  if (related[lowerKeyword]) {
    return related[lowerKeyword];
  }

  // Find partial match
  for (const [key, values] of Object.entries(related)) {
    if (lowerKeyword.includes(key) || key.includes(lowerKeyword)) {
      return values;
    }
  }

  return [];
}

/**
 * Suggest where to place keyword in content
 */
export function suggestKeywordPlacement(content: string, keyword: string): string[] {
  const suggestions: string[] = [];
  const analysis = analyzeKeyword(content, keyword);

  if (!analysis.positions.inTitle) {
    suggestions.push(`แนะนำ: เพิ่ม "${keyword}" ในหัวข้อหลัก เช่น: "${keyword}: คู่มือฉบับสมบูรณ์"`);
  }

  if (!analysis.positions.inFirstParagraph) {
    const firstPara = content.split('\n\n')[0] || '';
    if (firstPara.length > 0) {
      suggestions.push(`แนะนำ: เพิ่ม "${keyword}" ในย่อหน้าแรก เช่น: "เมื่อพูดถึง${keyword}..."`);
    }
  }

  // Check for headings without keyword
  const headings = content.match(/^#{2,3}\s+.+$/gm) || [];
  const headingsWithoutKeyword = headings.filter(h => !h.toLowerCase().includes(keyword.toLowerCase()));

  if (headingsWithoutKeyword.length > 0 && analysis.positions.inHeadings < 2) {
    const firstHeading = headingsWithoutKeyword[0];
    suggestions.push(`แนะนำ: เพิ่ม "${keyword}" ในหัวข้อย่อย เช่น: "## ประเภทของ${keyword}"`);
  }

  // Suggest image alt text
  const images = content.match(/!\[([^\]]*)\]/g) || [];
  if (images.length > 0) {
    const imagesWithoutKeyword = images.filter(img => !img.toLowerCase().includes(keyword.toLowerCase()));
    if (imagesWithoutKeyword.length > 0) {
      suggestions.push(`แนะนำ: เพิ่ม "${keyword}" ใน alt text ของรูปภาพ เช่น: "![${keyword}ติดผนังคอนกรีต](...)"`);
    }
  }

  return suggestions;
}

/**
 * Generate keyword-optimized title suggestions
 */
export function generateTitleSuggestions(topic: string, keyword: string = PRIMARY_KEYWORD): string[] {
  return [
    `${keyword}: ${topic}`,
    `คู่มือเลือก${keyword} - ${topic}`,
    `5 เทคนิค${topic}สำหรับ${keyword}`,
    `${topic} | ${keyword} ราคาถูก คุณภาพดี`,
    `วิธี${topic}ด้วย${keyword} แบบมืออาชีพ`,
    `${keyword} ${topic} - แนะนำทุกอย่างที่ต้องรู้`,
  ];
}

/**
 * Check if content has good keyword distribution
 */
export function hasGoodKeywordDistribution(content: string, keyword: string): boolean {
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length === 0) return false;

  const lowerKeyword = keyword.toLowerCase();
  let paragraphsWithKeyword = 0;

  paragraphs.forEach(para => {
    if (para.toLowerCase().includes(lowerKeyword)) {
      paragraphsWithKeyword++;
    }
  });

  // Good distribution: keyword appears in 20-50% of paragraphs
  const percentage = (paragraphsWithKeyword / paragraphs.length) * 100;
  return percentage >= 20 && percentage <= 50;
}
