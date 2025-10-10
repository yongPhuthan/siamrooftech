/**
 * SEO Analyzer - Main analysis engine
 * Combines all analyzers to produce comprehensive SEO report
 */

import { ArticleExtended, SeoReadiness, PRIMARY_KEYWORD, SEO_LIMITS } from '../../types/article';
import { analyzeContent, getReadabilitySuggestions } from './readability';
import { analyzeKeyword } from './keyword-extractor';
import { detectTopicCoverage, isContentComprehensive } from './topic-detector';
import { validateTitle, validateDescription, autoGenerateMeta } from './meta-generator';
import { isSlugOptimal } from './slug-generator';

/**
 * Check for duplicate titles (requires existing articles)
 */
async function checkDuplicateTitle(
  title: string,
  currentArticleId?: string
): Promise<boolean> {
  try {
    // In a real implementation, this would query Firestore
    // For now, return false (no duplicate)
    return false;
  } catch (error) {
    console.error('Error checking duplicate title:', error);
    return false;
  }
}

/**
 * Perform comprehensive SEO analysis
 */
export async function analyzeSEO(
  article: Partial<ArticleExtended>
): Promise<ArticleExtended> {
  const startTime = Date.now();

  const {
    title = '',
    content = '',
    excerpt = '',
    slug = '',
    seoTitle,
    seoDescription,
    seoKeywords = [],
    featured_image,
  } = article;

  // 1. Content Analysis
  const contentAnalysis = analyzeContent(content, [...seoKeywords, PRIMARY_KEYWORD]);

  // 2. Keyword Analysis
  const primaryKeywordAnalysis = analyzeKeyword(content, PRIMARY_KEYWORD);
  const keywordAnalyses = seoKeywords.map(kw => analyzeKeyword(content, kw));

  // 3. Topic Coverage
  const topicCoverage = detectTopicCoverage(content);

  // 4. Meta Validation
  const displayTitle = seoTitle || title;
  const displayDescription = seoDescription || excerpt;

  const titleValidation = validateTitle(displayTitle);
  const descriptionValidation = validateDescription(displayDescription);

  // 5. Slug Validation
  const slugOptimal = isSlugOptimal(slug);

  // 6. Check for duplicate title
  const hasDuplicateTitle = await checkDuplicateTitle(title, article.id);

  // 7. Build SEO Readiness Checks
  const checks = {
    titleOptimal: titleValidation.optimal,
    descriptionOptimal: descriptionValidation.optimal,
    keywordInTitle: primaryKeywordAnalysis.positions.inTitle,
    keywordInFirstParagraph: primaryKeywordAnalysis.positions.inFirstParagraph,
    keywordInHeadings: primaryKeywordAnalysis.positions.inHeadings > 0,
    hasInternalLinks: contentAnalysis.internalLinks >= SEO_LIMITS.MIN_INTERNAL_LINKS,
    allImagesHaveAlt: contentAnalysis.imageCount === 0 ||
                       contentAnalysis.imagesWithAlt === contentAnalysis.imageCount,
    noDuplicateTitle: !hasDuplicateTitle,
    slugOptimal,
    readabilityGood: contentAnalysis.readabilityScore >= 60,
  };

  // 8. Calculate overall SEO score (0-100)
  const checkValues = Object.values(checks);
  const passedChecks = checkValues.filter(v => v === true).length;
  const seoScore = Math.round((passedChecks / checkValues.length) * 100);

  // 9. Generate suggestions
  const suggestions: string[] = [];
  const criticalIssues: string[] = [];
  const warnings: string[] = [];

  // Title issues
  if (!checks.titleOptimal) {
    if (titleValidation.length === 0) {
      criticalIssues.push('❌ ยังไม่มีหัวข้อ');
    } else if (titleValidation.length < SEO_LIMITS.TITLE_MIN) {
      warnings.push(`⚠️ หัวข้อสั้นเกินไป (${titleValidation.length} ตัวอักษร)`);
    } else if (titleValidation.length > SEO_LIMITS.TITLE_MAX) {
      warnings.push(`⚠️ หัวข้อยาวเกินไป จะถูกตัดในผลค้นหา`);
    }
  }

  if (!checks.keywordInTitle) {
    suggestions.push(`💡 เพิ่ม "${PRIMARY_KEYWORD}" ในหัวข้อเพื่อ SEO ที่ดีขึ้น`);
  }

  // Description issues
  if (!checks.descriptionOptimal) {
    if (descriptionValidation.length === 0) {
      criticalIssues.push('❌ ยังไม่มีคำอธิบาย (Description)');
    } else if (descriptionValidation.length < SEO_LIMITS.DESCRIPTION_MIN) {
      warnings.push(`⚠️ คำอธิบายสั้นเกินไป (${descriptionValidation.length} ตัวอักษร)`);
    }
  }

  // Content issues
  if (contentAnalysis.wordCount === 0) {
    criticalIssues.push('❌ ยังไม่มีเนื้อหา');
  } else if (contentAnalysis.wordCount < SEO_LIMITS.MIN_WORD_COUNT) {
    warnings.push(`⚠️ เนื้อหาสั้นเกินไป (${contentAnalysis.wordCount} คำ) ควรมีอย่างน้อย ${SEO_LIMITS.MIN_WORD_COUNT} คำ`);
  }

  if (!checks.keywordInFirstParagraph) {
    suggestions.push(`💡 เพิ่ม "${PRIMARY_KEYWORD}" ในย่อหน้าแรก`);
  }

  if (!checks.keywordInHeadings) {
    suggestions.push(`💡 เพิ่ม "${PRIMARY_KEYWORD}" ในหัวข้อย่อย (H2 หรือ H3)`);
  }

  // Image issues
  if (contentAnalysis.imageCount === 0) {
    warnings.push('⚠️ ยังไม่มีรูปภาพประกอบ');
  } else if (!checks.allImagesHaveAlt) {
    const missingAlt = contentAnalysis.imageCount - contentAnalysis.imagesWithAlt;
    warnings.push(`⚠️ รูปภาพ ${missingAlt} รูปยังไม่มี alt text`);
  }

  if (!featured_image) {
    warnings.push('⚠️ ยังไม่มีรูปหน้าปก');
  }

  // Link issues
  if (!checks.hasInternalLinks) {
    suggestions.push(`💡 เพิ่มลิงก์ภายใน ${SEO_LIMITS.MIN_INTERNAL_LINKS - contentAnalysis.internalLinks} ลิงก์`);
  }

  // Slug issues
  if (!checks.slugOptimal) {
    if (slug.length === 0) {
      criticalIssues.push('❌ ยังไม่มี URL slug');
    } else {
      warnings.push('⚠️ URL slug ยังไม่เหมาะสมสำหรับ SEO');
    }
  }

  // Duplicate title
  if (!checks.noDuplicateTitle) {
    criticalIssues.push('❌ มีบทความอื่นใช้หัวข้อนี้แล้ว');
  }

  // Readability issues
  if (!checks.readabilityGood) {
    const readabilitySuggestions = getReadabilitySuggestions(contentAnalysis);
    suggestions.push(...readabilitySuggestions.slice(0, 2)); // Top 2 suggestions
  }

  // Topic coverage
  if (topicCoverage.coverageScore < 50) {
    warnings.push(`⚠️ ครอบคลุมหัวข้อสำคัญเพียง ${topicCoverage.coverageScore}%`);
    suggestions.push(...topicCoverage.suggestions.slice(0, 2)); // Top 2 suggestions
  }

  // Keyword density issues
  if (primaryKeywordAnalysis.density > SEO_LIMITS.MAX_KEYWORD_DENSITY) {
    warnings.push(`⚠️ ความหนาแน่นของคีย์เวิร์ดสูงเกินไป (${primaryKeywordAnalysis.density}%)`);
  } else if (primaryKeywordAnalysis.density === 0) {
    criticalIssues.push(`❌ ไม่พบคีย์เวิร์ด "${PRIMARY_KEYWORD}" ในเนื้อหา`);
  }

  // 10. Auto-generate meta if not provided
  let autoGeneratedMeta = article.autoGeneratedMeta;
  if (!seoTitle || !seoDescription) {
    autoGeneratedMeta = autoGenerateMeta(title, content, excerpt, seoKeywords);
  }

  // 11. Build final SEO readiness
  const seoReadiness: SeoReadiness = {
    score: seoScore,
    checks,
    suggestions,
    criticalIssues,
    warnings,
  };

  // 12. Calculate processing time
  const processingTime = Date.now() - startTime;

  // 13. Return enhanced article
  return {
    ...article,
    contentAnalysis,
    seoReadiness,
    topicCoverage,
    autoGeneratedMeta,
    processingTime,
    lastAnalyzedAt: new Date().toISOString(),
  } as ArticleExtended;
}

