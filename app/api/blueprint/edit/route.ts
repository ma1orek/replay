import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const BLUEPRINT_EDIT_PROMPT = `
**ROLE: JSX COMPONENT MODIFIER**

You modify UI components (raw JSX/HTML) based on user requests. The components are rendered in iframes with Tailwind CSS.

**CRITICAL: OUTPUT FORMAT**
Return ONLY the JSX markup - NO function wrapper, NO imports, NO export. Just the raw JSX that would go inside a return().

**EXAMPLE INPUT:**
<div className="p-6 bg-zinc-800 rounded-xl">
  <h3 className="text-lg font-semibold text-white">Metric</h3>
  <span className="text-3xl font-bold text-white">5,000+</span>
</div>

**EXAMPLE OUTPUT after "Make it red":**
<div className="p-6 bg-red-900 rounded-xl">
  <h3 className="text-lg font-semibold text-red-100">Metric</h3>
  <span className="text-3xl font-bold text-red-400">5,000+</span>
</div>

**RULES:**
1. Return ONLY JSX/HTML - no function, no imports, no markdown
2. Keep all Tailwind classes but modify as needed
3. For images: https://picsum.photos/seed/{name}/W/H
4. For avatars: https://i.pravatar.cc/150?img=X
5. For charts: Add a static SVG chart (no JS required in output)

**ADDING A LINE CHART - Use SVG:**
<div className="mt-4 h-32 relative">
  <svg viewBox="0 0 200 80" className="w-full h-full">
    <polyline fill="none" stroke="#6366f1" strokeWidth="2" points="0,60 30,45 60,50 90,30 120,35 150,20 180,25 200,15"/>
    <polyline fill="url(#gradient)" stroke="none" points="0,60 30,45 60,50 90,30 120,35 150,20 180,25 200,15 200,80 0,80"/>
    <defs>
      <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="rgba(99,102,241,0.3)"/>
        <stop offset="100%" stopColor="rgba(99,102,241,0)"/>
      </linearGradient>
    </defs>
  </svg>
</div>

**ADDING A BAR CHART - Use SVG:**
<div className="mt-4 flex items-end gap-1 h-24">
  <div className="flex-1 bg-indigo-500 rounded-t" style={{height:'60%'}}></div>
  <div className="flex-1 bg-indigo-500 rounded-t" style={{height:'80%'}}></div>
  <div className="flex-1 bg-indigo-500 rounded-t" style={{height:'45%'}}></div>
  <div className="flex-1 bg-indigo-500 rounded-t" style={{height:'90%'}}></div>
  <div className="flex-1 bg-indigo-500 rounded-t" style={{height:'70%'}}></div>
</div>

**WHAT USER WANTS:**
- "Make it red" = Change colors to red (bg-red-*, text-red-*)
- "Add button" = Add <button className="...">
- "Add line chart" = Add SVG line chart
- "Add icon" = Add emoji or SVG icon
- "Make bigger" = Increase padding, text sizes

**OUTPUT:**
Return ONLY the modified JSX. Start with < and end with >. NO markdown, NO code blocks.
`;

export async function POST(request: NextRequest) {
  try {
    const { componentCode, componentName, userRequest, componentStyle } = await request.json();
    
    if (!userRequest) {
      return NextResponse.json(
        { error: "Missing userRequest" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", // Gemini 3 Flash for fast live edits
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096,
      }
    });

    // Build context from existing component or create new
    const hasExistingCode = componentCode && componentCode.trim().length > 50;
    
    const prompt = `${BLUEPRINT_EDIT_PROMPT}

**ORIGINAL COMPONENT${componentName ? ` (${componentName})` : ''}:**
${hasExistingCode ? componentCode : `
// No existing code - create a new component based on the request
// Use this style context: ${componentStyle || 'Dark theme with zinc backgrounds, subtle shadows'}
function ${componentName || 'NewComponent'}() {
  return (
    <div className="p-4 bg-zinc-900 rounded-lg">
      <span className="text-zinc-400">Placeholder</span>
    </div>
  );
}
`}

**USER REQUEST:**
"${userRequest}"

**MODIFIED COMPONENT CODE:**`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    let code = response.text();
    
    // Clean up response - remove any markdown code blocks
    code = code
      .replace(/^```(?:jsx|javascript|tsx|ts|html)?\s*\n?/gim, '')
      .replace(/```\s*$/gim, '')
      .trim();
    
    // Remove any function wrapper if AI added one - we want just JSX
    const jsxMatch = code.match(/return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}?\s*$/);
    if (jsxMatch) {
      code = jsxMatch[1].trim();
    }
    
    // Also handle if AI returned function directly
    const functionBodyMatch = code.match(/function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*\}/);
    if (functionBodyMatch) {
      code = functionBodyMatch[1].trim();
    }
    
    // Ensure code starts with < (is JSX)
    if (!code.startsWith('<')) {
      // Find first JSX element
      const jsxStart = code.indexOf('<');
      if (jsxStart > 0) {
        code = code.slice(jsxStart);
      }
    }
    
    // Remove trailing export statements
    code = code.replace(/\n*export\s+default\s+\w+;?\s*$/g, '').trim();

    return NextResponse.json({ 
      success: true, 
      code: code,
      componentName: componentName || 'EditedComponent'
    });

  } catch (error: any) {
    console.error("Blueprint edit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to edit blueprint" },
      { status: 500 }
    );
  }
}
