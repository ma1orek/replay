import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const topicPrompt = `You are an SEO expert for "Replay" - a revolutionary video-to-code AI tool that reconstructs working UI from screen recordings.

Generate exactly ${count} HIGHLY UNIQUE SEO article titles. Each title MUST target a DIFFERENT keyword and audience.
${existingList}

**🔥 TRENDING TOPICS 2026 (PRIORITY - Google Trends hot keywords):**

1. **AI CODING ASSISTANTS** (high search volume):
   - "Claude 4 vs GPT-5 for Frontend Development: Real Code Comparison"
   - "Devin AI vs Human Developers: When to Use Each"
   - "How Gemini 2.5 Changed Video Understanding for Code Generation"
   - "Cursor vs Windsurf vs Replay: Which AI Codes Best?"
   
2. **VIBE CODING / AI PAIR PROGRAMMING** (trending):
   - "Vibe Coding: The New Way Developers Build UIs in 2026"
   - "AI Pair Programming: Why Video Input Beats Text Prompts"
   - "The Rise of 'Show Don't Tell' Development with AI"
   
3. **SPECIFIC TECH STACKS** (long-tail SEO):
   - "Astro 5.0 Components from Video Recordings"
   - "Building Remix Apps with AI Video Analysis"
   - "Qwik City UI from Screen Captures: Complete Guide"
   - "SolidStart + Replay: Reactive UI Generation"
   - "TanStack Router UI from Video Demos"
   - "Hono.js Admin Panels with AI Generation"
   
4. **AI AGENTS & AUTOMATION** (trending 2026):
   - "AI Agents That Build Your UI While You Sleep"
   - "Autonomous UI Development: Replay + GitHub Actions"
   - "MCP Servers for Automated Frontend Generation"
   
5. **ENTERPRISE & BUSINESS** (money keywords):
   - "Fortune 500 Companies Using AI for UI Development"
   - "ROI Calculator: AI Code Generation vs Manual Development"
   - "Compliance-Ready UIs: Building SOC2 Dashboards with AI"
   - "How Startups Ship 10x Faster with Video-to-Code"
   
6. **NICHE INDUSTRIES** (low competition, high intent):
   - "AI UI Generation for Crypto/DeFi Dashboards"
   - "Building Trading Terminal UIs from Video"
   - "Healthcare SaaS UI: HIPAA-Compliant Generation"
   - "EdTech Platform UI from Teacher Demos"
   - "PropTech: Real Estate Dashboard Generation"
   - "Legal Tech: Contract Management UI with AI"
   - "AgriTech Dashboard UIs from Field Recordings"
   - "HRTech: Employee Portal Generation"
   - "Logistics Dashboard from Warehouse Videos"
   - "Gaming UI/UX: Menu Systems from Gameplay"
   
7. **DEVELOPER EXPERIENCE** (engagement keywords):
   - "Why Senior Devs Are Secretly Using AI for Boilerplate"
   - "The Ethical Debate: AI-Generated Code in Production"
   - "Junior vs Senior: Who Benefits More from AI Coding?"
   - "10 AI Coding Tools Every React Dev Needs in 2026"
   
8. **FRAMEWORK MIGRATIONS** (problem-solving):
   - "Angular to React Migration Using Video Capture"
   - "Vue 2 to Vue 3: Let AI Handle the UI Migration"
   - "jQuery to Modern JS: Video-Based Refactoring"
   - "WordPress to Headless: UI Recreation with AI"
   
9. **COMPONENT LIBRARIES** (specific keywords):
   - "shadcn/ui Components from Video Recordings"
   - "Radix UI + Replay: Accessible Component Generation"
   - "Material UI 6 Recreation from Figma Videos"
   - "Ant Design Dashboards from Screen Recordings"
   - "Chakra UI v3 Components with AI Generation"
   
10. **CONTROVERSIAL / THOUGHT LEADERSHIP**:
    - "Is Manual CSS Dead? AI-Generated Tailwind Analysis"
    - "The Frontend Job Market After AI: 2026 Reality Check"
    - "Why Figma-to-Code Tools Are Already Obsolete"
    - "Video-to-Code Will Replace Design Handoff Forever"

11. **COMPARISONS** (high click-through):
    - "Lovable vs Bolt vs Replay: AI Builder Showdown 2026"
    - "v0.dev vs Replay: Screenshot vs Video Approach"
    - "GitHub Copilot Workspace vs Replay for UI Tasks"
    - "Figma AI vs Replay: Different Problems, Different Solutions"
    
12. **HOW-TO LONG-TAIL** (answer keywords):
    - "How to Build a SaaS Dashboard in Under 5 Minutes"
    - "How to Convert Figma Prototypes to React Code"
    - "How to Generate Landing Pages from Competitor Sites"
    - "How to Create Mobile Apps from Desktop UI Videos"

13. **LOCALIZED/LANGUAGE** (international SEO):
    - "Building RTL UIs for Arabic Markets with AI"
    - "Japanese UI Patterns: Recreating Yahoo Japan Layouts"
    - "German Enterprise UIs: SAP-Style Dashboard Generation"

**ABSOLUTE RULES:**
1. NO duplicate concepts - check ${existingTitles.length} existing titles
2. Each title = unique primary keyword
3. Mix frameworks: React, Vue, Svelte, Angular, Solid, Qwik, Astro
4. Include numbers when relevant: "5 Ways", "10x Faster", "$50K"
5. Target different search intents: informational, commercial, transactional
6. Balance: 30% trending, 30% evergreen, 20% technical, 20% business

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

  return `You are a Senior Developer Advocate for "Replay" - a revolutionary video-to-code engine that uses Gemini to reconstruct working UI from screen recordings.

