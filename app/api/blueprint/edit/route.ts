import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const BLUEPRINT_EDIT_PROMPT = `
**ROLE: REACT COMPONENT EDITOR**

You are a React/Tailwind expert who modifies existing UI components based on user requests.
Your job is to take an EXISTING React component and modify it according to the user's request while PRESERVING:
- The original component's structure and style conventions
- Tailwind CSS patterns used in the original
- The same level of quality and polish
- Working functionality (useState, handlers, etc.)

**RULES:**
1. Return ONLY the modified React component code - NO explanations, NO markdown, NO code blocks
2. Keep the same component name and export structure
3. Preserve all imports needed (React hooks, icons, etc.)
4. If adding charts, use Chart.js with canvas and useEffect (NOT Recharts)
5. If adding images, use Pollinations.ai with seed: https://image.pollinations.ai/prompt/{description}?width=800&height=600&nologo=true&model=flux&seed=123
6. If adding avatars, use: https://i.pravatar.cc/150?img=X
7. Maintain the EXACT same design language (colors, shadows, rounded corners, spacing)
8. For color changes, update ALL relevant elements to maintain consistency
9. For structural changes, maintain responsive design (use md:, lg: breakpoints)

**CHART.JS PATTERN (when adding charts):**
\`\`\`jsx
const chartRef = useRef(null);
const chartInstance = useRef(null);

useEffect(() => {
  if (!chartRef.current) return;
  
  // Destroy previous chart
  if (chartInstance.current) {
    chartInstance.current.destroy();
  }
  
  chartInstance.current = new window.Chart(chartRef.current, {
    type: 'line', // or 'bar', 'doughnut', 'pie'
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Data',
        data: [12, 19, 3, 5, 2, 3],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
        x: { grid: { display: false } }
      }
    }
  });
  
  return () => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
  };
}, []);

// In JSX:
<div style={{ height: '200px' }}>
  <canvas ref={chartRef} />
</div>
\`\`\`

**WHAT USER WANTS:**
- "Make it red" = Change primary colors to red shades (bg-red-500, text-red-500, etc.)
- "Add button" = Add a styled button matching the component's design
- "Add chart/graph" = Add a Chart.js chart matching the theme
- "Make bigger" = Increase sizes, padding, font sizes
- "Add icon" = Add relevant Lucide icon (import and use)
- "Change text to X" = Update text content

**OUTPUT:**
Return the COMPLETE modified component code. Start directly with any imports or the function definition.
Do NOT wrap in \`\`\`jsx or any markdown. Just pure code.
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
      model: "gemini-2.0-flash", // Flash for fast live edits
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
      .replace(/^```(?:jsx|javascript|tsx|ts)?\s*\n?/gim, '')
      .replace(/```\s*$/gim, '')
      .trim();
    
    // Ensure code starts with import or function/const
    if (!code.match(/^(import|function|const|export)/)) {
      // Try to find where real code starts
      const codeStart = code.search(/(import|function|const|export)/);
      if (codeStart > 0) {
        code = code.slice(codeStart);
      }
    }

    // Add default export if missing
    if (!code.includes('export default') && !code.includes('export function')) {
      const functionMatch = code.match(/function\s+(\w+)/);
      if (functionMatch) {
        code = code + `\n\nexport default ${functionMatch[1]};`;
      }
    }

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
