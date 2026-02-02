/**
 * Agentic Vision Prompts
 * 
 * Prompts for Gemini 3 Flash with Code Execution
 * "Measure twice, cut once" - The Sandwich Architecture
 */

// ============================================================================
// PHASE 1: THE SURVEYOR - Measures BEFORE generation
// ============================================================================

export const SURVEYOR_PROMPT = `You are THE SURVEYOR - a precision measurement AI.
Your job is to MEASURE, not describe. Write Python code to extract HARD DATA.

CRITICAL: Return measurements in NORMALIZED COORDINATES (0.0-1.0) AND pixel values.
The image you see may be scaled - always return both for backend rescaling.

Available Python libraries:
- numpy, PIL (Pillow), scipy, sklearn
- skimage (scikit-image) for edge detection

═══════════════════════════════════════════════════════════════════════════════
REQUIRED MEASUREMENTS - Write Python code for EACH:
═══════════════════════════════════════════════════════════════════════════════

1. IMAGE DIMENSIONS
\`\`\`python
from PIL import Image
import numpy as np

# Get image dimensions first
img = Image.open(image_path) if isinstance(image_path, str) else image
width, height = img.size
print(f"IMAGE_DIMENSIONS: {width}x{height}")
\`\`\`

2. GRID DETECTION
\`\`\`python
# Detect vertical lines to count columns
# Use edge detection or line detection
from scipy import ndimage
import numpy as np

img_array = np.array(img.convert('L'))
# Detect vertical edges
sobel_v = ndimage.sobel(img_array, axis=1)
# Count major vertical divisions
# Output: columns, gap between them
\`\`\`

3. SPACING MEASUREMENT (CRITICAL!)
\`\`\`python
# Detect component edges using contour detection
from skimage import filters, measure
import numpy as np

# Find edges and measure distances
# Output EXACT pixel values:
# - sidebarWidth (if sidebar exists)
# - navHeight (if navbar exists)  
# - cardPadding (internal card spacing)
# - sectionGap (space between sections)
# - containerPadding (main content padding)
\`\`\`

4. COLOR SAMPLING (Sample actual pixels!)
\`\`\`python
from PIL import Image
import numpy as np

img_array = np.array(img.convert('RGB'))

# Sample from specific locations:
# - background: center of main area
# - surface: card background (if cards exist)
# - primary: accent/button color
# - text: heading text color
# - border: card/section border color

def get_pixel_hex(img_array, x, y):
    r, g, b = img_array[y, x]
    return f"#{r:02x}{g:02x}{b:02x}"

# Sample multiple points and average for accuracy
\`\`\`

5. TYPOGRAPHY MEASUREMENT
\`\`\`python
# Detect text regions and measure character heights
# Use contour analysis on text areas
# Output: h1, h2, body, small font sizes in pixels
\`\`\`

6. COMPONENT BOUNDARIES
\`\`\`python
# Draw bounding boxes around major UI regions
# Return NORMALIZED coordinates (0-1) for scaling
# Types: sidebar, navbar, main, card, table, chart, form, footer

def normalize_bbox(x, y, w, h, img_width, img_height):
    return {
        "x": x / img_width,
        "y": y / img_height,
        "width": w / img_width,
        "height": h / img_height
    }
\`\`\`

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT - Return ONLY this JSON structure:
═══════════════════════════════════════════════════════════════════════════════

{
  "imageDimensions": { "width": 1920, "height": 1080 },
  "grid": {
    "columns": 12,
    "gap": "24px",
    "gutters": "16px"
  },
  "spacing": {
    "sidebarWidth": "256px",
    "navHeight": "64px",
    "cardPadding": "24px",
    "sectionGap": "48px",
    "containerPadding": "32px",
    "cardGap": "24px"
  },
  "colors": {
    "background": "#0f172a",
    "surface": "#1e293b",
    "primary": "#6366f1",
    "secondary": "#8b5cf6",
    "text": "#ffffff",
    "textMuted": "#94a3b8",
    "border": "#334155"
  },
  "typography": {
    "h1": "48px",
    "h2": "32px",
    "h3": "24px",
    "body": "16px",
    "small": "14px"
  },
  "components": [
    {
      "type": "sidebar",
      "bbox": { "x": 0.0, "y": 0.0, "width": 0.133, "height": 1.0 },
      "pixelBbox": { "x": 0, "y": 0, "width": 256, "height": 1080 },
      "confidence": 0.95
    },
    {
      "type": "navbar",
      "bbox": { "x": 0.133, "y": 0.0, "width": 0.867, "height": 0.059 },
      "pixelBbox": { "x": 256, "y": 0, "width": 1664, "height": 64 },
      "confidence": 0.92
    }
  ],
  "confidence": 0.91,
  "warnings": []
}

IMPORTANT:
- Every pixel measurement MUST come from actual code execution
- Colors MUST be sampled from actual pixels, not guessed
- Return JSON only, no markdown, no explanations
- If a measurement is uncertain, include it in warnings array

Analyze the image and execute measurement code:`;

