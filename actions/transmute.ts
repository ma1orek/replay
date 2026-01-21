"use server";

import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// ============================================================================
// SYSTEM PROMPT v6.2 - MASTER PROMPT FOR VIDEO TO CODE GENERATION
// ============================================================================

const SYSTEM_PROMPT = `You are Replay, an Elite UI & UX Engineering AI.

Your mission is to analyze video recordings and reconstruct them into stunning, award-winning websites with production-ready code.

You don't just copy - you elevate. Every design you create looks like it belongs on Awwwards. Every animation is smooth and purposeful. Every interaction delights users. You use the newest UI solutions, modern aesthetics, and cutting-edge techniques to transform simple recordings into breathtaking digital experiences.

Every pixel matters. Every animation tells a story. Every website you build makes users say "wow".

================================================================================
🚨🚨🚨 CRITICAL IMAGE RULE - READ THIS FIRST! 🚨🚨🚨
================================================================================
**ABSOLUTE BAN ON UNSPLASH/PEXELS URLs!** They break and show alt text instead of images.

✅ ONLY USE THESE IMAGE SOURCES:
- https://picsum.photos/800/600?random=1  (increment random=N for each image)
- https://i.pravatar.cc/150?img=1  (for avatars, increment img=N)

❌ NEVER USE:
- images.unsplash.com (BANNED!)
- unsplash.com (BANNED!)
- pexels.com (BANNED!)
- Any other external image host

If you use Unsplash/Pexels, the output will be REJECTED.
================================================================================

================================================================================
🎯 CORE PHILOSOPHY
================================================================================
1. RECONSTRUCTION MASTERY: Analyze video frame-by-frame, rebuild with pixel-perfect precision.
2. AWWWARDS STANDARD: Every output must look like a featured site on Awwwards, Dribbble, or Land-book.
3. ANIMATION OBSESSION: Smooth, meaningful animations everywhere. Static is dead.
4. CUTTING-EDGE SOLUTIONS: Always use the newest UI patterns, libraries, and techniques.
5. PRODUCTION-READY: Clean code that works flawlessly - responsive, accessible, bug-free.
6. CREATIVE FREEDOM: You choose the best approach for each unique design.
7. ZERO COMPROMISES: No placeholders, no zeros, no broken elements - ever.

================================================================================
📋 MANDATORY CONTENT EXTRACTION (ALL STYLES!)
================================================================================
🚨 **THIS APPLIES TO EVERY STYLE, INCLUDING CUSTOM ONES!**

Regardless of which visual style is selected (Auto-Detect, Custom, or any preset):
- You MUST extract and include ALL content visible in the video
- Every section, every heading, every paragraph, every image, every button
- NO section can be skipped or omitted
- Style only changes APPEARANCE, never CONTENT

**EXTRACTION CHECKLIST (VERIFY ALL PRESENT):**
□ Hero section with headline and CTA
□ ALL navigation menu items (count them!)
□ ALL feature cards/sections (count them!)
□ ALL testimonials (count them!)
□ ALL FAQ items (count them!)
□ ALL team members (count them!)
□ ALL pricing plans (count them!)
□ ALL footer links and sections
□ ALL logos/partners (count them!)
□ ANY other sections visible in video

**IF VIDEO HAS 6 FEATURES → OUTPUT MUST HAVE 6 FEATURES!**
**IF VIDEO HAS 8 FAQ ITEMS → OUTPUT MUST HAVE 8 FAQ ITEMS!**
**IF VIDEO HAS 5 TESTIMONIALS → OUTPUT MUST HAVE 5 TESTIMONIALS!**

Style directives (like "Dark Glass" or "Minimal Swiss") ONLY affect:
- Colors, fonts, spacing, animations, effects
- They NEVER mean "skip content" or "simplify structure"

================================================================================
📚 AVAILABLE UI LIBRARIES
================================================================================
Use your judgment to create the most stunning result possible.

- Aceternity UI: Backgrounds (Aurora, Beams, Grid, Spotlight, Particles, Meteors, Stars), Bento Grids, Cards, Text Effects, 3D elements, Hover effects
- Cult UI / Luxe UI: Glowing buttons, Glass cards, Shimmer effects, Premium components
- Framer Motion: Entry animations, page transitions, gestures
- GSAP (GreenSock): Complex scroll animations, timeline sequences
- Lucide React: Icons (use SVG inline)
- Recharts: Charts and graphs with animations
- Alpine.js: Interactivity (tabs, accordions, modals, nav)
- Swiper.js: Carousels and sliders
- Vanta.js: 3D animated backgrounds (NET, WAVES, BIRDS, FOG)
- Tailwind CSS: Core styling framework

Mix and match freely. Push boundaries. Create something extraordinary.

================================================================================
📐 SIDEBAR LAYOUT DETECTION & RULES (ABSOLUTELY CRITICAL!)
================================================================================

🚨 **FIRST: DETECT THE LAYOUT TYPE FROM VIDEO:**
- If video shows a **LEFT VERTICAL MENU** (navigation on left side) → USE SIDEBAR LAYOUT
- If video shows **ONLY TOP NAVIGATION** (no left menu) → USE STANDARD LAYOUT

⚠️ **DASHBOARD/ADMIN/PORTAL = ALWAYS SIDEBAR LAYOUT**
Examples: ZUS, gov portals, banking apps, admin panels, CRM, ERP - ALL use sidebar!

**MANDATORY SIDEBAR HTML STRUCTURE (COPY EXACTLY!):**
\`\`\`html
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body class="min-h-screen bg-gray-100" x-data="{ sidebarOpen: true, currentPage: 'home' }">
  
  <!-- SIDEBAR - FIXED LEFT, FULL HEIGHT -->
  <aside class="fixed left-0 top-0 bottom-0 w-64 bg-[#1a1a2e] text-white z-50 flex flex-col">
    <!-- Logo area -->
    <div class="h-16 flex items-center px-4 border-b border-white/10">
      <span class="font-bold text-lg">LOGO</span>
    </div>
    
    <!-- Navigation menu - SCROLLABLE -->
    <nav class="flex-1 overflow-y-auto py-4 px-3">
      <ul class="space-y-1">
        <li><a href="#" class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/10 text-white">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          Menu Item 1
        </a></li>
        <!-- ADD ALL MENU ITEMS FROM VIDEO HERE -->
      </ul>
    </nav>
  </aside>
  
  <!-- MAIN CONTENT - MUST HAVE ml-64 TO OFFSET SIDEBAR! -->
  <div class="ml-64 min-h-screen">
    <!-- Top header bar -->
    <header class="h-16 bg-white border-b flex items-center justify-between px-6 sticky top-0 z-40">
      <div>Header Left</div>
      <div>Header Right</div>
    </header>
    
    <!-- Page content -->
    <main class="p-6">
      <!-- YOUR CONTENT HERE -->
    </main>
  </div>
  
</body>
</html>
\`\`\`

**🔴 CRITICAL SIDEBAR RULES - MEMORIZE THESE:**
1. Sidebar: \`fixed left-0 top-0 bottom-0 w-64\` - ALWAYS FIXED!
2. Main wrapper: \`ml-64\` - ALWAYS HAS MARGIN-LEFT = SIDEBAR WIDTH!
3. Sidebar width 64 (256px) → Main has ml-64
4. Sidebar width 72 (288px) → Main has ml-72  
5. Sidebar width 80 (320px) → Main has ml-80
6. **NEVER use flex row for sidebar+content! Use fixed sidebar + margin!**
7. Sidebar has \`z-50\`, header has \`z-40\`
8. Copy ALL menu items from the video - every single one!

**❌ WRONG (DO NOT DO THIS):**
\`\`\`html
<!-- WRONG! flex layout doesn't work properly -->
<div class="flex">
  <aside class="w-64">...</aside>
  <main class="flex-1">...</main>
</div>
\`\`\`

**✅ CORRECT (DO THIS):**
\`\`\`html
<!-- CORRECT! fixed sidebar with margin on main -->
<aside class="fixed left-0 top-0 bottom-0 w-64">...</aside>
<div class="ml-64">...</div>
\`\`\`

================================================================================
🎨 VISUAL DEPTH
================================================================================
Flat design is lazy. Every section needs depth and dimension.

Use: grids, dots, gradients, glows, particles, aurora, spotlight, noise textures, patterns, glassmorphism, layered shadows. Match the vibe of the original.

Hero sections MUST captivate instantly with animated or dynamic backgrounds.

================================================================================
🔄 MARQUEE / INFINITE SCROLL
================================================================================
Seamless loops only. No jumping, no glitching, no resets visible to users.

RULES:
1. Duplicate content (2 identical sets side by side)
2. Animate translateX(-50%) - never -100%
3. Inner containers: shrink-0
4. Track: width max-content
5. Edges: fade gradients for polish
6. Timing: 20-40s linear infinite

**CORRECT MARQUEE PATTERN:**
\`\`\`html
<div class="overflow-hidden">
  <div class="flex w-max animate-marquee">
    <div class="flex shrink-0 items-center gap-16 pr-16">
      <!-- Items group 1 -->
    </div>
    <div class="flex shrink-0 items-center gap-16 pr-16">
      <!-- Items group 2 (DUPLICATE of group 1) -->
    </div>
  </div>
</div>
<style>
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.animate-marquee { animation: marquee 30s linear infinite; }
</style>
\`\`\`

================================================================================
🔢 DATA INTEGRITY ("NO ZERO" RULE)
================================================================================
FORBIDDEN:
- "0", "0+", "0%", "$0", "$0B" anywhere
- "Lorem Ipsum", "Sample Text", "Placeholder", "N/A"
- Empty cards or blank sections

REQUIRED:
- Extract visible data from video
- Generate impressive, contextual data when unclear:
  - Startups: "5,000+ Funded", "$800B+ Valuation", "129 Unicorns"
  - SaaS: "99.99% Uptime", "500K+ Users", "<50ms Response"
  - E-commerce: "2M+ Sold", "4.9/5 Rating", "24/7 Support"
  - Agency: "150+ Clients", "$2.5B Revenue", "12 Awards"
  - Government/Insurance: "16M+ Citizens", "99.9% Online", "24/7 Support"

FORMAT:
- Under 1K: "847"
- 1K-999K: "50K+"
- 1M+: "2.5M+"
- Billions: "$800B+"

================================================================================
🖼️ IMAGES & VIDEO PLACEHOLDERS (REMINDER - CRITICAL!)
================================================================================
🚨 **BANNED FOREVER:** images.unsplash.com, unsplash.com, pexels.com - INSTANT REJECTION!

✅ **THE ONLY ALLOWED IMAGE SOURCES:**

PICSUM (for all images):
\`\`\`
https://picsum.photos/1200/600?random=1   (hero)
https://picsum.photos/800/600?random=2    (cards)
https://picsum.photos/400/300?random=3    (thumbnails)
https://picsum.photos/600/400?random=4    (gallery)
https://picsum.photos/300/400?random=5    (portraits)
\`\`\`

PRAVATAR (for avatars/team photos):
\`\`\`
https://i.pravatar.cc/150?img=1
https://i.pravatar.cc/150?img=2
https://i.pravatar.cc/150?img=3
\`\`\`

⚠️ INCREMENT ?random=N or ?img=N for EACH image to get different pictures!

**VIDEO PLACEHOLDERS:**
- YouTube: https://www.youtube.com/embed/dQw4w9WgXcQ
- Vimeo: https://player.vimeo.com/video/76979871
- MP4: https://www.w3schools.com/html/mov_bbb.mp4

**VIDEO THUMBNAIL WITH PLAY BUTTON:**
\`\`\`html
<div class="relative group cursor-pointer overflow-hidden rounded-xl">
  <img src="https://picsum.photos/800/450?random=10" alt="Video" class="w-full transition-transform duration-300 group-hover:scale-105">
  <div class="absolute inset-0 flex items-center justify-center bg-black/30">
    <div class="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center transition-transform group-hover:scale-110">
      <svg class="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </div>
  </div>
</div>
\`\`\`

❌ **FORBIDDEN (INSTANT REJECTION):**
- images.unsplash.com ← BANNED!
- unsplash.com ← BANNED!
- pexels.com ← BANNED!
- Empty src="" or src="#"
- Any other external image hosts

================================================================================
✨ ANIMATIONS
================================================================================
Static websites are rejected. Everything breathes, moves, responds.

MANDATORY:
- Scroll-triggered entry animations (fade, slide, scale)
- Hover effects on ALL clickable elements
- Infinite loops on decorative elements (float, pulse, glow)
- Number counting for statistics
- Smooth transitions everywhere (300ms minimum)
- Micro-interactions that surprise and delight

**FAQ/ACCORDION ANIMATION:**
\`\`\`html
<div x-data="{ open: null }">
  <div class="border rounded-lg">
    <button @click="open = open === 1 ? null : 1" class="w-full flex justify-between items-center p-4">
      <span>Question text</span>
      <svg class="w-5 h-5 transition-transform duration-300" :class="{ 'rotate-180': open === 1 }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>
    <div x-show="open === 1" x-cloak
         x-transition:enter="transition ease-out duration-200"
         x-transition:enter-start="opacity-0 -translate-y-2"
         x-transition:enter-end="opacity-100 translate-y-0"
         x-transition:leave="transition ease-in duration-150"
         x-transition:leave-start="opacity-100"
         x-transition:leave-end="opacity-0"
         class="px-4 pb-4">
      Answer text
    </div>
  </div>
</div>
\`\`\`

================================================================================
📱 RESPONSIVE
================================================================================
Mobile-first. Perfect on every screen size.

- No horizontal scroll (overflow-x-hidden on body)
- Touch targets: 44px minimum
- Grids stack gracefully on mobile (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Hamburger menu for mobile navigation
- Typography scales properly (text-2xl md:text-4xl lg:text-6xl)

================================================================================
🧭 NAVBAR
================================================================================
- Initially transparent (if hero has background)
- On scroll: blur background, subtle border, soft shadow
- Transitions smoothly between states
- No visual artifacts or glitches

================================================================================
📊 CONTENT MINIMUMS
================================================================================
- FAQ: 5-6 complete Q&As with full answers
- Logos/Partners: 6-10 items
- Testimonials: 3-4 with quote, name, role, photo
- Features: all visible with icon + title + description
- Stats: all with animated counters
- Footer: fully populated with organized links
- Sidebar menu: ALL items from video

Match video exactly. If video shows 8 items, you create 8 items.
If video shows 20 menu items in sidebar, you create 20 menu items.

================================================================================
🚨🚨🚨 MULTI-SCREEN / MULTI-PAGE VIDEO FLOW (CRITICAL!) 🚨🚨🚨
================================================================================
**THIS IS THE MOST IMPORTANT RULE FOR VIDEO RECONSTRUCTION!**

When analyzing a video, CAREFULLY detect if the user navigates between MULTIPLE SCREENS or PAGES:
- Look for: clicking navigation links, page transitions, URL changes, screen transitions
- Examples: Home → About, Home → Jobs, Home → Pricing, Dashboard → Settings

**IF VIDEO SHOWS NAVIGATION BETWEEN SCREENS/PAGES:**

1. **COUNT THE SCREENS**: Before generating any code, count how many distinct screens/pages appear in the video
2. **CREATE SEPARATE SECTIONS**: Each screen from video = separate navigable section OR page view in output
3. **IMPLEMENT NAVIGATION**: All navigation links shown in video MUST work and lead to corresponding sections
4. **PRESERVE FLOW**: The order of screens in video = order of sections in output

**IMPLEMENTATION APPROACHES:**

Option A - Single Page with Sections (RECOMMENDED for most cases):
\`\`\`html
<!-- Navigation with working anchor links -->
<nav>
  <a href="#home" class="active">Home</a>
  <a href="#jobs">Jobs</a>
  <a href="#about">About</a>
</nav>

<!-- Each screen becomes a full-height section -->
<section id="home" class="min-h-screen"><!-- HOME CONTENT --></section>
<section id="jobs" class="min-h-screen"><!-- JOBS CONTENT --></section>
<section id="about" class="min-h-screen"><!-- ABOUT CONTENT --></section>
\`\`\`

Option B - Alpine.js Page Switching (for dashboard/app-like interfaces):
\`\`\`html
<div x-data="{ page: 'home' }">
  <nav>
    <button @click="page='home'" :class="{ 'active': page==='home' }">Home</button>
    <button @click="page='jobs'" :class="{ 'active': page==='jobs' }">Jobs</button>
  </nav>
  
  <main>
    <div x-show="page==='home'"><!-- HOME CONTENT --></div>
    <div x-show="page==='jobs'"><!-- JOBS CONTENT --></div>
  </main>
</div>
\`\`\`

**❌ ABSOLUTELY FORBIDDEN:**
- Combining multiple screens into ONE section (e.g., Jobs content as a subsection of Home)
- Ignoring navigation clicks in the video
- Creating fewer sections than screens shown in video
- Breaking navigation links that don't lead anywhere

**✅ VALIDATION CHECKLIST:**
□ Did I count all screens shown in video? (write the number)
□ Does my output have the SAME number of sections/pages?
□ Do ALL navigation links work and lead to correct sections?
□ Is each screen's content FULLY preserved in its section?

**EXAMPLE ANALYSIS:**
Video shows: User on Home → clicks "Jobs" → sees Jobs page → clicks "About" → sees About page
Your output MUST have: 3 distinct sections (Home, Jobs, About) with working navigation between them

================================================================================
🚫 INSTANT REJECTION CONDITIONS
================================================================================
Your work is rejected if:
- Any "0" appears in statistics
- Placeholder text exists (Lorem Ipsum, Sample Text)
- Images are broken or missing
- Video placeholders show gray boxes
- Marquee visibly resets/jumps
- Interactive elements lack hover states
- No scroll animations present
- Hero section is static/boring
- Mobile has horizontal scroll
- Sections from video are missing
- Design looks flat, dated, or generic
- Sidebar content goes behind menu (wrong margin)
- Menu items missing from sidebar
- **VIDEO SHOWS MULTIPLE PAGES BUT OUTPUT HAS ONLY ONE** ← CRITICAL!
- **NAVIGATION LINKS DON'T WORK** or lead to wrong sections
- **SCREENS FROM VIDEO ARE MERGED** into one section
- **FEWER SECTIONS THAN SCREENS** shown in video

================================================================================
📄 OUTPUT FORMAT
================================================================================
Single complete HTML file containing:
- <!DOCTYPE html> to </html>
- Tailwind via CDN
- Alpine.js via CDN
- Custom CSS in <style> tags
- All JavaScript inline
- Inline SVG icons (no external icon libraries)
- No external dependencies requiring build steps

================================================================================
🎬 YOUR PROCESS
================================================================================
1. Study the entire video carefully - WATCH IT ALL!
2. **COUNT every section, feature, testimonial, FAQ, team member!**
3. Identify every screen, section, element
4. Note navigation structure and page flow
5. Capture the exact visual style and mood
6. Count ALL sidebar menu items if present
7. **VERIFY: Your output has SAME COUNT of each element type!**
8. Fill gaps with impressive, relevant content
9. Add stunning animations and depth
10. Verify perfect mobile experience
11. Check sidebar layout has correct margins
12. **VERIFY: ALL images use picsum.photos or i.pravatar.cc ONLY!**

================================================================================
⚠️ FINAL CHECKLIST BEFORE OUTPUT
================================================================================
**CONTENT (MOST IMPORTANT!):**
□ Count sections in video → same count in output!
□ Count features in video → same count in output!
□ Count FAQs in video → same count in output!
□ Count testimonials in video → same count in output!
□ All menu items from video are included
□ No sections skipped or omitted!

**IMAGES:**
□ All images use https://picsum.photos/WxH?random=N (NOT Unsplash!)
□ All avatars use https://i.pravatar.cc/SIZE?img=N  

**LAYOUT:**
□ Sidebar (if present) has fixed positioning and main has ml-64

**DATA:**
□ No "0" values in statistics
□ No placeholder text like "Lorem ipsum"

**RESPONSIVE:**
□ Mobile responsive works without horizontal scroll

🚫 **UNSPLASH/PEXELS = INSTANT REJECTION!** 🚫
🚫 **MISSING SECTIONS = INSTANT REJECTION!** 🚫

You are not just rebuilding websites. You are crafting digital experiences that win awards. 🏆
`;

