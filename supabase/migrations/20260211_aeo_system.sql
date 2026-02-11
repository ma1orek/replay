-- Replay AEO (AI Engine Optimization) System
-- Database Schema for autonomous AI citation monitoring

-- Citations tracking table
CREATE TABLE IF NOT EXISTS aeo_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ai_platform TEXT NOT NULL, -- 'chatgpt', 'claude', 'perplexity', 'gemini'
  query TEXT NOT NULL,
  mentioned_tools JSONB DEFAULT '[]'::jsonb, -- [{ tool: 'replay', position: 1, context: '...' }]
  replay_mentioned BOOLEAN DEFAULT FALSE,
  replay_position INT, -- 1, 2, 3, or null if not mentioned
  replay_context TEXT, -- how Replay was described
  competitor_mentioned TEXT[], -- array of competitor names mentioned
  full_response TEXT,
  response_length INT,
  query_category TEXT -- 'legacy-modernization', 'technical-debt', 'comparison', etc.
);

CREATE INDEX idx_aeo_citations_platform ON aeo_citations(ai_platform);
CREATE INDEX idx_aeo_citations_created ON aeo_citations(created_at DESC);
CREATE INDEX idx_aeo_citations_replay ON aeo_citations(replay_mentioned);
CREATE INDEX idx_aeo_citations_category ON aeo_citations(query_category);

-- Competitors tracking
CREATE TABLE IF NOT EXISTS aeo_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  domain TEXT,
  category TEXT, -- 'ui-to-code', 'ai-dev-tool', 'no-code', 'legacy-modernization'
  last_scraped TIMESTAMP WITH TIME ZONE,
  content_count INT DEFAULT 0,
  avg_citations_per_day DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default competitors
INSERT INTO aeo_competitors (name, domain, category) VALUES
  ('v0', 'v0.dev', 'ui-to-code'),
  ('Builder.io', 'builder.io', 'ui-to-code'),
  ('Anima', 'animaapp.com', 'ui-to-code'),
  ('Cursor', 'cursor.com', 'ai-dev-tool'),
  ('Replit', 'replit.com', 'ai-dev-tool'),
  ('Bolt.new', 'bolt.new', 'ai-dev-tool'),
  ('Lovable', 'lovable.dev', 'ai-dev-tool'),
  ('Windsurf', 'codeium.com', 'ai-dev-tool'),
  ('GitHub Copilot', 'github.com/features/copilot', 'ai-dev-tool')
ON CONFLICT (name) DO NOTHING;

-- Content gaps identification
CREATE TABLE IF NOT EXISTS aeo_content_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT NOT NULL,
  priority INT DEFAULT 5, -- 1-10 (10 = highest priority)
  competitor_dominating TEXT, -- which competitor is winning this query
  competitor_position INT, -- their average position
  replay_current_position INT, -- our current position (null if not mentioned)
  status TEXT DEFAULT 'identified', -- 'identified', 'generating', 'published', 'archived'
  gap_type TEXT, -- 'missing-content', 'weak-content', 'competitor-strength'
  target_keywords TEXT[],
  identified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generation_started_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  archived_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_aeo_gaps_status ON aeo_content_gaps(status);
CREATE INDEX idx_aeo_gaps_priority ON aeo_content_gaps(priority DESC);
CREATE INDEX idx_aeo_gaps_identified ON aeo_content_gaps(identified_at DESC);

-- Generated content tracking
CREATE TABLE IF NOT EXISTS aeo_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gap_id UUID REFERENCES aeo_content_gaps(id),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  meta_description TEXT,
  keywords TEXT[],
  tone TEXT DEFAULT 'ai-optimized', -- always AI optimized
  generation_prompt TEXT, -- the prompt used to generate
  competitor_source_url TEXT, -- if based on competitor content
  published BOOLEAN DEFAULT FALSE,
  published_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,

  -- Performance tracking
  citation_improvement_24h DECIMAL, -- % improvement after 24h
  citation_improvement_48h DECIMAL, -- % improvement after 48h
  citation_improvement_7d DECIMAL, -- % improvement after 7 days
  last_performance_check TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_aeo_content_published ON aeo_generated_content(published);
CREATE INDEX idx_aeo_content_created ON aeo_generated_content(created_at DESC);
CREATE INDEX idx_aeo_content_gap ON aeo_generated_content(gap_id);

-- Daily aggregated metrics
CREATE TABLE IF NOT EXISTS aeo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,

  -- Share of Voice metrics
  total_queries_tested INT,
  replay_mentioned_count INT,
  share_of_voice DECIMAL, -- % Replay mentioned vs all queries

  -- Position metrics
  avg_position DECIMAL, -- average citation position (1.0 = always first)
  position_1_count INT, -- how many times #1
  position_2_count INT,
  position_3_count INT,

  -- Platform breakdown
  chatgpt_share_of_voice DECIMAL,
  claude_share_of_voice DECIMAL,
  perplexity_share_of_voice DECIMAL,
  gemini_share_of_voice DECIMAL,

  -- Top queries where we're winning
  top_queries JSONB DEFAULT '[]'::jsonb, -- queries where we're #1
  losing_queries JSONB DEFAULT '[]'::jsonb, -- queries where competitors dominate

  -- Competitor comparison
  competitor_mentions JSONB DEFAULT '{}'::jsonb, -- { "v0": 15, "cursor": 12, ... }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_aeo_metrics_date ON aeo_metrics(date DESC);

