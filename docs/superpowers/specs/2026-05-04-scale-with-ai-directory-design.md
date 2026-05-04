# Scale With AI — KI Tools Directory (DACH Market)

## Document Info
- Date: 2026-05-04
- Status: Design Approved
- Domain: scale-with-ai.de

---

## 1. Overview

A German-language AI tools directory targeting the DACH (Germany, Austria, Switzerland) market. Run and maintained entirely by agents. Goal: professional product with predictable traffic, differentiated by DSGVO/GDPR compliance focus and native German content.

---

## 2. Goals

1. **Launch in 30 days**: 50+ tools seeded, SEO-optimized, live on scale-with-ai.de
2. **Agent-maintained**: 5 agents handle discovery, research, content, SEO, maintenance
3. **Predictable traffic**: SEO-first growth model targeting German keywords
4. **Revenue-ready**: Affiliate links, sponsored listings, newsletter ads from month 1

---

## 3. Architecture

### 3.1 Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Astro 5 + Tailwind + React islands | Free (Vercel) |
| Data | Supabase (PostgreSQL + REST API) | Free tier |
| Hosting | Vercel (Edge Network) | Free tier |
| Agent Runner | GitHub Actions (cron) | Free (2,000 min/mo) |
| Image Storage | Supabase Storage | Free tier |
| Analytics | Plausible (self-hosted) OR Vercel Analytics | Free |
| Newsletter | Buttondown or Loops | Free tier |
| Content Research | Firecrawl / Perplexity / Playwright | Free tiers |

### 3.2 Why Astro over Next.js

Astro ships zero JS by default. Directory = 90% content, minimal interactivity. Astro gives better Core Web Vitals, which Google.de weighs heavily. React islands only for: search, comparison, reviews.

### 3.3 Rendering Strategy

| Page Type | Strategy | Revalidation |
|-----------|----------|--------------|
| Tool detail | Static generation at build | Server Island revalidate on data change |
| Category | Static | Server Island revalidate on data change |
| Blog post | Static | Rebuild on new post via Vercel Deploy Hook |
| Search / Compare | React island (client-side) | N/A |
| Reviews | SSR via API route | Real-time |
| RSS feed | Static generation | On content change |

---

## 4. Data Model

### 4.1 Core Tables

```sql
-- AI tool profiles
create table tools (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  website_url text not null,
  logo_url text,
  description_de text not null,
  description_en text,
  pricing_model text check (pricing_model in ('free', 'freemium', 'paid', 'enterprise')),
  price_from decimal,
  price_currency text default 'EUR',
  has_free_tier boolean default false,
  has_affiliate boolean default false,
  affiliate_url text,
  gdpr_compliant boolean,
  dsgvo_status text check (dsgvo_status in ('voll-konform', 'teilweise', 'unklar', 'nicht-konform')),
  server_location text,
  data_processing_agreement boolean default false,
  founded_year int,
  headquarters text,
  is_published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_de text not null,
  name_en text,
  description_de text,
  sort_order int default 0
);

-- Many-to-many
create table tool_categories (
  tool_id uuid references tools(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (tool_id, category_id)
);

-- Feature tags
create table features (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_de text not null
);

-- Tool features
create table tool_features (
  tool_id uuid references tools(id) on delete cascade,
  feature_id uuid references features(id) on delete cascade,
  primary key (tool_id, feature_id)
);

-- Reviews (user + agent)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid references tools(id) on delete cascade,
  rating int check (rating between 1 and 5),
  content_de text,
  author_name text,
  is_agent_generated boolean default false,
  created_at timestamptz default now()
);

-- Blog posts
create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_de text not null,
  excerpt_de text,
  content_de text not null,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- Comparison articles
create table competitors (
  id uuid primary key default gen_random_uuid(),
  tool_a_id uuid references tools(id) on delete cascade,
  tool_b_id uuid references tools(id) on delete cascade,
  comparison_content_de text not null,
  winner_id uuid references tools(id),
  published_at timestamptz,
  created_at timestamptz default now()
);

-- Agent execution log
create table agent_jobs (
  id uuid primary key default gen_random_uuid(),
  agent_type text not null check (agent_type in ('discovery', 'research', 'content', 'seo', 'maintenance')),
  status text default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  payload jsonb,
  result jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text
);

-- A/B tests
create table ab_tests (
  id uuid primary key default gen_random_uuid(),
  page_type text not null,
  variant_a text not null,
  variant_b text not null,
  metric text not null,
  start_date timestamptz,
  end_date timestamptz,
  winner text,
  agent_job_id uuid references agent_jobs(id)
);
```

