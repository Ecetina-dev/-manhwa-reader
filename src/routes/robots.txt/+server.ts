export const prerender = false;

export function GET() {
  const baseUrl = 'https://manhau.app';
  
  const robots = `# ManHau Robots.txt
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-articles.xml

# Disallow admin and private areas
Disallow: /admin
Disallow: /api/admin
Disallow: /favorites
Disallow: /history

# Crawl delay for politeness
Crawl-delay: 1

# Google Bot
User-agent: Googlebot
Allow: /
Crawl-delay: 1

# Image search
User-agent: Googlebot-Image
Allow: /uploads/
Allow: /icons/

# Video search
User-agent: Googlebot-Video
Allow: /

# Bing
User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Slurp (Yahoo)
User-agent: Slurp
Allow: /
Crawl-delay: 1

# DuckDuckGo
User-agent: DuckDuckBot
Allow: /
`;

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400'
    }
  });
}
