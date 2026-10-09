import { MetadataRoute } from 'next'
import { DEPLOYMENT_ENV, SITE_URL } from '@/lib/seo-config'

export default function robots(): MetadataRoute.Robots {
  if (DEPLOYMENT_ENV === 'staging') {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/private/',
          '/admin/',
          '/api/',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
