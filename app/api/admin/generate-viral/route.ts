import { NextRequest, NextResponse } from "next/server";

// Gemini 3 Flash for cost-effective viral post generation
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

// ═══════════════════════════════════════════════════════════════════════════════
// CURATED ACCOUNTS TO ENGAGE - Updated list of builders, VCs, YC people
// ═══════════════════════════════════════════════════════════════════════════════
const ACCOUNTS_TO_ENGAGE = {
  // Tier 1: Must engage daily (high influence, relevant to your space)
  tier1: [
    { handle: "@taborlechon", name: "Tab", category: "VC/Angel", followers: "150k+", why: "YC Partner, tweets about startups daily", engageHow: "Reply to his founder advice tweets" },
    { handle: "@garrytan", name: "Garry Tan", category: "VC", followers: "500k+", why: "YC CEO, massive reach", engageHow: "Quote tweet his startup takes" },
    { handle: "@paulg", name: "Paul Graham", category: "VC/Founder", followers: "1M+", why: "YC founder, essay tweets get huge engagement", engageHow: "Add insights to his threads" },
    { handle: "@levelsio", name: "Pieter Levels", category: "Indie Hacker", followers: "500k+", why: "Solo founder king, your style inspiration", engageHow: "Reply with your own building updates" },
    { handle: "@tibo_maker", name: "Tibo", category: "Builder", followers: "200k+", why: "Your content style model", engageHow: "Engage with his product launches" },
    { handle: "@dhaborb", name: "Daniel Bourke", category: "AI/ML", followers: "100k+", why: "AI content creator, relevant to your tech", engageHow: "Share technical insights" },
  ],
  // Tier 2: Engage 3-4x per week (good reach, complementary audience)
  tier2: [
    { handle: "@marclouvion", name: "Marc Lou", category: "Indie Hacker", followers: "150k+", why: "Ships fast, similar vibe", engageHow: "Comment on his ship updates" },
    { handle: "@damaborelk", name: "Damon Chen", category: "Builder", followers: "50k+", why: "Founder content, enterprise angle", engageHow: "Engage on SaaS topics" },
    { handle: "@johnaparek", name: "John Rush", category: "Indie Hacker", followers: "80k+", why: "SEO & building audience", engageHow: "SEO and growth discussions" },
    { handle: "@swabornes", name: "Shaan Puri", category: "Podcaster/VC", followers: "300k+", why: "My First Million, startup ideas", engageHow: "React to business ideas" },
    { handle: "@gregisenberg", name: "Greg Isenberg", category: "Community/Startup", followers: "200k+", why: "Startup ideas, communities", engageHow: "Engage on community building" },
    { handle: "@JasonLemkin", name: "Jason Lemkin", category: "SaaS VC", followers: "200k+", why: "SaaStr founder, enterprise SaaS", engageHow: "Enterprise/SaaS discussions" },
  ],
  // Tier 3: Engage when relevant (niche but valuable)
  tier3: [
    { handle: "@ycombinator", name: "Y Combinator", category: "Accelerator", followers: "1M+", why: "YC official, tag when relevant", engageHow: "Reply to batch announcements" },
    { handle: "@sama", name: "Sam Altman", category: "AI/Tech", followers: "3M+", why: "OpenAI CEO, AI discussions", engageHow: "AI industry takes" },
    { handle: "@elabornd", name: "Elon Musk", category: "Tech", followers: "150M+", why: "X owner, massive reach", engageHow: "Only if genuinely relevant" },
    { handle: "@naval", name: "Naval", category: "Philosophy/VC", followers: "2M+", why: "Wisdom tweets, founder mindset", engageHow: "Add to philosophical discussions" },
    { handle: "@patrick_osh", name: "Patrick Collision", category: "Founder", followers: "400k+", why: "Stripe CEO, payments/fintech", engageHow: "Fintech/enterprise discussions" },
  ],
  // Tech Twitter - AI/Dev focused
  techAI: [
    { handle: "@karpathy", name: "Andrej Karpathy", category: "AI", followers: "800k+", why: "AI legend, technical credibility", engageHow: "Technical AI discussions" },
    { handle: "@svpino", name: "Santiago", category: "ML Engineer", followers: "300k+", why: "ML tutorials, AI engineering", engageHow: "AI implementation discussions" },
    { handle: "@emollick", name: "Ethan Mollick", category: "AI/Academia", followers: "500k+", why: "AI in business/education", engageHow: "AI use cases" },
  ]
};

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

