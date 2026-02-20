// ============================================================================
// REPLAY.BUILD - DESIGN SKILLS (from skills.sh ecosystem)
// Sources: frontend-design (anthropics/skills), web-design-guidelines (vercel-labs)
// ============================================================================

/**
 * Frontend Design Skill - Creates distinctive, production-grade UI
 * Based on: anthropics/skills (21.8K installs)
 */
export const FRONTEND_DESIGN_SKILL = `
## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian
- **Constraints**: Technical requirements (framework, performance, accessibility)
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

CRITICAL: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. VARY your approach: gradient meshes, geometric patterns, layered transparencies, dramatic shadows, aurora effects, animated orbs, CSS patterns, or clean minimalist backgrounds. DO NOT always add grain/noise — use it sparingly and only when it fits the aesthetic.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.
`;

/**
 * Web Design Guidelines Skill - Audit UI for best practices
 * Based on: vercel-labs/agent-skills (47.7K installs)
 */
export const WEB_DESIGN_GUIDELINES_SKILL = `
## Web Interface Guidelines

### Core Principles
1. **Clarity over cleverness** - Users should understand UI at a glance
2. **Consistency in patterns** - Same action = same visual treatment
3. **Responsive by default** - Mobile-first, then enhance for larger screens
4. **Accessible to all** - WCAG 2.1 AA compliance minimum

### Visual Hierarchy
- Size indicates importance (larger = more important)
- Color draws attention (use sparingly for emphasis)
- Spacing groups related elements
- Contrast separates content from background

### Interactive Elements
- Buttons must look clickable (clear affordance)
- Hover states provide feedback
- Focus states for keyboard navigation (visible, high-contrast)
- Loading states for async operations

### Typography Scale
- Use a consistent type scale (1.25x or 1.333x ratio)
- Limit to 2-3 font weights per page
- Line height: 1.5x for body, 1.2x for headings
- Max width: 65-75 characters for readability

### Spacing System
- Use 4px or 8px base unit
- Consistent padding/margin multipliers
- Generous whitespace = premium feel
- Tight spacing = dense, data-heavy interfaces

### Color Usage
- Primary: main actions, brand identity
- Secondary: supporting elements
- Accent: highlights, notifications
- Semantic: success (green), error (red), warning (amber)
`;

/**
 * Design System Patterns Skill
 * Based on: wshobson/agents
 */
export const DESIGN_SYSTEM_PATTERNS_SKILL = `
## Design System Architecture

### Token Hierarchy
1. **Primitive Tokens** - Raw values (colors, sizes)
   \`--color-blue-500: #3b82f6\`
   
2. **Semantic Tokens** - Contextual meaning
   \`--color-primary: var(--color-blue-500)\`
   
3. **Component Tokens** - Scoped to component
   \`--button-bg: var(--color-primary)\`

### Component Categories
- **Primitives**: Button, Input, Text, Icon
- **Composites**: Card, Modal, Dropdown
- **Patterns**: Form, Navigation, Data Table

### Variant System
\`\`\`css
/* Base styles */
.button { /* shared styles */ }

/* Variants */
.button--primary { background: var(--color-primary); }
.button--secondary { background: transparent; border: 1px solid; }
.button--ghost { background: transparent; }

/* Sizes */
.button--sm { padding: 0.5rem 1rem; }
.button--md { padding: 0.75rem 1.5rem; }
.button--lg { padding: 1rem 2rem; }
\`\`\`

### Documentation Requirements
- Usage guidelines (when to use, when not to)
- Props/API reference
- Interactive examples
- Accessibility notes
- Do's and Don'ts
`;

/**
 * Tailwind Design System Skill
 * Based on: wshobson/agents
 */
export const TAILWIND_DESIGN_SYSTEM_SKILL = `
## Tailwind CSS Best Practices

### Custom Theme Extension
\`\`\`js
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#6366f1',
          900: '#1e1b4b',
        },
        surface: 'rgba(255, 255, 255, 0.05)',
        border: 'rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
    },
  },
}
\`\`\`

### Component Patterns
\`\`\`tsx
// Reusable class compositions
const buttonVariants = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white',
  secondary: 'bg-transparent border border-white/20 hover:bg-white/5',
  ghost: 'bg-transparent hover:bg-white/5 text-white/70 hover:text-white',
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
\`\`\`

### Dark Mode Pattern
\`\`\`tsx
// Use CSS variables for seamless theme switching
<div className="bg-[var(--color-bg)] text-[var(--color-foreground)]">
  <div className="bg-[var(--color-surface)] border-[var(--color-border)]">
    {/* content */}
  </div>
</div>
\`\`\`

### Responsive Patterns
- Mobile-first: \`text-sm md:text-base lg:text-lg\`
- Stack then row: \`flex flex-col lg:flex-row\`
- Hide/show: \`hidden md:block\`
`;

/**
 * Combined Design Skills for Gemini prompts
 */
export const COMBINED_DESIGN_SKILLS = `
═══════════════════════════════════════════════════════════════════════════════
🎨 DESIGN SKILLS (from skills.sh ecosystem)
═══════════════════════════════════════════════════════════════════════════════

${FRONTEND_DESIGN_SKILL}

${WEB_DESIGN_GUIDELINES_SKILL}

${DESIGN_SYSTEM_PATTERNS_SKILL}

${TAILWIND_DESIGN_SYSTEM_SKILL}
`;

export default COMBINED_DESIGN_SKILLS;