// ============================================================================
// PHASE 1 VARIANTS: Parallel execution for speed
// ============================================================================

export const SURVEYOR_COLORS_PROMPT = `You are a COLOR SURVEYOR. Extract exact colors AND detect theme from this UI image.

Write Python code to:
1. Load the image with PIL
2. FIRST: Detect if theme is LIGHT or DARK by checking background brightness
3. Sample pixels from key areas:
   - Background (center area, avoid text)
   - Surface/Card background (if cards exist)
   - Primary accent color (buttons, links)
   - Text colors (headings, body)
   - Border colors (dividers, card edges)
4. Return hex values AND theme

Use this sampling technique:
\`\`\`python
from PIL import Image
import numpy as np

img = Image.open(io.BytesIO(image_data)).convert('RGB')
img_array = np.array(img)
h, w = img_array.shape[:2]

def sample_area(img_array, x, y, size=5):
    """Sample average color from a small region"""
    region = img_array[max(0,y-size):y+size, max(0,x-size):x+size]
    avg = region.mean(axis=(0,1)).astype(int)
    return f"#{avg[0]:02x}{avg[1]:02x}{avg[2]:02x}"

def get_brightness(hex_color):
    """Calculate perceived brightness (0-255)"""
    r = int(hex_color[1:3], 16)
    g = int(hex_color[3:5], 16)
    b = int(hex_color[5:7], 16)
    return (r * 299 + g * 587 + b * 114) / 1000

# Sample background from multiple points and average
bg_samples = []
for x_ratio in [0.5, 0.6, 0.7, 0.8]:
    for y_ratio in [0.3, 0.5, 0.7]:
        bg_samples.append(sample_area(img_array, int(w*x_ratio), int(h*y_ratio)))

# Get most common background color
from collections import Counter
background = Counter(bg_samples).most_common(1)[0][0]

# Detect theme based on background brightness
bg_brightness = get_brightness(background)
theme = "light" if bg_brightness > 127 else "dark"
print(f"Detected theme: {theme} (brightness: {bg_brightness})")
\`\`\`

Return JSON only:
{
  "theme": "dark|light",
  "colors": {
    "background": "#hex",
    "surface": "#hex", 
    "primary": "#hex",
    "text": "#hex",
    "textMuted": "#hex",
    "border": "#hex"
  },
  "brightness": 0-255,
  "samples": [
    {"location": "background-center", "hex": "#hex", "x": 0.7, "y": 0.5}
  ]
}`;

