/**
 * The one watermark on project photos: faint text in the bottom-right corner, drawn into the file before it is
 * resized. It runs in the browser (canvas) because sharp cannot run inside a Cloudflare Worker; the agent uploader
 * draws the same mark with sharp on the owner's machine.
 */
export const DEFAULT_WATERMARK_TEXT = 'Line:@rooftech';

/** Distance from the right and bottom edges, in pixels of the full-size photo. */
const EDGE_MARGIN = 24;
/** Font size scales with the photo's short side so the mark looks the same in every resized copy. */
const FONT_SCALE = 18;
const MIN_FONT_SIZE = 20;

export const WATERMARK_STYLE = {
  font: 'SukhumvitSet, Sarabun, Arial, sans-serif',
  weight: 600,
  fill: 'rgba(255, 255, 255, 0.4)',
  stroke: 'rgba(0, 0, 0, 0.55)',
  strokeWidth: 1,
} as const;

export type WatermarkLayout = { fontSize: number; x: number; y: number };

export function watermarkLayout(width: number, height: number): WatermarkLayout {
  return {
    fontSize: Math.max(Math.round(Math.min(width, height) / FONT_SCALE), MIN_FONT_SIZE),
    x: width - EDGE_MARGIN,
    y: height - EDGE_MARGIN,
  };
}

/** Output keeps PNG and WebP as they are; everything else (JPEG, HEIC already decoded by the browser) becomes JPEG. */
export function watermarkOutputType(inputType: string): 'image/png' | 'image/webp' | 'image/jpeg' {
  return inputType === 'image/png' || inputType === 'image/webp' ? inputType : 'image/jpeg';
}

/** JPEG quality for the watermarked full-size file; the resize step compresses again, so keep this high. */
const OUTPUT_QUALITY = 0.92;

/** Draws the watermark on an upright copy of the photo (EXIF orientation applied) and returns it as a new file. */
export async function drawWatermark(file: File, text: string): Promise<File> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('ไม่สามารถใส่ลายน้ำได้: เบราว์เซอร์ไม่รองรับ canvas');
  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const { fontSize, x, y } = watermarkLayout(canvas.width, canvas.height);
  context.font = `${WATERMARK_STYLE.weight} ${fontSize}px ${WATERMARK_STYLE.font}`;
  context.textAlign = 'right';
  context.textBaseline = 'alphabetic';
  context.lineWidth = WATERMARK_STYLE.strokeWidth;
  context.strokeStyle = WATERMARK_STYLE.stroke;
  context.fillStyle = WATERMARK_STYLE.fill;
  context.strokeText(text, x, y);
  context.fillText(text, x, y);

  const type = watermarkOutputType(file.type);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, OUTPUT_QUALITY));
  if (!blob) throw new Error('ไม่สามารถใส่ลายน้ำได้');
  return new File([blob], file.name, { type: blob.type || type });
}
