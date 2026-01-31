// ============================================================================
// REPLAY.BUILD - SEO SKILLS (from skills.sh ecosystem)
// Sources: seo-audit, copywriting, programmatic-seo (coreyhaines31/marketingskills)
// ============================================================================

/**
 * SEO Audit Skill - Check content for SEO best practices
 * Based on: coreyhaines31/marketingskills (6.6K installs)
 */
export const SEO_AUDIT_SKILL = `
## SEO Audit Checklist

### On-Page SEO Factors

**Title Tag Optimization:**
- Primary keyword in first 60 characters
- Unique, compelling title (not generic)
- Include brand name at end if room
- Power words: Ultimate, Complete, Proven, Essential

**Meta Description:**
- 150-160 characters max
- Include primary keyword naturally
- Clear value proposition or CTA
- Avoid duplicate descriptions

**Header Structure:**
- Single H1 with primary keyword
- H2s for main sections (3-6 per article)
- H3s for subsections
- Keywords in headers (natural, not forced)

**Content Quality:**
- Minimum 1500 words for comprehensive topics
- Keyword density 1-2% (natural usage)
- Include LSI (semantic) keywords
- Answer user intent completely

**Internal Linking:**
- Link to 3-5 related internal pages
- Descriptive anchor text (not "click here")
- Strategic links to product pages
- Link to cornerstone content

**Technical SEO:**
- Fast page load time (<3s)
- Mobile-responsive design
- Proper canonical tags
- Schema markup for articles
`;

/**
 * Copywriting Skill - Write compelling content
 * Based on: coreyhaines31/marketingskills (5K installs)
 */
export const COPYWRITING_SKILL = `
## Copywriting Principles

### Hook Formulas

1. **Problem-Agitation-Solution (PAS)**
   - Problem: Identify the pain point
   - Agitation: Make it feel urgent
   - Solution: Present your answer

2. **Before-After-Bridge (BAB)**
   - Before: Current painful state
   - After: Desired future state
   - Bridge: How to get there

3. **Feature-Advantage-Benefit (FAB)**
   - Feature: What it does
   - Advantage: Why that matters
   - Benefit: How it helps the reader

### Opening Lines (Never Start With)
❌ "In today's digital landscape..."
❌ "As we all know..."
❌ "It's no secret that..."
❌ "Have you ever wondered..."

### Opening Lines (Do Start With)
✅ A surprising statistic
✅ A bold statement
✅ A specific problem
✅ A relatable scenario
✅ A contrarian take

### Power Words by Category

**Urgency:** Now, Today, Limited, Deadline, Instant
**Exclusivity:** Secret, Insider, VIP, Members-only
**Trust:** Proven, Guaranteed, Certified, Research-backed
**Value:** Free, Save, Bonus, Exclusive, Premium
**Emotion:** Surprising, Shocking, Remarkable, Incredible

### Call-to-Action Patterns
- Action verb + Value proposition
- "Get your free audit"
- "Start saving 70% today"
- "Book your demo in 30 seconds"
`;

/**
 * Programmatic SEO Skill - Scale content production
 * Based on: coreyhaines31/marketingskills (3.3K installs)
 */
