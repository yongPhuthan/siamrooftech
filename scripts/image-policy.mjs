#!/usr/bin/env node
// Image standard check (cloudflare-image-workflow). Runs credential-free in CI on tracked files only.
// 1. Images in public/ are WebP (SVG and ICO for icons) and small enough for a page slot.
// 2. Every /images/... path the code uses exists in public/.
// 3. Remote images come from the assets host only; retired or foreign hosts never appear.
// 4. Only the reviewed upload routes reach the media bucket, and no tracked script writes to it.
// 5. next/image keeps the variant loader instead of /_next/image.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

export const MAX_PUBLIC_IMAGE_BYTES = 400 * 1024;
export const PUBLIC_IMAGE_EXTENSIONS = new Set(['.webp', '.svg', '.ico']);
export const RASTER_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tif', '.tiff', '.avif', '.heic', '.webp', '.svg', '.ico']);
export const MEDIA_BUCKET_FILES = new Set([
  'src/lib/database/runtime.ts',
  'src/app/api/upload/objects/[...key]/route.ts',
  'src/app/api/upload/presign/route.ts',
  'src/app/api/upload/video/route.ts',
]);
const MEDIA_BUCKET_NAME = 'siamrooftech-media-production';
const BANNED_HOSTS = [/\br2\.dev\b/, /workstandard\.co/, /\btrustwork\b/];
const REMOTE_IMAGE = /https?:\/\/([a-z0-9.-]+)\/[^\s"'`)]*\.(?:jpe?g|png|webp|gif|avif)\b/gi;
const ALLOWED_IMAGE_HOSTS = new Set(['assets.siamrooftech.com']);
const PUBLIC_IMAGE_REF = /["'`(](\/images\/[^"'`)?#\s]+)/g;
const BUCKET_WRITE = /\br2\s+object\s+put\b|\bs3\s+(?:cp|mv|sync)\b|\brclone\s+(?:copy|move|sync)\b|method\s*[:=]\s*['"](?:PUT|POST)['"]|-X\s*PUT\b/;

const isTest = (file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) || file.startsWith('e2e/');
const isCode = (file) => /\.(?:[cm]?[jt]sx?|json|jsonc|ya?ml|sh)$/.test(file);

export function checkPublicImage(file, bytes) {
  const extension = extname(file).toLowerCase();
  if (!RASTER_EXTENSIONS.has(extension)) return [];
  if (!PUBLIC_IMAGE_EXTENSIONS.has(extension)) {
    return [`${file}: images in public/ must be WebP (SVG or ICO for icons); convert it and update its references`];
  }
  if (extension === '.webp' && bytes > MAX_PUBLIC_IMAGE_BYTES) {
    return [`${file}: ${Math.round(bytes / 1024)} KB is over ${MAX_PUBLIC_IMAGE_BYTES / 1024} KB; resize it for its slot or move the photo to the assets host`];
  }
  return [];
}

export function checkSource(file, source, publicFiles) {
  const problems = [];
  for (const host of BANNED_HOSTS) {
    if (host.test(source)) problems.push(`${file}: references a retired or foreign media host (${host.source})`);
  }
  if (file.startsWith('src/') && !isTest(file)) {
    for (const [, host] of source.matchAll(REMOTE_IMAGE)) {
      if (!ALLOWED_IMAGE_HOSTS.has(host.toLowerCase())) problems.push(`${file}: remote image from ${host}; images live on assets.siamrooftech.com`);
    }
    for (const [, path] of source.matchAll(PUBLIC_IMAGE_REF)) {
      if (path.includes('${')) continue;
      if (!publicFiles.has(`public${path}`)) problems.push(`${file}: ${path} does not exist in public/`);
    }
    if (/\bMEDIA_BUCKET\b|\bgetMediaBucket\b/.test(source) && !MEDIA_BUCKET_FILES.has(file)) {
      problems.push(`${file}: only the reviewed upload routes may reach the media bucket; upload through them (or add the file to MEDIA_BUCKET_FILES in review)`);
    }
  }
  if (source.includes(MEDIA_BUCKET_NAME) && BUCKET_WRITE.test(source)) {
    problems.push(`${file}: writes to ${MEDIA_BUCKET_NAME} directly; media goes up only through the site's upload routes or the projects MCP`);
  }
  return problems;
}

export function checkNextConfig(source) {
  return /loaderFile:\s*['"]\.\/src\/lib\/image-loader\.ts['"]/.test(source)
    ? []
    : ['next.config.mjs: images.loaderFile must stay ./src/lib/image-loader.ts (variant URLs, no /_next/image)'];
}

export function runChecks(files, read, size) {
  const publicFiles = new Set(files.filter((file) => file.startsWith('public/')));
  const problems = [];
  for (const file of publicFiles) problems.push(...checkPublicImage(file, size(file)));
  for (const file of files) {
    if (file === 'scripts/image-policy.mjs' || file === 'scripts/image-policy.test.mjs' || !isCode(file)) continue;
    problems.push(...checkSource(file, read(file), publicFiles));
  }
  problems.push(...checkNextConfig(read('next.config.mjs')));
  return problems;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter((file) => file && existsSync(file));
  const problems = runChecks(files, (file) => readFileSync(file, 'utf8'), (file) => statSync(file).size);
  if (problems.length) {
    console.error(`Image policy: ${problems.length} problem(s)\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
    process.exit(1);
  }
  console.log(`Image policy: ${files.length} tracked files checked, no problems.`);
}