export const SURVEYOR_SPACING_PROMPT = `You are a SPACING SURVEYOR. Measure exact pixel distances AND detect layout structure in this UI.

Write Python code to:
1. Detect major UI regions (sidebar, navbar, content area)
2. Use edge detection to find component boundaries
3. Measure pixel distances between elements
4. CRITICAL: Detect LAYOUT TYPE - is navigation on LEFT (sidebar) or TOP (horizontal navbar)?

Key measurements needed:
- Sidebar width (if exists on LEFT side)
- Navbar height (if exists on TOP)
- Content padding (from edge to first element)
- Card padding (internal spacing)
- Gap between cards/sections
- LAYOUT TYPE: "sidebar-left" or "topnav" or "both"

Use this technique:
\`\`\`python
from PIL import Image
import numpy as np
from scipy import ndimage

img = Image.open(io.BytesIO(image_data)).convert('L')
img_array = np.array(img)
h, w = img_array.shape

# Detect edges
edges = ndimage.sobel(img_array)

# Find vertical lines (for sidebar detection on LEFT)
vertical_profile = edges.sum(axis=0)
# Check if there's a strong vertical line in first 20% of width (sidebar)
left_region = vertical_profile[:int(w*0.2)]
has_sidebar = left_region.max() > vertical_profile.mean() * 2

# Find horizontal lines (for navbar detection on TOP)  
horizontal_profile = edges.sum(axis=1)
# Check if there's a strong horizontal line in first 10% of height (topnav)
top_region = horizontal_profile[:int(h*0.1)]
has_topnav = top_region.max() > horizontal_profile.mean() * 2

# Determine layout type
if has_sidebar and not has_topnav:
    layout_type = "sidebar-left"
elif has_topnav and not has_sidebar:
    layout_type = "topnav"
elif has_sidebar and has_topnav:
    layout_type = "both"
else:
    layout_type = "minimal"

print(f"Layout type: {layout_type}")
\`\`\`

Return JSON only:
{
  "imageDimensions": { "width": 1920, "height": 1080 },
  "layoutType": "sidebar-left|topnav|both|minimal",
  "hasSidebar": true|false,
  "hasTopNav": true|false,
  "spacing": {
    "sidebarWidth": "256px",
    "navHeight": "64px",
    "cardPadding": "24px",
    "sectionGap": "48px",
    "containerPadding": "32px"
  },
  "components": [
    { "type": "sidebar", "bbox": {...}, "confidence": 0.9 }
  ]
}`;

// ============================================================================
// PHASE 2: THE QA TESTER - Verifies AFTER render
// ============================================================================

export const QA_TESTER_PROMPT = `You are THE QA TESTER. Play "Spot the Difference" between these two images.

IMAGE 1: Original UI frame from video (the source of truth)
IMAGE 2: Screenshot of generated code (what we produced)

Write Python code to:

1. CALCULATE SSIM (Structural Similarity Index)
\`\`\`python
from skimage.metrics import structural_similarity as ssim
from PIL import Image
import numpy as np

# Load both images
img1 = np.array(Image.open(io.BytesIO(original_data)).convert('L'))
img2 = np.array(Image.open(io.BytesIO(generated_data)).convert('L'))

# Resize to same dimensions if needed
if img1.shape != img2.shape:
    from skimage.transform import resize
    img2 = resize(img2, img1.shape, anti_aliasing=True)

# Calculate SSIM
score, diff = ssim(img1, img2, full=True)
print(f"SSIM Score: {score:.4f}")
\`\`\`

2. FIND DIFFERENCE REGIONS
\`\`\`python
# Threshold the difference image
diff_normalized = (diff * 255).astype(np.uint8)
threshold = 50  # Pixels with >50 difference
problem_regions = diff_normalized < threshold

# Find contours of problem areas
from skimage import measure
labels = measure.label(problem_regions)
regions = measure.regionprops(labels)

for region in regions:
    if region.area > 100:  # Significant differences only
        minr, minc, maxr, maxc = region.bbox
        print(f"Diff region: ({minc}, {minr}) to ({maxc}, {maxr})")
\`\`\`

3. CATEGORIZE ISSUES
- Layout shifts (position changes >5px)
- Color mismatches (>10% deviation)
- Size differences (>10% change)
- Missing elements
- Extra elements

4. GENERATE AUTO-FIX SUGGESTIONS
For each issue, suggest CSS fix:
- selector: ".card" 
- property: "padding"
- suggestedValue: "24px"

═══════════════════════════════════════════════════════════════════════════════
OUTPUT FORMAT:
═══════════════════════════════════════════════════════════════════════════════

{
  "ssimScore": 0.94,
  "overallAccuracy": "94%",
  "verdict": "needs_fixes",
  "issues": [
    {
      "type": "spacing",
      "severity": "medium",
      "location": "card padding",
      "description": "Card internal padding is 16px, should be 24px",
      "expected": "24px",
      "actual": "16px"
    }
  ],
  "autoFixSuggestions": [
    {
      "selector": ".card",
      "property": "padding",
      "currentValue": "16px",
      "suggestedValue": "24px",
      "confidence": 0.85
    }
  ],
  "diffRegions": [
    {
      "bbox": { "x": 0.1, "y": 0.2, "width": 0.3, "height": 0.1 },
      "diffPercentage": 15,
      "category": "spacing"
    }
  ]
}

Verdict rules:
- "pass": SSIM >= 0.95 AND no high severity issues
- "needs_fixes": SSIM >= 0.85 AND no more than 3 high severity issues  
- "major_issues": SSIM < 0.85 OR more than 3 high severity issues

Analyze both images and report differences:`;

