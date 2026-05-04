import { supabase } from './lib/supabase';
import type { AgentResult } from './lib/types';

export async function runMaintenance(): Promise<AgentResult> {
  const errors: string[] = [];
  let checked = 0;
  let dead = 0;

  try {
    const { data: tools } = await supabase.from('tools').select('*').eq('is_published', true).limit(50);
    if (!tools) return { success: true, itemsProcessed: 0, errors };

    for (const tool of tools) {
      try {
        const res = await fetch(tool.website_url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(10000),
        });

        checked++;

        if (res.status >= 400) {
          await supabase.from('tools').update({ is_published: false }).eq('id', tool.id);
          dead++;
        }
      } catch {
        // Transient network error — don't unpublish, just count as checked
        checked++;
        console.log(`Transient error checking ${tool.name}, skipping unpublish`);
      }
    }
  } catch (err) {
    errors.push(`Maintenance failed: ${err}`);
  }

  return { success: errors.length === 0, itemsProcessed: checked, errors };
}

if (import.meta.main) {
  runMaintenance().then(console.log).catch(console.error);
}
