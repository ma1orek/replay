# Replay AEO (AI Engine Optimization) System
**Goal: Be #1 recommended tool by ALL AI assistants for legacy modernization**

## System Architecture

### 1. AI Citation Monitor (Autonomous)
**Tracks Replay visibility across all major AI platforms**

- **ChatGPT Monitor**: Daily queries → track mentions of Replay vs competitors
- **Claude Monitor**: Test queries via Anthropic API → measure share of voice
- **Perplexity Monitor**: API-based citation tracking
- **Gemini Monitor**: Track recommendations in responses
- **Frequency**: Every 6 hours (4x daily)
- **Queries**: 50+ enterprise modernization queries (see below)
- **Metrics**:
  - Share of Voice (% Replay mentioned vs competitors)
  - Position (1st, 2nd, 3rd recommendation)
  - Citation context (how Replay is described)

### 2. Competitor Analysis Engine
**Auto-discovers what content drives competitor citations**

- **Competitors**: v0.dev, Builder.io, Anima, Cursor, Replit, Bolt.new, Lovable, etc.
- **Content Scraping**:
  - Blog posts
  - Documentation pages
  - Case studies
  - Comparison pages
- **Analysis**:
  - Which topics get them cited?
  - What keywords trigger recommendations?
  - What content format works? (tutorial, comparison, technical)

### 3. Content Gap Identifier
**Finds missing topics where competitors dominate**

