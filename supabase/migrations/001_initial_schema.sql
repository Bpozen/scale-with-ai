-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tools table
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  logo_url TEXT,
  description_de TEXT NOT NULL,
  description_en TEXT,
  pricing_model TEXT CHECK (pricing_model IN ('free', 'freemium', 'paid', 'enterprise')),
  price_from DECIMAL,
  price_currency TEXT DEFAULT 'EUR',
  has_free_tier BOOLEAN DEFAULT FALSE,
  has_affiliate BOOLEAN DEFAULT FALSE,
  affiliate_url TEXT,
  gdpr_compliant BOOLEAN,
  dsgvo_status TEXT CHECK (dsgvo_status IN ('voll-konform', 'teilweise', 'unklar', 'nicht-konform')),
  server_location TEXT,
  data_processing_agreement BOOLEAN DEFAULT FALSE,
  founded_year INT,
  headquarters TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_de TEXT NOT NULL,
  name_en TEXT,
  description_de TEXT,
  sort_order INT DEFAULT 0
);

-- Many-to-many: tools <> categories
CREATE TABLE tool_categories (
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, category_id)
);

-- Feature tags
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_de TEXT NOT NULL
);

-- Many-to-many: tools <> features
CREATE TABLE tool_features (
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, feature_id)
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  content_de TEXT,
  author_name TEXT,
  is_agent_generated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title_de TEXT NOT NULL,
  excerpt_de TEXT,
  content_de TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  published_at TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comparison articles
CREATE TABLE competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_a_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  tool_b_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  comparison_content_de TEXT NOT NULL,
  winner_id UUID REFERENCES tools(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent job log
CREATE TABLE agent_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT NOT NULL CHECK (agent_type IN ('discovery', 'research', 'content', 'seo', 'maintenance')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  payload JSONB,
  result JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT
);

-- A/B tests
CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type TEXT NOT NULL,
  variant_a TEXT NOT NULL,
  variant_b TEXT NOT NULL,
  metric TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  winner TEXT,
  agent_job_id UUID REFERENCES agent_jobs(id)
);

-- Indexes for performance
CREATE INDEX idx_tools_slug ON tools(slug);
CREATE INDEX idx_tools_published ON tools(is_published);
CREATE INDEX idx_tools_dsgvo ON tools(dsgvo_status);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(is_published, published_at);
CREATE INDEX idx_agent_jobs_status ON agent_jobs(status);
CREATE INDEX idx_agent_jobs_type ON agent_jobs(agent_type);

-- Updated at trigger for tools
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tools_updated_at BEFORE UPDATE ON tools
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
