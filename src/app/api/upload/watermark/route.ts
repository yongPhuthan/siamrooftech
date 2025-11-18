import { NextResponse } from 'next/server';
import sharp from 'sharp';

const WATERMARK_TEXT = 'LINE:@ROOFTECH';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const overrideText = formData.get('text');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'ต้องแนบไฟล์รูปภาพ' }, { status: 400 });
    }

    const text =
      typeof overrideText === 'string'
        ? overrideText.trim()
        : overrideText instanceof Blob
        ? new TextDecoder().decode(await overrideText.arrayBuffer()).trim()
        : '';

    const watermarkText = text.length > 0 ? text : WATERMARK_TEXT;

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const metadata = await sharp(originalBuffer).metadata();
    const width = metadata.width || 1600;
    const height = metadata.height || 900;
    const fontSize = Math.max(Math.round(Math.min(width, height) / 18), 20);

    const svgOverlay = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <text x="${width - 24}" y="${height - 24}" text-anchor="end"
          font-family="SukhumvitSet, Sarabun, Arial, sans-serif" font-size="${fontSize}" font-weight="600"
          fill="rgba(255, 255, 255, 0.4)" stroke="rgba(0, 0, 0, 0.55)" stroke-width="1">
          ${watermarkText}
        </text>
      </svg>
    `;

    const watermarkedBuffer = await sharp(originalBuffer)
      .composite([
        {
          input: Buffer.from(svgOverlay),
          blend: 'over',
        },
      ])
      .toBuffer();

    return new NextResponse(new Uint8Array(watermarkedBuffer), {
      headers: {
        'Content-Type': file.type || 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Watermark error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการใส่ลายน้ำ' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'ใช้ POST กับไฟล์ภาพเพื่อใส่ลายน้ำ' }, { status: 405 });
}
