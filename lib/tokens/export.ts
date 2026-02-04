/**
 * Design Token Export Utilities
 * 
 * Generates design tokens in multiple formats for developer use:
 * - CSS Custom Properties
 * - Tailwind Config
 * - JSON
 * - SCSS Variables
 */

export interface DesignTokens {
  colors: Record<string, string>;
  typography?: {
    fontFamily?: Record<string, string>;
    fontSize?: Record<string, string>;
    fontWeight?: Record<string, number>;
    lineHeight?: Record<string, string | number>;
  };
  spacing?: Record<string, string>;
  borderRadius?: Record<string, string>;
  shadows?: Record<string, string>;
}

/**
 * Convert color name to valid CSS variable name
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Export tokens as CSS Custom Properties
 */
export function exportToCSS(tokens: DesignTokens): string {
  const lines: string[] = [':root {'];
  
  // Colors
  if (tokens.colors) {
    lines.push('  /* Colors */');
    Object.entries(tokens.colors).forEach(([name, value]) => {
      lines.push(`  --color-${toKebabCase(name)}: ${value};`);
    });
  }
  
  // Typography
  if (tokens.typography) {
    lines.push('');
    lines.push('  /* Typography */');
    if (tokens.typography.fontFamily) {
      Object.entries(tokens.typography.fontFamily).forEach(([name, value]) => {
        lines.push(`  --font-${toKebabCase(name)}: ${value};`);
      });
    }
    if (tokens.typography.fontSize) {
      Object.entries(tokens.typography.fontSize).forEach(([name, value]) => {
        lines.push(`  --text-${toKebabCase(name)}: ${value};`);
      });
    }
  }
  
  // Spacing
  if (tokens.spacing) {
    lines.push('');
    lines.push('  /* Spacing */');
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      lines.push(`  --spacing-${toKebabCase(name)}: ${value};`);
    });
  }
  
  // Border Radius
  if (tokens.borderRadius) {
    lines.push('');
    lines.push('  /* Border Radius */');
    Object.entries(tokens.borderRadius).forEach(([name, value]) => {
      lines.push(`  --radius-${toKebabCase(name)}: ${value};`);
    });
  }
  
  // Shadows
  if (tokens.shadows) {
    lines.push('');
    lines.push('  /* Shadows */');
    Object.entries(tokens.shadows).forEach(([name, value]) => {
      lines.push(`  --shadow-${toKebabCase(name)}: ${value};`);
    });
  }
  
  lines.push('}');
  return lines.join('\n');
}

/**
 * Export tokens as Tailwind Config
 */
export function exportToTailwind(tokens: DesignTokens): string {
  const config: any = {
    theme: {
      extend: {}
    }
  };
  
  // Colors
  if (tokens.colors && Object.keys(tokens.colors).length > 0) {
    config.theme.extend.colors = {};
    Object.entries(tokens.colors).forEach(([name, value]) => {
      config.theme.extend.colors[toKebabCase(name)] = value;
    });
  }
  
  // Typography
  if (tokens.typography) {
    if (tokens.typography.fontFamily && Object.keys(tokens.typography.fontFamily).length > 0) {
      config.theme.extend.fontFamily = {};
      Object.entries(tokens.typography.fontFamily).forEach(([name, value]) => {
        config.theme.extend.fontFamily[toKebabCase(name)] = [value];
      });
    }
    if (tokens.typography.fontSize && Object.keys(tokens.typography.fontSize).length > 0) {
      config.theme.extend.fontSize = {};
      Object.entries(tokens.typography.fontSize).forEach(([name, value]) => {
        config.theme.extend.fontSize[toKebabCase(name)] = value;
      });
    }
  }
  
  // Spacing
  if (tokens.spacing && Object.keys(tokens.spacing).length > 0) {
    config.theme.extend.spacing = {};
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      config.theme.extend.spacing[toKebabCase(name)] = value;
    });
  }
  
  // Border Radius
  if (tokens.borderRadius && Object.keys(tokens.borderRadius).length > 0) {
    config.theme.extend.borderRadius = {};
    Object.entries(tokens.borderRadius).forEach(([name, value]) => {
      config.theme.extend.borderRadius[toKebabCase(name)] = value;
    });
  }
  
  // Shadows
  if (tokens.shadows && Object.keys(tokens.shadows).length > 0) {
    config.theme.extend.boxShadow = {};
    Object.entries(tokens.shadows).forEach(([name, value]) => {
      config.theme.extend.boxShadow[toKebabCase(name)] = value;
    });
  }
  
  // Clean up empty objects
  Object.keys(config.theme.extend).forEach(key => {
    if (Object.keys(config.theme.extend[key]).length === 0) {
      delete config.theme.extend[key];
    }
  });
  
  const lines = [
    '// tailwind.config.js',
    '// Copy this into your Tailwind configuration',
    '',
    'module.exports = ' + JSON.stringify(config, null, 2)
  ];
  
  return lines.join('\n');
}

