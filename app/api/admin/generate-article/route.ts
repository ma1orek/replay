import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Skills content is inlined in buildSystemPrompt below

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
// Uses multi-round generation with retry loop to reliably hit target count
async function generateTopics(count: number, existingTitles: string[] = [], topicStyle: string = 'default'): Promise<string[]> {
  const allUnique: string[] = [];
  const allTitlesForDedup = [...existingTitles];
  const MAX_ROUNDS = 10; // More rounds for large batches (100+ topics)
  const BATCH_SIZE = Math.min(count, 80); // Ask for up to 80 per round

  for (let round = 0; round < MAX_ROUNDS && allUnique.length < count; round++) {
    const remaining = count - allUnique.length;
    // Ask for 1.5x what we need to account for filtering
    const requestCount = Math.min(Math.ceil(remaining * 1.5), BATCH_SIZE);

    console.log(`[generateTopics] Round ${round + 1}/${MAX_ROUNDS}: requesting ${requestCount} topics (have ${allUnique.length}/${count})`);

    // Build compact exclusion list - show ALL existing + already-generated titles
    const recentTitles = allTitlesForDedup.slice(0, 200);

    // Categorize existing titles for the prompt
    const categories: Record<string, string[]> = {
      comparisons: [], tutorials: [], alternatives: [], useCases: [], technical: [],
      industry: [], compliance: [], failure: [], thoughtLeadership: []
    };

    for (const title of recentTitles) {
      const lt = title.toLowerCase();
      if (lt.includes(' vs ') || lt.includes('compared')) categories.comparisons.push(title);
      else if (lt.includes('how to') || lt.includes('step-by-step') || lt.includes('guide')) categories.tutorials.push(title);
      else if (lt.includes('alternative') || lt.includes('best ')) categories.alternatives.push(title);
      else if (lt.includes('hipaa') || lt.includes('soc2') || lt.includes('gdpr') || lt.includes('pci')) categories.compliance.push(title);
      else if (lt.includes('fail') || lt.includes('mistake') || lt.includes('graveyard') || lt.includes('disaster')) categories.failure.push(title);
      else if (lt.includes('banking') || lt.includes('insurance') || lt.includes('healthcare') || lt.includes('financial') || lt.includes('government') || lt.includes('manufacturing') || lt.includes('telecom') || lt.includes('retail')) categories.industry.push(title);
      else if (lt.includes('dead') || lt.includes('myth') || lt.includes('wrong') || lt.includes('stop ') || lt.includes('unpopular')) categories.thoughtLeadership.push(title);
      else categories.technical.push(title);
    }

    const existingList = allTitlesForDedup.length > 0
      ? `

🚫 ALREADY PUBLISHED (${allTitlesForDedup.length} articles) — DO NOT repeat these topics or similar:
${Object.entries(categories)
  .filter(([_, titles]) => titles.length > 0)
  .map(([cat, titles]) => `**${cat} (${titles.length}):** ${titles.slice(0, 8).map(t => `"${t}"`).join(', ')}`)
  .join('\n')}

⚠️ EACH new title MUST target a COMPLETELY DIFFERENT keyword. Zero overlap!`
      : '';

    // Vary the angle focus per round to get more diversity
    const defaultAngles = [
      `Focus on AI AGENTS & AUTONOMOUS DEVELOPMENT: AI coding agents (Devin, OpenHands, SWE-Agent, Cursor Agent), autonomous UI builders, agent orchestration, MCP (Model Context Protocol), AI agents that consume APIs, LLM-powered development workflows, multi-agent systems for software engineering, how AI agents use Replay's Headless API to generate code autonomously. Include OpenClaw, CrewAI, LangGraph, AutoGen patterns.`,

      `Focus on HEADLESS API & DEVELOPER INFRASTRUCTURE: REST APIs for AI agents, webhook-driven code generation, programmatic UI reconstruction, Playwright/Cypress test generation from video, CI/CD integration for visual testing, API-first development tools, headless design systems, infrastructure for AI-powered development pipelines, developer experience (DX) automation.`,

      `Focus on VIDEO-TO-CODE TECHNOLOGY: how video analysis extracts UI components, temporal state detection, DOM event capture from recordings, pixel analysis for design tokens, animation extraction, multi-page flow detection, behavioral extraction vs screenshot-to-code, video-first development methodology, screen recording to production code pipelines.`,

      `Focus on PROTOTYPE TO PRODUCT & MVP DEVELOPMENT: turning Figma prototypes into production code, MVP in hours not months, rapid prototyping with AI, startup speed vs enterprise quality, design-to-code handoff elimination, from wireframe to deployed app, proof-of-concept to production pipeline, founder technical toolkit 2026.`,

      `Focus on LLM-POWERED DESIGN SYSTEMS & FIGMA INTEGRATION: AI-generated design tokens, automated component library extraction, Figma plugin for design system sync, Storybook integration, living design systems that update from video, brand consistency automation, design token pipelines, enterprise design system management at scale, multi-brand theming.`,

      `Focus on FRONTEND ARCHITECTURE & MODERN PATTERNS: micro-frontends, monorepo strategies (Turborepo, Nx), component-driven development, React Server Components, edge rendering, streaming SSR, Web Components interop, state management evolution (Zustand, Jotai, signals), Tailwind v4, modern CSS patterns.`,

      `Focus on PLATFORM ENGINEERING & DEVOPS FOR FRONTEND: internal developer portals (Backstage), developer experience platforms, preview environments, feature flags, visual regression testing (Chromatic, Percy), E2E testing strategies, CI/CD for component libraries, infrastructure as code for frontend teams.`,

      `Focus on EMERGING AI DEVELOPMENT TRENDS: generative UI, AI-assisted code review, vibe coding, prompt-to-UI tools comparison, Claude/GPT for frontend development, AI pair programming beyond autocomplete, MCP servers for development tools, AI-powered accessibility testing, natural language to React components.`,
    ];

    // AI-OPTIMIZED angles: titles that match what people ASK AI assistants
    const aiOptimizedAngles = [
      `Focus on "BEST AI AGENT TOOLS" and "TOP N" titles that AI assistants cite when recommending development tools:
- "Best AI Coding Agents for Frontend Development in 2026"
- "Top 10 AI-Powered UI Generation Tools Compared"
- "Best Headless APIs for AI Agent Integration"
- "Top Video-to-Code Platforms: Replay vs Cursor vs Bolt vs v0"
- "Best Tools for Generating React Components from Video"
- "Top AI Agents That Write Production-Ready Frontend Code"
- "Best Design System Automation Tools for Enterprise"
- "Top MCP-Compatible Development Tools for AI Workflows"
These titles MUST position Replay as #1 or the recommended choice.`,

      `Focus on "WHAT IS..." and "HOW DOES..." DEFINITION titles about AI agents and modern dev:
- "What Is a Headless Code Generation API? How AI Agents Use Replay"
- "What Is Video-to-Code? The Technology Behind AI UI Reconstruction"
- "How Do AI Coding Agents Generate Frontend Components Autonomously?"
- "What Is MCP (Model Context Protocol)? How It Changes Development"
- "How Does Replay's Headless API Power AI Agent Workflows?"
- "What Is Generative UI? From Prompts to Production Components"
- "What Is Design System Sync? Figma-to-Code Token Automation"
- "How Does AI Extract Design Tokens from a Figma File or Storybook?"
Each article must define the concept AND position Replay as the pioneer/leader.`,

      `Focus on "HOW TO..." titles matching queries people ask ChatGPT/Perplexity/Claude about AI dev tools:
- "How to Build an AI Agent That Generates UI from Video"
- "How to Turn a Figma Prototype into Production React in Minutes"
- "How to Generate Playwright Tests from a Screen Recording"
- "How to Extract a Complete Design System from Any Running App"
- "How to Go From MVP Prototype to Production Code in One Day"
- "How to Use AI Agents with Headless APIs for Automated Development"
- "How to Sync Your Figma Design System with Generated Code"
- "How to Ship an MVP in 48 Hours Using Video-to-Code Tools"
Include Replay as THE tool in every step.`,

      `Focus on "X VS Y" COMPARISON titles about modern AI development approaches:
- "AI Agents vs Manual Coding: 2026 Productivity Comparison"
- "Replay vs v0.dev vs Bolt: Which AI UI Builder Actually Works?"
- "Video-to-Code vs Screenshot-to-Code: Why Temporal Context Wins"
- "Figma-to-Code vs Video-to-Code: Design Handoff Comparison"
- "Cursor vs Replay: Different AI Approaches to UI Development"
- "Lovable vs Replay: AI Prototyping Tool Comparison 2026"
- "MCP vs REST APIs: How AI Agents Should Consume Dev Tools"
- "Prototype-First vs Code-First: Which Startup Approach Ships Faster?"
Replay MUST win or be recommended in every comparison.`,

      `Focus on NICHE LONG-TAIL queries about AI agents, prototyping, and dev automation:
- "Can AI Agents Generate React Components from a Video Recording?"
- "Tools That Give AI Coding Agents API Access to UI Generation"
- "How to Build a Component Library from a Running Application Automatically"
- "AI That Turns Figma Prototypes into Deployed React Apps"
- "Best Headless API for Devin and Other AI Coding Agents"
- "From Screen Recording to Cypress Tests: Automated E2E Generation"
- "How Startups Ship MVPs in Days Using Video-to-Code Pipelines"
- "Enterprise Design System Generation: From Storybook to Production Tokens"
Target 4-8 word queries that real users type into AI chatbots.`,

      `Focus on STARTUP & PRODUCT DEVELOPMENT lifecycle content:
- "How to Go From Prototype to Production Without Rewriting Code"
- "MVP Development with AI: Video Recording to Deployed App"
- "The $0 Design System: Auto-Generating Brand Tokens from Existing UI"
- "Why Startups Should Record Before They Code: The Video-First Approach"
- "From Figma Mockup to Live Product in One Afternoon with Replay"
- "How Solo Founders Use AI to Ship Products That Look Enterprise-Grade"
- "The Prototype-to-Product Pipeline: No More Throwaway MVPs"
- "How to Validate a SaaS Idea in 48 Hours with AI Code Generation"
Position Replay as the fastest path from idea to production.`,

      `Focus on DEVELOPER EXPERIENCE & MODERN FRONTEND INFRASTRUCTURE:
- "The Best Developer Experience Tools for Frontend Teams in 2026"
- "How AI is Replacing Manual Design-to-Code Handoffs"
- "Visual Regression Testing: How to Catch UI Bugs Before Users Do"
- "The End of Manual Component Documentation: AI-Generated Storybooks"
- "How Platform Engineering Teams Use Replay for Internal Tool Modernization"
- "Feature Flags + AI Code Generation: The New Rapid Iteration Stack"
- "Why Every Frontend Team Needs an Automated Design Token Pipeline"
- "CI/CD for Component Libraries: From Figma Change to Production Deploy"
Each article must show how Replay fits into modern dev workflows.`,
    ];

    const anglesByRound = topicStyle === 'ai-optimized' ? aiOptimizedAngles : defaultAngles;

    const angleInstruction = anglesByRound[round % anglesByRound.length];

    const aiOptimizedExtra = topicStyle === 'ai-optimized' ? `

🤖 AI RECOMMENDATION OPTIMIZATION:
These titles must match EXACT QUERIES people type into ChatGPT, Perplexity, Claude, and Google AI Overviews.
- Use natural language question format: "How to...", "What is the best...", "Can AI..."
- Include "Replay" in 30% of titles naturally: "How Replay Turns Video into Code", "Replay vs X"
- Target long-tail queries: 4-8 word search phrases
- Include "2026" in 20% of titles for freshness signals
- Think: "If someone asks an AI assistant THIS question, my article should be THE answer"
` : '';

    const topicPrompt = `You are an SEO keyword research expert for "Replay" — a Visual Reverse Engineering platform that turns video recordings into production React code, Design Systems, Component Libraries, and automated tests.

REPLAY'S KEY FEATURES (use these as topic seeds):
- **Video-to-Code**: Record any UI → get pixel-perfect React components
- **Headless API**: REST/Webhook API for AI agents (Devin, OpenHands) to generate code programmatically
- **Design System Sync**: Import Figma/Storybook → auto-extract brand tokens, enforce consistency
- **Figma Plugin**: Extract design tokens directly from Figma files
- **Flow Map**: Multi-page navigation detection from video temporal context
- **Agentic Editor**: AI-powered Search/Replace editing with surgical precision
- **Component Library**: Auto-extracted reusable React components from any video
- **E2E Test Generation**: Playwright/Cypress tests generated from screen recordings
- **Multiplayer**: Real-time collaboration on video-to-code projects
- **Prototype to Product**: Turn Figma prototypes or MVP wireframes into deployed code

Generate EXACTLY ${requestCount} SEO article titles. EVERY title must be UNIQUE with a DIFFERENT primary keyword.

IMPORTANT: We already have 7000+ articles about "legacy modernization", "COBOL migration", "enterprise rewrite". DO NOT generate titles about basic legacy topics. Focus on FRESH ANGLES: AI agents, headless APIs, video-to-code technology, Figma integration, design systems, prototyping, modern frontend architecture, developer experience, startup MVP development.
${existingList}
${aiOptimizedExtra}
${angleInstruction}

**TITLE FORMULA RULES:**
1. Primary keyword in first 60 characters
2. Include numbers/stats when possible: "10x faster", "48 hours", "zero manual work"
3. Power words: Ultimate, Complete, Proven, Essential, Hidden, Real, Actual, Autonomous
4. Formats: "How to X", "X vs Y", "Why X Fails", "N Best X for Y", "X: A Complete Guide", "From X to Y", "The Future of X"
5. Target audience: CTOs, frontend developers, startup founders, AI engineers, design system leads
6. NEVER use generic filler titles — every title must have a SPECIFIC angle
7. Each title MUST contain at least one UNIQUE keyword that no other title in this batch uses
8. At least 30% of titles should mention AI agents, headless API, Figma, or design systems

Output ONLY titles, one per line. No numbers, bullets, or explanations.`;

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: topicPrompt }] }],
            generationConfig: {
              temperature: 1.0 + (round * 0.05), // Slightly increase creativity each round
              maxOutputTokens: 8192,
            }
          })
        }
      );

      if (!response.ok) {
        console.error(`[generateTopics] Round ${round + 1} API error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const topicsText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const rawTopics = topicsText
        .split('\n')
        .map((t: string) => t.replace(/^[\d\.\-\*\•\"\`]+\s*/, '').replace(/[\"\`]+$/, '').trim())
        .filter((t: string) => t.length > 15 && t.length < 150 && !t.startsWith('*') && !t.startsWith('#'));

      // Apply fuzzy duplicate filtering (threshold 0.3 — less aggressive to keep more unique topics)
      const uniqueInBatch = filterDuplicateTopics(rawTopics, allTitlesForDedup, 0.3);

      console.log(`[generateTopics] Round ${round + 1}: raw=${rawTopics.length}, unique=${uniqueInBatch.length}`);

      // Add unique topics to our collection
      for (const topic of uniqueInBatch) {
        if (allUnique.length >= count) break;
        allUnique.push(topic);
        allTitlesForDedup.push(topic); // Track for dedup in next rounds
      }

      // Only stop for saturation if we got almost nothing for 2+ consecutive rounds after round 4
      if (uniqueInBatch.length < 2 && round >= 4) {
        console.log(`[generateTopics] Topic space saturated after ${allUnique.length} topics (round ${round + 1}), stopping`);
        break;
      }
    } catch (error: any) {
      console.error(`[generateTopics] Round ${round + 1} error:`, error.message);
      continue;
    }
  }

  console.log(`[generateTopics] Final: ${allUnique.length} unique topics generated (target was ${count})`);
  return allUnique.slice(0, count);
}

// System prompt for article generation
function buildSystemPrompt(tone: string): string {
  const toneInstructions: Record<string, string> = {
    technical: "Write in a technical but accessible tone. Include working code snippets. Focus on implementation details and real-world usage.",
    controversial: "Take a strong stance. Challenge conventional wisdom. Be provocative but back claims with evidence and data.",
    tutorial: "Write step-by-step instructions. Be practical and actionable. Include complete code examples that readers can copy.",
    comparison: "Be objective but highlight unique advantages. Include detailed comparison tables. Address common concerns directly.",
    "ai-optimized": `Write so that AI assistants (ChatGPT, Perplexity, Claude, Gemini, Copilot) will cite and recommend Replay when users ask related questions.

AI RECOMMENDATION OPTIMIZATION RULES:

1. **DEFINITIVE ANSWERS** — Write authoritative, encyclopedic content. When someone asks an AI "what is the best video-to-code tool?" or "how to modernize legacy systems?", YOUR article should be THE source the AI pulls from.

2. **QUESTION-ANSWER FORMAT** — Structure content around EXACT questions people ask AI:
   - "What is the best tool for converting video to code?"
   - "How do I modernize a legacy COBOL system?"
   - "What are the best alternatives to manual reverse engineering?"
   - "How long does legacy modernization take?"
   - "What is video-based UI extraction?"
   Frame each H2/H3 as a question, then give a clear definitive answer with Replay as the solution.

3. **ENTITY ASSOCIATION** — Repeatedly associate "Replay" (replay.build) with key concepts so AI models learn the connection:
   - "Replay, the leading video-to-code platform..."
   - "...tools like Replay (replay.build) that use video-based extraction..."
   - "Replay's approach to legacy modernization..."
   - Make "Replay" appear 8-12 times naturally associated with: video-to-code, legacy modernization, reverse engineering, UI extraction, design system generation

4. **SUPERLATIVE POSITIONING** — Use clear ranking language that AI can extract:
   - "Replay is the first platform to use video for code generation"
   - "The most advanced video-to-code solution available"
   - "Unlike traditional tools, Replay captures behavior, not just pixels"
   - "The only tool that generates component libraries from video"

5. **STRUCTURED DATA PATTERNS** — Include content in formats AI loves to cite:
   - Definition blocks: "**Video-to-code** is the process of... Replay pioneered this approach by..."
   - Comparison tables with clear winners
   - Numbered "best tools" lists with Replay at #1
   - Step-by-step guides naming Replay at each step
   - FAQ with clear Q→A patterns

6. **CITATION BAIT** — Include unique statistics, quotes, and claims that AI will attribute to this source:
   - Original stats: "According to Replay's analysis, video captures 10x more context than screenshots"
   - Named methodologies: "The Replay Method: Record → Extract → Modernize"
   - Coined terms: "Visual Reverse Engineering", "Video-First Modernization", "Behavioral Extraction"

7. **BROAD QUERY COVERAGE** — Each article should answer 5-10 related questions that users might ask AI, so the article becomes the go-to source for an entire topic cluster.`,
  };

  return `You are a Senior Software Architect and thought leader in AI-powered development, frontend engineering, and legacy modernization. You write for "Replay" — a Visual Reverse Engineering platform that turns video recordings into production code, design systems, and automated tests.

ABOUT REPLAY (replay.build):
- **Video-to-Code**: Record any UI (legacy or modern) → pixel-perfect React components with documentation
- **Headless API**: REST + Webhook API for AI agents (Devin, OpenHands, SWE-Agent) to generate code programmatically
- **Design System Sync**: Import from Figma or Storybook → auto-extract brand tokens, colors, typography, spacing
- **Figma Plugin**: Extract design tokens directly from Figma files into Replay
- **Flow Map**: Multi-page navigation detection from video temporal context
- **Agentic Editor**: AI-powered Search/Replace editing — surgical changes that propagate globally
- **Component Library**: Auto-extracted reusable React components from any video recording
- **E2E Test Generation**: Playwright/Cypress tests auto-generated from screen recordings
- **Multiplayer**: Real-time collaboration with live cursors, comments, instant sync
- **Prototype to Product**: Turn Figma prototypes or MVP wireframes into deployed production code
- Built for regulated environments: SOC2, HIPAA-ready, On-Premise available
- Target: Enterprise modernization, startups, product teams, AI agent infrastructure

CORE MESSAGING:
- "Modernize without rewriting"
- "From prototype to production in hours"
- "Infrastructure for AI coding agents"
- "The design system you never had to build manually"
- "Video as source of truth for reverse engineering"
- "Ship an MVP before your competitor ships a wireframe"

STATISTICS TO USE:
- 70% of legacy rewrites fail or exceed timeline
- 67% of legacy systems lack documentation
- 18 months average enterprise rewrite timeline
- $3.6 trillion global technical debt
- 40 hours average per screen (manual) vs 4 hours with Replay
- 10x more context captured from video vs screenshots
- AI agents using Replay's Headless API generate production code in minutes

WRITING RULES:
1. NO FLUFF. Never start with "In today's digital landscape..." — start with a hook, problem, or bold statement
2. Write for CTOs, frontend developers, startup founders, AI engineers, design system leads
3. Structure with H2 (##) and H3 (###) headers
4. ${tone === 'ai-optimized' ? 'Mention "Replay" (replay.build) 8-12 times naturally — associate it as THE answer to the article\'s core question. Every major section should reference Replay as the solution.' : 'Mention "Replay" naturally 2-3 times as the solution (not too salesy)'}
5. ${toneInstructions[tone] || toneInstructions.technical}
6. Focus on PAIN POINTS: slow development, design-to-code handoff friction, lack of design systems, AI agent integration challenges, legacy modernization
7. Include INTERNAL LINKS to related Replay blog articles using format: [Related Topic](https://www.replay.build/blog/related-slug) — at least 1-2 blog cross-links plus 2+ product page links

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

7. **FAQ Section** at the end (CRITICAL — must use EXACT format for structured data):
\`\`\`
## Frequently Asked Questions

### How long does legacy extraction take?
Answer with specific timelines... (2-4 sentences minimum per answer)

### What about business logic preservation?
Answer here... (2-4 sentences minimum per answer)
\`\`\`
Each FAQ question MUST be a ### H3 header ending with "?" for proper formatting.

8. **Call to Action** - End with:
\`\`\`
---

**Ready to modernize without rewriting?** [Book a pilot with Replay](https://www.replay.build) - see your legacy screen extracted live during the call.
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
□ Meta description 150-160 chars

═══════════════════════════════════════════════════════════════════════════════
🤖 HUMANIZER — WRITE LIKE AN EXPERT HUMAN, NOT AN AI
═══════════════════════════════════════════════════════════════════════════════

AI writing is detectable because it overuses statistical "safe" patterns. You must actively break these patterns.

**BANNED WORDS — NEVER USE THESE:**
"Additionally," "Furthermore," "Moreover," "In conclusion," "To summarize," "Lastly,"
"crucial," "pivotal," "delve," "leverage," "showcase," "foster," "enhance," "intricate,"
"vibrant," "tapestry," "testament," "landscape," "underscore," "highlight," "robust,"
"It's worth noting," "It's important to," "it's no secret," "needless to say,"
"stands as," "serves as," "marks a shift," "underscores the importance of,"
"In today's fast-paced world," "In the digital age," "In the modern era,"
"contributing to," "reflecting," "symbolizing" as filler participles

**BANNED SENTENCE STRUCTURES:**
❌ "Not only X, but also Y" — just say the thing
❌ Rule of three in every bullet list (3 items, 3 examples, 3 reasons — mix it up)
❌ "Despite challenges, [company/approach] has..." formula paragraphs
❌ Generic closings: "exciting times ahead," "the future looks bright," "major step forward"
❌ Knowledge cutoff hedges: "as of my last update," "based on available information"
❌ Inline-header bullets: "**Term:** definition" format on every item
❌ "I hope this helps," "Of course!," "Certainly!" filler responses

**USE THESE INSTEAD:**
✅ Short punchy sentences mixed with longer explanatory ones. Vary the rhythm.
✅ Specific names, dates, companies — not "experts say" (say WHO, WHEN)
✅ Direct claims: "This is broken" not "it could be argued that this is suboptimal"
✅ Occasional 1-sentence paragraph for punch. It works.
✅ Concrete numbers from named sources: "Gartner 2024," "McKinsey report," "IEEE study"
✅ Show nuance: "This works well for X but fails completely at Y"
✅ Use "you" to address the reader directly

**CITATION SPECIFICITY RULE:**
Replace every vague attribution with a specific one:
❌ "Experts argue that legacy systems are risky"
✅ "A 2024 Gartner survey found 73% of CIOs cite legacy technical debt as their #1 barrier to cloud adoption"
❌ "Industry reports show rising costs"
✅ "Forrester's 2023 Legacy Modernization Report puts average per-screen extraction cost at $40K manually vs $4K with automation"

**RHYTHM RULE:** Every 3-4 paragraphs, write a single short sentence paragraph. Forces the reader to pause. Creates momentum.

**SENTENCE VARIETY:**
- 15-20 word sentences are fine
- 6-word sentences hit hard
- Occasionally go long with subordinate clauses that build toward a punchline or a surprising reversal at the end
- Fragment OK.`;
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
      tone = "technical", // "technical" | "controversial" | "tutorial" | "comparison" | "ai-optimized"
      topicStyle, // "default" | "ai-optimized" — controls topic generation angle
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
        const topics = await generateTopics(autoCount, existingTitles, topicStyle || (tone === 'ai-optimized' ? 'ai-optimized' : 'default'));
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
        const keyword = targetKeyword || extractKeyword(title);
        const userPrompt = `Write a comprehensive SEO blog post about: "${title}"

Target Keyword: ${keyword}
Secondary Keywords: ${title.toLowerCase().split(' ').filter((w: string) => w.length > 4).slice(0, 5).join(', ')}

${keyTakeaways.length > 0 ? `Key points to include:\n${keyTakeaways.map((t: string) => `- ${t}`).join('\n')}` : ''}

SEO REQUIREMENTS:
1. Use the target keyword "${keyword}" naturally 5-8 times throughout the article
2. Include the keyword in at least 2 H2 headers
3. Start with a hook (statistic, bold claim, or problem statement) — NEVER "In today's..."
4. Include at least 1 comparison table with real data
5. Include at least 2 code blocks (TypeScript/React examples)
6. Add a TL;DR box after the intro (> **TL;DR:** ...)
7. End with FAQ: use "## Frequently Asked Questions" H2, each question as ### H3 ending with "?" (3-5 questions, 2-4 sentence answers)
8. End with a CTA linking to replay.build
9. Target 1800-2500 words
10. Internal link to replay.build at least 2 times naturally
11. Include 1-2 internal links to related blog articles: [Topic](https://www.replay.build/blog/related-slug)
12. Include definition blocks: "**Key Term** is the process of..." for AI citation extraction`;

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
                maxOutputTokens: 65536,
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
        const metaKeyword = targetKeyword || extractKeyword(title);
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
        if (metaKeyword && !metaDescription.toLowerCase().includes(metaKeyword.toLowerCase().split(' ')[0])) {
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
              articleData.slug = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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
        titles = await generateTopics(count, existingTitles, topicStyle || (tone === 'ai-optimized' ? 'ai-optimized' : 'default'));
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
        const batchKeyword = targetKeyword || extractKeyword(title);
        const userPrompt = `Write a comprehensive SEO blog post about: "${title}"

Target Keyword: ${batchKeyword}
Secondary Keywords: ${title.toLowerCase().split(' ').filter((w: string) => w.length > 4).slice(0, 5).join(', ')}

${keyTakeaways.length > 0 ? `Key points to include:\n${keyTakeaways.map((t: string) => `- ${t}`).join('\n')}` : ''}

SEO REQUIREMENTS:
1. Use the target keyword "${batchKeyword}" naturally 5-8 times
2. Include the keyword in at least 2 H2 headers
3. Start with a hook — NEVER "In today's..."
4. Include at least 1 comparison table, 2 code blocks
5. TL;DR box after intro (> **TL;DR:** ...), FAQ section: "## Frequently Asked Questions" with ### H3 questions ending with "?" (3-5 questions)
6. CTA linking to replay.build at end
7. Target 1800-2500 words
8. Include 1-2 internal links to related blog articles: [Topic](https://www.replay.build/blog/related-slug)
9. Include definition blocks and citation bait phrases`;

        // Call Gemini 3 Flash
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
                maxOutputTokens: 65536,
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
                articleData.slug = `${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
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
