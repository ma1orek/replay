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

// Convert JSX/React code to plain HTML for rendering
function jsxToHtml(code: string): string {
  if (!code) return '';
  
  let html = code;
  
  // If code is a React component, extract the JSX from return statement
  if (html.includes('export default function') || html.includes('function HomePage') || html.includes('export default')) {
    // Find "return (" and extract everything until matching closing paren
    const returnIndex = html.indexOf('return');
    if (returnIndex !== -1) {
      const afterReturn = html.slice(returnIndex + 6).trim();
      
      if (afterReturn.startsWith('(')) {
        // Count parentheses to find matching close
        let depth = 0;
        let startIdx = -1;
        let endIdx = -1;
        
        for (let i = 0; i < afterReturn.length; i++) {
          if (afterReturn[i] === '(') {
            if (depth === 0) startIdx = i + 1;
            depth++;
          } else if (afterReturn[i] === ')') {
            depth--;
            if (depth === 0) {
              endIdx = i;
              break;
            }
          }
        }
        
        if (startIdx !== -1 && endIdx !== -1) {
          html = afterReturn.slice(startIdx, endIdx).trim();
        }
      } else {
        // return without parens - take until ; or }
        const endMatch = afterReturn.match(/^([\s\S]+?)(?:;|\}\s*$)/);
        if (endMatch) {
          html = endMatch[1].trim();
        }
      }
    }
    
    // Remove React fragments
    html = html.replace(/<>\s*/g, '').replace(/\s*<\/>/g, '');
    html = html.replace(/<React\.Fragment>\s*/g, '').replace(/\s*<\/React\.Fragment>/g, '');
  }
  
  // Convert className to class
  html = html.replace(/className=/g, 'class=');
  
  // Convert JSX self-closing tags to proper HTML
  html = html.replace(/<([a-z][a-zA-Z0-9]*)\s+([^>]*?)\s*\/>/gi, '<$1 $2></$1>');
  
  // Remove JSX comments {/* ... */}
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  
  // Handle JSX expressions - remove simple ones but keep text
  // Don't remove expressions inside attributes
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
</head>
<body>
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

