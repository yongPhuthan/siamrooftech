/**
 * Readability Score Calculator
 * Adapted for Thai language content
 */

import { ContentAnalysis, READABILITY_THRESHOLDS } from '../../types/article';

/**
 * Count words in Thai/English text
 */
function countWords(text: string): number {
  if (!text) return 0;

  // For Thai: count by spaces and Thai word boundaries
  // For English: count by spaces
  const thaiWords = text.match(/[\u0E00-\u0E7F]+/g) || [];
  const englishWords = text.match(/[a-zA-Z]+/g) || [];

  // Thai doesn't use spaces between words, so estimate
  // Average Thai word is ~3-4 characters
  const estimatedThaiWords = thaiWords.reduce((sum, word) => {
    return sum + Math.ceil(word.length / 3.5);
  }, 0);

  return estimatedThaiWords + englishWords.length;
}

/**
 * Count sentences in text
 */
function countSentences(text: string): number {
  if (!text) return 0;

  // Split by sentence terminators: . ! ? and Thai sentence terminator (implicit)
  // Thai often uses spaces or line breaks as sentence boundaries
  const sentences = text
    .split(/[.!?।]+|\n+/)
    .filter(s => s.trim().length > 0);

  return Math.max(1, sentences.length);
}

/**
 * Extract heading structure from markdown
 */
function extractHeadings(content: string): string[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings: string[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    headings.push(`H${level}: ${text}`);
  }

  return headings;
}

/**
 * Count internal and external links
 */
function countLinks(content: string): { internal: number; external: number } {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let internal = 0;
  let external = 0;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2];
    // Internal links: relative paths or same domain
    if (url.startsWith('/') || url.startsWith('#') || url.includes('siamrooftech.com')) {
      internal++;
    } else if (url.startsWith('http')) {
      external++;
    }
  }

  return { internal, external };
}

/**
 * Count images and check alt text
 */
function countImages(content: string): { total: number; withAlt: number } {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let total = 0;
  let withAlt = 0;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    total++;
    const altText = match[1].trim();
    if (altText.length > 0) {
      withAlt++;
    }
  }

  return { total, withAlt };
}

/**
 * Calculate keyword density
 */
export function calculateKeywordDensity(content: string, keywords: string[]): { [keyword: string]: number } {
  if (!content || keywords.length === 0) return {};

  const totalWords = countWords(content);
  if (totalWords === 0) return {};

  const densities: { [keyword: string]: number } = {};
  const lowerContent = content.toLowerCase();

  keywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    // Count occurrences (handle multi-word keywords)
    const regex = new RegExp(keywordLower.replace(/\s+/g, '\\s+'), 'gi');
    const matches = lowerContent.match(regex) || [];
    const count = matches.length;

    // Calculate density as percentage
    const density = (count / totalWords) * 100;
    densities[keyword] = Math.round(density * 100) / 100; // Round to 2 decimals
  });

  return densities;
}

/**
 * Calculate Flesch Reading Ease (adapted for Thai)
 * Original formula: 206.835 - 1.015(total words/total sentences) - 84.6(total syllables/total words)
 * Simplified for Thai: Focus on sentence length and word complexity
 */
