import { describe, expect, it } from 'vitest';
import { convertCmsDraftToSiamrooftech } from './draft-import';
import { validateDraft, validateForPublication } from './publication-policy';

describe('cms-draft importer conversion', () => {
  it('converts a procommerce-console cms-draft.json preserving dense [[เติม: ...]] slots as a valid CMS draft', () => {
    const consoleDraft = {
      kind: 'article',
      schemaVersion: 2,
      id: 'article-awning-guide',
      title: 'กันสาดพับเก็บได้ แบบไหนดี จากหน้างานจริง',
      summary: '<p>[[เติม: สรุปคำตอบสั้น 2 ประโยคจากประสบการณ์ติดตั้งของร้าน]]</p>',
      brief: {
        focusKeyword: 'กันสาดพับเก็บได้ แบบไหนดี',
        secondaryKeywords: ['กันสาดพับได้', 'ผ้าใบอะคริลิค'],
        intent: 'commercial_investigation',
      },
      seo: {
        metaTitle: 'กันสาดพับเก็บได้ แบบไหนดี',
        metaDescription: 'เปรียบเทียบกันสาดพับเก็บได้จากงานติดตั้งจริง พร้อมข้อควรรู้ก่อนติด',
        slug: 'retractable-awning-guide',
      },
      byline: {
        author: { name: 'ทีมช่าง Siamrooftech', kind: 'Organization', url: 'https://siamrooftech.com' },
        reviewer: null,
      },
      sections: [
        {
          id: 'sec-knowledge-1',
          kind: 'knowledge',
          heading: 'ก่อนติดตั้งต้องเช็กอะไรบ้าง',
          lead: '<p>[[เติม: เล่าจากประสบการณ์จริงว่าหน้างานแบบไหนติดได้หรือติดยาก]]</p>',
          blocks: [
            {
              type: 'table',
              id: 'tbl-1',
              caption: 'เทียบระบบมือหมุนกับมอเตอร์',
              header: ['หัวข้อ', 'มือหมุน', 'มอเตอร์'],
              rows: [['ความกว้างเหมาะสุด', 'ไม่เกิน 4 ม.', '4–6 ม.']],
            },
          ],
          subsections: [],
        },
        {
          id: 'sec-stories-1',
          kind: 'stories',
          heading: 'ตัวอย่างงานติดตั้งจริงหน้าร้านและบ้าน',
          lead: '<p>รวมเคสที่ลูกค้าเลือกใช้ตามพื้นที่จริง</p>',
          blocks: [
            {
              type: 'story',
              id: 'story-cafe-1',
              title: '[[เลือก: ร้านกาแฟใต้ชายคาตึก / ติดกันสาดอ้อมมุมหน้าร้านกาแฟ]]',
              text: '<p>กันสาดพับเก็บได้ผ้าอะคริลิคสีแดง 5 × 2 ม.</p><p>[[เติม: ทำไมลูกค้าถึงเลือกสีแดงและติดเพิ่มฝั่งข้างร้าน]]</p>',
              project: 'retractable-awning-5x2-2',
              photos: [
                { id: 'photo-after', label: 'หลังติดตั้ง' },
                { id: 'photo-upload', label: 'ก่อนติดตั้ง' },
              ],
            },
            {
              type: 'softCta',
              id: 'cta-1',
              text: '<p>ส่งรูปหน้างานประเมินเบื้องต้นได้</p>',
              label: 'ดูรายละเอียดกันสาดพับเก็บได้',
              href: '/products/retractable-awning',
            },
          ],
          subsections: [],
        },
      ],
      faq: [
        {
          id: 'faq-1',
          question: 'ผ้าอะคริลิคอยู่ได้กี่ปี',
          answer: '<p>[[เติม: อายุใช้งานจริงที่เจอจากลูกค้าเก่าและปัจจัยเรื่องแดด/ลม]]</p>',
        },
      ],
      sources: [
        { id: 'src-1', title: 'Siamrooftech Field Notes', url: 'https://siamrooftech.com/projects' },
      ],
      workspace: {
        media: {
          'photo-after': {
            business: 'siamrooftech',
            slotId: 'r2:after',
            preset: 'large',
            url: 'https://cdn.siamrooftech.com/projects/after.webp',
            alt: 'กันสาดพับเก็บได้สีแดงหน้าร้านกาแฟ',
            width: 1200,
            height: 800,
          },
          'photo-upload': {
            business: 'siamrooftech',
            slotId: 'upload:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            preset: 'large',
            url: '/__wireframe/catalog/siamrooftech/uploads/0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef.webp',
            alt: 'หน้าร้านก่อนติดตั้ง',
            width: 1200,
            height: 800,
            source: 'upload',
          },
        },
      },
    };

    const { converted, problems } = convertCmsDraftToSiamrooftech(consoleDraft);
    expect(problems).toEqual([]);
    expect(converted).toBeDefined();
    if (!converted) return;

    expect(converted.metadata.slug).toBe('retractable-awning-guide');
    expect(converted.metadata.intent).toBe('commercial');
    expect(converted.seoSettings.primaryKeyword).toBe('กันสาดพับเก็บได้ แบบไหนดี');
    expect(converted.markerCount).toBeGreaterThanOrEqual(5);
    expect(converted.warnings).toHaveLength(1);
    expect(validateDraft(converted.metadata, converted.document)).toEqual([]);

    const publishProblems = validateForPublication(converted.metadata, converted.document);
    expect(publishProblems.some((problem) => problem.field === 'metadata.excerpt')).toBe(true);
    expect(publishProblems.some((problem) => problem.field.startsWith('document#section-'))).toBe(true);
  });

  it('passes through a native { metadata, document } payload directly', () => {
    const native = {
      metadata: {
        title: 'บทความทดสอบ',
        slug: 'test-article',
        excerpt: 'คำโปรยบทความทดสอบ',
        category: 'คำแนะนำ',
        authorName: 'ทีมงาน Siamrooftech',
        authorType: 'Organization',
        topic: 'กันสาด',
        tags: [],
        seoTitle: 'บทความทดสอบ',
        seoDescription: 'คำอธิบายบทความทดสอบ',
        sources: [],
      },
      document: {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 2, id: 'section-12345678' },
            content: [{ type: 'text', text: 'หัวข้อทดสอบ' }],
          },
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '[[เติม: เนื้อหาที่ต้องพิมพ์เอง]]' }],
          },
        ],
      },
    };

    const { converted, problems } = convertCmsDraftToSiamrooftech(native);
    expect(problems).toEqual([]);
    expect(converted?.markerCount).toBe(1);
  });
});
