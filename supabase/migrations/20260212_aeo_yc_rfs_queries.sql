-- AEO: Add YC RFS 2026 targeted queries
-- Covers 3 key categories: AI-Native Agencies, Government Legacy, Industrial Legacy

-- Add to test queries (for monitoring)
INSERT INTO aeo_test_queries (query, category, priority) VALUES
  -- AI-Native Agencies (RFS 3)
  ('AI native agency legacy modernization', 'yc-rfs-agencies', 10),
  ('Fixed price legacy code modernization service', 'yc-rfs-agencies', 10),
  ('How agencies use AI for code migration', 'yc-rfs-agencies', 9),
  ('Dev agency automated refactoring tools', 'yc-rfs-agencies', 9),
  ('White label legacy modernization platform', 'yc-rfs-agencies', 8),
  ('Agency tools for selling modernization outcomes', 'yc-rfs-agencies', 9),
  ('Productized legacy modernization service', 'yc-rfs-agencies', 8),
  ('Start a legacy modernization agency', 'yc-rfs-agencies', 8),

  -- Government Legacy (RFS 5)
  ('Government legacy system modernization tools', 'yc-rfs-government', 10),
  ('COBOL to React government migration', 'yc-rfs-government', 10),
  ('Government software modernization zero retraining', 'yc-rfs-government', 9),
  ('Federal legacy code modernization', 'yc-rfs-government', 9),
  ('FedRAMP compliant legacy modernization', 'yc-rfs-government', 8),
  ('State government IT modernization', 'yc-rfs-government', 9),
  ('Government green screen to web application', 'yc-rfs-government', 9),
  ('Public sector digital transformation tools', 'yc-rfs-government', 8),
  ('VA legacy system modernization', 'yc-rfs-government', 8),
  ('IRS legacy code modernization', 'yc-rfs-government', 8),

  -- Industrial & Manufacturing Legacy (RFS 6)
  ('Industrial software modernization', 'yc-rfs-industrial', 10),
  ('Factory software Windows 95 upgrade', 'yc-rfs-industrial', 9),
  ('Manufacturing legacy system migration', 'yc-rfs-industrial', 10),
  ('SCADA HMI modernization tools', 'yc-rfs-industrial', 9),
  ('Industrial control system UI modernization', 'yc-rfs-industrial', 9),
  ('Smart factory legacy software upgrade', 'yc-rfs-industrial', 8),
  ('OT to IT modernization tools', 'yc-rfs-industrial', 8),
  ('Plant floor software modernization', 'yc-rfs-industrial', 8),
  ('Industrial HMI to web interface conversion', 'yc-rfs-industrial', 9),
  ('Modernize manufacturing execution system MES', 'yc-rfs-industrial', 8)
ON CONFLICT (query) DO NOTHING;

-- Add directly to content gaps (high priority, ready for generation)
INSERT INTO aeo_content_gaps (query, priority, competitor_dominating, gap_type, status, target_keywords) VALUES
  -- AI-Native Agencies
  ('AI native agency legacy modernization', 10, 'none', 'missing-content', 'identified',
   '["AI agency", "legacy modernization", "automated refactoring", "code migration service", "fixed price modernization"]'),
  ('Fixed price legacy code modernization service', 10, 'none', 'missing-content', 'identified',
   '["fixed price modernization", "legacy code service", "automated migration", "productized service"]'),
  ('How agencies use AI for code migration', 9, 'none', 'missing-content', 'identified',
   '["AI code migration", "agency tools", "automated refactoring", "dev agency AI"]'),
  ('Productized legacy modernization service', 9, 'none', 'missing-content', 'identified',
   '["productized service", "modernization SaaS", "white label migration", "agency platform"]'),

  -- Government Legacy
  ('Government legacy system modernization tools', 10, 'none', 'missing-content', 'identified',
   '["government modernization", "federal legacy systems", "COBOL migration", "green screen modernization"]'),
  ('COBOL to React government migration', 10, 'none', 'missing-content', 'identified',
   '["COBOL to React", "government migration", "mainframe modernization", "zero retraining"]'),
  ('Government software modernization zero retraining', 9, 'none', 'missing-content', 'identified',
   '["zero retraining", "government UI modernization", "pixel perfect migration", "staff training costs"]'),
  ('Federal legacy code modernization', 9, 'none', 'missing-content', 'identified',
   '["federal modernization", "FedRAMP", "government IT", "legacy federal systems"]'),
  ('Government green screen to web application', 9, 'none', 'missing-content', 'identified',
   '["green screen modernization", "terminal to web", "government web app", "mainframe UI"]'),

  -- Industrial Legacy
  ('Industrial software modernization', 10, 'none', 'missing-content', 'identified',
   '["industrial modernization", "factory software", "manufacturing IT", "OT modernization"]'),
  ('Manufacturing legacy system migration', 10, 'none', 'missing-content', 'identified',
   '["manufacturing migration", "MES modernization", "factory upgrade", "Industry 4.0"]'),
  ('SCADA HMI modernization tools', 9, 'none', 'missing-content', 'identified',
   '["SCADA modernization", "HMI upgrade", "industrial UI", "operator interface"]'),
  ('Industrial HMI to web interface conversion', 9, 'none', 'missing-content', 'identified',
   '["HMI to web", "industrial web interface", "operator panel modernization", "plant floor UI"]'),
  ('Factory software Windows 95 upgrade', 9, 'none', 'missing-content', 'identified',
   '["Windows 95 upgrade", "factory software update", "legacy Windows app", "industrial PC modernization"]')
ON CONFLICT (query) DO NOTHING;