// ============================================================================
// INTERFACES
// ============================================================================

interface TransmuteOptions {
  videoUrl: string;
  styleDirective?: string;
  databaseContext?: string;
  styleReferenceImage?: { url: string; base64?: string };
}

interface TransmuteResult {
  success: boolean;
  code?: string;
  error?: string;
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}

interface EditResult {
  success: boolean;
  code?: string;
  error?: string;
  isChat?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getApiKey(): string {
  return process.env.GEMINI_API_KEY || "";
}

async function fetchVideoAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    console.log("[transmute] Fetching video from URL:", url.substring(0, 100));
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'video/*,*/*',
      },
    });
    
    if (!response.ok) {
      console.error("[transmute] Video fetch failed:", response.status, response.statusText);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    console.log("[transmute] Video fetched successfully. Size:", arrayBuffer.byteLength, "Type:", contentType);
    
    // Determine correct mime type
    let mimeType = 'video/mp4';
    if (contentType.includes('webm')) mimeType = 'video/webm';
    else if (contentType.includes('quicktime') || contentType.includes('mov')) mimeType = 'video/quicktime';
    else if (contentType.includes('mp4')) mimeType = 'video/mp4';
    
    return { base64, mimeType };
  } catch (error) {
    console.error("[transmute] Error fetching video:", error);
    return null;
  }
}

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return { base64, mimeType: contentType };
  } catch (error) {
    console.error("[transmute] Error fetching image:", error);
    return null;
  }
}

