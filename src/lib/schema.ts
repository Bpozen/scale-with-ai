import { z } from 'zod';

export const ToolSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  website_url: z.string().url(),
  logo_url: z.string().url().nullable(),
  description_de: z.string(),
  description_en: z.string().nullable(),
  pricing_model: z.enum(['free', 'freemium', 'paid', 'enterprise']).nullable(),
  price_from: z.number().nullable(),
  price_currency: z.string().default('EUR'),
  has_free_tier: z.boolean().default(false),
  has_affiliate: z.boolean().default(false),
  affiliate_url: z.string().url().nullable(),
  gdpr_compliant: z.boolean().nullable(),
  dsgvo_status: z.enum(['voll-konform', 'teilweise', 'unklar', 'nicht-konform']).nullable(),
  server_location: z.string().nullable(),
  data_processing_agreement: z.boolean().default(false),
  founded_year: z.number().nullable(),
  headquarters: z.string().nullable(),
  is_published: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name_de: z.string(),
  name_en: z.string().nullable(),
  description_de: z.string().nullable(),
  sort_order: z.number().default(0),
});

export const BlogPostSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title_de: z.string(),
  excerpt_de: z.string().nullable(),
  content_de: z.string(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  published_at: z.string().datetime().nullable(),
  is_published: z.boolean().default(false),
});

export const AgentJobSchema = z.object({
  id: z.string().uuid(),
  agent_type: z.enum(['discovery', 'research', 'content', 'seo', 'maintenance']),
  status: z.enum(['pending', 'running', 'completed', 'failed']).default('pending'),
  payload: z.record(z.unknown()).nullable(),
  result: z.record(z.unknown()).nullable(),
  started_at: z.string().datetime().nullable(),
  completed_at: z.string().datetime().nullable(),
  error_message: z.string().nullable(),
});

export const AgentWebhookPayloadSchema = z.object({
  agent_type: z.enum(['discovery', 'research', 'content', 'seo', 'maintenance']),
  payload: z.record(z.unknown()),
  auth_token: z.string(),
});

export type Tool = z.infer<typeof ToolSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type BlogPost = z.infer<typeof BlogPostSchema>;
export type AgentJob = z.infer<typeof AgentJobSchema>;
