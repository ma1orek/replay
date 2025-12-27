"use server";

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TransmuteRequest, TransmuteResponse } from "@/types";

// Load API key from .env or .env.local
function getApiKey(): string | null {
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
const SYSTEM_PROMPT = `You are Replay, an elite UI Reverse-Engineering AI that creates STUNNING, award-winning websites.

**IMPORTANT:** You are receiving a VIDEO file, not a single image. You MUST analyze the ENTIRE video timeline, not just the first frame.

**TASK:** Watch this ENTIRE screen recording from beginning to end, analyze ALL screens/states/transitions shown, and generate a VISUALLY STUNNING single HTML file that replicates EVERYTHING you observe throughout the video - but make it BEAUTIFUL and modern.

**YOUR DESIGN PHILOSOPHY:**
- Create "WOW" moments that impress users instantly
- Use cinematic, smooth animations that feel premium
- Never leave empty spaces - fill with gradients, patterns, or subtle textures
- ALWAYS use working placeholder images - use https://picsum.photos/800/600 (add ?random=1, ?random=2 etc for different images)
- Alternative: https://placehold.co/800x600/1a1a1a/ffffff?text=Image for placeholder with text
- Think like a Dribbble designer or Awwwards winner
- NEVER use broken image URLs - picsum.photos is guaranteed to work

**OUTPUT FORMAT:** A single, complete HTML file with:
- Tailwind CSS via CDN for styling
- Alpine.js via CDN for interactivity
- CINEMATIC animations: staggered reveals, parallax-like effects, smooth transitions
- All text extracted via OCR from the video
- Fully responsive design
- Premium visual polish

**FONT CHOICES BY STYLE** (pick appropriate fonts from Google Fonts based on style):
- Apple/Minimal: SF Pro Display (or Outfit), system-ui
- Material You: Google Sans (or Poppins), Roboto
- Cyberpunk: Orbitron, Share Tech Mono
- Glassmorphism: Plus Jakarta Sans, DM Sans
- Dribbble/Candy: Nunito, Quicksand
- Enterprise: Source Sans 3, IBM Plex Sans
- Swiss: Helvetica Neue (or Figtree), Inter
- Brutalist: Bebas Neue, Archivo Black
- Linear/SaaS: Satoshi (or Manrope), Inter
- Spotify: Circular (or Montserrat), system-ui
- Notion: system-ui, Charter
- Dark Mode Premium: Space Grotesk, Inter
- Default: Inter, Space Grotesk

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
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Premium font stack */
    * { font-family: 'Inter', system-ui, sans-serif; }
    h1, h2, h3, h4 { font-family: 'Space Grotesk', 'Manrope', sans-serif; font-weight: 700; letter-spacing: -0.02em; }
    
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
    console.log("Fetching video from Supabase Storage...");
    const response = await fetch(request.videoUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch video from storage: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    console.log("Video fetched, base64 length:", base64.length);
    
    // Detect mime type from content-type header
    const contentType = response.headers.get("content-type") || "video/webm";
    console.log("Video content type:", contentType);
    
    const videoPart = {
      inlineData: {
        mimeType: contentType,
        data: base64,
      },
    };

    const userPrompt = `${SYSTEM_PROMPT}

**STYLE DIRECTIVE:** "${request.styleDirective}"

**CRITICAL VIDEO INSTRUCTIONS:**
1. This is a VIDEO recording, NOT a single image - watch the ENTIRE video from start to finish
2. Analyze ALL frames throughout the video duration to understand the full UI flow
3. Look for: navigation changes, hover states, click interactions, scrolling content, modal dialogs, transitions
4. The video may show multiple screens/states - include ALL of them in your generated code
5. If you see animations or transitions in the video, replicate them with CSS/Alpine.js
6. Extract text from ALL screens shown throughout the video

Now watch the complete video carefully and generate the HTML that includes everything you observed.`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            videoPart,
            { text: userPrompt },
          ],
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
      analysis: {
        interactions: ["Click handlers", "Hover effects", "Transitions"],
        components: ["Layout", "Navigation", "Content"],
        animations: ["Fade in", "Slide up", "Hover lift"],
        dataExtracted: ["Text content", "UI structure"],
      },
    };
  } catch (error: any) {
    console.error("Transmute error:", error);
    
    // Better error messages
    let errorMessage = error.message || "Unknown error occurred";
    
    if (errorMessage.includes("400") || errorMessage.includes("Bad Request")) {
      errorMessage = "Model error: The video format may not be supported or the request is invalid. Please try recording again.";
    } else if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
    } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
      errorMessage = "API access denied. Please check the API key.";
    } else if (errorMessage.includes("error encountered")) {
      errorMessage = "Model error: Please try again. If the issue persists, try with a shorter video.";
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Edit code with AI
export async function editCodeWithAI(
  currentCode: string,
  editRequest: string
): Promise<TransmuteResponse> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY not found",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview",
    });

    const prompt = `You are a code editor AI. You will receive HTML code and an edit request.
Apply the requested changes and return the COMPLETE modified HTML code.

**CURRENT CODE:**
${currentCode}

**EDIT REQUEST:**
${editRequest}

**INSTRUCTIONS:**
1. Apply the requested changes to the code
2. Keep all other parts of the code unchanged
3. Return ONLY the complete HTML code
4. NO explanations, NO markdown code blocks
5. Start with <!DOCTYPE html>`;

    const result = await model.generateContent(prompt);
    let code = result.response.text();
    
    // Clean up
    code = code.replace(/^```html?\n?/gm, "");
    code = code.replace(/```$/gm, "");
    code = code.trim();

    if (!code.includes("<html") || !code.includes("</html>")) {
      return {
        success: false,
        error: "Invalid HTML generated",
      };
    }

    return {
      success: true,
      code,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Edit failed",
    };
  }
}
