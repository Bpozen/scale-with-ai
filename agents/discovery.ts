import { supabase } from './lib/supabase';
import type { AgentResult } from './lib/types';

const PRODUCT_HUNT_API = 'https://api.producthunt.com/v2/api/graphql';

interface DiscoveredTool {
  name: string;
  website_url: string;
  tagline: string;
  source: string;
}

async function fetchProductHunt(): Promise<DiscoveredTool[]> {
  const token = process.env.PRODUCT_HUNT_TOKEN;
  if (!token) {
    console.log('No Product Hunt token, skipping');
    return [];
  }

  const query = `
    query {
      posts(first: 20, topic: "artificial-intelligence") {
        edges {
          node {
            name
            tagline
            website
          }
        }
      }
    }
  `;

  try {
    const res = await fetch(PRODUCT_HUNT_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    return data.data.posts.edges.map((e: any) => ({
      name: e.node.name,
      website_url: e.node.website,
      tagline: e.node.tagline,
      source: 'producthunt',
    }));
  } catch (err) {
    console.error('Product Hunt fetch failed:', err);
    return [];
  }
}

async function fetchGitHubTrending(): Promise<DiscoveredTool[]> {
  try {
    const res = await fetch('https://api.github.com/search/repositories?q=topic:artificial-intelligence+stars:>100+created:>2025-01-01&sort=stars&order=desc&per_page=10');
    const data = await res.json();
    return data.items?.map((item: any) => ({
      name: item.name,
      website_url: item.homepage || item.html_url,
      tagline: item.description || '',
      source: 'github',
    })) || [];
  } catch (err) {
    console.error('GitHub fetch failed:', err);
    return [];
  }
}

async function saveDiscovery(tools: DiscoveredTool[]): Promise<number> {
  let queued = 0;

  for (const tool of tools) {
    try {
      const slug = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      // Check if exists
      const { data: existing } = await supabase
        .from('tools')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) continue;

      // Queue for research
      const { error } = await supabase
        .from('agent_jobs')
        .insert({
          agent_type: 'research',
          status: 'pending',
          payload: {
            name: tool.name,
            website_url: tool.website_url,
            slug,
            source: tool.source,
            tagline: tool.tagline,
          },
        });

      if (!error) queued++;
    } catch (err) {
      console.error(`Failed to queue ${tool.name}:`, err);
    }
  }

  return queued;
}

export async function runDiscovery(): Promise<AgentResult> {
  const errors: string[] = [];

  const [phTools, ghTools] = await Promise.all([
    fetchProductHunt().catch(e => { errors.push(e.message); return []; }),
    fetchGitHubTrending().catch(e => { errors.push(e.message); return []; }),
  ]);

  const allTools = [...phTools, ...ghTools];
  const queued = await saveDiscovery(allTools);

  return {
    success: true,
    itemsProcessed: queued,
    errors,
  };
}

// Run if called directly
if (import.meta.main) {
  runDiscovery().then(console.log).catch(console.error);
}