export const PROGRAMMATIC_SEO_SKILL = `
## Programmatic SEO Patterns

### Content Templates

**Comparison Template:**
\`\`\`markdown
# {Tool A} vs {Tool B}: {Year} Comparison

> **TL;DR:** Quick summary of the winner and why.

## Quick Comparison Table
| Feature | Tool A | Tool B |
|---------|--------|--------|
| Pricing | $X/mo | $Y/mo |
| Best For | Use case | Use case |

## {Tool A} Overview
### Pros
### Cons
### Pricing

## {Tool B} Overview
### Pros
### Cons
### Pricing

## Head-to-Head Comparison
### Feature 1
### Feature 2

## Verdict: Which Should You Choose?

## FAQs
\`\`\`

**Tutorial Template:**
\`\`\`markdown
# How to {Achieve Goal} in {Timeframe}: Step-by-Step Guide

> **TL;DR:** Summary of the process.

## What You'll Learn
- Point 1
- Point 2

## Prerequisites
- Requirement 1

## Step 1: {First Action}
[Detailed instructions + code/screenshots]

## Step 2: {Next Action}
[Continue pattern]

## Common Mistakes to Avoid
## Advanced Tips
## FAQs
\`\`\`

### Keyword Clustering
Group related keywords into content clusters:
- Pillar page (broad topic, 3000+ words)
- Cluster pages (specific subtopics, link to pillar)
- Supporting pages (FAQs, comparisons)

### Title Formulas
- "How to {Action} in {Year}: Complete Guide"
- "{Number} Best {Category} for {Use Case} [{Year}]"
- "{Tool A} vs {Tool B}: Which Is Better for {Audience}?"
- "The Ultimate Guide to {Topic} for {Audience}"
- "{Topic} 101: Everything You Need to Know"
`;

/**
 * Schema Markup Skill - Structured data
 * Based on: coreyhaines31/marketingskills
 */
export const SCHEMA_MARKUP_SKILL = `
## Schema Markup for Articles

### Article Schema
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Article Title (max 110 chars)",
  "description": "Meta description",
  "author": {
    "@type": "Organization",
    "name": "Replay",
    "url": "https://replay.build"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Replay",
    "logo": {
      "@type": "ImageObject",
      "url": "https://replay.build/logo.png"
    }
  },
  "datePublished": "2026-01-28T00:00:00Z",
  "dateModified": "2026-01-28T00:00:00Z",
  "image": "https://replay.build/imgg.png",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://replay.build/blog/article-slug"
  }
}
\`\`\`

### FAQ Schema
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text."
      }
    }
  ]
}
\`\`\`

### HowTo Schema (for tutorials)
\`\`\`json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to accomplish task",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Step 1",
      "text": "Description of step 1"
    }
  ]
}
\`\`\`
`;

/**
 * Combined SEO Skills for Gemini prompts
 */
export const COMBINED_SEO_SKILLS = `
═══════════════════════════════════════════════════════════════════════════════
📈 SEO & CONTENT SKILLS (from skills.sh ecosystem)
═══════════════════════════════════════════════════════════════════════════════

${SEO_AUDIT_SKILL}

${COPYWRITING_SKILL}

${PROGRAMMATIC_SEO_SKILL}

${SCHEMA_MARKUP_SKILL}
`;

/**
 * Enterprise Legacy Modernization SEO Context
 * Specific to Replay's target market
 */
export const REPLAY_SEO_CONTEXT = `
## Replay Enterprise SEO Context

### Target Audience
- CTOs and VPs of Engineering
- Enterprise Architects
- Technical Decision Makers at Fortune 500
- Engineering Managers in regulated industries (Finance, Healthcare, Insurance, Government)

### Core Messaging (Use These Phrases)
- "Modernize without rewriting"
- "Document without archaeology"
- "From black box to documented codebase"
- "Video as source of truth for reverse engineering"
- "The future isn't rewriting from scratch - it's understanding what you already have"

### Key Statistics (Cite These)
- 70% of legacy rewrites fail or exceed timeline
- 67% of legacy systems lack documentation
- 18 months average enterprise rewrite timeline
- $3.6 trillion global technical debt
- 40 hours average per screen (manual) vs 4 hours with Replay

### High-Intent Keywords
- Legacy modernization
- Technical debt reduction
- Enterprise system migration
- COBOL to modern stack
- Application modernization
- Visual reverse engineering

### Competitor Comparison Topics
- Strangler Fig Pattern vs Video Extraction
- Manual Reverse Engineering vs AI-Assisted
- Build vs Buy modernization tools
- In-house vs Consulting teams

### Industry-Specific Topics
- Financial Services: COBOL to React, mainframe migration
- Healthcare: HIPAA-compliant modernization
- Insurance: Policy system migration
- Government: Legacy system documentation
- Manufacturing: ERP modernization
`;

export default COMBINED_SEO_SKILLS;
