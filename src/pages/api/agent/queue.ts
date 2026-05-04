import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.AGENT_API_KEY;
  const authHeader = request.headers.get('Authorization');

  if (authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const supabase = getServiceClient();

    const { data: job, error } = await supabase
      .from('agent_jobs')
      .insert({
        agent_type: 'research',
        status: 'pending',
        payload: body,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, job_id: job.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to queue', details: (error as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