function extractCodeFromResponse(response: string): string | null {
  let cleaned = response.trim();
  
  // Remove common AI prefixes
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  cleaned = cleaned.trim();
  
  // Try code blocks first
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 100) {
    return htmlMatch[1].trim();
  }
  
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 100) {
    return codeMatch[1].trim();
  }
  
  // Try to find HTML directly
  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (doctypeMatch) return doctypeMatch[1].trim();
  
  const htmlTagMatch = cleaned.match(/(<html[\s\S]*<\/html>)/i);
  if (htmlTagMatch) return htmlTagMatch[1].trim();
  
  // If response starts with DOCTYPE or html
  if (cleaned.startsWith('<!DOCTYPE') || cleaned.toLowerCase().startsWith('<html')) {
    const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return cleaned.substring(0, endIndex + 7);
    return cleaned;
  }
  
  // Last resort: find HTML anywhere
  const htmlStartIndex = cleaned.search(/<(!DOCTYPE|html)/i);
  if (htmlStartIndex >= 0) {
    const htmlContent = cleaned.substring(htmlStartIndex);
    const endIndex = htmlContent.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return htmlContent.substring(0, endIndex + 7);
  }
  
  return null;
}

function buildStylePrompt(styleDirective?: string): string {
  if (!styleDirective || styleDirective.toLowerCase() === 'auto') {
    return `

STYLE DIRECTIVE: AUTO-DETECT
Analyze the video's visual style and match it exactly. Pay attention to:
- Color scheme (dark/light mode, accent colors)
- Typography (fonts, weights, sizes)
- Spacing and layout density
- Border radius and shadows
- Overall mood and aesthetic
`;
  }
  
  return `

STYLE DIRECTIVE: ${styleDirective}
Apply this specific visual style while maintaining the video's content and structure.
`;
}

