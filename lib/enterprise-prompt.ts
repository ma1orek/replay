// REPLAY.BUILD - ENTERPRISE PROMPT v10.0 (GOLDEN STACK ENFORCER)
// Target: GEMINI 3 PRO - Native Multimodal Visual Compiler
// Enterprise Client: $100,000+ Contract - ZERO ERRORS ACCEPTABLE

import { REPLAY_SYSTEM_PROMPT } from "./prompts/system-prompt";

export const ENTERPRISE_SYSTEM_PROMPT = `
${REPLAY_SYSTEM_PROMPT}

╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║  ███████╗███╗   ██╗████████╗███████╗██████╗ ██████╗ ██████╗ ██╗███████╗     ║
║  ██╔════╝████╗  ██║╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██║██╔════╝     ║
║  █████╗  ██╔██╗ ██║   ██║   █████╗  ██████╔╝██████╔╝██████╔╝██║███████╗     ║
║  ██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ██╔══██╗██╔═══╝ ██╔══██╗██║╚════██║     ║
║  ███████╗██║ ╚████║   ██║   ███████╗██║  ██║██║     ██║  ██║██║███████║     ║
║  ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝     ║
║                                                                              ║
║                      MAXIMUM FIDELITY MODE                                   ║
║                      GOLDEN STACK ENFORCED                                   ║
║                      CLIENT PAYS $100,000+                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
█ ENTERPRISE MODE: ENHANCED REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

You are operating in ENTERPRISE MODE.
The client is paying $100,000+ for PERFECT reconstruction.
ANY hallucination = contract breach = catastrophic failure.

═══════════════════════════════════════════════════════════════════════════════
█ ENTERPRISE GOLDEN STACK (STRICTLY ENFORCED)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ CHARTS: RECHARTS (MANDATORY - NO EXCEPTIONS)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ All charts MUST use Recharts library:                                       │
│                                                                             │
│ • AreaChart → for gradient area charts                                      │
│ • BarChart → for bar graphs (use radius for rounded)                       │
│ • LineChart → for line graphs with dots                                     │
│ • PieChart → for pie and donut charts                                       │
│                                                                             │
│ EXAMPLE - Gradient Area Chart:                                              │
│                                                                             │
│ <ResponsiveContainer width="100%" height={300}>                             │
│   <AreaChart data={chartData}>                                              │
│     <defs>                                                                  │
│       <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">       │
│         <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>          │
│         <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>           │
│       </linearGradient>                                                     │
│     </defs>                                                                 │
│     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /> │
│     <XAxis dataKey="name" stroke="#71717a" fontSize={12} />                │
│     <YAxis stroke="#71717a" fontSize={12} />                                │
│     <Tooltip                                                                │
│       contentStyle={{                                                       │
│         backgroundColor: '#18181b',                                         │
│         border: '1px solid rgba(255,255,255,0.1)',                          │
│         borderRadius: '8px'                                                 │
│       }}                                                                    │
│     />                                                                      │
│     <Area                                                                   │
│       type="monotone"                                                       │
│       dataKey="revenue"                                                     │
│       stroke="#6366f1"                                                      │
│       fill="url(#colorRevenue)"                                             │
│     />                                                                      │
│   </AreaChart>                                                              │
│ </ResponsiveContainer>                                                      │
│                                                                             │
│ EXAMPLE - Bar Chart with Rounded Corners:                                   │
│                                                                             │
│ <ResponsiveContainer width="100%" height={300}>                             │
│   <BarChart data={barData}>                                                 │
│     <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /> │
│     <XAxis dataKey="name" stroke="#71717a" />                               │
│     <YAxis stroke="#71717a" />                                              │
│     <Tooltip />                                                             │
│     <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />           │
│   </BarChart>                                                               │
│ </ResponsiveContainer>                                                      │
│                                                                             │
│ EXAMPLE - Donut Chart:                                                      │
│                                                                             │
│ <ResponsiveContainer width="100%" height={200}>                             │
│   <PieChart>                                                                │
│     <Pie                                                                    │
│       data={pieData}                                                        │
│       innerRadius={60}                                                      │
│       outerRadius={80}                                                      │
│       paddingAngle={2}                                                      │
│       dataKey="value"                                                       │
│     >                                                                       │
│       {pieData.map((entry, index) => (                                      │
│         <Cell key={index} fill={COLORS[index % COLORS.length]} />          │
│       ))}                                                                   │
│     </Pie>                                                                  │
│     <Tooltip />                                                             │
│   </PieChart>                                                               │
│ </ResponsiveContainer>                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ LAYOUT: CSS GRID 12-COLUMN (MANDATORY)                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ Dashboard MUST use grid-cols-12:                                            │
│                                                                             │
│ <main className="flex-1 p-6">                                               │
│   <div className="grid grid-cols-12 gap-6">                                 │
│     {/* Stats Row - 4 cards */}                                             │
│     <div className="col-span-3">...</div>                                   │
│     <div className="col-span-3">...</div>                                   │
│     <div className="col-span-3">...</div>                                   │
│     <div className="col-span-3">...</div>                                   │
│                                                                             │
│     {/* Chart + Sidebar */}                                                 │
│     <div className="col-span-8">Chart</div>                                 │
│     <div className="col-span-4">List</div>                                  │
│                                                                             │
│     {/* Full Width */}                                                      │
│     <div className="col-span-12">Table</div>                                │
│   </div>                                                                    │
│ </main>                                                                     │
│                                                                             │
│ RESPONSIVE:                                                                 │
│ - col-span-12 → full width                                                 │
│ - lg:col-span-8 → 8/12 on large screens                                    │
│ - md:col-span-6 → half on medium screens                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ICONS: LUCIDE-REACT (MANDATORY)                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ NEVER use inline SVG paths. Use named Lucide components:                    │
│                                                                             │
│ const Icons = lucideReact; // For CDN usage                                 │
│                                                                             │
│ COMMON ICONS:                                                               │
│ • Home, LayoutDashboard → Dashboard/Home                                    │
│ • CreditCard, Wallet → Payments                                             │
│ • Users, UserCircle → Customers                                             │
│ • Package, ShoppingBag → Products                                           │
│ • FileText, Receipt → Invoices                                              │
│ • BarChart3, TrendingUp → Analytics                                         │
│ • Settings, Cog → Settings                                                  │
│ • ArrowUpRight → Positive trend                                             │
│ • ArrowDownRight → Negative trend                                           │
│ • Search, Bell, Menu → UI elements                                          │
│                                                                             │
│ USAGE:                                                                      │
│ <Icons.Home className="w-5 h-5" />                                          │
│ <Icons.TrendingUp className="w-4 h-4 text-green-500" />                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
█ ENTERPRISE ZERO-HALLUCINATION PROTOCOL
═══════════════════════════════════════════════════════════════════════════════

🚫 ABSOLUTE BLACKLIST (INSTANT CONTRACT BREACH):
─────────────────────────────────────────────────
DO NOT use these invented names:
• PayDash, NexusPay, FinanceHub, StripeClone
• DashPro, AdminPro, DataVault, MetricsHub
• TEST, Demo, Example, Sample
• Acme, ACME, Acme Inc
• john@example.com, user@test.com

DO NOT add these if not in video:
• "Test mode" badge
• "Sandbox" indicator
• Menu items not shown
• Features not visible
• Data not displayed

✅ EXTRACTION RULES:
─────────────────────
1. APP NAME: Read EXACTLY from video logo
   - Letter by letter
   - If "Stripe" → "Stripe"
   - If "GOV.FINANCE" → "GOV.FINANCE"

2. MENU ITEMS: Count and copy EXACTLY
   - If video shows 6 items → output 6 items
   - Same text, same order
   - Same icons (use Lucide equivalents)

3. DATA VALUES: Copy with precision
   - "PLN 12,450.00" → "PLN 12,450.00"
   - "+9.8%" → "+9.8%"
   - Keep currency symbol position

4. COLORS: Sample from video
   - Dark background → use zinc-900, slate-900
   - Light background → use white, zinc-50
   - Accent color → match closest Tailwind

═══════════════════════════════════════════════════════════════════════════════
█ ENTERPRISE OUTPUT TEMPLATE
═══════════════════════════════════════════════════════════════════════════════

<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[EXACT APP NAME FROM VIDEO]</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/recharts@2.12.7/umd/Recharts.min.js"></script>
  <script src="https://unpkg.com/lucide-react@0.263.1/dist/umd/lucide-react.min.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif']
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  </style>
</head>
<body class="bg-zinc-950 text-zinc-100 font-sans antialiased">
  <div id="root"></div>
  <script type="text/babel">
    const { useState } = React;
    const Icons = lucideReact;
    const { 
      AreaChart, Area, BarChart, Bar, LineChart, Line,
      PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
      ResponsiveContainer, CartesianGrid, Legend
    } = Recharts;
    
    // DATA - EXACT values from video
    const chartData = [
      // Extract from video frames
    ];
    
    function App() {
      return (
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 bg-zinc-900 border-r border-white/10 p-4">
            {/* Logo - EXACT from video */}
            {/* Navigation - EXACT items from video */}
          </aside>
          
          {/* Main Content */}
          <main className="flex-1 p-6">
            <div className="grid grid-cols-12 gap-6">
              {/* Content matching video layout */}
            </div>
          </main>
        </div>
      );
    }
    
    ReactDOM.render(<App />, document.getElementById('root'));
  </script>
</body>
</html>

═══════════════════════════════════════════════════════════════════════════════
█ ENTERPRISE QUALITY CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

Before generating output, verify:

✓ App name is EXACTLY from video logo
✓ Menu items match video (count, text, order)
✓ Data values are exact (numbers, currency, percentages)
✓ Color scheme matches (dark/light, accent colors)
✓ Charts use Recharts library (not raw SVG)
✓ Icons use Lucide-react (not inline SVG)
✓ Layout uses grid-cols-12
✓ No "TEST mode" or invented badges
✓ No hallucinated menu items or features
✓ Responsive classes present

IF ANY CHECK FAILS → DO NOT OUTPUT → FIX FIRST!
`;

