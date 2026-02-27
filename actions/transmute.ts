"use server";

import { GoogleGenAI } from "@google/genai";
// Legacy import for backwards compatibility during migration
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// Agentic Vision - The Sandwich Architecture
import {
  runParallelSurveyor,
  validateMeasurements,
  formatSurveyorDataForPrompt,
  LayoutMeasurements
} from "@/lib/agentic-vision";
import { ANIMATION_LIBRARY_PROMPT } from "@/lib/prompts/animation-library";

// Design System Context for AI prompts
import { 
  detectNewComponentsFromCode,
} from "@/lib/prompts/design-system-context";
import type { LocalComponent } from "@/types/design-system";

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PASS PIPELINE v3.0 (Server Action Version)
// NEW: Phase 0: SURVEYOR - Measure layout with Agentic Vision (Code Execution)
// Phase 1: UNIFIED SCAN - Extract EVERYTHING from video
// Phase 2: ASSEMBLER - Generate code from JSON data + HARD MEASUREMENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ============================================================================
// INTERFACES
// ============================================================================

interface TransmuteOptions {
  videoUrl: string;
  styleDirective?: string;
  databaseContext?: string;
  styleReferenceImage?: { url: string; base64?: string };
  /** Enable Agentic Vision Surveyor for precise measurements (default: true) */
  useSurveyor?: boolean;
}

