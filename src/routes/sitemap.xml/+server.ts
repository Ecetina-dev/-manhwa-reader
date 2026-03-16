import { getAllManga } from '$lib/server/sqlite';

export const prerender = false;

export async function GET() {
  const manga = getAllManga({ limit: 1000 });
  
  const baseUrl = 'https://manhau.app';
  const now = new Date().toISOString().split('T')[0];
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
         xmlns:xhtml="http://www.w3.org/1999/xhtml"
         xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
         xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Main pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <lastmod>${now}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/browse</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
    <lastmod>${now}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/favorites</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>
  <url>
    <loc>${baseUrl}/history</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
    <lastmod>${now}</lastmod>
  </url>
  
  <!-- Manga pages -->
  ${manga.map(m => `
  <url>
    <loc>${baseUrl}/${m.id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${m.updated_at ? m.updated_at.split(' ')[0] : now}</lastmod>
    ${m.cover ? `
    <image:image>
      <image:loc>${m.cover.startsWith('http') ? m.cover : baseUrl + m.cover}</image:loc>
      <image:title>${escapeXml(m.title)}</image:title>
    </image:image>` : ''}
  </url>`).join('')}
  
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
