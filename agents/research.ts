import { supabase } from './lib/supabase';
import type { AgentResult } from './lib/types';

interface ResearchPayload {
  name: string;
  website_url: string;
  slug: string;
  tagline: string;
}

async function scrapeWebsite(url: string): Promise<{ title: string; description: string; hasGerman: boolean }> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ScaleWithAI/1.0)' } });
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta[^\u003e]*name=["']description["'][^\u003e]*content=["']([^"']*)["']/i);

    return {
      title: titleMatch?.[1]?.trim() || '',
      description: descMatch?.[1]?.trim() || '',
      hasGerman: html.toLowerCase().includes('deutsch') || html.toLowerCase().includes('german'),
    };
  } catch {
    return { title: '', description: '', hasGerman: false };
  }
}

function checkGDPR(html: string): { compliant: boolean | null; status: string; serverLocation: string | null } {
  const lower = html.toLowerCase();

  // Heuristic checks
  const hasGDPR = lower.includes('gdpr') || lower.includes('dsgvo') || lower.includes('datenschutz');
  const hasEU = lower.includes('eu server') || lower.includes('europe') || lower.includes('germany');
  const hasPrivacy = lower.includes('privacy policy') || lower.includes('datenschutzerklärung');

  if (hasGDPR && hasEU) {
    return { compliant: true, status: 'teilweise', serverLocation: 'EU' };
  }
  if (hasEU) {
    return { compliant: null, status: 'unklar', serverLocation: 'EU' };
  }
  if (hasGDPR) {
    return { compliant: false, status: 'teilweise', serverLocation: 'USA' };
  }

  return { compliant: false, status: 'unklar', serverLocation: null };
}

function extractPricing(html: string): { model: string | null; from: number | null } {
  const lower = html.toLowerCase();

  if (lower.includes('free') && lower.includes('paid')) return { model: 'freemium', from: null };
  if (lower.includes('free') || lower.includes('kostenlos')) return { model: 'free', from: 0 };
  if (lower.includes('enterprise') || lower.includes('contact sales')) return { model: 'enterprise', from: null };
  if (lower.includes('pricing') || lower.includes('preis')) return { model: 'paid', from: null };

  return { model: null, from: null };
}

async function researchTool(payload: ResearchPayload): Promise<boolean> {
  const scraped = await scrapeWebsite(payload.website_url);
  const gdpr = checkGDPR(scraped.description + scraped.title);
  const pricing = extractPricing(scraped.description + scraped.title);

  const description_de = scraped.hasGerman
    ? scraped.description
    : `${payload.name} ist ein KI-Tool. ${scraped.description || payload.tagline || ''}`;

  const { error } = await supabase.from('tools').insert({
    slug: payload.slug,
    name: payload.name,
    website_url: payload.website_url,
    description_de: description_de.slice(0, 500),
    description_en: scraped.description.slice(0, 500),
    pricing_model: pricing.model,
    price_from: pricing.from,
    has_free_tier: pricing.model === 'free' || pricing.model === 'freemium',
    gdpr_compliant: gdpr.compliant,
    dsgvo_status: gdpr.status,
    server_location: gdpr.serverLocation,
    is_published: true,
  });

  if (error) {
    console.error(`Failed to insert ${payload.slug}:`, error);
    return false;
  }

  return true;
}

export async function runResearch(): Promise<AgentResult> {
  const { data: jobs, error } = await supabase
    .from('agent_jobs')
    .select('*')
    .eq('agent_type', 'research')
    .eq('status', 'pending')
    .limit(10);

  if (error || !jobs || jobs.length === 0) {
    return { success: true, itemsProcessed: 0, errors: error ? [error.message] : [] };
  }

  const errors: string[] = [];
  let processed = 0;

  for (const job of jobs) {
    try {
      await supabase.from('agent_jobs').update({ status: 'running', started_at: new Date().toISOString() }).eq('id', job.id);

      const payload = job.payload as ResearchPayload;
      const success = await researchTool(payload);

      if (success) {
        processed++;
        await supabase.from('agent_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id);
      } else {
        errors.push(`Failed: ${payload.name}`);
        await supabase.from('agent_jobs').update({ status: 'failed', error_message: 'Insert failed' }).eq('id', job.id);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Exception: ${message}`);
      await supabase.from('agent_jobs').update({ status: 'failed', error_message: message }).eq('id', job.id);
    }
  }

  return { success: errors.length === 0, itemsProcessed: processed, errors };
}

if (import.meta.main) {
  runResearch().then(console.log).catch(console.error);
}
