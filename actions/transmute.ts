"use server";

import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// ═══════════════════════════════════════════════════════════════════════════════
// MULTI-PASS PIPELINE v2.0 (Server Action Version)
// Phase 1: UNIFIED SCAN - Extract EVERYTHING from video
// Phase 2: ASSEMBLER - Generate code from JSON data ONLY
// ═══════════════════════════════════════════════════════════════════════════════

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
  scanData?: any;
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
4. ACCURATE COLORS: Sample hex values from actual pixels.
5. FULL TABLES: Capture all visible rows and columns - not just first 3!
6. CHART DATA: Estimate data points from axis scales. Charts MUST fill their containers!
7. LOGO TEXT: Read the EXACT logo text - letter by letter. DO NOT invent.
8. SIDEBAR TYPE: Identify if sidebar contains MENU ITEMS (icons+labels) or USER LIST (avatars+names).

═══════════════════════════════════════════════════════════════════════════════
🟢 CONTENT 1:1 — OBOWIĄZKOWE (NIE POMIJAJ, NIE SKRACAJ!)
═══════════════════════════════════════════════════════════════════════════════
Content musi być odtworzony W CAŁOŚCI, 1:1 z tym co widać. ZAKAZ:
- skracania paragrafów, "pierwszych 3 punktów", "itp."
- pomijania sekcji (hero, partnerzy, FAQ, newsletter, stopka — wszystkie muszą być)
- parafrazowania ("Dostarczamy zaawansowane…" ≠ "We deliver advanced…" — dokładna treść)
- używania placeholderów zamiast realnego tekstu