/**
 * Export tokens as JSON
 */
export function exportToJSON(tokens: DesignTokens): string {
  const output: any = {};
  
  if (tokens.colors && Object.keys(tokens.colors).length > 0) {
    output.colors = tokens.colors;
  }
  
  if (tokens.typography) {
    output.typography = {};
    if (tokens.typography.fontFamily) output.typography.fontFamily = tokens.typography.fontFamily;
    if (tokens.typography.fontSize) output.typography.fontSize = tokens.typography.fontSize;
    if (tokens.typography.fontWeight) output.typography.fontWeight = tokens.typography.fontWeight;
    if (tokens.typography.lineHeight) output.typography.lineHeight = tokens.typography.lineHeight;
  }
  
  if (tokens.spacing && Object.keys(tokens.spacing).length > 0) {
    output.spacing = tokens.spacing;
  }
  
  if (tokens.borderRadius && Object.keys(tokens.borderRadius).length > 0) {
    output.borderRadius = tokens.borderRadius;
  }
  
  if (tokens.shadows && Object.keys(tokens.shadows).length > 0) {
    output.shadows = tokens.shadows;
  }
  
  return JSON.stringify(output, null, 2);
}

/**
 * Export tokens as SCSS Variables
 */
export function exportToSCSS(tokens: DesignTokens): string {
  const lines: string[] = ['// Design System Tokens', '// Auto-generated from Replay Library', ''];
  
  // Colors
  if (tokens.colors && Object.keys(tokens.colors).length > 0) {
    lines.push('// Colors');
    Object.entries(tokens.colors).forEach(([name, value]) => {
      lines.push(`$color-${toKebabCase(name)}: ${value};`);
    });
    lines.push('');
    
    // Also create a colors map
    lines.push('$colors: (');
    Object.entries(tokens.colors).forEach(([name, value], i, arr) => {
      const comma = i < arr.length - 1 ? ',' : '';
      lines.push(`  "${toKebabCase(name)}": ${value}${comma}`);
    });
    lines.push(');');
    lines.push('');
  }
  
  // Typography
  if (tokens.typography) {
    if (tokens.typography.fontFamily && Object.keys(tokens.typography.fontFamily).length > 0) {
      lines.push('// Font Families');
      Object.entries(tokens.typography.fontFamily).forEach(([name, value]) => {
        lines.push(`$font-${toKebabCase(name)}: ${value};`);
      });
      lines.push('');
    }
    
    if (tokens.typography.fontSize && Object.keys(tokens.typography.fontSize).length > 0) {
      lines.push('// Font Sizes');
      Object.entries(tokens.typography.fontSize).forEach(([name, value]) => {
        lines.push(`$text-${toKebabCase(name)}: ${value};`);
      });
      lines.push('');
    }
  }
  
  // Spacing
  if (tokens.spacing && Object.keys(tokens.spacing).length > 0) {
    lines.push('// Spacing');
    Object.entries(tokens.spacing).forEach(([name, value]) => {
      lines.push(`$spacing-${toKebabCase(name)}: ${value};`);
    });
    lines.push('');
    
    // Also create a spacing map
    lines.push('$spacing: (');
    Object.entries(tokens.spacing).forEach(([name, value], i, arr) => {
      const comma = i < arr.length - 1 ? ',' : '';
      lines.push(`  "${toKebabCase(name)}": ${value}${comma}`);
    });
    lines.push(');');
    lines.push('');
  }
  
  // Border Radius
  if (tokens.borderRadius && Object.keys(tokens.borderRadius).length > 0) {
    lines.push('// Border Radius');
    Object.entries(tokens.borderRadius).forEach(([name, value]) => {
      lines.push(`$radius-${toKebabCase(name)}: ${value};`);
    });
    lines.push('');
  }
  
  // Shadows
  if (tokens.shadows && Object.keys(tokens.shadows).length > 0) {
    lines.push('// Shadows');
    Object.entries(tokens.shadows).forEach(([name, value]) => {
      lines.push(`$shadow-${toKebabCase(name)}: ${value};`);
    });
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Generate component code snippet with proper imports
 */
export function generateComponentSnippet(
  componentName: string,
  code: string,
  props?: Array<{ name: string; type: string; defaultValue?: string }>
): { jsx: string; html: string; usage: string } {
  // Clean component name
  const cleanName = componentName.replace(/[^a-zA-Z0-9]/g, '');
  const kebabName = toKebabCase(componentName);
  
  // Generate JSX import + usage
  const jsxImport = `import { ${cleanName} } from '@/components/ui/${kebabName}'`;
  
  // Generate props string for usage example
  const propsStr = props?.filter(p => p.defaultValue !== undefined)
    .map(p => {
      if (p.type === 'string') return `${p.name}="${p.defaultValue}"`;
      if (p.type === 'boolean') return p.defaultValue === 'true' ? p.name : '';
      return `${p.name}={${p.defaultValue}}`;
    })
    .filter(Boolean)
    .join(' ') || '';
  
  const jsxUsage = `<${cleanName}${propsStr ? ' ' + propsStr : ''}>
  {/* content */}
</${cleanName}>`;

  const jsx = `// Import
${jsxImport}

// Usage
${jsxUsage}`;

  // Clean HTML version
  const html = code
    .replace(/className=/g, 'class=')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '') // Remove JSX comments
    .trim();

  // Usage example
  const usage = `/**
 * ${cleanName} Component
 * 
 * @example
 * ${jsxUsage.split('\n').join('\n * ')}
 */`;

  return { jsx, html, usage };
}

/**
 * Check color contrast for accessibility (WCAG)
 */
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  AA: boolean;
  AAA: boolean;
  AALarge: boolean;
  AAALarge: boolean;
} {
  const getLuminance = (hex: string): number => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse RGB
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;
    
    // Convert to sRGB
    const toSRGB = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toSRGB(r) + 0.7152 * toSRGB(g) + 0.0722 * toSRGB(b);
  };
  
  try {
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    
    return {
      ratio: Math.round(ratio * 100) / 100,
      AA: ratio >= 4.5,        // Normal text
      AAA: ratio >= 7,         // Enhanced
      AALarge: ratio >= 3,     // Large text (18pt+ or 14pt bold)
      AAALarge: ratio >= 4.5,  // Large text enhanced
    };
  } catch {
    return { ratio: 0, AA: false, AAA: false, AALarge: false, AAALarge: false };
  }
}

