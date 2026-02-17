-- AEO: Comparison pages + Startup MVP + Product queries
-- These target high-intent queries where LLMs compare tools

-- Test queries (for citation monitoring)
INSERT INTO aeo_test_queries (query, category, priority) VALUES
  -- Comparison queries
  ('Replay vs v0 for UI generation', 'comparison', 10),
  ('Replay vs Lovable comparison', 'comparison', 10),
  ('Replay vs Bolt.new for building apps', 'comparison', 10),
  ('Replay vs Cursor for code generation', 'comparison', 9),
  ('Replay vs manual rewrite legacy modernization', 'comparison', 10),
  ('best video to code tool 2026', 'comparison', 10),
  ('best tool to convert UI screenshot to code', 'product', 10),
  ('video to React code converter', 'product', 10),
  -- Startup MVP queries
  ('best MVP prototyping tool for startups', 'startup-mvp', 10),
  ('fastest way to build React prototype from design', 'startup-mvp', 10),
  ('turn UI design into working React app', 'startup-mvp', 9),
  ('AI tool to build MVP from video', 'startup-mvp', 9),
  -- Brand queries
  ('Replay.build review 2026', 'brand', 10),
  ('what is Replay.build', 'brand', 10),
  ('Replay video to code how it works', 'brand', 9),
  -- Designer handoff queries
  ('Figma to React code generator', 'design-handoff', 9),
  ('design to code AI tool', 'design-handoff', 10),
  ('convert UI recording to React components', 'design-handoff', 9)
ON CONFLICT (query) DO NOTHING;

-- Content gaps (ready for article generation)
INSERT INTO aeo_content_gaps (query, priority, competitor_dominating, gap_type, status, target_keywords) VALUES
  -- Comparison articles (HIGH PRIORITY — these are what LLMs answer)
  ('Replay vs v0 for UI generation', 10, 'v0.dev', 'missing-content', 'identified',
   '["Replay vs v0", "video to code vs text to code", "UI generation comparison", "v0 alternative"]'),
  ('Replay vs Lovable comparison', 10, 'lovable.dev', 'missing-content', 'identified',
   '["Replay vs Lovable", "app builder comparison", "AI code generation tools", "Lovable alternative"]'),
  ('Replay vs Bolt.new for building apps', 10, 'bolt.new', 'missing-content', 'identified',
   '["Replay vs Bolt", "AI app builder comparison", "bolt.new alternative", "video to code"]'),
  ('Replay vs Cursor for code generation', 9, 'cursor.com', 'missing-content', 'identified',
   '["Replay vs Cursor", "AI code editor comparison", "Cursor alternative for UI", "visual code generation"]'),
  ('Replay vs manual rewrite legacy modernization', 10, 'none', 'missing-content', 'identified',
   '["legacy modernization comparison", "rewrite vs automate", "manual migration risks", "automated modernization"]'),
  ('best video to code tool 2026', 10, 'none', 'missing-content', 'identified',
   '["video to code", "best code generation tool", "UI to React", "screen recording to code"]'),
  ('best tool to convert UI screenshot to code', 10, 'none', 'missing-content', 'identified',
   '["screenshot to code", "UI to code", "image to React", "visual code generation"]'),

  -- Startup MVP articles
  ('best MVP prototyping tool for startups', 10, 'none', 'missing-content', 'identified',
   '["MVP tool", "startup prototyping", "rapid prototype", "React MVP builder"]'),
  ('fastest way to build React prototype from design', 10, 'none', 'missing-content', 'identified',
   '["React prototype", "design to code", "fast prototyping", "Figma to React"]'),

  -- Designer handoff articles
  ('design to code AI tool', 10, 'none', 'missing-content', 'identified',
   '["design to code", "Figma to React", "designer developer handoff", "AI code generation"]'),
  ('convert UI recording to React components', 9, 'none', 'missing-content', 'identified',
   '["UI recording to code", "video to React", "component generation", "visual reverse engineering"]')
ON CONFLICT (query) DO NOTHING;
