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
const workerEnvironment = process.env.CMS_BUILD_ENV;
const workerVars = workerEnvironment
    ? workerConfig.env?.[workerEnvironment]?.vars
    : workerConfig.vars;
const ga4MeasurementId =
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ??
    workerVars?.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

const nextConfig = {
    env: ga4MeasurementId
        ? { NEXT_PUBLIC_GA4_MEASUREMENT_ID: ga4MeasurementId }
        : {},
    experimental: {
        // Static route generation reads published records from the local D1
        // emulator. Keep parallel reads bounded to avoid emulator failures.
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