### 4.2 API Design

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| /api/tools | GET | None | List with filters (category, pricing, features) |
| /api/tools/[slug] | GET | None | Single tool with reviews |
| /api/compare | GET | None | Compare two tools (query: a, b) |
| /api/agent/webhook | POST | API key | Agent content ingestion |
| /api/agent/queue | POST | API key | Queue new tool for research |
| /api/feed.xml | GET | None | RSS for blog + new tools |
| /api/sitemap.xml | GET | None | Dynamic sitemap |

**Agent Interface Contract:**
All agents POST to `/api/agent/webhook` with:
```json
{
  "agent_type": "research",
  "payload": { ... },
  "auth_token": "AGENT_API_KEY"
}
```
Payload validated by Zod schema. Failed jobs retry 2x, then log error to `agent_jobs`.

---

## 5. Agent System

### 5.1 Agent Roles

**Agent 1: Discovery — "Finde neue Tools"**
- Trigger: Daily cron (GitHub Actions, 06:00 CET)
- Input: Product Hunt API, GitHub Trending, Twitter/X lists, German tech blogs (t3n, Gründerszene)
- Output: JSON array of candidate tools → POST to `/api/agent/queue`
- Logic: Skip if `slug` already exists. New tools queue for research.

**Agent 2: Research — "Recherchiere Tool-Details"**
- Trigger: On queued tool, or weekly batch (Sundays)
- Input: Tool website URL, pricing page, privacy policy, affiliate page
- Tools: Firecrawl (free tier), Playwright for JS sites
- Output: Populates `tools` table via API
- Quality gate: Real URLs only. No hallucinated pricing. Must find actual price or mark "auf Anfrage".

**Agent 3: Content — "Erstelle Inhalte"**
- Trigger: Weekly (Sundays), or batch >3 new tools
- Output: Category intros, comparison articles, blog posts
- Writes to: `blog_posts`, `competitors` tables
- Quality gate: Internal consistency check — all linked tools must exist in DB.

**Agent 4: SEO — "Optimiere für Traffic"**
- Trigger: Daily (03:00 CET)
- Output: Updates `meta_title`, `meta_description`, generates `sitemap.xml`, structured data
- Measures: SERP ranking via free API (DataForSEO or SerpAPI trial)
- Action: Auto-rewrite underperforming meta titles based on CTR data

**Agent 5: Maintenance — "Halte alles frisch"**
- Trigger: Daily (04:00 CET)
- Output: URL health checks (200 OK), pricing changes flagged, broken affiliate links reported
- Action: Updates `tools` status. Dead tools marked `is_published = false`. Opens GitHub issue for manual review if pricing changed >20%.

### 5.2 A/B Test + Improvement Loop

New table `ab_tests` tracks experiments.

**Tests managed by SEO Agent:**
| Test | Variants | Metric | Duration |
|------|----------|--------|----------|
| Homepage hero | "Finde KI Tools" / "KI Tools für Deutschland" / "DSGVO-konforme KI" | Click-through rate | 7 days |
| Category sort | Alphabetical / Most Popular / Free First | Time on page | 7 days |
| CTA button | "Jetzt testen" / "Kostenlos ausprobieren" / "Website besuchen" | Affiliate click rate | 7 days |

**Cycle:**
1. Agent creates test in `ab_tests`
2. Frontend serves variants (50/50 split via edge config or cookie)
3. Plausible tracks custom events
4. Agent analyzes after 7 days
5. Auto-applies winner
6. Logs decision to `agent_jobs`

---

## 6. Frontend Structure

### 6.1 Routes

```
/                           Homepage (featured tools, categories, latest blog)
/tools                      Tool listing (filters, search)
/tools/[slug]               Tool detail page
/categories                 Category listing
/categories/[slug]          Category detail (tools + description)
/compare                    Compare page (client-side)
/blog                       Blog listing
/blog/[slug]               Blog post
/rss.xml                    RSS feed
/sitemap.xml                XML sitemap
```

### 6.2 Components

