import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { imageSize, fileName } = await req.json();

  if (!imageSize || !fileName) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const objectPath = `${imageSize}/${fileName}`;

  const res = await fetch(process.env.CLOUDFLARE_WORKER_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ objectPath }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to get presigned URL' }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