// Calculate viral score for a post
function calculateViralScore(post: string): number {
  let score = 50; // Base score
  
  // Positive signals
  if (post.match(/\d+/)) score += 10;                    // Has specific numbers
  if (post.length < 200) score += 10;                    // Concise
  if (post.length > 100 && post.length < 250) score += 5; // Optimal length
  if (post.includes("$")) score += 5;                    // Money reference
  if (post.split("\n").length >= 3) score += 5;          // Good line breaks
  if (post.match(/^[A-Z].*[.!?]$/m)) score += 5;         // Punchy sentences
  if (post.match(/Day \d+:/)) score += 5;                // Timeline format
  if (post.match(/\d+%|\d+x|\d+ minutes?|\d+ hours?/i)) score += 5; // Specific metrics
  if (post.includes("vs") || post.includes("VS")) score += 3; // Comparison
  if (post.toLowerCase().includes("building")) score += 3; // Builder narrative
  
  // Negative signals
  if (post.includes("#") && post.match(/#/g)!.length > 1) score -= 15; // Too many hashtags
  const emojiCount = (post.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
  if (emojiCount > 2) score -= 10;                       // Too many emojis
  if (post.toLowerCase().includes("excited")) score -= 15; // Corporate speak
  if (post.toLowerCase().includes("thrilled")) score -= 15;
  if (post.toLowerCase().includes("honored")) score -= 10;
  if (post.toLowerCase().includes("just launched")) score -= 10;
  if (post.toLowerCase().includes("proud to announce")) score -= 15;
  if (post.length > 280) score -= 20;                    // Too long for single tweet
  if (post.length > 350) score -= 10;                    // Way too long
  if (!post.match(/[.!?]$/)) score -= 5;                 // Doesn't end with punctuation
  
  return Math.max(0, Math.min(100, score));
}

// Extract hooks from post
function extractHooks(post: string): string[] {
  const lines = post.split("\n").filter(l => l.trim());
  const hooks: string[] = [];
  
  // First line is usually the hook
  if (lines[0]) hooks.push(lines[0]);
  
  // Look for contrarian statements
  const contrarianMatch = post.match(/(?:Unpopular opinion|Hot take|Controversial)[:\s]*.+/i);
  if (contrarianMatch) hooks.push(contrarianMatch[0]);
  
  // Look for number-based hooks
  const numberHook = post.match(/^\d+[%xk]?\s+.+/m);
  if (numberHook) hooks.push(numberHook[0]);
  
  return [...new Set(hooks)].slice(0, 3);
}

// Build the system prompt with Replay DNA and Tibo style
function buildViralPrompt(category: string, tone: string): string {
  const categoryInstructions: Record<string, string> = {
    arrogant: `CATEGORY: "The Arrogant Builder" (Speed & Efficiency)
Pattern: "I did X in Y time. You're still doing Z."
Hook: Brutal comparison of legacy world vs your AI-powered approach.
Example: "Migrated a 2008 CRM in 4 minutes. Accenture quoted $2M for 18 months."
Style: Flex your speed, mock the old way, but show real results.`,
    
    numbers: `CATEGORY: "The Numbers Flex" (Transparency & Traction)
Pattern: "Day 1: X. Day N: Y. Here's how."
Hook: Impressive metric or growth number upfront.
Example: "Day 1: Video-to-Code idea. Day 21: 2 Enterprise pilots signed."
Style: Timeline format, show exponential progress, transparency wins.`,
    
    contrarian: `CATEGORY: "The Contrarian Take" (Challenge Status Quo)
Pattern: "Unpopular opinion: X is NOT Y"
Hook: Statement that will trigger traditional developers/consultants.
Example: "Source code is NOT the source of truth. The video is."
Style: Challenge conventional wisdom, explain why you're right.`,
    
    philosophy: `CATEGORY: "The Philosophy" (Founder Lifestyle)
Pattern: "I used to X. Now I Y. The game changed."
Hook: Personal transformation through AI/tools.
Example: "I used to spend weeks documenting APIs. Now my AI watches and does it while I drink coffee."
Style: Inspirational but grounded, show the new reality.`
  };

  const toneInstructions: Record<string, string> = {
    aggressive: "Be bold, direct, slightly provocative. Use strong statements. Challenge the reader.",
    "data-driven": "Lead with numbers and metrics. Every claim backed by data. Specific > vague.",
    philosophical: "Reflective, thoughtful. Share insights about the builder journey. Less flex, more wisdom.",
    meme: "Witty, self-aware, internet-native. Reference common dev/startup memes. Keep it light but smart."
  };

  return `You are a viral Twitter/X ghostwriter for a solo technical founder building Replay - a high-growth AI startup.

═══════════════════════════════════════════════════════════════════════════════
🧠 REPLAY DNA (YOU ARE THIS FOUNDER)
═══════════════════════════════════════════════════════════════════════════════

WHAT REPLAY IS:
- Video-to-Code AI platform for Enterprise Legacy Migration
- Records user workflows on legacy systems, generates modern React/Tailwind code
- Competes with IBM, Accenture, KPMG (but 100x faster, 10x cheaper)
- Visual Reverse Engineering - the video IS the source of truth, not the code

YOUR STORY:
- Solo founder with AI agents doing the work of a 10-person team
- YC Interview invited (or preparing for it)
- Building in public, shipping daily
- Used to work at [big tech/consultancy], saw the $3.6T technical debt problem

KEY FACTS TO USE:
- 4 minutes to migrate a legacy screen (vs 40 hours manual)
- 70% of legacy rewrites fail
- $2M+ saved vs traditional consultants
- Enterprise pilots with Fortune 500 companies
- "Headcount is a vanity metric when you have AI agents"

═══════════════════════════════════════════════════════════════════════════════
🎯 ${categoryInstructions[category] || categoryInstructions.arrogant}
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
🎨 TONE: ${toneInstructions[tone] || toneInstructions.aggressive}
═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
📝 TIBO-STYLE WRITING RULES (CRITICAL)
═══════════════════════════════════════════════════════════════════════════════

DO:
1. SHORT SENTENCES. Punchy. No fluff.
2. Use SPECIFIC numbers: "4 minutes" not "a few minutes", "$2M" not "millions"
3. Break lines frequently - 1-2 sentences per line max
4. Start with a HOOK - number, controversial statement, or bold claim
5. Be slightly arrogant but ALWAYS backed by data/results
6. End with "Building X in public" OR a provocative question
7. Keep under 280 characters per tweet (can be thread-starter)
8. Use contrast: Legacy way vs Your way
9. Reference: @tibo_maker @levelsio style

DON'T:
- "Just launched..."
- "Excited to announce..."
- "Thrilled to share..."
- "Proud to announce..."
- More than 1 hashtag
- More than 1 emoji (if any)
- Corporate speak
- Humble bragging without data
- Vague claims

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Generate EXACTLY 3 tweet variations. Output as JSON:

{
  "posts": [
    {
      "content": "The full tweet text here...",
      "callToAction": "Suggested CTA for engagement (e.g., 'reply with your legacy horror story')"
    },
    {
      "content": "Second variation...",
      "callToAction": "CTA suggestion"
    },
    {
      "content": "Third variation...",
      "callToAction": "CTA suggestion"
    }
  ],
  "altText": "If an image/video is mentioned, provide SEO-optimized alt text for X"
}

Output ONLY valid JSON. No markdown, no explanation.`;
}

// Build prompt for generating replies to other people's tweets
function buildReplyPrompt(): string {
  return `You are a Twitter/X engagement expert for a solo founder building Replay - a Video-to-Code AI startup.

═══════════════════════════════════════════════════════════════════════════════
🧠 YOUR PERSONA (Replay Founder)
═══════════════════════════════════════════════════════════════════════════════
- Building Video-to-Code AI for Enterprise Legacy Migration
- Solo founder with AI agents = 10-person team output
- YC applicant/interview stage
- Technical but business-savvy
- Building in public

═══════════════════════════════════════════════════════════════════════════════
📝 REPLY STRATEGY RULES
═══════════════════════════════════════════════════════════════════════════════

GOAL: Get noticed, add value, build relationships with influential accounts.

DO:
1. ADD VALUE - Share insight, data, or experience the author didn't mention
2. BE SPECIFIC - Reference your actual work ("I built X that does Y")
3. ASK SMART QUESTIONS - Shows you read and understood their post
4. SLIGHT FLEX - Mention Replay naturally if relevant (not forced)
5. SHORT - 1-3 sentences max, punchy
6. AGREE AND AMPLIFY - If you agree, add supporting evidence
7. RESPECTFUL CONTRARIAN - If you disagree, explain why with data

DON'T:
- "Great post!" or generic praise (worthless)
- "Check out my product" (spammy)
- Long essays in replies
- Disagreeing without substance
- Tagging people randomly

REPLY TYPES:
1. "Value Add" - Share related insight from your experience
2. "Question" - Ask thoughtful follow-up question
3. "Agree + Amplify" - Agree and add supporting data/story
4. "Contrarian" - Respectfully disagree with reasoning
5. "Story" - Share brief relevant personal experience

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

Generate 3 reply variations. Output as JSON:

{
  "replies": [
    {
      "content": "Reply text here...",
      "type": "value_add|question|agree_amplify|contrarian|story",
      "engagementPotential": "high|medium|low",
      "rationale": "Why this reply works"
    }
  ],
  "bestPick": 0,
  "shouldMentionReplay": true/false,
  "suggestedFollowUp": "If they respond, say this..."
}

Output ONLY valid JSON.`;
}

// Build prompt for daily engagement plan
function buildDailyPlanPrompt(): string {
  return `You are a Twitter/X growth strategist for a solo founder building Replay - a Video-to-Code AI startup.

═══════════════════════════════════════════════════════════════════════════════
🎯 GOAL: Build Twitter presence to support YC application and attract enterprise leads
═══════════════════════════════════════════════════════════════════════════════

Today's date context will be provided. Generate a personalized daily engagement plan.

DAILY ENGAGEMENT FRAMEWORK:
1. MORNING (9-11 AM EST / 15-17 PL): Post original content
2. MIDDAY: Reply to 5-10 relevant tweets from big accounts
3. EVENING: Engage with any replies to your posts

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT
═══════════════════════════════════════════════════════════════════════════════

{
  "date": "Today's date",
  "theme": "Daily content theme suggestion",
  "tasks": [
    {
      "time": "9:00 AM EST",
      "action": "POST",
      "description": "Post about X topic",
      "priority": "high",
      "category": "original_content|reply|quote_tweet|engage"
    }
  ],
  "accountsToEngage": [
    {
      "handle": "@username",
      "reason": "Why engage today",
      "suggestedApproach": "How to engage"
    }
  ],
  "contentIdeas": [
    "Idea 1 based on current context",
    "Idea 2"
  ],
  "weeklyGoal": "Engagement target for the week",
  "tip": "One actionable tip for today"
}

Output ONLY valid JSON.`;
}

// Build prompt for mention suggestions
function buildMentionPrompt(): string {
  return `You are a Twitter/X strategist. Given a tweet draft, suggest who to mention/tag to maximize reach and relevance.

RULES:
- Only suggest mentions if genuinely relevant
- Max 2 mentions per tweet (more looks spammy)
- Prefer accounts likely to engage back
- Consider: Is this person interested in this topic?

OUTPUT FORMAT:
{
  "mentions": [
    {
      "handle": "@username",
      "reason": "Why mention them",
      "likelihood": "high|medium|low"
    }
  ],
  "shouldMention": true/false,
  "warning": "Any caution about mentioning"
}

Output ONLY valid JSON.`;
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
      mode = "post",     // "post" | "reply" | "daily-plan" | "mentions"
      context,           // For post mode: what happened
      category = "arrogant", 
      tone = "aggressive",
      assetUrl,
      originalTweet,     // For reply mode: the tweet to reply to
      originalAuthor,    // For reply mode: who wrote it
      tweetDraft,        // For mentions mode: draft to analyze
      recentActivity,    // For daily-plan: what you did recently
    } = body;

    // ═══════════════════════════════════════════════════════════════════════
    // MODE: GENERATE VIRAL POST
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "post") {
      if (!context || context.trim().length < 5) {
        return NextResponse.json({ error: "Context is required (min 5 characters)" }, { status: 400 });
      }

      const systemPrompt = buildViralPrompt(category, tone);
      const userPrompt = `Context to turn into viral post:
"${context}"

${assetUrl ? `Asset URL (image/video): ${assetUrl}\nGenerate alt text for this asset.` : 'No asset provided.'}

Generate 3 viral tweet variations based on this context. Use the ${category} category style and ${tone} tone.

Remember: Short sentences. Specific numbers. Line breaks. Hook first. Under 280 chars each.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "I understand. I'm ready to generate viral Tibo-style posts for Replay. Send me the context." }] },
              { role: "user", parts: [{ text: userPrompt }] }
            ],
            generationConfig: { temperature: 0.9, maxOutputTokens: 2048, topP: 0.95 },
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      let parsed;
      try {
        const cleanJson = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response", raw: generatedText }, { status: 500 });
      }

      const postsWithScores = parsed.posts.map((post: { content: string; callToAction?: string }) => ({
        content: post.content,
        viralScore: calculateViralScore(post.content),
        hooks: extractHooks(post.content),
        callToAction: post.callToAction || "What's your take?",
        charCount: post.content.length,
      }));

      let bestPick = 0;
      let highestScore = 0;
      postsWithScores.forEach((post: { viralScore: number }, index: number) => {
        if (post.viralScore > highestScore) {
          highestScore = post.viralScore;
          bestPick = index;
        }
      });

      return NextResponse.json({
        mode: "post",
        posts: postsWithScores,
        altText: parsed.altText || null,
        bestPick,
        category,
        tone,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODE: GENERATE REPLY
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "reply") {
      if (!originalTweet || originalTweet.trim().length < 5) {
        return NextResponse.json({ error: "Original tweet is required" }, { status: 400 });
      }

      const systemPrompt = buildReplyPrompt();
      const userPrompt = `Original tweet to reply to:
Author: ${originalAuthor || "Unknown"}
Tweet: "${originalTweet}"

Generate 3 smart reply variations that will get noticed and add value.
Remember: Short, specific, add insight. No generic "great post!" replies.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "I understand. I'll generate strategic replies that add value and get noticed. Send me the tweet." }] },
              { role: "user", parts: [{ text: userPrompt }] }
            ],
            generationConfig: { temperature: 0.85, maxOutputTokens: 2048, topP: 0.9 },
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      let parsed;
      try {
        const cleanJson = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response", raw: generatedText }, { status: 500 });
      }

      return NextResponse.json({
        mode: "reply",
        replies: parsed.replies || [],
        bestPick: parsed.bestPick || 0,
        shouldMentionReplay: parsed.shouldMentionReplay || false,
        suggestedFollowUp: parsed.suggestedFollowUp || null,
        originalTweet: originalTweet.substring(0, 100),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODE: DAILY ENGAGEMENT PLAN
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "daily-plan") {
      const systemPrompt = buildDailyPlanPrompt();
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const userPrompt = `Generate today's engagement plan.

Date: ${today}
Recent activity: ${recentActivity || "Building Replay, shipped new features, preparing for YC"}

Consider:
- What day of the week it is (engagement varies by day)
- Current startup narrative (YC application, building in public)
- Mix of original posts and replies

Suggest specific accounts to engage with today from this curated list:
${JSON.stringify(ACCOUNTS_TO_ENGAGE.tier1.slice(0, 3), null, 2)}

Generate a complete daily plan.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "I understand. I'll create a strategic daily engagement plan. Send me today's context." }] },
              { role: "user", parts: [{ text: userPrompt }] }
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 3000, topP: 0.9 },
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      let parsed;
      try {
        const cleanJson = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response", raw: generatedText }, { status: 500 });
      }

      return NextResponse.json({
        mode: "daily-plan",
        ...parsed,
        allAccounts: ACCOUNTS_TO_ENGAGE, // Include full account list
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODE: MENTION SUGGESTIONS
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "mentions") {
      if (!tweetDraft || tweetDraft.trim().length < 10) {
        return NextResponse.json({ error: "Tweet draft is required" }, { status: 400 });
      }

      const systemPrompt = buildMentionPrompt();
      const userPrompt = `Tweet draft to analyze:
"${tweetDraft}"

Available accounts that might be relevant:
${JSON.stringify([...ACCOUNTS_TO_ENGAGE.tier1, ...ACCOUNTS_TO_ENGAGE.tier2].map(a => ({ handle: a.handle, category: a.category })), null, 2)}

Who should be mentioned in this tweet, if anyone?`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: systemPrompt }] },
              { role: "model", parts: [{ text: "I understand. I'll analyze the tweet and suggest relevant mentions. Send me the draft." }] },
              { role: "user", parts: [{ text: userPrompt }] }
            ],
            generationConfig: { temperature: 0.5, maxOutputTokens: 1024, topP: 0.9 },
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      let parsed;
      try {
        const cleanJson = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleanJson);
      } catch {
        return NextResponse.json({ error: "Failed to parse AI response", raw: generatedText }, { status: 500 });
      }

      return NextResponse.json({
        mode: "mentions",
        ...parsed,
        tweetDraft: tweetDraft.substring(0, 100),
      });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MODE: GET ACCOUNTS LIST
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "accounts") {
      return NextResponse.json({
        mode: "accounts",
        accounts: ACCOUNTS_TO_ENGAGE,
      });
    }

    return NextResponse.json({ error: "Invalid mode. Use: post, reply, daily-plan, mentions, accounts" }, { status: 400 });

  } catch (error: any) {
    console.error("Viral generation error:", error);
    return NextResponse.json({ error: error.message || "Generation failed" }, { status: 500 });
  }
}

// GET endpoint to test connection
export async function GET() {
  return NextResponse.json({ 
    status: "ok",
    endpoint: "Viral Post Generator",
    categories: ["arrogant", "numbers", "contrarian", "philosophy"],
    tones: ["aggressive", "data-driven", "philosophical", "meme"]
  });
}
