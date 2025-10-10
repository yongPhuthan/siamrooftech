/**
 * Content Cleaner - Paste & Clean functionality
 * Cleans pasted content from various sources (Word, Google Docs, HTML)
 */

import { PasteCleanupResult } from '../../types/article';

/**
 * Detect source of pasted content
 */
function detectSource(html: string): PasteCleanupResult['source'] {
  if (html.includes('MsoNormal') || html.includes('Microsoft Word')) {
    return 'word';
  }
  if (html.includes('docs-internal-guid') || html.includes('google-docs')) {
    return 'google-docs';
  }
  if (html.includes('<html') || html.includes('<!DOCTYPE')) {
    return 'html';
  }
  if (html.includes('# ') || html.includes('**') || html.includes('##')) {
    return 'markdown';
  }
  return 'unknown';
}

/**
 * Remove HTML comments
 */
function removeComments(html: string): { cleaned: string; count: number } {
  let count = 0;
  const cleaned = html.replace(/<!--[\s\S]*?-->/g, () => {
    count++;
    return '';
  });
  return { cleaned, count };
}

/**
 * Remove scripts and tracking pixels
 */
function removeScriptsAndTracking(html: string): { cleaned: string; scripts: number; tracking: number } {
  let scripts = 0;
  let tracking = 0;

  // Remove script tags
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, () => {
    scripts++;
    return '';
  });

  // Remove tracking pixels (1x1 images, analytics, etc.)
  cleaned = cleaned.replace(/<img[^>]*(?:tracking|analytics|pixel)[^>]*>/gi, () => {
    tracking++;
    return '';
  });

  // Remove noscript
  cleaned = cleaned.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, () => {
    scripts++;
    return '';
  });

  return { cleaned, scripts, tracking };
}

/**
 * Remove inline styles and style tags
 */
function removeStyles(html: string): { cleaned: string; count: number } {
  let count = 0;

  // Remove style tags
  let cleaned = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, () => {
    count++;
    return '';
  });

  // Remove inline style attributes
  cleaned = cleaned.replace(/\s+style="[^"]*"/gi, () => {
    count++;
    return '';
  });

  // Remove class attributes (often source-specific)
  cleaned = cleaned.replace(/\s+class="[^"]*"/gi, () => {
    count++;
    return '';
  });

  return { cleaned, count };
}

/**
 * Convert tables to readable text blocks
 */
function convertTables(html: string): { converted: string; count: number } {
  let count = 0;
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;

  const converted = html.replace(tableRegex, (match) => {
    count++;

    // Extract rows
    const rows: string[] = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(match)) !== null) {
      const cells: string[] = [];
      const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
      let cellMatch;

      while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
        const cellText = cellMatch[1].replace(/<[^>]+>/g, '').trim();
        if (cellText) cells.push(cellText);
      }

      if (cells.length > 0) {
        rows.push(cells.join(' | '));
      }
    }

    // Convert to markdown-style table or list
    if (rows.length > 0) {
      return '\n\n' + rows.map(row => `- ${row}`).join('\n') + '\n\n';
    }

    return '';
  });

  return { converted, count };
}

/**
 * Convert HTML lists to markdown
 */
function convertLists(html: string): { converted: string; count: number } {
  let count = 0;

  // Ordered lists
  let converted = html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match) => {
    count++;
    let index = 1;
    return '\n' + match.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => {
      const text = content.replace(/<[^>]+>/g, '').trim();
      return text ? `${index++}. ${text}\n` : '';
    }) + '\n';
  });

  // Unordered lists
  converted = converted.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match) => {
    count++;
    return '\n' + match.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => {
      const text = content.replace(/<[^>]+>/g, '').trim();
      return text ? `- ${text}\n` : '';
    }) + '\n';
  });

  return { converted, count };
}

/**
 * Convert headings to markdown
 */
function convertHeadings(html: string): { converted: string; count: number } {
  let count = 0;

  let converted = html;
  for (let i = 6; i >= 1; i--) {
    const regex = new RegExp(`<h${i}[^>]*>([\s\S]*?)<\/h${i}>`, 'gi');
    converted = converted.replace(regex, (_, content) => {
      count++;
      const text = content.replace(/<[^>]+>/g, '').trim();
      return text ? `\n\n${'#'.repeat(i)} ${text}\n\n` : '';
    });
  }

  return { converted, count };
}

/**
 * Convert links to markdown
 */
function convertLinks(html: string): { converted: string; count: number } {
  let count = 0;

  const converted = html.replace(/<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    count++;
    const linkText = text.replace(/<[^>]+>/g, '').trim();
    return linkText ? `[${linkText}](${href})` : '';
  });

  return { converted, count };
}