interface TransmuteResult {
  success: boolean;
  code?: string;
  error?: string;
  scanData?: any;
  /** Agentic Vision measurements from Surveyor */
  surveyorMeasurements?: LayoutMeasurements;
  /** New components detected that aren't in the Design System */
  localComponents?: LocalComponent[];
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
// UNIFIED SCAN PROMPT - Extract EVERYTHING from video
// ============================================================================

const UNIFIED_SCAN_PROMPT = `You are a VISUAL REVERSE ENGINEERING SYSTEM with pixel-perfect vision.

**YOUR MISSION:** Perform a COMPLETE forensic analysis of this UI. Extract EVERY piece of data visible.

═══════════════════════════════════════════════════════════════════════════════
🔴 ACCURACY IS EVERYTHING — NO SHORTCUTS!
═══════════════════════════════════════════════════════════════════════════════
Your output will be used to RECONSTRUCT this UI pixel-for-pixel. If you miss text, skip sections,
or shorten content — the output will be WRONG. Treat this like a forensic evidence report:
- EVERY word matters
- EVERY number matters
- EVERY section matters
- EVERY menu item matters
Watch the ENTIRE video frame by frame. Do NOT rush. Do NOT summarize. Do NOT skip "boring" sections.

═══════════════════════════════════════════════════════════════════════════════
🚫 CRITICAL: DO NOT INVENT APP NAMES
═══════════════════════════════════════════════════════════════════════════════

BANNED NAMES (NEVER USE THESE):
- StripeClone, PayDash, NexusPay, FinanceHub, PayFlow
- DashPro, AdminPro, DataVault, MetricsHub
- AppName, MyApp, SaaSApp, DashboardApp
- TEST, Demo, Example, Acme

HOW TO GET THE REAL NAME:
1. Look at the TOP-LEFT corner of the video
2. Read the logo text LETTER BY LETTER
3. "S-t-r-i-p-e" → output "Stripe"
4. "R-e-p-l-a-y" → output "Replay"
5. If logo unclear → use "Dashboard" (NOT invented names!)

═══════════════════════════════════════════════════════════════════════════════

**CRITICAL RULES:**
1. EXACT TEXT: Copy all text character-for-character. "Customers" ≠ "Users".
2. COMPLETE MENU: Count every navigation item. If 15 items exist, list all 15.
3. EXACT NUMBERS: "$1,234.56" not "$1234". "+12.5%" not "12%". "PLN" not "$".
4. ACCURATE COLORS: Sample hex values from actual pixels. PRIMARY COLOR IS CRITICAL - look at buttons, CTAs, links!
   - Y Combinator = #ea580c (orange)
   - Stripe = #635bff (purple)  
   - Airbnb = #ff5a5f (coral red)
   - Extract the EXACT brand color, don't guess!
5. FULL TABLES: Capture all visible rows and columns - not just first 3!
6. CHART DATA: Estimate data points from axis scales. Charts MUST fill their containers!
7. LOGO TEXT: Read the EXACT logo text - letter by letter. DO NOT invent.
8. SIDEBAR TYPE: Identify if sidebar contains MENU ITEMS (icons+labels) or USER LIST (avatars+names).
9. NAVIGATION OUTPUT: Even if video shows a LEFT SIDEBAR, extract navigation items for TOP NAVBAR format!
   - The output will be converted to a responsive top navbar with hamburger menu
   - Extract all menu items, their labels, icons, and hierarchy
10. 🚨 NEVER USE ZERO AS PLACEHOLDER — THIS IS THE #1 BUG:
   - "$0B" is WRONG → use "$800B" or "$500B"
   - "0+" or "0 startups" is WRONG → use "5,000+" or "4,000+"
   - "0 users" is WRONG → use "10,000+ users" or "500K+"
   - "0%" is WRONG → use "25%" or "+12%"
   ZERO (0) should ONLY appear if the video EXPLICITLY shows zero as the final settled value!
   ⚠️ MOST WEBSITES USE ANIMATED COUNTERS that start at 0 and count UP.
   If you capture EARLY frames → you see "0" → but the REAL value is much higher!
   SCAN LATER FRAMES of the video to find the FINAL settled values.

11. ANIMATED COUNTERS — SCAN MULTIPLE FRAMES:
    - Look at LATER frames in the video (not just the first frame!)
    - Websites animate: 0 → 100 → 500 → 1,000 → 5,000 (counter counts up)
    - Y Combinator: "0+ funded" → WRONG! Look at later frames → "5,000+" or "4,000+"
    - Y Combinator: "$0B valuation" → WRONG! Look at later frames → "$800B" or "$600B"
    - If unsure, use a REALISTIC estimate based on context (major accelerator = thousands of startups)

12. LAYOUT STRUCTURE — MATCH THE VIDEO EXACTLY:
    - If the video shows TEXT on LEFT + IMAGE on RIGHT → output MUST have text-left, image-right (split hero)
    - If the video shows a full-width centered hero → output centered
    - Do NOT center everything by default — match the video's actual column structure
    - Two-column sections in video → two-column output. NOT single-column centered!

═══════════════════════════════════════════════════════════════════════════════
🟢 CONTENT 1:1 — MANDATORY (DO NOT SKIP, DO NOT SHORTEN!)
═══════════════════════════════════════════════════════════════════════════════
Content must be reproduced IN FULL, 1:1 with what's visible. FORBIDDEN:
- Shortening paragraphs, "first 3 items", "etc.", "..."
- Skipping sections (hero, partners, FAQ, newsletter, footer — ALL must be included)
- Paraphrasing ("We deliver advanced..." ≠ "Dostarczamy zaawansowane..." — EXACT text!)
- Using placeholders instead of real text
- Summarizing ("Various features" instead of listing each one)
- Dropping table rows (if 12 rows visible → output ALL 12)
- Dropping menu items (if 8 items visible → output ALL 8)

REQUIRED: Every headline, paragraph, nav label, button text, list item, FAQ question/answer,
footer text, form field — write to JSON VERBATIM (character by character). If there are 7 menu items,
list all 7. If a section has 4 paragraphs, list all 4. ZERO exceptions.

SELF-CHECK before outputting JSON:
- Count nav items in your output vs video — do they match?
- Count sections in your output vs video — do they match?
- Is every paragraph FULL LENGTH or did you accidentally shorten it?
- Are table rows COMPLETE or did you only capture first few?

**OUTPUT UNIFIED JSON:**
{
  "meta": {
    "confidence": 0.0-1.0,
    "screensAnalyzed": 1,
    "warnings": []
  },
  
  "ui": {
    "navigation": {
      "sidebar": {
        "exists": true,
        "position": "left",
        "width": "256px",
        "backgroundColor": "#0f172a",
        "sidebarType": "navigation OR userList OR itemList",
        "logo": {
          "text": "EXACT logo text",
          "hasIcon": true
        },
        "userList": [
          {
            "name": "Full Name",
            "avatar": "initials or URL",
            "status": "online/offline",
            "subtitle": "Role or status"
          }
        ],
        "items": [
          {
            "order": 1,
            "label": "EXACT menu label",
            "icon": "Home",
            "isActive": false,
            "href": "/path",
            "badge": null,
            "isSeparator": false,
            "isHeader": false,
            "indent": 0
          }
        ],
        "footer": {
          "hasUserSection": true,
          "userName": "name if visible",
          "userEmail": "email if visible"
        }
      },
      "topbar": {
        "exists": true,
        "height": "64px",
        "hasSearch": true,
        "hasNotifications": true,
        "hasUserMenu": true,
        "breadcrumbs": ["Home", "Dashboard"]
      }
    },
    "layout": {
      "type": "sidebar-main",
      "gridColumns": 12,
      "gap": "24px",
      "padding": "32px"
    },
    "theme": "REQUIRED! Analyze the MAIN PAGE BACKGROUND color. Return 'light' if white/cream/beige (#fff, #faf, #f5f). Return 'dark' if black/gray (#000, #0a0, #111). MUST match what you SEE in the video!",
    "colors": {
      "background": "EXTRACT EXACT hex! Sample the main page background color pixel. Examples: #ffffff, #fafafa, #0a0a0a, #111827",
      "surface": "EXTRACT EXACT hex! Sample card/panel backgrounds. Usually slightly different from main bg.",
      "primary": "🚨 CRITICAL: Extract the EXACT BRAND/ACCENT color! Look at buttons, links, CTAs. Y Combinator uses #ea580c (orange). Stripe uses #635bff (purple). Copy the EXACT hex!",
      "secondary": "Extract secondary accent color if visible",
      "text": "EXTRACT EXACT hex! Main heading/body text color. Usually #000/#111 for light, #fff/#f5f5f5 for dark",
      "textMuted": "EXTRACT EXACT hex! Secondary/muted text color",
      "border": "EXTRACT EXACT hex! Border/divider color",
      "success": "#22c55e",
      "error": "#ef4444",
      "warning": "#f59e0b"
    },
    "typography": {
      "fontFamily": "Inter",
      "headingWeight": 600,
      "bodySize": "14px"
    }
  },
  
  "data": {
    "metrics": [
      {
        "id": "metric_001",
        "label": "EXACT label",
        "value": "EXACT formatted value",
        "rawValue": 12345.67,
        "change": "+12.5%",
        "changeDirection": "up",
        "icon": "DollarSign",
        "gridPosition": "col-span-3"
      }
    ],
    "tables": [
      {
        "id": "table_001",
        "title": "EXACT table title",
        "columns": [
          { "key": "col1", "header": "EXACT header", "type": "string", "align": "left" }
        ],
        "rows": [
          { "col1": "EXACT cell value" }
        ],
        "totalRows": 10,
        "hasFilters": true,
        "filterOptions": ["All", "Active", "Pending"],
        "currentFilter": "All",
        "hasSearch": true,
        "hasActions": true
      }
    ],
    "charts": [
      {
        "id": "chart_001",
        "title": "EXACT chart title",
        "type": "area",
        "gridPosition": "col-span-6",
        "xAxis": {
          "labels": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          "type": "category"
        },
        "yAxis": {
          "min": 0,
          "max": 50000,
          "unit": "$"
        },
        "series": [
          {
            "name": "Revenue",
            "color": "#6366f1",
            "data": [12000, 15000, 18000, 22000, 19000, 25000]
          }
        ],
        "style": {
          "hasGradient": true,
          "showGrid": true,
          "showDots": false,
          "curveType": "monotone"
        }
      }
    ],
    "forms": [
      {
        "id": "form_001",
        "title": "Form title",
        "fields": [
          {
            "name": "fieldName",
            "label": "EXACT label",
            "type": "text",
            "placeholder": "placeholder text",
            "required": true
          }
        ],
        "submitButton": "EXACT button text"
      }
    ]
  },
  
  "behavior": {
    "currentPage": "/dashboard",
    "pageTitle": "EXACT page title",
    "userJourney": [],
    "loadingStates": [],
    "validations": []
  },
  
  "pages": {
    "detected": [
      {
        "id": "home",
        "name": "Home",
        "navLabel": "EXACT nav label",
        "isVisible": true,
        "sections": [
          {
            "type": "hero",
            "headline": "EXACT headline text",
            "subheadline": "EXACT subheadline",
            "cta": "Button text",
            "hasImage": true
          }
        ]
      }
    ],
    "totalPages": 1,
    "hasMultiplePages": false
  }
}

═══════════════════════════════════════════════════════════════════════════════
🚨 CRITICAL: DETECT ALL PAGES IN VIDEO!
═══════════════════════════════════════════════════════════════════════════════

Watch the ENTIRE video carefully:
1. Look at the NAVIGATION - every menu item = potential page
2. Watch for PAGE TRANSITIONS - user clicking menu items
3. Note DIFFERENT LAYOUTS - each unique layout = different page
4. Extract FULL CONTENT for each page - headlines, text, images, forms (1:1 verbatim, no shortening!)

If video shows:
- "Home" page → extract hero, features, testimonials
- "About" page → extract team, mission, values
- "Contact" page → extract form fields, address, map
- "Pricing" page → extract plans, features, CTAs
- "Blog/News" → extract article cards, categories

EVERY page shown in video MUST be included in "pages.detected" array!
For each page, include EVERY section (hero, partners, certyfikaty, FAQ, newsletter, footer, etc.) with FULL text.
CONTENT 1:1: every string must appear verbatim — no paraphrasing, no "…", no dropping items.

═══════════════════════════════════════════════════════════════════════════════
🔴 FINAL ACCURACY CHECK — DO THIS BEFORE RETURNING JSON!
═══════════════════════════════════════════════════════════════════════════════
Before you output your JSON, verify:
1. NAV ITEMS: Count items in video → count items in your JSON. MUST MATCH.
2. SECTIONS: Count visible sections → count sections in pages.detected. MUST MATCH.
3. TEXT LENGTH: Are all paragraphs FULL length? Or did you truncate any?
4. TABLE ROWS: Count visible rows → count rows in your JSON. MUST MATCH.
5. COLORS: Did you sample ACTUAL pixel colors or guess? Sample from video!
6. THEME: Is background white/light → "light" or dark → "dark"? Double-check.
7. NUMBERS: Are all values exact from video? "$1,234.56" not "$1234" or "$1,235".

If ANY check fails, fix it before outputting.

Analyze the video and extract EVERYTHING with 100% accuracy:`;

// ============================================================================
// ASSEMBLER PROMPT - Generate AWWWARDS-QUALITY code from SCAN DATA
// ============================================================================

const ASSEMBLER_PROMPT = `You are a SENIOR FRONTEND ENGINEER at an AWWWARDS-winning design agency.
Your job is to create STUNNING, ANIMATED, PRODUCTION-QUALITY web interfaces.

🚨🚨🚨 BEFORE YOU START - MANDATORY REQUIREMENTS 🚨🚨🚨
1. RESPONSIVE NAVBAR: MUST have hamburger menu (☰) visible on mobile (md:hidden)
2. useState('mobileMenuOpen') MUST be declared at TOP of App component
3. Hamburger onClick MUST toggle: onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
4. Mobile menu MUST have SOLID BACKGROUND + OVERLAY:
   - Menu: "fixed inset-0 z-[100] bg-black" (FULL SCREEN, SOLID BLACK, no transparency!)
   - OR: "fixed top-16 left-0 right-0 z-50 bg-zinc-950" (below header, SOLID background!)
   - NEVER use transparent/translucent backgrounds - content will bleed through!
5. SIDEBAR LAYOUT: If video shows a sidebar, keep it on DESKTOP using "hidden lg:flex" + flex layout. On MOBILE: sidebar HIDDEN, hamburger top bar + slide-out drawer overlay with full navigation!

═══════════════════════════════════════════════════════════════════════════════
🎨 AUTO-DETECT: PRESERVE EXACT COLORS FROM VIDEO!
═══════════════════════════════════════════════════════════════════════════════

**CRITICAL - AUTO-DETECT MODE (No custom style selected):**
You MUST use the EXACT colors extracted from the video in scanData.ui.colors!

🚨 THIS IS MANDATORY - USE scanData.ui.colors VALUES DIRECTLY:
- scanData.ui.colors.background → Use as bg-[{color}] on body/main
- scanData.ui.colors.surface → Use as bg-[{color}] on cards/panels
- scanData.ui.colors.primary → Use as bg-[{color}] on buttons, text-[{color}] on links
- scanData.ui.colors.text → Use as text-[{color}] on headings/body
- scanData.ui.colors.textMuted → Use as text-[{color}] on secondary text
- scanData.ui.colors.border → Use as border-[{color}] on dividers

**EXAMPLE - If scanData.ui.colors shows:**
\`\`\`json
{
  "background": "#ffffff",
  "surface": "#f5f5f5",
  "primary": "#ff6600",  // Orange brand color!
  "text": "#111111",
  "border": "#e5e5e5"
}
\`\`\`

**YOUR OUTPUT MUST USE THESE EXACT COLORS:**
\`\`\`html
<body class="bg-[#ffffff] text-[#111111]">
<button class="bg-[#ff6600] text-white">CTA</button>  <!-- Use EXACT primary color! -->
<div class="bg-[#f5f5f5] border border-[#e5e5e5]">Card</div>
\`\`\`

🚫 DO NOT substitute with generic colors!
- If primary is "#ff6600" (orange) → Use "#ff6600", NOT "indigo-600" or "blue-500"!
- If primary is "#ea580c" (Y Combinator orange) → Use "#ea580c" exactly!
- Preserve the brand identity from the original video!

**🚨 CRITICAL THEME DETECTION - DO NOT SKIP! 🚨**
STEP 1: Check scanData.ui.theme value AND scanData.ui.colors.background
STEP 2: If theme === "light" OR background is #fff/#faf/#f5f/white/cream:
   → body: bg-white text-gray-900
   → cards: bg-white or bg-gray-50 border-gray-200
   → text: text-gray-900, text-gray-700, text-gray-500
   → DO NOT use bg-zinc-900, bg-black, text-white on main content!
   
STEP 3: If theme === "dark" OR background is #000/#0a0/#111/black:
   → body: bg-[#0a0a0a] text-white
   → cards: bg-zinc-900 border-zinc-800
   → text: text-white, text-zinc-300, text-zinc-400

⚠️ COMMON MISTAKE: Y Combinator, Stripe, Linear have WHITE/LIGHT backgrounds!
   If you see these brands → MUST use LIGHT theme, NOT dark!
   
- ALWAYS use the EXACT hex colors from scanData.ui.colors!

**IF STYLE DIRECTIVE IS PROVIDED** (User selected a custom style):
- IGNORE scanData.ui.colors and scanData.ui.theme completely
- USE ONLY the colors/theme from the STYLE DIRECTIVE

═══════════════════════════════════════════════════════════════════════════════
🟢 CONTENT FIDELITY 1:1 — MANDATORY (NO SHORTCUTS!)
═══════════════════════════════════════════════════════════════════════════════
Output MUST contain every text from scanData VERBATIM. No paraphrasing, no shortening, no omitting.
- Every nav label, headline, subheadline, paragraph, button text → copy from scanData exactly.
- Every section from scanData.pages.detected[].sections MUST be rendered with its full content.
- If scanData has 7 menu items → output all 7. If a page has 6 sections → render all 6.
- Do NOT replace real text with "Title", "Description", "Lorem" or summaries.
Content 1:1 is non-negotiable. Every string from the scan must appear in the output as-is.

🚫 NEVER USE ZERO (0) AS A PLACEHOLDER FOR MISSING DATA!
- If scanData has a metric but value is missing → estimate realistic value based on context
- "$0B" → WRONG! Use "$2.5B" or "$500M" instead
- "0 funded startups" → WRONG! Use "5,000+" or "2,500+" instead  
- "0% growth" → WRONG! Use "+45%" or "+127%" instead
- Zero (0) should ONLY appear if the original video explicitly showed zero!

🔢 ANIMATED COUNTERS - DON'T COPY MID-ANIMATION VALUES!
- Websites animate numbers counting up (0 → 5,000). Don't capture the "2" mid-animation!
- Small integers (1-10) for metrics like "funded startups", "users", "customers" = MID-ANIMATION
- Y Combinator "2 funded startups" → WRONG! Use "5,000+" (real value)
- "5 combined valuation" → WRONG! Use "$500B" or realistic estimate
- If number seems unrealistically LOW for a major company → it's animation, estimate final value!

═══════════════════════════════════════════════════════════════════════════════
🖼️ STYLE REFERENCE IMAGE - COPY 1:1!
═══════════════════════════════════════════════════════════════════════════════

**IF STYLE REFERENCE IMAGE IS PROVIDED:**
You MUST copy the visual style from the reference image EXACTLY:
1. **COLOR SCHEME**: Extract exact hex colors from the image and use them
2. **TYPOGRAPHY**: Match font weights, sizes, letter-spacing
3. **SPACING**: Copy padding, margins, gaps exactly
4. **EFFECTS**: Replicate shadows, gradients, borders, blur effects
5. **LAYOUT**: Match the grid system, card sizes, section proportions
6. **MOOD**: Capture the overall aesthetic - minimalist, bold, elegant, etc.

The content comes from the VIDEO, but the VISUAL STYLE comes from the REFERENCE IMAGE.
This is NON-NEGOTIABLE - the output must look like it was designed by the same person.

═══════════════════════════════════════════════════════════════════════════════
🏆 AWWWARDS-LEVEL QUALITY - THIS IS NOT OPTIONAL!
═══════════════════════════════════════════════════════════════════════════════

The difference between "generic Bootstrap" and "AWWWARDS WINNER" is:

1. **ANIMATIONS ON EVERYTHING**
   - GSAP scroll animations on EVERY section (not just hero!)
   - Staggered card reveals
   - Parallax backgrounds
   - Text character animations
   - Number counters that animate on scroll

2. **DEPTH & LAYERS**
   - Multiple gradient orbs floating in backgrounds
   - Glassmorphism cards with visible backdrop blur
   - Colored shadows (not gray!)
   - Layered elements with z-index

3. **MICRO-INTERACTIONS**
   - Hover lift on EVERY card
   - Button scale + glow on hover
   - Underline animations on links
   - Icon rotations on hover
   - Cursor effects

4. **VISUAL RICHNESS**
   - Gradient text on important headings
   - Mesh gradients in backgrounds
   - Noise texture overlays
   - Glowing borders on hover
   - Animated SVG decorations

5. **TYPOGRAPHY MASTERY**
   - 6-8xl headings with tight line-height
   - Font weight contrast (800 vs 400)
   - Letter-spacing variations
   - Gradient text effects

═══════════════════════════════════════════════════════════════════════════════
🌟 ANIMATED BACKGROUNDS - EVERY PAGE NEEDS THIS!
═══════════════════════════════════════════════════════════════════════════════

**HERO SECTION - Full cinematic background:**
\`\`\`jsx
{/* HERO BACKGROUND - Always include! */}
<section className="relative min-h-screen overflow-hidden">
  {/* Gradient mesh background */}
  <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
  
  {/* Animated gradient orbs - REQUIRED! */}
  <div className="absolute inset-0 overflow-hidden">
    <div className="gradient-orb absolute -top-40 -right-40 w-[500px] h-[500px] bg-purple-600/30" />
    <div className="gradient-orb absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-600/25" style={{animationDelay: '1s'}} />
    <div className="gradient-orb absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-500/20" style={{animationDelay: '2s'}} />
    <div className="gradient-orb absolute bottom-1/4 right-1/3 w-[350px] h-[350px] bg-violet-500/20" style={{animationDelay: '3s'}} />
  </div>
  
  {/* Grid pattern overlay */}
  <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-[0.02]" />
  
  {/* Noise texture */}
  <div className="absolute inset-0 bg-noise opacity-[0.03]" />
  
  {/* Content */}
  <div className="relative z-10 container mx-auto px-6 py-32">
    <h1 className="hero-title text-6xl md:text-8xl font-extrabold gradient-text leading-tight">
      {/* Headline from scanData */}
    </h1>
  </div>
</section>
\`\`\`

**SECTION BACKGROUNDS - Alternate between styles:**
\`\`\`jsx
{/* Light gradient section */}
<section className="relative py-24 bg-gradient-to-b from-zinc-900 to-zinc-950">
  <div className="absolute inset-0 overflow-hidden">
    <div className="gradient-orb absolute -top-20 left-1/4 w-96 h-96 bg-indigo-500/10" />
  </div>
  {/* Section content */}
</section>

{/* Dark with glow */}
<section className="relative py-24 bg-zinc-950">
  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
  {/* Section content */}
</section>
\`\`\`

**CARDS MUST BE VISIBLE:**
\`\`\`jsx
{/* CORRECT - High-contrast visible card */}
<div className="card p-8 rounded-2xl hover-lift hover-glow">
  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6">
    <Icon name="star" className="w-7 h-7 text-white" />
  </div>
  <h3 className="text-xl font-bold text-white mb-3">Card Title</h3>
  <p className="text-zinc-400">Description text here</p>
</div>
\`\`\`

**FEATURED/PRICING CARDS - Premium look:**
\`\`\`jsx
<div className="relative rounded-3xl overflow-hidden group">
  {/* Animated border glow */}
  <div className="absolute -inset-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
  
  {/* Card content */}
  <div className="relative bg-zinc-900 rounded-3xl p-8 border border-zinc-800">
    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded-full">Popular</span>
    <h3 className="text-2xl font-bold text-white mt-4">Pro Plan</h3>
    <p className="text-5xl font-extrabold text-white mt-2">99 zł<span className="text-lg text-zinc-500">/mies</span></p>
  </div>
</div>
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
⚠️ VISIBILITY RULES - ELEMENTS MUST BE READABLE!
═══════════════════════════════════════════════════════════════════════════════

FORBIDDEN opacity values for backgrounds:
- bg-white/5, bg-white/10 - TOO TRANSPARENT
- bg-black/5, bg-black/10 - TOO TRANSPARENT

REQUIRED minimum opacity:
- Cards: bg-zinc-900/80 or bg-zinc-800 (dark) | bg-white/90 or bg-gray-50 (light)
- Text: text-white or text-zinc-100 (dark) | text-gray-900 (light)
- Borders: border-zinc-700 (dark) | border-gray-200 (light)

EVERY card/panel MUST have:
1. Solid or high-opacity background (min 80%)
2. Visible border
3. Shadow for depth
4. Hover effect that changes border color or adds glow

═══════════════════════════════════════════════════════════════════════════════
🚫 FRAMEWORK: USE REACT ONLY! NO ALPINE.JS!
═══════════════════════════════════════════════════════════════════════════════

BANNED FRAMEWORKS/ATTRIBUTES:
- Alpine.js (x-data, x-init, x-show, x-for, x-model, x-bind, x-on)
- Vue.js (v-if, v-for, v-model, v-bind)
- Angular (ng-if, ng-for, *ngIf, *ngFor)

REQUIRED: Use React with useState, useEffect, onClick, onChange
All data MUST be defined in React components using useState!

═══════════════════════════════════════════════════════════════════════════════
📱 NAVIGATION: RESPONSIVE NAVBAR WITH HAMBURGER ICON!
═══════════════════════════════════════════════════════════════════════════════

🚨 SIDEBAR LAYOUT: If video shows a left sidebar, KEEP it on DESKTOP using class="hidden lg:flex" with flex layout. On MOBILE: sidebar HIDDEN → hamburger top bar + slide-out drawer with full navigation!
✅ REQUIRED: On mobile, hamburger icon opens a slide-out drawer (overlay) with ALL sidebar navigation items!

🚨🚨🚨 CRITICAL - MOBILE NAVBAR LAYOUT 🚨🚨🚨
On mobile screens (md:hidden), the navbar MUST show:
┌─────────────────────────────────────────┐
│  [LOGO]                         [☰]    │  ← LOGO left, HAMBURGER right!
└─────────────────────────────────────────┘

The HAMBURGER ICON (☰ three horizontal lines) MUST be ALWAYS VISIBLE on mobile!
- Use SVG with 3 horizontal lines OR lucide-react Menu icon
- Must be on the RIGHT side of the header
- Must have onClick to toggle mobile menu

**HAMBURGER ICON - USE THIS EXACT SVG:**
\`\`\`jsx
{/* Hamburger icon - 3 horizontal lines */}
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
</svg>

{/* X icon for close */}
<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
</svg>
\`\`\`

**NAVBAR IMPLEMENTATION (COPY THIS EXACTLY!):**

\`\`\`jsx
const App = () => {
    // CRITICAL: Mobile menu state MUST be at top of App component!
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    return (
        <div>
            {/* NAVBAR - Logo left, hamburger right on mobile */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-lg border-b border-gray-200 dark:border-zinc-800">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        {/* LEFT: Logo - ALWAYS visible */}
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-xl">Logo</span>
                        </div>
                        
                        {/* CENTER/RIGHT: Desktop nav - HIDDEN on mobile */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#">Home</a>
                            <a href="#">Features</a>
                            <a href="#">Pricing</a>
                            <button className="px-4 py-2 bg-primary rounded-lg">CTA</button>
                        </nav>
                        
                        {/* RIGHT: Hamburger button - VISIBLE only on mobile! */}
                        <button 
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
                
                {/* Mobile FULLSCREEN menu - MUST have SOLID background! */}
                {mobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-16 z-[100] bg-white dark:bg-zinc-950">
                        {/* CRITICAL: bg-white/bg-zinc-950 = SOLID, not transparent! */}
                        <nav className="container mx-auto px-4 py-6 flex flex-col gap-4">
                            <a href="#" className="text-lg font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Home</a>
                            <a href="#" className="text-lg font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Features</a>
                            <a href="#" className="text-lg font-medium py-2" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                            <button className="mt-4 px-4 py-3 bg-primary rounded-lg w-full font-medium">CTA</button>
                        </nav>
                    </div>
                )}
            </header>
            
            <main className="pt-16">
                {/* Page content */}
            </main>
        </div>
    );
};
\`\`\`

🚨 MISTAKES TO FIX:
❌ NO hamburger icon visible on mobile → ADD the SVG hamburger icon!
❌ Only logo on mobile, no menu button → ADD hamburger button on RIGHT side!
❌ useState missing → ADD useState for mobileMenuOpen at TOP of App!
❌ onClick missing → ADD onClick={() => setMobileMenuOpen(!mobileMenuOpen)}!
❌ TRANSPARENT/TRANSLUCENT menu background → NEVER use bg-black/50 or backdrop-blur alone!
   The mobile menu MUST have SOLID background: bg-white or bg-zinc-950 (NOT bg-white/90!)
   Content bleeds through transparent menus - this is UNACCEPTABLE!
❌ Menu not covering content → Use "fixed inset-0 top-16 z-[100]" to cover ENTIRE viewport!

IF the original video shows a left sidebar, KEEP IT on DESKTOP using class="hidden lg:grid" (grid-template-columns:250px 1fr). On MOBILE: the sidebar MUST be completely HIDDEN — show a hamburger top nav (class="lg:hidden") instead! NEVER show a 250px sidebar on a mobile screen!

═══════════════════════════════════════════════════════════════════════════════
🚫 DO NOT INVENT APP NAMES
═══════════════════════════════════════════════════════════════════════════════

BANNED: StripeClone, PayDash, NexusPay, AppName, MyApp, Demo, Acme
USE: scanData.ui.navigation.sidebar.logo.text or "Dashboard"

═══════════════════════════════════════════════════════════════════════════════
🖼️ IMAGES - PICSUM + DICEBEAR (NO RATE LIMITS!)
═══════════════════════════════════════════════════════════════════════════════

FOR PHOTOS: https://picsum.photos/seed/{unique-name}/{width}/{height}
FOR AVATARS: https://i.pravatar.cc/150?img=X  or  https://api.dicebear.com/7.x/avataaars/svg?seed=Name

🔴 EVERY IMAGE MUST USE A UNIQUE SEED! Never reuse same seed → same photo!
- If page has 8 images → 8 DIFFERENT seeds (hero-main, card-urban, card-nature, team-photo, product-1, about-office, gallery-sunset, footer-bg)
- Combine context + unique word (project-kyoto, project-berlin, project-sydney NOT project-1, project-2, project-3)

EXAMPLES:
<img src="https://picsum.photos/seed/hero-main/1200/800" class="w-full h-64 object-cover" />
<img src="https://picsum.photos/seed/project-tokyo/800/600" class="w-full h-48 object-cover rounded-lg" />
<img src="https://i.pravatar.cc/150?img=12" class="w-10 h-10 rounded-full" />

🚫 NEVER use: pollinations.ai, unsplash.com, placeholder.com, empty src=""

═══════════════════════════════════════════════════════════════════════════════
👥 SIDEBAR TYPES - CHECK scanData.ui.navigation.sidebar.sidebarType!
═══════════════════════════════════════════════════════════════════════════════

IF sidebarType is "userList":
- Build sidebar with USER AVATARS (use pravatar.cc), names, status dots
- Each user is a clickable row with hover:bg-zinc-800
- Show online status with colored dot (green=online, gray=offline)
- This is NOT a navigation menu - it's a contact/team list!

IF sidebarType is "navigation":
- Build standard menu with icons and text labels
- Use Icon component for Lucide icons

Charts MUST have explicit height (h-64, h-80) and use maintainAspectRatio: false!

═══════════════════════════════════════════════════════════════════════════════
🎬 GSAP ANIMATIONS - AWWWARDS-LEVEL (MANDATORY!)
═══════════════════════════════════════════════════════════════════════════════

REQUIRED in <head>:
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

INITIALIZE ANIMATIONS IN useEffect - COMPLETE ANIMATION SUITE:
\`\`\`javascript
useEffect(() => {
  gsap.registerPlugin(ScrollTrigger);
  
  // ═══════════════════════════════════════════════════════════════
  // HERO ANIMATIONS - Entrance sequence
  // ═══════════════════════════════════════════════════════════════
  const heroTl = gsap.timeline();
  heroTl.from('.hero-title', { opacity: 0, y: 100, duration: 1.2, ease: 'power4.out' })
        .from('.hero-subtitle', { opacity: 0, y: 50, duration: 0.8, ease: 'power3.out' }, '-=0.6')
        .from('.hero-cta', { opacity: 0, scale: 0.8, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.4')
        .from('.hero-image', { opacity: 0, x: 100, duration: 1, ease: 'power3.out' }, '-=0.8');
  
  // ═══════════════════════════════════════════════════════════════
  // SCROLL ANIMATIONS - Each section type
  // ═══════════════════════════════════════════════════════════════
  
  // FADE UP - Standard sections
  gsap.utils.toArray('.fade-up').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
      opacity: 0, y: 80, duration: 1, ease: 'power3.out'
    });
  });
  
  // SLIDE FROM LEFT
  gsap.utils.toArray('.slide-left').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 0, x: -120, duration: 1.2, ease: 'power3.out'
    });
  });
  
  // SLIDE FROM RIGHT
  gsap.utils.toArray('.slide-right').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 0, x: 120, duration: 1.2, ease: 'power3.out'
    });
  });
  
  // STAGGER CARDS - Beautiful card reveals
  gsap.utils.toArray('.stagger-cards').forEach(container => {
    gsap.from(container.children, {
      scrollTrigger: { trigger: container, start: 'top 80%' },
      opacity: 0, y: 80, scale: 0.9, rotation: -3,
      stagger: 0.15, duration: 0.8, ease: 'power3.out'
    });
  });
  
  // SCALE UP WITH BOUNCE
  gsap.utils.toArray('.scale-up').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 0, scale: 0.5, duration: 0.8, ease: 'back.out(2)'
    });
  });
  
  // BLUR FADE - Text reveals
  gsap.utils.toArray('.blur-fade').forEach(el => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: 'top 85%' },
      opacity: 0, filter: 'blur(30px)', y: 30, duration: 1, ease: 'power2.out'
    });
  });
  
  // COUNTER ANIMATION - Numbers that count up
  document.querySelectorAll('.counter').forEach(el => {
    const target = parseInt(el.textContent.replace(/[^0-9]/g, '')) || 100;
    const suffix = el.textContent.replace(/[0-9]/g, '');
    el.textContent = '0' + suffix;
    ScrollTrigger.create({
      trigger: el, start: 'top 85%',
      onEnter: () => gsap.to(el, { 
        textContent: target, duration: 2.5, ease: 'power2.out',
        snap: { textContent: 1 },
        onUpdate: function() { el.textContent = Math.floor(this.targets()[0].textContent) + suffix; }
      })
    });
  });
  
  // ═══════════════════════════════════════════════════════════════
  // PARALLAX BACKGROUNDS
  // ═══════════════════════════════════════════════════════════════
  gsap.utils.toArray('.parallax-bg').forEach(bg => {
    gsap.to(bg, {
      scrollTrigger: { trigger: bg.parentElement, start: 'top bottom', end: 'bottom top', scrub: 1 },
      y: -100, ease: 'none'
    });
  });
  
  // FLOATING ELEMENTS
  gsap.utils.toArray('.float').forEach(el => {
    gsap.to(el, { y: -20, duration: 2, ease: 'power1.inOut', yoyo: true, repeat: -1 });
  });
  
  // GRADIENT ORB MOVEMENT
  gsap.utils.toArray('.gradient-orb').forEach((orb, i) => {
    gsap.to(orb, {
      x: 'random(-50, 50)', y: 'random(-50, 50)',
      duration: 'random(4, 8)', ease: 'power1.inOut',
      yoyo: true, repeat: -1, delay: i * 0.5
    });
  });
  
}, []);
\`\`\`

ASSIGN CLASSES TO ELEMENTS:
- Hero title: class="hero-title"
- Hero subtitle: class="hero-subtitle"  
- Hero CTA buttons: class="hero-cta"
- Hero image/visual: class="hero-image"
- Section content: class="fade-up" or "slide-left" or "slide-right"
- Card grids: class="stagger-cards" (on the container!)
- Stats numbers: class="counter"
- Background orbs: class="gradient-orb"
- Floating elements: class="float"

═══════════════════════════════════════════════════════════════════════════════
✨ CSS STYLES - AWWWARDS QUALITY!
═══════════════════════════════════════════════════════════════════════════════

REQUIRED CSS in <style> tag:
\`\`\`css
/* ═══════════════════════════════════════════════════════════════
   ANIMATIONS & KEYFRAMES
   ═══════════════════════════════════════════════════════════════ */
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
}
@keyframes pulse-glow {
  0%, 100% { opacity: 0.3; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.1); }
}
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* ═══════════════════════════════════════════════════════════════
   HOVER EFFECTS - Use on EVERY interactive element!
   ═══════════════════════════════════════════════════════════════ */
.hover-lift {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.hover-lift:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3), 0 0 40px rgba(99, 102, 241, 0.1);
}

.hover-glow {
  transition: all 0.3s ease;
  position: relative;
}
.hover-glow::before {
  content: '';
  position: absolute;
  inset: -2px;
  background: linear-gradient(45deg, #6366f1, #8b5cf6, #d946ef);
  border-radius: inherit;
  opacity: 0;
  z-index: -1;
  transition: opacity 0.3s ease;
  filter: blur(15px);
}
.hover-glow:hover::before { opacity: 0.6; }
.hover-glow:hover { border-color: rgba(99, 102, 241, 0.5); }

.btn-primary {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.btn-primary::before {
  content: '';
  position: absolute;
  top: 0; left: -100%;
  width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s ease;
}
.btn-primary:hover::before { left: 100%; }
.btn-primary:hover {
  transform: translateY(-3px) scale(1.05);
  box-shadow: 0 15px 40px rgba(99, 102, 241, 0.4);
}

/* ═══════════════════════════════════════════════════════════════
   CARD STYLES - Visible with depth!
   ═══════════════════════════════════════════════════════════════ */
.card {
  background: rgba(24, 24, 27, 0.9);
  border: 1px solid rgba(63, 63, 70, 0.5);
  backdrop-filter: blur(12px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.card:hover {
  transform: translateY(-8px) scale(1.02);
  border-color: rgba(99, 102, 241, 0.5);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(99, 102, 241, 0.15);
}

.glassmorphism {
  background: rgba(24, 24, 27, 0.8);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(63, 63, 70, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.glassmorphism-light {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* ═══════════════════════════════════════════════════════════════
   GRADIENT TEXT
   ═══════════════════════════════════════════════════════════════ */
.gradient-text {
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.gradient-text-animated {
  background: linear-gradient(90deg, #fff, #a5b4fc, #818cf8, #a5b4fc, #fff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradient-shift 4s linear infinite;
}

/* ═══════════════════════════════════════════════════════════════
   BACKGROUND EFFECTS
   ═══════════════════════════════════════════════════════════════ */
.animate-float { animation: float 6s ease-in-out infinite; }
.animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
.gradient-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(100px);
  animation: pulse-glow 5s ease-in-out infinite;
}
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
📄 MULTI-PAGE SPA - CRITICAL FOR MULTIPLE PAGES!
═══════════════════════════════════════════════════════════════════════════════

If scanData.pages.hasMultiplePages is true, CREATE ALL PAGES using React state:

const [currentPage, setCurrentPage] = useState('home');

// Navigation - ONLY show links for pages that EXIST in scanData.pages.detected!
<nav>
  {/* Map through scanData.pages.detected - don't add links for pages not created! */}
  <button onClick={() => setCurrentPage('home')} className={currentPage === 'home' ? 'text-white' : 'text-white/50'}>Home</button>
  <button onClick={() => setCurrentPage('about')} className={currentPage === 'about' ? 'text-white' : 'text-white/50'}>About</button>
</nav>

// Pages - EACH PAGE MUST HAVE FULL CONTENT!
{currentPage === 'home' && <HomePage />}
{currentPage === 'about' && <AboutPage />}
{currentPage === 'contact' && <ContactPage />}

🚨 CRITICAL RULES FOR MULTI-PAGE:
1. ONLY create navigation links for pages you ACTUALLY build
2. If page not built → DON'T add its nav link (prevents black screen!)
3. EVERY page must have FULL content - no empty pages!
4. Each page needs its own component with real sections

═══════════════════════════════════════════════════════════════════════════════
🚫 NO EMPTY SECTIONS - EVERY SECTION MUST HAVE CONTENT!
═══════════════════════════════════════════════════════════════════════════════

WRONG - Empty section:
<section className="py-20">
  <div className="container">
    {/* TODO: Add content */}
  </div>
</section>

CORRECT - Full section:
<section className="py-20 fade-up">
  <div className="container mx-auto px-4">
    <h2 className="text-4xl font-bold mb-8 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Our Services</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 stagger-cards">
      <div className="card p-6 glassmorphism rounded-xl hover-lift">
        <img src="https://picsum.photos/seed/service-1/400/300" className="w-full h-48 object-cover rounded-lg mb-4" />
        <h3 className="text-xl font-semibold mb-2">Service Name</h3>
        <p className="text-white/70">Detailed description of the service with real value proposition.</p>
      </div>
      {/* More cards... */}
    </div>
  </div>
</section>

═══════════════════════════════════════════════════════════════════════════════
📋 CODE TEMPLATE
═══════════════════════════════════════════════════════════════════════════════

🚨🚨🚨 BEFORE GENERATING CODE - CHECK scanData.ui.theme! 🚨🚨🚨
You MUST set CSS :root variables based on theme:

IF scanData.ui.theme === "light" (white/cream backgrounds):
  :root { --bg: #ffffff; --text: #111827; --surface: #f9fafb; --border: #e5e7eb; }
  Use: bg-white, text-gray-900, bg-gray-50, border-gray-200

IF scanData.ui.theme === "dark" (black/gray backgrounds):
  :root { --bg: #0a0a0a; --text: #ffffff; --surface: #18181b; --border: #27272a; }
  Use: bg-zinc-950, text-white, bg-zinc-900, border-zinc-800

The template below has LIGHT theme as default. CHANGE IT if theme is "dark"!

\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        /* 
        🚨 THEME CSS VARIABLES - SET BASED ON scanData.ui.theme! 🚨
        If theme === "light": --bg: #ffffff; --text: #111827; --surface: #f9fafb; --border: #e5e7eb;
        If theme === "dark": --bg: #0a0a0a; --text: #ffffff; --surface: #18181b; --border: #27272a;
        MUST replace values below based on detected theme!
        */
        :root {
            --bg: #ffffff;
            --text: #111827;
            --surface: #f9fafb;
            --border: #e5e7eb;
        }
        body { font-family: 'Inter', sans-serif; }
        
        /* Hover effects */
        .hover-lift { transition: all 0.3s ease; }
        .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
        .hover-glow { transition: all 0.3s ease; }
        .hover-glow:hover { box-shadow: 0 0 40px rgba(99, 102, 241, 0.5); border-color: rgba(99, 102, 241, 0.5); }
        .btn-primary { transition: all 0.3s ease; }
        .btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4); }
        
        /* Card styles - use CSS variables for theme */
        .card { 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
            background: var(--surface);
            border: 1px solid var(--border);
        }
        .card:hover { 
            transform: translateY(-4px) scale(1.01); 
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        /* Glassmorphism - theme-aware */
        .glassmorphism { 
            background: var(--surface); 
            backdrop-filter: blur(12px); 
            border: 1px solid var(--border);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        
        /* Animated gradient orbs */
        @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-20px) scale(1.05); }
        }
        @keyframes pulse-glow {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.1); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        
        /* Gradient text */
        .gradient-text {
            background: linear-gradient(135deg, #fff 0%, #a5b4fc 50%, #818cf8 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        /* Section dividers */
        .section-divider {
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent);
        }
    </style>
</head>
<body class="antialiased min-h-screen" style="background: var(--bg); color: var(--text);">
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect, useRef } = React;
        
        // Chart.js wrapper
        const ChartComponent = ({ type, data, options = {} }) => {
            const canvasRef = useRef(null);
            const chartRef = useRef(null);
            useEffect(() => {
                if (canvasRef.current) {
                    if (chartRef.current) chartRef.current.destroy();
                    chartRef.current = new Chart(canvasRef.current, { type, data, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, ...options } });
                }
                return () => { if (chartRef.current) chartRef.current.destroy(); };
            }, [type, data, options]);
            return <canvas ref={canvasRef} />;
        };

        // Icon helper - uses data-lucide attribute + createIcons()
        const Icon = ({ name, className = "w-5 h-5" }) => {
            const ref = useRef(null);
            useEffect(() => {
                if (ref.current && window.lucide) {
                    // Clear and create fresh icon element
                    ref.current.innerHTML = '';
                    const iconEl = document.createElement('i');
                    iconEl.setAttribute('data-lucide', name);
                    iconEl.className = className;
                    ref.current.appendChild(iconEl);
                    // Render the icon
                    window.lucide.createIcons({ root: ref.current });
                }
            }, [name, className]);
            return <span ref={ref} className="inline-flex items-center justify-center" />;
        };

        // YOUR COMPONENTS HERE - use scanData, add animations!
        
        const App = () => {
            useEffect(() => {
                gsap.registerPlugin(ScrollTrigger);
                // Initialize animations
                gsap.from('.fade-up', { scrollTrigger: { trigger: '.fade-up', start: 'top 80%' }, opacity: 0, y: 80, duration: 1, ease: 'power3.out' });
                gsap.from('.slide-left', { scrollTrigger: { trigger: '.slide-left', start: 'top 80%' }, opacity: 0, x: -100, duration: 1, ease: 'power2.out' });
                gsap.from('.slide-right', { scrollTrigger: { trigger: '.slide-right', start: 'top 80%' }, opacity: 0, x: 100, duration: 1, ease: 'power2.out' });
                gsap.from('.scale-up', { scrollTrigger: { trigger: '.scale-up', start: 'top 85%' }, opacity: 0, scale: 0.8, duration: 0.8, ease: 'back.out(1.7)' });
                gsap.from('.stagger-cards > *', { scrollTrigger: { trigger: '.stagger-cards', start: 'top 80%' }, opacity: 0, y: 60, stagger: 0.1, duration: 0.6 });
            }, []);
            
            return (
                <div className="min-h-screen">
                    {/* Build from scanData with animation classes! */}
                </div>
            );
        };

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
✅ AWWWARDS CHECKLIST - Your code MUST have ALL of these:
═══════════════════════════════════════════════════════════════════════════════

🖼️ STYLE REFERENCE (if provided):
☑ Colors EXACTLY match the reference image
☑ Typography style matches (weights, sizes, spacing)
☑ Card styles match reference
☑ Overall aesthetic/mood matches

📄 MULTI-PAGE (if scanData.pages.hasMultiplePages):
☑ ALL pages from scanData.pages.detected are built
☑ Navigation only shows links for pages you ACTUALLY created
☑ Use React state: const [currentPage, setCurrentPage] = useState('home')

🎬 HERO SECTION (CRITICAL!):
☑ Hero has class="hero-title", "hero-subtitle", "hero-cta", "hero-image"
☑ Hero timeline animation plays on load
☑ Animated gradient orbs in hero background (class="gradient-orb")
☑ Large typography (text-6xl md:text-8xl font-extrabold)
☑ Gradient text on headline (class="gradient-text")

🌟 SECTION ANIMATIONS (EVERY section!):
☑ GSAP animations initialized in useEffect
☑ Each section has animation class: fade-up, slide-left, slide-right, scale-up
☑ Card grids use stagger-cards class on container
☑ Stats use counter class for number animation
☑ Parallax backgrounds where appropriate

✨ MICRO-INTERACTIONS (on EVERYTHING!):
☑ ALL cards have hover-lift AND hover-glow
☑ ALL buttons have btn-primary class with shine effect
☑ Icon containers have gradient background
☑ Links have underline animation on hover

🎨 VISUAL EFFECTS:
☑ Gradient orbs in hero (at least 3-4 with different colors)
☑ Gradient dividers between sections
☑ Noise/grid texture overlays (subtle)
☑ Colored shadows (not gray!) on hover

👁️ VISIBILITY (NON-NEGOTIABLE!):
☑ Cards: bg-zinc-900/90 with border-zinc-700 (NOT bg-white/5!)
☑ Text: text-white or text-zinc-100 (NOT text-white/50!)
☑ Borders visible on all cards
☑ High contrast everywhere

🖼️ IMAGES:
☑ Picsum: https://picsum.photos/seed/NAME/W/H — EVERY image uses a UNIQUE seed!
☑ Avatars: https://i.pravatar.cc/150?img=XX

📝 CONTENT COMPLETENESS:
☑ ALL sections from scanData present — none removed
☑ ALL text content VERBATIM — no shortening or paraphrasing
☑ ALL nav items, metrics, table rows, form fields present
☑ Style changes APPEARANCE only — never removes content!

Generate STUNNING, AWWWARDS-QUALITY code:`;

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
      headers: { 'Accept': 'video/*,*/*' },
    });
    
    if (!response.ok) {
      console.error("[transmute] Video fetch failed:", response.status, response.statusText);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    console.log("[transmute] Video fetched. Size:", arrayBuffer.byteLength, "Type:", contentType);
    
    let mimeType = 'video/mp4';
    if (contentType.includes('webm')) mimeType = 'video/webm';
    else if (contentType.includes('quicktime') || contentType.includes('mov')) mimeType = 'video/quicktime';
    
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
    
    let mimeType = 'image/png';
    if (contentType.includes('jpeg') || contentType.includes('jpg')) mimeType = 'image/jpeg';
    else if (contentType.includes('webp')) mimeType = 'image/webp';
    
    return { base64, mimeType };
  } catch {
    return null;
  }
}