function calculateFleschScore(wordCount: number, sentenceCount: number): number {
  if (wordCount === 0 || sentenceCount === 0) return 0;

  const avgWordsPerSentence = wordCount / sentenceCount;

  // Simplified score for Thai
  // Ideal: 15-20 words per sentence
  // Too long (>30): harder to read
  // Too short (<5): choppy
  let score = 100;

  if (avgWordsPerSentence > 30) {
    score -= (avgWordsPerSentence - 30) * 2;
  } else if (avgWordsPerSentence < 5) {
    score -= (5 - avgWordsPerSentence) * 3;
  } else if (avgWordsPerSentence > 20) {
    score -= (avgWordsPerSentence - 20) * 1;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Get readability label from score
 */
export function getReadabilityLabel(score: number): string {
  if (score >= READABILITY_THRESHOLDS.EXCELLENT) return 'อ่านง่ายมาก';
  if (score >= READABILITY_THRESHOLDS.GOOD) return 'อ่านง่าย';
  if (score >= READABILITY_THRESHOLDS.FAIR) return 'ปานกลาง';
  if (score >= READABILITY_THRESHOLDS.DIFFICULT) return 'อ่านยาก';
  return 'อ่านยากมาก';
}

/**
 * Get readability color for UI
 */
export function getReadabilityColor(score: number): string {
  if (score >= READABILITY_THRESHOLDS.EXCELLENT) return 'text-green-600';
  if (score >= READABILITY_THRESHOLDS.GOOD) return 'text-blue-600';
  if (score >= READABILITY_THRESHOLDS.FAIR) return 'text-yellow-600';
  if (score >= READABILITY_THRESHOLDS.DIFFICULT) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get readability suggestions
 */
export function getReadabilitySuggestions(analysis: ContentAnalysis): string[] {
  const suggestions: string[] = [];

  if (analysis.avgWordsPerSentence > 30) {
    suggestions.push('ประโยคยาวเกินไป ควรแบ่งเป็นประโยคสั้นๆ (15-20 คำต่อประโยค)');
  }

  if (analysis.avgWordsPerSentence < 5) {
    suggestions.push('ประโยคสั้นเกินไป ลองรวมประโยคที่เกี่ยวข้องกัน');
  }

  if (analysis.avgSentencesPerParagraph > 8) {
    suggestions.push('ย่อหน้ายาวเกินไป ควรแบ่งเป็น 3-5 ประโยคต่อย่อหน้า');
  }

  if (analysis.headingStructure.length === 0) {
    suggestions.push('ควรเพิ่มหัวข้อย่อย (H2, H3) เพื่อแบ่งเนื้อหา');
  }

  if (analysis.headingStructure.length < 3 && analysis.wordCount > 500) {
    suggestions.push('บทความยาว ควรมีหัวข้อย่อยมากกว่า 3 หัวข้อ');
  }

  if (analysis.imageCount === 0 && analysis.wordCount > 300) {
    suggestions.push('ควรเพิ่มรูปภาพประกอบเนื้อหา');
  }

  if (analysis.imageCount > 0 && analysis.imagesWithAlt < analysis.imageCount) {
    suggestions.push(`รูปภาพ ${analysis.imageCount - analysis.imagesWithAlt} รูปยังไม่มี alt text`);
  }

  if (analysis.internalLinks === 0) {
    suggestions.push('ควรเพิ่มลิงก์ภายในไปยังบทความที่เกี่ยวข้อง (2-3 ลิงก์)');
  }

  return suggestions;
}

/**
 * Analyze content for readability and structure
 */
export function analyzeContent(content: string, keywords: string[] = []): ContentAnalysis {
  if (!content) {
    return {
      readabilityScore: 0,
      keywordDensity: {},
      headingStructure: [],
      internalLinks: 0,
      externalLinks: 0,
      imageCount: 0,
      imagesWithAlt: 0,
      wordCount: 0,
      sentenceCount: 0,
      avgWordsPerSentence: 0,
      avgSentencesPerParagraph: 0,
    };
  }

  const wordCount = countWords(content);
  const sentenceCount = countSentences(content);
  const headingStructure = extractHeadings(content);
  const links = countLinks(content);
  const images = countImages(content);
  const keywordDensity = calculateKeywordDensity(content, keywords);

  // Calculate averages
  const avgWordsPerSentence = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Count paragraphs (split by double newline)
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const avgSentencesPerParagraph = paragraphs.length > 0 ? sentenceCount / paragraphs.length : 0;

  const readabilityScore = calculateFleschScore(wordCount, sentenceCount);

  return {
    readabilityScore: Math.round(readabilityScore),
    keywordDensity,
    headingStructure,
    internalLinks: links.internal,
    externalLinks: links.external,
    imageCount: images.total,
    imagesWithAlt: images.withAlt,
    wordCount,
    sentenceCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 10) / 10,
  };
}
