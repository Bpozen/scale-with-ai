import rss from '@astrojs/rss';
import { getTools, getBlogPosts } from '../lib/api';

export async function GET(context) {
  const tools = await getTools();
  const posts = await getBlogPosts();

  const toolItems = tools.map(tool => ({
    title: `${tool.name} — KI-Tool`,
    pubDate: tool.created_at,
    description: tool.description_de,
    link: `/tools/${tool.slug}/`,
  }));

  const postItems = posts.map(post => ({
    title: post.title_de,
    pubDate: post.published_at || post.created_at,
    description: post.excerpt_de || '',
    link: `/blog/${post.slug}/`,
  }));

  return rss({
    title: 'Scale With AI — KI-Tools Verzeichnis',
    description: 'Neue KI-Tools, Reviews und Vergleiche für den DACH-Markt',
    site: context.site,
    items: [...toolItems, ...postItems],
    customData: `<language>de-DE</language>`,
  });
}
