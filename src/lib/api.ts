import { supabase } from './supabase';
import type { Tool, Category, BlogPost } from './schema';

export async function getTools(filters?: {
  category?: string;
  pricing?: string;
  dsgvo?: string;
  search?: string;
}): Promise<Tool[]> {
  let query = supabase
    .from('tools')
    .select('*, categories:tool_categories(category:categories(*))')
    .eq('is_published', true);

  if (filters?.category) {
    query = query.eq('tool_categories.category.slug', filters.category);
  }
  if (filters?.pricing) {
    query = query.eq('pricing_model', filters.pricing);
  }
  if (filters?.dsgvo) {
    query = query.eq('dsgvo_status', filters.dsgvo);
  }
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`);
  }

  const { data, error } = await query.order('name');
  if (error) throw error;
  return data || [];
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
  const { data, error } = await supabase
    .from('tools')
    .select('*, categories:tool_categories(category:categories(*)), features:tool_features(feature:features(*)), reviews(*)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) return null;
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order');

  if (error) throw error;
  return data || [];
}

export async function getCategoryBySlug(slug: string): Promise<{ category: Category; tools: Tool[] } | null> {
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (catError || !category) return null;

  const { data: tools, error: toolError } = await supabase
    .from('tools')
    .select('*, tool_categories!inner(*)')
    .eq('tool_categories.category_id', category.id)
    .eq('is_published', true)
    .order('name');

  if (toolError) throw toolError;
  return { category, tools: tools || [] };
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error) return null;
  return data;
}

export async function compareTools(a: string, b: string): Promise<{ toolA: Tool | null; toolB: Tool | null; comparison: unknown | null }> {
  const [toolA, toolB] = await Promise.all([
    getToolBySlug(a),
    getToolBySlug(b),
  ]);

  if (!toolA || !toolB) return { toolA, toolB, comparison: null };

  const { data: comparison } = await supabase
    .from('competitors')
    .select('*')
    .or(`and(tool_a_id.eq.${toolA.id},tool_b_id.eq.${toolB.id}),and(tool_a_id.eq.${toolB.id},tool_b_id.eq.${toolA.id})`)
    .single();

  return { toolA, toolB, comparison };
}
