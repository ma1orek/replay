import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// Force dynamic rendering - prevent Vercel edge caching of published pages
export const dynamic = "force-dynamic";

interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  code: string;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
  user_id: string | null;
  hide_badge?: boolean;
}

// Extract body classes from HTML code
function extractBodyClasses(code: string): string {
  if (!code) return '';
  
  // Look for body tag with class attribute
  const bodyMatch = code.match(/<body[^>]*(?:class|className)=["']([^"']+)["'][^>]*>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1];
  }
  
  return '';
}

// Extract custom styles from head section
function extractHeadStyles(code: string): string {
  if (!code) return '';
  
  // Find all style tags in head
  const headMatch = code.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) return '';
  
  const headContent = headMatch[1];
  const styleMatches = headContent.match(/<style[^>]*>[\s\S]*?<\/style>/gi);
  
  if (styleMatches) {
    return styleMatches.join('\n');
  }
  
  return '';
}

// Convert JSX/React code to plain HTML for rendering
function jsxToHtml(code: string): string {
  if (!code) return '';
  
  let html = code.trim();
  
  // If code is already a full HTML document, extract BODY CONTENT only
  // (because we wrap it in our own HTML structure)
  if (/^<!DOCTYPE|^<html/i.test(html)) {
    html = html.replace(/className=/g, 'class=');
    
    // Find body tag start (can have attributes with newlines)
    const bodyOpenMatch = html.match(/<body[\s\S]*?>/i);
    if (bodyOpenMatch) {
      const bodyStartIndex = html.indexOf(bodyOpenMatch[0]) + bodyOpenMatch[0].length;
      let bodyEndIndex = html.lastIndexOf('</body>');
      
      // If no closing body tag, try </html> or end of string
      if (bodyEndIndex <= bodyStartIndex) {
        bodyEndIndex = html.lastIndexOf('</html>');
      }
      if (bodyEndIndex <= bodyStartIndex) {
        bodyEndIndex = html.length;
      }
      
      const content = html.slice(bodyStartIndex, bodyEndIndex);
      // Clean up any remaining closing tags
      const cleaned = content.replace(/<\/html>/gi, '').trim();
      if (cleaned.length > 0) {
        return cleaned;
      }
    }
    
    // Fallback: if no body tags found but it's HTML, try to extract content between html tags
    const htmlOpenMatch = html.match(/<html[\s\S]*?>/i);
    const htmlCloseIndex = html.lastIndexOf('</html>');
    if (htmlOpenMatch && htmlCloseIndex > 0) {
      const htmlStartIndex = html.indexOf(htmlOpenMatch[0]) + htmlOpenMatch[0].length;
      let content = html.slice(htmlStartIndex, htmlCloseIndex);
      // Remove head section if present
      content = content.replace(/<head[\s\S]*?<\/head>/i, '');
      // Remove body tags if present
      content = content.replace(/<body[\s\S]*?>/gi, '');
      content = content.replace(/<\/body>/gi, '');
      if (content.trim().length > 0) {
        return content.trim();
      }
    }
    
    // Last resort: return everything after </head> if present
    const headEndIndex = html.indexOf('</head>');
    if (headEndIndex > 0) {
      let content = html.slice(headEndIndex + 7);
      content = content.replace(/<body[\s\S]*?>/gi, '');
      content = content.replace(/<\/body>/gi, '');
      content = content.replace(/<\/html>/gi, '');
      return content.trim();
    }
    
    return html;
  }
  
  // If just starts with <body>, extract its content
  if (/^<body/i.test(html)) {
    html = html.replace(/className=/g, 'class=');
    const bodyOpenMatch = html.match(/<body[\s\S]*?>/i);
    if (bodyOpenMatch) {
      const bodyStartIndex = html.indexOf(bodyOpenMatch[0]) + bodyOpenMatch[0].length;
      let bodyEndIndex = html.lastIndexOf('</body>');
      if (bodyEndIndex <= bodyStartIndex) {
        bodyEndIndex = html.length;
      }
      return html.slice(bodyStartIndex, bodyEndIndex).trim();
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLE JSX/REACT CODE FORMAT: export default function ComponentName() { return (...) }
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Check if this is JSX/React code (starts with comments, imports, or function)
  const isJsxCode = /^\/\/|^['"]use client|^import\s|^export\s+default|^function\s+\w+Page/i.test(html.trim());
  
  if (isJsxCode) {
    // Remove leading comments
    html = html.replace(/^(\/\/[^\n]*\n?)+/gm, '');
    
    // Remove "use client" directive
    html = html.replace(/^['"]use client['"];\s*/m, '');
    
    // Remove import statements
    html = html.replace(/^import\s+[^;]+;\s*/gm, '');
    
    // Extract content from "export default function ...() { return (...) }"
    const returnMatch = html.match(/return\s*\(\s*([\s\S]*)\s*\)\s*;?\s*\}?\s*$/);
    if (returnMatch && returnMatch[1]) {
      html = returnMatch[1].trim();
      // Remove trailing );}
      html = html.replace(/\s*\)\s*;?\s*\}?\s*$/, '');
    } else {
      // Try to find JSX starting with < after function declaration
      const jsxStartMatch = html.match(/(?:function\s+\w+\s*\([^)]*\)\s*\{[\s\S]*?return\s*\()?\s*(<[\s\S]+)/);
      if (jsxStartMatch && jsxStartMatch[1]) {
        html = jsxStartMatch[1].trim();
        html = html.replace(/\s*\)\s*;?\s*\}?\s*$/, '');
      }
    }
    
    // Remove function declarations
    html = html.replace(/^(export\s+)?(default\s+)?function\s+\w+\s*\([^)]*\)\s*\{\s*/m, '');
    html = html.replace(/^const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{?\s*/m, '');
    
    // Remove const declarations (state, variables)
    html = html.replace(/const\s+\[?\w+[^\n]*\n/g, '');
    html = html.replace(/\/\/[^\n]*\n/g, '');
  }
  
  // CRITICAL FIX: Find the first COMPLETE HTML opening tag
  const validTags = 'div|section|main|header|footer|nav|aside|article|body|html|span|p|h[1-6]|ul|ol|li|a|button|form|input|img|table|thead|tbody|tr|td|th|figure|figcaption|blockquote|pre|code|label|select|option|textarea';
  
  const tagPattern = new RegExp(`(?:^|[\\s\\n>])(<(?:${validTags})(?:\\s|>|$))`, 'i');
  const match = html.match(tagPattern);
  
  if (match && match.index !== undefined) {
    const fullMatch = match[0];
    const tagStart = match[1];
    const offset = fullMatch.indexOf(tagStart);
    const startIndex = match.index + offset;
    html = html.slice(startIndex);
  } else {
    const fallbackMatch = html.match(new RegExp(`<(${validTags})[\\s>]`, 'i'));
    if (fallbackMatch && fallbackMatch.index !== undefined) {
      html = html.slice(fallbackMatch.index);
    }
  }
  
  // Remove trailing ); or } from React component
  html = html.replace(/\s*\)\s*;?\s*\}?\s*$/, '');
  
  // Remove React fragments
  html = html.replace(/<>\s*/g, '').replace(/\s*<\/>/g, '');
  html = html.replace(/<React\.Fragment>\s*/g, '').replace(/\s*<\/React\.Fragment>/g, '');
  
  // Convert className to class
  html = html.replace(/className=/g, 'class=');
  
  // Convert JSX self-closing tags to proper HTML
  const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
  html = html.replace(/<([a-z][a-zA-Z0-9]*)\s+([^>]*?)\s*\/>/gi, (match, tag, attrs) => {
    if (voidElements.includes(tag.toLowerCase())) {
      return `<${tag} ${attrs}>`;
    }
    return `<${tag} ${attrs}></${tag}>`;
  });
  
  // Remove JSX comments {/* ... */}
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  
  // Handle JSX expressions - remove simple ones but keep text
  html = html.replace(/>(\s*)\{[^}]*\}(\s*)</g, '>$1$2<');
  
  // Fix htmlFor -> for
  html = html.replace(/htmlFor=/g, 'for=');
  
  // Fix boolean attributes
  html = html.replace(/(\w+)=\{true\}/g, '$1');
  html = html.replace(/(\w+)=\{false\}/g, '');
  
  // Convert style objects to CSS strings
  html = html.replace(/style=\{\{([^}]+)\}\}/g, (_, styles) => {
    const cssStyles = styles
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/:\s*['"]?([^'",}]+)['"]?/g, ': $1')
      .replace(/,\s*/g, '; ')
      .trim();
    return `style="${cssStyles}"`;
  });
  
  // FINAL CLEANUP: Remove any garbage text before first < tag
  const firstRealTag = html.indexOf('<');
  if (firstRealTag > 0) {
    const beforeTag = html.slice(0, firstRealTag);
    if (!/^\s*$/.test(beforeTag)) {
      html = html.slice(firstRealTag);
    }
  }
  
  return html;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await createServerSupabaseClient();
  
  const { data: project, error } = await supabase
    .from("published_projects")
    .select("*")
    .eq("slug", params.slug)
    .single();
  
  if (error || !project) {
    // Return a nice 404 page
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Project Not Found | Replay</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="min-h-screen bg-[#030303] flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-white mb-4">404</h1>
            <p class="text-white/50 mb-8">Project not found</p>
            <a href="https://www.replay.build" class="px-6 py-3 bg-[#FF6E3C] text-white rounded-lg hover:bg-[#FF8F5C] transition-colors">
              Go to Replay
            </a>
          </div>
        </body>
      </html>
    `, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  
  // Increment view count (fire and forget)
  supabase
    .from("published_projects")
    .update({ views: (project.views || 0) + 1 })
    .eq("slug", params.slug)
    .then(() => {});
  
  const typedProject = project as Project;
  const showBadge = !typedProject.hide_badge;
  
  // Escape description for HTML (title not used in browser tab)
  const safeDescription = (typedProject.description || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // Use simple title for SEO only, not displayed in browser tab
  const seoTitle = typedProject.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  // Visibility fix CSS - forces all elements visible (AI generates opacity:0 for GSAP animations)
  // IMPORTANT: Must NOT force opacity on grain/noise canvas overlays (intentional semi-transparent effects)
  const visibilityFixCss = `
<style id="visibility-fix">
  /* VISIBILITY FIX - Force animation-hidden elements visible */
  /* Excludes: canvas overlays, grain/noise effects, script/style tags */

  /* Target exact opacity:0 — excludes decorative overlays (grain/noise) with pointer-events:none */
  [style*="opacity: 0;"]:not(canvas):not([style*="pointer-events"]):not(.pointer-events-none),
  [style*="opacity:0;"]:not(canvas):not([style*="pointer-events"]):not(.pointer-events-none) { opacity: 1 !important; }
  [style$="opacity: 0"]:not(canvas):not([style*="pointer-events"]):not(.pointer-events-none),
  [style$="opacity:0"]:not(canvas):not([style*="pointer-events"]):not(.pointer-events-none) { opacity: 1 !important; }
  [style*="visibility: hidden"], [style*="visibility:hidden"] { visibility: visible !important; }

  /* Target animation classes — NOT decorative overlays (pointer-events:none excluded) */
  .fade-up:not(.pointer-events-none), .fade-in:not(.pointer-events-none), .fade-down:not(.pointer-events-none),
  .slide-up:not(.pointer-events-none), .slide-in:not(.pointer-events-none), .slide-left:not(.pointer-events-none), .slide-right:not(.pointer-events-none),
  .scale-up:not(.pointer-events-none), .rotate-in:not(.pointer-events-none), .blur-fade:not(.pointer-events-none), .animate-fade:not(.pointer-events-none),
  [class*="fade-"]:not(.pointer-events-none):not([style*="pointer-events"]),
  [class*="slide-"]:not(.pointer-events-none):not([style*="pointer-events"]),
  [class*="stagger-"]:not(.pointer-events-none):not([style*="pointer-events"]),
  [class*="gsap"]:not(.pointer-events-none):not([style*="pointer-events"]),
  [class*="scroll"]:not(.pointer-events-none):not([style*="pointer-events"]) {
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Target stagger containers and their children */
  .stagger-cards:not(.pointer-events-none), .stagger-cards > *:not([style*="pointer-events"]):not(.pointer-events-none),
  [class*="stagger"] > *:not([style*="pointer-events"]):not(.pointer-events-none) {
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Target data attributes used by animation libs — NOT decorative overlays */
  [data-state="hidden"]:not(.pointer-events-none), [data-visible="false"]:not(.pointer-events-none),
  [data-aos]:not(.pointer-events-none), [data-scroll]:not(.pointer-events-none),
  [data-gsap]:not(.pointer-events-none), [data-animate]:not(.pointer-events-none) {
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* Target common card containers — NOT decorative overlays */
  [class*="card"]:not([style*="pointer-events"]):not(.pointer-events-none),
  [class*="Card"]:not([style*="pointer-events"]):not(.pointer-events-none),
  [class*="step"]:not(.pointer-events-none), [class*="Step"]:not(.pointer-events-none),
  [class*="feature"]:not(.pointer-events-none), [class*="Feature"]:not(.pointer-events-none),
  [class*="item"]:not([style*="pointer-events"]):not(.pointer-events-none),
  [class*="Item"]:not([style*="pointer-events"]):not(.pointer-events-none) {
    opacity: 1 !important;
    visibility: visible !important;
  }

  /* CANVAS CHART SAFETY NET - prevent Chart.js canvas from growing to insane heights */
  canvas[id*="chart" i], canvas[id*="Chart"], canvas[id*="graph" i], canvas[id*="Graph"] {
    max-height: 400px !important;
  }
</style>
<script>
(function() {
  function forceVisible() {
    document.querySelectorAll('*').forEach(function(el) {
      var cs = window.getComputedStyle(el);
      // Skip decorative overlays (noise/grain/texture) — pointer-events:none + fixed/absolute
      if (cs.pointerEvents === 'none' && (cs.position === 'fixed' || cs.position === 'absolute')) return;
      if (parseFloat(cs.opacity) === 0) el.style.setProperty('opacity', '1', 'important');
      if (cs.visibility === 'hidden') el.style.setProperty('visibility', 'visible', 'important');
    });
  }
  // Protect grain/noise overlays: if old aggressive forceVisible (from DB HTML) forced them
  // to opacity:1, undo it by removing the inline override and letting CSS define the opacity.
  function protectGrainOverlays() {
    document.querySelectorAll('*').forEach(function(el) {
      var cs = window.getComputedStyle(el);
      if (cs.pointerEvents !== 'none') return;
      if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
      if (el.style.opacity === '1') {
        el.style.removeProperty('opacity');
        var cssOpacity = parseFloat(window.getComputedStyle(el).opacity);
        if (cssOpacity >= 0.5) { el.style.opacity = '1'; } // intentionally opaque — restore
        // else: CSS controls opacity (grain at 0.02-0.1 will render correctly)
      }
    });
  }
  document.addEventListener('DOMContentLoaded', function() { forceVisible(); setTimeout(forceVisible, 100); setTimeout(forceVisible, 300); });
  window.addEventListener('load', function() { forceVisible(); setTimeout(forceVisible, 100); setTimeout(forceVisible, 500); setTimeout(protectGrainOverlays, 200); setTimeout(protectGrainOverlays, 800); });
})();
</script>
`;

  // Badge HTML - small, subtle, bottom-right corner (injected before </body>)
  const badgeHtml = showBadge ? `
    <a 
      href="https://www.replay.build?ref=badge" 
      target="_blank" 
      rel="noopener noreferrer"
      id="replay-badge"
      style="
        position: fixed;
        bottom: 16px;
        right: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 14px;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(8px);
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.85);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 12px;
        font-weight: 500;
        text-decoration: none;
        z-index: 99999;
        transition: all 0.2s ease;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
      "
    >
      <svg id="replay-logo" width="16" height="16" viewBox="0 0 82 109" fill="none" style="flex-shrink: 0;">
        <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="#FF6E3C" stroke-width="9" stroke-linejoin="round"/>
        <rect x="32" y="90" width="38" height="9" rx="4.5" transform="rotate(-30 32 90)" fill="#FF6E3C"/>
      </svg>
      Built with Replay
    </a>
    <script>
      var badge = document.getElementById('replay-badge');
      var logo = document.getElementById('replay-logo');
      if (badge && logo) {
        badge.addEventListener('mouseenter', function() {
          this.style.background = 'rgba(255, 110, 60, 1)';
          this.style.color = 'white';
          this.style.transform = 'scale(1.03)';
          this.style.borderColor = 'rgba(255, 140, 90, 0.5)';
          logo.querySelector('path').setAttribute('stroke', 'white');
          logo.querySelector('rect').setAttribute('fill', 'white');
        });
        badge.addEventListener('mouseleave', function() {
          this.style.background = 'rgba(0, 0, 0, 0.9)';
          this.style.color = 'rgba(255, 255, 255, 0.85)';
          this.style.transform = 'scale(1)';
          this.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          logo.querySelector('path').setAttribute('stroke', '#FF6E3C');
          logo.querySelector('rect').setAttribute('fill', '#FF6E3C');
        });
      }
    </script>
  ` : '';
  
  let code = typedProject.code || '';
  
  // Check if this is a full HTML document with React/Babel (our generated code format)
  const isFullHtmlWithReact = code.includes('<!DOCTYPE') && 
    (code.includes('react.production.min.js') || code.includes('babel.min.js') || code.includes('type="text/babel"'));
  
  // Check if this is a full HTML document (any kind)
  const isFullHtml = /^<!DOCTYPE|^<html/i.test(code.trim());
  
  let fullHtml: string;
  
  if (isFullHtmlWithReact || isFullHtml) {
    // ═══════════════════════════════════════════════════════════════════════════
    // FULL HTML DOCUMENT - Preserve everything, just inject SEO meta and badge
    // This handles React/Babel code that MUST keep all scripts intact!
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Inject SEO meta tags into <head> (no title in browser tab - cleaner look)
    const seoMeta = `
  <meta name="description" content="${safeDescription}">
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="https://www.replay.build/p/${typedProject.slug}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Replay">
  <meta property="og:image" content="${typedProject.thumbnail_url || 'https://replay.build/imgg.png'}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${typedProject.thumbnail_url || 'https://replay.build/imgg.png'}">
  <link rel="canonical" href="https://www.replay.build/p/${typedProject.slug}">`;
    
    // Replace or inject title (remove existing title first)
    code = code.replace(/<title>[^<]*<\/title>/i, '');
    
    // Inject SEO meta after <head> or after charset meta
    if (code.includes('<head>')) {
      code = code.replace('<head>', `<head>${seoMeta}`);
    } else if (code.includes('<head ')) {
      code = code.replace(/<head[^>]*>/, (match) => `${match}${seoMeta}`);
    } else {
      // Inject after <!DOCTYPE html>
      code = code.replace(/<!DOCTYPE[^>]*>/i, (match) => `${match}\n<html lang="en"><head>${seoMeta}</head>`);
    }
    
    // STRIP old publish-time visibility fix CSS (safe — matches exact id attribute, no false positives)
    code = code.replace(/<style id="publish-visibility-fix">[\s\S]*?<\/style>/g, '<!-- old publish-visibility-fix stripped -->');
    // NOTE: We do NOT strip forceVisible scripts by regex — regex stops at first </script>
    // which can be inside a template literal in AI-generated code, corrupting the page.
    // Instead: the new injected CSS below has :not(.pointer-events-none) exclusions that
    // protect grain/noise overlays even if old forceVisible JS is still present.

    // Inject corrected visibility fix CSS into <head>
    if (code.includes('</head>')) {
      code = code.replace('</head>', `${visibilityFixCss}\n</head>`);
    } else if (code.includes('<body')) {
      code = code.replace('<body', `${visibilityFixCss}\n<body`);
    }
    
    // CRITICAL: Add data-presets="react" to Babel scripts that don't have it
    // This fixes "Unexpected token" errors on const/let
    if (code.includes('<script type="text/babel">') && !code.includes('data-presets="react"')) {
      code = code.replace(/<script type="text\/babel">/g, '<script type="text/babel" data-presets="react">');
    }
    
    // CRITICAL: Inject React hooks globals right after React loads
    // This fixes "useRef is not defined" errors
    const reactHooksScript = `<script>if(typeof React!=='undefined'){window.useState=React.useState;window.useEffect=React.useEffect;window.useRef=React.useRef;window.useCallback=React.useCallback;window.useMemo=React.useMemo;window.useContext=React.useContext;window.useReducer=React.useReducer;window.useLayoutEffect=React.useLayoutEffect;window.Fragment=React.Fragment;}</script>`;

    // Inject after babel.min.js script (right before </head>)
    if (code.includes('</head>')) {
      code = code.replace('</head>', `${reactHooksScript}\n</head>`);
    }

    // CRITICAL: Alpine.js initialization script (MUST match preview behavior)
    // Fixes: mobile menu visible on desktop, broken multi-page navigation, overlapping elements
    const alpineInitScript = `<script>
(function() {
  function initAlpineDefaults() {
    try {
      var root = document.querySelector('[x-data]');
      if (root && root._x_dataStack && root._x_dataStack[0]) {
        var data = root._x_dataStack[0];

        // Ensure mobile menu starts CLOSED (fixes mobile menu on desktop)
        if (data.mobileMenuOpen !== undefined) data.mobileMenuOpen = false;
        if (data.menuOpen !== undefined) data.menuOpen = false;
        if (data.isMenuOpen !== undefined) data.isMenuOpen = false;
        if (data.showMenu !== undefined) data.showMenu = false;

        // Set default page to home/first (fixes multi-page navigation)
        if (data.currentPage !== undefined && !data.currentPage) data.currentPage = 'home';
        if (data.page !== undefined && !data.page) data.page = 'home';
        if (data.activeTab !== undefined && !data.activeTab) data.activeTab = 'home';
        if (data.activeView !== undefined && !data.activeView) data.activeView = 'home';

        console.log('Alpine defaults set:', data);
      }
    } catch (e) {
      console.log('Alpine init error:', e);
    }
  }

  // Run on Alpine.js events (most reliable)
  document.addEventListener('alpine:init', initAlpineDefaults);
  document.addEventListener('alpine:initialized', initAlpineDefaults);

  // Run on page load (backup)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAlpineDefaults, 50);
    setTimeout(initAlpineDefaults, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initAlpineDefaults, 50);
      setTimeout(initAlpineDefaults, 200);
    });
  }
})();
</script>`;

    // Inject Alpine init script + badge before </body>
    if (code.includes('</body>')) {
      code = code.replace('</body>', `${alpineInitScript}\n${badgeHtml}\n</body>`);
    } else if (code.includes('</html>')) {
      code = code.replace('</html>', `${alpineInitScript}\n${badgeHtml}\n</html>`);
    } else {
      code = code + alpineInitScript + badgeHtml;
    }
    
    fullHtml = code;
  } else {
    // ═══════════════════════════════════════════════════════════════════════════
    // JSX/PARTIAL CODE - Wrap in full HTML document (legacy fallback)
    // ═══════════════════════════════════════════════════════════════════════════
    
    let htmlContent = jsxToHtml(code);
    
    // Final safety: if still empty, show error message
    if (!htmlContent || htmlContent.trim().length === 0) {
      htmlContent = '<div style="padding: 40px; text-align: center; color: #666;">Content could not be rendered. Please try republishing.</div>';
    }
    
    // Extract body classes from original code to preserve styling
    const bodyClasses = extractBodyClasses(code);
    
    // Extract custom styles from head section
    const customStyles = extractHeadStyles(code);
    
    fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${safeDescription}">
  
  <!-- Open Graph / Social -->
  <meta property="og:title" content="${seoTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="https://www.replay.build/p/${typedProject.slug}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Replay">
  <meta property="og:image" content="${typedProject.thumbnail_url || 'https://replay.build/imgg.png'}">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  <meta name="twitter:image" content="${typedProject.thumbnail_url || 'https://replay.build/imgg.png'}">

  <!-- Canonical -->
  <link rel="canonical" href="https://www.replay.build/p/${typedProject.slug}">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- GSAP for animations -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  
  <!-- React + Babel for React components -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  
  <!-- Make React hooks globally available for Babel scripts -->
  <script>
    const { useState, useEffect, useRef, useCallback, useMemo, useContext, useReducer, useLayoutEffect } = React;
  </script>
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>

  <!-- Rive Animations -->
  <script src="https://unpkg.com/@rive-app/canvas@2.23.7/rive.js"></script>

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  
  <!-- Alpine.js for interactivity -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { min-height: 100vh; font-family: 'Inter', sans-serif; }
    /* VISIBILITY FIX - excludes decorative overlays (grain/noise with pointer-events:none) */
    [style*="opacity: 0;"]:not(canvas):not([style*="pointer-events"]):not(.pointer-events-none),
    [style*="opacity:0;"]:not(canvas):not([style*="pointer-events"]):not(.pointer-events-none) { opacity: 1 !important; }
    [style$="opacity: 0"]:not(canvas):not([style*="pointer-events"]):not(.pointer-events-none),
    [style$="opacity:0"]:not(canvas):not([style*="pointer-events"]):not(.pointer-events-none) { opacity: 1 !important; }
    [style*="visibility: hidden"] { visibility: visible !important; }
    .fade-up:not(.pointer-events-none), .fade-in:not(.pointer-events-none), .fade-down:not(.pointer-events-none),
    .slide-up:not(.pointer-events-none), .slide-in:not(.pointer-events-none), .slide-left:not(.pointer-events-none), .slide-right:not(.pointer-events-none),
    .scale-up:not(.pointer-events-none), .rotate-in:not(.pointer-events-none), .blur-fade:not(.pointer-events-none), .animate-fade:not(.pointer-events-none),
    [class*="fade-"]:not(.pointer-events-none):not([style*="pointer-events"]),
    [class*="slide-"]:not(.pointer-events-none):not([style*="pointer-events"]),
    [class*="stagger-"]:not(.pointer-events-none):not([style*="pointer-events"]),
    [class*="animate-"]:not(.pointer-events-none):not([style*="pointer-events"]),
    [class*="card"]:not([style*="pointer-events"]):not(.pointer-events-none),
    [class*="Card"]:not([style*="pointer-events"]):not(.pointer-events-none),
    [class*="step"]:not(.pointer-events-none), [class*="Step"]:not(.pointer-events-none) {
      opacity: 1 !important;
      visibility: visible !important;
    }
    .stagger-cards > *:not([style*="pointer-events"]):not(.pointer-events-none),
    [class*="stagger"] > *:not([style*="pointer-events"]):not(.pointer-events-none) { opacity: 1 !important; visibility: visible !important; }
    /* Canvas chart safety net */
    canvas[id*="chart" i], canvas[id*="Chart"], canvas[id*="graph" i], canvas[id*="Graph"] { max-height: 400px !important; }
  </style>
  <script>
  (function() {
    function forceVisible() {
      document.querySelectorAll('*').forEach(function(el) {
        var cs = window.getComputedStyle(el);
        if (cs.pointerEvents === 'none' && (cs.position === 'fixed' || cs.position === 'absolute')) return;
        if (parseFloat(cs.opacity) === 0) el.style.setProperty('opacity', '1', 'important');
        if (cs.visibility === 'hidden') el.style.setProperty('visibility', 'visible', 'important');
      });
    }
    document.addEventListener('DOMContentLoaded', function() { forceVisible(); setTimeout(forceVisible, 100); setTimeout(forceVisible, 300); });
    window.addEventListener('load', function() { forceVisible(); setTimeout(forceVisible, 100); setTimeout(forceVisible, 500); });
  })();
  </script>
  ${customStyles}
</head>
<body${bodyClasses ? ` class="${bodyClasses}"` : ''}>
${htmlContent}
<script>
(function() {
  function initAlpineDefaults() {
    try {
      var root = document.querySelector('[x-data]');
      if (root && root._x_dataStack && root._x_dataStack[0]) {
        var data = root._x_dataStack[0];

        // Ensure mobile menu starts CLOSED (fixes mobile menu on desktop)
        if (data.mobileMenuOpen !== undefined) data.mobileMenuOpen = false;
        if (data.menuOpen !== undefined) data.menuOpen = false;
        if (data.isMenuOpen !== undefined) data.isMenuOpen = false;
        if (data.showMenu !== undefined) data.showMenu = false;

        // Set default page to home/first (fixes multi-page navigation)
        if (data.currentPage !== undefined && !data.currentPage) data.currentPage = 'home';
        if (data.page !== undefined && !data.page) data.page = 'home';
        if (data.activeTab !== undefined && !data.activeTab) data.activeTab = 'home';
        if (data.activeView !== undefined && !data.activeView) data.activeView = 'home';

        console.log('Alpine defaults set:', data);
      }
    } catch (e) {
      console.log('Alpine init error:', e);
    }
  }

  // Run on Alpine.js events (most reliable)
  document.addEventListener('alpine:init', initAlpineDefaults);
  document.addEventListener('alpine:initialized', initAlpineDefaults);

  // Run on page load (backup)
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initAlpineDefaults, 50);
    setTimeout(initAlpineDefaults, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initAlpineDefaults, 50);
      setTimeout(initAlpineDefaults, 200);
    });
  }
})();
</script>
${badgeHtml}
</body>
</html>`;
  }
  
  return new NextResponse(fullHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // NO CACHE - ensures updates are immediately visible after republishing
      // s-maxage=0 prevents Vercel Edge Cache from caching (critical!)
      "Cache-Control": "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0, stale-while-revalidate=0",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}