WYMAGANE: Każdy nagłówek, akapit, etykieta nav, tekst przycisku, pozycja listy, pytanie/odpowiedź FAQ,
tekst w stopce, pole formularza — wpisuj do JSON VERBATIM (znak w znak). Jeśli jest 7 pozycji menu,
wypisz wszystkie 7. Jeśli sekcja ma 4 akapity, wypisz wszystkie 4. Zero wyjątków.

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
    "theme": "dark OR light - DETECT from video! Light = white/cream bg, Dark = black/gray bg",
    "colors": {
      "background": "EXTRACT from video - #ffffff for light, #0a0a0a for dark",
      "surface": "EXTRACT from video - card/panel background color",
      "primary": "EXTRACT from video - main accent color",
      "secondary": "EXTRACT from video - secondary accent",
      "text": "EXTRACT from video - main text color",
      "textMuted": "EXTRACT from video - secondary text color",
      "border": "EXTRACT from video - border color",
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

Analyze the video and extract EVERYTHING:`;

// ============================================================================
// ASSEMBLER PROMPT - Generate AWWWARDS-QUALITY code from SCAN DATA
// ============================================================================

const ASSEMBLER_PROMPT = `You are a SENIOR FRONTEND ENGINEER at an AWWWARDS-winning design agency.
Your job is to create STUNNING, ANIMATED, PRODUCTION-QUALITY web interfaces.

═══════════════════════════════════════════════════════════════════════════════
🎨 CRITICAL: THEME DETECTION - USE VIDEO COLORS!
═══════════════════════════════════════════════════════════════════════════════

CHECK scanData.ui.theme FIRST:
- If "light" → <body class="bg-white text-gray-900"> or bg-gray-50
- If "dark" → <body class="bg-[#0a0a0a] text-white"> or bg-zinc-900

USE scanData.ui.colors for EXACT colors from video:
- background → body and main container backgrounds
- surface → card backgrounds  
- text → main text color
- textMuted → secondary text
- primary → buttons, links, accents
- border → borders, dividers

DO NOT ASSUME DARK THEME! Match what's in the video!

═══════════════════════════════════════════════════════════════════════════════
🟢 CONTENT FIDELITY 1:1 — MANDATORY (NO SHORTCUTS!)
═══════════════════════════════════════════════════════════════════════════════
Output MUST contain every text from scanData VERBATIM. No paraphrasing, no shortening, no omitting.
- Every nav label, headline, subheadline, paragraph, button text → copy from scanData exactly.
- Every section from scanData.pages.detected[].sections MUST be rendered with its full content.
- If scanData has 7 menu items → output all 7. If a page has 6 sections → render all 6.
- Do NOT replace real text with "Title", "Description", "Lorem" or summaries.
Content 1:1 is non-negotiable. Every string from the scan must appear in the output as-is.

═══════════════════════════════════════════════════════════════════════════════
🚨 CRITICAL: WHAT MAKES A PAGE IMPRESSIVE (NOT GENERIC!)
═══════════════════════════════════════════════════════════════════════════════

The difference between "generic Bootstrap" and "AWWWARDS nominee" is:

1. ANIMATIONS ON EVERYTHING - GSAP scroll animations on EVERY section
2. DEPTH & LAYERS - gradients, glassmorphism, shadows with color
3. MICRO-INTERACTIONS - every hover, every click has feedback
4. REAL IMAGES - Picsum photos, not placeholders
5. TYPOGRAPHY HIERARCHY - bold choices, gradient text, varied weights

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
🚫 DO NOT INVENT APP NAMES
═══════════════════════════════════════════════════════════════════════════════

BANNED: StripeClone, PayDash, NexusPay, AppName, MyApp, Demo, Acme
USE: scanData.ui.navigation.sidebar.logo.text or "Dashboard"

═══════════════════════════════════════════════════════════════════════════════
🖼️ IMAGES - PICSUM + DICEBEAR (NO RATE LIMITS!)
═══════════════════════════════════════════════════════════════════════════════

FOR PHOTOS: https://picsum.photos/seed/{unique-name}/{width}/{height}
FOR AVATARS: https://i.pravatar.cc/150?img=X  or  https://api.dicebear.com/7.x/avataaars/svg?seed=Name

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
🎬 GSAP ANIMATIONS - MANDATORY ON EVERY SECTION!
═══════════════════════════════════════════════════════════════════════════════

REQUIRED in <head>:
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>

REQUIRED before </body> - USE DIVERSE ANIMATIONS:
<script>
gsap.registerPlugin(ScrollTrigger);

// FADE UP (hero)
gsap.from('.fade-up', { scrollTrigger: { trigger: '.fade-up', start: 'top 80%' }, opacity: 0, y: 80, duration: 1, ease: 'power3.out' });

// SLIDE LEFT (about)
gsap.from('.slide-left', { scrollTrigger: { trigger: '.slide-left', start: 'top 80%' }, opacity: 0, x: -100, duration: 1, ease: 'power2.out' });

// SLIDE RIGHT (features)
gsap.from('.slide-right', { scrollTrigger: { trigger: '.slide-right', start: 'top 80%' }, opacity: 0, x: 100, duration: 1, ease: 'power2.out' });

// SCALE UP (cards)
gsap.from('.scale-up', { scrollTrigger: { trigger: '.scale-up', start: 'top 85%' }, opacity: 0, scale: 0.8, duration: 0.8, ease: 'back.out(1.7)' });

// STAGGER CARDS (grids)
gsap.from('.stagger-cards > *', { scrollTrigger: { trigger: '.stagger-cards', start: 'top 80%' }, opacity: 0, y: 60, scale: 0.9, stagger: 0.1, duration: 0.6, ease: 'power2.out' });

// ROTATE IN (portfolio)
gsap.from('.rotate-in', { scrollTrigger: { trigger: '.rotate-in', start: 'top 85%' }, opacity: 0, rotation: -10, y: 40, duration: 0.9, ease: 'power2.out' });

// BLUR FADE (text)
gsap.from('.blur-fade', { scrollTrigger: { trigger: '.blur-fade', start: 'top 85%' }, opacity: 0, filter: 'blur(20px)', duration: 1, ease: 'power2.out' });

// COUNTER ANIMATION (stats)
document.querySelectorAll('.counter').forEach(el => {
  const target = parseInt(el.textContent) || 100;
  el.textContent = '0';
  ScrollTrigger.create({ trigger: el, start: 'top 85%', onEnter: () => {
    gsap.to(el, { textContent: target, duration: 2, ease: 'power1.out', snap: { textContent: 1 } });
  }});
});
</script>

ASSIGN DIFFERENT CLASSES TO EACH SECTION:
- Hero: class="fade-up"
- About: class="slide-left"  
- Features: class="slide-right"
- Cards grid: class="stagger-cards"
- Stats: class="counter"
- Portfolio: class="rotate-in"
- Text blocks: class="blur-fade"

═══════════════════════════════════════════════════════════════════════════════
✨ CSS HOVER EFFECTS - MANDATORY!
═══════════════════════════════════════════════════════════════════════════════

Add to <style>:
.hover-lift { transition: all 0.3s ease; }
.hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }

.hover-glow { transition: all 0.3s ease; }
.hover-glow:hover { box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }

.btn-primary { transition: all 0.3s ease; }
.btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4); }

.card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.card:hover { transform: translateY(-4px) scale(1.01); }