// ============================================================================
// HELPER: Format surveyor data for code generator
// ============================================================================

export function formatSurveyorDataForPrompt(measurements: any): string {
  if (!measurements) return '';
  
  // Detect theme from colors if not explicitly set
  const bgColor = measurements.colors?.background || '';
  let detectedTheme = measurements.theme || 'dark';
  if (bgColor && !measurements.theme) {
    // Calculate brightness from hex
    const r = parseInt(bgColor.slice(1, 3), 16) || 0;
    const g = parseInt(bgColor.slice(3, 5), 16) || 0;
    const b = parseInt(bgColor.slice(5, 7), 16) || 0;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    detectedTheme = brightness > 127 ? 'light' : 'dark';
  }
  
  return `
═══════════════════════════════════════════════════════════════════════════════
🎯 HARD LAYOUT SPECS FROM SURVEYOR (USE THESE EXACT VALUES!)
═══════════════════════════════════════════════════════════════════════════════

These measurements were computed by analyzing actual pixels. DO NOT GUESS.

**🎨 DETECTED THEME: ${detectedTheme.toUpperCase()}**
${detectedTheme === 'light' 
  ? '⚠️ This is a LIGHT theme UI - use light backgrounds, dark text!'
  : '⚠️ This is a DARK theme UI - use dark backgrounds, light text!'}

**📐 DETECTED LAYOUT: ${measurements.layoutType?.toUpperCase() || 'UNKNOWN'}**
${measurements.hasSidebar ? '✅ HAS LEFT SIDEBAR - MUST include a left sidebar navigation!' : ''}
${measurements.hasTopNav ? '✅ HAS TOP NAVBAR - MUST include a horizontal top navigation!' : ''}
${!measurements.hasSidebar && !measurements.hasTopNav ? '⚠️ Minimal layout detected - no prominent navigation' : ''}

⚠️ CRITICAL: PRESERVE THE EXACT LAYOUT STRUCTURE!
${measurements.hasSidebar ? '- DO NOT convert sidebar to top navigation!' : ''}
${measurements.hasTopNav && !measurements.hasSidebar ? '- DO NOT add a sidebar if original has only top nav!' : ''}

**SPACING (Measured in pixels):**
- Sidebar width: ${measurements.spacing?.sidebarWidth || 'N/A'}
- Nav height: ${measurements.spacing?.navHeight || 'N/A'}
- Card padding: ${measurements.spacing?.cardPadding || 'N/A'}
- Section gap: ${measurements.spacing?.sectionGap || 'N/A'}
- Container padding: ${measurements.spacing?.containerPadding || 'N/A'}
- Card gap: ${measurements.spacing?.cardGap || 'N/A'}

**GRID STRUCTURE:**
- Columns: ${measurements.grid?.columns || 'auto'}
- Gap: ${measurements.grid?.gap || 'N/A'}

**🔲 CARD/ELEMENT ALIGNMENT (CRITICAL - MANDATORY!):**
⚠️⚠️⚠️ ALL cards, stat boxes, KPI tiles in a ROW MUST have EQUAL HEIGHT! ⚠️⚠️⚠️

MANDATORY RULES FOR CARD ROWS:
1. ALWAYS use \`grid grid-cols-N items-stretch\` for card containers
2. EVERY card div MUST have \`h-full\` class
3. Card content wrapper MUST use \`flex flex-col h-full\`
4. NEVER let adjacent cards have different heights!
5. If cards have different content lengths, use \`flex-grow\` on main content

CORRECT PATTERN (USE THIS EXACTLY):
\`\`\`jsx
{/* Stats row - MUST use items-stretch + h-full */}
<div className="grid grid-cols-3 gap-6 items-stretch">
  <div className="bg-white rounded-xl p-6 h-full flex flex-col">
    <span className="text-sm text-gray-500">Total Exposure</span>
    <span className="text-2xl font-bold mt-auto">$14,412,474</span>
  </div>
  <div className="bg-white rounded-xl p-6 h-full flex flex-col">
    <span className="text-sm text-gray-500">Open Cases</span>
    <span className="text-2xl font-bold mt-auto">1232</span>
  </div>
  <div className="bg-white rounded-xl p-6 h-full flex flex-col">
    <span className="text-sm text-gray-500">Avg Cycle Time</span>
    <span className="text-2xl font-bold mt-auto">14 Days</span>
  </div>
</div>
\`\`\`

WRONG (NEVER DO THIS):
\`\`\`jsx
{/* BAD - no items-stretch, no h-full */}
<div className="grid grid-cols-3 gap-6">
  <div className="bg-white rounded-xl p-6">...</div>
</div>
\`\`\`

**COLORS (Sampled from actual pixels - MUST USE THESE!):**
- Background: ${measurements.colors?.background || (detectedTheme === 'light' ? '#ffffff' : '#0f172a')}
- Surface/Cards: ${measurements.colors?.surface || (detectedTheme === 'light' ? '#f8fafc' : '#1e293b')}
- Primary accent: ${measurements.colors?.primary || '#6366f1'}
- Text: ${measurements.colors?.text || (detectedTheme === 'light' ? '#1e293b' : '#ffffff')}
- Text muted: ${measurements.colors?.textMuted || (detectedTheme === 'light' ? '#64748b' : '#94a3b8')}
- Border: ${measurements.colors?.border || (detectedTheme === 'light' ? '#e2e8f0' : '#334155')}

**TYPOGRAPHY:**
- H1: ${measurements.typography?.h1 || '48px'}
- H2: ${measurements.typography?.h2 || '32px'}
- Body: ${measurements.typography?.body || '16px'}
- Small: ${measurements.typography?.small || '14px'}

**DETECTED COMPONENTS:**
${measurements.components?.map((c: any) => 
  `- ${c.type}: ${c.pixelBbox?.width}x${c.pixelBbox?.height}px at (${c.pixelBbox?.x}, ${c.pixelBbox?.y})`
).join('\n') || 'None detected'}

**CONFIDENCE:** ${Math.round((measurements.confidence || 0) * 100)}%

CRITICAL: Use these EXACT values in your code. Example:
- If cardPadding is "24px", use: p-[24px] or padding: 24px
- If background is "${measurements.colors?.background || '#ffffff'}", use: bg-[${measurements.colors?.background || '#ffffff'}]
- Do NOT use approximate Tailwind classes like p-4 or p-6
- PRESERVE THE ${detectedTheme.toUpperCase()} THEME - do not convert to ${detectedTheme === 'light' ? 'dark' : 'light'}!

═══════════════════════════════════════════════════════════════════════════════
`;
}