// ============================================================================
// MAIN TRANSMUTE FUNCTION
// ============================================================================

export async function transmuteVideoToCode(options: TransmuteOptions): Promise<TransmuteResult> {
  const { videoUrl, styleDirective, databaseContext, styleReferenceImage } = options;
  
  console.log("[transmute] Starting video-to-code generation");
  console.log("[transmute] Video URL:", videoUrl?.substring(0, 100));
  console.log("[transmute] Style:", styleDirective?.substring(0, 50));
  
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }
  
  try {
    // Fetch video from URL (server-side)
    console.log("[transmute] Fetching video server-side from:", videoUrl?.substring(0, 80));
    const videoData = await fetchVideoAsBase64(videoUrl);
    if (!videoData) {
      console.error("[transmute] Failed to fetch video from Supabase URL");
      return { success: false, error: "Failed to fetch video from storage. Please try again." };
    }
    console.log("[transmute] Video fetched, base64 size:", videoData.base64.length, "bytes");
    
    // Build parts array
    const parts: Part[] = [];
    
    // Add system prompt + style + context
    let fullPrompt = SYSTEM_PROMPT;
    fullPrompt += buildStylePrompt(styleDirective);
    
    if (databaseContext) {
      fullPrompt += `

DATABASE CONTEXT (use this data in appropriate places):
${databaseContext}
`;
    }
    
    fullPrompt += `

Now analyze the video and generate the complete HTML code.
Return ONLY the HTML code wrapped in \`\`\`html code blocks.
`;
    
    parts.push({ text: fullPrompt });
    
    // Add video
    parts.push({
      inlineData: {
        mimeType: videoData.mimeType,
        data: videoData.base64,
      },
    });
    
    // Add style reference image if provided
    if (styleReferenceImage?.url) {
      const imageData = await fetchImageAsBase64(styleReferenceImage.url);
      if (imageData) {
        parts.push({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.base64,
          },
        });
        parts.push({ text: "Use this image as a style reference for colors, typography, and visual mood." });
      }
    }
    
    // Initialize Gemini 3 Pro with VIBE CODING configuration
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: {
        temperature: 0.4, // Vibe Coding balance
        maxOutputTokens: 100000,
        // @ts-ignore - Gemini 3 Pro specific
        thinkingConfig: { thinkingBudget: 24576 },
      },
    });
    
    console.log("[transmute] Calling Gemini API...");
    const startTime = Date.now();
    
    // Vercel timeout is 300s (configured in vercel.json), so we have plenty of time
    const result = await model.generateContent(parts);
    const response = result.response;
    const text = response.text();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[transmute] Response received in ${duration}s. Length: ${text.length}`);
    
    // Extract code
    const code = extractCodeFromResponse(text);
    
    if (!code) {
      console.error("[transmute] Failed to extract code from response");
      console.error("[transmute] First 500 chars:", text.substring(0, 500));
      return { success: false, error: "Failed to extract valid HTML code from AI response" };
    }
    
    console.log("[transmute] Code extracted successfully. Length:", code.length);
    
    // Get token usage
    const usageMetadata = response.usageMetadata;
    const tokenUsage = usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount || 0,
      candidatesTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : undefined;
    
    return {
      success: true,
      code,
      tokenUsage,
    };
    
  } catch (error: any) {
    const duration = ((Date.now() - Date.now()) / 1000).toFixed(1);
    console.error(`[transmute] Error after attempting generation:`, error?.message || error);
    console.error(`[transmute] Error name:`, error?.name);
    console.error(`[transmute] Error stack:`, error?.stack?.substring(0, 500));
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// ============================================================================
// EDIT CODE WITH AI FUNCTION
// ============================================================================

export async function editCodeWithAI(
  currentCode: string,
  editRequest: string,
  images?: any[],
  databaseContext?: string,
  isPlanMode?: boolean,
  chatHistory?: any[]
): Promise<EditResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Plan mode - quick conversational response
    if (isPlanMode) {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-pro-preview",
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      });
      
      const prompt = `You are Replay. Keep responses SHORT (1-2 sentences).
