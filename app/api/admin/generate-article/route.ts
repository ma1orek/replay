import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COPYWRITING_SKILL, SEO_AUDIT_SKILL, REPLAY_SEO_CONTEXT } from "@/lib/prompts/skills";

// Gemini 2.5 Flash for cost-effective article generation
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

// Verify admin token (base64 encoded email:password)
function verifyAdminToken(token: string): { valid: boolean; email?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return { valid: true, email };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 100);
}

// Normalize title for comparison (remove noise words, numbers, years)
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(in\s+)?20\d{2}\b/g, '') // Remove years like "in 2026", "2024"
    .replace(/\b(the|a|an|for|with|and|or|to|of|in|on|at|by|from)\b/g, '') // Remove common words
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity between two titles (0-1 score)
function calculateSimilarity(title1: string, title2: string): number {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);
  
  const words1 = new Set(norm1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(norm2.split(' ').filter(w => w.length > 2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  // Jaccard similarity
  return intersection.size / union.size;
}

// Check if title is too similar to existing titles
function isTitleDuplicate(newTitle: string, existingTitles: string[], threshold: number = 0.6): { isDuplicate: boolean; similarTo?: string; similarity?: number } {
  for (const existing of existingTitles) {
    const similarity = calculateSimilarity(newTitle, existing);
    if (similarity >= threshold) {
      return { isDuplicate: true, similarTo: existing, similarity };
    }
  }
  return { isDuplicate: false };
}

// Filter out duplicate topics from generated list
function filterDuplicateTopics(topics: string[], existingTitles: string[], threshold: number = 0.55): string[] {
  const filtered: string[] = [];
  const allTitles = [...existingTitles];
  
  for (const topic of topics) {
    const { isDuplicate, similarTo, similarity } = isTitleDuplicate(topic, allTitles, threshold);
    if (!isDuplicate) {
      filtered.push(topic);
      allTitles.push(topic); // Add to list to prevent duplicates within batch
    } else {
      console.log(`[DUPLICATE] "${topic}" is ${Math.round((similarity || 0) * 100)}% similar to "${similarTo}"`);
    }
  }
  
  return filtered;
}

// Calculate read time
function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

// Extract meaningful SEO keyword from title (NOT just first 3 words!)
function extractKeyword(title: string): string {
  const lower = title.toLowerCase();

  // Remove noise patterns that aren't keywords
  const cleaned = lower
    .replace(/^(the|a|an|why|how|what|when|where|who)\s+/i, '')
    .replace(/\b(the|a|an|for|with|and|or|to|of|in|on|at|by|from|is|are|was|were|be|been|has|have|had|do|does|did|will|would|could|should|may|might|can)\b/gi, ' ')
    .replace(/\b(here's|that's|what's|it's|don't|isn't|aren't|won't|can't|didn't|doesn't|haven't|hasn't|hadn't|wouldn't|couldn't|shouldn't)\b/gi, ' ')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // High-value keyword patterns (check in order of specificity)
  const keywordPatterns: RegExp[] = [
    // Technology migration: "COBOL to React", "VB6 to TypeScript"
    /\b(cobol|vb6?|asp|oracle\s*forms?|powerbuilder|delphi|winforms?|silverlight|mainframe)\s+(?:to\s+)?(react|typescript|javascript|web|cloud|modern)/i,
    // Specific frameworks/tools
    /\b(legacy\s+(?:system|code|modernization|migration|extraction|rewrite|platform))/i,
    /\b(technical\s+debt(?:\s+calculator)?)/i,
    /\b(reverse\s+engineering)/i,
    /\b(design\s+system)/i,
    /\b(video[- ](?:to[- ]code|based|first|extraction))/i,
    // Industry terms
    /\b(enterprise\s+(?:architecture|modernization|migration))/i,
    /\b(strangler\s+fig(?:\s+pattern)?)/i,
    // Compliance
    /\b(soc2|hipaa|gdpr|pci\s*dss)/i,
    // Business terms
    /\b(modernization\s+(?:roi|cost|budget|timeline|team))/i,
  ];

  for (const pattern of keywordPatterns) {
    const match = title.match(pattern);
    if (match) return match[0].toLowerCase().trim();
  }

  // Fallback: Extract the longest meaningful noun phrase (2-4 words)
  const words = cleaned.split(' ').filter(w => w.length > 2);
  if (words.length >= 3) return words.slice(0, 3).join(' ');
  if (words.length >= 2) return words.slice(0, 2).join(' ');
  return words[0] || cleaned.substring(0, 30);
}

// Generate SEO score (comprehensive heuristic)
function calculateSeoScore(content: string, keyword: string, title: string): number {
  let score = 0;
  const contentLower = content.toLowerCase();
  const keywordLower = keyword.toLowerCase();
  const wordCount = content.split(/\s+/).length;
  
  // Keyword in title (15 points)
  if (title.toLowerCase().includes(keywordLower)) score += 15;
  
  // Keyword density (15 points) - aim for 1-2%
  const keywordCount = (contentLower.match(new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  const density = (keywordCount / wordCount) * 100;
  if (density >= 0.5 && density <= 2.5) score += 15;
  else if (density > 0 && density < 3) score += 8;
  
  // Has H2 headers (10 points)
  const h2Count = (content.match(/^## /gm) || []).length;
  if (h2Count >= 3) score += 10;
  else if (h2Count >= 1) score += 5;
  
  // Has H3 headers (8 points)
  const h3Count = (content.match(/^### /gm) || []).length;
  if (h3Count >= 2) score += 8;
  else if (h3Count >= 1) score += 4;
  
  // Has bullet points or lists (8 points)
  if (content.includes('- ') || content.includes('* ')) score += 8;
  
  // Has code blocks (8 points)
  const codeBlockCount = (content.match(/```/g) || []).length / 2;
  if (codeBlockCount >= 2) score += 8;
  else if (codeBlockCount >= 1) score += 4;
  
  // Has tables (8 points)
  if (content.includes('| ') && content.includes('|---')) score += 8;
  
  // Has TL;DR or summary (5 points)
  if (contentLower.includes('tl;dr') || contentLower.includes('tldr') || contentLower.includes('summary')) score += 5;
  
  // Has FAQ section (5 points)
  if (contentLower.includes('faq') || contentLower.includes('frequently asked')) score += 5;
  
  // Has internal links (5 points)
  if (content.includes('replay.build') || content.includes('/tool') || content.includes('/blog')) score += 5;
  
  // Content length (13 points) - aim for 1500+ words
  if (wordCount >= 2000) score += 13;
  else if (wordCount >= 1500) score += 10;
  else if (wordCount >= 1000) score += 7;
  else if (wordCount >= 500) score += 4;
  
  return Math.min(100, score);
}

// Generate SEO-optimized article topics for Replay (checks existing articles to avoid duplicates)
async function generateTopics(count: number, existingTitles: string[] = []): Promise<string[]> {
  // Build compact exclusion list (take last 100 titles to keep prompt smaller)
  const recentTitles = existingTitles.slice(0, 100);
  
  // Group existing titles by category to show AI what's already covered
  const existingCategories: Record<string, string[]> = {
    comparisons: [],
    tutorials: [],
    alternatives: [],
    useCases: [],
    technical: []
  };
  
  for (const title of recentTitles) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes(' vs ') || lowerTitle.includes('compared')) {
      existingCategories.comparisons.push(title);
    } else if (lowerTitle.includes('how to') || lowerTitle.includes('step-by-step') || lowerTitle.includes('guide to')) {
      existingCategories.tutorials.push(title);
    } else if (lowerTitle.includes('alternative') || lowerTitle.includes('best ')) {
      existingCategories.alternatives.push(title);
    } else if (lowerTitle.includes('for building') || lowerTitle.includes('for creating')) {
      existingCategories.useCases.push(title);
    } else {
      existingCategories.technical.push(title);
    }
  }

  const existingList = existingTitles.length > 0 
    ? `

🚫🚫🚫 FORBIDDEN - THESE EXACT TOPICS AND SIMILAR ONES ARE ALREADY PUBLISHED:

**Comparisons we already have (${existingCategories.comparisons.length}):**
${existingCategories.comparisons.slice(0, 15).map(t => `- ${t}`).join('\n')}

**Tutorials we already have (${existingCategories.tutorials.length}):**
${existingCategories.tutorials.slice(0, 15).map(t => `- ${t}`).join('\n')}

**"Best Alternatives" articles we already have (${existingCategories.alternatives.length}):**
${existingCategories.alternatives.slice(0, 15).map(t => `- ${t}`).join('\n')}

**Use case articles we already have (${existingCategories.useCases.length}):**
${existingCategories.useCases.slice(0, 15).map(t => `- ${t}`).join('\n')}

⚠️⚠️⚠️ DO NOT generate titles similar to ANY of the above! 
Each new title must target a COMPLETELY DIFFERENT topic, keyword, and angle!`
    : '';

  const topicPrompt = `You are an SEO expert for "Replay" - a Visual Reverse Engineering platform for Enterprise. Replay helps companies modernize legacy systems by recording real user workflows and generating documented React components from video.

CORE VALUE PROPOSITIONS:
- Modernize without rewriting from scratch
- Document without archaeology (no more reverse engineering workshops)
- 70% average time savings vs manual modernization
- Days to weeks instead of 18-24 months
- Production-ready code, not prototypes

Generate exactly ${count} HIGHLY UNIQUE SEO article titles. Each title MUST target a DIFFERENT keyword and audience.
${existingList}

**🔥 PRIORITY TOPICS - ENTERPRISE LEGACY MODERNIZATION:**

1. **TECHNICAL DEBT & LEGACY PAIN POINTS** (high intent keywords):
   - "The $3.6 Trillion Problem: How Technical Debt Is Killing Enterprise Innovation"
   - "Why 70% of Legacy Rewrites Fail (And What Actually Works)"
   - "The Hidden Cost of Undocumented Code: $85B Lost Annually"
   - "Technical Debt Calculator: How Much Is Your Legacy System Really Costing?"
   - "Death by Documentation: Why Reverse Engineering Takes 18 Months"
   - "The Archaeology Problem: When Nobody Knows How the Code Works"
   
2. **MODERNIZATION ROI & BUSINESS CASE** (money keywords):
   - "Modernization ROI: How [Company] Saved $2M by Not Rewriting"
   - "The Real Cost of Legacy: Maintenance vs Modernization Analysis"
   - "CFO's Guide to Legacy Modernization: Beyond the Rewrite Budget"
   - "From 18 Months to 3 Weeks: The Economics of Video-Based Extraction"
   - "Why Your Modernization Budget Is 10x What It Should Be"
   - "Calculating Time-to-Value in Legacy System Modernization"
   
3. **INDUSTRY-SPECIFIC LEGACY** (regulated industries, high value):
   - "Financial Services Legacy: COBOL to React Without Business Disruption"
   - "Healthcare IT Modernization: HIPAA-Compliant Legacy Extraction"
   - "Insurance Platform Migration: From Mainframe to Modern Stack"
   - "Government Legacy Systems: Modernizing Without Security Compromise"
   - "Banking Core System Modernization: A Video-First Approach"
   - "Telecom Billing System Migration: Preserving Business Logic"
   - "Manufacturing ERP Modernization: Shop Floor to Cloud"
   - "Retail POS Legacy: Modernizing Mission-Critical Systems"
   - "Supply Chain Software: From AS/400 to Modern Web Apps"
   
4. **ENTERPRISE DECISION MAKERS** (CTO/CIO audience):
   - "CTO's Dilemma: Rewrite, Refactor, or Extract?"
   - "Board-Ready: Presenting Legacy Modernization Without the Jargon"
   - "The Strangler Fig Pattern Is Dead. Here's What's Next."
   - "Why Your Modernization Team Keeps Missing Deadlines"
   - "Enterprise Architecture in 2026: Video as Source of Truth"
   - "From Black Box to Documented System in 30 Days"
   
5. **TEAM & PROCESS** (engineering leadership):
   - "Why Senior Developers Hate Reverse Engineering (And How to Fix It)"
   - "The Documentation Gap: 67% of Legacy Systems Have No Docs"
   - "Onboarding Engineers to Legacy Code: 6 Months to 2 Weeks"
   - "Knowledge Transfer Before the Expert Retires: A Practical Guide"
   - "Reverse Engineering Workshops Are Waste: Try This Instead"
   - "The Hidden Bottleneck: Discovery Phase Delays"
   
6. **TECHNOLOGY MIGRATIONS** (specific stack keywords):
   - "COBOL to TypeScript: Extracting Business Logic from Mainframes"
   - "Visual Basic 6 to React: A Practical Migration Path"
   - "Classic ASP to Modern JavaScript: Video-Based Extraction"
   - "Oracle Forms to Web: Modernizing Enterprise UIs"
   - "PowerBuilder to React: Preserving 20 Years of Business Logic"
   - "Delphi Legacy: From Desktop to Web Application"
   - "WinForms to Web: Enterprise Desktop Modernization"
   - "Silverlight Sunset: Migrating Legacy Web Apps"
   
7. **COMPLIANCE & SECURITY** (enterprise requirements):
   - "SOC2-Compliant Modernization: Keeping Auditors Happy"
   - "GDPR and Legacy Systems: The Modernization Imperative"
   - "PCI DSS Compliance in Legacy Modernization Projects"
   - "Air-Gapped Environments: On-Premise Modernization Tools"
   - "Data Retention in Legacy Extraction: Best Practices"
   
8. **FAILURE ANALYSIS** (problem-aware audience):
   - "Why Big Bang Rewrites Always Fail: Lessons from $100M Disasters"
   - "The Modernization Graveyard: Projects That Never Shipped"
   - "18 Months Later, Zero Features: Anatomy of a Failed Rewrite"
   - "When Consultants Leave: Sustaining Modernization Momentum"
   - "The Parallel Run Trap: Why Testing Takes Forever"
   
9. **COMPARISONS & ALTERNATIVES** (evaluation stage):
   - "Strangler Fig vs Video Extraction: Which Approach Wins?"
   - "Manual Reverse Engineering vs AI-Assisted: Cost Comparison"
   - "Build vs Buy: Legacy Modernization Tooling Analysis"
   - "In-House vs Consultants: Modernization Team Composition"
   - "Microservices vs Monolith: What Legacy Extraction Reveals"
   
10. **CASE STUDIES & PROOF POINTS** (social proof):
    - "How a Fortune 500 Bank Modernized 500k Lines in 3 Months"
    - "From 40 Hours per Screen to 4: Real Enterprise Results"
    - "Insurance Giant Cuts Modernization Timeline by 70%"
    - "Government Agency Modernizes 15-Year-Old System in Weeks"
    
11. **THOUGHT LEADERSHIP** (controversial, shareable):
    - "The Rewrite Is Dead: Why 2026 Is the Year of Extraction"
    - "Your Modernization Consultants Are Billing for Archaeology"
    - "Stop Documenting Legacy Code. Record It Instead."
    - "The $50 Million Myth: Enterprise Rewrites Don't Have to Cost This Much"
    - "Why Screenshots Fail for UI Reconstruction (Video Works)"
    
12. **PRACTICAL GUIDES** (how-to, actionable):
    - "Step-by-Step: Modernizing Your First Legacy Module"
    - "The 30-Day Legacy Assessment: A Practical Framework"
    - "Building a Modernization Business Case Your CFO Will Approve"
    - "Legacy Code Triage: What to Modernize First"
    - "Creating a Design System from Undocumented Legacy UI"

13. **AI & AUTOMATION IN MODERNIZATION** (trending):
    - "AI-Powered Reverse Engineering: Beyond Code Analysis"
    - "How AI Understands User Intent from Video"
    - "Automated Documentation Generation for Legacy Systems"
    - "The Future of Legacy Modernization: AI + Human Review"

**ABSOLUTE RULES:**
1. NO duplicate concepts - check ${existingTitles.length} existing titles
2. Each title = unique primary keyword
3. Focus on ENTERPRISE, LEGACY, MODERNIZATION, TECHNICAL DEBT
4. Include numbers/stats when relevant: "70%", "$2M", "18 months"
5. Target decision makers: CTOs, VPs of Engineering, Enterprise Architects
6. Balance: 40% pain points, 30% solutions, 20% industry-specific, 10% thought leadership

Output ONLY the titles, one per line, no numbers or bullets.`;

  console.log(`[generateTopics] Generating ${count} topics, avoiding ${existingTitles.length} existing titles`);
  

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: topicPrompt }] }],
        generationConfig: {
          temperature: 1.0, // Higher for more creativity and variety
          maxOutputTokens: 2048,
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate topics");
  }

  const data = await response.json();
  const topicsText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  
  const rawTopics = topicsText
    .split('\n')
    .map((t: string) => t.replace(/^[\d\.\-\*\•]+\s*/, '').trim())
    .filter((t: string) => t.length > 10 && t.length < 150);
  
  // Apply fuzzy duplicate filtering
  const uniqueTopics = filterDuplicateTopics(rawTopics, existingTitles, 0.5);
  
  console.log(`[generateTopics] Raw topics: ${rawTopics.length}, after filtering: ${uniqueTopics.length}`);
  
  // If too many were filtered, request more
  if (uniqueTopics.length < count && uniqueTopics.length < rawTopics.length * 0.5) {
    console.log(`[generateTopics] Many duplicates detected, using what we have: ${uniqueTopics.length}`);
  }

  return uniqueTopics.slice(0, count);
}

// System prompt for article generation
function buildSystemPrompt(tone: string): string {
  const toneInstructions: Record<string, string> = {
    technical: "Write in a technical but accessible tone. Include working code snippets. Focus on implementation details and real-world usage.",
    controversial: "Take a strong stance. Challenge conventional wisdom. Be provocative but back claims with evidence and data.",
    tutorial: "Write step-by-step instructions. Be practical and actionable. Include complete code examples that readers can copy.",
    comparison: "Be objective but highlight unique advantages. Include detailed comparison tables. Address common concerns directly.",
  };

  return `You are a Senior Enterprise Architect and thought leader in legacy modernization. You write for "Replay" - a Visual Reverse Engineering platform for Enterprise that helps companies modernize legacy systems.

ABOUT REPLAY:
- Visual Reverse Engineering: Record real user workflows, get documented React components
- Modernize without rewriting from scratch - 70% average time savings
- From 18-24 months to days/weeks
- Key features: Library (Design System), Flows (Architecture), Blueprints (Editor), AI Automation Suite
- Generates: API Contracts, E2E Tests, Documentation, Technical Debt Audit
- Built for regulated environments: SOC2, HIPAA-ready, On-Premise available
- Target industries: Financial Services, Healthcare, Insurance, Government, Manufacturing, Telecom

CORE MESSAGING:
- "Modernize without rewriting"
- "Document without archaeology" 
- "From black box to documented codebase"
- "The future isn't rewriting from scratch - it's understanding what you already have"
- "Video as source of truth for reverse engineering"

STATISTICS TO USE:
- 70% of legacy rewrites fail or exceed timeline
- 67% of legacy systems lack documentation
- 18 months average enterprise rewrite timeline
- $3.6 trillion global technical debt
- 40 hours average per screen (manual) vs 4 hours with Replay

WRITING RULES:
1. NO FLUFF. Never start with "In today's digital landscape..." - start with a hook, problem, or bold statement
2. Write for CTOs, VPs of Engineering, Enterprise Architects, and technical decision makers
3. Structure with H2 (##) and H3 (###) headers
4. Mention "Replay" naturally 2-3 times as the solution (not too salesy)
5. ${toneInstructions[tone] || toneInstructions.technical}
6. Focus on PAIN POINTS: technical debt, failed rewrites, documentation gaps, time/budget overruns

REQUIRED ELEMENTS (USE ALL):

1. **TL;DR Box** - Start with this right after intro:
\`\`\`
> **TL;DR:** One-sentence summary of the key takeaway from this article.
\`\`\`

2. **Comparison Tables** - Use REAL Markdown tables with data:
\`\`\`
| Approach | Timeline | Risk | Cost |
|----------|----------|------|------|
| Big Bang Rewrite | 18-24 months | High (70% fail) | $$$$ |
| Strangler Fig | 12-18 months | Medium | $$$ |
| Video Extraction | 2-8 weeks | Low | $ |
\`\`\`

3. **Code Blocks** - Include REAL, copy-paste ready code with language tags:
\`\`\`typescript
// Example: Generated component from video extraction
export function LegacyFormMigrated() {
  const [data, setData] = useState<FormData>();
  // Business logic preserved from legacy system
  return <ModernForm data={data} />;
}
\`\`\`

4. **Info/Warning Boxes** - Use blockquotes with emoji:
\`\`\`
> 💡 **Pro Tip:** Useful insight here

> ⚠️ **Warning:** Important caution here

> 📝 **Note:** Additional context here

> 💰 **ROI Insight:** Cost/time savings data
\`\`\`

5. **Numbered Steps** for tutorials:
\`\`\`
### Step 1: Assessment
Content...

### Step 2: Recording  
Content...

### Step 3: Extraction
Content...
\`\`\`

6. **Bullet Lists** for features/benefits:
- Clear benefit one
- Clear benefit two
- Clear benefit three

7. **FAQ Section** at the end:
\`\`\`
## Frequently Asked Questions

### How long does legacy extraction take?
Answer with specific timelines...

### What about business logic preservation?
Answer here...
\`\`\`

8. **Call to Action** - End with:
\`\`\`
---

**Ready to modernize without rewriting?** [Book a pilot with Replay](https://replay.build) - see your legacy screen extracted live during the call.
\`\`\`

FORMAT REQUIREMENTS:
- Output ONLY Markdown content (no front matter, no title)
- NO placeholder text like [IMAGE:...] or [TABLE:...] - create REAL tables
- Target 1800-2500 words for comprehensive SEO coverage
- Include at least 2 code blocks, 1 table, 1 TL;DR, 1 FAQ section
- Use emoji sparingly but effectively (💡⚠️✅❌📝🚀💰)
- Include real statistics and data points

NEVER mention you're an AI. Write as an expert enterprise architect sharing battle-tested insights from real modernization projects.

═══════════════════════════════════════════════════════════════════════════════
📈 SKILLS.SH SEO INTEGRATION (coreyhaines31/marketingskills)
═══════════════════════════════════════════════════════════════════════════════

**COPYWRITING PRINCIPLES:**

Hook Formulas:
1. Problem-Agitation-Solution (PAS) - Identify pain, make urgent, present solution
2. Before-After-Bridge (BAB) - Current state, desired state, how to get there
3. Feature-Advantage-Benefit (FAB) - What it does, why it matters, how it helps

Opening Lines (NEVER start with):
❌ "In today's digital landscape..."
❌ "As we all know..."
❌ "It's no secret that..."

Opening Lines (DO start with):
✅ A surprising statistic
✅ A bold statement
✅ A specific problem
✅ A contrarian take

**SEO AUDIT CHECKLIST:**
□ Primary keyword in first 60 characters of title
□ Keyword density 1-2% (natural usage)
□ At least 3 H2 headers with keyword variations
□ At least 2 H3 subsections
□ Include comparison table with real data
□ Include 2+ code blocks
□ TL;DR section at start
□ FAQ section at end (3+ questions)
□ Internal links to replay.build
□ Content length 1500+ words
□ Meta description 150-160 chars`;
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { valid } = verifyAdminToken(token);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      titles: providedTitles, // Array of titles for batch generation (manual mode)
      autoCount, // Number of articles to auto-generate (auto mode)
      getTopicsOnly, // Just return AI-generated topics without generating content
      singleTitle, // Generate ONE article (used for sequential generation)
      targetKeyword,
      tone = "technical",
      keyTakeaways = [],
      saveToDB = true
    } = body;

    // Initialize Supabase admin client with connection settings
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    // MODE 1: Get topics only (for frontend to then generate one by one)
    if (getTopicsOnly && autoCount) {
      console.log(`Getting ${autoCount} SEO topics only...`);
      
      // Fetch ALL existing article titles to avoid duplicates
      let existingTitles: string[] = [];
      try {
        const { data: existingPosts, count } = await supabase
          .from('blog_posts')
          .select('title', { count: 'exact' })
          .order('created_at', { ascending: false });
        
        if (existingPosts) {
          existingTitles = existingPosts.map(p => p.title);
          console.log(`Found ${existingTitles.length} existing articles (total: ${count}) to avoid duplicates`);
        }
      } catch (e) {
        console.log("Could not fetch existing articles, continuing without duplicate check");
      }
      
      try {
        const topics = await generateTopics(autoCount, existingTitles);
        console.log("Generated topics:", topics);
        return NextResponse.json({ success: true, topics });
      } catch (error: any) {
        return NextResponse.json({ error: "Failed to generate topics: " + error.message }, { status: 500 });
      }
    }

    // MODE 2: Generate SINGLE article (for sequential processing - no timeout!)
    if (singleTitle) {
      console.log(`Generating single article: "${singleTitle}"`);
      const title = singleTitle;
      const systemPrompt = buildSystemPrompt(tone);
      
      try {
        const userPrompt = `Write a blog post about: "${title}"

Target Keyword: ${targetKeyword || extractKeyword(title)}

${keyTakeaways.length > 0 ? `Key points to include:\n${keyTakeaways.map((t: string) => `- ${t}`).join('\n')}` : ''}

Remember: Be concise, technical, and valuable. No fluff.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                topP: 0.9,
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Gemini API error:", errorText);
          return NextResponse.json({ result: { title, error: "Generation failed" } });
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!content) {
          return NextResponse.json({ result: { title, error: "Empty response from AI" } });
        }

        // Generate metadata
        const slug = generateSlug(title);
        const readTime = calculateReadTime(content);
        const seoScore = calculateSeoScore(content, targetKeyword || title, title);
        
        // Generate meta description - extract from TL;DR first, then fallback to intro
        const keyword = targetKeyword || extractKeyword(title);
        let metaDescription = '';

        // Try 1: Extract from TL;DR (best summary)
        const tldrMatch = content.match(/>\s*\*?\*?TL;?DR:?\*?\*?:?\s*(.+?)(?:\n|$)/i);
        if (tldrMatch) {
          metaDescription = tldrMatch[1].replace(/[*`\[\]]/g, '').trim();
        }

        // Try 2: First substantive paragraph (skip headers, quotes, code)
        if (!metaDescription || metaDescription.length < 50) {
          const paragraphs = content.split('\n\n')
            .map((p: string) => p.replace(/[#*`>\[\]]/g, '').trim())
            .filter((p: string) => p.length > 60 && !p.startsWith('|') && !p.startsWith('-') && !p.startsWith('```'));
          if (paragraphs.length > 0) {
            metaDescription = paragraphs[0];
          }
        }

        // Trim to 155 chars at word boundary, ensure keyword is included
        if (metaDescription.length > 155) {
          metaDescription = metaDescription.substring(0, 155).replace(/\s+\S*$/, '') + '...';
        }
        // If description doesn't contain keyword, prepend it
        if (keyword && !metaDescription.toLowerCase().includes(keyword.toLowerCase().split(' ')[0])) {
          metaDescription = metaDescription.substring(0, 130).replace(/\s+\S*$/, '') + '...';
        }

        const articleData: Record<string, any> = {
          title,
          slug,
          content,
          meta_description: metaDescription,
          target_keyword: targetKeyword || extractKeyword(title),
          tone,
          status: 'published',
          read_time_minutes: readTime,
          seo_score: seoScore,
          published_at: new Date().toISOString(),
        };

        if (saveToDB) {
          try {
            // Check for title similarity before saving
            const { data: similarTitles } = await supabase
              .from('blog_posts')
              .select('title')
              .ilike('title', `%${title.split(' ').slice(0, 4).join('%')}%`)
              .limit(5);
            
            if (similarTitles && similarTitles.length > 0) {
              const { isDuplicate, similarTo, similarity } = isTitleDuplicate(title, similarTitles.map(t => t.title), 0.65);
              if (isDuplicate) {
                console.log(`[SKIP] Article "${title}" is ${Math.round((similarity || 0) * 100)}% similar to "${similarTo}"`);
                return NextResponse.json({ 
                  result: { 
                    title, 
                    skipped: true, 
                    reason: `Too similar to existing: "${similarTo}" (${Math.round((similarity || 0) * 100)}%)` 
                  } 
                });
              }
            }
            
            // Check for slug conflict
            const { data: existingSlug } = await supabase
              .from('blog_posts')
              .select('slug')
              .eq('slug', slug)
              .single();
            
            if (existingSlug) {
              articleData.slug = `${slug}-${Date.now()}`;
            }
            
            const { data: savedPost, error: saveError } = await supabase
              .from('blog_posts')
              .insert(articleData)
              .select()
              .single();

            if (saveError) {
              console.error("Supabase save error:", saveError);
              return NextResponse.json({ result: { ...articleData, saved: false, error: saveError.message } });
            }
            
            return NextResponse.json({ result: { ...savedPost, saved: true } });
          } catch (dbError: any) {
            return NextResponse.json({ result: { ...articleData, saved: false, error: dbError.message } });
          }
        }
        
        return NextResponse.json({ result: { ...articleData, saved: false } });
        
      } catch (error: any) {
        return NextResponse.json({ result: { title, error: error.message || "Unknown error" } });
      }
    }

    // MODE 3: Legacy batch mode (for backward compatibility, but may timeout)
    let titles: string[] = [];

    if (autoCount && typeof autoCount === 'number' && autoCount > 0) {
      const count = autoCount;
      console.log(`Auto-generating ${count} SEO topics...`);
      
      let existingTitles: string[] = [];
      try {
        const { data: existingPosts } = await supabase
          .from('blog_posts')
          .select('title')
          .order('created_at', { ascending: false })
          .limit(100);
        
        if (existingPosts) {
          existingTitles = existingPosts.map(p => p.title);
        }
      } catch (e) {
        console.log("Could not fetch existing articles");
      }
      
      try {
        titles = await generateTopics(count, existingTitles);
      } catch (error: any) {
        return NextResponse.json({ error: "Failed to generate topics: " + error.message }, { status: 500 });
      }
      
      if (titles.length === 0) {
        return NextResponse.json({ error: "Failed to generate any topics" }, { status: 500 });
      }
    } 
    else if (providedTitles && Array.isArray(providedTitles) && providedTitles.length > 0) {
      titles = providedTitles;
    } else {
      return NextResponse.json({ error: "Either 'titles', 'autoCount', or 'singleTitle' is required" }, { status: 400 });
    }

    const results: any[] = [];
    const systemPrompt = buildSystemPrompt(tone);

    for (const title of titles) {
      try {
        const userPrompt = `Write a blog post about: "${title}"

Target Keyword: ${targetKeyword || extractKeyword(title)}

${keyTakeaways.length > 0 ? `Key points to include:\n${keyTakeaways.map((t: string) => `- ${t}`).join('\n')}` : ''}

Remember: Be concise, technical, and valuable. No fluff.`;

        // Call Gemini 2.5 Flash (cheaper model for content)
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                { role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
                topP: 0.9,
              }
            })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Gemini API error:", errorText);
          results.push({ title, error: "Generation failed", details: errorText });
          continue;
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        if (!content) {
          results.push({ title, error: "Empty response from AI" });
          continue;
        }

        // Generate metadata
        const slug = generateSlug(title);
        const readTime = calculateReadTime(content);
        const seoScore = calculateSeoScore(content, targetKeyword || title, title);
        
        // Generate meta description - strip TL;DR and markdown, get first clean paragraph
        let cleanContent = content
          .replace(/^>?\s*\*?\*?TL;?DR:?\*?\*?:?\s*/gim, '') // Remove TL;DR prefix
          .replace(/[#*`>\[\]]/g, '') // Remove markdown
          .replace(/\n+/g, ' ') // Replace newlines with spaces
          .trim();
        
        // Find first substantive sentence (skip very short ones)
        const sentences = cleanContent.split(/[.!?]+/).filter((s: string) => s.trim().length > 30);
        const metaDescription = sentences.length > 0 
          ? sentences[0].trim().substring(0, 155) + '...'
          : cleanContent.substring(0, 155).trim() + '...';

        const articleData: Record<string, any> = {
          title,
          slug,
          content,
          meta_description: metaDescription,
          target_keyword: targetKeyword || extractKeyword(title),
          tone,
          status: 'published',
          read_time_minutes: readTime,
          seo_score: seoScore,
          published_at: new Date().toISOString(),
        };
        
        // Only add key_takeaways if provided (column may not exist)
        // if (keyTakeaways && keyTakeaways.length > 0) {
        //   articleData.key_takeaways = keyTakeaways;
        // }

        // Save to database if requested
        if (saveToDB) {
          try {
            const { data: savedPost, error: saveError } = await supabase
              .from('blog_posts')
              .insert(articleData)
              .select()
              .single();

            if (saveError) {
              console.error("Supabase save error:", JSON.stringify(saveError, null, 2));
              
              // If table doesn't exist, return data without saving
              if (saveError.message?.includes('relation') && saveError.message?.includes('does not exist')) {
                console.warn("blog_posts table doesn't exist, returning without save");
                results.push({ ...articleData, saved: false, warning: "Table doesn't exist - content generated but not saved" });
                continue;
              }
              
              // If RLS policy violation or permission issue
              if (saveError.code === '42501' || saveError.message?.includes('policy')) {
                results.push({ ...articleData, saved: false, error: "RLS policy - run: ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;" });
                continue;
              }
              // If slug conflict, add timestamp
              if (saveError.code === '23505') {
                articleData.slug = `${slug}-${Date.now()}`;
                const { data: retryPost, error: retryError } = await supabase
                  .from('blog_posts')
                  .insert(articleData)
                  .select()
                  .single();
                
                if (retryError) {
                  results.push({ ...articleData, saved: false, error: "Failed to save" });
                  continue;
                }
                results.push({ ...retryPost, saved: true });
              } else {
                // Unknown error - show full message
                results.push({ ...articleData, saved: false, error: `DB Error: ${saveError.message || saveError.code || 'Unknown'}` });
              }
            } else {
              results.push({ ...savedPost, saved: true });
            }
          } catch (dbError: any) {
            // If DB fails, still return the generated content
            results.push({ ...articleData, saved: false, error: dbError.message });
          }
        } else {
          results.push({ ...articleData, saved: false });
        }

      } catch (error: any) {
        results.push({ title, error: error.message || "Unknown error" });
      }
    }

    return NextResponse.json({ 
      success: true, 
      generated: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results 
    });

  } catch (error: any) {
    console.error("Article generation error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// GET endpoint to find duplicates in existing articles
export async function GET(request: NextRequest) {
  try {
    // Verify admin
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { valid } = verifyAdminToken(token);
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: { persistSession: false },
        db: { schema: 'public' }
      }
    );

    // Find duplicate articles
    if (action === 'find-duplicates') {
      const threshold = parseFloat(url.searchParams.get('threshold') || '0.55');
      
      const { data: articles, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, created_at, status')
        .order('created_at', { ascending: true });
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const duplicateGroups: { original: any; duplicates: any[] }[] = [];
      const processedIds = new Set<string>();

      for (let i = 0; i < articles.length; i++) {
        if (processedIds.has(articles[i].id)) continue;
        
        const original = articles[i];
        const duplicates: any[] = [];
        
        for (let j = i + 1; j < articles.length; j++) {
          if (processedIds.has(articles[j].id)) continue;
          
          const similarity = calculateSimilarity(original.title, articles[j].title);
          if (similarity >= threshold) {
            duplicates.push({
              ...articles[j],
              similarity: Math.round(similarity * 100)
            });
            processedIds.add(articles[j].id);
          }
        }
        
        if (duplicates.length > 0) {
          duplicateGroups.push({ original, duplicates });
          processedIds.add(original.id);
        }
      }

      return NextResponse.json({
        success: true,
        totalArticles: articles.length,
        duplicateGroups: duplicateGroups.length,
        duplicatesFound: duplicateGroups.reduce((sum, g) => sum + g.duplicates.length, 0),
        groups: duplicateGroups
      });
    }

    // Delete duplicates (keep first, delete rest)
    if (action === 'delete-duplicates') {
      const threshold = parseFloat(url.searchParams.get('threshold') || '0.6');
      const dryRun = url.searchParams.get('dry_run') !== 'false';
      
      const { data: articles, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, created_at')
        .order('created_at', { ascending: true }); // Keep oldest
      
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const idsToDelete: string[] = [];
      const processedTitles: string[] = [];

      for (const article of articles) {
        const { isDuplicate, similarTo, similarity } = isTitleDuplicate(article.title, processedTitles, threshold);
        
        if (isDuplicate) {
          idsToDelete.push(article.id);
          console.log(`[DELETE] "${article.title}" is ${Math.round((similarity || 0) * 100)}% similar to "${similarTo}"`);
        } else {
          processedTitles.push(article.title);
        }
      }

      if (!dryRun && idsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('blog_posts')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) {
          return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }
      }

      return NextResponse.json({
        success: true,
        dryRun,
        totalArticles: articles.length,
        duplicatesFound: idsToDelete.length,
        remaining: articles.length - idsToDelete.length,
        deleted: dryRun ? 0 : idsToDelete.length,
        message: dryRun 
          ? `Found ${idsToDelete.length} duplicates. Add ?dry_run=false to delete them.`
          : `Deleted ${idsToDelete.length} duplicate articles.`
      });
    }

    return NextResponse.json({ 
      error: "Unknown action. Use ?action=find-duplicates or ?action=delete-duplicates" 
    }, { status: 400 });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
