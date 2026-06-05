import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://phuquocjobs.vn';
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/employer/', '/candidate/', '/api/'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
