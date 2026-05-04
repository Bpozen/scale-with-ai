import type { APIRoute } from 'astro';
import { compareTools } from '../../lib/api';

export const GET: APIRoute = async ({ url }) => {
  const a = url.searchParams.get('a');
  const b = url.searchParams.get('b');

  if (!a || !b) {
    return new Response(JSON.stringify({ error: 'Missing parameters: a and b required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const result = await compareTools(a, b);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to compare tools' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