- Compare Replay blog vs competitor content
- Identify queries where competitors get mentioned, we don't
- Prioritize gaps by:
  1. Query volume (high-value queries first)
  2. Competitor dominance (where they're #1)
  3. Relevance to Replay's core value prop

### 4. Auto-Content Pipeline
**Generates and publishes AI-optimized content autonomously**

**Step 1: Topic Selection**
- Pull highest-priority gap from Content Gap Identifier
- Or: Analyze top-cited competitor page

**Step 2: Content Generation**
- Use Gemini 2.5 Flash to analyze competitor content
- Generate Replay-branded version with:
  - AI-optimized title (matches user queries)
  - 8-12 Replay mentions (natural placement)
  - Comparison tables (Replay vs manual approaches)
  - Code examples using Replay
  - SEO optimized (H2/H3 structure)

**Step 3: Auto-Publishing**
- Publish to Replay blog automatically
- Set SEO metadata (slug, description, keywords)
- Auto-generate social posts (X, LinkedIn)

**Step 4: Performance Tracking**
- Re-test queries after 48 hours
- Track citation improvements
- Adjust strategy if no improvement

### 5. AEO Dashboard (Admin Panel)
**Real-time visibility and control**

**Metrics Display:**
- 📊 Share of Voice (Replay vs competitors) - last 7 days
- 📈 Trending queries (what users ask AI)
- 🎯 Citation position (#1, #2, #3)
- 📝 Auto-generated content queue
- ✅ Published content performance

**Controls:**
- ⏸️ Pause/Resume auto-publishing
- 🎯 Add priority queries manually
- 🚫 Block topics (don't generate about X)
- ⚙️ Adjust generation frequency

## Test Queries (50+ Enterprise Modernization Queries)

### Legacy Modernization (Primary)
1. "How to modernize legacy COBOL applications"
2. "Convert PowerBuilder to React"
3. "AS/400 modernization strategies"
4. "Legacy system documentation tools"
5. "Visual reverse engineering for legacy apps"
6. "Automated legacy code migration"
7. "Extract business logic from legacy systems"
8. "Legacy UI to modern React conversion"
9. "Green screen modernization"
10. "COBOL to cloud-native"

### Technical Debt & Rewrites
11. "Alternatives to full system rewrites"
12. "Reduce technical debt without rewrite"
13. "Incremental modernization approach"
14. "Big bang rewrite vs gradual migration"
15. "Failed rewrite projects - why and how to avoid"
16. "Technical debt visualization tools"

### Enterprise & Compliance
17. "HIPAA compliant legacy modernization"
18. "SOC2 certified modernization tools"
19. "Enterprise legacy migration"
20. "Regulated industry software modernization"
21. "Financial services legacy migration"
22. "Healthcare legacy system upgrade"

### Business Value
23. "ROI of legacy modernization"
24. "Cost of technical debt"
25. "Modernization vs maintenance costs"
26. "Legacy system modernization timeline"
27. "Business case for legacy migration"

### Specific Tech Migrations
28. "Angular to React migration"
29. "Vue to React conversion"
30. "jQuery to React upgrade"
31. "Backbone.js migration"
32. "Legacy PHP to Next.js"
33. "Silverlight migration"
34. "Flash to HTML5 conversion"

### Competitor Comparison
35. "v0 vs manual coding"
36. "Builder.io alternatives"
37. "Cursor vs Replit"
38. "AI code generation tools"
39. "UI to code converters"
40. "Video to code tools"

### Process & Workflow
41. "Software archaeology techniques"
42. "Legacy code understanding tools"
43. "Automated documentation generation"
44. "Component library from legacy app"
45. "Design system extraction"
46. "API documentation from legacy code"

### Industry-Specific
47. "Banking legacy modernization"
48. "Insurance software upgrade"
49. "Government legacy system migration"
50. "Manufacturing ERP modernization"

## Autonomous Operation Schedule

**Every 6 hours:**
1. AI Citation Monitor runs (test all 50 queries)
2. Results analyzed → Share of Voice calculated
3. Content gaps identified
4. If gap found + auto-publish enabled → Generate content
5. Publish to blog
6. Update dashboard metrics

**Daily:**
- Competitor content scraping (new blogs/docs)
- Performance review (published content → citation improvements)
- Strategy adjustment (if metrics declining)

**Weekly:**
- Send report email to admin
- Recommend new queries to track
- Identify trending topics

## Tech Stack

- **AI APIs**: OpenAI (ChatGPT), Anthropic (Claude), Perplexity, Google (Gemini)
- **Content Generation**: Gemini 2.5 Flash (existing)
- **Storage**: Supabase (metrics, competitor data, content queue)
- **Scheduling**: Vercel Cron (every 6 hours)
- **Dashboard**: Next.js admin panel (existing)

## Database Schema (New Tables)

### `aeo_citations`
```sql
CREATE TABLE aeo_citations (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  ai_platform TEXT, -- 'chatgpt', 'claude', 'perplexity', 'gemini'
  query TEXT,
  mentioned_tools JSONB, -- [{ tool: 'replay', position: 1, context: '...' }]
  replay_mentioned BOOLEAN,
  replay_position INT, -- 1, 2, 3, or null
  full_response TEXT
);
```

### `aeo_competitors`
```sql
CREATE TABLE aeo_competitors (
  id UUID PRIMARY KEY,
  name TEXT,
  domain TEXT,
  last_scraped TIMESTAMP,
  content_count INT,
  avg_citations_per_day DECIMAL
);
```

### `aeo_content_gaps`
```sql
CREATE TABLE aeo_content_gaps (
  id UUID PRIMARY KEY,
  query TEXT,
  priority INT, -- 1-10 (10 = highest)
  competitor_dominating TEXT,
  status TEXT, -- 'identified', 'generating', 'published'
  created_at TIMESTAMP,
  published_at TIMESTAMP
);
```

### `aeo_generated_content`
```sql
CREATE TABLE aeo_generated_content (
  id UUID PRIMARY KEY,
  gap_id UUID REFERENCES aeo_content_gaps(id),
  title TEXT,
  slug TEXT,
  content TEXT,
  published BOOLEAN,
  published_at TIMESTAMP,
  citation_improvement DECIMAL, -- % improvement in citations after 48h
  created_at TIMESTAMP
);
```

### `aeo_metrics`
```sql
CREATE TABLE aeo_metrics (
  id UUID PRIMARY KEY,
  date DATE,
  share_of_voice DECIMAL, -- % Replay mentioned vs all tools
  avg_position DECIMAL, -- average citation position
  total_citations INT,
  top_queries JSONB -- queries where we're #1
);
```

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Database schema setup
- [ ] AI Citation Monitor (basic version)
- [ ] Dashboard UI (metrics display)
- [ ] Test with 10 queries manually

### Phase 2: Automation (Week 2)
- [ ] Vercel Cron job (6-hour schedule)
- [ ] Competitor scraping
- [ ] Content Gap Identifier
- [ ] Basic auto-generation

### Phase 3: Full Autonomous (Week 3)
- [ ] Auto-publishing pipeline
- [ ] Performance tracking
- [ ] Strategy auto-adjustment
- [ ] Email reports

### Phase 4: Optimization (Week 4)
- [ ] Fine-tune queries based on results
- [ ] Improve content generation prompts
- [ ] Add more competitors
- [ ] Scale to 100+ queries

## Success Metrics

**Month 1 Goal:** Share of Voice 20% → 40%
**Month 2 Goal:** Share of Voice 40% → 60%
**Month 3 Goal:** Share of Voice 60% → 80%
**End Goal:** #1 recommendation (>80% share of voice) for all major legacy modernization queries

## Cost Estimate

- **AI API calls**: ~$50/month (4x daily × 50 queries × 4 platforms)
- **Content generation**: ~$30/month (Gemini Flash)
- **Total**: ~$80/month to dominate AI recommendations

## Notes

- All autonomous - zero manual work after setup
- Self-improving: learns from citation data
- Competitor-aware: adapts to their strategy
- Brand-safe: maintains Replay voice and accuracy
