/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'pub-99f8d7bf688c4c79afcc2d91f37141f2.r2.dev',
            },
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
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
