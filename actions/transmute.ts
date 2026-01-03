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

**MULTI-PAGE DETECTION - CRITICAL:**
- WATCH THE ENTIRE VIDEO - it may show MULTIPLE screens/pages/tabs
- If the video shows navigation between pages/routes → Generate ALL of them as separate x-show sections
- Each DISTINCT screen/view shown = a separate page with its OWN content
- If user clicks menu items (sidebar, header tabs, etc.) → Create page for EACH clicked destination
- DON'T generate everything as one page - use Alpine.js x-show to separate screens
- Count how many different screens appear - generate that many pages
- EVERY visible navigation item should be a working button

**SCREEN CHANGE INDICATORS (triggers new page):**
- URL visibly changes in address bar
- Content area completely changes
- Tab/menu item becomes highlighted
- New heading/title appears
- Layout significantly changes
- Breadcrumb changes

**CONFIRMED vs POSSIBLE:**
- CONFIRMED: Pages/views that were actually shown and navigated to in the video
- POSSIBLE: Navigation items that exist in the UI but were NOT clicked/visited in the video
- ONLY generate code for CONFIRMED pages - mark POSSIBLE ones with HTML comments

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
**⚠️ CRITICAL VIDEO ANALYSIS - READ CAREFULLY:**
1. This is a VIDEO - analyze from FIRST frame to LAST frame
2. COUNT how many DISTINCT screens/pages appear in the video
3. If content area changes completely = NEW PAGE
4. If tab/menu item gets highlighted = NEW PAGE  
5. For EACH unique screen → Create separate <main x-show="currentPage === 'pageName'"> section

**MULTI-PAGE OUTPUT REQUIRED:**
- DON'T put everything in one page
- Each screen change = new x-show section with unique page ID
- Navigation buttons must use @click="currentPage = 'targetPage'"
- ALL visited pages must have FULL content extracted from video

**DETECTION CHECKLIST (for each unique screen):**
□ Extract page title/heading
□ Extract ALL text content (OCR)
□ Capture layout structure
□ Note interactive elements
□ Create separate x-show section

**FLOW TRACKING - MANDATORY:**
- Frame 1: What is the initial screen?
- Track: Every click that changes content
- Track: Every tab/menu selection
- Track: Every significant layout change
- Output: One x-show section per unique screen

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
