import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Comprehensive DOM polyfills for PDF.js in Node.js environment
if (typeof globalThis !== 'undefined') {
  // Only set polyfills if they don't already exist
  if (!globalThis.DOMMatrix) {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      a: number = 1;
      b: number = 0; 
      c: number = 0;
      d: number = 1;
      e: number = 0;
      f: number = 0;
      
      constructor() {
        // Initialize matrix as identity matrix
      }
    };
  }
  
  if (!globalThis.document) {
    (globalThis as any).document = {
      createElement: () => ({ style: {} }),
      createElementNS: () => ({ style: {} }),
      querySelector: () => null,
      querySelectorAll: () => [],
      getElementById: () => null,
      head: { appendChild: () => {} },
      body: { appendChild: () => {} }
    };
  }
  
  if (!globalThis.window) {
    (globalThis as any).window = {
      ...globalThis,
      location: {
        protocol: 'http:',
        host: 'localhost',
        hostname: 'localhost',
        port: '3000',
        pathname: '/',
        search: '',
        hash: '',
        href: 'http://localhost:3000/'
      },
      navigator: {
        userAgent: 'Node.js',
        platform: 'Node.js',
        language: 'en-US'
      }
    };
  }
  
  // Only set navigator if it's not already defined or if it's writable
  try {
    if (typeof globalThis.navigator === 'undefined') {
      Object.defineProperty(globalThis, 'navigator', {
        value: {
          userAgent: 'Node.js',
          platform: 'Node.js',
          language: 'en-US'
        },
        writable: false,
        configurable: true
      });
    }
  } catch (e) {
    // Navigator already exists and is read-only, skip it
  }
  
  if (!globalThis.btoa) {
    (globalThis as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
  }
  
  if (!globalThis.atob) {
    (globalThis as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');
  }
}

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('pdf') as File;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    let extractedText: string;

    try {
      // Dynamically import PDF.js legacy build
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      
      // Convert file to array buffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

      let fullText = '';

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }

      extractedText = fullText.trim();
    } catch (pdfError) {
      console.error('PDF parsing error:', pdfError);
      return NextResponse.json({ error: 'Failed to parse PDF file. Please ensure the file is a valid PDF.' }, { status: 400 });
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'Unable to extract text from PDF' }, { status: 400 });
    }

    const promptTemplate = `
คุณคือผู้เชี่ยวชาญในการวิเคราะห์ใบเสนอราคาของงานกันสาดพับเก็บได้ กรุณาวิเคราะห์ข้อความที่แยกมาจาก PDF และแยกข้อมูลที่สำคัญออกมา:

ข้อความจากใบเสนอราคา:
${extractedText}

กรุณาแยกข้อมูลต่อไปนี้ (หากไม่พบข้อมูลให้ใส่ null):

1. ชื่อโครงการ/ลูกค้า
2. สถานที่ติดตั้ง
3. ขนาดกันสาด (กว้าง x ยื่นออก) ในหน่วยเมตร
4. ประเภทงาน (ร้านอาหาร, คาเฟ่, บ้านพักอาศัย, อาคารพาณิชย์, โรงแรม, โรงพยาบาล, etc.)
5. ระบบที่ใช้ (มือหมุน, มอเตอร์ไฟฟ้า, สองระบบ)
6. จำนวนแขนพับ (2, 3, 4, 5)
7. วัสดุผ้าใบ (ผ้าอะคริลิคสเปน, ผ้าอะคริลิค)
8. ชายผ้า (ตัดเรียบ, โค้งลอน)
9. ราคารวม
10. หมายเหตุ/รายละเอียดเพิ่มเติม

กรุณาตอบกลับในรูปแบบ JSON เท่านั้น:
{
  "title": "ชื่อโครงการ",
  "location": "สถานที่",
  "width": "ความกว้างในเมตร (เฉพาะตัวเลข)",
  "extension": "ระยะยื่นออกในเมตร (เฉพาะตัวเลข)",
  "category": "ประเภทงาน",
  "type": "ระบบที่ใช้",
  "arms_count": "จำนวนแขนพับ",
  "canvas_material": "วัสดุผ้าใบ",
  "fabric_edge": "ชายผ้า",
  "price": "ราคารวม",
  "notes": "หมายเหตุ"
}

หมายเหตุ: หากไม่พบข้อมูลในบางฟิลด์ ให้ใส่ null แทน
`;

    try {
      // Get the model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: promptTemplate }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
      });

      const response = result.response;
      const responseText = response.text();

      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);

          const cleanedData = {
            title: parsed.title || null,
            location: parsed.location || null,
            width: parsed.width ? parseFloat(parsed.width.toString()) || null : null,
            extension: parsed.extension ? parseFloat(parsed.extension.toString()) || null : null,
            category: parsed.category || null,
            type: parsed.type || null,
            arms_count: parsed.arms_count ? parsed.arms_count.toString() : null,
            canvas_material: parsed.canvas_material || null,
            fabric_edge: parsed.fabric_edge || null,
            price: parsed.price || null,
            notes: parsed.notes || null,
          };

          return NextResponse.json({
            success: true,
            data: cleanedData,
            extractedText: extractedText.substring(0, 500) + '...',
          });
        }
      } catch (parseError) {
        console.warn('Failed to parse AI JSON response:', parseError);
      }

      throw new Error('Unable to parse AI response');
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      throw aiError;
    }
  } catch (error) {
    console.error('Error in PDF autofill:', error);

    return NextResponse.json({
      error: 'Failed to process PDF file',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ 
    message: 'PDF Autofill API is running',
    endpoint: 'POST /api/pdf-autofill',
    status: 'ready',
    accepts: 'multipart/form-data with pdf file'
  });
}
