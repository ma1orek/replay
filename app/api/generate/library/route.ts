import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ═══════════════════════════════════════════════════════════════════════════════
// LIBRARY EXTRACTION - Extracts REAL components from actual code
// ═══════════════════════════════════════════════════════════════════════════════

const LIBRARY_EXTRACTION_PROMPT = `You are a FORENSIC CODE EXTRACTOR creating a STORYBOOK-LIKE component library.
Your job: Extract UI components and output PURE HTML (not JSX) that renders in an iframe.

═══════════════════════════════════════════════════════════════════════════════
🚨🚨🚨 ABSOLUTELY CRITICAL: OUTPUT FORMAT FOR "code" FIELD 🚨🚨🚨
═══════════════════════════════════════════════════════════════════════════════

The "code" field MUST be COMPLETE, PURE HTML with INLINE classes that can render standalone.

✅ CORRECT FORMAT - FULL HTML STRUCTURE with actual content (NO EMOJI!):
"code": "<aside class=\"w-72 bg-[#141419]/60 backdrop-blur-xl h-screen flex flex-col border-r border-white/5\"><div class=\"h-20 flex items-center px-6 border-b border-white/5\"><svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 6h16M4 12h16M4 18h16\"/></svg><span class=\"ml-4 text-xl font-semibold text-white\">YouTube</span></div><nav class=\"flex-1 overflow-y-auto py-4 px-2 space-y-0.5\"><a href=\"#\" class=\"flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/10 text-white\"><svg class=\"w-5 h-5\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6\"/></svg><span>Home</span></a></nav></aside>"

❌ WRONG - Using JSX/React syntax:
"code": "<div className={cn('p-4', active && 'bg-blue-500')}>{children}</div>"

❌ WRONG - Using curly braces:
"code": "<div class={someVariable}>Content</div>"

❌ WRONG - Empty or minimal:
"code": "<MainSidebar />" or "code": ""

STRICT RULES FOR "code" FIELD:
1. MUST use class="..." with DOUBLE QUOTES (not className, not class={...})
2. MUST include ALL visible content (text, icons, structure)
3. MUST be COMPLETE - no placeholders like {children} or {variable}
4. MUST have REAL text values from the source code
5. NEVER use React components like <Icon />, use emoji: <span class="text-xl">🏠</span>
6. NEVER use curly braces {} anywhere in the code field
7. MINIMUM 100 characters for each component's code field

🖼️ IMAGES - CRITICAL REQUIREMENT (WITH SEED TO PREVENT RATE LIMIT):
- EVERY component with visual content (cards, heroes, banners, profiles) MUST include real <img> tags
- USE POLLINATIONS.AI WITH SEED: <img src="https://image.pollinations.ai/prompt/DESCRIPTION?width=400&height=300&nologo=true&model=flux&seed=123" class="w-full h-48 object-cover" alt="..."/>
  - Replace DESCRIPTION with context-relevant text (e.g., "modern office workspace", "team meeting", "product showcase")
  - IMPORTANT: Use a static seed number (e.g., seed=101, seed=202) to enable caching and prevent rate limits
- FOR AVATARS: <img src="https://i.pravatar.cc/150?u=uniquename" class="w-10 h-10 rounded-full" alt="..."/>
- NEVER use picsum.photos - ALWAYS use pollinations.ai with &model=flux&seed=XXX
- NEVER use empty src="" or src={variable} - ALWAYS real URLs
- NEVER skip images - if original has image placeholder, add a pollinations.ai URL

ICON CONVERSION (MANDATORY - NO EMOJI, USE SVG OR UNICODE):
- <Home /> → <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
- <Search /> → <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
- <Menu /> → <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
- <Play /> → <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
- <User /> → <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
- <Bell /> → <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
- <Settings /> → <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
- <ChevronRight /> → <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
- <Fire /> → <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.832 21.801c3.78-.789 6.297-3.707 6.297-7.635 0-2.031-.765-4.049-2.236-5.9a.502.502 0 00-.839.078l-1.166 2.333a.5.5 0 01-.883.039l-.943-1.414a.5.5 0 00-.867.039l-1.498 3.371a.5.5 0 01-.9.042l-.943-1.572a.5.5 0 00-.834-.019l-.893 1.339a.5.5 0 01-.888-.068l-.667-1.667a.5.5 0 00-.887-.068l-1.067 1.6c-.869 1.304-1.42 2.688-1.42 4.201 0 4.086 2.789 7.107 6.797 7.841.399.073.801.11 1.203.11.402 0 .804-.037 1.203-.11a7.7 7.7 0 001.431-.35z"/></svg>
- Any other icon → <span class="inline-block w-5 h-5 rounded bg-zinc-700"></span>

CONVERSION RULES:
- className="..." → class="..."
- {variable} → replace with actual text value from context
- {children} → replace with actual child elements
- onClick={...} → remove entirely
- htmlFor → for

ICONS - USE SVG OR SIMPLE UNICODE (NO EMOJI!):
- Check icon → <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
- Arrow right → <span class="text-lg">→</span>
- Arrow left → <span class="text-lg">←</span>
- Bullet point → <span class="text-lg">•</span>
- Star → <span class="text-lg">★</span>

═══════════════════════════════════════════════════════════════════════════════
🚨 CRITICAL RULES - READ CAREFULLY
═══════════════════════════════════════════════════════════════════════════════

1. **PURE HTML ONLY**: The "code" field must be valid HTML that works in an iframe. NO JSX!

2. **NO GENERIC NAMES**: If the code has a button that says "Idź do okazji", name the component "GoToOfferButton", NOT "Button".

3. **EXTRACT EVERYTHING**: Every distinct UI element is a component:
   - Each unique button style = separate component
   - Each card type = separate component  
   - Navigation items = components
   - Sidebar = component
   - Search bars = component
   - Badges = components
   - Price displays = components

4. **REAL NAMES FROM CONTEXT**: 
   - Button with "Pobierz aplikację" text → "DownloadAppButton"
   - Card showing product → "DealCard" or "ProductCard"
   - Orange badge → "HotBadge"
   - Sidebar nav → "MainSidebar"

═══════════════════════════════════════════════════════════════════════════════
📋 WHAT TO EXTRACT (find ALL of these in the code)
═══════════════════════════════════════════════════════════════════════════════

LAYOUT:
- Main sidebar/navigation structure (COPY entire <aside> or <nav>)
- Header bar (COPY entire <header>)
- Content cards/containers
- Grid layouts

BUTTONS (each style is a separate component):
- Primary buttons (orange/colored background)
- Secondary buttons (outlined/ghost)
- Icon buttons
- Link buttons

INPUTS:
- Search inputs
- Form fields
- Checkboxes/toggles
- Select dropdowns

CARDS:
- Product/deal cards (COPY the entire card structure)
- Info cards
- Promo cards
- User cards

NAVIGATION:
- Menu items (sidebar items)
- Tab components
- Breadcrumbs
- Pagination

FEEDBACK:
- Badges (hot, discount, new)
- Alerts/toasts
- Modals
- Loading states

DATA DISPLAY:
- Price displays (with currency, discount)
- User info (avatar + name)
- Stats/metrics
- Lists

═══════════════════════════════════════════════════════════════════════════════
📤 OUTPUT FORMAT (JSON)
═══════════════════════════════════════════════════════════════════════════════

{
  "components": [
    {
      "id": "marquee-banner",
      "name": "MarqueeBanner",
      "category": "feedback",
      "description": "Scrolling announcement banner with colored background and bold text",
      "code": "<div class=\"w-full bg-green-600 py-3 overflow-hidden\"><div class=\"flex whitespace-nowrap animate-marquee\"><span class=\"text-white font-bold text-sm mx-4\">Warehouse Sale—Up to 50% off | Get em before they're gone •</span><span class=\"text-white font-bold text-sm mx-4\">Warehouse Sale—Up to 50% off | Get em before they're gone •</span></div></div>",
      "usage": "<MarqueeBanner text=\"Sale Alert!\" />",
      "props": [
        {"name": "text", "type": "string", "required": true, "defaultValue": "Warehouse Sale—Up to 50% off", "description": "Banner text content", "control": "input"},
        {"name": "backgroundColor", "type": "string", "required": false, "defaultValue": "bg-green-600", "description": "Tailwind background class", "control": "input"},
        {"name": "textColor", "type": "string", "required": false, "defaultValue": "text-white", "description": "Tailwind text color class", "control": "input"},
        {"name": "speed", "type": "number", "required": false, "defaultValue": "20", "description": "Animation duration in seconds", "control": "number"},
        {"name": "repeat", "type": "number", "required": false, "defaultValue": "2", "description": "Number of text repetitions", "control": "number"}
      ],
      "variants": [
        {"name": "Sale", "props": {"backgroundColor": "bg-green-600", "text": "Sale Alert!"}},
        {"name": "Warning", "props": {"backgroundColor": "bg-yellow-500", "text": "Limited Time Offer"}},
        {"name": "Info", "props": {"backgroundColor": "bg-blue-600", "text": "Free Shipping Today"}}
      ]
    }
  ],

PROPS REQUIREMENTS (MINIMUM 4-6 props per component):
- ALWAYS include: text/content props for any visible text
- ALWAYS include: style props (backgroundColor, textColor, size)
- ALWAYS include: behavior props (disabled, loading, onClick action name)
- ALWAYS include: variant-related props
- Use "control" field: "input" for text, "number" for numbers, "toggle" for booleans, "select" for enums
  "tokens": {
    "colors": {
      "primary": "#FF6600",
      "background": "#1A1A1A",
      "text": "#FFFFFF",
      "muted": "#6B7280"
    },
    "typography": {
      "fontFamily": {"sans": "Inter, system-ui"},
      "fontSize": {"xs": "0.75rem", "sm": "0.875rem", "base": "1rem", "lg": "1.125rem", "xl": "1.25rem"},
      "fontWeight": {"normal": 400, "medium": 500, "semibold": 600, "bold": 700}
    },
    "spacing": {"1": "0.25rem", "2": "0.5rem", "3": "0.75rem", "4": "1rem"},
    "borderRadius": {"sm": "0.25rem", "md": "0.5rem", "lg": "1rem", "xl": "1.5rem"}
  }
}

═══════════════════════════════════════════════════════════════════════════════
⚠️ VALIDATION CHECKLIST - VERIFY BEFORE RETURNING
═══════════════════════════════════════════════════════════════════════════════

For EACH component in your response, verify:
✅ "code" field has MINIMUM 150 characters of complete HTML with ALL styles
✅ "code" field uses class="..." with ACTUAL Tailwind classes from source
✅ "code" field has NO curly braces {} - replace all with real values
✅ "code" field contains ACTUAL text content (not placeholders)
✅ "code" field includes background colors, padding, margins, borders
✅ All icons are converted to SVG or unicode in <span> tags
✅ All <img> tags MUST have REAL working src URLs - use picsum.photos for images!
✅ EVERY card/hero/banner with images MUST include: <img src="https://picsum.photos/id/XX/400/300" .../>
✅ Avatar images MUST use: <img src="https://i.pravatar.cc/150?u=NAME" .../>
✅ Component name reflects its PURPOSE (MarqueeBanner, not Banner1)
✅ MINIMUM 4 props per component (text, colors, sizes, behaviors)
✅ Each prop has: name, type, required, defaultValue, description, control
✅ At least 2 variants per component showing different states

❌ REJECT your output if ANY component:
- Has "code" shorter than 150 characters
- Has fewer than 4 props
- Contains className or class={...}
- Contains {} curly braces in code field
- Is just a component tag like "<MainSidebar />"
- Has no visible Tailwind classes (bg-, text-, p-, m-, etc.)
- Card/Hero/Banner component without real <img src="https://picsum.photos/id/XX/..."> tag
- Avatar/Profile component without real <img src="https://i.pravatar.cc/..."> tag
- Has src="" or src={variable} instead of real URL

REMEMBER: The "code" field is rendered in an iframe - it MUST be complete, styled HTML!

Return ONLY valid JSON. No explanation text.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, styleInfo } = body;

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3-pro-preview", // Using PRO for best quality component extraction
      generationConfig: {
        temperature: 0.2, // Lower = more factual/less creative
        maxOutputTokens: 32768,
      },
    });

    // Log what code we're analyzing
    console.log(`[Library] Analyzing ${code.length} chars of code...`);
    console.log(`[Library] First 500 chars: ${code.substring(0, 500)}`);

    const trimmedCode = code.substring(0, 50000);

    const prompt = `${LIBRARY_EXTRACTION_PROMPT}

