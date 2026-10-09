/** @type {import('next').NextConfig} */
import { readFileSync } from 'node:fs';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// Build reads local content without opening remote email connections.
initOpenNextCloudflareForDev({ remoteBindings: process.env.NODE_ENV === 'development' });

// Wrangler vars are runtime bindings and Next.js does not inline them while
// compiling client components. Forward this public measurement ID at build
// time so the production layout can initialize GA's dataLayer. CI can provide
// an environment-specific public ID explicitly.
const workerConfig = JSON.parse(
    readFileSync(new URL('./wrangler.jsonc', import.meta.url), 'utf8'),
);
// Select public build-time vars independently from Wrangler's runtime env.
// OpenNext dev reads CLOUDFLARE_ENV to choose its D1 proxy, so using that
// variable here would accidentally build against an empty staging emulator.
const workerEnvironment = process.env.CMS_BUILD_ENV || 'local';
if (!['local', 'staging', 'production'].includes(workerEnvironment)) {
    throw new Error(`Unknown CMS_BUILD_ENV "${workerEnvironment}". Expected local, staging, or production.`);
}
if (workerEnvironment !== 'local' && !workerConfig.env?.[workerEnvironment]) {
    throw new Error(`Wrangler environment "${workerEnvironment}" is not configured.`);
}
const workerVars = workerEnvironment === 'local'
    ? workerConfig.vars
    : workerConfig.env[workerEnvironment].vars;
const siteOrigin = workerVars?.SITE_ORIGIN;
if (!siteOrigin || !workerVars?.DEPLOY_ENV) {
    throw new Error(`Wrangler environment "${workerEnvironment}" is missing deployment identity or site origin.`);
}
const ga4MeasurementId =
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ??
    workerVars?.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

const nextConfig = {
    env: {
        DEPLOY_ENV: workerVars.DEPLOY_ENV,
        SITE_ORIGIN: siteOrigin,
        RELEASE_SHA: process.env.GITHUB_SHA || process.env.RELEASE_SHA || 'local-development',
        NEXT_PUBLIC_GA4_MEASUREMENT_ID: ga4MeasurementId || '',
    },
    experimental: {
        // Keep generation concurrency bounded for routes that remain static.
        staticGenerationMaxConcurrency: 2,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev',
            },
            {
                protocol: 'https',
                hostname: 'siamroof.workstandard.co',
            },
            {
                protocol: 'https',
                hostname: 'assets.siamrooftech.com',
            },
        ],
        formats: ['image/avif', 'image/webp'],
    },
};

export default nextConfig;
