// ============================================
// App Types
// ============================================

export interface Flow {
  id: string;
  name: string;
  videoUrl: string;
  audioUrl?: string;
  thumbnail?: string;
  duration: number;
  createdAt: Date;
  status: "recording" | "processing" | "ready" | "error";
  generatedCode?: string;
  styleDirective?: string;
}

// ============================================
// Database Types (Supabase)
// ============================================

export type Plan = "free" | "pro" | "agency";
export type MembershipStatus = "active" | "canceled" | "past_due" | "trialing";
export type CreditBucket = "monthly" | "rollover" | "topup";
export type CreditType = "credit" | "debit";
export type CreditReason = 
  | "video_generate" 
  | "ai_edit" 
  | "monthly_refill" 
  | "rollover_grant" 
  | "topup_purchase" 
  | "admin_adjust"
  | "signup_bonus";
export type GenerationStatus = "queued" | "running" | "complete" | "failed";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  plan: Plan;
  status: MembershipStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditWallet {
  user_id: string;
  monthly_credits: number;
  rollover_credits: number;
  topup_credits: number;
  rollover_expires_at: string | null;
  updated_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  user_id: string;
  type: CreditType;
  bucket: CreditBucket;
  amount: number;
  reason: CreditReason;
  reference_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  project_id: string | null;
  user_id: string;
  status: GenerationStatus;
  cost_credits: number;
  input_video_url: string | null;
  input_context: string | null;
  input_style: string | null;
  input_trim_start: number | null;
  input_trim_end: number | null;
  output_code: string | null;
  output_design_system: Record<string, any> | null;
  output_architecture: Record<string, any> | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasAudio: boolean;
}

export interface TransmuteRequest {
  videoUrl: string; // Always use URL (uploaded to Supabase Storage)
  styleDirective: string;
  additionalContext?: string;
}

export interface TransmuteResponse {
  success: boolean;
  code?: string;
  analysis?: {
    interactions: string[];
    components: string[];
    animations: string[];
    dataExtracted: string[];
  };
  error?: string;
}

export type StylePreset = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  preview: string;
};

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "linear",
    name: "Linear",
    description: "Clean, minimal SaaS aesthetic",
    prompt: "Modern SaaS style like Linear. Clean typography, subtle shadows, minimal color palette with purple accents. Precise spacing.",
    preview: "🎯",
  },
  {
    id: "apple",
    name: "Apple",
    description: "Premium, spacious design",
    prompt: "Apple-inspired design. Heavy typography, generous whitespace, subtle gradients, premium feel. San Francisco font style.",
    preview: "🍎",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Bold, vibrant dark theme",
    prompt: "Spotify-style dark theme. High contrast, vibrant green accents, bold headlines, rounded corners, playful energy.",
    preview: "🎵",
  },
  {
    id: "notion",
    name: "Notion",
    description: "Clean, content-focused",
    prompt: "Notion-inspired. Content-first layout, minimal UI chrome, soft borders, emoji-friendly, comfortable reading experience.",
    preview: "📝",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Neon, futuristic aesthetic",
    prompt: "Cyberpunk aesthetic. Neon colors (cyan, magenta, yellow), dark backgrounds, glitch effects, sharp angles, futuristic typography.",
    preview: "🌃",
  },
  {
    id: "glassmorphism",
    name: "Glass",
    description: "Frosted glass effects",
    prompt: "Glassmorphism style. Frosted glass backgrounds, subtle blur effects, gradient borders, layered depth, elegant transparency.",
    preview: "✨",
  },
  {
    id: "brutalist",
    name: "Brutalist",
    description: "Raw, bold design",
    prompt: "Brutalist web design. Stark contrasts, raw HTML feel, bold typography, unconventional layouts, visible borders.",
    preview: "🏗️",
  },
  {
    id: "clone",
    name: "Clone Exactly",
    description: "Replicate the original",
    prompt: "Clone the exact visual appearance from the video. Match colors, spacing, typography, and layout precisely.",
    preview: "🔄",
  },
];


