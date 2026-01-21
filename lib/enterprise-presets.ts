// ============================================================================
// ENTERPRISE DESIGN SYSTEM PRESETS
// Modern, production-ready design systems for legacy modernization
// ============================================================================

export interface DesignToken {
  name: string;
  value: string;
  cssVar: string;
}

export interface TypographyScale {
  fontFamily: string;
  fontFamilyMono: string;
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
  };
  weights: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeights: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface ColorPalette {
  // Core
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  
  // Semantic
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  
  // State
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Borders & Shadows
  border: string;
  ring: string;
  
  // Chart colors (Recharts compatible)
  chart: {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;
    quinary: string;
  };
}

export interface SpacingScale {
  px: string;
  0: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

export interface BorderRadius {
  none: string;
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
  "2xl": string;
  "3xl": string;
  full: string;
}

export interface ComponentConfig {
  button: {
    borderRadius: string;
    padding: string;
    fontSize: string;
    fontWeight: number;
    transition: string;
  };
  input: {
    borderRadius: string;
    padding: string;
    fontSize: string;
    borderWidth: string;
  };
  card: {
    borderRadius: string;
    padding: string;
    shadow: string;
    border: string;
  };
  table: {
    headerBackground: string;
    rowHover: string;
    borderColor: string;
    cellPadding: string;
  };
  modal: {
    borderRadius: string;
    shadow: string;
    overlay: string;
    maxWidth: string;
  };
  badge: {
    borderRadius: string;
    padding: string;
    fontSize: string;
  };
}

export interface ChartConfig {
  library: "recharts" | "chart.js";
  colors: string[];
  gridColor: string;
  axisColor: string;
  tooltipBackground: string;
  tooltipText: string;
  animation: boolean;
  animationDuration: number;
}

export interface EnterprisePreset {
  id: string;
  name: string;
  description: string;
  industry: "financial" | "saas" | "healthcare" | "government" | "technology";
  
  // Visual identity
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  typography: TypographyScale;
  spacing: SpacingScale;
  borderRadius: BorderRadius;
  
  // Component configurations
  components: ComponentConfig;
  
  // Chart library setup
  charts: ChartConfig;
  
  // Tailwind config extension
  tailwindExtend: Record<string, unknown>;
  
  // shadcn/ui component variants
  shadcnTheme: "default" | "new-york";
  
  // Accessibility
  wcagLevel: "AA" | "AAA";
  
