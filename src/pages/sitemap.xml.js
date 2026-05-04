import { getTools, getCategories, getBlogPosts } from '../lib/api';

export async function GET(context) {
  const tools = await getTools();
  const categories = await getCategories();
  const posts = await getBlogPosts();

  const pages = [
    { url: '', priority: 1.0, changefreq: 'daily' },
    { url: 'tools/', priority: 0.9, changefreq: 'daily' },
    { url: 'categories/', priority: 0.8, changefreq: 'weekly' },
    { url: 'compare/', priority: 0.7, changefreq: 'weekly' },
    { url: 'blog/', priority: 0.8, changefreq: 'daily' },
  ];

  const toolPages = tools.map(t => ({
    url: `tools/${t.slug}/`,
    priority: 0.7,
    changefreq: 'weekly',
    lastmod: t.updated_at,
  }));

  const categoryPages = categories.map(c => ({
    url: `categories/${c.slug}/`,
    priority: 0.6,
    changefreq: 'weekly',
  }));

  const blogPages = posts.map(p => ({
    url: `blog/${p.slug}/`,
    priority: 0.6,
    changefreq: 'monthly',
    lastmod: p.published_at || p.created_at,
  }));

  const allUrls = [...pages, ...toolPages, ...categoryPages, ...blogPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${context.site}${u.url}</loc>
    <priority>${u.priority}</priority>
    <changefreq>${u.changefreq}</changefreq>
    ${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}
