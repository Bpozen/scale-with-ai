import type { APIRoute } from 'astro';
import { getToolBySlug } from '../../../lib/api';

export const GET: APIRoute = async ({ params }) => {
  const tool = await getToolBySlug(params.slug!);

  if (!tool) {
    return new Response(JSON.stringify({ error: 'Tool not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(tool), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
