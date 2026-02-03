import { NextRequest, NextResponse } from "next/server";

// Gemini 3 Flash for cost-effective viral post generation
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
      context,           // What happened - "Got YC interview", "Fixed a bug"
      category = "arrogant", // arrogant, numbers, contrarian, philosophy
      tone = "aggressive",   // aggressive, data-driven, philosophical, meme
      assetUrl,          // Optional image/video URL
    } = body;

    if (!context || context.trim().length < 5) {
      return NextResponse.json({ error: "Context is required (min 5 characters)" }, { status: 400 });
    }

    // Build prompt
    const systemPrompt = buildViralPrompt(category, tone);
    
    const userPrompt = `Context to turn into viral post:
"${context}"

${assetUrl ? `Asset URL (image/video): ${assetUrl}\nGenerate alt text for this asset.` : 'No asset provided.'}

Generate 3 viral tweet variations based on this context. Use the ${category} category style and ${tone} tone.

Remember: Short sentences. Specific numbers. Line breaks. Hook first. Under 280 chars each.`;

    // Call Gemini API
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
          generationConfig: {
            temperature: 0.9, // Higher for creative variation
            maxOutputTokens: 2048,
            topP: 0.95,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Parse JSON response
    let parsed;
    try {
      // Clean up potential markdown formatting
      const cleanJson = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", generatedText);
      return NextResponse.json({ 
        error: "Failed to parse AI response",
        raw: generatedText 
      }, { status: 500 });
    }

    // Calculate viral scores and extract hooks for each post
    const postsWithScores = parsed.posts.map((post: { content: string; callToAction?: string }, index: number) => ({
      content: post.content,
      viralScore: calculateViralScore(post.content),
      hooks: extractHooks(post.content),
      callToAction: post.callToAction || "What's your take?",
      charCount: post.content.length,
    }));

    // Find the best pick (highest viral score)
    let bestPick = 0;
    let highestScore = 0;
    postsWithScores.forEach((post: { viralScore: number }, index: number) => {
      if (post.viralScore > highestScore) {
        highestScore = post.viralScore;
        bestPick = index;
      }
    });

    return NextResponse.json({
      posts: postsWithScores,
      altText: parsed.altText || null,
      bestPick,
      category,
      tone,
      context: context.substring(0, 100), // Echo back truncated context
    });

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