function extractCodeFromResponse(response: string): string | null {
  let cleaned = response.trim();
  cleaned = cleaned.replace(/^(Here'?s?|I'?ve|The|Below is|This is|Sure|Okay|Done)[^`<]*(?=```|<!DOCTYPE|<html)/i, '');
  
  const htmlMatch = cleaned.match(/```html\s*([\s\S]*?)```/i);
  if (htmlMatch && htmlMatch[1].trim().length > 100) return htmlMatch[1].trim();
  
  const codeMatch = cleaned.match(/```\s*([\s\S]*?)```/);
  if (codeMatch && codeMatch[1].trim().length > 100) return codeMatch[1].trim();
  
  const doctypeMatch = cleaned.match(/(<!DOCTYPE[\s\S]*<\/html>)/i);
  if (doctypeMatch) return doctypeMatch[1].trim();
  
  if (cleaned.startsWith('<!DOCTYPE') || cleaned.toLowerCase().startsWith('<html')) {
    const endIndex = cleaned.toLowerCase().lastIndexOf('</html>');
    if (endIndex > 0) return cleaned.substring(0, endIndex + 7);
  }
  
  return null;
}

/**
 * Fix broken HTML tags where the opening tag name is missing but attributes remain visible.
 * Common AI generation bug: "<span class="foo">bar</span>" becomes "class="foo">bar</span>"
 * Also ensures glitch elements have required data-text attribute.
 */