/**
 * Get SEO status label
 */
export function getSeoStatusLabel(score: number): string {
  if (score >= 90) return 'พร้อมเผยแพร่';
  if (score >= 70) return 'ดี';
  if (score >= 50) return 'พอใช้';
  if (score >= 30) return 'ต้องปรับปรุง';
  return 'ต้องแก้ไข';
}

/**
 * Get SEO status color
 */
export function getSeoStatusColor(score: number): string {
  if (score >= 90) return 'bg-green-100 text-green-800';
  if (score >= 70) return 'bg-blue-100 text-blue-800';
  if (score >= 50) return 'bg-yellow-100 text-yellow-800';
  if (score >= 30) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
}

/**
 * Check if article is ready to publish
 */
export function isReadyToPublish(article: ArticleExtended): boolean {
  if (!article.seoReadiness) return false;

  const { score, criticalIssues } = article.seoReadiness;

  // No critical issues and score >= 70
  return criticalIssues.length === 0 && score >= 70;
}

/**
 * Get quick fixes for common issues
 */
export function getQuickFixes(article: ArticleExtended): Array<{
  issue: string;
  fix: string;
  action: 'auto' | 'manual';
}> {
  const fixes: Array<{ issue: string; fix: string; action: 'auto' | 'manual' }> = [];

  if (!article.seoReadiness) return fixes;

  const { checks } = article.seoReadiness;

  if (!checks.titleOptimal && article.autoGeneratedMeta) {
    fixes.push({
      issue: 'หัวข้อยังไม่เหมาะสม',
      fix: `ใช้: "${article.autoGeneratedMeta.title}"`,
      action: 'auto',
    });
  }

  if (!checks.descriptionOptimal && article.autoGeneratedMeta) {
    fixes.push({
      issue: 'คำอธิบายยังไม่เหมาะสม',
      fix: `ใช้: "${article.autoGeneratedMeta.description.substring(0, 50)}..."`,
      action: 'auto',
    });
  }

  if (!checks.allImagesHaveAlt) {
    fixes.push({
      issue: 'รูปภาพยังไม่มี alt text',
      fix: 'เพิ่ม alt text ให้กับรูปภาพทุกรูป',
      action: 'manual',
    });
  }

  if (!checks.hasInternalLinks) {
    fixes.push({
      issue: 'ยังไม่มีลิงก์ภายใน',
      fix: 'เพิ่มลิงก์ไปยังบทความที่เกี่ยวข้อง',
      action: 'manual',
    });
  }

  return fixes;
}

/**
 * Export analysis as report
 */
export function exportAnalysisReport(article: ArticleExtended): string {
  if (!article.seoReadiness) return '';

  const { score, checks, criticalIssues, warnings, suggestions } = article.seoReadiness;

  let report = `# SEO Analysis Report\n\n`;
  report += `**Article**: ${article.title}\n`;
  report += `**Score**: ${score}/100 (${getSeoStatusLabel(score)})\n`;
  report += `**Analyzed**: ${new Date(article.lastAnalyzedAt || '').toLocaleString('th-TH')}\n\n`;

  report += `## Checks\n\n`;
  Object.entries(checks).forEach(([key, value]) => {
    report += `- ${value ? '✅' : '❌'} ${key}\n`;
  });

  if (criticalIssues.length > 0) {
    report += `\n## Critical Issues\n\n`;
    criticalIssues.forEach(issue => report += `${issue}\n`);
  }

  if (warnings.length > 0) {
    report += `\n## Warnings\n\n`;
    warnings.forEach(warning => report += `${warning}\n`);
  }

  if (suggestions.length > 0) {
    report += `\n## Suggestions\n\n`;
    suggestions.forEach(suggestion => report += `${suggestion}\n`);
  }

  return report;
}
