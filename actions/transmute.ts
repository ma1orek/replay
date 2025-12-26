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
const SYSTEM_PROMPT = `You are Replay, an expert UI Reverse-Engineering AI and code generator.

**IMPORTANT:** You are receiving a VIDEO file, not a single image. You MUST analyze the ENTIRE video timeline, not just the first frame.

**TASK:** Watch this ENTIRE screen recording from beginning to end, analyze ALL screens/states/transitions shown, and generate a STUNNING single HTML file that replicates EVERYTHING you observe throughout the video.

**OUTPUT FORMAT:** A single, complete HTML file with:
- Tailwind CSS via CDN for styling
- Alpine.js via CDN for interactivity
- Beautiful animations and transitions
- All text extracted via OCR from the video
- Responsive design

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
            'fade-in': 'fadeIn 0.5s ease-out',
            'slide-up': 'slideUp 0.6s ease-out',
            'scale-in': 'scaleIn 0.4s ease-out',
          },
          keyframes: {
            fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
            slideUp: { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
            scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
          }
        }
      }
    }
  </script>
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <!-- IMPORTANT: Choose appropriate Google Fonts based on the style directive -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Choose fonts based on the style - default below */
    * { font-family: 'Inter', system-ui, sans-serif; }
    h1, h2, h3 { font-family: 'Manrope', sans-serif; font-weight: 700; }
    
    /* Smooth transitions on everything */
    *, *::before, *::after {
      transition-property: background-color, border-color, color, fill, stroke, opacity, box-shadow, transform;
      transition-duration: 200ms;
      transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    /* Beautiful hover effects */
    .hover-lift { transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
    
    /* Gradient text */
    .gradient-text {
      background: linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    /* Glass effect */
    .glass { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2); }
    
    /* Animate on scroll simulation */
    [x-intersect] { opacity: 0; transform: translateY(20px); transition: opacity 0.6s, transform 0.6s; }
    [x-intersect].visible { opacity: 1; transform: translateY(0); }
  </style>
</head>
<body class="antialiased">
  <!-- Your generated content here -->
</body>
</html>

**CRITICAL REQUIREMENTS:**
1. Extract ALL visible text from the video (OCR)
2. Replicate the EXACT layout structure
3. Use BEAUTIFUL animations: fade-in, slide-up, hover effects, transitions
4. Make buttons and links interactive with Alpine.js (x-data, @click, x-show, x-transition)
5. Add hover states on all clickable elements
6. Use the color scheme you observe OR apply the style directive
7. Include micro-interactions (hover lift, button press, etc.)
8. Make it responsive with Tailwind breakpoints

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
    return {
      success: false,
      error: error.message || "Unknown error occurred",
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