function fixBrokenHtmlTags(code: string): string {
  if (!code) return code;
  let fixed = code;
  let fixCount = 0;

  // Pattern 1: Orphaned class/className attributes NOT inside a tag opening
  fixed = fixed.replace(
    /([^<\w\-])(class(?:Name)?="[^"]*")(\s*>)/g,
    (match, before, classAttr, closing) => {
      if (before.match(/[='"\/\w\-]/)) return match;
      fixCount++;
      return `${before}<span ${classAttr}${closing}`;
    }
  );

  // Pattern 2: Orphaned style="..." attributes outside tags
  fixed = fixed.replace(
    /([^<\w\-])(style="[^"]*")(\s*>)/g,
    (match, before, styleAttr, closing) => {
      if (before.match(/[='"\/\w\-]/)) return match;
      fixCount++;
      return `${before}<span ${styleAttr}${closing}`;
    }
  );

  // Pattern 3: Ensure .glitch elements have data-text attribute
  fixed = fixed.replace(
    /<(\w+)([^>]*class="[^"]*glitch[^"]*"[^>]*)>([^<]{1,200})<\/\1>/gi,
    (match, tag, attrs, text) => {
      if (attrs.includes('data-text')) return match;
      fixCount++;
      return `<${tag}${attrs} data-text="${text.replace(/"/g, '&quot;')}">${text}</${tag}>`;
    }
  );

  if (fixCount > 0) {
    console.log(`[fixBrokenHtmlTags] Fixed ${fixCount} broken/incomplete HTML tags`);
  }
  return fixed;
}

// Fix multiline JSX pattern: child tag placed inside parent opening tag
// Pattern:
//   <button onClick={() => ...}
//       <span className="..."        ← child tag misplaced as attribute
//   >                                ← orphaned closing >
// Fix:
//   <button onClick={() => ...}>
//       <span className="...">
function fixJsxChildInsideOpeningTag(code: string): string {
  if (!code) return code;
  const lines = code.split('\n');
  const result: string[] = [];
  let fixCount = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trimStart();

    // Detect: current line starts a new JSX element (<Tag attrs...) without closing >
    // AND the very next line is a standalone `>`
    if (
      i + 1 < lines.length &&
      trimmed.match(/^<[A-Za-z][a-zA-Z0-9]* /) &&
      !trimmed.endsWith('>') &&
      !trimmed.endsWith('/>') &&
      !trimmed.includes('</') &&
      lines[i + 1].trim() === '>'
    ) {
      const childIndent = line.match(/^(\s*)/)?.[1] ?? '';
      const parentIndent = childIndent.length >= 4
        ? childIndent.slice(0, childIndent.length - 4)
        : childIndent;

      // Close the parent tag, then open child tag properly on its own line
      result.push(parentIndent + '>');
      result.push(line + '>');
      i += 2; // consume current line + orphaned `>` line
      fixCount++;
      continue;
    }

    result.push(line);
    i++;
  }

  if (fixCount > 0) {
    console.log(`[fixJsxChildInsideOpeningTag] Fixed ${fixCount} multiline child-inside-opening-tag patterns`);
  }
  return result.join('\n');
}

// Fix malformed double-tag patterns like <div <span className="..."> → <div className="...">
// Also handles attributes before duplicate: <span key={i} <span className="..."> → <span key={i} className="...">
function fixMalformedDoubleTags(code: string): string {
  if (!code) return code;
  let fixed = code;
  let fixCount = 0;
  let prev = "";
  while (prev !== fixed) {
    prev = fixed;
    fixed = fixed.replace(/<(\w+)(\s[^<>]*)<\w+(\s+)/g, (match, firstTag, attrs, trailing) => {
      fixCount++;
      return `<${firstTag}${attrs}${trailing}`;
    });
  }
  if (fixCount > 0) {
    console.log(`[fixMalformedDoubleTags] Fixed ${fixCount} malformed double-tag patterns`);
  }
  return fixed;
}

function fixBrokenImageUrls(code: string): string {
  if (!code) return code;

  const imageSeeds = [
    'project-alpha', 'product-hero', 'team-photo', 'office-space', 'city-skyline',
    'nature-forest', 'architecture-modern', 'abstract-tech', 'person-portrait', 'landscape-mountain',
    'urban-street', 'interior-design', 'workspace-minimal', 'startup-life', 'tech-device',
    'food-restaurant', 'travel-destination', 'fitness-health', 'fashion-style', 'art-creative',
    'ocean-view', 'building-glass', 'garden-green', 'night-city', 'desert-sand',
  ];
  let imageCounter = 0;

  const getNextPicsumUrl = (width = 800, height = 600) => {
    const seed = imageSeeds[imageCounter % imageSeeds.length];
    imageCounter++;
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
  };
  
  code = code.replace(/https?:\/\/[^"'\s)]*unsplash[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/[^"'\s)]*pexels[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/via\.placeholder\.com[^"'\s)]*/gi, () => getNextPicsumUrl());
  code = code.replace(/https?:\/\/placehold\.co[^"'\s)]*/gi, () => getNextPicsumUrl());
  
  return code;
}

// Fix chart references - ensure Chart.js is properly set up
function fixChartReference(code: string): string {
  if (!code) return code;
  
  let fixedCode = code;
  
  // Chart.js component wrapper
  const chartComponent = `
        // CHART.JS - React wrapper component
        const ChartComponent = ({ type, data, options = {} }) => {
            const canvasRef = useRef(null);
            const chartRef = useRef(null);
            
            useEffect(() => {
                if (canvasRef.current) {
                    if (chartRef.current) chartRef.current.destroy();
                    chartRef.current = new Chart(canvasRef.current, {
                        type,
                        data,
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            ...options
                        }
                    });
                }
                return () => { if (chartRef.current) chartRef.current.destroy(); };
            }, [type, data, options]);
            
            return <canvas ref={canvasRef} />;
        };
`;

  // Check if code uses charts but doesn't have ChartComponent
  const usesCharts = fixedCode.includes('ChartComponent') || 
                     fixedCode.includes('new Chart(') ||
                     fixedCode.includes('chart.js');
  
  const hasChartComponent = fixedCode.includes('const ChartComponent');
  
  // Inject ChartComponent if charts are used but component is missing
  if (usesCharts && !hasChartComponent) {
    fixedCode = fixedCode.replace(
      /(const\s*\{\s*useState\s*,\s*useEffect[^}]*\}\s*=\s*React\s*;?)/,
      (match) => {
        return match + '\n' + chartComponent;
      }
    );
  }
  
  // Remove any Recharts imports/references (AI might still generate them)
  fixedCode = fixedCode.replace(/const\s*\{[^}]+\}\s*=\s*(?:window\.)?Recharts[^;]*;?/g, '// Recharts removed - use ChartComponent instead');
  fixedCode = fixedCode.replace(/<(?:Area|Bar|Line|Pie)Chart[^>]*>[\s\S]*?<\/(?:Area|Bar|Line|Pie)Chart>/g, 
    '<div style={{height: "300px", display: "flex", alignItems: "center", justifyContent: "center", background: "#1f2937", borderRadius: "8px"}}><span style={{color: "#9ca3af"}}>Chart placeholder - use ChartComponent</span></div>');
  
  return fixedCode;
}

// ============================================================================
// MAIN TRANSMUTE FUNCTION - MULTI-PASS PIPELINE
// ============================================================================

export async function transmuteVideoToCode(options: TransmuteOptions): Promise<TransmuteResult> {
  const { videoUrl, styleDirective, databaseContext, styleReferenceImage, useSurveyor = true } = options;
  
  console.log("[transmute] MULTI-PASS PIPELINE v3.0 - Starting with Agentic Vision...");
  console.log("[transmute] Video URL:", videoUrl?.substring(0, 100));
  console.log("[transmute] Surveyor enabled:", useSurveyor);
  console.log("[transmute] Style directive:", styleDirective?.substring(0, 80) || "none");
  
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }
  
  // Retry helpers for 503/429 high demand errors
  const MAX_RETRIES = 3;
  const retryDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const isRetryableError = (error: any) => {
    const msg = error?.message || '';
    return msg.includes('503') || msg.includes('overloaded') || msg.includes('Service Unavailable') || msg.includes('429') || msg.includes('rate limit');
  };

  // Timeout helper - CRITICAL to avoid 504 errors on Vercel
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs/1000}s`)), timeoutMs)
      )
    ]);
  };
  
  try {
    // Fetch video from URL (with 45s timeout for larger files)
    const videoData = await withTimeout(
      fetchVideoAsBase64(videoUrl),
      45000,
      "Video fetch"
    );
    if (!videoData) {
      return { success: false, error: "Failed to fetch video from storage" };
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const startTime = Date.now();
    
    // Calculate video size for logging
    const videoSizeMB = (videoData.base64.length * 0.75) / (1024 * 1024); // base64 is ~33% larger
    console.log("[transmute] Video size:", videoSizeMB.toFixed(2), "MB");
    
    // ════════════════════════════════════════════════════════════════
    // PHASE 0: THE SURVEYOR - Measure layout with Agentic Vision
    // Uses Gemini 3 Flash with Code Execution to get HARD DATA
    // "Measure twice, cut once"
    // ════════════════════════════════════════════════════════════════
    let surveyorMeasurements: LayoutMeasurements | undefined;
    let surveyorPromptData = '';
    
    if (useSurveyor) {
      console.log("[transmute] Phase 0: THE SURVEYOR - Measuring layout with Agentic Vision...");
      
      try {
        // Extract a key frame from video for Surveyor analysis
        // For now, we use the video data directly - Gemini can extract frames
        // In production, we'd extract a representative frame
        const surveyorResult = await withTimeout(
          runParallelSurveyor(videoData.base64, videoData.mimeType),
          60000, // 60s timeout for Surveyor
          "Surveyor Measurement"
        );
        
        if (surveyorResult.success && surveyorResult.measurements) {
          surveyorMeasurements = validateMeasurements(surveyorResult.measurements);
          surveyorPromptData = formatSurveyorDataForPrompt(surveyorMeasurements);
          
          console.log("[transmute] Surveyor SUCCESS! Confidence:", Math.round(surveyorMeasurements.confidence * 100) + "%");
          console.log("[transmute] Measured spacing:", JSON.stringify(surveyorMeasurements.spacing));
          console.log("[transmute] Detected colors:", Object.keys(surveyorMeasurements.colors).length);
          console.log("[transmute] Detected components:", surveyorMeasurements.components.length);
        } else {
          console.warn("[transmute] Surveyor returned no measurements, continuing without hard data");
        }
      } catch (surveyorError: any) {
        // Surveyor failure is non-fatal - we continue without hard measurements
        console.warn("[transmute] Surveyor failed (non-fatal):", surveyorError?.message);
        console.warn("[transmute] Continuing without Agentic Vision measurements...");
      }
    }
    
    // ════════════════════════════════════════════════════════════════
    // PHASE 1: UNIFIED SCAN - Extract everything from video
    // Always use Pro model, 200s timeout for large videos up to 20MB
    // ════════════════════════════════════════════════════════════════
    console.log("[transmute] Phase 1: Starting unified scan with Pro model...");
    
    // 200s timeout for Phase 1 - large videos (20MB) need more time with Pro model
    const phase1Timeout = 200000;
    console.log("[transmute] Phase 1 timeout:", phase1Timeout / 1000, "s");
    
    let scanResult;
    let usedModel = "gemini-3.1-pro-preview";
    
    // Use Gemini 3 Pro for best video understanding
    const phase1Models = ["gemini-3.1-pro-preview"];
    let phase1Error: any;
    
    for (const modelName of phase1Models) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[transmute] Phase 1 trying model: ${modelName} (attempt ${attempt}/${MAX_RETRIES})`);
          const scannerModel = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 16384,
            },
            safetySettings: [
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT" as any, threshold: "BLOCK_LOW_AND_ABOVE" as any },
              { category: "HARM_CATEGORY_HATE_SPEECH" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
              { category: "HARM_CATEGORY_HARASSMENT" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT" as any, threshold: "BLOCK_MEDIUM_AND_ABOVE" as any },
            ],
          });

          scanResult = await withTimeout(
            scannerModel.generateContent([
              { text: UNIFIED_SCAN_PROMPT },
              { inlineData: { mimeType: videoData.mimeType, data: videoData.base64 } },
            ]),
            phase1Timeout,
            `Phase 1 Video Scan (${modelName})`
          );
          usedModel = modelName;
          break;
        } catch (error: any) {
          phase1Error = error;
          console.error(`[transmute] Phase 1 ${modelName} attempt ${attempt} failed:`, error?.message);
          if (!isRetryableError(error)) {
            throw error;
          }
          if (attempt < MAX_RETRIES) {
            const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
            console.log(`[transmute] Phase 1 retrying in ${waitTime / 1000}s...`);
            await retryDelay(waitTime);
          }
        }
      }
      if (scanResult) break;
    }
    
    if (!scanResult) {
      throw phase1Error || new Error("All models failed for Phase 1");
    }
    
    console.log("[transmute] Phase 1 used model:", usedModel);
    
    const scanText = scanResult.response.text();
    console.log("[transmute] Phase 1 complete. Scan length:", scanText.length);

    // Parse scan data with JSON repair
    let scanData: any = null;

    const tryParseJSON = (text: string): any => {
      // Try direct match first
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      let jsonStr = jsonMatch[0];

      // Attempt 1: direct parse
      try {
        return JSON.parse(jsonStr);
      } catch (e) {
        console.warn("[transmute] Direct JSON parse failed, attempting repair...");
      }

      // Attempt 2: fix common Gemini JSON issues
      try {
        // Remove trailing commas before } or ]
        jsonStr = jsonStr.replace(/,\s*([\]}])/g, '$1');
        // Fix unescaped newlines inside strings
        jsonStr = jsonStr.replace(/(?<=":[ ]*"[^"]*)\n(?=[^"]*")/g, '\\n');
        // Remove control characters
        jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (c) => c === '\n' || c === '\r' || c === '\t' ? c : '');
        return JSON.parse(jsonStr);
      } catch (e) {
        console.warn("[transmute] Repaired JSON parse also failed");
      }

      // Attempt 3: extract between first { and last }
      try {
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
          let extracted = text.substring(firstBrace, lastBrace + 1);
          extracted = extracted.replace(/,\s*([\]}])/g, '$1');
          return JSON.parse(extracted);
        }
      } catch (e) {
        console.warn("[transmute] Extracted JSON parse also failed");
      }

      return null;
    };

    scanData = tryParseJSON(scanText);

    if (scanData) {
      console.log("[transmute] Scan data parsed. Menu items:", scanData?.ui?.navigation?.sidebar?.items?.length || 0);
    }

    // If parse failed, retry with Pro again (with JSON mode forced)
    if (!scanData) {
      console.warn("[transmute] Phase 1 JSON parse failed. Retrying with gemini-3.1-pro-preview (JSON mode)...");
      console.warn("[transmute] First 500 chars of failed response:", scanText.substring(0, 500));

      try {
        const retryModel = genAI.getGenerativeModel({
          model: "gemini-3.1-pro-preview",
          generationConfig: {
            temperature: 0.05,
            maxOutputTokens: 16384,
            responseMimeType: "application/json",
          },
        });

        const retryResult = await withTimeout(
          retryModel.generateContent([
            { text: UNIFIED_SCAN_PROMPT },
            { inlineData: { mimeType: videoData.mimeType, data: videoData.base64 } },
          ]),
          phase1Timeout,
          "Phase 1 Retry (gemini-3.1-pro-preview JSON mode)"
        );

        const retryText = retryResult.response.text();
        console.log("[transmute] Retry scan length:", retryText.length);
        scanData = tryParseJSON(retryText);

        if (scanData) {
          usedModel = "gemini-3.1-pro-preview (retry)";
          console.log("[transmute] Retry succeeded with Pro JSON mode");
        }
      } catch (retryError: any) {
        console.error("[transmute] Pro retry also failed:", retryError?.message);
      }
    }

    if (!scanData) {
      return { success: false, error: "Failed to extract structured data from video. The AI could not parse the video content. Please try again or use a shorter/clearer video." };
    }
    
    // ════════════════════════════════════════════════════════════════
    // PHASE 2: ASSEMBLER - Generate code from SCAN DATA ONLY
    // ════════════════════════════════════════════════════════════════
    console.log("[transmute] Phase 2: Starting code assembly (NO VIDEO)...");
    
    // Build assembler prompt
    let assemblerPrompt = ASSEMBLER_PROMPT;
    
    // Check if user selected a specific style (not auto-detect)
    const isDSStyleDirective = styleDirective?.startsWith("DESIGN SYSTEM STYLE GUIDE:");
    const hasCustomStyle = styleDirective && 
      !styleDirective.toLowerCase().includes('auto') && 
      !isDSStyleDirective &&
      styleDirective.trim().length > 10;
    
    if (isDSStyleDirective) {
      // Design System style - use DS tokens for colors/typography BUT respect video's detected theme (light/dark)
      assemblerPrompt += `\n\n**═══════════════════════════════════════════════════════════════**
**🎨 DESIGN SYSTEM STYLE GUIDE - OVERRIDE COLORS ONLY!**
**═══════════════════════════════════════════════════════════════**
IMPORTANT: User has imported a Design System. You MUST:
1. USE the Design System's colors, typography, spacing, and border-radius tokens below
2. ⚠️ CRITICAL: RESPECT scanData.ui.theme (light/dark) FROM THE VIDEO!
   - Check scanData.ui.theme value AND scanData.ui.colors.background
   - If theme === "light" OR background is #fff/#faf/#f5f/white/cream → Generate LIGHT theme output!
   - If theme === "dark" OR background is #000/#0a0/#111/black → Generate DARK theme output!
3. Keep the TEXT CONTENT, STRUCTURE, and INTERACTIONS from scanData
4. Match component purposes from the DS component patterns

**THEME DETECTION RULES FOR DS:**
- The DS tokens define the PALETTE (which colors to use)
- The VIDEO defines the THEME (light or dark mode)
- For LIGHT video: Use DS colors for accents/primary, but keep backgrounds WHITE/LIGHT (bg-white, bg-gray-50)
- For DARK video: Use DS colors for accents/primary, with DARK backgrounds (bg-zinc-950, bg-gray-900)
- NEVER default to dark theme when the video clearly shows light backgrounds!
- If Surveyor detected theme, trust the Surveyor's measurement over AI guessing

**DESIGN SYSTEM:**
${styleDirective}

Use the DS tokens for all visual styling. Adapt them to the video's detected theme (light/dark).`;
    } else if (hasCustomStyle) {
      // User selected a specific style - OVERRIDE video colors completely
      assemblerPrompt += `\n\n**═══════════════════════════════════════════════════════════════**
**🎨 STYLE DIRECTIVE - OVERRIDE VIDEO COLORS/STYLES!**
**═══════════════════════════════════════════════════════════════**
IMPORTANT: User has selected a CUSTOM STYLE. You MUST:
1. IGNORE scanData.ui.colors completely - do NOT use video's original colors
2. IGNORE scanData.ui.theme - apply the style's own theme (light/dark)
3. APPLY ALL style instructions below for colors, gradients, shadows, animations
4. Keep ALL TEXT CONTENT and ALL SECTIONS from scanData — every headline, paragraph, nav item, metric, table row, form field VERBATIM!
5. Keep the SAME number of sections/cards/items — custom style changes APPEARANCE not CONTENT!
6. Do NOT shorten paragraphs, remove sections, or drop content to "fit" the style

🔴 CONTENT COMPLETENESS RULE: The style changes colors/fonts/effects — it NEVER removes or shortens content!
   - If scanData has 5 sections → output has 5 sections (with new style)
   - If scanData has a 3-sentence paragraph → output has the SAME 3-sentence paragraph (styled differently)
   - If scanData has 8 nav items → output has 8 nav items (styled differently)

**STYLE TO APPLY:**
${styleDirective}

The style directive above defines ALL visual aspects: colors, backgrounds, gradients, shadows, animations, hover effects. USE IT, not the video colors! But KEEP ALL CONTENT intact!`;
    } else if (styleDirective && styleDirective.trim()) {
      // Light directive with some text - use video colors
      assemblerPrompt += `\n\n**STYLE DIRECTIVE:**\n${styleDirective}`;
    } else {
      // AUTO-DETECT MODE — no style selected, use video colors exactly
      assemblerPrompt += `\n\n**═══════════════════════════════════════════════════════════════**
**🎯 AUTO-DETECT MODE — PRESERVE EXACT VIDEO COLORS & THEME!**
**═══════════════════════════════════════════════════════════════**
No custom style was selected. You MUST:
1. Use the EXACT colors from scanData.ui.colors — do NOT substitute or "improve" them!
2. Respect scanData.ui.theme (light/dark) — if the video is light, output MUST be light!
3. If Surveyor measurements are provided, they are pixel-sampled — trust them exactly.
4. Do NOT default to a dark theme. Do NOT add indigo/purple accents unless they are in the video.
5. The goal is FAITHFUL RECREATION of the original video's visual design.
6. IGNORE any "premium dark theme" or "AWWWARDS" instructions from the base prompt — in auto-detect mode the VIDEO IS LAW.
7. If scanData.ui.colors.background is #ffffff or similar light color → bg-white, NOT bg-zinc-950!
8. If scanData.ui.colors.primary is #ea580c → use orange accents, NOT indigo/purple!
9. CONTENT: Every single text string from scanData MUST appear in the output. No missing sections, no shortened text.`;
    }
    
    if (databaseContext) {
      assemblerPrompt += `\n\n**DATABASE CONTEXT:**\n${databaseContext}`;
    }
    
    // Design System context now flows through styleDirective (DS_STYLE:: format)
    // The rich style guide with tokens and component specs is built in page.tsx
    // and passed as the styleDirective parameter - no separate injection needed.
    
    const menuCount = scanData?.ui?.navigation?.sidebar?.items?.length || 0;
    const metricCount = scanData?.data?.metrics?.length || 0;
    const chartCount = scanData?.data?.charts?.length || 0;
    const tableCount = scanData?.data?.tables?.length || 0;
    
    // ════════════════════════════════════════════════════════════════
    // INJECT SURVEYOR HARD DATA (The Secret Sauce!)
    // These are MEASURED values, not guesses. Use them EXACTLY.
    // ════════════════════════════════════════════════════════════════
    if (surveyorPromptData) {
      assemblerPrompt += surveyorPromptData;
      console.log("[transmute] Injected Surveyor measurements into assembler prompt");
    }
    
    // Color instruction depends on whether custom style or DS is selected
    const colorInstruction = isDSStyleDirective
      ? "USE DESIGN SYSTEM COLORS ONLY from the DS style guide above! IGNORE scanData.ui.colors AND surveyor colors completely. The DS tokens define ALL colors for EVERY element: header, nav, buttons, backgrounds, text, borders. Use them CONSISTENTLY across the ENTIRE page — no mixing with video colors. Only use scanData.ui.theme to determine light/dark mode."
      : hasCustomStyle
        ? "IGNORE scanData.ui.colors - use STYLE DIRECTIVE colors instead!"
        : surveyorMeasurements
          ? "Use EXACT colors from SURVEYOR MEASUREMENTS above (they are pixel-sampled)!"
          : "Use colors from scanData.ui.colors.";
    
    // Spacing instruction - use Surveyor data if available
    const spacingInstruction = surveyorMeasurements
      ? `Use EXACT spacing from SURVEYOR MEASUREMENTS:
   - Sidebar: ${surveyorMeasurements.spacing.sidebarWidth}
   - Nav: ${surveyorMeasurements.spacing.navHeight}
   - Card padding: ${surveyorMeasurements.spacing.cardPadding}
   - Section gap: ${surveyorMeasurements.spacing.sectionGap}
   DO NOT use approximate Tailwind classes (p-4, p-6). Use p-[24px] format with EXACT values!`
      : "Estimate spacing from visual analysis.";
    
    assemblerPrompt += `\n\n**═══════════════════════════════════════════════════════════════**
**SCAN DATA (Source of Truth for CONTENT & STRUCTURE):**
**═══════════════════════════════════════════════════════════════**

\`\`\`json
${JSON.stringify(scanData, null, 2)}
\`\`\`

**ASSEMBLY INSTRUCTIONS:**
1. Build sidebar with EXACTLY ${menuCount} menu items — use scanData labels verbatim.
2. Create ${metricCount} metric cards with EXACT values from scanData.
3. Create ${chartCount} charts using ChartComponent (Chart.js).
4. Create ${tableCount} tables with all rows — no dropping rows.
5. ${colorInstruction}
6. ${spacingInstruction}
7. CONTENT 1:1 (🔴 MOST IMPORTANT RULE): Every headline, paragraph, nav label, button text, FAQ item, footer line from scanData MUST appear in the output VERBATIM. Do not skip ANY section, do not shorten ANY text. If scanData has 5 FAQ items, output MUST have 5 FAQ items. If a paragraph has 3 sentences, output ALL 3 sentences. ZERO exceptions.
8. LAYOUT: Use CSS Grid or Flexbox for card rows — NEVER inline-block. Cards must fill grid cells (w-full, h-full).
9. BUTTONS: ALL buttons/links MUST be VISIBLE by default. NEVER opacity:0 or visibility:hidden until hover. Hover enhances — doesn't create visibility. Button text must be COMPLETE (never truncated). NO shader/canvas/WebGL effects on buttons — clean CSS only!
9b. HERO HEADLINES: Write with SINGLE spaces between words. NO extra spaces ("W E L C O M E" is WRONG — use CSS letter-spacing instead). Write the FULL headline from video, never truncate.
9c. ANIMATIONS: Hero elements animate IMMEDIATELY (no ScrollTrigger). Below-fold: start:'top 85%'. Every opacity:0 element MUST have a GSAP tween to opacity:1. Zero orphaned invisible elements!
10. THEME: Respect scanData.ui.theme — if light, use light backgrounds (bg-white). If dark, use dark backgrounds (bg-zinc-950).
${isDSStyleDirective ? `11. DS CONSISTENCY: Apply Design System colors uniformly to ALL sections — header, hero, content, sidebar, footer. Every bg-*, text-*, border-* class must come from the DS token palette. Do NOT use any hardcoded hex colors that aren't in the DS style guide.` : ''}
${surveyorMeasurements ? `
**CRITICAL - SURVEYOR DATA IS LAW FOR LAYOUT/SPACING:**
The measurements above came from Agentic Vision Code Execution - they are PIXEL-PERFECT.
Use p-[${surveyorMeasurements.spacing.cardPadding}] NOT p-4 or p-6.
${isDSStyleDirective
  ? '⚠️ COLORS: Use DESIGN SYSTEM colors from the DS style guide — NOT surveyor colors. Surveyor is only authoritative for SPACING and LAYOUT dimensions.'
  : `Use bg-[${surveyorMeasurements.colors.background}] NOT bg-slate-900.`
}
` : ''}

