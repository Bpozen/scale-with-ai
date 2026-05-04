import type { APIRoute } from 'astro';
import { getTools } from '../../lib/api';

export const GET: APIRoute = async ({ url }) => {
  const category = url.searchParams.get('category') || undefined;
  const pricing = url.searchParams.get('pricing') || undefined;
  const dsgvo = url.searchParams.get('dsgvo') || undefined;
  const search = url.searchParams.get('search') || undefined;

  try {
    const tools = await getTools({ category, pricing, dsgvo, search });
    return new Response(JSON.stringify(tools), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch tools' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
