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
  
  // Escape title and description for HTML
  const safeTitle = typedProject.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const safeDescription = (typedProject.description || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  // Badge HTML - small, subtle, bottom-right corner
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
    </script>
  ` : '';
  
  // Convert code to HTML if it's JSX/React
  const htmlContent = jsxToHtml(typedProject.code);
  
  // Extract body classes from original code to preserve styling
  const bodyClasses = extractBodyClasses(typedProject.code);
  
  // Extract custom styles from head section
  const customStyles = extractHeadStyles(typedProject.code);
  
  // Full HTML document - CLEAN, just the output
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}">
  
  <!-- Open Graph / Social -->
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDescription}">
  <meta property="og:url" content="https://www.replay.build/p/${typedProject.slug}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Replay">
  ${typedProject.thumbnail_url ? `<meta property="og:image" content="${typedProject.thumbnail_url}">` : ''}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDescription}">
  ${typedProject.thumbnail_url ? `<meta name="twitter:image" content="${typedProject.thumbnail_url}">` : ''}
  
  <!-- Canonical -->
  <link rel="canonical" href="https://www.replay.build/p/${typedProject.slug}">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- GSAP for animations -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
  
  <!-- Alpine.js for interactivity -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
  
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { min-height: 100vh; }
  </style>
  ${customStyles}
</head>
<body${bodyClasses ? ` class="${bodyClasses}"` : ''}>
${htmlContent}
${badgeHtml}
</body>
</html>`;
  
  return new NextResponse(fullHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

