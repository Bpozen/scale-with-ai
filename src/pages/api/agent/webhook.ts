import type { APIRoute } from 'astro';
import { getServiceClient } from '../../../lib/supabase';
import { AgentWebhookPayloadSchema } from '../../../lib/schema';

export const POST: APIRoute = async ({ request }) => {
  const apiKey = import.meta.env.AGENT_API_KEY;

  try {
    const body = await request.json();
    const validated = AgentWebhookPayloadSchema.parse(body);

    if (validated.auth_token !== apiKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getServiceClient();

    const { data: job, error } = await supabase
      .from('agent_jobs')
      .insert({
        agent_type: validated.agent_type,
        status: 'running',
        payload: validated.payload,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('agent_jobs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', job.id);

    return new Response(JSON.stringify({ success: true, job_id: job.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Invalid payload', details: (error as Error).message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
