import { buildPixelBootstrap, normalizePixelId } from './pixel-config';

/**
 * Server-rendered loader for the OpenAI Ads Measurement Pixel, placed in the
 * root layout's <head> as OpenAI documents. Renders nothing unless a valid
 * public Pixel ID was inlined at build time, so local, staging and
 * unconfigured builds never load the SDK. The inline queue stub exists before
 * hydration, so measurement calls from the first client render are queued.
 * The SDK itself loads `async` and never blocks rendering.
 */
export default function OpenAIPixel() {
  if (process.env.NODE_ENV !== 'production') return null;
  const pixelId = normalizePixelId(process.env.NEXT_PUBLIC_OPENAI_PIXEL_ID);
  if (!pixelId) return null;
  return <script id="openai-ads-pixel" dangerouslySetInnerHTML={{ __html: buildPixelBootstrap(pixelId) }} />;
}
