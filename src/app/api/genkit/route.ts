import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY!);

// Handle POST requests for AI description generation
export async function POST(req: NextRequest) {
  let body: any = {};
  
  try {
    body = await req.json();
    
    // Validate input
    if (!body.width || !body.extension || !body.category || !body.location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the AI prompt
    const promptTemplate = `
คุณคือผู้เชี่ยวชาญด้านกันสาดพับเก็บได้และระบบกันแดด กรุณาวิเคราะห์รูปภาพและข้อมูลโปรเจคต่อไปนี้ แล้วสร้างรายละเอียดโปรเจคที่น่าสนใจและเป็นมืออาชีพ:

ข้อมูลโปรเจค:
- ขนาด: กว้าง ${body.width} เมตร x ยื่นออก ${body.extension} เมตร
- ประเภทงาน: ${body.category}
- สถานที่: ${body.location}
- ปีที่ติดตั้ง: ${body.year}
- ระบบที่ใช้: ${body.type}
- จำนวนแขนพับ: ${body.arms_count} แขน
- วัสดุผ้าใบ: ${body.canvas_material}
- ชายผ้า: ${body.fabric_edge}

กรุณาสร้างรายละเอียดโปรเจค 3-5 ข้อ โดย:
1. อธิบายลักษณะของกันสาดและการติดตั้ง
2. เน้นจุดเด่นของวัสดุและระบบที่ใช้
3. อธิบายประโยชน์และการใช้งานในสถานที่นี้
4. ใช้ภาษาไทยที่เป็นมืออาชีพและดึงดูดลูกค้า
5. แต่ละข้อควรยาวประมาณ 1-2 ประโยค

กรุณาตอบกลับในรูปแบบ JSON ดังนี้:
{
  "descriptions": [
    "รายละเอียดข้อที่ 1",
    "รายละเอียดข้อที่ 2", 
    "รายละเอียดข้อที่ 3",
    "รายละเอียดข้อที่ 4"
  ]
}

ตัวอย่างรูปแบบที่ต้องการ:
- "กันสาดพับเก็บได้ระบบมือหมุน ขนาด 4.0 x 3.0 เมตร ติดตั้งที่ร้านกาแฟในย่านธุรกิจ ให้ความร่มเย็นและสร้างบรรยากาศที่นั่งกลางแจ้งที่สะดวกสบาย"
- "ใช้ผ้าอะคริลิคสเปนคุณภาพสูง ทนทานต่อแสงแดดและฝน พร้อมชายผ้าโค้งลอนที่เพิ่มความสวยงามและลดการสะสมของน้ำฝน"
`;

    try {
      // Get the model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Prepare multimodal input
      const parts: any[] = [{ text: promptTemplate }];
      
      if (body.images && body.images.length > 0) {
        // Add images to the prompt
        body.images.slice(0, 3).forEach((base64Image: string) => {
          parts.push({
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg"
            }
          });
        });
      }

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: parts
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      });

      const response = result.response;
      const responseText = response.text();

      // Try to parse JSON response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.descriptions && Array.isArray(parsed.descriptions)) {
            return NextResponse.json({ descriptions: parsed.descriptions });
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse AI JSON response, using fallback');
      }

      // If JSON parsing fails, try to extract descriptions from text
      const descriptions = responseText
        .split('\n')
        .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
        .map(line => line.replace(/^[-•]\s*/, '').trim())
        .filter(line => line.length > 20);

      if (descriptions.length > 0) {
        return NextResponse.json({ descriptions: descriptions.slice(0, 5) });
      }

      throw new Error('Unable to parse AI response');
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      throw aiError;
    }
  } catch (error) {
    console.error('Error in AI description generation:', error);
    
    // Return fallback descriptions on error
    const fallbackDescriptions = [
      `กันสาดพับเก็บได้${body?.type || 'ระบบมือหมุน'} ขนาด ${body?.width || 0} x ${body?.extension || 0} เมตร ติดตั้งที่${body?.category || 'โครงการ'}ในพื้นที่${body?.location || ''} ให้ความร่มเย็นและปกป้องจากแสงแดดอย่างมีประสิทธิภาพ`,
      `ใช้วัสดุ${body?.canvas_material || 'ผ้าอะคริลิค'}คุณภาพสูง ทนทานต่อสภาพอากาศ พร้อม${body?.fabric_edge || 'ตัดเรียบ'}ที่เพิ่มความสวยงามและเสริมประสิทธิภาพการใช้งาน`,
      `ระบบ${body?.arms_count || '2'}แขนพับให้ความมั่นคงในการใช้งาน เหมาะสำหรับพื้นที่${body?.category || 'โครงการ'}ที่ต้องการความยืดหยุ่นในการปรับใช้พื้นที่กลางแจ้ง`,
      `การติดตั้งเมื่อปี ${body?.year || new Date().getFullYear()} ด้วยเทคนิคและประสบการณ์ของทีมงานมืออาชีพ รับประกันคุณภาพและความทนทานในระยะยาว`
    ];
    
    return NextResponse.json({ descriptions: fallbackDescriptions });
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ 
    message: 'AI Description Generation API is running',
    endpoint: 'POST /api/genkit',
    status: 'ready'
  });
}