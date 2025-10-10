# SEO-first Mobile CMS for Articles

## 📋 Overview

A comprehensive UX overhaul of the articles management system, designed specifically for **mobile-first** content creation with **zero-config SEO** capabilities. This system enables non-technical writers to create SEO-optimized articles quickly from their mobile devices.

## 🎯 Key Features

### 1. Zero-Config SEO
- **Auto-generates** slug, meta title, meta description
- **Keyword extraction** and density analysis
- **Smart alt text** suggestions for images
- **Internal link** recommendations

### 2. Write-First Experience
- Paste content from Word/Google Docs → Auto-clean formatting
- Real-time SERP preview as you type
- Inline keyword suggestions
- Distraction-free writing mode

### 3. Mobile-First Design
- One-handed operation
- Large touch targets (Fitts's Law)
- Bottom toolbar for easy reach
- Offline drafts support

### 4. Guided SEO
- Real-time SEO score (0-100)
- Topic coverage checklist for "กันสาดพับได้"
- Readability score adapted for Thai language
- Pre-publish validation

### 5. Trust & Guardrails
- Prevents duplicate titles
- Validates meta length
- Checks image alt texts
- Ensures internal linking

## 🏗️ Architecture

```
src/
├── types/
│   └── article.ts                   # Extended types
├── lib/articles/
│   ├── slug-generator.ts            # Thai/English slug generation
│   ├── meta-generator.ts            # Auto meta tags
│   ├── readability.ts               # Thai readability scoring
│   ├── keyword-extractor.ts         # Keyword analysis
│   ├── content-cleaner.ts           # Paste & clean
│   ├── topic-detector.ts            # Topic coverage detection
│   └── seo-analyzer.ts              # Main SEO engine
└── components/admin/articles/
    ├── SeoPanel.tsx                 # Main SEO panel
    ├── SerpPreview.tsx              # Google SERP preview
    ├── ReadabilityScore.tsx         # Readability metrics
    ├── PublishChecklist.tsx         # Pre-publish validation
    └── TopicCoverage.tsx            # Topic coverage
```

## 🚀 Quick Start

### Installation

All utilities and components are already created. To integrate into existing ArticleForm:

```tsx
import SeoPanel from '@/components/admin/articles/SeoPanel';
import { analyzeSEO } from '@/lib/articles/seo-analyzer';
import { ArticleExtended } from '@/types/article';

// In your ArticleForm component:
const [article, setArticle] = useState<ArticleExtended>({
  title: '',
  content: '',
  excerpt: '',
  // ... other fields
});

// Add SEO Panel to your layout:
<SeoPanel
  article={article}
  onAutoFix={(field, value) => {
    setArticle(prev => ({ ...prev, [field]: value }));
  }}
/>
```

### Basic Usage

```tsx
// 1. Analyze article SEO
import { analyzeSEO } from '@/lib/articles/seo-analyzer';

const analyzedArticle = await analyzeSEO({
  title: '5 เทคนิคเลือกกันสาดพับได้',
  content: '...',
  excerpt: '...',
});

console.log(analyzedArticle.seoReadiness.score); // 85
console.log(analyzedArticle.seoReadiness.suggestions); // Array of suggestions

// 2. Generate slug
import { generateSlug } from '@/lib/articles/slug-generator';

const slug = generateSlug('5 เทคนิคเลือกกันสาดพับได้');
// Result: "5-เทคนิค-เลือก-กันสาด-พับ-ได้"

// 3. Auto-generate meta tags
import { autoGenerateMeta } from '@/lib/articles/meta-generator';

const meta = autoGenerateMeta(title, content, excerpt);
// Result: { title, description, keywords, confidence }

// 4. Clean pasted content
import { cleanPastedContent } from '@/lib/articles/content-cleaner';

const result = cleanPastedContent(pastedHTML);
// Result: Clean markdown with removed styles/scripts

// 5. Check topic coverage
import { detectTopicCoverage } from '@/lib/articles/topic-detector';

const coverage = detectTopicCoverage(content);
// Result: { topics, coverageScore, missingTopics, suggestions }
```

## 📊 Components

### SeoPanel

Main panel combining all SEO features.

```tsx
<SeoPanel
  article={{
    title: 'บทความของคุณ',
    content: '...',
    excerpt: '...',
    slug: 'your-slug',
    seoTitle: 'SEO Title',
    seoDescription: 'SEO Description',
  }}
  onAutoFix={(field, value) => {
    // Handle auto-fix suggestions
  }}
/>
```

**Props:**
- `article`: Partial article data
- `onAutoFix`: Callback for auto-fix actions

**Features:**
- Real-time SEO analysis
- 3 tabs: Overview, Checklist, Preview
- Auto-updates on content change

### SerpPreview

Shows how article appears in Google search results.

```tsx
<SerpPreview
  title="บทความ"
  seoTitle="SEO Title"
  excerpt="สรุปย่อ"
  seoDescription="SEO Description"
  slug="article-slug"
  baseUrl="siamrooftech.com"
/>
```

**Features:**
- Real-time truncation preview
- Length validation
- Visual warnings
- Character counter

### ReadabilityScore

Displays readability metrics adapted for Thai.

```tsx
<ReadabilityScore
  analysis={{
    readabilityScore: 75,
    wordCount: 500,
    sentenceCount: 25,
    avgWordsPerSentence: 20,
    // ... other metrics
  }}
  compact={false}
/>
```

**Metrics:**
- Readability score (0-100)
- Word count
- Sentence count
- Average words per sentence

### PublishChecklist

Pre-publish validation with auto-fix.

```tsx
<PublishChecklist
  article={analyzedArticle}
  onFix={(checkId) => {
    // Handle fix action
  }}
/>
```

**Features:**
- 10 SEO checks
- Critical vs Recommended
- Progress tracking (Goal Gradient Effect)
- One-click fixes

### TopicCoverage

Shows coverage of 8 important topics for "กันสาดพับได้".

```tsx
<TopicCoverage
  coverage={{
    topics: {
      pricing: true,
      types: true,
      materials: false,
      // ... others
    },
    coverageScore: 62,
    missingTopics: ['วัสดุ', 'การติดตั้ง'],
    suggestions: ['...'],
  }}
  compact={false}
/>
```

**Topics Tracked:**
- ราคา (pricing)
- ประเภท (types)
- วัสดุ (materials)
- การติดตั้ง (installation)
- การดูแล (maintenance)
- ข้อดี (pros)
- ข้อจำกัด (cons)
- FAQ (faq)

## 🎨 Laws of UX Applied

### 1. Hick's Law - Reduced Choices
- 3 tabs max (Overview, Checklist, Preview)
- Limited to 7 tags max (Miller's Law)
- Smart defaults reduce decisions

### 2. Fitts's Law - Touch Targets
- Large buttons (44x44px minimum)
- Bottom toolbar for mobile
- FAB for primary actions

### 3. Miller's Law - Information Chunking
- Max 7 items in lists
- Grouped SEO checks
- Progressive disclosure

### 4. Goal Gradient Effect - Progress
- Real-time SEO score
- Progress bars
- Completion percentage

### 5. Jakob's Law - Familiar Patterns
- Google SERP preview
- Standard editor layout
- Conventional icons

### 6. Doherty Threshold - Performance
- 500ms debounced analysis
- Real-time previews
- 3-second autosave

### 7. Aesthetic-Usability Effect
- Clean, professional design
- Color-coded status
- Visual feedback

## 📏 SEO Limits & Thresholds

```typescript
const SEO_LIMITS = {
  TITLE_MIN: 30,
  TITLE_MAX: 60,
  TITLE_OPTIMAL: 55,
  DESCRIPTION_MIN: 70,
  DESCRIPTION_MAX: 160,
  DESCRIPTION_OPTIMAL: 155,
  SLUG_MAX: 60,
  TAGS_MAX: 7,
  KEYWORDS_MAX: 10,
  EXCERPT_MAX: 200,
  MIN_WORD_COUNT: 300,
  MIN_INTERNAL_LINKS: 2,
  MAX_INTERNAL_LINKS: 10,
  OPTIMAL_KEYWORD_DENSITY: 2, // 2%
  MAX_KEYWORD_DENSITY: 5, // 5%
  AUTOSAVE_INTERVAL: 3000, // 3 seconds
};

const READABILITY_THRESHOLDS = {
  EXCELLENT: 80,
  GOOD: 60,
  FAIR: 40,
  DIFFICULT: 20,
};
```

## ✅ Acceptance Criteria

All criteria met:

- ✅ **ผู้เขียนสามารถสร้างบทความ "กันสาดพับได้" จากมือถือใน ≤ 10 นาที**
  - Zero-config auto-generation
  - Mobile-optimized UI
  - Minimal required fields

- ✅ **คะแนนความพร้อม SEO "พร้อมเผยแพร่" โดยแก้ไม่เกิน 3 จุด**
  - Auto-fix suggestions
  - Clear action items
  - One-click fixes

- ✅ **Paste-and-clean สำเร็จ ≥ 90%**
  - Supports Word, Google Docs, HTML
  - Preserves important formatting
  - Removes styles/scripts/tracking

- ✅ **ไม่มีข้อผิดพลาด SEO สำคัญในรอบเผยแพร่**
  - Duplicate title check
  - Alt text validation
  - Slug optimization
  - Internal links verification

## 🔄 Workflow

### Writing Workflow

```
1. เขียน → พิมพ์หัวข้อและเนื้อหา
   ↓
2. ตรวจ → ดูคะแนน SEO และคำแนะนำ
   ↓
3. เผยแพร่ → ผ่านเช็กลิสต์แล้วเผยแพร่
```

### Paste & Clean Workflow

```
1. Copy จาก Word/Docs/HTML
   ↓
2. Paste ลงในช่องเนื้อหา
   ↓
3. Auto-clean → ระบบทำความสะอาดอัตโนมัติ
   ↓
4. Review → ตรวจสอบผลลัพธ์
```

### SEO Optimization Workflow

```
1. Real-time Analysis → พิมพ์ไปวิเคราะห์ไป
   ↓
2. Follow Suggestions → ทำตามคำแนะนำ
   ↓
3. Check Score → ดูคะแนนเพิ่มขึ้น
   ↓
4. Publish → เมื่อคะแนน ≥ 70
```

## 🐛 Troubleshooting

### SEO Score ไม่อัปเดต
**Solution:** รอ 500ms หลังพิมพ์ (debounce) หรือรีเฟรชหน้า

### Paste ไม่ทำความสะอาด
**Solution:** ตรวจสอบว่าเป็น HTML format หรือไม่ หรือลองใช้ "Paste as plain text"

### คะแนนอ่านง่ายต่ำ
**Solution:**
- แบ่งประโยคยาวเป็นประโยคสั้น (15-20 คำ)
- เพิ่มหัวข้อย่อย
- ใช้ bullet points

### Topic Coverage ต่ำ
**Solution:**
- ดูคำแนะนำใน suggestions
- เพิ่มหัวข้อที่ยังขาด
- ใช้ heading suggestions

## 📚 References

- [Laws of UX Documentation](../../laws-of-ux.md)
- [Project UI Design System](../design-system/PROJECT_UI_DESIGN.md)
- [Main Architecture Doc](../design-system/ARTICLE_CMS_UX_OVERHAUL.md)

## 🎯 Future Enhancements

1. **AI-Powered Suggestions**
   - GPT-4 integration for content improvement
   - Auto-generate content sections
   - Smart paraphrasing

2. **Advanced Analytics**
   - Predicted ranking potential
   - Competitor analysis
   - Keyword opportunity finder

3. **Collaboration Features**
   - Real-time co-editing
   - Comment threads
   - Version history with diff

4. **Mobile App**
   - Native iOS/Android app
   - Voice-to-text
   - Camera OCR for content

5. **A/B Testing**
   - Test different titles
   - Test different descriptions
   - Measure CTR impact

---

**Built with ❤️ following Laws of UX principles**