/**
 * Analyze component for accessibility issues
 */
export function analyzeComponentAccessibility(code: string): {
  score: number;
  issues: Array<{ type: 'error' | 'warning' | 'info'; message: string }>;
  passed: string[];
} {
  const issues: Array<{ type: 'error' | 'warning' | 'info'; message: string }> = [];
  const passed: string[] = [];
  
  // Check for images without alt
  if (/<img[^>]*(?!alt=)[^>]*>/i.test(code) || /<img[^>]*alt=["']["'][^>]*>/i.test(code)) {
    issues.push({ type: 'error', message: 'Images missing alt text' });
  } else if (/<img[^>]*alt=/i.test(code)) {
    passed.push('Images have alt text');
  }
  
  // Check for buttons without text/aria-label
  if (/<button[^>]*>[\s]*<\/button>/i.test(code)) {
    issues.push({ type: 'error', message: 'Empty button without accessible label' });
  } else if (/<button/i.test(code)) {
    passed.push('Buttons have content');
  }
  
  // Check for form inputs without labels
  if (/<input[^>]*(?!aria-label)[^>]*>/i.test(code) && !/<label/i.test(code)) {
    issues.push({ type: 'warning', message: 'Form inputs may be missing labels' });
  } else if (/<input/i.test(code)) {
    passed.push('Form inputs appear to have labels');
  }
  
  // Check for heading hierarchy
  const headings = code.match(/<h[1-6]/gi) || [];
  if (headings.length > 0) {
    const levels = headings.map(h => parseInt(h.slice(-1)));
    let hierarchyOk = true;
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] > levels[i-1] + 1) {
        hierarchyOk = false;
        break;
      }
    }
    if (!hierarchyOk) {
      issues.push({ type: 'warning', message: 'Heading hierarchy may be incorrect' });
    } else {
      passed.push('Heading hierarchy looks correct');
    }
  }
  
  // Check for color contrast (basic check for text on bg)
  if (/text-white[^"']*bg-white|text-black[^"']*bg-black/i.test(code)) {
    issues.push({ type: 'error', message: 'Possible contrast issue: same color text and background' });
  }
  
  // Check for focus indicators
  if (/focus:/i.test(code)) {
    passed.push('Focus states defined');
  } else if (/<button|<a |<input/i.test(code)) {
    issues.push({ type: 'info', message: 'Consider adding focus indicators for interactive elements' });
  }
  
  // Check for semantic HTML
  if (/<main|<nav|<header|<footer|<article|<section|<aside/i.test(code)) {
    passed.push('Uses semantic HTML elements');
  } else {
    issues.push({ type: 'info', message: 'Consider using semantic HTML (main, nav, header, etc.)' });
  }
  
  // Check for ARIA attributes
  if (/aria-|role=/i.test(code)) {
    passed.push('Uses ARIA attributes');
  }
  
  // Calculate score
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const score = Math.max(0, 100 - (errorCount * 20) - (warningCount * 10));
  
  return { score, issues, passed };
}
