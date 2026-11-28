import assert from 'node:assert/strict';
import test from 'node:test';
import { checkNextConfig, checkPublicImage, checkSource, runChecks } from './image-policy.mjs';

const publicFiles = new Set(['public/images/line.webp']);

test('public images must be WebP, SVG or ICO', () => {
  assert.match(checkPublicImage('public/images/a.jpg', 1000)[0], /must be WebP/);
  assert.match(checkPublicImage('public/images/a.PNG', 1000)[0], /must be WebP/);
  assert.deepEqual(checkPublicImage('public/images/a.webp', 1000), []);
  assert.deepEqual(checkPublicImage('public/icon.svg', 1000), []);
  assert.deepEqual(checkPublicImage('public/robots.txt', 1000), []);
});

test('oversized public WebP is refused', () => {
  assert.match(checkPublicImage('public/images/a.webp', 900 * 1024)[0], /over 400 KB/);
});

test('code paths to public images must exist', () => {
  assert.deepEqual(checkSource('src/a.tsx', 'src="/images/line.webp"', publicFiles), []);
  assert.match(checkSource('src/a.tsx', "images: ['/images/contact-hero.jpg']", publicFiles)[0], /does not exist/);
});

test('remote images come from the assets host only', () => {
  assert.deepEqual(checkSource('src/a.tsx', '"https://assets.siamrooftech.com/medium/x.webp"', publicFiles), []);
  assert.match(checkSource('src/a.tsx', '"https://pub-abc.r2.dev/x.jpg"', publicFiles).join(), /r2\\.dev|pub-abc/);
  assert.match(checkSource('src/a.tsx', '"https://example.com/x.jpg"', publicFiles)[0], /example\.com/);
});

test('only reviewed upload routes reach the media bucket', () => {
  assert.deepEqual(checkSource('src/app/api/upload/video/route.ts', 'await getMediaBucket()', publicFiles), []);
  assert.match(checkSource('src/app/api/new-upload/route.ts', 'await getMediaBucket()', publicFiles)[0], /reviewed upload routes/);
  assert.deepEqual(checkSource('src/app/api/new-upload/route.test.ts', 'getMediaBucket', publicFiles), []);
});

test('tracked scripts never write to the media bucket', () => {
  const script = 'npx wrangler r2 object put siamrooftech-media-production/medium/a.webp --file a.webp';
  assert.match(checkSource('scripts/push.sh', script, publicFiles)[0], /writes to siamrooftech-media-production/);
  assert.deepEqual(checkSource('scripts/read.sh', 'npx wrangler r2 object get siamrooftech-media-production/a.webp', publicFiles), []);
});

test('next.config keeps the variant loader', () => {
  assert.deepEqual(checkNextConfig("loaderFile: './src/lib/image-loader.ts',"), []);
  assert.equal(checkNextConfig("images: { unoptimized: true }").length, 1);
});

test('runChecks flags a new JPEG and its reference together', () => {
  const files = ['public/images/a.jpg', 'src/a.tsx', 'next.config.mjs'];
  const sources = { 'src/a.tsx': 'src="/images/a.jpg"', 'next.config.mjs': "loaderFile: './src/lib/image-loader.ts'" };
  const problems = runChecks(files, (file) => sources[file], () => 1000);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /a\.jpg: images in public\/ must be WebP/);
});