  // Meta
  preview: string; // Short code for preview
  tags: string[];
}

// ============================================================================
// PRESET 1: FINANCIAL SERVICES PRO
// For banks, insurance, investment platforms, fintech
// ============================================================================
export const FINANCIAL_SERVICES_PRESET: EnterprisePreset = {
  id: "financial-services",
  name: "Financial Services Pro",
  description: "Professional, trustworthy design for banking, insurance, and investment platforms. High contrast, clear data visualization, accessibility-first.",
  industry: "financial",
  
  colors: {
    light: {
      background: "#FFFFFF",
      foreground: "#0F172A",
      card: "#FFFFFF",
      cardForeground: "#0F172A",
      primary: "#1E40AF", // Deep blue - trust
      primaryForeground: "#FFFFFF",
      secondary: "#F1F5F9",
      secondaryForeground: "#475569",
      muted: "#F8FAFC",
      mutedForeground: "#64748B",
      accent: "#0EA5E9", // Sky blue - action
      accentForeground: "#FFFFFF",
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
      info: "#0284C7",
      border: "#E2E8F0",
      ring: "#1E40AF",
      chart: {
        primary: "#1E40AF",
        secondary: "#0EA5E9",
        tertiary: "#059669",
        quaternary: "#D97706",
        quinary: "#7C3AED",
      },
    },
    dark: {
      background: "#0F172A",
      foreground: "#F8FAFC",
      card: "#1E293B",
      cardForeground: "#F8FAFC",
      primary: "#3B82F6",
      primaryForeground: "#FFFFFF",
      secondary: "#334155",
      secondaryForeground: "#CBD5E1",
      muted: "#1E293B",
      mutedForeground: "#94A3B8",
      accent: "#38BDF8",
      accentForeground: "#0F172A",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#0EA5E9",
      border: "#334155",
      ring: "#3B82F6",
      chart: {
        primary: "#3B82F6",
        secondary: "#38BDF8",
        tertiary: "#10B981",
        quaternary: "#F59E0B",
        quinary: "#A78BFA",
      },
    },
  },
  
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'Fira Code', monospace",
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
  
  spacing: {
    px: "1px",
    0: "0px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    11: "2.75rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },
  
  borderRadius: {
    none: "0px",
    sm: "0.125rem",
    default: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  
  components: {
    button: {
      borderRadius: "0.5rem",
      padding: "0.625rem 1.25rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      transition: "all 150ms ease",
    },
    input: {
      borderRadius: "0.5rem",
      padding: "0.625rem 0.875rem",
      fontSize: "0.875rem",
      borderWidth: "1px",
    },
    card: {
      borderRadius: "0.75rem",
      padding: "1.5rem",
      shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      border: "1px solid",
    },
    table: {
      headerBackground: "#F8FAFC",
      rowHover: "#F1F5F9",
      borderColor: "#E2E8F0",
      cellPadding: "0.75rem 1rem",
    },
    modal: {
      borderRadius: "0.75rem",
      shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      overlay: "rgba(0, 0, 0, 0.5)",
      maxWidth: "32rem",
    },
    badge: {
      borderRadius: "9999px",
      padding: "0.125rem 0.625rem",
      fontSize: "0.75rem",
    },
  },
  
  charts: {
    library: "recharts",
    colors: ["#1E40AF", "#0EA5E9", "#059669", "#D97706", "#7C3AED", "#DB2777"],
    gridColor: "#E2E8F0",
    axisColor: "#64748B",
    tooltipBackground: "#0F172A",
    tooltipText: "#F8FAFC",
    animation: true,
    animationDuration: 300,
  },
  
  tailwindExtend: {
    colors: {
      financial: {
        50: "#EFF6FF",
        100: "#DBEAFE",
        200: "#BFDBFE",
        300: "#93C5FD",
        400: "#60A5FA",
        500: "#3B82F6",
        600: "#2563EB",
        700: "#1D4ED8",
        800: "#1E40AF",
        900: "#1E3A8A",
      },
    },
  },
  
  shadcnTheme: "default",
  wcagLevel: "AA",
  preview: "FI",
  tags: ["banking", "finance", "insurance", "investment", "fintech", "compliance"],
};

// ============================================================================
// PRESET 2: MODERN SAAS DASHBOARD
// For B2B platforms, admin panels, internal tools
// ============================================================================
export const SAAS_DASHBOARD_PRESET: EnterprisePreset = {
  id: "saas-dashboard",
  name: "Modern SaaS Dashboard",
  description: "Clean, productive interface for B2B platforms and internal tools. Sidebar navigation, data-dense layouts, efficient workflows.",
  industry: "saas",
  
  colors: {
    light: {
      background: "#FAFAFA",
      foreground: "#18181B",
      card: "#FFFFFF",
      cardForeground: "#18181B",
      primary: "#7C3AED", // Violet - modern tech
      primaryForeground: "#FFFFFF",
      secondary: "#F4F4F5",
      secondaryForeground: "#52525B",
      muted: "#F4F4F5",
      mutedForeground: "#71717A",
      accent: "#06B6D4", // Cyan - interactive
      accentForeground: "#FFFFFF",
      success: "#22C55E",
      warning: "#EAB308",
      error: "#EF4444",
      info: "#3B82F6",
      border: "#E4E4E7",
      ring: "#7C3AED",
      chart: {
        primary: "#7C3AED",
        secondary: "#06B6D4",
        tertiary: "#22C55E",
        quaternary: "#F59E0B",
        quinary: "#EC4899",
      },
    },
    dark: {
      background: "#09090B",
      foreground: "#FAFAFA",
      card: "#18181B",
      cardForeground: "#FAFAFA",
      primary: "#A78BFA",
      primaryForeground: "#09090B",
      secondary: "#27272A",
      secondaryForeground: "#A1A1AA",
      muted: "#27272A",
      mutedForeground: "#A1A1AA",
      accent: "#22D3EE",
      accentForeground: "#09090B",
      success: "#4ADE80",
      warning: "#FACC15",
      error: "#F87171",
      info: "#60A5FA",
      border: "#27272A",
      ring: "#A78BFA",
      chart: {
        primary: "#A78BFA",
        secondary: "#22D3EE",
        tertiary: "#4ADE80",
        quaternary: "#FACC15",
        quinary: "#F472B6",
      },
    },
  },
  
  typography: {
    fontFamily: "'Geist', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Geist Mono', 'JetBrains Mono', monospace",
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "0.9375rem",
      lg: "1.0625rem",
      xl: "1.1875rem",
      "2xl": "1.4375rem",
      "3xl": "1.8125rem",
      "4xl": "2.1875rem",
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: "1.2",
      normal: "1.5",
      relaxed: "1.625",
    },
  },
  
  spacing: {
    px: "1px",
    0: "0px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    11: "2.75rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },
  
  borderRadius: {
    none: "0px",
    sm: "0.125rem",
    default: "0.375rem",
    md: "0.5rem",
    lg: "0.625rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.25rem",
    full: "9999px",
  },
  
  components: {
    button: {
      borderRadius: "0.375rem",
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      transition: "all 100ms ease",
    },
    input: {
      borderRadius: "0.375rem",
      padding: "0.5rem 0.75rem",
      fontSize: "0.875rem",
      borderWidth: "1px",
    },
    card: {
      borderRadius: "0.625rem",
      padding: "1.25rem",
      shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      border: "1px solid",
    },
    table: {
      headerBackground: "#FAFAFA",
      rowHover: "#F4F4F5",
      borderColor: "#E4E4E7",
      cellPadding: "0.625rem 0.875rem",
    },
    modal: {
      borderRadius: "0.625rem",
      shadow: "0 20px 40px -12px rgb(0 0 0 / 0.3)",
      overlay: "rgba(0, 0, 0, 0.6)",
      maxWidth: "28rem",
    },
    badge: {
      borderRadius: "0.375rem",
      padding: "0.125rem 0.5rem",
      fontSize: "0.75rem",
    },
  },
  
  charts: {
    library: "recharts",
    colors: ["#7C3AED", "#06B6D4", "#22C55E", "#EAB308", "#EC4899", "#F97316"],
    gridColor: "#E4E4E7",
    axisColor: "#71717A",
    tooltipBackground: "#18181B",
    tooltipText: "#FAFAFA",
    animation: true,
    animationDuration: 250,
  },
  
  tailwindExtend: {
    colors: {
      saas: {
        50: "#FAF5FF",
        100: "#F3E8FF",
        200: "#E9D5FF",
        300: "#D8B4FE",
        400: "#C084FC",
        500: "#A855F7",
        600: "#9333EA",
        700: "#7C3AED",
        800: "#6B21A8",
        900: "#581C87",
      },
    },
  },
  
  shadcnTheme: "new-york",
  wcagLevel: "AA",
  preview: "SA",
  tags: ["saas", "dashboard", "admin", "b2b", "internal-tools", "crm", "erp"],
};

// ============================================================================
// PRESET 3: HEALTHCARE CLEAN
// For EHR, patient portals, medical admin
// ============================================================================
export const HEALTHCARE_PRESET: EnterprisePreset = {
  id: "healthcare-clean",
  name: "Healthcare Clean",
  description: "Calm, accessible design for healthcare systems. Clear hierarchy, high contrast for readability, HIPAA-compliant color coding.",
  industry: "healthcare",
  
  colors: {
    light: {
      background: "#FFFFFF",
      foreground: "#1F2937",
      card: "#FFFFFF",
      cardForeground: "#1F2937",
      primary: "#0D9488", // Teal - healthcare
      primaryForeground: "#FFFFFF",
      secondary: "#F3F4F6",
      secondaryForeground: "#4B5563",
      muted: "#F9FAFB",
      mutedForeground: "#6B7280",
      accent: "#2563EB", // Blue - trust
      accentForeground: "#FFFFFF",
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
      info: "#0284C7",
      border: "#E5E7EB",
      ring: "#0D9488",
      chart: {
        primary: "#0D9488",
        secondary: "#2563EB",
        tertiary: "#059669",
        quaternary: "#D97706",
        quinary: "#7C3AED",
      },
    },
    dark: {
      background: "#111827",
      foreground: "#F9FAFB",
      card: "#1F2937",
      cardForeground: "#F9FAFB",
      primary: "#14B8A6",
      primaryForeground: "#111827",
      secondary: "#374151",
      secondaryForeground: "#D1D5DB",
      muted: "#374151",
      mutedForeground: "#9CA3AF",
      accent: "#3B82F6",
      accentForeground: "#FFFFFF",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#0EA5E9",
      border: "#374151",
      ring: "#14B8A6",
      chart: {
        primary: "#14B8A6",
        secondary: "#3B82F6",
        tertiary: "#10B981",
        quaternary: "#F59E0B",
        quinary: "#A78BFA",
      },
    },
  },
  
  typography: {
    fontFamily: "'Source Sans 3', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'IBM Plex Mono', 'JetBrains Mono', monospace",
    sizes: {
      xs: "0.8125rem",
      sm: "0.9375rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.3125rem",
      "2xl": "1.5625rem",
      "3xl": "2rem",
      "4xl": "2.5rem",
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: "1.3",
      normal: "1.6",
      relaxed: "1.8",
    },
  },
  
  spacing: {
    px: "1px",
    0: "0px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    11: "2.75rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },
  
  borderRadius: {
    none: "0px",
    sm: "0.25rem",
    default: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    "2xl": "1.25rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  
  components: {
    button: {
      borderRadius: "0.5rem",
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
      fontWeight: 500,
      transition: "all 150ms ease",
    },
    input: {
      borderRadius: "0.5rem",
      padding: "0.75rem 1rem",
      fontSize: "1rem",
      borderWidth: "2px",
    },
    card: {
      borderRadius: "0.75rem",
      padding: "1.5rem",
      shadow: "0 2px 4px 0 rgb(0 0 0 / 0.05)",
      border: "1px solid",
    },
    table: {
      headerBackground: "#F9FAFB",
      rowHover: "#F3F4F6",
      borderColor: "#E5E7EB",
      cellPadding: "1rem 1.25rem",
    },
    modal: {
      borderRadius: "1rem",
      shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      overlay: "rgba(0, 0, 0, 0.4)",
      maxWidth: "36rem",
    },
    badge: {
      borderRadius: "0.375rem",
      padding: "0.25rem 0.75rem",
      fontSize: "0.875rem",
    },
  },
  
  charts: {
    library: "recharts",
    colors: ["#0D9488", "#2563EB", "#059669", "#D97706", "#7C3AED", "#DB2777"],
    gridColor: "#E5E7EB",
    axisColor: "#6B7280",
    tooltipBackground: "#1F2937",
    tooltipText: "#F9FAFB",
    animation: true,
    animationDuration: 350,
  },
  
  tailwindExtend: {
    colors: {
      healthcare: {
        50: "#F0FDFA",
        100: "#CCFBF1",
        200: "#99F6E4",
        300: "#5EEAD4",
        400: "#2DD4BF",
        500: "#14B8A6",
        600: "#0D9488",
        700: "#0F766E",
        800: "#115E59",
        900: "#134E4A",
      },
    },
  },
  
  shadcnTheme: "default",
  wcagLevel: "AAA",
  preview: "HC",
  tags: ["healthcare", "medical", "ehr", "patient-portal", "hipaa", "accessibility"],
};

// ============================================================================
// PRESET 4: GOVERNMENT/PUBLIC SECTOR
// For government portals, civic tech, compliance systems
// ============================================================================
export const GOVERNMENT_PRESET: EnterprisePreset = {
  id: "government-public",
  name: "Government & Public Sector",
  description: "Formal, accessible design for government systems. High contrast, clear navigation, WCAG AAA compliance, multi-language ready.",
  industry: "government",
  
  colors: {
    light: {
      background: "#FFFFFF",
      foreground: "#1A202C",
      card: "#FFFFFF",
      cardForeground: "#1A202C",
      primary: "#1A365D", // Dark blue - official
      primaryForeground: "#FFFFFF",
      secondary: "#EDF2F7",
      secondaryForeground: "#4A5568",
      muted: "#F7FAFC",
      mutedForeground: "#718096",
      accent: "#C53030", // Red - action/alert
      accentForeground: "#FFFFFF",
      success: "#276749",
      warning: "#C05621",
      error: "#C53030",
      info: "#2B6CB0",
      border: "#E2E8F0",
      ring: "#1A365D",
      chart: {
        primary: "#1A365D",
        secondary: "#2B6CB0",
        tertiary: "#276749",
        quaternary: "#C05621",
        quinary: "#6B46C1",
      },
    },
    dark: {
      background: "#1A202C",
      foreground: "#F7FAFC",
      card: "#2D3748",
      cardForeground: "#F7FAFC",
      primary: "#4299E1",
      primaryForeground: "#1A202C",
      secondary: "#4A5568",
      secondaryForeground: "#E2E8F0",
      muted: "#4A5568",
      mutedForeground: "#A0AEC0",
      accent: "#FC8181",
      accentForeground: "#1A202C",
      success: "#68D391",
      warning: "#F6AD55",
      error: "#FC8181",
      info: "#63B3ED",
      border: "#4A5568",
      ring: "#4299E1",
      chart: {
        primary: "#4299E1",
        secondary: "#63B3ED",
        tertiary: "#68D391",
        quaternary: "#F6AD55",
        quinary: "#B794F4",
      },
    },
  },
  
  typography: {
    fontFamily: "'Public Sans', 'Noto Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    fontFamilyMono: "'Roboto Mono', 'JetBrains Mono', monospace",
    sizes: {
      xs: "0.875rem",
      sm: "1rem",
      base: "1.125rem",
      lg: "1.25rem",
      xl: "1.5rem",
      "2xl": "1.875rem",
      "3xl": "2.25rem",
      "4xl": "3rem",
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: "1.3",
      normal: "1.6",
      relaxed: "1.8",
    },
  },
  
  spacing: {
    px: "1px",
    0: "0px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    11: "2.75rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },
  
  borderRadius: {
    none: "0px",
    sm: "0.125rem",
    default: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.625rem",
    "2xl": "0.75rem",
    "3xl": "1rem",
    full: "9999px",
  },
  
  components: {
    button: {
      borderRadius: "0.25rem",
      padding: "0.75rem 1.5rem",
      fontSize: "1rem",
      fontWeight: 600,
      transition: "all 100ms ease",
    },
    input: {
      borderRadius: "0.25rem",
      padding: "0.875rem 1rem",
      fontSize: "1rem",
      borderWidth: "2px",
    },
    card: {
      borderRadius: "0.5rem",
      padding: "1.5rem",
      shadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      border: "2px solid",
    },
    table: {
      headerBackground: "#EDF2F7",
      rowHover: "#F7FAFC",
      borderColor: "#E2E8F0",
      cellPadding: "1rem 1.25rem",
    },
    modal: {
      borderRadius: "0.5rem",
      shadow: "0 20px 40px -12px rgb(0 0 0 / 0.3)",
      overlay: "rgba(0, 0, 0, 0.5)",
      maxWidth: "40rem",
    },
    badge: {
      borderRadius: "0.25rem",
      padding: "0.25rem 0.625rem",
      fontSize: "0.875rem",
    },
  },
  
  charts: {
    library: "recharts",
    colors: ["#1A365D", "#2B6CB0", "#276749", "#C05621", "#6B46C1", "#B83280"],
    gridColor: "#E2E8F0",
    axisColor: "#718096",
    tooltipBackground: "#1A202C",
    tooltipText: "#F7FAFC",
    animation: true,
    animationDuration: 400,
  },
  
  tailwindExtend: {
    colors: {
      government: {
        50: "#EBF8FF",
        100: "#BEE3F8",
        200: "#90CDF4",
        300: "#63B3ED",
        400: "#4299E1",
        500: "#3182CE",
        600: "#2B6CB0",
        700: "#2C5282",
        800: "#2A4365",
        900: "#1A365D",
      },
    },
  },
  
  shadcnTheme: "default",
  wcagLevel: "AAA",
  preview: "GV",
  tags: ["government", "public-sector", "civic", "compliance", "accessibility", "multi-language"],
};

// ============================================================================
// AUTO-DETECT PRESET (1:1 copy from video, no style overrides)
// ============================================================================
export const AUTO_DETECT_PRESET: EnterprisePreset = {
  id: "auto-detect",
  name: "Auto-Detect",
  description: "Perfect 1:1 copy from video - no style overrides, pure OCR extraction",
  industry: "technology",
  colors: {
    light: {
      background: "#ffffff",
      foreground: "#0a0a0a",
      card: "#ffffff",
      cardForeground: "#0a0a0a",
      primary: "#0a0a0a",
      primaryForeground: "#ffffff",
      secondary: "#f4f4f5",
      secondaryForeground: "#0a0a0a",
      muted: "#f4f4f5",
      mutedForeground: "#71717a",
      accent: "#f4f4f5",
      accentForeground: "#0a0a0a",
      border: "#e4e4e7",
      ring: "#0a0a0a",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
      chart: {
        primary: "#6366f1",
        secondary: "#22c55e",
        tertiary: "#f59e0b",
        quaternary: "#ef4444",
        quinary: "#8b5cf6",
      },
    },
    dark: {
      background: "#0a0a0a",
      foreground: "#fafafa",
      card: "#18181b",
      cardForeground: "#fafafa",
      primary: "#fafafa",
      primaryForeground: "#0a0a0a",
      secondary: "#27272a",
      secondaryForeground: "#fafafa",
      muted: "#27272a",
      mutedForeground: "#a1a1aa",
      accent: "#27272a",
      accentForeground: "#fafafa",
      border: "#27272a",
      ring: "#fafafa",
      success: "#22c55e",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
      chart: {
        primary: "#6366f1",
        secondary: "#22c55e",
        tertiary: "#f59e0b",
        quaternary: "#ef4444",
        quinary: "#8b5cf6",
      },
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontFamilyMono: "'JetBrains Mono', 'Fira Code', monospace",
    sizes: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeights: {
      tight: "1.25",
      normal: "1.5",
      relaxed: "1.75",
    },
  },
  spacing: {
    px: "1px",
    0: "0px",
    0.5: "0.125rem",
    1: "0.25rem",
    1.5: "0.375rem",
    2: "0.5rem",
    2.5: "0.625rem",
    3: "0.75rem",
    3.5: "0.875rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    7: "1.75rem",
    8: "2rem",
    9: "2.25rem",
    10: "2.5rem",
    11: "2.75rem",
    12: "3rem",
    14: "3.5rem",
    16: "4rem",
    20: "5rem",
    24: "6rem",
    28: "7rem",
    32: "8rem",
    36: "9rem",
    40: "10rem",
    44: "11rem",
    48: "12rem",
    52: "13rem",
    56: "14rem",
    60: "15rem",
    64: "16rem",
    72: "18rem",
    80: "20rem",
    96: "24rem",
  },
  borderRadius: {
    none: "0px",
    sm: "0.125rem",
    default: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
    "2xl": "1rem",
    "3xl": "1.5rem",
    full: "9999px",
  },
  components: {
    button: {
      borderRadius: "0.375rem",
      padding: "0.5rem 1rem",
      fontSize: "0.875rem",
      fontWeight: 500,
      transition: "all 150ms ease-in-out",
    },
    input: {
      borderRadius: "0.375rem",
      padding: "0.5rem 0.75rem",
      fontSize: "0.875rem",
      borderWidth: "1px",
    },
    card: {
      borderRadius: "0.5rem",
      padding: "1.5rem",
      shadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      border: "1px solid var(--border)",
    },
    table: {
      headerBackground: "var(--muted)",
      rowHover: "var(--muted)",
      borderColor: "var(--border)",
      cellPadding: "0.75rem 1rem",
    },
    modal: {
      borderRadius: "0.75rem",
      shadow: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
      overlay: "rgba(0, 0, 0, 0.5)",
      maxWidth: "32rem",
    },
    badge: {
      borderRadius: "9999px",
      padding: "0.125rem 0.625rem",
      fontSize: "0.75rem",
    },
  },
  charts: {
    library: "recharts",
    colors: ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"],
    gridColor: "rgba(255, 255, 255, 0.1)",
    axisColor: "#71717a",
    tooltipBackground: "#18181b",
    tooltipText: "#fafafa",
    animation: true,
    animationDuration: 300,
  },
  tailwindExtend: {},
  shadcnTheme: "default",
  wcagLevel: "AA",
  preview: "AD",
  tags: ["auto-detect", "1:1", "pixel-perfect", "ocr", "copy"],
};

// ============================================================================
// ALL PRESETS EXPORT
// ============================================================================
export const ENTERPRISE_PRESETS: EnterprisePreset[] = [
  AUTO_DETECT_PRESET,
  FINANCIAL_SERVICES_PRESET,
  SAAS_DASHBOARD_PRESET,
  HEALTHCARE_PRESET,
  GOVERNMENT_PRESET,
];

export const getPresetById = (id: string): EnterprisePreset | undefined => {
  return ENTERPRISE_PRESETS.find(preset => preset.id === id);
};

export const getPresetsByIndustry = (industry: EnterprisePreset["industry"]): EnterprisePreset[] => {
  return ENTERPRISE_PRESETS.filter(preset => preset.industry === industry);
};

// ============================================================================
// GENERATE CSS VARIABLES FROM PRESET
// ============================================================================
export const generateCSSVariables = (preset: EnterprisePreset, mode: "light" | "dark" = "light"): string => {
  const colors = preset.colors[mode];
  
  return `
:root {
  /* Colors */
  --background: ${colors.background};
  --foreground: ${colors.foreground};
  --card: ${colors.card};
  --card-foreground: ${colors.cardForeground};
  --primary: ${colors.primary};
  --primary-foreground: ${colors.primaryForeground};
  --secondary: ${colors.secondary};
  --secondary-foreground: ${colors.secondaryForeground};
  --muted: ${colors.muted};
  --muted-foreground: ${colors.mutedForeground};
  --accent: ${colors.accent};
  --accent-foreground: ${colors.accentForeground};
  --success: ${colors.success};
  --warning: ${colors.warning};
  --error: ${colors.error};
  --info: ${colors.info};
  --border: ${colors.border};
  --ring: ${colors.ring};
  
  /* Chart Colors */
  --chart-1: ${colors.chart.primary};
  --chart-2: ${colors.chart.secondary};
  --chart-3: ${colors.chart.tertiary};
  --chart-4: ${colors.chart.quaternary};
  --chart-5: ${colors.chart.quinary};
  
  /* Typography */
  --font-family: ${preset.typography.fontFamily};
  --font-family-mono: ${preset.typography.fontFamilyMono};
  
  /* Border Radius */
  --radius-sm: ${preset.borderRadius.sm};
  --radius: ${preset.borderRadius.default};
  --radius-md: ${preset.borderRadius.md};
  --radius-lg: ${preset.borderRadius.lg};
  --radius-xl: ${preset.borderRadius.xl};
}
  `.trim();
};

// ============================================================================
// GENERATE TAILWIND CONFIG EXTEND
// ============================================================================
export const generateTailwindConfig = (preset: EnterprisePreset): string => {
  return `
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['${preset.typography.fontFamily.split("'")[1]}', 'sans-serif'],
        mono: ['${preset.typography.fontFamilyMono.split("'")[1]}', 'monospace'],
      },
      colors: ${JSON.stringify(preset.tailwindExtend.colors, null, 6)},
      borderRadius: {
        lg: '${preset.borderRadius.lg}',
        md: '${preset.borderRadius.md}',
        sm: '${preset.borderRadius.sm}',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
  `.trim();
};
