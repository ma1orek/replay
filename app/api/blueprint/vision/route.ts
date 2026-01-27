import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// For Next.js App Router - route segment config
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const VISION_TO_CODE_PROMPT = `
**ROLE: UI SCREENSHOT TO CODE CONVERTER**

You are an expert at converting UI screenshots, Figma frames, and design mockups into clean, production-ready JSX/HTML code.

**CRITICAL: OUTPUT FORMAT**
Return ONLY the JSX markup - NO function wrapper, NO imports, NO export. Just the raw JSX that would go inside a return().
The code will be rendered in an iframe with Tailwind CSS available.

**ANALYSIS PROCESS:**
1. IDENTIFY the component type (card, button, form, hero, navbar, etc.)
2. ANALYZE the visual hierarchy (headings, subtext, actions)
3. DETECT colors, spacing, borders, shadows
4. RECOGNIZE patterns (flex layouts, grids, lists)
5. EXTRACT text content exactly as shown
6. IDENTIFY icons (use emoji equivalents or Lucide-like simple SVGs)

**OUTPUT RULES:**
1. Use Tailwind CSS classes exclusively
2. Match colors as closely as possible using Tailwind palette (zinc, slate, blue, etc.)
3. Preserve exact text content from the image
4. Use semantic HTML (button, nav, section, article, etc.)
5. For images in the design: use https://picsum.photos/seed/{descriptive-name}/W/H
6. For avatars: use https://i.pravatar.cc/150?img=X (X = 1-70)
7. For icons: use simple inline SVGs or emoji equivalents
8. Ensure responsive design with flex/grid
9. Add hover states where appropriate (hover:)
10. Match border-radius, shadows, spacing precisely

**COMPONENT CATEGORIES:**
- atoms: Single elements (buttons, badges, inputs, avatars)
- molecules: Combined elements (cards, form groups, nav items)
- organisms: Sections (headers, footers, sidebars, forms)
- templates: Full page layouts

**STYLE DETECTION:**
- Dark theme: Use bg-zinc-900, bg-zinc-800, text-white, text-zinc-400
- Light theme: Use bg-white, bg-zinc-50, text-zinc-900, text-zinc-500
- Glassmorphism: Use backdrop-blur, bg-white/10, border-white/20
- Gradients: Use bg-gradient-to-r, from-X, to-Y

**COMMON PATTERNS:**

Card with icon:
<div className="p-6 bg-zinc-900 rounded-xl border border-zinc-800">
  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
    <span className="text-xl">✨</span>
  </div>
  <h3 className="text-lg font-semibold text-white">Title</h3>
  <p className="text-sm text-zinc-400 mt-2">Description text goes here</p>
</div>

Button:
<button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
  Click me
</button>

Stat card:
<div className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
  <span className="text-xs text-zinc-500 uppercase tracking-wider">Revenue</span>
  <div className="text-2xl font-bold text-white mt-1">$45,231</div>
  <span className="text-xs text-green-500">+20.1% from last month</span>
</div>

**OUTPUT:**
Return ONLY the modified JSX. Start with < and end with >. NO markdown, NO code blocks, NO explanations.
`;

// Helper to clean JSX from AI response
function cleanJsxCode(code: string): string {
  // Remove markdown code blocks
  code = code
    .replace(/^```(?:jsx|javascript|tsx|ts|html)?\s*\n?/gim, '')
    .replace(/```\s*$/gim, '')
    .trim();
  
  // Remove function wrapper if present
  const jsxMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}?\s*$/);
  if (jsxMatch) {
    code = jsxMatch[1].trim();
  }
  
  const functionBodyMatch = code.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}/);
  if (functionBodyMatch) {
    code = functionBodyMatch[1].trim();
  }
  
  // Ensure starts with <
  if (!code.startsWith('<')) {
    const jsxStart = code.indexOf('<');
    if (jsxStart > 0) {
      code = code.slice(jsxStart);
    }
  }
  
  // Remove trailing export
  code = code.replace(/\n*export\s+default\s+\w+;?\s*$/g, '').trim();
  
  return code;
}