/* USE APPROPRIATE GLASSMORPHISM BASED ON THEME! */
.glassmorphism { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
.glassmorphism-light { background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 30px rgba(0,0,0,0.08); }

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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .hover-lift { transition: all 0.3s ease; }
        .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
        .hover-glow { transition: all 0.3s ease; }
        .hover-glow:hover { box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
        .btn-primary { transition: all 0.3s ease; }
        .btn-primary:hover { transform: translateY(-2px) scale(1.02); }
        .card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .card:hover { transform: translateY(-4px) scale(1.01); }
        /* Dark theme glassmorphism */
        .glassmorphism { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        /* Light theme glassmorphism - use this for light backgrounds! */
        .glassmorphism-light { background: rgba(255,255,255,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 30px rgba(0,0,0,0.08); }
    </style>
</head>
<!-- 🚨 CRITICAL: SET body class based on scanData.ui.theme! -->
<!-- If theme="light" → class="antialiased bg-white text-gray-900" -->
<!-- If theme="dark" → class="antialiased bg-[#0a0a0a] text-white" -->
<body class="antialiased">
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
✅ CHECKLIST - Your code MUST have:
═══════════════════════════════════════════════════════════════════════════════

📄 MULTI-PAGE (if scanData.pages.hasMultiplePages):
☑ ALL pages from scanData.pages.detected are built
☑ Navigation only shows links for pages you ACTUALLY created
☑ NO nav link without page content (causes black screen!)
☑ Use React state: const [currentPage, setCurrentPage] = useState('home')
☑ Render pages conditionally: {currentPage === 'about' && <AboutPage />}

🚫 NO EMPTY SECTIONS:
☑ EVERY section has real content (headlines, text, images)
☑ NO "TODO" or placeholder comments
☑ NO empty div wrappers

🎬 ANIMATIONS:
☑ GSAP + ScrollTrigger scripts in <head>
☑ GSAP animations initialized in useEffect
☑ DIFFERENT animation class on each section (fade-up, slide-left, stagger-cards)
☑ Hover effects on ALL buttons and cards

🖼️ IMAGES:
☑ Picsum: https://picsum.photos/seed/NAME/W/H
☑ Avatars: https://i.pravatar.cc/150?img=XX

🎨 STYLE:
☑ Glassmorphism on cards/panels
☑ Gradient text on headings  
☑ Colored shadows (not gray)
☑ USE THE THEME FROM scanData.ui.theme (light or dark)!
☑ If theme is "light" → white/cream backgrounds, dark text
☑ If theme is "dark" → dark backgrounds, light text
☑ MATCH the colors extracted from video in scanData.ui.colors!

Generate complete HTML:`;

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

function fixBrokenImageUrls(code: string): string {
  if (!code) return code;
  
  const validPicsumIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60];
  let imageCounter = 0;
  
  const getNextPicsumUrl = (width = 800, height = 600) => {
    const id = validPicsumIds[imageCounter % validPicsumIds.length];
    imageCounter++;
    return `https://picsum.photos/id/${id}/${width}/${height}`;
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
  const { videoUrl, styleDirective, databaseContext, styleReferenceImage } = options;
  
  console.log("[transmute] MULTI-PASS PIPELINE v2.1 - Starting...");
  console.log("[transmute] Video URL:", videoUrl?.substring(0, 100));
  
  const apiKey = getApiKey();
  if (!apiKey) {
    return { success: false, error: "API key not configured" };
  }
  
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
    // PHASE 1: UNIFIED SCAN - Extract everything from video
    // Always use Pro model, 200s timeout for large videos up to 20MB
    // ════════════════════════════════════════════════════════════════
    console.log("[transmute] Phase 1: Starting unified scan with Pro model...");
    
    // 90s timeout for Phase 1 - video scan should be fast with flash models
    const phase1Timeout = 90000;
    console.log("[transmute] Phase 1 timeout:", phase1Timeout / 1000, "s");
    
    let scanResult;
    let usedModel = "gemini-3-pro-preview";
    
    // Use Gemini 3 Pro for best video understanding
    const phase1Models = ["gemini-3-pro-preview"];
    let phase1Error: any;
    
    for (const modelName of phase1Models) {
      try {
        console.log(`[transmute] Phase 1 trying model: ${modelName}`);
        const scannerModel = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 16384,
          },
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
        console.error(`[transmute] Phase 1 ${modelName} failed:`, error?.message);
        const isRetryable = error?.message?.includes('503') || 
                           error?.message?.includes('overloaded') || 
                           error?.message?.includes('timed out');
        if (!isRetryable) {
          throw error;
        }
      }
    }
    
    if (!scanResult) {
      throw phase1Error || new Error("All models failed for Phase 1");
    }
    
    console.log("[transmute] Phase 1 used model:", usedModel);
    
    const scanText = scanResult.response.text();
    console.log("[transmute] Phase 1 complete. Scan length:", scanText.length);
    
    // Parse scan data
    let scanData: any = null;
    try {
      const jsonMatch = scanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        scanData = JSON.parse(jsonMatch[0]);
        console.log("[transmute] Scan data parsed. Menu items:", scanData?.ui?.navigation?.sidebar?.items?.length || 0);
      }
    } catch (e) {
      console.error("[transmute] Failed to parse scan JSON:", e);
    }
    
    if (!scanData) {
      return { success: false, error: "Failed to extract structured data from video" };
    }
    
    // ════════════════════════════════════════════════════════════════
    // PHASE 2: ASSEMBLER - Generate code from SCAN DATA ONLY
    // ════════════════════════════════════════════════════════════════
    console.log("[transmute] Phase 2: Starting code assembly (NO VIDEO)...");
    
    // Build assembler prompt
    let assemblerPrompt = ASSEMBLER_PROMPT;
    
    if (styleDirective) {
      assemblerPrompt += `\n\n**STYLE DIRECTIVE:**\n${styleDirective}`;
    }
    
    if (databaseContext) {
      assemblerPrompt += `\n\n**DATABASE CONTEXT:**\n${databaseContext}`;
    }
    
    const menuCount = scanData?.ui?.navigation?.sidebar?.items?.length || 0;
    const metricCount = scanData?.data?.metrics?.length || 0;
    const chartCount = scanData?.data?.charts?.length || 0;
    const tableCount = scanData?.data?.tables?.length || 0;
    
    assemblerPrompt += `\n\n**═══════════════════════════════════════════════════════════════**
**SCAN DATA (Source of Truth - USE THIS DATA ONLY):**
**═══════════════════════════════════════════════════════════════**

\`\`\`json
${JSON.stringify(scanData, null, 2)}
\`\`\`

**ASSEMBLY INSTRUCTIONS:**
1. Build sidebar with EXACTLY ${menuCount} menu items — use scanData labels verbatim.
2. Create ${metricCount} metric cards with EXACT values from scanData.
3. Create ${chartCount} charts using ChartComponent (Chart.js).
4. Create ${tableCount} tables with all rows — no dropping rows.
5. Use colors from scanData.ui.colors.
6. CONTENT 1:1: Every headline, paragraph, nav label, button text, FAQ item, footer line from scanData MUST appear in the output VERBATIM. Do not skip any section, do not shorten any text.

Generate the complete HTML file now:`;
    
    // Calculate remaining time for Phase 2 (leave buffer for Vercel 300s limit)
    const elapsedMs = Date.now() - startTime;
    const phase2Timeout = Math.max(150000, 280000 - elapsedMs); // At least 150s, up to remaining time
    console.log("[transmute] Phase 2 timeout:", Math.round(phase2Timeout / 1000), "s");
    
    let assemblyResult;
    let assemblerUsedModel = "gemini-3-pro-preview"; // Use Gemini 3 Pro for code generation
    
    // Helper: Try model with retry
    const tryModel = async (modelName: string, timeout: number): Promise<any> => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 100000, // Full output for complex projects
        },
      });
      return withTimeout(
        model.generateContent([{ text: assemblerPrompt }]),
        timeout,
        `Phase 2 Code Assembly (${modelName})`
      );
    };
    
    // Use Gemini 3 Pro for code generation
    const modelsToTry = ["gemini-3-pro-preview"];
    let lastError: any;
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`[transmute] Phase 2 trying model: ${modelName}`);
        assemblyResult = await tryModel(modelName, phase2Timeout);
        assemblerUsedModel = modelName;
        break;
      } catch (error: any) {
        lastError = error;
        console.error(`[transmute] Phase 2 ${modelName} failed:`, error?.message);
        // If it's a timeout or overload, try next model
        const isRetryable = error?.message?.includes('503') || 
                           error?.message?.includes('overloaded') || 
                           error?.message?.includes('timed out');
        if (!isRetryable) {
          throw error; // Non-retryable error
        }
      }
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
    
    // Get token usage
    const usageMetadata = assemblyResult.response.usageMetadata;
    const tokenUsage = usageMetadata ? {
      promptTokens: usageMetadata.promptTokenCount || 0,
      candidatesTokens: usageMetadata.candidatesTokenCount || 0,
      totalTokens: usageMetadata.totalTokenCount || 0,
    } : undefined;
    
    console.log("[transmute] Success! Code length:", code.length);
    
    return {
      success: true,
      code,
      scanData,
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