/**
 * Convert images to markdown
 */
function convertImages(html: string): { converted: string; count: number } {
  let count = 0;

  const converted = html.replace(/<img\s+[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, (_, src, alt) => {
    count++;
    return `\n![${alt || 'รูปภาพ'}](${src})\n`;
  });

  return { converted, count };
}

/**
 * Remove empty tags
 */
function removeEmptyTags(html: string): { cleaned: string; count: number } {
  let count = 0;
  let cleaned = html;
  let prevLength = 0;

  // Loop until no more empty tags
  while (cleaned.length !== prevLength) {
    prevLength = cleaned.length;
    cleaned = cleaned.replace(/<(\w+)[^>]*>\s*<\/\1>/gi, () => {
      count++;
      return '';
    });
  }

  return { cleaned, count };
}

/**
 * Clean up whitespace and formatting
 */
function cleanWhitespace(text: string): string {
  return text
    // Remove multiple spaces
    .replace(/ {2,}/g, ' ')
    // Remove spaces before punctuation
    .replace(/\s+([.,!?;:])/g, '$1')
    // Normalize line breaks (max 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    // Remove spaces at start/end of lines
    .replace(/^ +| +$/gm, '')
    // Trim overall
    .trim();
}

/**
 * Main paste cleanup function
 */
export function cleanPastedContent(content: string, isHtml: boolean = true): PasteCleanupResult {
  const warnings: string[] = [];
  let cleaned = content;

  // Detect source
  const source = detectSource(content);

  // Initialize counters
  const removed = {
    styles: 0,
    scripts: 0,
    trackingPixels: 0,
    emptyTags: 0,
    comments: 0,
  };

  const converted = {
    tables: 0,
    lists: 0,
    headings: 0,
    links: 0,
  };

  if (isHtml) {
    // Remove comments
    const commentResult = removeComments(cleaned);
    cleaned = commentResult.cleaned;
    removed.comments = commentResult.count;

    // Remove scripts and tracking
    const scriptResult = removeScriptsAndTracking(cleaned);
    cleaned = scriptResult.cleaned;
    removed.scripts = scriptResult.scripts;
    removed.trackingPixels = scriptResult.tracking;

    // Remove styles
    const styleResult = removeStyles(cleaned);
    cleaned = styleResult.cleaned;
    removed.styles = styleResult.count;

    // Convert tables
    const tableResult = convertTables(cleaned);
    cleaned = tableResult.converted;
    converted.tables = tableResult.count;
    if (tableResult.count > 0) {
      warnings.push(`แปลงตาราง ${tableResult.count} ตารางเป็นรายการ - กรุณาตรวจสอบ`);
    }

    // Convert lists
    const listResult = convertLists(cleaned);
    cleaned = listResult.converted;
    converted.lists = listResult.count;

    // Convert headings
    const headingResult = convertHeadings(cleaned);
    cleaned = headingResult.converted;
    converted.headings = headingResult.count;

    // Convert links
    const linkResult = convertLinks(cleaned);
    cleaned = linkResult.converted;
    converted.links = linkResult.count;

    // Convert images
    const imageResult = convertImages(cleaned);
    cleaned = imageResult.converted;

    // Remove empty tags
    const emptyResult = removeEmptyTags(cleaned);
    cleaned = emptyResult.cleaned;
    removed.emptyTags = emptyResult.count;

    // Remove remaining HTML tags
    cleaned = cleaned.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  }

  // Clean whitespace
  cleaned = cleanWhitespace(cleaned);

  // Add warnings based on source
  if (source === 'word' && removed.styles > 10) {
    warnings.push('พบฟอร์แมตจาก Word จำนวนมาก - กรุณาตรวจสอบการจัดรูปแบบ');
  }

  if (converted.tables > 0 && source !== 'markdown') {
    warnings.push('ตารางถูกแปลงเป็นรายการ - อาจต้องปรับรูปแบบเอง');
  }

  return {
    cleaned,
    removed,
    converted,
    warnings,
    source,
  };
}

/**
 * Quick paste handler for common cases
 */
export function quickCleanPaste(text: string): string {
  // Detect if HTML
  const isHtml = /<[^>]+>/.test(text);

  const result = cleanPastedContent(text, isHtml);
  return result.cleaned;
}

/**
 * Preserve markdown when pasting
 */
export function preserveMarkdown(text: string): string {
  // If already markdown, just clean whitespace
  if (!/<[^>]+>/.test(text)) {
    return cleanWhitespace(text);
  }

  // Otherwise, clean as HTML
  return quickCleanPaste(text);
}