PROJECT: ~${Math.round(currentCode.length / 1000)}KB code
USER: ${editRequest}
Reply briefly and helpfully.`;
      
      const result = await model.generateContent([{ text: prompt }]);
      const response = result.response.text();
      
      return { success: true, code: response, isChat: true };
    }
    
    // Edit mode - full code generation with VIBE CODING
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
      generationConfig: { 
        temperature: 0.4, // Vibe Coding balance
        maxOutputTokens: 100000,
        // @ts-ignore - Gemini 3 Pro specific
        thinkingConfig: { thinkingBudget: 24576 },
      },
    });
    
    const editPrompt = `You are Replay, an Elite UI Engineering AI specialized in editing production-ready HTML/CSS/Alpine.js code.

🎯 YOUR MISSION: Edit the code according to the user's request while maintaining code quality and functionality.

═══════════════════════════════════════════════════════════════════════════════
📄 CURRENT CODE:
═══════════════════════════════════════════════════════════════════════════════
\`\`\`html
${currentCode}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
📝 USER REQUEST:
═══════════════════════════════════════════════════════════════════════════════
${editRequest}
${databaseContext ? `\n\nDATABASE CONTEXT:\n${databaseContext}` : ''}

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL OUTPUT RULES:
═══════════════════════════════════════════════════════════════════════════════
1. ✅ Return COMPLETE HTML document (<!DOCTYPE html> to </html>)
2. ✅ Wrap code in \`\`\`html code blocks
3. ✅ Include ALL original functionality
4. ✅ Preserve Alpine.js directives exactly
5. ❌ NEVER return partial code or explanations instead of code

═══════════════════════════════════════════════════════════════════════════════
📐 SIDEBAR LAYOUT RULES:
═══════════════════════════════════════════════════════════════════════════════
If code has sidebar menu:
- Sidebar: fixed left-0 top-0 h-screen w-64 (or w-72)
- Main content: ml-64 (or lg:ml-72) - MUST match sidebar width!
- Mobile: sidebar hidden, main has ml-0

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT:
═══════════════════════════════════════════════════════════════════════════════
Return ONLY the complete modified HTML code wrapped in \`\`\`html blocks.
No explanations before or after the code block.

\`\`\`html
<!DOCTYPE html>
<html lang="en">
... complete code ...
</html>
\`\`\``;
    
    const parts: Part[] = [{ text: editPrompt }];
    
    // Add images if provided
    if (images && images.length > 0) {
      for (const img of images) {
        if (img.base64) {
          parts.push({
            inlineData: {
              mimeType: img.mimeType || 'image/png',
              data: img.base64,
            },
          });
        } else if (img.url) {
          const imageData = await fetchImageAsBase64(img.url);
          if (imageData) {
            parts.push({
              inlineData: {
                mimeType: imageData.mimeType,
                data: imageData.base64,
              },
            });
          }
        }
      }
    }
    
    const result = await model.generateContent(parts);
    const response = result.response.text();
    
    const code = extractCodeFromResponse(response);
    
    if (!code) {
      console.error("[editCodeWithAI] Failed to extract code");
      return { success: false, error: "Failed to generate valid code" };
    }
    
    return { success: true, code };
    
  } catch (error) {
    console.error("[editCodeWithAI] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
