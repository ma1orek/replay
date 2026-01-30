import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
  
  // CRITICAL FIX: Find the first COMPLETE HTML opening tag
  // Must start with < followed by valid tag name (not in middle of attribute)
  // Pattern: < at start of line or after whitespace, followed by tag name
  const validTags = 'div|section|main|header|footer|nav|aside|article|body|html|span|p|h[1-6]|ul|ol|li|a|button|form|input|img|table|thead|tbody|tr|td|th|figure|figcaption|blockquote|pre|code|label|select|option|textarea';
  
  // Look for opening tag that's NOT inside an attribute value
  // The tag must be preceded by start of string, newline, or whitespace (not letters/dots)
  const tagPattern = new RegExp(`(?:^|[\\s\\n>])(<(?:${validTags})(?:\\s|>|$))`, 'i');
  const match = html.match(tagPattern);
  
  if (match && match.index !== undefined) {
    // Find actual position of the < character
    const fullMatch = match[0];
    const tagStart = match[1];
    const offset = fullMatch.indexOf(tagStart);
    const startIndex = match.index + offset;
    
    // Take everything from this tag onwards
    html = html.slice(startIndex);
  } else {
    // Fallback: just find first < followed by valid tag
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
  
  // Convert JSX self-closing tags to proper HTML (but keep self-closing for void elements)
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
  // This catches cases where broken attributes leak through
  const firstRealTag = html.indexOf('<');
  if (firstRealTag > 0) {
    // Check if text before < is just whitespace or garbage
    const beforeTag = html.slice(0, firstRealTag);
    if (!/^\s*$/.test(beforeTag)) {
      // There's non-whitespace garbage before the tag - remove it
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
  const visibilityFixCss = `
<style id="visibility-fix">
  /* AGGRESSIVE VISIBILITY FIX - Force ALL elements visible */
  /* This overrides GSAP ScrollTrigger initial states */
  
  /* Target any element with inline opacity */
  [style*="opacity: 0"], [style*="opacity:0"], [style*="opacity: 0."] { opacity: 1 !important; }
  [style*="visibility: hidden"], [style*="visibility:hidden"] { visibility: visible !important; }
  [style*="translate"] { opacity: 1 !important; }
  
  /* Target animation classes */
  .fade-up, .fade-in, .fade-down, .slide-up, .slide-in, .slide-left, .slide-right,
  .scale-up, .rotate-in, .blur-fade, .animate-fade,
  [class*="fade-"], [class*="slide-"], [class*="stagger-"], [class*="animate-"],
  [class*="gsap"], [class*="scroll"] {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
  }
  
  /* Target stagger containers and their children */
  .stagger-cards, .stagger-cards > *,
  [class*="stagger"] > * {
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Target data attributes used by animation libs */
  [data-state="hidden"], [data-visible="false"], [data-aos],
  [data-scroll], [data-gsap], [data-animate] {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
  }
  
  /* Ensure ALL grid/flex children are visible */
  .grid > *, .flex > *,
  [class*="grid"] > *, [class*="flex"] > *,
  section > div, section > * {
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Target common card containers */
  [class*="card"], [class*="Card"],
  [class*="step"], [class*="Step"],
  [class*="feature"], [class*="Feature"],
  [class*="item"], [class*="Item"] {
    opacity: 1 !important;
    visibility: visible !important;
  }
  
  /* Fix transform-based hiding */
  [style*="translateY(-"], [style*="translateX(-"],
  [style*="translateY(100"], [style*="translateX(100"],
  [style*="scale(0"] {
    transform: none !important;
    opacity: 1 !important;
  }
</style>
<script>
// AGGRESSIVE visibility fix - runs multiple times to catch GSAP animations
(function() {
  function forceAllVisible() {
    document.querySelectorAll('*').forEach(function(el) {
      var style = window.getComputedStyle(el);
      // Fix opacity
      if (parseFloat(style.opacity) < 0.1) {
        el.style.setProperty('opacity', '1', 'important');
      }
      // Fix visibility
      if (style.visibility === 'hidden') {
        el.style.setProperty('visibility', 'visible', 'important');
      }
      // Fix display
      if (style.display === 'none' && !el.classList.contains('hidden') && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
        el.style.setProperty('display', 'block', 'important');
      }
    });
  }
  
  // Run immediately
  if (document.readyState === 'complete') {
    forceAllVisible();
  }
  
  // Run on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    forceAllVisible();
    setTimeout(forceAllVisible, 50);
    setTimeout(forceAllVisible, 150);
    setTimeout(forceAllVisible, 300);
  });
  
  // Run on load
  window.addEventListener('load', function() {
    forceAllVisible();
    setTimeout(forceAllVisible, 100);
    setTimeout(forceAllVisible, 300);
    setTimeout(forceAllVisible, 500);
    setTimeout(forceAllVisible, 1000);
  });
  
  // Run periodically for first 2 seconds to catch late animations
  var runCount = 0;
  var interval = setInterval(function() {
    forceAllVisible();
    runCount++;
    if (runCount > 20) clearInterval(interval);
  }, 100);
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
  ${typedProject.thumbnail_url ? `<meta property="og:image" content="${typedProject.thumbnail_url}">` : ''}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  ${typedProject.thumbnail_url ? `<meta name="twitter:image" content="${typedProject.thumbnail_url}">` : ''}
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
    
    // Inject visibility fix CSS into <head>
    if (code.includes('</head>')) {
      code = code.replace('</head>', `${visibilityFixCss}\n</head>`);
    } else if (code.includes('<body')) {
      code = code.replace('<body', `${visibilityFixCss}\n<body`);
    }
    
    // Inject badge before </body>
    if (badgeHtml) {
      if (code.includes('</body>')) {
        code = code.replace('</body>', `${badgeHtml}\n</body>`);
      } else if (code.includes('</html>')) {
        code = code.replace('</html>', `${badgeHtml}\n</html>`);
      } else {
        code = code + badgeHtml;
      }
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
  ${typedProject.thumbnail_url ? `<meta property="og:image" content="${typedProject.thumbnail_url}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${seoTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  ${typedProject.thumbnail_url ? `<meta name="twitter:image" content="${typedProject.thumbnail_url}">` : ''}
  
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
  
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
  
  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  
  <!-- Alpine.js for interactivity -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { min-height: 100vh; font-family: 'Inter', sans-serif; }
    /* AGGRESSIVE VISIBILITY FIX */
    [style*="opacity: 0"], [style*="opacity:0"] { opacity: 1 !important; }
    [style*="visibility: hidden"] { visibility: visible !important; }
    .fade-up, .fade-in, .fade-down, .slide-up, .slide-in, .slide-left, .slide-right,
    .scale-up, .rotate-in, .blur-fade, .animate-fade,
    [class*="fade-"], [class*="slide-"], [class*="stagger-"], [class*="animate-"],
    [class*="card"], [class*="Card"], [class*="step"], [class*="Step"] {
      opacity: 1 !important;
      visibility: visible !important;
    }
    .stagger-cards > *, [class*="stagger"] > * { opacity: 1 !important; visibility: visible !important; }
    .grid > *, .flex > *, section > div, section > * { opacity: 1 !important; visibility: visible !important; }
  </style>
  ${customStyles}
</head>
<body${bodyClasses ? ` class="${bodyClasses}"` : ''}>
${htmlContent}
${badgeHtml}
</body>
</html>`;
  }
  
  return new NextResponse(fullHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