═══════════════════════════════════════════════════════════════════════════════
📄 SOURCE CODE TO ANALYZE (COPY components from THIS code):
═══════════════════════════════════════════════════════════════════════════════

${trimmedCode}

═══════════════════════════════════════════════════════════════════════════════
🔍 NOW EXTRACT - FOLLOW THESE STEPS EXACTLY:
═══════════════════════════════════════════════════════════════════════════════

1. Find EVERY distinct UI element in the code above (sidebar, buttons, cards, banners, etc.)
2. For EACH element:
   a) Copy the COMPLETE HTML structure with ALL nested elements
   b) Convert className="..." to class="..." 
   c) Keep ALL Tailwind classes (bg-*, text-*, p-*, m-*, flex, etc.)
   d) Convert all icons to emoji spans: <Home /> → <span class="text-xl">🏠</span>
   e) Remove all {} expressions and replace with ACTUAL VALUES from the code
   f) Ensure the code is at least 150 characters with full styling
3. For EACH component add MINIMUM 4-6 props:
   - Text content props (text, title, label, description)
   - Style props (backgroundColor, textColor, size, variant)
   - Behavior props (disabled, loading, onClick description)
   - Include defaultValue with REAL values from the source code
4. Add 2-3 variants showing different visual states
5. Extract ALL Tailwind colors as hex values