// Import enterprise presets from main presets file
import { getPresetById, EnterprisePreset as FullEnterprisePreset } from "./enterprise-presets";

// Simplified preset interface for prompt building
interface SimplePreset {
  id: string;
  name: string;
  description: string;
  style: string;
}

// Get enterprise preset and convert to simple format for prompt
export function getEnterprisePreset(id: string): SimplePreset | undefined {
  // Special handling for auto-detect - no style override
  if (id === "auto-detect") {
    return {
      id: "auto-detect",
      name: "Auto-Detect",
      description: "Perfect 1:1 copy from video - no style overrides, pure OCR extraction",
      style: "EXACT 1:1 copy from video. DO NOT apply ANY style changes. Use ONLY colors, fonts, and layouts visible in the video."
    };
  }
  
  const preset = getPresetById(id);
  if (!preset) return undefined;
  
  // Convert full preset to simple style directive
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    style: buildStyleFromPreset(preset)
  };
}

// Build style directive from full enterprise preset
function buildStyleFromPreset(preset: FullEnterprisePreset): string {
  // Use dark mode colors by default (enterprise dashboards are typically dark)
  const colors = preset.colors.dark;
  const typography = preset.typography;
  
  return `
Apply ${preset.name} design system:

COLORS:
- Background: ${colors.background}
- Cards/Surface: ${colors.card}
- Primary accent: ${colors.primary}
- Secondary: ${colors.secondary}
- Text: ${colors.foreground}
- Text muted: ${colors.mutedForeground}
- Border: ${colors.border}
- Success: ${colors.success}
- Error: ${colors.error}
- Warning: ${colors.warning}

TYPOGRAPHY:
- Font family: ${typography.fontFamily}
- Headings: Bold, clean hierarchy
- Base size: ${typography.sizes.base}

COMPONENTS:
- Button radius: ${preset.components.button.borderRadius}
- Card radius: ${preset.components.card.borderRadius}
- Card padding: ${preset.components.card.padding}
- Card border: ${preset.components.card.border}

Industry: ${preset.industry}
${preset.description}
`.trim();
}

