import { getArticles } from '@/lib/data';
import { CATEGORIES } from '@/lib/types';

// IMPORTANT: Replace this with your actual production domain
const URL = 'https://www.latestnews9.com'; 

export async function GET() {
  const articles = await getArticles('us'); // Use a default country for sitemap generation

  const staticPages = [
    '',
    '/bookmarks',
    '/about',
    '/contact',
    '/privacy-policy',
    '/terms-of-service',
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map((path) => `
    <url>
      <loc>${URL}${path}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>${path === '' ? '1.0' : '0.7'}</priority>
    </url>
  `).join('')}
  ${articles
    .map(({ id, publishDate, country }) => `
    <url>
      <loc>${URL}/articles/${encodeURIComponent(id)}${country ? `?country=${country}` : ''}</loc>
      <lastmod>${new Date(publishDate).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `).join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