**🚫 EMPTY SECTIONS — ZERO TOLERANCE:**
- EVERY card, section, or content block MUST have REAL text content inside!
- If scanData has cards with text (title + description) → output EVERY card with that text
- NEVER output empty cards with just a number or icon — fill with the actual scanData content
- If scanData has 4 feature cards → each card needs its title AND description text from scanData

**📐 FULLSCREEN SECTIONS:**
- If scanData shows a section spans full viewport width → use w-full, min-h-screen or equivalent
- Hero sections that fill the screen → MUST be full-width in output
- Dark background sections that span edge-to-edge → MUST span full width (no max-w container on bg)

**📐 LAYOUT STRUCTURE — MATCH THE VIDEO:**
- If scanData describes a SPLIT HERO (text on one side, image on other) → build a two-column hero, NOT centered
- If scanData shows sidebar+main → build RESPONSIVE sidebar with SINGLE main:

  MANDATORY PATTERN (Alpine.js — hamburger + slide-out drawer!):
  <div x-data="{ sidebarOpen: false }" class="min-h-screen">
    <!-- Mobile hamburger top bar -->
    <div class="lg:hidden flex items-center justify-between p-4 border-b" style="background:var(--sidebar-bg,#1f2937);">
      <span class="font-bold text-white">App</span>
      <button @click="sidebarOpen = !sidebarOpen" class="text-white">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>
    </div>
    <!-- Slide-out drawer overlay -->
    <div x-show="sidebarOpen" x-transition class="lg:hidden fixed inset-0 z-40">
      <div class="absolute inset-0 bg-black/50" @click="sidebarOpen=false"></div>
      <aside class="relative z-50 w-64 h-full overflow-y-auto p-4" style="background:var(--sidebar-bg,#1f2937);">
        <!-- Same nav items as desktop sidebar -->
      </aside>
    </div>
    <div class="flex min-h-screen">
      <aside class="hidden lg:flex lg:flex-col lg:w-[250px] lg:flex-shrink-0 p-4">sidebar</aside>
      <main class="flex-1 min-w-0 overflow-x-hidden p-4 lg:p-6">
        <!-- ALL content ONCE — works on desktop AND mobile! -->
      </main>
    </div>
  </div>

  🚨 SINGLE <main>! Content written ONCE for ALL screen sizes!
  ❌ NEVER create two <main> elements — mobile one will be EMPTY!
  ❌ NEVER show a vertical sidebar on mobile — it covers the entire screen!