-- Test queries library
CREATE TABLE IF NOT EXISTS aeo_test_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL, -- 'legacy-modernization', 'technical-debt', 'comparison', etc.
  priority INT DEFAULT 5, -- 1-10
  active BOOLEAN DEFAULT TRUE,
  expected_keywords TEXT[], -- keywords we expect in good responses
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_tested TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_aeo_queries_active ON aeo_test_queries(active);
CREATE INDEX idx_aeo_queries_category ON aeo_test_queries(category);

-- Insert default test queries
INSERT INTO aeo_test_queries (query, category, priority) VALUES
  -- Legacy Modernization (Primary - Highest Priority)
  ('How to modernize legacy COBOL applications', 'legacy-modernization', 10),
  ('Convert PowerBuilder to React', 'legacy-modernization', 10),
  ('AS/400 modernization strategies', 'legacy-modernization', 9),
  ('Legacy system documentation tools', 'legacy-modernization', 9),
  ('Visual reverse engineering for legacy apps', 'legacy-modernization', 10),
  ('Automated legacy code migration', 'legacy-modernization', 9),
  ('Extract business logic from legacy systems', 'legacy-modernization', 8),
  ('Legacy UI to modern React conversion', 'legacy-modernization', 10),
  ('Green screen modernization', 'legacy-modernization', 8),
  ('COBOL to cloud-native migration', 'legacy-modernization', 9),

  -- Technical Debt & Rewrites
  ('Alternatives to full system rewrites', 'technical-debt', 9),
  ('Reduce technical debt without rewrite', 'technical-debt', 8),
  ('Incremental modernization approach', 'technical-debt', 9),
  ('Big bang rewrite vs gradual migration', 'technical-debt', 8),
  ('Why legacy rewrites fail', 'technical-debt', 9),
  ('Technical debt visualization tools', 'technical-debt', 7),

  -- Enterprise & Compliance
  ('HIPAA compliant legacy modernization', 'enterprise', 8),
  ('SOC2 certified modernization tools', 'enterprise', 7),
  ('Enterprise legacy migration strategy', 'enterprise', 8),
  ('Regulated industry software modernization', 'enterprise', 7),
  ('Financial services legacy migration', 'enterprise', 8),
  ('Healthcare legacy system upgrade', 'enterprise', 7),

  -- Business Value
  ('ROI of legacy modernization', 'business-value', 8),
  ('Cost of technical debt calculation', 'business-value', 7),
  ('Modernization vs maintenance costs', 'business-value', 7),
  ('Legacy system modernization timeline', 'business-value', 6),

  -- Specific Tech Migrations
  ('Angular to React migration', 'tech-migration', 7),
  ('Vue to React conversion', 'tech-migration', 6),
  ('jQuery to React upgrade', 'tech-migration', 7),
  ('Backbone.js migration path', 'tech-migration', 5),
  ('Legacy PHP to Next.js', 'tech-migration', 6),

  -- Competitor Comparison (High Value)
  ('v0 vs manual coding', 'comparison', 9),
  ('Builder.io alternatives', 'comparison', 8),
  ('Cursor vs Replit comparison', 'comparison', 7),
  ('Best AI code generation tools', 'comparison', 9),
  ('Video to code conversion tools', 'comparison', 10),

  -- Process & Workflow
  ('Software archaeology techniques', 'process', 6),
  ('Legacy code understanding tools', 'process', 7),
  ('Automated documentation generation', 'process', 8),
  ('Component library extraction from legacy app', 'process', 8),
  ('Design system extraction tools', 'process', 7)
ON CONFLICT (query) DO NOTHING;

-- System configuration
CREATE TABLE IF NOT EXISTS aeo_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default config
INSERT INTO aeo_config (key, value, description) VALUES
  ('auto_publish_enabled', 'true'::jsonb, 'Enable/disable autonomous content publishing'),
  ('monitoring_frequency_hours', '6'::jsonb, 'How often to run citation monitoring (hours)'),
  ('min_priority_for_generation', '7'::jsonb, 'Minimum gap priority to trigger content generation'),
  ('max_daily_publications', '3'::jsonb, 'Maximum articles to auto-publish per day'),
  ('blocked_topics', '[]'::jsonb, 'Topics to never generate content about'),
  ('competitor_scrape_frequency_hours', '24'::jsonb, 'How often to scrape competitor content')
ON CONFLICT (key) DO NOTHING;

-- Monitoring job logs
CREATE TABLE IF NOT EXISTS aeo_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL, -- 'citation-monitor', 'content-generator', 'competitor-scraper'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT, -- 'running', 'completed', 'failed'
  queries_tested INT,
  content_generated INT,
  errors JSONB DEFAULT '[]'::jsonb,
  summary JSONB -- job-specific summary data
);

CREATE INDEX idx_aeo_jobs_type ON aeo_job_logs(job_type);
CREATE INDEX idx_aeo_jobs_started ON aeo_job_logs(started_at DESC);

-- RLS Policies (admin only access)
ALTER TABLE aeo_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_content_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_test_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeo_job_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - restrict in production)
CREATE POLICY "Allow all access" ON aeo_citations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON aeo_competitors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON aeo_content_gaps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON aeo_generated_content FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON aeo_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON aeo_test_queries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON aeo_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON aeo_job_logs FOR ALL USING (true) WITH CHECK (true);