// Helper to detect component name from visual analysis
function suggestComponentName(description: string): string {
  const patterns: [RegExp, string][] = [
    [/button/i, 'Button'],
    [/card/i, 'Card'],
    [/nav(bar|igation)?/i, 'Navbar'],
    [/header/i, 'Header'],
    [/footer/i, 'Footer'],
    [/hero/i, 'HeroSection'],
    [/form/i, 'FormSection'],
    [/input/i, 'InputField'],
    [/modal/i, 'Modal'],
    [/sidebar/i, 'Sidebar'],
    [/menu/i, 'Menu'],
    [/dropdown/i, 'Dropdown'],
    [/avatar/i, 'Avatar'],
    [/badge/i, 'Badge'],
    [/tag/i, 'Tag'],
    [/stat/i, 'StatCard'],
    [/metric/i, 'MetricCard'],
    [/pricing/i, 'PricingCard'],
    [/testimonial/i, 'Testimonial'],
    [/feature/i, 'FeatureCard'],
    [/cta/i, 'CTASection'],
    [/banner/i, 'Banner'],
    [/alert/i, 'Alert'],
    [/toast/i, 'Toast'],
    [/table/i, 'DataTable'],
    [/list/i, 'ListItem'],
    [/profile/i, 'ProfileCard'],
    [/login|signin/i, 'LoginForm'],
    [/signup|register/i, 'SignupForm'],
    [/search/i, 'SearchBar'],
    [/notification/i, 'Notification'],
    [/progress/i, 'ProgressBar'],
    [/chart/i, 'ChartWidget'],
    [/graph/i, 'GraphWidget'],
  ];
  
  for (const [pattern, name] of patterns) {
    if (pattern.test(description)) {
      return name;
    }
  }
  
  return 'CustomComponent';
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, imageUrl, componentName, additionalInstructions, description } = await request.json();
    
    // Allow either image OR description
    if (!imageBase64 && !imageUrl && !description) {
      return NextResponse.json({ error: "No image or description provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
      }
    });

    // Determine if this is image-based or description-based
    const isDescriptionMode = !imageBase64 && !imageUrl && description;
    
    // Build the prompt
    let prompt = VISION_TO_CODE_PROMPT;
    
    if (additionalInstructions) {
      prompt += `\n\n**ADDITIONAL INSTRUCTIONS:**\n${additionalInstructions}`;
    }
    
    if (isDescriptionMode) {
      prompt += `\n\n**CREATE A COMPONENT FROM THIS DESCRIPTION:**\n${description}\n\nGenerate a beautiful, modern component that matches this description. Use Tailwind CSS, dark theme (zinc-900 backgrounds), and ensure it looks professional and polished.`;
    } else {
      prompt += `\n\n**NOW CONVERT THE PROVIDED IMAGE TO JSX CODE:**`;
    }

    // Prepare image part (if available)
    let imagePart: any = null;
    
    if (imageBase64) {
      // Base64 image
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const mimeType = imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/png';
      
      imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };
    } else if (imageUrl) {
      // URL-based image - fetch and convert to base64
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      
      imagePart = {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      };
    }

    // Use streaming for live updates
    const contentParts: any[] = [{ text: prompt }];
    if (imagePart) {
      contentParts.push(imagePart);
    }
    
    const result = await model.generateContentStream(contentParts);
    
    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullCode = '';
        let detectedDescription = '';
        
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              fullCode += text;
              
              // Send partial code for live preview
              const partialClean = cleanJsxCode(fullCode);
              
              // Only send if we have valid JSX start
              if (partialClean.startsWith('<')) {
                const data = JSON.stringify({ 
                  type: 'partial', 
                  code: partialClean 
                });
                controller.enqueue(encoder.encode(`data: ${data}\n\n`));
              }
            }
          }
          
          // Send final complete code
          const finalCode = cleanJsxCode(fullCode);
          
          // Suggest component name based on the generated code
          const suggestedName = componentName || suggestComponentName(finalCode);
          
          // Detect category based on complexity
          let category = 'atoms';
          const tagCount = (finalCode.match(/<[^/][^>]*>/g) || []).length;
          if (tagCount > 20) category = 'organisms';
          else if (tagCount > 8) category = 'molecules';
          
          const doneData = JSON.stringify({ 
            type: 'done', 
            success: true,
            code: finalCode,
            componentName: suggestedName,
            category: category,
            description: `Generated from image using AI Vision`
          });
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
          
        } catch (error: any) {
          const errorData = JSON.stringify({ 
            type: 'error', 
            error: error.message 
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        }
        
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    });

  } catch (error: any) {
    console.error("Blueprint vision error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to analyze image" 
    }, { status: 500 });
  }
}