ABOUT REPLAY:
- Replay analyzes VIDEO (not screenshots) to understand user behavior and intent
- Uses "Behavior-Driven Reconstruction" - video as source of truth
- Key features: Multi-page generation, Supabase integration, Style injection, Product Flow maps
- Unlike screenshot-to-code tools, Replay understands WHAT users are trying to do, not just what they see

WRITING RULES:
1. NO FLUFF. Never start with "In today's digital landscape..." - start with a hook, problem, or bold statement
2. Be technical but accessible. Include REAL, working code snippets
3. Structure with H2 (##) and H3 (###) headers
4. Mention "Replay" naturally 2-3 times as the solution
5. ${toneInstructions[tone] || toneInstructions.technical}

REQUIRED ELEMENTS (USE ALL):

1. **TL;DR Box** - Start with this right after intro:
\`\`\`
> **TL;DR:** One-sentence summary of the key takeaway from this article.
\`\`\`

2. **Comparison Tables** - Use REAL Markdown tables, not placeholders:
\`\`\`
| Feature | Tool A | Tool B | Replay |
|---------|--------|--------|--------|
| Video Input | ❌ | ❌ | ✅ |
| Behavior Analysis | ❌ | Partial | ✅ |
\`\`\`

3. **Code Blocks** - Include REAL, copy-paste ready code with language tags:
\`\`\`typescript
// Real working example
const example = async () => {
  const result = await fetch('/api/endpoint');
  return result.json();
};
\`\`\`

4. **Info/Warning Boxes** - Use blockquotes with emoji:
\`\`\`
> 💡 **Pro Tip:** Useful insight here

> ⚠️ **Warning:** Important caution here

> 📝 **Note:** Additional context here
\`\`\`

5. **Numbered Steps** for tutorials:
\`\`\`
### Step 1: Setup
Content...

### Step 2: Implementation  
Content...
\`\`\`

6. **Bullet Lists** for features/benefits:
- Clear benefit one
- Clear benefit two
- Clear benefit three

7. **FAQ Section** at the end:
\`\`\`
## Frequently Asked Questions

### Is Replay free to use?
Answer here...

### How is Replay different from v0.dev?
Answer here...
\`\`\`

8. **Call to Action** - End with:
\`\`\`
---

**Ready to try behavior-driven code generation?** [Get started with Replay](https://replay.build) - transform any video into working code in seconds.
\`\`\`

FORMAT REQUIREMENTS:
- Output ONLY Markdown content (no front matter, no title)
- NO placeholder text like [IMAGE:...] or [TABLE:...] - create REAL tables
- Target 1800-2500 words for comprehensive SEO coverage
- Include at least 2 code blocks, 1 table, 1 TL;DR, 1 FAQ section
- Use emoji sparingly but effectively (💡⚠️✅❌📝🚀)

NEVER mention you're an AI. Write as an expert developer sharing battle-tested insights.`;
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

Target Keyword: ${targetKeyword || title.split(' ').slice(0, 3).join(' ')}

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
        
        // Generate meta description
        let cleanContent = content
          .replace(/^>?\s*\*?\*?TL;?DR:?\*?\*?:?\s*/gim, '')
          .replace(/[#*`>\[\]]/g, '')
          .replace(/\n+/g, ' ')
          .trim();
        
        const sentences = cleanContent.split(/[.!?]+/).filter((s: string) => s.trim().length > 30);
        const metaDescription = sentences.length > 0 
          ? sentences[0].trim().substring(0, 155) + '...'
          : cleanContent.substring(0, 155).trim() + '...';

        const articleData: Record<string, any> = {
          title,
          slug,
          content,
          meta_description: metaDescription,
          target_keyword: targetKeyword || title.split(' ').slice(0, 3).join(' '),
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

Target Keyword: ${targetKeyword || title.split(' ').slice(0, 3).join(' ')}

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
          target_keyword: targetKeyword || title.split(' ').slice(0, 3).join(' '),
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