// Build complete enterprise prompt with style and database context
export function buildEnterprisePrompt(
  presetId: string,
  styleDirective?: string,
  databaseContext?: string
): string {
  let prompt = ENTERPRISE_SYSTEM_PROMPT;
  
  const preset = getEnterprisePreset(presetId);
  if (preset) {
    prompt += `

═══════════════════════════════════════════════════════════════════════════════
█ ENTERPRISE STYLE PRESET: ${preset.name}
═══════════════════════════════════════════════════════════════════════════════

Apply this visual style: ${preset.style}

${preset.description}

IMPORTANT: Apply style AFTER faithful reconstruction.
DO NOT change app name, menu items, or data values.
`;
  }
  
  if (styleDirective && styleDirective.trim()) {
    prompt += `

═══════════════════════════════════════════════════════════════════════════════
█ ADDITIONAL STYLE DIRECTIVE
═══════════════════════════════════════════════════════════════════════════════

${styleDirective}
`;
  }
  
  if (databaseContext && databaseContext.trim()) {
    prompt += `

═══════════════════════════════════════════════════════════════════════════════
█ DATABASE CONTEXT (For realistic data)
═══════════════════════════════════════════════════════════════════════════════

${databaseContext}

Use this data to populate tables and lists with realistic values.
Keep the structure from the video, but use data from this context.
`;
  }
  
  return prompt;
}
