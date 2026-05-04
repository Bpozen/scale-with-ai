import { supabase } from './lib/supabase';
import type { AgentResult } from './lib/types';

async function generateCategoryIntro(category: { slug: string; name_de: string }): Promise<string> {
  return `Die besten ${category.name_de} im Überblick. Vergleiche Funktionen, Preise und DSGVO-Konformität.`;
}

async function generateComparison(toolA: any, toolB: any): Promise<string> {
  return `# ${toolA.name} vs ${toolB.name}

  Beide Tools bieten KI-gestützte Funktionen für deutsches Business. ${toolA.name} ist bekannt für ${toolA.description_de?.slice(0, 100) || ''}. ${toolB.name} punktet mit ${toolB.description_de?.slice(0, 100) || ''}.

## Preisvergleich
- **${toolA.name}**: ${toolA.pricing_model || 'Unbekannt'}
- **${toolB.name}**: ${toolB.pricing_model || 'Unbekannt'}

## DSGVO-Konformität
- **${toolA.name}**: ${toolA.dsgvo_status || 'Unklar'}
- **${toolB.name}**: ${toolB.dsgvo_status || 'Unklar'}

## Fazit
Die Wahl hängt von deinen spezifischen Anforderungen ab.`;
}

export async function runContent(): Promise<AgentResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    const { data: categories } = await supabase.from('categories').select('*');
    if (categories) {
      for (const cat of categories) {
        if (!cat.description_de) {
          const intro = await generateCategoryIntro(cat);
          await supabase.from('categories').update({ description_de: intro }).eq('id', cat.id);
          processed++;
        }
      }
    }
  } catch (err) {
    errors.push(`Category update failed: ${err}`);
  }

  try {
    const { data: tools } = await supabase.from('tools').select('*').eq('is_published', true).limit(20);
    if (tools && tools.length >= 2) {
      for (let i = 0; i < Math.min(tools.length - 1, 3); i++) {
        const a = tools[i];
        const b = tools[i + 1];

        const { data: existing } = await supabase
          .from('competitors')
          .select('id')
          .or(`and(tool_a_id.eq.${a.id},tool_b_id.eq.${b.id}),and(tool_a_id.eq.${b.id},tool_b_id.eq.${a.id})`)
          .maybeSingle();

        if (!existing) {
          const content = await generateComparison(a, b);
          await supabase.from('competitors').insert({
            tool_a_id: a.id,
            tool_b_id: b.id,
            comparison_content_de: content,
            published_at: new Date().toISOString(),
          });
          processed++;
        }
      }
    }
  } catch (err) {
    errors.push(`Comparison generation failed: ${err}`);
  }

  return { success: errors.length === 0, itemsProcessed: processed, errors };
}

if (import.meta.main) {
  runContent().then(console.log).catch(console.error);
}
