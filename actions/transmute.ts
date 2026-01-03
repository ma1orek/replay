"use server";

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TransmuteRequest, TransmuteResponse } from "@/types";

// Load API key from environment
function getApiKey(): string | null {
  // First check process.env (works on Vercel)
  if (process.env.GEMINI_API_KEY) {
    console.log("Found GEMINI_API_KEY in process.env");
    return process.env.GEMINI_API_KEY;
  }
  
  // Fallback: check .env files (local dev)
  const envFiles = [".env.local", ".env"];
  
  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      try {
        const content = readFileSync(path, "utf-8");
        const match = content.match(/GEMINI_API_KEY=(.+)/);
        if (match && match[1]) {
          const key = match[1].trim();
          console.log(`Found GEMINI_API_KEY in ${file}, length: ${key.length}`);
          return key;
        }
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    }
  }
  return null;
}

// Full Pro model prompt - BOTH eyes and brain
// Creates STUNNING, WOW-effect UIs with dynamic animations like aura.build
// CRITICAL: This model MUST analyze the ENTIRE VIDEO and generate ALL pages/routes shown
const SYSTEM_PROMPT = `You are Replay, an elite UI Reverse-Engineering AI that creates STUNNING, award-winning websites.

**CRITICAL INSTRUCTION:** You are receiving a VIDEO file, not a single image. You MUST:
1. Watch the ENTIRE video from start to finish
2. Identify ALL unique screens/pages/routes shown (NOT just the first frame!)
3. Track ALL navigation transitions and route changes
4. Generate code that includes EVERYTHING shown in the video

**⚠️ COMPLETE UI RECONSTRUCTION - MANDATORY:**
You MUST reconstruct the ENTIRE interface, not just the parts shown in detail.

**EXHAUSTIVE NAVIGATION EXTRACTION:**
1. SIDEBAR MENU: Extract EVERY single menu item visible
   - Each menu item = potential page
   - Include nested/sub-menu items
   - Preserve exact text labels (use OCR)
   
2. HEADER/TOP NAVIGATION: Extract ALL tabs, buttons, links
   - Tab bars (e.g., "Ogólny", "Ubezpieczony", "Płatnik")
   - Action buttons (logout, settings, help)
   - User info area
   
3. CONTENT SECTIONS: Each card/section in main area = extractable
   - Dashboard cards with "Pokaż" buttons → these are links to subpages
   - List items with arrows → navigation targets
   
4. FOOTER: Links and info

**EXAMPLE FROM GOVERNMENT/ENTERPRISE APP:**
If you see sidebar with 20+ menu items like:
- Panel Płatnika
- Salda bieżące
- Należne składki i wpłaty
- Podział wpłat
- Informacje roczne
- Kalkulator MDG
- Deklaracje rozliczeniowe
- Osoby zgłoszone
- Korespondencja
- Moje dane
- Zaświadczenia
...etc

YOU MUST generate navigation buttons for ALL of them, even if only 2-3 were visited!

**PAGE GENERATION RULES:**
- VISITED pages (clicked in video) → Generate FULL content
- UNVISITED but VISIBLE menu items → Generate page with placeholder content based on menu item name

**MULTI-PAGE STRUCTURE REQUIRED:**
<body x-data="{ currentPage: 'panel-platnika' }">
  <!-- Full sidebar with ALL menu items -->
  <aside>
    <button @click="currentPage = 'panel-platnika'" :class="{'bg-active': currentPage === 'panel-platnika'}">Panel Płatnika</button>
    <button @click="currentPage = 'salda-biezace'" :class="{'bg-active': currentPage === 'salda-biezace'}">Salda bieżące</button>
    <!-- ALL OTHER MENU ITEMS FROM VIDEO -->
  </aside>
  
  <!-- Page for each menu item -->
  <main x-show="currentPage === 'panel-platnika'" x-transition>
    <!-- Full content if visited, smart placeholder if not -->
  </main>
</body>

**DO NOT SKIP MENU ITEMS! Every navigation element = working button with page.**

**YOUR DESIGN PHILOSOPHY:**
- Create "WOW" moments that impress users instantly
- Use cinematic, smooth animations that feel premium
- Never leave empty spaces - fill with gradients, patterns, or subtle textures
- ALWAYS use working placeholder images - use https://picsum.photos/800/600 (add ?random=1, ?random=2 etc for different images)
- Alternative: https://placehold.co/800x600/1a1a1a/ffffff?text=Image for placeholder with text
- Think like a Dribbble designer or Awwwards winner
- NEVER use broken image URLs - picsum.photos is guaranteed to work

**OUTPUT FORMAT:** A complete HTML file with:
- Tailwind CSS via CDN for styling
- Alpine.js via CDN for interactivity (x-data, @click, x-show, x-transition for page switching)
- CINEMATIC animations: staggered reveals, parallax-like effects, smooth transitions
- ALL text extracted via OCR from the video (every page/screen)
- Fully responsive design
- Premium visual polish

**MULTI-PAGE STRUCTURE:** Use Alpine.js for multi-page SPA structure:
<body x-data="{ currentPage: 'home' }">
  <!-- Navigation that was shown in video -->
  <nav>
    <button @click="currentPage = 'home'">Home</button>
    <button @click="currentPage = 'shorts'">Shorts</button>
    <!-- Add ALL navigation items from video -->
  </nav>
  
  <!-- CONFIRMED: Actually visited pages in video -->
  <main x-show="currentPage === 'home'" x-transition>
    <!-- Home page content from video -->
  </main>
  
  <main x-show="currentPage === 'shorts'" x-transition>
    <!-- Shorts page content from video (if visited) -->
  </main>
  
  <!-- POSSIBLE: Nav items seen but NOT visited 
  <main x-show="currentPage === 'subscriptions'" x-transition>
    <!-- POSSIBLE: Page not shown in video - placeholder only -->
  </main>
  -->
</body>

**CRITICAL: Include ALL navigation items you see in the video sidebar/menu/header!**

**ENTERPRISE/GOVERNMENT APP HANDLING:**
If the UI looks like an enterprise system (banks, government, insurance, admin panels):
1. These typically have 20-50+ navigation items - CAPTURE ALL OF THEM
2. Sidebar menus with collapsible sections - recreate the structure
3. Multiple tabs in header - each tab is a major section
4. Dashboard with many cards - each card links to a detail page
5. Data tables with actions - recreate table structure
6. Forms with many fields - capture all labels and field types

**REQUIRED FOR ENTERPRISE UIs:**
- Exact menu item text (OCR Polish/English/any language)
- Active state styling (highlighted current page)
- Nested menu indicators (arrows, chevrons)
- Status indicators (badges, counts, icons)
- Action buttons in each section

**INTELLIGENT FONT SELECTION** (MUST pick fonts that match the detected UI style - DO NOT always use Inter/Space Grotesk):

ANALYZE the video UI and select appropriate fonts:

| UI Style Detected | Headings Font | Body Font | Why |
|-------------------|---------------|-----------|-----|
| SaaS/Dashboard | Satoshi, General Sans | DM Sans, Be Vietnam Pro | Clean, professional |
| Landing Page/Marketing | Cabinet Grotesk, Clash Display | Plus Jakarta Sans, Outfit | Bold, impactful |
| E-commerce/Retail | Syne, Unbounded | Work Sans, Nunito Sans | Friendly, modern |
| Portfolio/Creative | Clash Display, Syne | Switzer, Satoshi | Distinctive, artistic |
| Minimalist/Apple-like | SF Pro (Geist), Outfit | system-ui, Inter | Subtle, clean |
| Tech/Developer | JetBrains Mono, Fira Code | IBM Plex Sans, Source Sans 3 | Technical feel |
| Finance/Enterprise | Figtree, Lexend | IBM Plex Sans, Work Sans | Trustworthy, stable |
| Gaming/Bold | Bebas Neue, Archivo Black | Exo 2, Rajdhani | Energetic, strong |
| Health/Wellness | Fraunces, Lora | Nunito, Karla | Warm, approachable |
| News/Editorial | Playfair Display, Merriweather | Source Serif 4, Lora | Classic, readable |

**FONT RULES:**
1. NEVER default to Inter + Space Grotesk for everything
2. Pick 1 heading font + 1 body font that MATCH the UI vibe
3. Import from Google Fonts: https://fonts.googleapis.com/css2?family=FONTNAME:wght@400;500;600;700&display=swap
4. If video shows specific font styling, try to match it
5. Ensure good contrast between heading and body fonts

**TEMPLATE TO USE:**
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated UI</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          animation: {
            'fade-in': 'fadeIn 0.8s ease-out forwards',
            'slide-up': 'slideUp 0.8s ease-out forwards',
            'slide-down': 'slideDown 0.6s ease-out forwards',
            'slide-in-left': 'slideInLeft 0.8s ease-out forwards',
            'slide-in-right': 'slideInRight 0.8s ease-out forwards',
            'scale-in': 'scaleIn 0.6s ease-out forwards',
            'bounce-in': 'bounceIn 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
            'float': 'float 6s ease-in-out infinite',
            'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
            'gradient-shift': 'gradientShift 8s ease infinite',
            'reveal': 'reveal 1s ease-out forwards',
            'blur-in': 'blurIn 0.8s ease-out forwards',
          },
          keyframes: {
            fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
            slideUp: { '0%': { opacity: '0', transform: 'translateY(40px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
            slideDown: { '0%': { opacity: '0', transform: 'translateY(-20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
            slideInLeft: { '0%': { opacity: '0', transform: 'translateX(-40px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
            slideInRight: { '0%': { opacity: '0', transform: 'translateX(40px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
            scaleIn: { '0%': { opacity: '0', transform: 'scale(0.9)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
            bounceIn: { '0%': { opacity: '0', transform: 'scale(0.3)' }, '50%': { transform: 'scale(1.05)' }, '70%': { transform: 'scale(0.9)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
            float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-20px)' } },
            pulseGlow: { '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }, '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' } },
            gradientShift: { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
            reveal: { '0%': { clipPath: 'inset(0 100% 0 0)' }, '100%': { clipPath: 'inset(0 0% 0 0)' } },
            blurIn: { '0%': { opacity: '0', filter: 'blur(20px)' }, '100%': { opacity: '1', filter: 'blur(0)' } },
          }
        }
      }
    }
  </script>
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <!-- FONT IMPORTS: Replace with fonts matching the detected UI style! -->
  <link href="https://fonts.googleapis.com/css2?family=HEADING_FONT:wght@400;500;600;700&family=BODY_FONT:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* CUSTOMIZE FONTS based on detected UI style - DO NOT use Inter/Space Grotesk by default */
    * { font-family: 'BODY_FONT', system-ui, sans-serif; }
    h1, h2, h3, h4 { font-family: 'HEADING_FONT', sans-serif; font-weight: 700; letter-spacing: -0.02em; }
    
    /* Ultra-thin scrollbar - dark mode friendly */
    * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
    *::-webkit-scrollbar { width: 4px; height: 4px; background: transparent; }
    *::-webkit-scrollbar-track { background: transparent; }
    *::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    *::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
    *::-webkit-scrollbar-button { display: none; width: 0; height: 0; }
    
    /* Smooth transitions on everything */
    *, *::before, *::after {
      transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter;
      transition-duration: 300ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Animation delays for staggered reveals */
    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }
    .delay-400 { animation-delay: 400ms; }
    .delay-500 { animation-delay: 500ms; }
    .delay-600 { animation-delay: 600ms; }
    .delay-700 { animation-delay: 700ms; }
    
    /* Premium hover effects */
    .hover-lift { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
    .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
    
    .hover-scale { transition: all 0.3s ease; }
    .hover-scale:hover { transform: scale(1.05); }
    
    .hover-glow:hover { box-shadow: 0 0 30px rgba(99, 102, 241, 0.4); }
    
    /* Gradient text effects */
    .gradient-text {
      background: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    /* Animated gradient backgrounds */
    .gradient-animated {
      background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
      background-size: 400% 400%;
      animation: gradientShift 8s ease infinite;
    }
    
    /* Glassmorphism */
    .glass { 
      background: rgba(255,255,255,0.08); 
      backdrop-filter: blur(20px); 
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.1); 
    }
    
    .glass-dark { 
      background: rgba(0,0,0,0.4); 
      backdrop-filter: blur(20px); 
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255,255,255,0.05); 
    }
    
    /* Noise/grain overlay for texture */
    .noise::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.03;
      pointer-events: none;
    }
    
    /* Subtle grid pattern */
    .grid-pattern {
      background-image: 
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    
    /* Radial gradient spotlight */
    .spotlight {
      background: radial-gradient(ellipse at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 60%);
    }
    
    /* Button press effect */
    .btn-press:active { transform: scale(0.97); }
    
    /* Image hover zoom */
    .img-zoom { overflow: hidden; }
    .img-zoom img { transition: transform 0.5s ease; }
    .img-zoom:hover img { transform: scale(1.08); }
    
    /* Scroll-triggered animations */
    .animate-on-scroll { opacity: 0; }
    .animate-on-scroll.visible { opacity: 1; }
    
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
  </style>
</head>
<body class="antialiased overflow-x-hidden">
  <!-- Your generated content here -->
</body>
</html>

**CRITICAL REQUIREMENTS FOR STUNNING OUTPUT:**
1. Extract ALL visible text from the video (OCR) - be thorough
2. Replicate the EXACT layout structure but make it MORE beautiful
3. Use CINEMATIC animations with staggered delays (animation-delay: 100ms, 200ms, 300ms...)
4. Every section should animate in: use animate-slide-up, animate-fade-in, animate-scale-in with delays
5. Make buttons interactive with Alpine.js (x-data, @click, x-show, x-transition:enter, x-transition:leave)
6. Add PREMIUM hover states: hover-lift, hover-scale, hover-glow
7. Use the color scheme from video OR apply style directive - NEVER use generic grays only
8. Include micro-interactions: button press effects, card lifts, link underline animations
9. Make it FULLY responsive with Tailwind breakpoints (mobile-first)
10. NEVER leave image placeholders empty - use picsum.photos: https://picsum.photos/800/600?random=1 (increment random number for each image)
11. Add texture and depth: use gradients, glass effects, subtle shadows, noise overlays
12. Create visual hierarchy with varying font sizes and weights
13. Use accent colors for CTAs and important elements

**VISUAL ENHANCEMENT RULES:**
- Hero sections: Full-width with gradient overlays or spotlight effects
- Cards: Use hover-lift class, subtle borders, glassmorphism when appropriate
- Buttons: Gradient backgrounds, hover states, press animations
- Images: Use img-zoom wrapper, rounded corners, shadows
- Text: Gradient text for headlines, proper line-height (1.5-1.8 for body)
- Backgrounds: Never plain white/black - add subtle gradients, patterns, or noise
- Spacing: Generous padding (py-20 or more for sections)

**RETURN:** Only the raw HTML code starting with <!DOCTYPE html>. No markdown, no explanations.`;