| Component | Tech | Purpose |
|-----------|------|---------|
| ToolCard | Astro + Tailwind | Listing card with DSGVO badge |
| SearchBar | React island | Client-side filtering |
| CompareWidget | React island | Side-by-side tool comparison |
| DSGVOBadge | Astro | Visual compliance indicator |
| ReviewSection | React island + API | Dynamic reviews |
| AffiliateCTA | Astro | CTA with tracking params |

---

## 7. Traffic Strategy

### 7.1 SEO Targets

| Page Type | German Keywords | Content Source |
|-----------|-----------------|----------------|
| Tool detail | "[tool-name] KI Tool deutsch", "[tool-name] DSGVO" | Agent research |
| Category | "KI Tools für [Kategorie]", "Beste KI [Kategorie] deutsch" | Agent + curation |
| Comparison | "[A] vs [B] KI", "Vergleich [A] [B]" | Agent generated |
| Blog | "Neue KI Tools", "KI für [Branche]", "DSGVO KI" | Agent generated |
| GDPR guide | "DSGVO konforme KI Tools", "KI Tools EU Datenschutz" | Agent generated |

### 7.2 Structured Data

- `SoftwareApplication` on every tool page
- `FAQPage` on comparison pages
- `BreadcrumbList` on all pages
- `Organization` on homepage
- `Article` on blog posts

### 7.3 Content Differentiators

1. **DSGVO/Compliance badge system** — visual badges on every tool card. Users filter by compliance. No competitor does this well.
2. **German-language first** — native German descriptions, use cases, pricing in EUR.
3. **EU alternatives spotlight** — "European AI tools" category. DACH users want non-US data processing.
4. **Industry verticals** — "KI für Mittelstand", "KI für Steuerberater", "KI für E-Commerce DACH"

### 7.4 Launch Traffic Plan (30 Days)

| Week | Action |
|------|--------|
| 1 | Seed 50 tools, submit sitemap to GSC + Bing Webmaster |
| 2 | Publish 3 comparison articles, post to StartupSucht + Gründerszene Forum |
| 3 | Launch newsletter, post to LinkedIn German AI groups |
| 4 | Product Hunt launch, HN Show HN, Indie Hackers |

### 7.5 Traffic Growth Model

| Month | Target Traffic | Driver |
|-------|---------------|--------|
| 1 | 0-500 | Launch push |
| 2-3 | 500-2,000 | SEO indexing, long-tail ranking |
| 4-6 | 2,000-8,000 | Comparison pages, featured snippets |
| 6-12 | 8,000-20,000 | Domain authority, vendor backlinks |

---

## 8. Monetization

| Stream | Trigger | Integration |
|--------|---------|-------------|
| Affiliate links | Tool has affiliate program | `tools.affiliate_url` |
| Sponsored listings | Traffic >2k/mo | "Featured" badge + top placement |
| Newsletter ads | Subs >500 | Buttondown sponsor slots |
| Premium data API | Traffic >5k/mo | "Pro API" for tool vendors (later) |

---

## 9. GDPR/DSGVO Differentiation

Every tool gets:
- `gdpr_compliant` (boolean)
- `dsgvo_status` (voll-konform / teilweise / unklar / nicht-konform)
- `server_location` (EU / non-EU)
- `data_processing_agreement` (boolean)

Agent auto-researches from privacy policies. US directories skip this. DACH users care deeply.

---

## 10. Non-Goals (Out of Scope)

- User accounts / auth (Phase 2)
- Payment processing (use Gumroad/Buttondown)
- Multi-language (German only for launch)
- Mobile app
- Real-time chat

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Agent hallucinates pricing | Quality gate: must find real price page or mark "auf Anfrage" |
| Agent writes poor German | Use German LLM (e.g., Aleph Alpha API) or native speaker review before publish |
| Supabase free tier limits | Monitor row counts, archive old agent_jobs, compress images |
| GitHub Actions minutes exhausted | Batch jobs weekly instead of daily where possible |
| SEO takes too long | Launch push + newsletter + communities for immediate traffic |

---

## 12. Success Metrics

| Metric | 30-Day Target | 90-Day Target |
|--------|---------------|---------------|
| Tools in directory | 50 | 150 |
| Blog posts | 4 | 16 |
| Comparison articles | 3 | 12 |
| Monthly traffic | 500 | 2,000 |
| Newsletter subscribers | 100 | 500 |
| Agent jobs completed | 200 | 800 |
| Revenue | €0 | €50-200 (affiliate) |