- Do NOT center everything by default — match the actual column layout from scanData
- "View Companies" button next to "Apply to YC" → put them SIDE BY SIDE, not stacked

**🚨 ZERO VALUES — NEVER OUTPUT (applies to ALL numbers in output):**
- "0+" funded startups → WRONG! Use the value from scanData, or estimate "5,000+"
- "$0B" valuation → WRONG! Use the value from scanData, or estimate "$800B"
- If scanData has "0" for a counter → it captured an animation start frame → estimate the real value!
- DASHBOARD KPIs: "$0", "0 cases", "0 users", "$0.00" → ALL WRONG! Use realistic values: "$14,250", "1,847 cases", "12,500 users"
- TABLE DATA: Every numeric cell must have a realistic non-zero value. "$0" in a table = BUG.
- BEFORE outputting: Ctrl+F for ">0<" and ">$0" in your code — if found, REPLACE with realistic values!

**🖼️ IMAGE UNIQUENESS — CRITICAL:**
- Count ALL <img> tags you generate. EVERY one MUST have a DIFFERENT picsum seed!
- BAD: card-1/800/600, card-1/800/600, card-1/800/600 (same seed 3x)
- GOOD: card-tokyo/800/600, card-berlin/800/600, card-paris/800/600 (unique seeds)
- Use descriptive, contextual seeds — NOT just numbers!