CRITICAL: The "code" field will be rendered in an iframe with Tailwind CDN.
It MUST be complete, standalone HTML that displays correctly!

Example of GOOD "code" field:
"code": "<div class=\"w-full bg-green-600 py-3 overflow-hidden\"><div class=\"flex animate-marquee\"><span class=\"text-white font-bold mx-4\">Sale Now!</span></div></div>"

Example of BAD "code" field:
"code": "<MarqueeBanner text={text} />" ← WRONG! This won't render!

Return ONLY valid JSON (no markdown, no explanation):`;

    console.log("[Library] Starting extraction...");
    const startTime = Date.now();
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    console.log(`[Library] Extraction took ${Date.now() - startTime}ms`);
    console.log(`[Library] Response length: ${text.length}`);

    // Parse JSON
    let libraryData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        libraryData = JSON.parse(jsonMatch[0]);
        console.log(`[Library] Parsed successfully: ${libraryData.components?.length || 0} components`);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (e) {
      console.error("[Library] Parse error:", e);
      console.log("[Library] Raw response:", text.substring(0, 1000));
      libraryData = { components: [], tokens: { colors: {}, typography: {} } };
    }

    // Ensure structure
    if (!libraryData.components) libraryData.components = [];
    if (!libraryData.tokens) libraryData.tokens = {};
    if (!libraryData.tokens.colors) libraryData.tokens.colors = {};
    if (!libraryData.tokens.typography) {
      libraryData.tokens.typography = { fontFamily: {}, fontSize: {}, fontWeight: {}, lineHeight: {} };
    }
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // POST-PROCESS: Convert HTML attributes to JSX-compatible syntax
    // ═══════════════════════════════════════════════════════════════════════════════
    const convertHtmlToJsx = (html: string): string => {
      if (!html) return html;
      
      return html
        // class → className
        .replace(/\bclass=/g, 'className=')
        // for → htmlFor
        .replace(/\bfor=/g, 'htmlFor=')
        // SVG attributes: stroke-linecap → strokeLinecap etc.
        .replace(/stroke-linecap=/g, 'strokeLinecap=')
        .replace(/stroke-linejoin=/g, 'strokeLinejoin=')
        .replace(/stroke-width=/g, 'strokeWidth=')
        .replace(/stroke-dasharray=/g, 'strokeDasharray=')
        .replace(/stroke-dashoffset=/g, 'strokeDashoffset=')
        .replace(/stroke-miterlimit=/g, 'strokeMiterlimit=')
        .replace(/stroke-opacity=/g, 'strokeOpacity=')
        .replace(/fill-opacity=/g, 'fillOpacity=')
        .replace(/fill-rule=/g, 'fillRule=')
        .replace(/clip-path=/g, 'clipPath=')
        .replace(/clip-rule=/g, 'clipRule=')
        .replace(/font-family=/g, 'fontFamily=')
        .replace(/font-size=/g, 'fontSize=')
        .replace(/font-weight=/g, 'fontWeight=')
        .replace(/text-anchor=/g, 'textAnchor=')
        .replace(/dominant-baseline=/g, 'dominantBaseline=')
        .replace(/alignment-baseline=/g, 'alignmentBaseline=')
        // viewBox is already correct
        // Convert inline style="..." to style={{...}}
        .replace(/style="([^"]*)"/g, (match, styleStr) => {
          // Convert CSS style string to React style object
          const styles = styleStr.split(';')
            .filter((s: string) => s.trim())
            .map((s: string) => {
              const [prop, val] = s.split(':').map((x: string) => x.trim());
              if (!prop || !val) return null;
              // Convert CSS property to camelCase
              const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
              // Handle numeric values
              const numVal = parseFloat(val);
              if (!isNaN(numVal) && val.match(/^\d+(\.\d+)?$/)) {
                return `"${camelProp}": ${numVal}`;
              }
              return `"${camelProp}": "${val}"`;
            })
            .filter(Boolean)
            .join(', ');
          return `style={{${styles}}}`;
        })
        // Convert style='...' (single quotes) to style={{...}}
        .replace(/style='([^']*)'/g, (match, styleStr) => {
          const styles = styleStr.split(';')
            .filter((s: string) => s.trim())
            .map((s: string) => {
              const [prop, val] = s.split(':').map((x: string) => x.trim());
              if (!prop || !val) return null;
              const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
              const numVal = parseFloat(val);
              if (!isNaN(numVal) && val.match(/^\d+(\.\d+)?$/)) {
                return `"${camelProp}": ${numVal}`;
              }
              return `"${camelProp}": "${val}"`;
            })
            .filter(Boolean)
            .join(', ');
          return `style={{${styles}}}`;
        })
        // tabindex → tabIndex
        .replace(/tabindex=/g, 'tabIndex=')
        // colspan → colSpan
        .replace(/colspan=/g, 'colSpan=')
        // rowspan → rowSpan
        .replace(/rowspan=/g, 'rowSpan=')
        // autocomplete → autoComplete
        .replace(/autocomplete=/g, 'autoComplete=')
        // autofocus → autoFocus
        .replace(/autofocus=/g, 'autoFocus=')
        // maxlength → maxLength
        .replace(/maxlength=/g, 'maxLength=')
        // minlength → minLength  
        .replace(/minlength=/g, 'minLength=')
        // readonly → readOnly
        .replace(/readonly=/g, 'readOnly=')
        // spellcheck → spellCheck
        .replace(/spellcheck=/g, 'spellCheck=')
        // contenteditable → contentEditable
        .replace(/contenteditable=/g, 'contentEditable=')
        // crossorigin → crossOrigin
        .replace(/crossorigin=/g, 'crossOrigin=')
        // datetime → dateTime
        .replace(/datetime=/g, 'dateTime=')
        // enctype → encType
        .replace(/enctype=/g, 'encType=')
        // formaction → formAction
        .replace(/formaction=/g, 'formAction=')
        // formenctype → formEncType
        .replace(/formenctype=/g, 'formEncType=')
        // formmethod → formMethod
        .replace(/formmethod=/g, 'formMethod=')
        // formnovalidate → formNoValidate
        .replace(/formnovalidate=/g, 'formNoValidate=')
        // formtarget → formTarget
        .replace(/formtarget=/g, 'formTarget=')
        // hreflang → hrefLang
        .replace(/hreflang=/g, 'hrefLang=')
        // inputmode → inputMode
        .replace(/inputmode=/g, 'inputMode=')
        // srcset → srcSet
        .replace(/srcset=/g, 'srcSet=')
        // usemap → useMap
        .replace(/usemap=/g, 'useMap=');
    };
    
    // Apply conversion to all component code
    libraryData.components = libraryData.components.map((comp: any) => ({
      ...comp,
      code: convertHtmlToJsx(comp.code || ''),
    }));
    
    console.log('[Library] Converted HTML to JSX-compatible syntax');

    // Generate rich docs structure based on extracted data
    const componentCount = libraryData.components?.length || 0;
    const colorCount = Object.keys(libraryData.tokens?.colors || {}).length;
    const categories = [...new Set(libraryData.components?.map((c: any) => c.category) || [])];
    
    libraryData.docs = [
      { 
        id: "welcome", 
        title: "Welcome", 
        type: "welcome",
        description: "Introduction to your component library",
        content: `# Welcome to Your Design System\n\nThis library contains **${componentCount} components** extracted from your UI, organized into ${categories.length} categories.\n\n## Quick Stats\n- Components: ${componentCount}\n- Categories: ${categories.join(', ') || 'None'}\n- Color Tokens: ${colorCount}\n\n## Getting Started\nSelect a component from the sidebar to view its documentation, live preview, and available props.`
      },
      { 
        id: "getting-started", 
        title: "Getting Started", 
        type: "getting-started",
        description: "How to use components in your project",
        content: `# Getting Started\n\n## Installation\nCopy the component code directly into your project.\n\n## Usage\nEach component shows:\n- **Live Preview**: Interactive preview with zoom controls\n- **Code**: Copy-ready HTML/JSX\n- **Attributes**: Configurable props with live controls\n- **Variants**: Pre-built variations\n\n## Tips\n1. Use the Controls panel to test different prop values\n2. Toggle between Light/Dark backgrounds\n3. Copy code with one click`
      },
      { 
        id: "colors", 
        title: "Colors", 
        type: "colors",
        description: "Color palette and tokens",
        content: `# Color Tokens\n\nExtracted ${colorCount} colors from your design.\n\n${Object.entries(libraryData.tokens?.colors || {}).map(([name, value]) => `- **${name}**: \`${value}\``).join('\n') || 'No colors extracted.'}`
      },
      { 
        id: "typography", 
        title: "Typography", 
        type: "typography",
        description: "Font families, sizes, and weights",
        content: `# Typography\n\n## Font Families\n${Object.entries(libraryData.tokens?.typography?.fontFamily || {}).map(([name, value]) => `- **${name}**: ${value}`).join('\n') || 'Default system fonts'}\n\n## Font Sizes\n${Object.entries(libraryData.tokens?.typography?.fontSize || {}).map(([name, value]) => `- **${name}**: ${value}`).join('\n') || 'Standard Tailwind sizes'}`
      },
      { 
        id: "iconography", 
        title: "Iconography", 
        type: "iconography",
        description: "Icons used across components",
        content: `# Iconography\n\nComponents use emoji icons for compatibility. Common icons:\n\n- 🏠 Home\n- 🔍 Search\n- ⚙️ Settings\n- 👤 User\n- 🔔 Bell\n- ✉️ Mail\n- ⭐ Star\n- ❤️ Heart`
      },
      { 
        id: "examples", 
        title: "Examples", 
        type: "examples",
        description: "Usage examples and patterns",
        content: `# Examples\n\n## Component Categories\n\n${categories.map(cat => {
          const catStr = String(cat || 'other');
          const catComponents = libraryData.components?.filter((c: any) => c.category === cat) || [];
          return `### ${catStr.charAt(0).toUpperCase() + catStr.slice(1)}\n${catComponents.map((c: any) => `- **${c.name}**: ${c.description || 'No description'}`).join('\n')}`;
        }).join('\n\n') || 'No components found.'}`
      },
    ];

    // Ensure typography sub-objects
    if (!libraryData.tokens.typography.fontFamily) libraryData.tokens.typography.fontFamily = {};
    if (!libraryData.tokens.typography.fontSize) libraryData.tokens.typography.fontSize = {};
    if (!libraryData.tokens.typography.fontWeight) libraryData.tokens.typography.fontWeight = {};
    if (!libraryData.tokens.typography.lineHeight) libraryData.tokens.typography.lineHeight = {};
    if (!libraryData.tokens.spacing) libraryData.tokens.spacing = {};
    if (!libraryData.tokens.borderRadius) libraryData.tokens.borderRadius = {};

    console.log(`[Library] Final: ${libraryData.components.length} components, ${Object.keys(libraryData.tokens.colors).length} colors`);

    // Log component names for debugging
    if (libraryData.components.length > 0) {
      console.log(`[Library] Components found: ${libraryData.components.map((c: any) => c.name).join(', ')}`);
    }

    return NextResponse.json({
      success: true,
      data: libraryData,
      componentCount: libraryData.components.length,
      extractionTime: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error("[Library] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract library" },
      { status: 500 }
    );
  }
}
