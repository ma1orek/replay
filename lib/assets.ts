// ============================================================================
// ASSETS UTILITY - Extract and Replace Images in Generated Code
// ============================================================================

export interface ExtractedAsset {
  id: string;
  url: string;
  sourceUrl?: string;
  type: "img" | "background";
  width?: number;
  height?: number;
  alt?: string;
  element?: string; // The full HTML element for context
  index: number; // Position in code for replacement
  occurrence?: number; // nth occurrence of the same URL in code
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeAssetUrl(url: string): string {
  if (!url) return url;
  try {
    if (url.startsWith("http")) {
      const parsed = new URL(url);
      return parsed.pathname + parsed.search;
    }
  } catch (e) {}
  return url;
}

/**
 * Extract dimensions from any image URL
 */
function extractDimensions(url: string): { width?: number; height?: number } {
  // Try new format first: /id/X/WIDTH/HEIGHT
  const picsumIdMatch = url.match(/picsum\.photos\/id\/\d+\/(\d+)\/(\d+)/);
  if (picsumIdMatch) {
    return { width: parseInt(picsumIdMatch[1]), height: parseInt(picsumIdMatch[2]) };
  }
  
  // Old format: /WIDTH/HEIGHT
  const picsumMatch = url.match(/picsum\.photos\/(\d+)\/(\d+)/);
  if (picsumMatch) {
    return { width: parseInt(picsumMatch[1]), height: parseInt(picsumMatch[2]) };
  }
  
  // Unsplash with w= parameter
  const unsplashMatch = url.match(/[?&]w=(\d+)/);
  if (unsplashMatch) {
    return { width: parseInt(unsplashMatch[1]) };
  }
  
  // Pravatar
  const pravatarMatch = url.match(/pravatar\.cc\/(\d+)/);
  if (pravatarMatch) {
    const size = parseInt(pravatarMatch[1]);
    return { width: size, height: size };
  }
  
  return {};
}

/**
 * Check if URL is a valid image URL (not SVG, not data URL, not gradient)
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false;
  if (url.startsWith('data:')) return false;
  if (url.endsWith('.svg')) return false;
  if (url.includes('gradient')) return false;
  if (url.startsWith('#')) return false;
  if (url.length < 3) return false;
  return true;
}

function isLikelyImageUrl(url: string): boolean {
  if (!isValidImageUrl(url)) return false;
  const clean = url.split("?")[0].toLowerCase();
  if (clean.match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|tiff?)$/i)) return true;
  if (url.includes("picsum") || url.includes("unsplash") || url.includes("pravatar") || url.includes("placeholder")) {
    return true;
  }
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) {
    return clean.includes(".");
  }
  return false;
}

/**
 * Extract all images from HTML code (img src, srcset, data-src, background-image, inline styles)
 * Detects ALL image types including those in animations, video posters, etc.
 */
export function extractAssetsFromCode(code: string): ExtractedAsset[] {
  const assets: ExtractedAsset[] = [];
  const seenMatches = new Set<string>();
  const urlOccurrences = new Map<string, number>();
  let assetIndex = 0;

  const addAsset = (url: string, type: "img" | "background", element: string, alt?: string, position?: number) => {
    // Normalize URL - remove extra whitespace and quotes
    url = url.trim().replace(/^["']|["']$/g, '');
    if (!isValidImageUrl(url)) return;
    const matchKey = position !== undefined ? `${position}|${url}` : `${url}|${element}`;
    if (seenMatches.has(matchKey)) return;
    seenMatches.add(matchKey);
    
    const dims = extractDimensions(url);
    const occurrence = urlOccurrences.get(url) ?? 0;
    urlOccurrences.set(url, occurrence + 1);
    assets.push({
      id: `${type}-${assetIndex}`,
      url,
      type,
      width: dims.width,
      height: dims.height,
      alt,
      element,
      index: assetIndex++,
      occurrence,
    });
  };

  // 1. Extract <img> tags with src (most common)
  const imgSrcRegex = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = imgSrcRegex.exec(code)) !== null) {
    const fullElement = match[0];
    const url = match[1];
    const altMatch = fullElement.match(/alt=["']([^"']*)["']/i);
    addAsset(url, "img", fullElement, altMatch?.[1], match.index);
  }

  // 1b. Extract JSX/TSX <img> or <Image> with src={"..."}
  const imgSrcJsxRegex = /<(?:img|Image)[^>]*\ssrc=\{["'`]([^"'`]+)["'`]\}[^>]*>/gi;
  while ((match = imgSrcJsxRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 2. Extract srcset URLs
  const srcsetRegex = /srcset=["']([^"']+)["']/gi;
  while ((match = srcsetRegex.exec(code)) !== null) {
    const srcset = match[1];
    const element = match[0];
    const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
    urls.forEach(url => addAsset(url, "img", element, undefined, match?.index));
  }

  // 2b. JSX/TSX srcSet={"..."}
  const srcSetJsxRegex = /srcSet=\{["'`]([^"'`]+)["'`]\}/gi;
  while ((match = srcSetJsxRegex.exec(code)) !== null) {
    const srcset = match[1];
    const element = match[0];
    const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
    urls.forEach(url => addAsset(url, "img", element, undefined, match?.index));
  }

  // 3. Extract data-src, data-image, data-bg (lazy loading patterns)
  const dataAttrRegex = /data-(?:src|image|bg|background|lazy)=["']([^"']+)["']/gi;
  while ((match = dataAttrRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 4. Extract poster attribute from video tags
  const posterRegex = /poster=["']([^"']+)["']/gi;
  while ((match = posterRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 5. Extract background-image in CSS (both in <style> blocks and inline)
  const bgRegex = /background(?:-image)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgRegex.exec(code)) !== null) {
    addAsset(match[1], "background", match[0], undefined, match.index);
  }

  // 6. Extract style="...background..." inline styles with multiple properties
  const inlineStyleRegex = /style=["'][^"']*url\(["']?([^"')]+)["']?\)[^"']*["']/gi;
  while ((match = inlineStyleRegex.exec(code)) !== null) {
    addAsset(match[1], "background", match[0], undefined, match.index);
  }

  // 6b. Extract JSX style backgroundImage: "url(...)"
  const jsxBgImageRegex = /backgroundImage\s*:\s*["'`]url\(([^"'`]+)\)["'`]/gi;
  while ((match = jsxBgImageRegex.exec(code)) !== null) {
    addAsset(match[1], "background", match[0], undefined, match.index);
  }

  // 6c. Extract Tailwind bg-[url(...)] class patterns
  const tailwindBgRegex = /bg-\[url\((?:'|")?([^'")]+)(?:'|")?\)\]/gi;
  while ((match = tailwindBgRegex.exec(code)) !== null) {
    addAsset(match[1], "background", match[0], undefined, match.index);
  }

  // 7. Extract content: url() in CSS (used for ::before/::after)
  const contentUrlRegex = /content:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = contentUrlRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 8. Extract mask-image and -webkit-mask-image
  const maskRegex = /(?:-webkit-)?mask-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = maskRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 9. Extract list-style-image
  const listStyleRegex = /list-style-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = listStyleRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 10. Extract border-image
  const borderImageRegex = /border-image(?:-source)?:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = borderImageRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 11. Extract any URL that looks like an image (http/https ending in image extension)
  const imageUrlRegex = /["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|gif|webp)(?:\?[^"'\s]*)?)["']/gi;
  while ((match = imageUrlRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 12. Extract Unsplash URLs (with photo ID pattern)
  const unsplashRegex = /["'](https?:\/\/images\.unsplash\.com\/[^"'\s]+)["']/gi;
  while ((match = unsplashRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 13. Extract Picsum URLs (any format including /id/X/)
  const picsumRegex = /["']?(https?:\/\/picsum\.photos\/[^"'\s\)]+)["']?/gi;
  while ((match = picsumRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 14. Extract Pravatar URLs (avatars)
  const pravatarRegex = /["']?(https?:\/\/i\.pravatar\.cc\/[^"'\s\)]+)["']?/gi;
  while ((match = pravatarRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 15. Extract source elements in picture tags
  const sourceRegex = /<source[^>]*srcset=["']([^"']+)["'][^>]*>/gi;
  while ((match = sourceRegex.exec(code)) !== null) {
    const srcset = match[1];
    const urls = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
    urls.forEach(url => addAsset(url, "img", match ? match[0] : "", undefined, match?.index));
  }

  // 16. Extract object-fit images (often used with animations)
  const objectFitRegex = /<(?:img|div)[^>]*(?:object-fit|object-position)[^>]*src=["']([^"']+)["'][^>]*>/gi;
  while ((match = objectFitRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 17. Extract placeholder.com and similar placeholder services
  const placeholderRegex = /["'](https?:\/\/(?:via\.placeholder\.com|placehold\.co|placekitten\.com|loremflickr\.com)\/[^"'\s]+)["']/gi;
  while ((match = placeholderRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 18. Extract image-set() CSS function
  const imageSetRegex = /image-set\([^)]*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = imageSetRegex.exec(code)) !== null) {
    addAsset(match[1], "img", match[0], undefined, match.index);
  }

  // 19. Scan for any remaining URLs in url() that might have been missed
  const anyUrlRegex = /url\(["']?([^"'\)]+)["']?\)/gi;
  while ((match = anyUrlRegex.exec(code)) !== null) {
    const url = match[1];
    // Only add if it looks like an image (has image extension or is from known image service)
    if (isLikelyImageUrl(url)) {
      addAsset(url, "background", match[0], undefined, match.index);
    }
  }

  console.log(`[Assets] Extracted ${assets.length} assets from code`);
  return assets;
}

/**
 * Replace a SINGLE image URL in the code without using AI
 * Only replaces the exact URL, not all occurrences
 */
export function replaceAssetInCode(
  code: string, 
  oldUrl: string, 
  newUrl: string,
  occurrence?: number
): string {
  console.log('[Assets] Replacing:', oldUrl, '->', newUrl);

  if (occurrence !== undefined && occurrence !== null) {
    const replaced = replaceNthOccurrence(code, oldUrl, newUrl, occurrence);
    if (replaced !== code) {
      console.log('[Assets] Replaced by occurrence:', occurrence);
      return replaced;
    }
  }
  
  // Escape special characters in the old URL for regex
  const escapedOldUrl = escapeRegex(oldUrl);
  const normalizedOldUrl = normalizeAssetUrl(oldUrl);
  const escapedNormalizedOldUrl = escapeRegex(normalizedOldUrl);
  const encodedOldUrl = oldUrl.replace(/&/g, "&amp;");
  const escapedEncodedOldUrl = escapeRegex(encodedOldUrl);
  
  // Replace ONLY the first occurrence for each pattern
  // This ensures we replace only the selected image, not all matching URLs
  
  // Replace in img src with double quotes
  const srcDoubleRegex = new RegExp(`src="${escapedOldUrl}"`);
  if (srcDoubleRegex.test(code)) {
    console.log('[Assets] Found in src="" - replacing');
    return code.replace(srcDoubleRegex, `src="${newUrl}"`);
  }
  
  // Replace in img src with single quotes
  const srcSingleRegex = new RegExp(`src='${escapedOldUrl}'`);
  if (srcSingleRegex.test(code)) {
    console.log('[Assets] Found in src=\'\' - replacing');
    return code.replace(srcSingleRegex, `src='${newUrl}'`);
  }

  // Replace in JSX src={"..."}
  const srcJsxDoubleRegex = new RegExp(`src=\\{"${escapedOldUrl}"\\}`);
  if (srcJsxDoubleRegex.test(code)) {
    console.log('[Assets] Found in src={"..."} - replacing');
    return code.replace(srcJsxDoubleRegex, `src={"${newUrl}"}`);
  }

  // Replace in JSX src={'...'}
  const srcJsxSingleRegex = new RegExp(`src=\\{'${escapedOldUrl}'\\}`);
  if (srcJsxSingleRegex.test(code)) {
    console.log('[Assets] Found in src={\'...\'} - replacing');
    return code.replace(srcJsxSingleRegex, `src={'${newUrl}'}`);
  }

  // Replace in JSX src={`...`}
  const srcJsxTemplateRegex = new RegExp(`src=\\{\\\`${escapedOldUrl}\\\`\\}`);
  if (srcJsxTemplateRegex.test(code)) {
    console.log('[Assets] Found in src={`...`} - replacing');
    return code.replace(srcJsxTemplateRegex, `src={\`${newUrl}\`}`);
  }
  
  // Replace in background-image url() with double quotes
  const bgDoubleRegex = new RegExp(`url\\("${escapedOldUrl}"\\)`);
  if (bgDoubleRegex.test(code)) {
    console.log('[Assets] Found in url("") - replacing');
    return code.replace(bgDoubleRegex, `url("${newUrl}")`);
  }
  
  // Replace in background-image url() with single quotes
  const bgSingleRegex = new RegExp(`url\\('${escapedOldUrl}'\\)`);
  if (bgSingleRegex.test(code)) {
    console.log('[Assets] Found in url(\'\') - replacing');
    return code.replace(bgSingleRegex, `url('${newUrl}')`);
  }
  
  // Replace in background-image url() without quotes
  const bgNoQuotesRegex = new RegExp(`url\\(${escapedOldUrl}\\)`);
  if (bgNoQuotesRegex.test(code)) {
    console.log('[Assets] Found in url() no quotes - replacing');
    return code.replace(bgNoQuotesRegex, `url(${newUrl})`);
  }

  // Replace in JSX backgroundImage: "url(...)"
  const bgImageJsxRegex = new RegExp(`backgroundImage\\s*:\\s*["'\`]url\\((["'\`]?)${escapedOldUrl}\\1\\)["'\`]`);
  if (bgImageJsxRegex.test(code)) {
    console.log('[Assets] Found in backgroundImage - replacing');
    return code.replace(bgImageJsxRegex, `backgroundImage: "url(${newUrl})"`);
  }
  
  // Try direct string replacement
  if (code.includes(oldUrl)) {
    console.log('[Assets] Found as plain string - replacing');
    return code.replace(oldUrl, newUrl);
  }

  if (normalizedOldUrl !== oldUrl && code.includes(normalizedOldUrl)) {
    console.log('[Assets] Found normalized URL - replacing');
    return code.replace(normalizedOldUrl, newUrl);
  }

  if (encodedOldUrl !== oldUrl && code.includes(encodedOldUrl)) {
    console.log('[Assets] Found encoded URL - replacing');
    return code.replace(encodedOldUrl, newUrl);
  }

  if (escapedNormalizedOldUrl && new RegExp(escapedNormalizedOldUrl).test(code)) {
    console.log('[Assets] Found normalized URL regex - replacing');
    return code.replace(new RegExp(escapedNormalizedOldUrl), newUrl);
  }

  if (escapedEncodedOldUrl && new RegExp(escapedEncodedOldUrl).test(code)) {
    console.log('[Assets] Found encoded URL regex - replacing');
    return code.replace(new RegExp(escapedEncodedOldUrl), newUrl);
  }

  console.log('[Assets] URL not found in code!');
  console.log('[Assets] Looking for:', oldUrl.substring(0, 100));
  return code;
}

function replaceNthOccurrence(code: string, oldStr: string, newStr: string, occurrence: number): string {
  if (occurrence < 0) return code;
  let fromIndex = 0;
  for (let i = 0; i <= occurrence; i++) {
    const idx = code.indexOf(oldStr, fromIndex);
    if (idx === -1) return code;
    if (i === occurrence) {
      return code.slice(0, idx) + newStr + code.slice(idx + oldStr.length);
    }
    fromIndex = idx + oldStr.length;
  }
  return code;
}

/**
 * Get the category of an image based on its URL and dimensions
 */
export function categorizeAsset(asset: ExtractedAsset): "avatar" | "hero" | "product" | "background" | "general" {
  const { url, width, height, type } = asset;
  
  // Check for avatar patterns
  if (url.includes('pravatar') || url.includes('avatar') || url.includes('profile')) {
    return "avatar";
  }
  
  // Background images
  if (type === "background") {
    return "background";
  }
  
  // Size-based categorization
  if (width && height) {
    const aspectRatio = width / height;
    
    // Square small images are likely avatars
    if (Math.abs(aspectRatio - 1) < 0.2 && width <= 200) {
      return "avatar";
    }
    
    // Wide large images are likely heroes
    if (aspectRatio > 1.5 && width >= 800) {
      return "hero";
    }
    
    // Medium sized images are likely products
    if (width >= 200 && width <= 600) {
      return "product";
    }
  }
  
  return "general";
}

/**
 * Generate a stable picsum URL with specified dimensions
 * Uses ONLY verified working IDs that are confirmed to exist
 */
export function generatePicsumUrl(width: number = 800, height: number = 600): string {
  // VERIFIED working picsum IDs - same as in API routes
  const validPicsumIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 130, 131, 133, 134, 137, 139, 140, 141, 142, 143, 144, 145, 146, 147, 149, 152, 153, 154, 155, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200];
  const imageId = validPicsumIds[Math.floor(Math.random() * validPicsumIds.length)];
  return `https://picsum.photos/id/${imageId}/${width}/${height}`;
}

/**
 * Simple hash function to generate a stable number from a string
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Convert ALL unstable picsum URLs in code to stable /id/X/ format
 * Uses a hash of the URL to generate consistent IDs - same URL always gets same ID
 * This prevents images from changing on every preview reload
 */
export function stabilizePicsumUrls(code: string): string {
  // VERIFIED working picsum IDs
  const validPicsumIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 130, 131, 133, 134, 137, 139, 140, 141, 142, 143, 144, 145, 146, 147, 149, 152, 153, 154, 155, 157, 158, 159, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200];
  
  let result = code;
  
  // 1. Convert seed URLs to stable /id/ format: picsum.photos/seed/NAME/W/H -> picsum.photos/id/X/W/H
  result = result.replace(/https:\/\/picsum\.photos\/seed\/([^\/]+)\/(\d+)\/(\d+)/g, (match, seedName, width, height) => {
    const stableId = validPicsumIds[simpleHash(seedName) % validPicsumIds.length];
    return `https://picsum.photos/id/${stableId}/${width}/${height}`;
  });
  
  // 2. Convert random URLs: picsum.photos/W/H or picsum.photos/W/H?random=X
  result = result.replace(/https:\/\/picsum\.photos\/(\d+)\/(\d+)(\?random=\d+)?/g, (match, width, height) => {
    // Skip if already has /id/ or /seed/
    if (match.includes('/id/') || match.includes('/seed/')) return match;
    const stableId = validPicsumIds[simpleHash(match) % validPicsumIds.length];
    return `https://picsum.photos/id/${stableId}/${width}/${height}`;
  });
  
  // 3. Convert single dimension URLs: picsum.photos/SIZE -> picsum.photos/id/X/SIZE/SIZE
  result = result.replace(/https:\/\/picsum\.photos\/(\d+)(?=["\'\)\s>])/g, (match, size) => {
    if (match.includes('/id/') || match.includes('/seed/')) return match;
    const stableId = validPicsumIds[simpleHash(match) % validPicsumIds.length];
    return `https://picsum.photos/id/${stableId}/${size}/${size}`;
  });
  
  return result;
}

/**
 * Generate a stable pravatar URL for avatars
 * Uses specific image ID so avatar doesn't change on each load
 */
export function generateAvatarUrl(size: number = 150): string {
  const imageId = Math.floor(Math.random() * 70) + 1;
  return `https://i.pravatar.cc/${size}?img=${imageId}`;
}

// ============================================================================
// UNSPLASH API INTEGRATION (via API proxy)
// ============================================================================

export interface UnsplashImage {
  id: string;
  url: string;
  thumbUrl: string;
  width: number;
  height: number;
  description: string | null;
  photographer: string;
  downloadUrl: string;
}

/**
 * Search for images via our API proxy
 * Uses Unsplash if API key is configured, otherwise falls back to Picsum
 */
export async function searchUnsplash(
  query: string, 
  page: number = 1, 
  perPage: number = 20
): Promise<UnsplashImage[]> {
  try {
    const response = await fetch(
      `/api/unsplash?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.results.map((img: any) => ({
      id: img.id,
      url: img.urls.regular,
      thumbUrl: img.urls.thumb,
      width: img.width,
      height: img.height,
      description: img.description || img.alt_description,
      photographer: img.user.name,
      downloadUrl: img.links.download_location,
    }));
  } catch (error) {
    console.error('Image search error:', error);
    return [];
  }
}

/**
 * Get Unsplash image URL with custom dimensions
 * Also handles Picsum URLs for mock data
 */
export function getUnsplashUrlWithSize(
  imageUrl: string, 
  width: number, 
  height?: number
): string {
  // VERIFIED working picsum IDs
  const validPicsumIds = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100];

  // Handle Picsum URLs (mock data)
  if (imageUrl.includes('picsum.photos')) {
    const idMatch = imageUrl.match(/picsum\.photos\/id\/(\d+)/);
    if (idMatch) {
      return `https://picsum.photos/id/${idMatch[1]}/${width}/${height || width}`;
    }
    // Fallback: use a stable ID based on hash instead of random
    // This ensures that the same URL always results in the same thumbnail
    const stableId = validPicsumIds[simpleHash(imageUrl) % validPicsumIds.length];
    return `https://picsum.photos/id/${stableId}/${width}/${height || width}`;
  }
  
  // Handle real Unsplash URLs
  try {
    const url = new URL(imageUrl);
    url.searchParams.set('w', width.toString());
    if (height) {
      url.searchParams.set('h', height.toString());
      url.searchParams.set('fit', 'crop');
    }
    return url.toString();
  } catch {
    return imageUrl;
  }
}