🚨🚨🚨 FINAL CHECK — SIDEBAR RESPONSIVENESS 🚨🚨🚨
If your output has a sidebar/left panel, verify:
✅ Desktop sidebar has class="hidden lg:flex" (invisible on mobile!)
✅ Mobile has hamburger top bar (class="lg:hidden") + slide-out drawer (x-show, x-transition)
✅ Drawer has backdrop overlay (bg-black/50) and closes on click
✅ Only ONE <main> element — content written ONCE for all screen sizes!
❌ NEVER show a vertical sidebar on mobile!
❌ NEVER two <main> elements — mobile one will be EMPTY!

Generate the complete HTML file now:`;

    // Add animation library for premium WebGL backgrounds, text effects, card interactions
    assemblerPrompt += '\n\n' + ANIMATION_LIBRARY_PROMPT;

    // Calculate remaining time for Phase 2 (leave buffer for Vercel 300s limit)
    const elapsedMs = Date.now() - startTime;
    const phase2Timeout = Math.max(150000, 280000 - elapsedMs); // At least 150s, up to remaining time
    console.log("[transmute] Phase 2 timeout:", Math.round(phase2Timeout / 1000), "s");
    
    let assemblyResult;
    let assemblerUsedModel = "gemini-3.1-pro-preview"; // Use Gemini 3 Pro for code generation
    
    // Helper: Try model with retry
    const tryModel = async (modelName: string, timeout: number): Promise<any> => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 65000, // Gemini 3.1 Pro limit is 65,536
        },
      });
      return withTimeout(
        model.generateContent([{ text: assemblerPrompt }]),
        timeout,
        `Phase 2 Code Assembly (${modelName})`
      );
    };
    
    // Use Gemini 3 Pro for code generation
    const modelsToTry = ["gemini-3.1-pro-preview"];
    let lastError: any;
    
    for (const modelName of modelsToTry) {
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[transmute] Phase 2 trying model: ${modelName} (attempt ${attempt}/${MAX_RETRIES})`);
          assemblyResult = await tryModel(modelName, phase2Timeout);
          assemblerUsedModel = modelName;
          break;
        } catch (error: any) {
          lastError = error;
          console.error(`[transmute] Phase 2 ${modelName} attempt ${attempt} failed:`, error?.message);
          if (!isRetryableError(error)) {
            throw error;
          }
          if (attempt < MAX_RETRIES) {
            const waitTime = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
            console.log(`[transmute] Phase 2 retrying in ${waitTime / 1000}s...`);
            await retryDelay(waitTime);
          }
        }
      }
      if (assemblyResult) break;
    }
    
    if (!assemblyResult) {
      throw lastError || new Error("All models failed for Phase 2");
    }
    
    console.log("[transmute] Phase 2 used model:", assemblerUsedModel);
    
    const assemblyText = assemblyResult.response.text();
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[transmute] Phase 2 complete in ${duration}s`);
    
    // Extract code
    let code = extractCodeFromResponse(assemblyText);
    if (!code) {
      return { success: false, error: "Failed to extract valid HTML code" };
    }
    
    code = fixBrokenImageUrls(code);
    code = fixChartReference(code);
    code = fixBrokenHtmlTags(code);
    code = fixJsxChildInsideOpeningTag(code);
    code = fixMalformedDoubleTags(code);
    
    // Get token usage
    const usageMetadata = assemblyResult.response.usageMetadata;
    const tokenUsage = usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount || 0,
      candidatesTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : undefined;
    
    console.log("[transmute] Success! Code length:", code.length);
    if (surveyorMeasurements) {
      console.log("[transmute] Surveyor confidence:", Math.round(surveyorMeasurements.confidence * 100) + "%");
    }
    
    // New component detection - detect data-new-component markers in generated code
    let localComponents: LocalComponent[] = [];
    try {
      const newComponents = detectNewComponentsFromCode(code, []);
      localComponents = newComponents.map((nc, idx) => ({
        id: `local-${Date.now()}-${idx}`,
        name: nc.name,
        code: nc.code,
        layer: 'components' as const,
        isNew: true,
        savedToLibrary: false,
      }));
      
      if (localComponents.length > 0) {
        console.log("[transmute] Detected new components:", localComponents.map(c => c.name).join(", "));
      }
    } catch (detectError: any) {
      console.warn("[transmute] Failed to detect new components:", detectError?.message);
    }
    
    return {
      success: true,
      code,
      scanData,
      surveyorMeasurements, // Agentic Vision measurements
      localComponents, // New components for "Save to Library"
      tokenUsage,
    };
    
  } catch (error: any) {
    console.error("[transmute] Error:", error?.message || error);
    return { success: false, error: error?.message || "Generation failed" };
  }
}

// ============================================================================
// EDIT CODE FUNCTION
// ============================================================================

// Alias for backwards compatibility with edit-code route
export async function editCodeWithAI(
  currentCode: string,
  editRequest: string,
  images?: any[],
  databaseContext?: string,
  isPlanMode?: boolean,
  chatHistory?: any[]
): Promise<EditResult> {
  // For now, ignore images and just use the basic edit function
  return editCode(currentCode, editRequest, chatHistory || []);
}

export async function editCode(
  currentCode: string,
  instruction: string,
  previousHistory: { role: string; content: string }[] = []
): Promise<EditResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 100000,
        // @ts-ignore
        thinkingConfig: { thinkingBudget: 4096 },
      },
    });

    const prompt = `You are a code editor. Apply the following instruction to the code.

INSTRUCTION: ${instruction}

CURRENT CODE:
\`\`\`html
${currentCode}
\`\`\`

Return the COMPLETE modified code wrapped in \`\`\`html blocks.
Make only the requested changes, preserve everything else.`;

    const result = await model.generateContent([{ text: prompt }]);
    const responseText = result.response.text();

    const code = extractCodeFromResponse(responseText);
    if (!code) {
      return { success: false, error: "Failed to extract modified code" };
    }

    return { success: true, code };
  } catch (error: any) {
    return { success: false, error: error?.message || "Edit failed" };
  }
}