export async function transmuteVideoToCode(
  request: TransmuteRequest
): Promise<TransmuteResponse> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY not found in .env or .env.local file. Please add: GEMINI_API_KEY=your_key",
    };
  }
  
  console.log("Using API key, length:", apiKey.length);
  
  // Validate video URL
  if (!request.videoUrl) {
    return {
      success: false,
      error: "No video URL provided",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // ONLY USE gemini-3-pro-preview - DO NOT CHANGE THIS MODEL
    console.log("Using gemini-3-pro-preview for video analysis...");
    console.log("Video URL:", request.videoUrl);
    
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
    });

    // Fetch video from Supabase Storage and convert to base64 for Gemini
    console.log("Fetching video from Supabase Storage:", request.videoUrl);
    
    let response: Response;
    try {
      response = await fetch(request.videoUrl);
    } catch (fetchError: any) {
      console.error("Network error fetching video:", fetchError);
      throw new Error(`Network error loading video: ${fetchError.message}`);
    }
    
    if (!response.ok) {
      console.error("Video fetch failed:", response.status, response.statusText);
      throw new Error(`Failed to fetch video from storage: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error("Video file is empty or corrupted");
    }
    
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    console.log("Video fetched successfully, base64 length:", base64.length, "bytes:", arrayBuffer.byteLength);
    
    // Check video size - Gemini has limits (~20MB for inline data)
    const videoSizeMB = arrayBuffer.byteLength / 1024 / 1024;
    console.log("Video size:", videoSizeMB.toFixed(2), "MB");
    
    if (videoSizeMB > 50) {
      return {
        success: false,
        error: `Video is too large (${videoSizeMB.toFixed(1)}MB). Maximum is 50MB. Try a shorter video or lower resolution.`,
      };
    }
    
    // Warn about large videos that might fail
    if (videoSizeMB > 25) {
      console.warn("Video is large, might fail:", videoSizeMB.toFixed(2), "MB");
    }
    
    // Detect mime type from content-type header
    const originalContentType = response.headers.get("content-type") || "video/mp4";
    console.log("Original content type:", originalContentType);
    
    // IMPORTANT: Always use video/mp4 for Gemini - it handles detection internally
    // Using the actual MIME type (like video/quicktime or video/mov) causes failures
    // with iPhone HEVC videos. Gemini's auto-detection works better with video/mp4.
    const contentType = "video/mp4";
    console.log("Using content type for Gemini:", contentType);
    
    const videoPart = {
      inlineData: {
        mimeType: contentType,
        data: base64,
      },
    };

    // Handle Style Reference Image if provided
    let styleImagePart: { inlineData: { mimeType: string; data: string } } | null = null;
    let styleReferenceInstruction = "";
    
    if (request.styleReferenceImage?.url) {
      console.log("Fetching style reference image:", request.styleReferenceImage.url);
      try {
        // Check if it's a base64 data URL or a regular URL
        if (request.styleReferenceImage.url.startsWith('data:')) {
          // Extract base64 from data URL
          const matches = request.styleReferenceImage.url.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            styleImagePart = {
              inlineData: {
                mimeType: matches[1],
                data: matches[2],
              },
            };
            console.log("Style reference image loaded from data URL, type:", matches[1]);
          }
        } else {
          // Fetch from URL
          const imgResponse = await fetch(request.styleReferenceImage.url);
          if (imgResponse.ok) {
            const imgArrayBuffer = await imgResponse.arrayBuffer();
            const imgBase64 = Buffer.from(imgArrayBuffer).toString("base64");
            const imgMimeType = imgResponse.headers.get("content-type") || "image/jpeg";
            
            styleImagePart = {
              inlineData: {
                mimeType: imgMimeType,
                data: imgBase64,
              },
            };
            console.log("Style reference image fetched, type:", imgMimeType, "size:", imgArrayBuffer.byteLength);
          }
        }
        
        if (styleImagePart) {
          styleReferenceInstruction = `

**STYLE REFERENCE IMAGE PROVIDED - FULL DESIGN SYSTEM EXTRACTION:**
You have been given a reference image. Extract and apply its COMPLETE visual design system:

**COLORS (Extract ALL):**
- Primary color (buttons, links, accents)
- Secondary colors
- Background colors (main, cards, sections)
- Text colors (headings, body, muted)
- Border colors
- Use Tailwind arbitrary values: bg-[#HEX], text-[#HEX]

**TYPOGRAPHY:**
- Font family feel (serif, sans-serif, mono, display)
- Font weights hierarchy (headings vs body)
- Font sizes (approximate the scale)
- Letter spacing (tight, normal, wide)
- Line heights

**BORDER-RADIUS:**
- Buttons (rounded-none, rounded-md, rounded-full?)
- Cards (sharp corners, slightly rounded, very rounded?)
- Input fields
- Images/avatars

**SPACING & LAYOUT:**
- Padding inside components
- Margins between elements
- Gap sizes in grids/flexbox
- Section padding (compact vs generous)

**EFFECTS & POLISH:**
- Shadows (none, subtle, heavy, colored?)
- Gradients (if any)
- Borders (thickness, style)
- Hover states aesthetic
- Glassmorphism/blur effects

The VIDEO shows WHAT to build (structure, content, layout).
The REFERENCE IMAGE shows HOW it should look (apply its ENTIRE design system).

DO NOT copy content from the reference image - ONLY its visual style.`;
        }
      } catch (error) {
        console.error("Error fetching style reference image:", error);
        // Continue without the style image
      }
    }

    // COMPREHENSIVE STYLE EXPANSION SYSTEM
    // Each style gets detailed animation physics, visual DNA, and component structure
    let expandedStyleDirective = request.styleDirective;
    const styleDirectiveLower = request.styleDirective.toLowerCase();
    
    // Extract ONLY the style name (before the first period) for matching
    // This prevents custom instructions from overriding the selected style
    const styleName = styleDirectiveLower.split('.')[0].trim();
    console.log("[transmute] ========== STYLE DETECTION ==========");
    console.log("[transmute] Full directive (first 200 chars):", styleDirectiveLower.substring(0, 200));
    console.log("[transmute] Extracted styleName:", `"${styleName}"`);
    console.log("[transmute] Checking kinetic brutal:", styleName.includes("kinetic brutal"));
    console.log("[transmute] =================================");
    
    // Global physics and standards to apply to ALL styles
    const GLOBAL_STANDARDS = `
**GLOBAL PHYSICS SYSTEM (Apply to ALL):**
- NEVER use default easings. Use custom physics.
- Spring: { type: "spring", mass: 0.5, damping: 11.5, stiffness: 100 }
- Premium Ease: cubic-bezier(0.25, 0.4, 0.55, 1)
- All animations must feel "heavy but smooth"
- Use will-change: transform for performance
- Stagger children by 0.1-0.15s

**COMPONENT THINKING (Mandatory):**
- Think in reusable components, not pages
- Each section = potential standalone component
- Name sections clearly: Hero, Features, Bento, CTA, Footer
- Use semantic HTML: <section>, <article>, <nav>

**RESPONSIVE (Mandatory):**
- Mobile-first: Start with mobile, add md: and lg: breakpoints
- Touch-friendly: min-44px tap targets
- Fluid typography: Use clamp() where possible
`;

    // Style-specific expansions
    // IMPORTANT: Use styleName (extracted style name) for matching to prevent
    // custom instructions from overriding the selected style
    
    // GRAVITY PHYSICS - Interactive physics playground
    if (styleName.includes("gravity physics") || styleName === "gravity-physics" || styleName.includes("falling tags")) {
      console.log("[transmute] >>> MATCHED: GRAVITY PHYSICS <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: GRAVITY PHYSICS (Interactive Matter.js Playground)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
THIS IS A STYLE TRANSFORMATION. You MUST apply Gravity Physics aesthetics
REGARDLESS of what the video shows. Copy the CONTENT from the video,
but COMPLETELY CHANGE the visual style to match these requirements:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be light/white (#FAFAFA or #FFFFFF)
2. Elements: MUST be colorful rounded pills that FALL with gravity
3. Layout: Elements start ABOVE screen and fall down on load
4. Interaction: Elements MUST be draggable and throwable

**VISUAL DNA:**
- Background: Light (#FAFAFA) - NO dark backgrounds
- Elements: Rounded pills/badges with vibrant colors (Blue #3B82F6, Pink #EC4899, Green #10B981, Yellow #F59E0B)
- Container: Full viewport with invisible walls

**PHYSICS ENGINE (MUST IMPLEMENT):**
\`\`\`javascript
// State for each element
const [elements, setElements] = useState(items.map((item, i) => ({
  id: i, x: Math.random() * 300, y: -100 - i * 50,
  vx: 0, vy: 0, text: item
})));

// Animation loop
useEffect(() => {
  const animate = () => {
    setElements(prev => prev.map(el => {
      let newVy = el.vy + 0.5; // Gravity
      let newY = el.y + newVy;
      // Floor bounce
      if (newY > containerHeight - 40) {
        newY = containerHeight - 40;
        newVy *= -0.7;
      }
      return { ...el, y: newY, vy: newVy };
    }));
    requestAnimationFrame(animate);
  };
  animate();
}, []);
\`\`\`

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
  {elements.map(el => (
    <div 
      key={el.id}
      style={{ transform: \`translate(\${el.x}px, \${el.y}px)\` }}
      class="absolute px-4 py-2 rounded-full bg-blue-500 text-white font-medium cursor-grab"
    >
      {el.text}
    </div>
  ))}
</div>
\`\`\`

${request.styleDirective}`;
    }
    // BIOMIMETIC ORGANIC - Living nature aesthetic
    else if (styleName.includes("biomimetic") || styleName.includes("organic flow") || styleName.includes("nature")) {
      console.log("[transmute] >>> MATCHED: BIOMIMETIC ORGANIC <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: BIOMIMETIC ORGANIC (Living Nature Interface)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
THIS IS A STYLE TRANSFORMATION. Copy CONTENT from the video,
but COMPLETELY CHANGE the visual style to these organic aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Palette: ONLY Earth Tones (Sage #7C9070, Sand #C4A77D, Moss #4A5D4C, Terracotta #C06B52)
2. Shapes: All containers MUST have organic blob shapes (no rectangles)
3. Typography: MUST use Serif font (Georgia, Playfair Display)
4. Animations: MUST be slow, breathing (1.5-2s transitions)

**VISUAL DNA:**
- NO sharp corners - use border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%
- NO dark tech colors - only earth/nature tones
- Background: Subtle gradient with organic texture

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-gradient-to-br from-[#7C9070] to-[#C4A77D]">
  <div class="p-8" style="border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%">
    <h1 class="font-serif text-[#4A5D4C] text-5xl">Organic Title</h1>
  </div>
</div>
\`\`\`

**COMPONENTS:**
1. LivingBackground - Animated Perlin noise canvas
2. OrganicCard - Morphing blob shapes on hover
3. SoftEdgeImage - Feathered edge masks on photos
4. BreathingElement - Subtle scale pulsing

${request.styleDirective}`;
    }
    // SILENT LUXURY - Radical minimalism
    else if (styleName.includes("silent luxury") || styleName.includes("radical minimal") || styleName.includes("white void")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SILENT LUXURY (Radical Minimalism)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SILENT LUXURY aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be pure #FFFFFF (white)
2. Text: MUST be pure #000000 (black) - NO other colors
3. Whitespace: 60%+ of screen MUST be empty
4. Typography: Tiny labels (12px) + Massive headlines

**RULE: If an element is not ABSOLUTELY necessary, remove it.**

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-white">
  <div class="max-w-sm mx-auto pt-48">
    <span class="text-[10px] uppercase tracking-[0.3em] text-black">Title</span>
    <h1 class="text-8xl font-light text-black mt-4">Minimal</h1>
  </div>
</div>
\`\`\`

**COMPONENTS:**
1. NegativeSpace - Container enforcing 60%+ whitespace
2. CurtainReveal - White block reveals image
3. TinyDotCursor - Custom 2px cursor
4. SlowFadeText - 1.5s opacity transition

${request.styleDirective}`;
    }
    // LIQUID CHROME - Metallic Y2K
    else if (styleName.includes("liquid chrome") || styleName.includes("metallic") || styleName.includes("chrome")) {
      console.log("[transmute] >>> MATCHED: LIQUID CHROME <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: LIQUID CHROME (Metallic Y2K)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply LIQUID CHROME aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be pure black #000000
2. Text/Elements: MUST have chrome/silver metallic gradient
3. All text MUST use gradient background-clip for chrome effect
4. Moving reflections that follow mouse cursor

**CHROME GRADIENT (MUST USE):**
\`\`\`css
.chrome-text {
  background: linear-gradient(135deg, #888 0%, #fff 25%, #888 50%, #ccc 75%, #fff 100%);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: chrome-shift 3s ease infinite;
}
@keyframes chrome-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
\`\`\`

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-black flex items-center justify-center">
  <h1 class="text-8xl font-bold chrome-text">CHROME</h1>
</div>
\`\`\`

**COMPONENTS:**
1. ChromeText - Gradient fill that shifts
2. MetallicCard - Reflective surface
3. LiquidButton - Mercury ripple on hover

${request.styleDirective}`;
    }
    // DIGITAL COLLAGE - Mixed media scrapbook
    else if (styleName.includes("digital collage") || styleName.includes("scrapbook") || styleName.includes("mixed media")) {
      console.log("[transmute] >>> MATCHED: DIGITAL COLLAGE <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: DIGITAL COLLAGE (Mixed Media Scrapbook)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply DIGITAL COLLAGE aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be paper texture beige/off-white #EBEBEB
2. Elements: MUST have rotation (random 2-5 degrees)
3. Shadows: All elements MUST have drop shadows like stickers
4. Layout: Chaotic, overlapping, like a physical collage

**VISUAL DNA:**
- All elements slightly rotated (transform: rotate(2deg))
- Heavy drop shadows (box-shadow: 8px 8px 0 rgba(0,0,0,0.2))
- Mix of fonts: clean + handwritten

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#EBEBEB] p-8 relative">
  <div class="absolute top-20 left-10 rotate-3 p-6 bg-white shadow-[8px_8px_0_rgba(0,0,0,0.15)]">
    <h2 class="font-serif text-2xl">Title Here</h2>
  </div>
  <div class="absolute top-40 right-20 -rotate-2 p-4 bg-yellow-100 shadow-[6px_6px_0_rgba(0,0,0,0.1)]">
    <p class="font-mono text-sm">Note</p>
  </div>
</div>
\`\`\`

**COMPONENTS:**
1. PaperBackground - Textured base layer
2. StickerElement - Rotated with shadow
3. TornPaperMask - Irregular clip-path
4. HandwrittenNote - Brush font

${request.styleDirective}`;
    }
    // ETHEREAL MESH - Aurora gradients
    else if (styleName.includes("ethereal mesh") || styleName.includes("aurora gradient") || styleName.includes("mesh gradient")) {
      console.log("[transmute] >>> MATCHED: ETHEREAL MESH <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: ETHEREAL MESH (Aurora Borealis SaaS)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply ETHEREAL MESH aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be white/light #FAFAFA with colorful blurred blobs
2. Colors: MUST have Violet, Azure, Pink gradient blobs
3. Cards: MUST use glass effect (bg-white/40 + backdrop-blur-xl)
4. Animations: Blobs MUST animate in circular motion

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
  <!-- Animated blobs -->
  <div class="absolute top-0 left-1/4 w-96 h-96 bg-violet-400 rounded-full blur-3xl opacity-60 animate-blob"></div>
  <div class="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-400 rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
  <div class="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-400 rounded-full blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
  
  <!-- Glass card -->
  <div class="relative z-10 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 p-8">
    <h1 class="text-4xl font-bold text-gray-900">Content</h1>
  </div>
</div>
<style>
@keyframes blob {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
}
.animate-blob { animation: blob 7s infinite ease-in-out; }
</style>
\`\`\`

${request.styleDirective}`;
    }
    // X-RAY BLUEPRINT - Wireframe reveal
    else if (styleName.includes("x-ray") || styleName.includes("blueprint") || styleName.includes("wireframe reveal")) {
      console.log("[transmute] >>> MATCHED: X-RAY BLUEPRINT <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: X-RAY BLUEPRINT (Wireframe Reveal)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply X-RAY BLUEPRINT aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be dark blueprint #0a1628
2. Lines: MUST be thin cyan/white wireframe style
3. Effect: Mouse reveals layers (wireframe vs solid)
4. Grid: Technical grid overlay pattern

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#0a1628] relative overflow-hidden">
  <!-- Blueprint grid -->
  <div class="absolute inset-0 opacity-10" style="background-image: linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px); background-size: 40px 40px;"></div>
  
  <!-- Content with wireframe style -->
  <div class="relative border border-cyan-500/30 p-8">
    <h1 class="text-cyan-400 font-mono text-4xl">BLUEPRINT</h1>
    <p class="text-cyan-300/60 font-mono text-sm mt-2">Technical wireframe view</p>
  </div>
</div>
\`\`\`

**COMPONENTS:**
1. XRayContainer - Mouse-tracked reveal layers
2. WireframeSVG - Animated stroke drawing
3. ScannerLine - Vertical reveal line
4. BlueprintGrid - Technical grid overlay

${request.styleDirective}`;
    }
    // CINEMATIC PRODUCT - check first because fullDesc contains "apple"
    else if (styleName.includes("cinematic product") || styleName.includes("cinematic-product") || styleName.includes("scrollytelling")) {
      console.log("[transmute] >>> MATCHED: CINEMATIC PRODUCT <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: CINEMATIC PRODUCT SHOWCASE (Apple Product Page)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply CINEMATIC PRODUCT aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be pure black #000000
2. Product: MUST stay sticky center and transform with scroll
3. Typography: Large centered white text, fades with scroll
4. Layout: Full-height sections for scroll-driven animation

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="bg-black text-white">
  <!-- Make page tall for scroll -->
  <div class="h-[400vh] relative">
    <!-- Sticky product -->
    <div class="sticky top-0 h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-7xl font-bold mb-8">Product Name</h1>
        <div class="w-64 h-64 mx-auto bg-white/10 rounded-3xl flex items-center justify-center">
          <span class="text-6xl">📱</span>
        </div>
        <p class="text-xl text-white/60 mt-8">Scroll to explore</p>
      </div>
    </div>
  </div>
</div>
\`\`\`

**SCROLL-DRIVEN ANIMATION:**
- Use framer-motion useScroll + useTransform
- 0-20%: scale 0.5→1
- 20-50%: rotateY 0→180
- 50-80%: opacity text reveals

${request.styleDirective}`;
    }
    else if (styleName.includes("high-end dark") || styleName.includes("aura-glass") || styleName.includes("glassmorphism")) {
      console.log("[transmute] >>> MATCHED: HIGH-END DARK GLASSMORPHISM <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: HIGH-END DARK GLASSMORPHISM (Aura Build)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply DARK GLASSMORPHISM aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be #050505 (deep black)
2. Cards: MUST use bg-white/5 + backdrop-blur-md + border-white/10
3. Text: White with varying opacity (never pure white for body)
4. Glow: Radial gradient follows mouse

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#050505] text-white p-8">
  <!-- Glass card -->
  <div class="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8">
    <h1 class="text-4xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
      Glassmorphism
    </h1>
    <p class="text-white/60 mt-4">Premium dark interface</p>
  </div>
</div>
\`\`\`

**COMPONENTS:**
1. SpotlightCard - Mouse-tracked radial gradient overlay
2. GlassPanel - bg-white/5 + backdrop-blur
3. GradientText - text-transparent bg-clip-text
4. ShimmerButton - Animated border gradient

${request.styleDirective}`;
    }
    else if (styleName.includes("void spotlight")) {
      console.log("[transmute] >>> MATCHED: VOID SPOTLIGHT <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: VOID SPOTLIGHT (Classic Aura)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply VOID SPOTLIGHT aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be #050505 (deep void black)
2. Cards: MUST have mouse-tracked spotlight/glow effect
3. Borders: Reveal gradient on hover tracking mouse position
4. Feel: Dark, premium, with subtle glows

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#050505]">
  <div class="relative group bg-neutral-950/50 backdrop-blur-sm rounded-xl p-6 border border-white/5 hover:border-white/10">
    <!-- Spotlight gradient follows mouse -->
    <div class="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
         style="background: radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.06), transparent 40%)"></div>
    <h2 class="text-white text-xl relative z-10">Void Spotlight</h2>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("dark cosmos")) {
      console.log("[transmute] >>> MATCHED: DARK COSMOS <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: DARK COSMOS (Ethereal Glow)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply DARK COSMOS aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be #030303 with purple/cyan gradient orbs
2. Glow: MUST have vivid purple/cyan glow effects
3. Glass: Heavy backdrop-blur-[20px], bg-white/5
4. Animations: SLOW and ethereal (1.2s+ transitions)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#030303] relative overflow-hidden">
  <!-- Cosmos orbs -->
  <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 rounded-full blur-[100px]"></div>
  <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/30 rounded-full blur-[100px]"></div>
  
  <!-- Glass card -->
  <div class="relative bg-white/5 backdrop-blur-[20px] border border-white/10 rounded-2xl p-8">
    <h1 class="text-white text-4xl">Cosmos</h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("swiss grid") || styleName.includes("swiss international")) {
      console.log("[transmute] >>> MATCHED: SWISS GRID <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SWISS GRID TECHNICAL**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SWISS GRID aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: Pure #FFFFFF or #000000 ONLY
2. Grid: MUST have visible 1px grid lines
3. Typography: MASSIVE text-8xl+, tight tracking
4. NO gradients, NO colors except black/white

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-white relative">
  <!-- Visible grid -->
  <div class="absolute inset-0" style="background-image: linear-gradient(#e5e5e5 1px, transparent 1px), linear-gradient(90deg, #e5e5e5 1px, transparent 1px); background-size: 80px 80px;"></div>
  <div class="relative p-8">
    <span class="text-[10px] uppercase tracking-[0.3em] text-neutral-400">[01] SECTION</span>
    <h1 class="text-8xl font-bold tracking-tight text-black">GRID</h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("neo-brutal") || styleName.includes("neubrutalism")) {
      console.log("[transmute] >>> MATCHED: NEO-BRUTALISM <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: NEO-BRUTALISM**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply NEO-BRUTALISM aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Colors: Pastel Pink/Yellow background with BLACK text
2. Borders: THICK border-2 or border-4 border-black on EVERYTHING
3. Shadows: HARD shadows: box-shadow: 4px 4px 0 #000 (NO blur!)
4. Hover: Buttons DEPRESS (translate shadow away)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#FFE566] p-8">
  <div class="bg-white border-4 border-black p-6" style="box-shadow: 8px 8px 0 #000;">
    <h1 class="text-4xl font-black text-black">BRUTAL</h1>
  </div>
  <button class="mt-4 px-6 py-3 bg-[#FF6B9D] border-4 border-black font-bold text-black hover:translate-x-1 hover:translate-y-1 transition-transform" style="box-shadow: 4px 4px 0 #000;">
    Press Me
  </button>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("cyber tech") || styleName.includes("neon cyber")) {
      console.log("[transmute] >>> MATCHED: CYBER TECH <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: CYBER TECH / NEON CYBER**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply CYBER TECH aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be dark with grid pattern
2. Colors: MUST use Neon Green (#00FF00) accents
3. Typography: MUST use monospace font
4. Effects: Scanlines, glowing borders, terminal feel

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-black relative font-mono">
  <!-- Grid overlay -->
  <div class="absolute inset-0 opacity-20" style="background-image: linear-gradient(#00FF00 1px, transparent 1px), linear-gradient(90deg, #00FF00 1px, transparent 1px); background-size: 40px 40px;"></div>
  
  <div class="relative p-8">
    <span class="text-[10px] text-[#00FF00]/60">[01] SYSTEM</span>
    <h1 class="text-4xl text-[#00FF00]" style="text-shadow: 0 0 10px #00FF00;">CYBER</h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("soft organic") || styleName.includes("liquid") || styleName.includes("aurora")) {
      console.log("[transmute] >>> MATCHED: SOFT ORGANIC <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SOFT ORGANIC / LIQUID AURORA**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SOFT ORGANIC aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST have animated color blobs (blur-3xl)
2. Shapes: NO sharp corners - use rounded-3xl or rounded-full
3. Colors: Pastel Peach/Lavender/Mint
4. Animation: Blobs MUST move continuously

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#FFFBF5] relative overflow-hidden">
  <!-- Animated blobs -->
  <div class="absolute top-0 left-0 w-96 h-96 bg-[#FFD4B8] rounded-full blur-3xl opacity-60 animate-blob"></div>
  <div class="absolute bottom-0 right-0 w-96 h-96 bg-[#D4B8FF] rounded-full blur-3xl opacity-60 animate-blob animation-delay-2000"></div>
  
  <div class="relative bg-white/30 backdrop-blur-xl rounded-3xl p-8">
    <h1 class="text-4xl font-light text-gray-800">Organic</h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("kinetic typo")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: KINETIC TYPOGRAPHY**

**VISUAL DNA:**
- Font: MASSIVE (10rem+), Condensed Sans-Serif, tracking-tighter
- Colors: Text transparent with white outline (-webkit-text-stroke: 1px white) until hovered
- Fill on hover with smooth transition

**ANIMATION PHYSICS:**
- Scroll: Text moves HORIZONTALLY based on scroll speed (useScroll + useVelocity)
- Reveal: Words slide up from overflow-hidden masks
- Parallax: Different text layers at different speeds

**COMPONENTS:**
1. KineticHeadline - Scroll-velocity horizontal movement
2. MaskedWordReveal - Words slide up from masks
3. OutlineText - Stroke outline that fills on hover
4. ScrollingMarquee - Text moves with scroll velocity

${request.styleDirective}`;
    }
    else if (styleName.includes("parallax scroll") || styleName.includes("deep parallax")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: DEEP PARALLAX**

**VISUAL DNA:**
- Layout: Multiple layers stacked with different z-index
- Depth: Background slower than foreground
- Images: Scale up as they enter viewport

**ANIMATION PHYSICS:**
- Scroll: useTransform(scrollY, [0, 1000], [0, 200]) for parallax
- whileInView: scale 0.95→1 on viewport entry
- Layered: Min 3 depth layers moving at different rates

**COMPONENTS:**
1. ParallaxSection - Container with useScroll tracking
2. ParallaxLayer - Individual layer with speed multiplier
3. ScaleReveal - Scale up on viewport entry
4. DepthImage - Image with parallax + scale effect

${request.styleDirective}`;
    }
    else if (styleName.includes("noise") || styleName.includes("film grain")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: NOISE & FILM GRAIN**

**VISUAL DNA:**
- Texture: Global SVG noise overlay (opacity-5, mix-blend-overlay, pointer-events-none)
- Colors: Desaturated greys, almost monochromatic
- Images: Black & white, becoming colored on hover

**ANIMATION PHYSICS:**
- Frame rate: Simulate 12fps or 24fps (stepped easing) for retro feel
- Entry: Curtain reveal (black div slides away to reveal content)
- Grain: Subtle animated noise pattern

**COMPONENTS:**
1. NoiseOverlay - Global grain texture
2. FilmImage - B&W that colors on hover
3. CurtainReveal - Sliding mask reveal
4. SteppedAnimation - Retro frame-rate feel

${request.styleDirective}`;
    }
    else if (styleName.includes("glass hud")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: GLASS HUD (Futuristic)**

**VISUAL DNA:**
- Panels: Highly reflective (bg-gradient-to-b from-white/10 to-transparent)
- Borders: Shiny top borders (border-t-white/40)
- Decor: Tiny "+" signs in corners of containers
- Effect: Iron Man / Sci-Fi HUD aesthetic

**ANIMATION PHYSICS:**
- Glitch: Occasional subtle text flicker
- Entry: Elements expand from center (scaleX: 0→1)
- Tech: Data appears to "load in"

**COMPONENTS:**
1. HUDPanel - Reflective glass with corner marks
2. ExpandReveal - scaleX animation from center
3. FlickerText - Occasional glitch flicker
4. DataStream - Numbers/text loading effect

${request.styleDirective}`;
    }
    else if (styleName.includes("magnetic")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: MAGNETIC INTERACTION**

**VISUAL DNA:**
- Buttons: Rounded full pills
- Cursor: Custom larger cursor with mix-blend-difference
- Elements physically attracted to cursor

**ANIMATION PHYSICS:**
- Magnetism: Track mouse position, if close to button apply spring physics
- Spring: Pull towards cursor with strength: 0.3
- Smooth: useSpring for x/y movement

**COMPONENTS:**
1. MagneticButton - Button that pulls toward cursor
2. CustomCursor - Large blend-mode cursor
3. MagneticWrapper - Container that applies magnetic effect to children

${request.styleDirective}`;
    }
    else if (styleName.includes("bento dense") || styleName.includes("dense bento")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: DENSE BENTO**

**VISUAL DNA:**
- Gap: Very small (gap-2)
- Cells: Solid dark grey (bg-neutral-900), NO transparency
- Hover: Cell scales up (scale: 1.02), z-index increases to pop out

**ANIMATION PHYSICS:**
- Load: Staggered entry from random directions
- Hover: Quick scale with elevated z-index
- Dense: Maximum information density

**COMPONENTS:**
1. DenseBentoGrid - Tight gap grid with stagger load
2. BentoCell - Scale + z-index on hover
3. DataCard - Compact information display

${request.styleDirective}`;
    }
    else if (styleName.includes("marquee") && !styleName.includes("tunnel")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: INFINITE STREAM MARQUEE**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply MARQUEE aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Layout: Horizontal scrolling text/content strips
2. Animation: Infinite linear scroll, pauses on hover
3. Edges: Gradient fade masks on left/right

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="overflow-hidden relative">
  <div class="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10"></div>
  <div class="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10"></div>
  <div class="flex animate-marquee hover:[animation-play-state:paused]">
    <span class="text-white/60 text-sm mx-8">ITEM 1</span>
    <span class="text-white/60 text-sm mx-8">ITEM 2</span>
    <!-- Duplicate for seamless loop -->
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("pure mono") || styleName.includes("monochrome") || styleName.includes("vercel")) {
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: PURE MONOCHROME**

**VISUAL DNA:**
- Contrast: ABSOLUTE. Either white-on-black or black-on-white
- Lines: Thick borders (2px solid)
- NO gradients, NO colors, NO greys in between

**ANIMATION PHYSICS:**
- Hover: INSTANT invert colors of container
- Images: Curtain slide reveal (black div slides away)
- Minimal: Only essential animations

**COMPONENTS:**
1. InvertCard - Instant color swap on hover
2. CurtainImage - Sliding reveal effect
3. ThickBorderSection - Bold 2px outlined sections

${request.styleDirective}`;
    }
    else if (styleName.includes("apple")) {
      console.log("[transmute] >>> MATCHED: APPLE <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: APPLE (SF Pro Aesthetic)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply APPLE aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: Clean white or light grey
2. Typography: system-ui font, generous whitespace
3. Layout: Centered content, lots of breathing room
4. Colors: Clean whites, subtle greys, ONE vibrant accent

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#FBFBFD]" style="font-family: system-ui, -apple-system, sans-serif;">
  <div class="max-w-4xl mx-auto px-8 py-32 text-center">
    <h1 class="text-6xl font-semibold text-black tracking-tight">Clean. Simple.</h1>
    <p class="text-xl text-gray-500 mt-6 max-w-xl mx-auto">Beautiful design with attention to every detail.</p>
    <button class="mt-8 px-8 py-3 bg-[#0071E3] text-white rounded-full font-medium">Learn More</button>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("stripe")) {
      console.log("[transmute] >>> MATCHED: STRIPE <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: STRIPE DESIGN**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply STRIPE aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST have animated gradient mesh
2. Colors: Trust blues, clean whites
3. Cards: Clean white with subtle shadows
4. Polish: Every element refined and professional

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen relative overflow-hidden">
  <!-- Animated gradient background -->
  <div class="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-500 to-cyan-400 animate-gradient"></div>
  
  <div class="relative z-10 max-w-4xl mx-auto px-8 py-20">
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <h1 class="text-4xl font-bold text-gray-900">Payments infrastructure</h1>
      <p class="text-gray-600 mt-4">Accept payments from anyone, anywhere.</p>
    </div>
  </div>
</div>
<style>
@keyframes gradient { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.animate-gradient { background-size: 200% 200%; animation: gradient 15s ease infinite; }
</style>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("spotify")) {
      console.log("[transmute] >>> MATCHED: SPOTIFY <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SPOTIFY DARK**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SPOTIFY aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be #121212 (deep black)
2. Accent: MUST use #1DB954 (Spotify green)
3. Cards: Rounded corners, image-heavy
4. Layout: Horizontal scrolling card rows

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#121212] text-white p-8">
  <h2 class="text-2xl font-bold mb-4">Good evening</h2>
  
  <div class="flex gap-4 overflow-x-auto">
    <div class="flex-shrink-0 w-48 bg-[#181818] rounded-lg p-4 hover:bg-[#282828] transition-colors group">
      <div class="w-full aspect-square bg-[#333] rounded-md mb-4 relative">
        <button class="absolute bottom-2 right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
          <span class="text-black text-2xl">▶</span>
        </button>
      </div>
      <h3 class="font-bold truncate">Playlist Name</h3>
      <p class="text-sm text-gray-400 truncate">Description here</p>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    // ============== NEW STYLES 2025 ==============
    else if (styleName.includes("spatial glass") || styleName.includes("spatial-glass") || styleName.includes("vision pro")) {
      console.log("[transmute] >>> MATCHED: SPATIAL GLASS <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SPATIAL GLASS (Apple Vision Pro Aesthetic)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SPATIAL GLASS aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be light with soft gradient mesh
2. Cards: MUST use bg-white/40 + backdrop-blur-2xl (thick glass)
3. Borders: White inner glow (border-white/60)
4. Interaction: Cards MUST tilt on mouse move (3D effect)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-gradient-to-br from-gray-100 via-white to-gray-200 flex items-center justify-center">
  <div class="bg-white/40 backdrop-blur-2xl rounded-3xl p-8 border border-white/60" style="box-shadow: 0 4px 30px rgba(0,0,0,0.1);">
    <!-- Top highlight -->
    <div class="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white to-transparent"></div>
    <h2 class="text-2xl font-semibold text-gray-900">Spatial Interface</h2>
    <p class="text-gray-600 mt-2">Floating glass design</p>
  </div>
</div>
\`\`\`

**3D TILT EFFECT:**
\`\`\`javascript
// Track mouse for 3D rotation
const rotateX = useMotionValue(0);
const rotateY = useMotionValue(0);

<motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("kinetic brutal") || styleName.includes("kinetic-brutal")) {
      console.log("[transmute] >>> MATCHED: KINETIC BRUTALISM <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: KINETIC BRUTALISM (Aggressive Design)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
THIS IS A STYLE TRANSFORMATION. You MUST apply Kinetic Brutalism aesthetics
REGARDLESS of what the video shows. Copy the CONTENT and FUNCTIONALITY from 
the video, but COMPLETELY CHANGE the visual style to match these requirements:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be #E5FF00 (Acid Yellow) or #000000 (Black)
2. Typography: MUST be MASSIVE - use text-[15vw] for main headings
3. Font: Use 'Impact', 'Anton', or extremely bold system font
4. Layout: Text MUST touch screen edges, no safe margins
5. Contrast: ONLY use #E5FF00, #000000, and #FFFFFF

**VISUAL DNA:**
- NO subtle colors, NO gradients (except stark black/yellow)
- NO rounded corners (use sharp edges)
- NO gentle shadows (use hard 4px black shadows if any)
- Typography is the HERO - make it impossibly large
- mix-blend-mode: difference for text overlapping images

**ANIMATION PHYSICS (Velocity Scroll):**
- Headers move left/right based on scroll velocity (useVelocity from framer-motion)
- Images are hidden by default, appear on hover following cursor
- Infinite marquee bands with thick border-t-4 border-black
- All animations are FAST and AGGRESSIVE - no gentle easing

**MANDATORY COMPONENTS:**
1. HeroSection - Full-width yellow/black with text-[15vw] heading
2. MarqueeBand - Infinite scrolling text strip with thick borders
3. FullbleedType - Text that overflows container edges
4. HoverImageReveal - Images appear following cursor

**EXAMPLE STRUCTURE:**
\`\`\`html
<div class="min-h-screen bg-[#E5FF00]">
  <h1 class="text-[15vw] font-black text-black leading-none -tracking-[0.05em]">
    MASSIVE TEXT
  </h1>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("neo-retro") || styleName.includes("neo retro") || styleName.includes("y2k") || styleName.includes("vaporwave")) {
      console.log("[transmute] >>> MATCHED: NEO-RETRO OS <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: NEO-RETRO OS (Y2K / Vaporwave)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply NEO-RETRO OS aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be #C0C0C0 (System Grey) or #000080 (Blue)
2. Windows: MUST look like Windows 95 with beveled borders
3. Shadows: Hard pixelated (4px 4px 0 #000)
4. Elements: MUST be draggable

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#008080] p-8 font-mono">
  <!-- Windows 95 style window -->
  <div class="bg-[#C0C0C0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080]" style="box-shadow: 4px 4px 0 #000;">
    <!-- Title bar -->
    <div class="bg-[#000080] text-white px-2 py-1 flex items-center justify-between">
      <span class="text-sm">My Computer</span>
      <div class="flex gap-1">
        <button class="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[10px]">_</button>
        <button class="w-4 h-4 bg-[#C0C0C0] border border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[10px]">X</button>
      </div>
    </div>
    <div class="p-4">Content here</div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("soft clay") || styleName.includes("clay pop") || styleName.includes("claymorphism")) {
      console.log("[transmute] >>> MATCHED: SOFT CLAY POP <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SOFT CLAY POP (Claymorphism)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SOFT CLAY aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be soft off-white #FFF5F0
2. Colors: MUST use Pastels (Lilac, Mint, Peach)
3. Shapes: NO sharp corners - EVERYTHING rounded-3xl
4. Shadows: MUST use clay effect with inner shadows

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#FFF5F0] p-8">
  <div class="bg-[#E8B4FF] rounded-3xl p-8" style="box-shadow: inset 10px 10px 20px rgba(255,255,255,0.5), inset -10px -10px 20px rgba(0,0,0,0.05), 10px 20px 30px rgba(0,0,0,0.1);">
    <h2 class="text-2xl font-bold text-gray-800">Soft Clay</h2>
    <p class="text-gray-600 mt-2">Squishy and friendly</p>
  </div>
  <button class="mt-6 px-8 py-4 bg-[#B4FFD4] rounded-full font-bold text-gray-800 hover:scale-105 hover:rotate-1 transition-transform" style="box-shadow: inset 5px 5px 10px rgba(255,255,255,0.5), 8px 12px 20px rgba(0,0,0,0.1);">
    Squish Me
  </button>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("deconstructed") || styleName.includes("editorial") || styleName.includes("fashion")) {
      console.log("[transmute] >>> MATCHED: DECONSTRUCTED EDITORIAL <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: DECONSTRUCTED EDITORIAL (Fashion Chaos)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply DECONSTRUCTED EDITORIAL aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Typography: MUST mix huge Serif + tiny Monospace
2. Layout: Elements MUST overlap using absolute positioning
3. Text: Some text MUST be vertical (writing-mode: vertical-rl)
4. Feel: Organized chaos like a fashion magazine

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-white relative overflow-hidden">
  <h1 class="absolute top-20 left-8 text-[20vw] font-serif leading-none z-0">STYLE</h1>
  <div class="absolute top-40 right-20 w-80 h-96 z-10 bg-gray-200"></div>
  <p class="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono tracking-widest" style="writing-mode: vertical-rl;">EDITORIAL 2025</p>
</div>
\`\`\`

${request.styleDirective}`;
    }
    // ============== NEW STYLES ==============
    else if (styleName.includes("particle") || styleName.includes("point cloud") || styleName.includes("brain")) {
      console.log("[transmute] >>> MATCHED: PARTICLE BRAIN <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: PARTICLE BRAIN (AI Point Cloud)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply PARTICLE aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be pure black
2. Elements: Represented as thousands of small dots/particles
3. Animation: Particles float, breathe, scatter on hover
4. Colors: Cyan/white particles on black

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-black relative overflow-hidden">
  <!-- Particle field -->
  <div class="absolute inset-0">
    {particles.map((p, i) => (
      <div key={i} className="absolute w-1 h-1 bg-cyan-400 rounded-full" 
           style={{ left: p.x + '%', top: p.y + '%', opacity: p.opacity }} />
    ))}
  </div>
  <div class="relative z-10 text-center py-20">
    <h1 class="text-6xl font-light text-white tracking-wider">NEURAL</h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("old money") || styleName.includes("heritage") || styleName.includes("luxury classic")) {
      console.log("[transmute] >>> MATCHED: OLD MONEY HERITAGE <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: OLD MONEY HERITAGE (Classic Luxury)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply OLD MONEY aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be cream/beige #F5F5DC
2. Typography: MUST use Serif font (Playfair Display, Georgia)
3. Accents: Gold/amber tones, forest green or navy text
4. Animation: VERY slow fades (1s+), no bouncing

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#F5F5DC] relative" style="font-family: 'Playfair Display', Georgia, serif;">
  <!-- Subtle grain texture -->
  <div class="absolute inset-0 opacity-10" style="background-image: url('data:image/svg+xml,...')"></div>
  <div class="max-w-4xl mx-auto px-8 py-20 text-center">
    <span class="text-sm tracking-[0.3em] text-[#8B7355] uppercase">Established 1892</span>
    <h1 class="text-6xl font-light text-[#2C3E50] mt-4 italic">Heritage</h1>
    <div class="w-20 h-[1px] bg-[#D4AF37] mx-auto mt-8"></div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("tactical") || styleName.includes("hud") || styleName.includes("sci-fi game")) {
      console.log("[transmute] >>> MATCHED: TACTICAL HUD <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: TACTICAL HUD (Sci-Fi Gaming Interface)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply TACTICAL HUD aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be dark with grid/scanlines
2. Decor: Corner brackets [ ], connecting lines, crosshairs
3. Typography: MUST be monospace, ALL-CAPS, with labels like [01]
4. Animation: Glitchy entry, blinking cursors, scanning effects

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#0a0a0a] font-mono text-cyan-400 relative overflow-hidden">
  <!-- Scanlines -->
  <div class="absolute inset-0 pointer-events-none opacity-10" style="background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.1) 2px, rgba(0,255,255,0.1) 4px)"></div>
  
  <div class="relative p-8">
    <div class="flex items-center gap-2 text-xs">
      <span class="text-cyan-600">[01]</span>
      <span class="uppercase tracking-widest">SYSTEM STATUS</span>
    </div>
    <div class="mt-8 border border-cyan-500/30 p-6 relative">
      <div class="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500"></div>
      <div class="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
      <div class="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>
      <div class="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500"></div>
      <h1 class="text-4xl">TARGET ACQUIRED</h1>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("urban") || styleName.includes("grunge") || styleName.includes("street") || styleName.includes("concrete")) {
      console.log("[transmute] >>> MATCHED: URBAN GRUNGE <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: URBAN GRUNGE (Streetwear Brutalism)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply URBAN GRUNGE aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST have concrete/asphalt texture (dark grey)
2. Typography: Distorted, stretched, Impact-style or spray paint fonts
3. Effect: mix-blend-mode: hard-light for text over textures
4. Animation: Rough, stop-motion style (stepped easing)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#2a2a2a] relative overflow-hidden">
  <!-- Concrete texture overlay -->
  <div class="absolute inset-0 opacity-20" style="background-image: url('data:image/svg+xml,...noise...')"></div>
  
  <div class="relative p-8">
    <h1 class="text-[20vw] font-black text-white mix-blend-hard-light tracking-tighter leading-none" style="font-family: Impact, sans-serif;">
      STREET
    </h1>
    <div class="mt-8 bg-yellow-400 text-black p-4 inline-block transform -rotate-2">
      <span class="font-bold uppercase">Underground</span>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("ink") || styleName.includes("zen") || styleName.includes("sumi") || styleName.includes("japanese")) {
      console.log("[transmute] >>> MATCHED: INK & ZEN <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: INK & ZEN (Japanese Minimalism)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply INK & ZEN aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be off-white/rice paper color #FAF8F5
2. Typography: Vertical text (writing-mode: vertical-rl), serif/calligraphic
3. Effects: Ink drop reveals, brush stroke animations
4. Palette: Monochrome - black ink on cream

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#FAF8F5] relative overflow-hidden" style="font-family: 'Noto Serif JP', Georgia, serif;">
  <!-- Vertical text -->
  <div class="absolute right-8 top-8 bottom-8 flex items-center">
    <h1 class="text-4xl text-black/80 tracking-[0.5em]" style="writing-mode: vertical-rl;">禅 ZEN</h1>
  </div>
  
  <!-- Ink drop -->
  <div class="absolute top-1/2 left-1/4 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
  
  <div class="p-20">
    <p class="text-xl text-black/60 max-w-md leading-relaxed">Finding peace in simplicity.</p>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("tunnel") || styleName.includes("z-axis") || styleName.includes("warp") || styleName.includes("infinite tunnel")) {
      console.log("[transmute] >>> MATCHED: INFINITE TUNNEL <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: INFINITE TUNNEL (Z-Axis Depth Effect)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply INFINITE TUNNEL aesthetics:

**CRITICAL RULE - NO OVERLAPPING TEXT:**
Each section MUST have its own OPAQUE background card. Text should NEVER overlap other text.

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: Dark gradient (not pure black) with depth illusion
2. Layout: SEQUENTIAL vertical sections, NOT overlapping absolute elements
3. Cards: Each content block has SOLID dark background (bg-gray-900/95 or bg-black/90)
4. Depth Effect: Use perspective, scale transforms, and z-index for tunnel feel
5. Spacing: Large gaps between sections (py-32 or more)

**⚠️ FORBIDDEN:**
- Overlapping text without backgrounds
- Multiple absolute positioned text blocks on same screen
- Transparent text containers

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black" style="perspective: 1000px;">
  
  <!-- Hero with depth -->
  <section class="h-screen flex items-center justify-center relative">
    <div class="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-12 max-w-2xl text-center transform hover:scale-105 transition-transform">
      <h1 class="text-5xl font-bold text-white mb-4">Main Title</h1>
      <p class="text-xl text-white/70">Subtitle text here</p>
    </div>
  </section>
  
  <!-- Content sections - EACH with solid background -->
  <section class="py-32 flex justify-center">
    <div class="bg-gray-900/95 backdrop-blur-md border border-white/5 rounded-xl p-10 max-w-xl transform" style="transform: translateZ(-50px) scale(0.95);">
      <h2 class="text-3xl font-semibold text-white mb-4">Feature 1</h2>
      <p class="text-white/60">Description with solid background - readable!</p>
    </div>
  </section>
  
  <section class="py-32 flex justify-center">
    <div class="bg-gray-900/95 backdrop-blur-md border border-white/5 rounded-xl p-10 max-w-xl transform" style="transform: translateZ(-100px) scale(0.9);">
      <h2 class="text-3xl font-semibold text-white mb-4">Feature 2</h2>
      <p class="text-white/60">Another section - never overlaps!</p>
    </div>
  </section>
  
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("acrylic") || styleName.includes("frosted") || styleName.includes("solid glass")) {
      console.log("[transmute] >>> MATCHED: FROSTED ACRYLIC <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: FROSTED ACRYLIC (Solid Glass Blocks)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply FROSTED ACRYLIC aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: Soft gradient (pastels)
2. Cards: HIGH opacity (bg-white/70), EXTREME blur (backdrop-blur-3xl)
3. Borders: THICK translucent white (2px solid white/50)
4. Shadows: Colored ambient shadows glowing THROUGH the block

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-gradient-to-br from-blue-200 via-purple-100 to-pink-200 p-8">
  <div class="bg-white/70 backdrop-blur-3xl rounded-3xl p-8 border-2 border-white/50" style="box-shadow: 0 8px 32px rgba(100, 100, 255, 0.2);">
    <h2 class="text-3xl font-semibold text-gray-800">Solid Acrylic</h2>
    <p class="text-gray-600 mt-4">Thick frosted material</p>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("datamosh") || styleName.includes("pixel sort") || styleName.includes("glitch")) {
      console.log("[transmute] >>> MATCHED: DATAMOSH GLITCH <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: DATAMOSH GLITCH (Digital Destruction)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply DATAMOSH aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: Black with RGB artifacts
2. Effects: Pixel sorting (stretching horizontal), color channel separation
3. Colors: Neon RGB split (text-shadow: -2px 0 red, 2px 0 blue)
4. Interaction: Elements "melt" or distort on hover

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-black relative overflow-hidden">
  <div class="p-8">
    <h1 class="text-6xl font-bold text-white relative">
      <span class="absolute -left-1 text-red-500 opacity-70">GLITCH</span>
      <span class="absolute left-1 text-blue-500 opacity-70">GLITCH</span>
      <span class="relative">GLITCH</span>
    </h1>
    <div class="mt-8 w-full h-64 relative overflow-hidden group">
      <div class="absolute inset-0 bg-gradient-to-r from-red-500/30 via-green-500/30 to-blue-500/30 group-hover:skew-y-6 transition-transform"></div>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    else if (styleName.includes("origami") || styleName.includes("fold") || styleName.includes("paper 3d")) {
      console.log("[transmute] >>> MATCHED: ORIGAMI FOLD <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: ORIGAMI FOLD (Paper 3D Interface)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply ORIGAMI FOLD aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: Light (white/cream paper color)
2. Structure: Content divided into fold panels
3. Animation: Panels unfold on scroll/click (rotateX transitions)
4. Shadows: Gradient shadows on crease lines

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-white" style="perspective: 1000px;">
  <div class="max-w-2xl mx-auto py-20">
    <div class="relative" style="transform-style: preserve-3d;">
      <!-- Top fold -->
      <div class="bg-gray-50 p-8 origin-bottom transition-transform duration-700" style="transform: rotateX(-5deg);">
        <h2 class="text-2xl">Section One</h2>
      </div>
      <!-- Middle -->
      <div class="bg-white p-8 border-y border-gray-100">
        <h2 class="text-2xl">Section Two</h2>
      </div>
      <!-- Bottom fold -->
      <div class="bg-gray-50 p-8 origin-top transition-transform duration-700" style="transform: rotateX(5deg);">
        <h2 class="text-2xl">Section Three</h2>
      </div>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    // ══════════════════════════════════════════════════════════════════════
    // NEW ADVANCED STYLES - KINETIC, INTERACTIVE, SHADER, PHYSICS
    // ══════════════════════════════════════════════════════════════════════
    
    // PHANTOM BORDER UI - Invisible grid with cursor proximity glow
    else if (styleName.includes("phantom") || styleName.includes("phantom-border") || styleName.includes("invisible grid")) {
      console.log("[transmute] >>> MATCHED: PHANTOM BORDER UI <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: PHANTOM BORDER UI (Cursor Proximity Grid)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply PHANTOM BORDER UI aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be pure black or very dark (#0a0a0a)
2. Grid: MUST use CSS Grid with transparent cells
3. Reveal Effect: MUST have radial gradient following mouse, masked by grid gaps
4. CSS Variables: MUST use --mouse-x, --mouse-y updated via Alpine.js
5. Physics: Duration MUST be 0 (instant response) - lag destroys illusion
6. All content cards/sections MUST have invisible borders that glow on proximity

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#0a0a0a] relative" x-data="{ mouseX: '50%', mouseY: '50%' }" @mousemove="mouseX = $event.clientX + 'px'; mouseY = $event.clientY + 'px'">
  <!-- Radial gradient glow following mouse -->
  <div class="absolute inset-0 pointer-events-none" :style="'background: radial-gradient(600px circle at ' + mouseX + ' ' + mouseY + ', rgba(255,255,255,0.06), transparent 40%)'"></div>
  <!-- Grid with invisible borders that glow on proximity -->
  <div class="grid grid-cols-4 gap-px p-8">
    <div class="bg-white/[0.02] p-8 border border-white/[0.03] hover:border-white/10 transition-colors duration-0">
      <h2 class="text-white text-xl">Section 1</h2>
      <p class="text-white/50">Content from video</p>
    </div>
    <div class="bg-white/[0.02] p-8 border border-white/[0.03] hover:border-white/10 transition-colors duration-0">
      <h2 class="text-white text-xl">Section 2</h2>
      <p class="text-white/50">Content from video</p>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // OPPOSING SCROLL STREAMS - Bi-directional marquee with velocity
    else if (styleName.includes("opposing") || styleName.includes("scroll stream") || styleName.includes("bi-directional")) {
      console.log("[transmute] >>> MATCHED: OPPOSING SCROLL STREAMS <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: OPPOSING SCROLL STREAMS (Kinetic Parallax Marquee)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply OPPOSING SCROLL STREAMS aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be dark/black
2. Typography: MUST have massive text rows moving in opposite directions
3. Animation: Row 1 MUST move LEFT, Row 2 MUST move RIGHT on scroll
4. Speed: MUST be driven by scroll velocity
5. Hover: MUST pause row and fill text white

**CORE MECHANIC:** Rows of text moving in opposite directions driven by scroll velocity.

**PHYSICS CONFIG:**
- Base velocity: 5px per frame
- Scroll velocity multiplier affects speed
- Smooth spring: damping 50, stiffness 400

**ANIMATION LOGIC:**
- Row 1 (odd rows): Move LEFT on scroll down
- Row 2 (even rows): Move RIGHT on scroll down
- 4x text duplication for infinite loop
- Hover on row: Pause (velocity 0), fill text white

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen overflow-hidden py-20 bg-black">
  <div class="animate-marquee whitespace-nowrap text-8xl font-bold text-white/10 hover:text-white transition-colors">
    <span class="mx-4">REPLAY</span><span class="mx-4">•</span><span class="mx-4">BUILD</span><span class="mx-4">•</span>
    <span class="mx-4">REPLAY</span><span class="mx-4">•</span><span class="mx-4">BUILD</span><span class="mx-4">•</span>
  </div>
  <div class="animate-marquee-reverse whitespace-nowrap text-8xl font-bold text-white/10 hover:text-white transition-colors mt-4">
    <span class="mx-4">CREATE</span><span class="mx-4">•</span><span class="mx-4">DESIGN</span><span class="mx-4">•</span>
    <span class="mx-4">CREATE</span><span class="mx-4">•</span><span class="mx-4">DESIGN</span><span class="mx-4">•</span>
  </div>
</div>
<style>
@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes marquee-reverse { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
.animate-marquee { animation: marquee 20s linear infinite; }
.animate-marquee-reverse { animation: marquee-reverse 20s linear infinite; }
</style>
\`\`\`

${request.styleDirective}`;
    }
    
    // CHROMATIC DISPERSION - RGB split shader effect
    else if (styleName.includes("chromatic") || styleName.includes("rgb split") || styleName.includes("dispersion")) {
      console.log("[transmute] >>> MATCHED: CHROMATIC DISPERSION <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: CHROMATIC DISPERSION (RGB Shader Effect)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply CHROMATIC DISPERSION aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be dark/black
2. All images/text: MUST have RGB split effect
3. Red channel: MUST offset +2px right
4. Blue channel: MUST offset -2px left
5. Effect intensity: MUST increase with scroll velocity

**CORE MECHANIC:** Colors split based on scroll/movement speed.

**VISUAL LOGIC (CSS-based, no WebGL needed):**
- Red channel: offset +2px right
- Green channel: stable (center)
- Blue channel: offset -2px left
- Effect intensity increases with scroll velocity

**CSS IMPLEMENTATION:**
\`\`\`html
<div class="min-h-screen bg-black">
  <div class="relative group">
    <img src="image.jpg" class="relative z-10" />
    <!-- Red channel -->
    <img src="image.jpg" class="absolute inset-0 opacity-50 mix-blend-screen" style="filter: url(#red-channel); transform: translateX(2px);" />
    <!-- Blue channel -->
    <img src="image.jpg" class="absolute inset-0 opacity-50 mix-blend-screen" style="filter: url(#blue-channel); transform: translateX(-2px);" />
  </div>
</div>
\`\`\`

**TEXT VERSION:**
\`\`\`html
<h1 class="text-6xl font-bold text-white relative">
  <span class="absolute text-red-500/50" style="transform: translateX(2px);">TEXT</span>
  <span class="absolute text-blue-500/50" style="transform: translateX(-2px);">TEXT</span>
  <span class="relative">TEXT</span>
</h1>
\`\`\`

${request.styleDirective}`;
    }
    
    // LIVE DASHBOARD DENSITY - Data heavy micro-animations
    else if (styleName.includes("live dashboard") || styleName.includes("dashboard density") || styleName.includes("data heavy")) {
      console.log("[transmute] >>> MATCHED: LIVE DASHBOARD DENSITY <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: LIVE DASHBOARD DENSITY (Data Heavy Interface)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply LIVE DASHBOARD aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be dark (neutral-900/black)
2. Layout: MUST use high-density grid with gap-px borders
3. Animations: MUST have scanner line, ticker numbers, blinking status dots
4. Typography: MUST use font-mono and tabular-nums
5. All data MUST feel "alive" with micro-animations

**CORE MECHANIC:** High density, micro-animations, "Alive" dashboard feel.

**DOM STRUCTURE:**
- Use display: grid with gap-px and bg-neutral-800 (creates borders)
- Cells have bg-black
- Status indicators with animate-pulse

**ANIMATION LOGIC:**
- Scanner: Invisible gradient line moves vertically through cells
- Ticker: Numbers scramble/animate on load
- Indicators: Blinking status dots (w-2 h-2 rounded-full bg-green-500 animate-pulse)
- Font: font-variant-numeric: tabular-nums (prevents layout shift)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-neutral-900 p-4 font-mono">
  <div class="grid grid-cols-4 gap-px bg-neutral-800 rounded-lg overflow-hidden">
    <div class="bg-black p-4">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span class="text-xs text-white/50">ACTIVE</span>
      </div>
      <div class="text-2xl font-bold text-white mt-2" style="font-variant-numeric: tabular-nums;">1,247</div>
      <div class="text-xs text-green-400">↑ 12%</div>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // SILK SMOKE - SVG turbulence background
    else if (styleName.includes("silk") || styleName.includes("smoke") || styleName.includes("turbulence")) {
      console.log("[transmute] >>> MATCHED: SILK SMOKE <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SILK SMOKE (Procedural Turbulence)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SILK SMOKE aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST have SVG turbulence filter simulating flowing smoke/silk
2. Colors: MUST use dark moody gradients (#1a1a2e to #16213e)
3. Animation: MUST be very slow (20s duration) for elegant feel
4. Text: MUST be sharp white contrasting with soft background

**CORE MECHANIC:** Slow, elegant procedural noise simulating flowing fabric/smoke.

**VISUAL ENGINE:**
- SVG Filter: feTurbulence type="fractalNoise" baseFrequency="0.01"
- Displacement: feDisplacementMap warps gradient background
- Animation: Very slow (20s duration) animating seed/baseFrequency
- Layer: Fixed inset-0 -z-10 container

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen relative overflow-hidden">
  <!-- Smoke background -->
  <div class="fixed inset-0 -z-10">
    <svg class="w-full h-full">
      <filter id="smoke">
        <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" seed="1">
          <animate attributeName="seed" values="1;10;1" dur="20s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" scale="50" />
      </filter>
      <rect width="100%" height="100%" fill="url(#gradient)" filter="url(#smoke)" />
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1a1a2e" />
          <stop offset="100%" stop-color="#16213e" />
        </linearGradient>
      </defs>
    </svg>
  </div>
  <!-- Sharp white text contrast -->
  <div class="relative z-10 p-20">
    <h1 class="text-6xl font-bold text-white">Content</h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // SLICED SHUTTER REVEAL - 5 vertical strips animation
    else if (styleName.includes("sliced") || styleName.includes("shutter") || styleName.includes("strips")) {
      console.log("[transmute] >>> MATCHED: SLICED SHUTTER REVEAL <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SLICED SHUTTER REVEAL (Vertical Strips Animation)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SLICED SHUTTER aesthetics. All images/sections MUST enter as 5 vertical strips with staggered animation.

**CORE MECHANIC:** Image enters as 5 vertical strips with staggered animation.

**DOM STRUCTURE:**
- Wrapper: relative w-full h-[500px]
- Slices: 5 divs (absolute h-full w-[20%])
- Image: Same background image with shifted background-position

**ANIMATION LOGIC:**
- Initial: translateY(100%) - hidden below
- Animate: translateY(0)
- Orchestration: delay = index * 0.1s
- Easing: cubic-bezier(0.76, 0, 0.24, 1) - fluid waterfall

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="relative w-full h-[500px] overflow-hidden">
  <div class="absolute inset-y-0 left-[0%] w-[20%] bg-cover animate-slide-up" style="background-image: url(img.jpg); background-position: 0% center; animation-delay: 0s;"></div>
  <div class="absolute inset-y-0 left-[20%] w-[20%] bg-cover animate-slide-up" style="background-image: url(img.jpg); background-position: 25% center; animation-delay: 0.1s;"></div>
  <div class="absolute inset-y-0 left-[40%] w-[20%] bg-cover animate-slide-up" style="background-image: url(img.jpg); background-position: 50% center; animation-delay: 0.2s;"></div>
  <div class="absolute inset-y-0 left-[60%] w-[20%] bg-cover animate-slide-up" style="background-image: url(img.jpg); background-position: 75% center; animation-delay: 0.3s;"></div>
  <div class="absolute inset-y-0 left-[80%] w-[20%] bg-cover animate-slide-up" style="background-image: url(img.jpg); background-position: 100% center; animation-delay: 0.4s;"></div>
</div>
<!-- Keyframe: slide-up from translateY(100%) to translateY(0), duration 0.8s, cubic-bezier(0.76, 0, 0.24, 1) -->
\`\`\`

${request.styleDirective}`;
    }
    
    // GYROSCOPIC LEVITATION - Physics shadow card
    else if (styleName.includes("gyroscopic") || styleName.includes("levitation") || styleName.includes("physics shadow")) {
      console.log("[transmute] >>> MATCHED: GYROSCOPIC LEVITATION <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: GYROSCOPIC LEVITATION (Shadow Physics Card)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply GYROSCOPIC LEVITATION aesthetics. All cards MUST float with shadow parallax based on device orientation/mouse.

**CORE MECHANIC:** Realistic lift physics where shadow behaves inversely to height.

**SHADOW PHYSICS (Crucial):**
When card goes UP:
- Shadow gets SMALLER (scale 0.95)
- Shadow gets SHARPER (blur 2px from 10px)
- Shadow gets DARKER (opacity 0.8)

**GYRO TILT:** Subtle rotateX/rotateY based on mouse position relative to card center.

**SPRING:** type: spring, stiffness: 400, damping: 25 (Heavy, magnetic feel)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="relative group cursor-pointer" x-data="{ hovered: false }" @mouseenter="hovered = true" @mouseleave="hovered = false">
  <!-- Shadow element -->
  <div class="absolute inset-0 bg-black/20 rounded-2xl blur-xl transition-all duration-300"
       :class="hovered ? 'scale-95 blur-sm opacity-80 translate-y-1' : 'scale-100 blur-xl opacity-50 translate-y-4'"></div>
  <!-- Card element -->
  <div class="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 transition-all duration-300"
       :class="hovered ? '-translate-y-4' : 'translate-y-0'"
       :style="hovered ? 'transform: translateY(-15px) perspective(1000px) rotateX(-5deg) rotateY(5deg)' : ''">
    <h3 class="text-xl font-bold text-white">Levitating Card</h3>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // STACKED CARD DECK - iOS Safari tabs style
    else if (styleName.includes("stacked") || styleName.includes("card deck") || styleName.includes("ios tabs")) {
      console.log("[transmute] >>> MATCHED: STACKED CARD DECK <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: STACKED CARD DECK (iOS Safari Tabs)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply STACKED CARD DECK aesthetics. Cards MUST stack on top simulating depth like iOS Safari tabs.

**CORE MECHANIC:** Cards stack on top scaling down, simulating depth like iOS Safari tabs.

**ANIMATION LOGIC:**
- Active card: scale 1, translateY 0
- Inactive cards: scale 1 - index*0.05, translateY -index*20px, brightness 1 - index*0.2
- Scroll maps to active card index

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="h-[400vh]">
  <div class="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
    <div class="relative w-80">
      <div class="absolute inset-0 bg-blue-500 rounded-2xl p-6" style="transform: scale(0.85) translateY(-60px); filter: brightness(0.6);"></div>
      <div class="absolute inset-0 bg-purple-500 rounded-2xl p-6" style="transform: scale(0.9) translateY(-40px); filter: brightness(0.7);"></div>
      <div class="absolute inset-0 bg-pink-500 rounded-2xl p-6" style="transform: scale(0.95) translateY(-20px); filter: brightness(0.85);"></div>
      <div class="relative bg-white rounded-2xl p-6 shadow-2xl">
        <h3 class="text-xl font-bold">Active Card</h3>
      </div>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // STICKY SECTION HEADERS - Editorial mix-blend
    else if (styleName.includes("sticky header") || styleName.includes("sticky section") || styleName.includes("editorial")) {
      console.log("[transmute] >>> MATCHED: STICKY SECTION HEADERS <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: STICKY SECTION HEADERS (Editorial Layout)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply STICKY SECTION HEADERS aesthetics. Section titles MUST stick to top with mix-blend-difference while content slides underneath.

**CORE MECHANIC:** Section titles stick to top while content slides underneath.

**DOM STRUCTURE:**
- Section: relative min-h-screen
- Header: sticky top-0 z-10 mix-blend-difference
- Content: relative z-0 with parallax

**EXAMPLE OUTPUT:**
\`\`\`html
<section class="relative min-h-screen">
  <h2 class="sticky top-0 z-10 text-8xl font-black text-white mix-blend-difference px-8 py-4">
    01. INTRODUCTION
  </h2>
  <div class="relative z-0 pt-32 px-8">
    <img src="hero.jpg" class="w-full rounded-2xl" />
    <p class="text-xl text-gray-600 mt-8 max-w-2xl">Content slides under the sticky header...</p>
  </div>
</section>
<section class="relative min-h-screen">
  <h2 class="sticky top-0 z-10 text-8xl font-black text-white mix-blend-difference px-8 py-4">
    02. FEATURES
  </h2>
  <div class="relative z-0 pt-32 px-8">
    <!-- More content -->
  </div>
</section>
\`\`\`

${request.styleDirective}`;
    }
    
    // MORPHING FLUID NAV - Dynamic Island style
    else if (styleName.includes("morphing") || styleName.includes("fluid nav") || styleName.includes("dynamic island")) {
      console.log("[transmute] >>> MATCHED: MORPHING FLUID NAV <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: MORPHING FLUID NAV (Dynamic Island)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply MORPHING NAV aesthetics. Navigation elements MUST morph and reshape like Dynamic Island with spring physics.

**CORE MECHANIC:** Navigation morphs width/height based on state like Apple's Dynamic Island.

**STATES:**
- Idle: Small pill (w-12 h-12)
- Hover: Medium pill with text (w-auto h-12)
- Active/Open: Large rectangle (w-[300px] h-[400px])

**PHYSICS:** Spring stiffness 500, damping 30 (Apple-like snappy)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="fixed top-4 left-1/2 -translate-x-1/2 z-50" x-data="{ state: 'idle' }">
  <div class="bg-black rounded-full transition-all duration-300 ease-out overflow-hidden flex items-center justify-center"
       :class="state === 'idle' ? 'w-12 h-12' : state === 'hover' ? 'w-40 h-12 px-4' : 'w-80 h-96 rounded-3xl'"
       @mouseenter="state = 'hover'" @mouseleave="state !== 'active' && (state = 'idle')" @click="state = state === 'active' ? 'idle' : 'active'">
    <template x-if="state === 'idle'">
      <div class="w-2 h-2 bg-white rounded-full"></div>
    </template>
    <template x-if="state === 'hover'">
      <span class="text-white text-sm font-medium">Menu</span>
    </template>
    <template x-if="state === 'active'">
      <div class="p-6 text-white">
        <nav class="space-y-4">
          <a href="#" class="block text-lg">Home</a>
          <a href="#" class="block text-lg">About</a>
        </nav>
      </div>
    </template>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // INVERTED LENS CURSOR - Window mask reveal
    else if (styleName.includes("inverted lens") || styleName.includes("lens cursor") || styleName.includes("cursor mask")) {
      console.log("[transmute] >>> MATCHED: INVERTED LENS CURSOR <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: INVERTED LENS CURSOR (Mask Reveal)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply INVERTED LENS aesthetics. Cursor MUST act as window revealing hidden inverted layer underneath. Black on white becomes white on black.

**CORE MECHANIC:** Cursor is a window revealing hidden layer.

**DOM STRUCTURE:**
- div.main-content: Black text on white background
- div.hidden-layer: White text on black (exact same position)
- div.cursor-mask: Circle mask following cursor

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="relative min-h-screen overflow-hidden" x-data="{ x: 0, y: 0 }" @mousemove="x = $event.clientX; y = $event.clientY">
  <!-- Main layer -->
  <div class="absolute inset-0 bg-white text-black flex items-center justify-center">
    <h1 class="text-8xl font-black">DISCOVER</h1>
  </div>
  <!-- Hidden inverted layer with mask -->
  <div class="absolute inset-0 bg-black text-white flex items-center justify-center"
       :style="'clip-path: circle(150px at ' + x + 'px ' + y + 'px)'">
    <h1 class="text-8xl font-black">DISCOVER</h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // CRT SIGNAL NOISE - Retro monitor effect
    else if (styleName.includes("crt") || styleName.includes("scanline") || styleName.includes("analog")) {
      console.log("[transmute] >>> MATCHED: CRT SIGNAL NOISE <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: CRT SIGNAL NOISE (Retro Monitor)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply CRT SIGNAL NOISE aesthetics:

**REQUIRED VISUAL CHANGES (Non-Negotiable):**
1. Background: MUST be pure black #0a0a0a
2. Scanlines: MUST have repeating-linear-gradient overlay on ENTIRE screen
3. RGB Shift: ALL text MUST have text-shadow: 2px 0 red, -2px 0 cyan
4. Vignette: MUST have box-shadow inset for curved CRT effect
5. Colors: MUST use green/amber terminal colors
6. Font: MUST be monospace font-family
7. Flicker: MUST have subtle opacity animation

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#0a0a0a] relative overflow-hidden font-mono">
  <!-- Scanlines overlay -->
  <div class="absolute inset-0 pointer-events-none z-50 animate-flicker"
       style="background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px); mix-blend-mode: color-dodge;"></div>
  <!-- CRT curvature vignette -->
  <div class="absolute inset-0 pointer-events-none" style="box-shadow: inset 0 0 150px rgba(0,0,0,0.8);"></div>
  <!-- Content with RGB shift -->
  <div class="relative z-10 p-12">
    <h1 class="text-6xl font-bold text-green-400" style="text-shadow: 2px 0 #ff0000, -2px 0 #00ffff;">
      SYSTEM ONLINE
    </h1>
    <p class="text-green-400/70 mt-4 animate-pulse">_ Ready for input</p>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // PARALLAX CURTAIN FOOTER - Fixed reveal
    else if (styleName.includes("curtain footer") || styleName.includes("parallax curtain") || styleName.includes("reveal footer")) {
      console.log("[transmute] >>> MATCHED: PARALLAX CURTAIN FOOTER <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: PARALLAX CURTAIN FOOTER (Fixed Reveal)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply PARALLAX CURTAIN FOOTER aesthetics. Footer MUST be fixed behind content, revealed as content slides up. Scale from 0.9 to 1.0.

**CORE MECHANIC:** Footer fixed behind content, content slides up to reveal it.

**DOM STRUCTURE:**
- main: relative z-10 bg-white mb-[500px] (margin = footer height)
- footer: fixed bottom-0 w-full h-[500px] z-0

**ANIMATION:**
- Heavy box-shadow on main bottom edge
- Footer scales 0.9 → 1.0 as revealed

**EXAMPLE OUTPUT:**
\`\`\`html
<main class="relative z-10 bg-white" style="margin-bottom: 500px; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">
  <!-- All page content here -->
  <section class="min-h-screen p-20">
    <h1 class="text-6xl font-bold">Page Content</h1>
  </section>
</main>
<footer class="fixed bottom-0 left-0 right-0 h-[500px] z-0 bg-black flex items-center justify-center">
  <div class="text-center">
    <h2 class="text-5xl font-bold text-white">Get in Touch</h2>
    <p class="text-white/60 mt-4">The footer reveals as you scroll</p>
  </div>
</footer>
\`\`\`

${request.styleDirective}`;
    }
    
    // MAGNETIC ATTRACTION - Sticky cursor button
    else if (styleName.includes("magnetic attraction") || styleName.includes("magnetic button") || styleName.includes("sticky cursor")) {
      console.log("[transmute] >>> MATCHED: MAGNETIC ATTRACTION <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: MAGNETIC ATTRACTION (Cursor Magnet)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply MAGNETIC ATTRACTION aesthetics. All interactive elements MUST stick to cursor within proximity radius with elastic wobble on mouse leave.

**CORE MECHANIC:** Elements physically stick to cursor within proximity radius.

**LOGIC:**
- Track mouse position relative to button center
- If distance < 100px: Apply transform = mousePos * 0.3
- Inner text moves more (0.5 strength) for parallax
- On mouse leave: Spring back (stiffness 150, damping 15)

**EXAMPLE OUTPUT:**
\`\`\`html
<button class="relative px-8 py-4 bg-white rounded-full text-black font-bold group transition-transform duration-200"
        x-data="{ x: 0, y: 0 }"
        @mousemove="x = ($event.offsetX - $el.offsetWidth/2) * 0.3; y = ($event.offsetY - $el.offsetHeight/2) * 0.3"
        @mouseleave="x = 0; y = 0"
        :style="'transform: translate(' + x + 'px, ' + y + 'px)'">
  <span class="relative z-10 transition-transform duration-100"
        :style="'transform: translate(' + (x * 0.5) + 'px, ' + (y * 0.5) + 'px)'">
    Hover Me
  </span>
  <div class="absolute inset-0 rounded-full border border-white/20 group-hover:border-white/40 transition-colors"></div>
</button>
\`\`\`

${request.styleDirective}`;
    }
    
    // FLASHLIGHT MASK - Dark screen cursor reveal
    else if (styleName.includes("flashlight") || styleName.includes("explorer mask") || styleName.includes("light cursor")) {
      console.log("[transmute] >>> MATCHED: FLASHLIGHT MASK <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: INVERTED FLASHLIGHT (Explorer Mask)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply FLASHLIGHT MASK aesthetics. Screen MUST be dark with cursor acting as light source revealing UI underneath. Heavy cursor lag for weight.

**CORE MECHANIC:** Screen is dark, cursor acts as light source revealing UI.

**DOM STRUCTURE:**
- div.content: Full color UI (hidden)
- div.overlay: Full black z-50 with mask

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="relative min-h-screen overflow-hidden" x-data="{ x: '50%', y: '50%', size: 150 }" 
     @mousemove="x = $event.clientX + 'px'; y = $event.clientY + 'px'"
     @mousedown="size = 400" @mouseup="size = 150">
  <!-- Full content layer -->
  <div class="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
    <h1 class="text-8xl font-black text-white">HIDDEN</h1>
  </div>
  <!-- Dark overlay with flashlight hole -->
  <div class="absolute inset-0 bg-black pointer-events-none transition-all duration-100"
       :style="'mask-image: radial-gradient(circle ' + size + 'px at ' + x + ' ' + y + ', transparent 0%, black 100%); -webkit-mask-image: radial-gradient(circle ' + size + 'px at ' + x + ' ' + y + ', transparent 0%, black 100%)'">
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // ELASTIC SIDEBAR - Rubber band drag
    else if (styleName.includes("elastic sidebar") || styleName.includes("rubber band") || styleName.includes("elastic drag")) {
      console.log("[transmute] >>> MATCHED: ELASTIC SIDEBAR <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: ELASTIC SIDEBAR DRAG (Rubber Band Menu)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply ELASTIC SIDEBAR aesthetics. Sidebar MUST stretch/follow when dragged past edge, snap back with elastic spring animation.

**CORE MECHANIC:** Sidebar behaves like stretched rubber band when dragged.

**SVG PATH MORPHING:**
- Curve defined by bezier point Q
- Drag updates: d="M0,0 Q{dragX},{mouseY} 0,100"
- On release: Elastic spring back (damping 15, stiffness 400) with wobble

**EXAMPLE OUTPUT:**
\`\`\`html
<nav class="fixed left-0 top-0 h-screen w-64 bg-black z-50" x-data="{ drag: 0, open: false }">
  <svg class="absolute right-0 top-0 h-full w-8 translate-x-full" viewBox="0 0 40 100" preserveAspectRatio="none">
    <path :d="'M0,0 Q' + drag + ',50 0,100'" fill="black" class="transition-all duration-300" />
  </svg>
  <div class="p-6 text-white">
    <a href="#" class="block py-2">Home</a>
    <a href="#" class="block py-2">About</a>
  </div>
  <!-- Drag handle -->
  <div class="absolute right-0 top-0 bottom-0 w-8 cursor-ew-resize"
       @mousedown="/* start drag */" @mousemove="drag = $event.movementX * 0.5" @mouseup="drag = 0"></div>
</nav>
\`\`\`

${request.styleDirective}`;
    }
    
    // MATTER.JS GRAVITY - Physics falling tags
    else if (styleName.includes("matter") || styleName.includes("gravity playground") || styleName.includes("falling tags")) {
      console.log("[transmute] >>> MATCHED: MATTER.JS GRAVITY <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: MATTER.JS GRAVITY (Physics Playground)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply PHYSICS GRAVITY aesthetics. Elements MUST fall with gravity, bounce off walls, be draggable and throwable with matter.js physics.

**CORE MECHANIC:** Elements fall with gravity and collide.

**NOTE:** Full physics requires matter-js library. For CSS-only approximation:

**CSS APPROXIMATION:**
\`\`\`html
<div class="min-h-screen bg-white relative overflow-hidden">
  <!-- Floor -->
  <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/10"></div>
  
  <!-- Falling tags with staggered animation -->
  <div class="absolute animate-fall" style="top: -50px; left: 20%; animation-delay: 0s;">
    <span class="px-4 py-2 bg-red-500 text-white rounded-full font-medium">React</span>
  </div>
  <div class="absolute animate-fall" style="top: -50px; left: 40%; animation-delay: 0.2s;">
    <span class="px-4 py-2 bg-blue-500 text-white rounded-full font-medium">TypeScript</span>
  </div>
  <div class="absolute animate-fall" style="top: -50px; left: 60%; animation-delay: 0.4s;">
    <span class="px-4 py-2 bg-green-500 text-white rounded-full font-medium">Node.js</span>
  </div>
</div>
<!-- Keyframe: fall from top:-50px to bottom:20px with bounce easing -->
\`\`\`

${request.styleDirective}`;
    }
    
    // PIXELATED DISSOLVE - 8-bit transition
    else if (styleName.includes("pixelated") || styleName.includes("dissolve") || styleName.includes("8-bit")) {
      console.log("[transmute] >>> MATCHED: PIXELATED DISSOLVE <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: PIXELATED DISSOLVE (Retro Transition)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply PIXELATED DISSOLVE aesthetics. Images MUST enter/exit dissolving into large pixel blocks with animated opacity wave pattern.

**CORE MECHANIC:** Images dissolve into/from large pixel blocks.

**VISUAL:**
- Grid of squares with staggered opacity animation
- image-rendering: pixelated during transition
- Wave pattern for dissolve order

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="relative w-64 h-64 overflow-hidden" style="image-rendering: pixelated;">
  <img src="image.jpg" class="w-full h-full object-cover" />
  <div class="absolute inset-0 grid grid-cols-8 grid-rows-8">
    <!-- 64 pixel blocks with staggered opacity -->
    <div class="bg-black animate-pixel-fade" style="animation-delay: 0ms;"></div>
    <div class="bg-black animate-pixel-fade" style="animation-delay: 50ms;"></div>
    <div class="bg-black animate-pixel-fade" style="animation-delay: 100ms;"></div>
    <!-- ... 64 total blocks with increasing delays -->
  </div>
</div>
<!-- Keyframe: pixel-fade from opacity-1 to opacity-0 -->
\`\`\`

${request.styleDirective}`;
    }
    
    // CYCLIC GALLERY - Fortune wheel rotation
    else if (styleName.includes("cyclic") || styleName.includes("fortune wheel") || styleName.includes("circular gallery")) {
      console.log("[transmute] >>> MATCHED: CYCLIC ROTATION GALLERY <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: CYCLIC ROTATION GALLERY (Fortune Wheel)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply CYCLIC ROTATION GALLERY aesthetics. Items MUST be arranged on invisible circle, scroll rotates the wheel, items counter-rotate to stay upright.

**CORE MECHANIC:** Items arranged on giant invisible circle, scroll rotates wheel.

**MATH:**
- Radius: 1500px (large, positioned off-screen)
- Position: x = radius * cos(angle), y = radius * sin(angle)
- Scroll maps to rotation offset
- Items counter-rotate to stay upright

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="h-[300vh]">
  <div class="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
    <div class="relative" style="width: 100%; height: 100%;">
      <div class="absolute" style="left: 50%; top: 50%; transform: translate(-50%, 200%) rotate(0deg);">
        <img src="1.jpg" class="w-48 h-64 object-cover rounded-lg" style="transform: rotate(0deg);" />
      </div>
      <div class="absolute" style="left: 50%; top: 50%; transform: translate(-50%, 200%) rotate(72deg);">
        <img src="2.jpg" class="w-48 h-64 object-cover rounded-lg" style="transform: rotate(-72deg);" />
      </div>
      <!-- More items at 144deg, 216deg, 288deg -->
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // ACCORDION FOLD 3D - Paper unfold
    else if (styleName.includes("accordion") || styleName.includes("fold 3d") || styleName.includes("paper fold")) {
      console.log("[transmute] >>> MATCHED: ACCORDION FOLD 3D <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: ACCORDION FOLD 3D (Paper Map Unfold)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply 3D ACCORDION FOLD aesthetics. Sections MUST fold/unfold like paper with CSS 3D transforms, crease shadows, and depth.

**CORE MECHANIC:** Content unfolds vertically like paper accordion.

**CSS 3D:**
- Slices: 4 horizontal stripes
- Even slices: transform-origin: top
- Odd slices: transform-origin: bottom
- Animation: rotateX(-90deg) → rotateX(0deg)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="max-w-2xl mx-auto py-20" style="perspective: 1200px;">
  <div style="transform-style: preserve-3d;">
    <div class="bg-gray-100 p-8 origin-bottom transition-all duration-700 hover:rotate-x-0" style="transform: rotateX(-20deg);">
      <div class="absolute inset-0 bg-black/10 pointer-events-none"></div>
      <h2 class="text-2xl font-bold">Panel 1</h2>
    </div>
    <div class="bg-white p-8 origin-top transition-all duration-700">
      <h2 class="text-2xl font-bold">Panel 2</h2>
    </div>
    <div class="bg-gray-50 p-8 origin-bottom transition-all duration-700" style="transform: rotateX(20deg);">
      <h2 class="text-2xl font-bold">Panel 3</h2>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // SKEUOMORPHIC CONTROLS - Physical switches
    else if (styleName.includes("skeuomorphic") || styleName.includes("physical switch") || styleName.includes("rocker")) {
      console.log("[transmute] >>> MATCHED: SKEUOMORPHIC CONTROLS <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SKEUOMORPHIC CONTROLS (Physical Switches)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SKEUOMORPHIC SWITCH aesthetics. Toggles MUST look like physical switches with realistic depth, lighting, and spring animation.

**CORE MECHANIC:** UI elements look/feel like physical plastic/metal switches.

**3D CSS:**
- Toggle: rotateX(15deg) OFF, rotateX(-15deg) ON
- Lighting: Top inner shadow for depth
- Shadow: Changes size based on state (distance from plate)
- Texture: Subtle noise texture on plastic surface

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-[#2a2a2a] p-20" style="background-image: url('data:image/svg+xml,...noise...');">
  <div class="inline-block p-1 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg" style="box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
    <button class="relative w-16 h-20 rounded-md transition-transform duration-100 cursor-pointer"
            x-data="{ on: false }" @click="on = !on"
            :style="on ? 'transform: perspective(200px) rotateX(-15deg); background: linear-gradient(to bottom, #4ade80, #22c55e);' : 'transform: perspective(200px) rotateX(15deg); background: linear-gradient(to bottom, #6b7280, #4b5563);'"
            style="box-shadow: inset 0 2px 0 rgba(255,255,255,0.3), 0 4px 8px rgba(0,0,0,0.3);">
    </button>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // SPLIT CURTAIN REVEAL - Dual panel theater
    else if (styleName.includes("split curtain") || styleName.includes("dual panel") || styleName.includes("theater")) {
      console.log("[transmute] >>> MATCHED: SPLIT CURTAIN REVEAL <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: SPLIT CURTAIN REVEAL (Theater Entrance)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply SPLIT CURTAIN REVEAL aesthetics. Screen MUST split Left/Right to reveal content, typography splits apart dramatically.

**CORE MECHANIC:** Screen splits Left/Right to reveal content.

**DOM STRUCTURE:**
- div.left-panel: width 50%, left 0
- div.right-panel: width 50%, right 0
- div.content-behind: z-0, fixed

**ANIMATION:**
- Left: translateX(-100%)
- Right: translateX(100%)
- Easing: [0.8, 0, 0.1, 1] (slow start, instant finish)

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="relative min-h-screen overflow-hidden" x-data="{ open: false }" x-init="setTimeout(() => open = true, 500)">
  <!-- Content behind -->
  <div class="fixed inset-0 z-0 bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
    <h1 class="text-8xl font-black text-white">WELCOME</h1>
  </div>
  <!-- Left curtain -->
  <div class="fixed inset-y-0 left-0 w-1/2 bg-black z-10 transition-transform duration-1000"
       :class="open ? '-translate-x-full' : 'translate-x-0'"
       style="transition-timing-function: cubic-bezier(0.8, 0, 0.1, 1);">
    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-6xl font-black text-white/20">WEL</span>
  </div>
  <!-- Right curtain -->
  <div class="fixed inset-y-0 right-0 w-1/2 bg-black z-10 transition-transform duration-1000"
       :class="open ? 'translate-x-full' : 'translate-x-0'"
       style="transition-timing-function: cubic-bezier(0.8, 0, 0.1, 1);">
    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-6xl font-black text-white/20">COME</span>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // DRAGGABLE MASONRY - Physics grid
    else if (styleName.includes("draggable masonry") || styleName.includes("physics grid") || styleName.includes("drag masonry")) {
      console.log("[transmute] >>> MATCHED: DRAGGABLE MASONRY <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: DRAGGABLE MASONRY (Physics Grid)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply DRAGGABLE MASONRY aesthetics. Grid items MUST be draggable with physics, other items push/settle around moved item.

**CORE MECHANIC:** Asymmetric grid where elements can be dragged/thrown.

**CSS Grid + Drag:**
- grid-template-columns: repeat(auto-fill, minmax(250px, 1fr))
- Cards are draggable
- On release: Snap to nearest grid slot with spring

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-gray-100 p-8">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[200px]">
    <div class="bg-pink-400 rounded-xl p-6 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform row-span-2"
         draggable="true">
      <h3 class="text-xl font-bold text-white">Card 1</h3>
    </div>
    <div class="bg-blue-400 rounded-xl p-6 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
         draggable="true">
      <h3 class="text-xl font-bold text-white">Card 2</h3>
    </div>
    <div class="bg-yellow-400 rounded-xl p-6 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform col-span-2"
         draggable="true">
      <h3 class="text-xl font-bold text-white">Card 3</h3>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // HORIZONTAL INERTIA GALLERY - Skew scroll
    else if (styleName.includes("horizontal inertia") || styleName.includes("skew scroll") || styleName.includes("inertia gallery")) {
      console.log("[transmute] >>> MATCHED: HORIZONTAL INERTIA GALLERY <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: HORIZONTAL INERTIA GALLERY (Skew Scroll)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply HORIZONTAL INERTIA GALLERY aesthetics. Vertical scroll MUST drive horizontal movement with velocity-based skew distortion.

**CORE MECHANIC:** Vertical scroll drives horizontal movement with velocity-based skew.

**LOGIC:**
- Map scrollYProgress to horizontal X position
- Calculate velocity from scroll speed
- Apply skewX based on velocity: fast scroll = tilted images

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="h-[300vh]">
  <div class="sticky top-0 h-screen overflow-hidden">
    <div class="flex items-center h-full gap-8 px-8 transition-transform duration-300"
         x-data="{ x: 0, skew: 0 }"
         :style="'transform: translateX(' + x + '%) skewX(' + skew + 'deg)'">
      <div class="flex-shrink-0 w-[400px] h-[500px] rounded-2xl overflow-hidden">
        <img src="1.jpg" class="w-full h-full object-cover" />
      </div>
      <div class="flex-shrink-0 w-[400px] h-[500px] rounded-2xl overflow-hidden">
        <img src="2.jpg" class="w-full h-full object-cover" />
      </div>
      <!-- More images -->
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // LIQUID TEXT MASK - Video in typography
    else if (styleName.includes("liquid text") || styleName.includes("video text") || styleName.includes("text mask video")) {
      console.log("[transmute] >>> MATCHED: LIQUID TEXT MASKING <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: LIQUID TEXT MASKING (Video in Typography)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply LIQUID TEXT MASK aesthetics. Text MUST act as mask revealing video/animated gradient underneath via background-clip: text.

**CORE MECHANIC:** Giant typography acts as window to video.

**VISUAL:**
- background-clip: text
- -webkit-text-fill-color: transparent
- Video as background
- Optional SVG goo filter for liquid edges

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen bg-black flex items-center justify-center overflow-hidden">
  <div class="relative">
    <video autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover">
      <source src="video.mp4" type="video/mp4" />
    </video>
    <h1 class="relative text-[20vw] font-black leading-none"
        style="background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-image: linear-gradient(to right, white, white);">
      LIQUID
    </h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // NOISE GRADIENT - Canvas grain
    else if (styleName.includes("noise gradient") || styleName.includes("canvas grain") || styleName.includes("perlin")) {
      console.log("[transmute] >>> MATCHED: DYNAMIC NOISE GRADIENT <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: DYNAMIC NOISE GRADIENT (Canvas Grain)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply DYNAMIC NOISE GRADIENT aesthetics. Background MUST have animated gradient with SVG noise/dithering overlay for aurora feel.

**CORE MECHANIC:** Perlin noise mixing with colors in real-time.

**VISUAL:**
- Gradient base with multiple color points
- Noise overlay (SVG filter or canvas)
- Dithering for smooth transitions
- Aurora/TV static feel

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="min-h-screen relative overflow-hidden">
  <!-- Animated gradient base -->
  <div class="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 animate-gradient"></div>
  <!-- Noise overlay -->
  <div class="absolute inset-0 opacity-30 mix-blend-overlay"
       style="background-image: url('data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.7%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E');"></div>
  <!-- Content -->
  <div class="relative z-10 p-20">
    <h1 class="text-6xl font-bold text-white">Aurora Noise</h1>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // GLOBE DATA - 3D points sphere
    else if (styleName.includes("globe") || styleName.includes("data globe") || styleName.includes("3d sphere")) {
      console.log("[transmute] >>> MATCHED: GLOBE DATA <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: INTERACTIVE GLOBE DATA (WebGL Points)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply INTERACTIVE GLOBE aesthetics. MUST have 3D globe made of points/arcs that rotates, with mouse interaction highlighting regions.

**NOTE:** Full 3D requires Three.js/R3F. CSS approximation:

**CSS APPROXIMATION:**
\`\`\`html
<div class="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
  <div class="relative w-64 h-64">
    <!-- Globe circle -->
    <div class="absolute inset-0 rounded-full border border-cyan-500/20 animate-spin-slow"
         style="animation-duration: 20s;"></div>
    <div class="absolute inset-4 rounded-full border border-cyan-500/10 animate-spin-slow"
         style="animation-duration: 15s; animation-direction: reverse;"></div>
    <!-- Data points -->
    <div class="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style="top: 20%; left: 30%;"></div>
    <div class="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style="top: 40%; left: 60%; animation-delay: 0.5s;"></div>
    <div class="absolute w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style="top: 70%; left: 40%; animation-delay: 1s;"></div>
    <!-- Arc lines -->
    <svg class="absolute inset-0" viewBox="0 0 100 100">
      <path d="M30,20 Q50,50 60,40" fill="none" stroke="cyan" stroke-width="0.5" stroke-opacity="0.3" />
    </svg>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // VISCOUS HOVER - Displacement goo
    else if (styleName.includes("viscous") || styleName.includes("displacement") || styleName.includes("gooey")) {
      console.log("[transmute] >>> MATCHED: VISCOUS HOVER <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: VISCOUS HOVER (Displacement Goo)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply VISCOUS DISPLACEMENT aesthetics. Elements MUST warp/bulge with gooey SVG filter effect, merging and separating fluidly.

**CORE MECHANIC:** Images behave like liquid when touched.

**SVG GOO FILTER:**
\`\`\`html
<svg class="hidden">
  <defs>
    <filter id="goo">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
      <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
    </filter>
  </defs>
</svg>

<div class="flex gap-4" style="filter: url(#goo);">
  <div class="w-32 h-32 bg-pink-500 rounded-full hover:scale-110 transition-transform"></div>
  <div class="w-32 h-32 bg-purple-500 rounded-full hover:scale-110 transition-transform"></div>
  <!-- When circles overlap/touch, they merge like liquid -->
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // EXPLODED VIEW - 3D disassembly
    else if (styleName.includes("exploded") || styleName.includes("disassembly") || styleName.includes("3d parts")) {
      console.log("[transmute] >>> MATCHED: EXPLODED VIEW <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: EXPLODED VIEW SCROLL (3D Disassembly)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply EXPLODED PRODUCT VIEW aesthetics. Product/UI MUST disassemble into 3D parts on scroll, each part floating in space.

**CORE MECHANIC:** Parts separate on Z-axis based on scroll.

**CSS 3D APPROXIMATION:**
\`\`\`html
<div class="h-[300vh]">
  <div class="sticky top-0 h-screen flex items-center justify-center" style="perspective: 1000px;">
    <div class="relative" style="transform-style: preserve-3d;">
      <!-- Base layer -->
      <div class="w-64 h-40 bg-gray-800 rounded-lg" style="transform: translateZ(0px);"></div>
      <!-- Middle layer -->
      <div class="absolute inset-x-4 top-4 h-32 bg-gray-600 rounded" style="transform: translateZ(30px);"></div>
      <!-- Top layer -->
      <div class="absolute inset-x-8 top-8 h-24 bg-gray-400 rounded" style="transform: translateZ(60px);"></div>
      <!-- Label -->
      <div class="absolute -right-32 top-0 text-sm text-white/60" style="transform: translateZ(60px);">
        ← Top Cover
      </div>
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // HELIX TYPOGRAPHY - DNA cylinder text
    else if (styleName.includes("helix") || styleName.includes("dna") || styleName.includes("cylinder text")) {
      console.log("[transmute] >>> MATCHED: HELIX TYPOGRAPHY <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: HELIX TYPOGRAPHY (DNA Scroll)**

⚠️ **MANDATORY OVERRIDE - IGNORE VIDEO STYLING:**
Copy CONTENT from the video but apply HELIX TYPOGRAPHY aesthetics. Text MUST wrap around invisible 3D cylinder, scroll rotates container, back-facing letters dimmer.

**CORE MECHANIC:** Text rotates around 3D cylinder axis.

**CSS 3D:**
- Each character: rotateY(index * (360/total))
- translateZ for radius
- Back-facing letters dimmer via cos(angle) opacity

**EXAMPLE OUTPUT:**
\`\`\`html
<div class="h-[200vh]">
  <div class="sticky top-0 h-screen flex items-center justify-center" style="perspective: 1000px;">
    <div class="relative" style="transform-style: preserve-3d; animation: spin 10s linear infinite;">
      <span class="absolute text-6xl font-bold text-white" style="transform: rotateY(0deg) translateZ(200px);">R</span>
      <span class="absolute text-6xl font-bold text-white/70" style="transform: rotateY(45deg) translateZ(200px);">E</span>
      <span class="absolute text-6xl font-bold text-white/40" style="transform: rotateY(90deg) translateZ(200px);">P</span>
      <span class="absolute text-6xl font-bold text-white/20" style="transform: rotateY(135deg) translateZ(200px);">L</span>
      <!-- More letters continuing around -->
    </div>
  </div>
</div>
\`\`\`

${request.styleDirective}`;
    }
    
    // ORIGINAL - Faithful 1:1 reconstruction from video
    else if (styleName === "original" || styleName.includes("1:1 copy") || styleName.includes("exact match")) {
      console.log("[transmute] >>> MATCHED: ORIGINAL (1:1 Reconstruction) <<<");
      expandedStyleDirective = `${GLOBAL_STANDARDS}

**STYLE: ORIGINAL - FAITHFUL VIDEO RECONSTRUCTION**

This is "Extract & Apply" mode. Your goal is REVERSE ENGINEERING the design from the video.
DO NOT invent a new style. Create a faithful reconstruction of the video's visual design system.

**STRUCTURE:** 1:1 match - Everything you see in the video MUST be in the code.

**COLORS - Sample directly from video:**
- Extract the exact primary, secondary, and background colors you observe
- Use Tailwind arbitrary values (bg-[#1a1a1a]) or closest standard palette (bg-slate-900)
- Match the color hierarchy exactly as shown

**TYPOGRAPHY:**
- Identify the font family feel (e.g., "Looks like Inter, SF Pro, or Helvetica" = font-sans)
- Match the weight hierarchy (headings heavier than body)
- Match the sizing scale observed in the video

**BORDER-RADIUS - Estimate visually:**
- Sharp corners = rounded-none
- Slightly rounded = rounded-md
- Very rounded = rounded-xl or rounded-2xl
- Pills/circles = rounded-full

**SPACING - Estimate visually:**
- Tight spacing = smaller padding/margins
- Generous spacing = larger padding/margins
- Match the proportions you see

**SHADOWS & EFFECTS:**
- Observe if elements have shadows (subtle, heavy, or none)
- Match any gradients, borders, or special effects

**OUTPUT:** Your generated code should look like a screenshot of the original video.

${request.styleDirective}`;
    }
    else {
      // Default: Apply global standards to any unmatched style
      console.log("[transmute] >>> NO STYLE MATCHED - using DEFAULT <<<");
      console.log("[transmute] styleName was:", `"${styleName}"`);
      expandedStyleDirective = `${GLOBAL_STANDARDS}

${request.styleDirective}

**ADDITIONAL REQUIREMENTS:**
- Use modern animation techniques (stagger, spring physics)
- Apply hover states to all interactive elements
- Ensure smooth transitions (0.3-0.8s duration)
- Mobile-responsive with touch-friendly targets`;
    }

    // Add database context if user has connected Supabase
    const databaseSection = request.databaseContext ? `

**DATABASE INTEGRATION (USER HAS CONNECTED SUPABASE):**
${request.databaseContext}

When generating code, use the exact table and column names from the schema above.
Generate proper data fetching code that works with the user's real database.
` : '';

    const userPrompt = `${SYSTEM_PROMPT}

**STYLE DIRECTIVE:** "${expandedStyleDirective}"
${styleReferenceInstruction}
${databaseSection}
**⚠️ COMPLETE INTERFACE RECONSTRUCTION - MANDATORY:**

**STEP 1: EXTRACT ALL NAVIGATION (before generating code)**
□ List EVERY sidebar menu item (OCR all text)
□ List EVERY header tab/button
□ List EVERY "Show more" / "Pokaż" link
□ List EVERY card title in dashboard
□ Count: You should have 15-30+ navigation items for complex apps

**STEP 2: FOR EACH NAVIGATION ITEM → CREATE PAGE**
- Generate @click handler: @click="currentPage = 'item-slug'"
- Generate x-show section: <main x-show="currentPage === 'item-slug'">
- If visited in video → Full content reconstruction
- If NOT visited → Smart placeholder with relevant content based on name

**STEP 3: CONTENT EXTRACTION**
□ OCR ALL visible text (labels, descriptions, values)
□ Capture ALL cards/sections structure
□ Note ALL buttons and their labels
□ Extract table structures if visible
□ Capture form fields if visible

**COMPLETENESS CHECK:**
- Sidebar should have ALL menu items clickable
- Header tabs should ALL work
- Dashboard cards should ALL link to their pages
- Every "Pokaż >" arrow should navigate somewhere

**EXAMPLE OUTPUT FOR GOVERNMENT APP:**
If video shows 20 menu items → Your sidebar MUST have 20 buttons
If video shows 12 dashboard cards → Generate 12 card sections + their target pages

**DO NOT SIMPLIFY OR SKIP ITEMS!**
The output should be as complex as the input video.

**CONTENT EXTRACTION:**
- Extract ALL visible text from EVERY screen (OCR everything)
- Capture EVERY UI element: buttons, cards, thumbnails, icons, labels
- Match the layout and structure exactly (sidebar, header, content grid, etc.)
- Include ALL interactive elements (buttons, links, tabs)

**OUTPUT STRUCTURE:**
- Use Alpine.js x-data and x-show for page switching
- Navigation should work to switch between confirmed pages
- Each confirmed page should have its actual content from the video
- Include CSS for the exact styling seen in the video

**EXAMPLE:** If video shows YouTube with Home, then clicks Shorts:
- Navigation: Home, Shorts, Subscriptions, Library, History
- CONFIRMED (generate full content): Home page, Shorts page  
- POSSIBLE (comment only): Subscriptions, Library, History

Generate the complete HTML now, including EVERYTHING from the video.`;

    // Build parts array - video first, then style reference image if provided, then prompt
    const contentParts: any[] = [videoPart];
    if (styleImagePart) {
      contentParts.push(styleImagePart);
    }
    contentParts.push({ text: userPrompt });
    
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: contentParts,
        },
      ],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        maxOutputTokens: 32768,
      },
    });

    let code = result.response.text();
    console.log("Generation complete, length:", code.length);
    
    // Extract token usage from response
    const usageMetadata = result.response.usageMetadata;
    const tokenUsage = {
      promptTokens: usageMetadata?.promptTokenCount || 0,
      candidatesTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0,
    };
    console.log("Token usage:", tokenUsage);
    
    // Clean up response
    code = code.replace(/^```html?\n?/gm, "");
    code = code.replace(/```$/gm, "");
    code = code.trim();
    
    // Ensure it starts with DOCTYPE
    if (!code.toLowerCase().startsWith("<!doctype")) {
      const htmlMatch = code.match(/<!DOCTYPE[\s\S]*<\/html>/i);
      if (htmlMatch) {
        code = htmlMatch[0];
      }
    }

    // Validate HTML
    if (!code.includes("<html") || !code.includes("</html>")) {
      return {
        success: false,
        error: "Generated output is not valid HTML. Please try again.",
      };
    }

    return {
      success: true,
      code,
      tokenUsage,
      analysis: {
        interactions: ["Click handlers", "Hover effects", "Transitions"],
        components: ["Layout", "Navigation", "Content"],
        animations: ["Fade in", "Slide up", "Hover lift"],
        dataExtracted: ["Text content", "UI structure"],
      },
    };
  } catch (error: any) {
    console.error("Transmute error:", error);
    
    // Better error messages - keep them short
    let errorMessage = error.message || "Unknown error occurred";
    const errorLower = errorMessage.toLowerCase();
    
    // Log the full error for debugging
    console.error("Full error details:", {
      message: error.message,
      name: error.name,
      stack: error.stack?.slice(0, 500),
    });
    
    // Short, clear error messages
    if (errorLower.includes("429") || errorLower.includes("quota")) {
      errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
    } else if (errorLower.includes("403") || errorLower.includes("forbidden")) {
      errorMessage = "API access denied. Please contact support.";
    } else if (errorLower.includes("resource_exhausted") || errorLower.includes("too large")) {
      errorMessage = "Video too large. Try under 15 seconds.";
    } else if (errorLower.includes("deadline exceeded") || errorLower.includes("timeout")) {
      errorMessage = "Processing timeout. Try a shorter video.";
    } else if (errorLower.includes("failed to fetch video from storage")) {
      errorMessage = "Could not load video. Please try uploading again.";
    } else if (errorLower.includes("400") || errorLower.includes("bad request") || errorLower.includes("unsupported") || 
               errorLower.includes("error encountered") || errorLower.includes("invalid_argument") || errorLower.includes("inline data")) {
      // Gemini API processing error
      errorMessage = "Video processing failed. Please try a different video or shorter clip.";
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Edit code with AI - now supports image data
export async function editCodeWithAI(
  currentCode: string,
  editRequest: string,
  images?: { base64?: string; url?: string; mimeType: string; name: string }[],
  databaseContext?: string
): Promise<TransmuteResponse> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY not found",
    };
  }

  // Validate images - accept either base64 or URL
  const validImages = images?.filter(img => (img.base64 && img.base64.length > 100) || img.url) || [];
  console.log(`[editCodeWithAI] Received ${images?.length || 0} images, ${validImages.length} valid`);
  
  // Convert URL images to base64 (Gemini API requires base64, not URLs)
  const processedImages: { base64: string; mimeType: string; name: string; url?: string }[] = [];
  
  for (const img of validImages) {
    if (img.url && !img.base64) {
      // Fetch image from URL and convert to base64
      try {
        console.log(`[editCodeWithAI] Fetching image from URL: ${img.url.substring(0, 80)}...`);
        const response = await fetch(img.url);
        if (!response.ok) {
          console.error(`[editCodeWithAI] Failed to fetch image: ${response.status}`);
          continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType = response.headers.get('content-type') || 'image/png';
        
        processedImages.push({
          base64,
          mimeType: contentType,
          name: img.name,
          url: img.url,
        });
        console.log(`[editCodeWithAI] Converted URL image to base64, length: ${base64.length}`);
      } catch (e) {
        console.error(`[editCodeWithAI] Error fetching image from URL:`, e);
      }
    } else if (img.base64) {
      processedImages.push({
        base64: img.base64,
        mimeType: img.mimeType,
        name: img.name,
        url: img.url,
      });
      console.log(`[editCodeWithAI] Using provided base64, length: ${img.base64.length}`);
    }
  }
  
  console.log(`[editCodeWithAI] Processed ${processedImages.length} images for Gemini`);

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview", // Same model as video analysis - best quality
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 100000,
      },
    });

    // Build image data URLs for embedding in HTML
    const imageDataUrls = processedImages.map(img => 
      img.url ? img.url : `data:${img.mimeType};base64,${img.base64}`
    );
    
    // Check if this is a request to create a new page (starts with @PageName)
    const newPageMatch = editRequest.match(/^@(\w+)\s*(.*)/i);
    const isNewPageRequest = newPageMatch !== null;
    const newPageName = newPageMatch ? newPageMatch[1] : null;
    const pageContent = newPageMatch ? newPageMatch[2] : editRequest;
    
    console.log(`[editCodeWithAI] isNewPageRequest: ${isNewPageRequest}, newPageName: ${newPageName}`);
    
    let prompt: string;
    
    if (isNewPageRequest && newPageName) {
      // FULL AI APPROACH - AI does everything intelligently
      console.log(`[editCodeWithAI] Creating new page with AI: ${newPageName}`);
      
      const pageNameLower = newPageName.toLowerCase();
      
      // Extract key parts for context (not full code - too long)
      const navMatch = currentCode.match(/<nav[^>]*>[\s\S]*?<\/nav>/i);
      const headerMatch = currentCode.match(/<header[^>]*>[\s\S]*?<\/header>/i);
      const mainMatch = currentCode.match(/<main[^>]*x-show[^>]*home[^>]*>[\s\S]*?<\/main>/i);
      const footerMatch = currentCode.match(/<footer[^>]*>[\s\S]*?<\/footer>/i);
      const headMatch = currentCode.match(/<head[^>]*>[\s\S]*?<\/head>/i);
      
      const navHtml = navMatch?.[0] || headerMatch?.[0] || '';
      const mainHtml = mainMatch?.[0]?.slice(0, 5000) || '';
      const footerHtml = footerMatch?.[0]?.slice(0, 1000) || '';
      const headHtml = headMatch?.[0] || '';
      
      // Extract colors
      const colorMatches = currentCode.match(/(?:bg|text|border)-\[#[a-fA-F0-9]+\]/g) || [];
      const colors = [...new Set(colorMatches)].slice(0, 8);
      
      // Check if Alpine.js is used
      const usesAlpine = currentCode.includes('x-data') || currentCode.includes('x-show');
      
      const fullPrompt = `You are an expert web developer. Your task: ADD a new "${newPageName}" page to this website.

USER REQUEST: ${pageContent || `Create a ${newPageName} page`}

SITE CONTEXT:
- Colors: ${colors.join(', ')}
- Uses Alpine.js: ${usesAlpine}

NAVIGATION (find "${newPageName}" link and add @click handler):
${navHtml}

EXAMPLE PAGE STYLE (match this):
${mainHtml.slice(0, 3000)}

=== YOUR TASK ===

1. Return COMPLETE HTML document (keep everything, add new page)

2. ADD this new <main> section BEFORE <footer>:
<main x-show="currentPage === '${pageNameLower}'" x-cloak
      x-transition:enter="transition ease-out duration-500"
      x-transition:enter-start="opacity-0 transform translate-y-10"
      x-transition:enter-end="opacity-100 transform translate-y-0"
      class="pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto space-y-24">
  
  <!-- HERO SECTION - Big title, description, image -->
  <section class="grid lg:grid-cols-2 gap-12 items-center">
    <div class="space-y-8">
      <h1 class="text-5xl md:text-7xl font-bold">${newPageName} Title Here</h1>
      <p class="text-xl text-slate-600">Description paragraph here...</p>
      <button class="...">CTA Button</button>
    </div>
    <div>
      <img src="https://picsum.photos/seed/${pageNameLower}hero/800/600" class="rounded-3xl w-full" />
    </div>
  </section>

  <!-- FEATURES - 3-4 cards with images -->
  <section class="grid md:grid-cols-3 gap-8">
    <!-- Card 1 -->
    <div class="...">
      <img src="https://picsum.photos/seed/${pageNameLower}1/400/300" />
      <h3>Feature 1</h3>
      <p>Description</p>
    </div>
    <!-- Card 2, 3, 4... -->
  </section>

  <!-- STATS SECTION -->
  <section class="grid grid-cols-2 md:grid-cols-4 gap-8">
    <div><span class="text-4xl font-bold">10K+</span><p>Users</p></div>
    <!-- More stats... -->
  </section>

  <!-- CTA SECTION -->
  <section class="text-center py-20 bg-gradient-to-r ... rounded-3xl">
    <h2>Call to Action</h2>
    <button>Get Started</button>
  </section>
</main>

3. NAVIGATION: Find <a ...>${newPageName}</a> and change to:
   <a href="#" @click.prevent="currentPage = '${pageNameLower}'">${newPageName}</a>

4. Use REAL images: https://picsum.photos/seed/[unique-keyword]/800/600

5. Generate AT LEAST 150 lines of HTML for the new page content!
${databaseContext ? `
DATABASE INTEGRATION (USER HAS CONNECTED SUPABASE):
${databaseContext}
Use these exact table/column names when generating data fetching code.
` : ''}
CURRENT FULL CODE:
${currentCode}

Return ONLY complete HTML. No markdown, no explanations.`;

      try {
        const result = await model.generateContent([{ text: fullPrompt }]);
        let generatedCode = result.response.text();
        generatedCode = generatedCode.replace(/^```html?\n?/gm, "").replace(/```$/gm, "").trim();
        
        console.log(`[editCodeWithAI] AI response length: ${generatedCode.length}, original: ${currentCode.length}`);
        
        // Validate - must have DOCTYPE and new page
        const hasDoctype = generatedCode.includes('<!DOCTYPE') || generatedCode.includes('<!doctype');
        const hasNewPage = generatedCode.toLowerCase().includes(`currentpage === '${pageNameLower}'`);
        const isLongEnough = generatedCode.length > currentCode.length * 0.9;
        
        console.log(`[editCodeWithAI] Validation: DOCTYPE=${hasDoctype}, newPage=${hasNewPage}, length=${isLongEnough}`);
        
        if (hasDoctype && hasNewPage && isLongEnough) {
          console.log(`[editCodeWithAI] AI SUCCESS! Returning generated code`);
          return { success: true, code: generatedCode, codeLength: generatedCode.length };
        }
        
        // If AI returned something but validation failed, try to salvage
        if (generatedCode.length > 1000 && hasNewPage) {
          console.log(`[editCodeWithAI] Partial success - using AI response anyway`);
          return { success: true, code: generatedCode, codeLength: generatedCode.length };
        }
        
        console.log(`[editCodeWithAI] AI validation failed, will return error`);
      } catch (e) {
        console.error(`[editCodeWithAI] AI error:`, e);
      }
      
      // Return error instead of fallback - user wants AI or nothing
      return { 
        success: false, 
        error: `AI failed to generate ${newPageName} page. Please try again.`,
        code: currentCode,
        codeLength: currentCode.length 
      };
    } else {
      // STANDARD EDIT PROMPT
      prompt = `You are an expert HTML/JavaScript developer. Modify this code based on the request.

REQUEST: ${editRequest}

${processedImages.length > 0 ? `USER PROVIDED ${processedImages.length} IMAGE(S):
${processedImages.map((img, i) => `Image ${i+1}: "${img.name}" - Use this in your HTML where the user wants it`).join('\n')}

CRITICAL: I am showing you the actual image data. When user asks to add/use/replace with these images, embed them using:
<img src="${imageDataUrls[0] || 'IMAGE_URL'}" alt="${processedImages[0]?.name || 'image'}" class="..." />
` : ''}
${databaseContext ? `
🔥 DATABASE CONNECTION ACTIVE - USER HAS SUPABASE CONNECTED! 🔥
${databaseContext}

CRITICAL INSTRUCTIONS FOR DATABASE:
1. DO NOT use mock/fake data! Generate REAL JavaScript code to fetch from Supabase
2. Add this script in <head> BEFORE any other scripts:
   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

3. Initialize Supabase in a <script> tag:
   const SUPABASE_URL = localStorage.getItem('replay_supabase_url') || '';
   const SUPABASE_KEY = localStorage.getItem('replay_supabase_key') || '';
   const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

4. Fetch data using Alpine.js x-data with async init:
   x-data="{
     items: [],
     loading: true,
     async init() {
       const { data } = await supabase.from('TABLE_NAME').select('*');
       this.items = data || [];
       this.loading = false;
     }
   }"

5. Use x-for to loop through real data:
   <template x-for="item in items" :key="item.id">
     <div x-text="item.column_name"></div>
   </template>

6. Show loading state: <div x-show="loading">Loading...</div>

USE THE EXACT TABLE AND COLUMN NAMES FROM THE SCHEMA ABOVE!
` : ''}
CURRENT CODE:
${currentCode}

RULES:
1. Return COMPLETE HTML starting with <!DOCTYPE html>
2. Keep ALL existing content
3. Match existing styling
${databaseContext ? '4. MUST use real Supabase fetch code - NO mock data!' : ''}
5. NO markdown, NO explanations - ONLY HTML code`;
    }

    // Build content parts for Gemini
    const contentParts: any[] = [{ text: prompt }];
    
    // Add images as inline data for Gemini to see
    if (processedImages.length > 0) {
      for (const img of processedImages) {
        if (img.base64) {
          contentParts.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64,
            }
          });
        }
      }
    }

    console.log(`[editCodeWithAI] Sending ${contentParts.length} parts to Gemini`);
    console.log(`[editCodeWithAI] Prompt length: ${prompt.length}, Code length: ${currentCode.length}`);
    
    const result = await model.generateContent(contentParts);
    let code = result.response.text();
    
    console.log(`[editCodeWithAI] Response received, length: ${code.length}`);
    console.log(`[editCodeWithAI] Response starts with: ${code.substring(0, 100)}`);
    console.log(`[editCodeWithAI] Response ends with: ${code.substring(code.length - 100)}`);
    
    // Check if code is too short (AI might have returned just a message)
    if (code.length < 500) {
      console.log('[editCodeWithAI] Response too short, might be an error message');
      // If it's not HTML, return error
      if (!code.includes('<html') && !code.includes('<!DOCTYPE')) {
        return {
          success: false,
          error: "AI returned invalid response. Try again.",
        };
      }
    }
    
    // Clean up markdown wrappers
    code = code.replace(/^```html?\n?/gm, "");
    code = code.replace(/```$/gm, "");
    code = code.trim();

    // Check if images were properly embedded
    if (processedImages.length > 0) {
      for (let i = 0; i < processedImages.length; i++) {
        const img = processedImages[i];
        const imageUrl = img.url || `data:${img.mimeType};base64,${img.base64}`;
        
        // Check if any form of the image is in the code
        const urlInCode = img.url && code.includes(img.url);
        const base64InCode = img.base64 && code.includes(img.base64.substring(0, 50));
        
        if (urlInCode || base64InCode) {
          console.log(`[editCodeWithAI] Image ${i} (${img.name}) found in output`);
          continue;
        }
        
        console.log(`[editCodeWithAI] Image ${i} (${img.name}) NOT found, will inject`);
        
        // Find placeholder and replace with image URL
        const imgTagRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
        let match;
        let replaced = false;
        
        while ((match = imgTagRegex.exec(code)) !== null) {
          const currentSrc = match[1];
          if (currentSrc.includes('placeholder') || currentSrc.includes('picsum') || 
              currentSrc.includes('placehold') || currentSrc === '' || currentSrc === '#' ||
              currentSrc.includes('unsplash') || currentSrc.includes('example')) {
            code = code.replace(match[0], match[0].replace(currentSrc, imageUrl));
            console.log(`[editCodeWithAI] Injected image ${i} URL`);
            replaced = true;
            break;
          }
        }
        
        if (!replaced) {
          console.log(`[editCodeWithAI] No placeholder found for image ${i}`);
        }
        continue;
        
        // Handle base64 images (legacy)
        if (!img.base64) continue;
        
        const dataUrl = `data:${img.mimeType};base64,${img.base64}`;
        const shortBase64Check = img.base64.substring(0, 100);
        
        // Check if the AI actually used the image data
        if (!code.includes(shortBase64Check)) {
          console.log(`[editCodeWithAI] Image ${i} (${img.name}) not found in output, attempting injection...`);
          
          // Find the first img tag that looks like a placeholder and replace it
          const imgTagRegex = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi;
          let match;
          let replaced = false;
          
          while ((match = imgTagRegex.exec(code)) !== null) {
            const currentSrc = match[1];
            // Skip if it's already a data URL with substantial data
            if (currentSrc.startsWith('data:') && currentSrc.length > 200) continue;
            
            // Replace placeholder URLs
            if (currentSrc.includes('placeholder') || 
                currentSrc.includes('picsum') || 
                currentSrc.includes('placehold') ||
                currentSrc.includes('logo') ||
                currentSrc.includes('via.placeholder') ||
                currentSrc === '' ||
                currentSrc === '#') {
              code = code.replace(match[0], match[0].replace(currentSrc, dataUrl));
              console.log(`[editCodeWithAI] Replaced placeholder src with image ${i}`);
              replaced = true;
              break;
            }
          }
          
          // If no placeholder found, try to add the image after the first h1 or at the top of body
          if (!replaced) {
            const imgTag = `<img src="${dataUrl}" alt="${img.name}" class="w-32 h-auto" />`;
            if (code.includes('</h1>')) {
              code = code.replace('</h1>', `</h1>\n${imgTag}`);
              console.log(`[editCodeWithAI] Injected image ${i} after first h1`);
            } else if (code.includes('<body')) {
              code = code.replace(/<body([^>]*)>/, `<body$1>\n${imgTag}`);
              console.log(`[editCodeWithAI] Injected image ${i} after body tag`);
            }
          }
        } else {
          console.log(`[editCodeWithAI] Image ${i} (${img.name}) found in output!`);
        }
      }
    }

    // Fix incomplete HTML - if AI returned partial response, wrap it
    if (!code.includes("<!DOCTYPE") && !code.includes("<html")) {
      console.log('[editCodeWithAI] AI returned partial HTML, attempting to fix...');
      
      // Check if it's a body fragment
      if (code.includes("<body") || code.includes("<div") || code.includes("<section")) {
        // Wrap in basic HTML structure, preserving Tailwind/Alpine
        code = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
${code.includes("<body") ? code : `<body class="bg-white">\n${code}\n</body>`}
</html>`;
        console.log('[editCodeWithAI] Wrapped partial HTML in document structure');
      } else {
        // AI returned something completely wrong - return original code with error
        console.log('[editCodeWithAI] AI response was not HTML at all, returning original');
        return {
          success: false,
          error: "AI didn't return valid HTML. Try a simpler edit request.",
        };
      }
    }
    
    // Final validation - just check for basic HTML structure
    if (!code.includes("<") || !code.includes(">")) {
      return {
        success: false,
        error: "Invalid response from AI",
      };
    }

    console.log('[editCodeWithAI] Success! Code length:', code.length);
    console.log('[editCodeWithAI] Code starts with:', code.substring(0, 100));
    console.log('[editCodeWithAI] Code ends with:', code.substring(code.length - 100));
    
    // Ensure code is a valid string
    if (!code || typeof code !== 'string' || code.length === 0) {
      console.error('[editCodeWithAI] Code is empty or invalid after processing');
      return {
        success: false,
        error: "Generated code is empty",
      };
    }
    
    return {
      success: true,
      code: code,
    };
  } catch (error: any) {
    console.error('[editCodeWithAI] Error:', error);
    return {
      success: false,
      error: error.message || "Edit failed",
    };
  }
}
