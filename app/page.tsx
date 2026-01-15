"use client";

import { useState, useCallback, useRef, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Trash2,
  Upload,
  Download,
  ChevronRight,
  ChevronLeft,
  Film,
  CheckCircle,
  ExternalLink,
  Monitor,
  Video,
  Code,
  Eye,
  Square,
  ChevronDown,
  User,
  Sparkles,
  Activity,
  Palette,
  FileInput,
  Send,
  Pencil,
  X,
  GitBranch,
  Box,
  Boxes,
  Layers,
  Layout,
  Type,
  MousePointer,
  Play,
  Pause,
  Check,
  Droplet,
  Paintbrush,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Smartphone,
  Crosshair,
  Clock,
  Plus,
  Copy,
  History,
  Lock,
  MoreVertical,
  GripVertical,
  Folder,
  FolderTree,
  FileCode,
  Search,
  Settings,
  Image as ImageIcon,
  Paperclip,
  LogOut,
  Database,
  MessageSquare,
  ArrowRight,
  MousePointer2,
  Info,
  Rocket
} from "lucide-react";
import { cn, generateId, formatDuration, updateProjectAnalytics } from "@/lib/utils";
import { transmuteVideoToCode } from "@/actions/transmute";
import { getDatabaseContext, formatDatabaseContextForPrompt } from "@/lib/supabase/schema";
import { useIsMobile } from "@/lib/useIsMobile";
import { useGenerationJob } from "@/lib/useGenerationJob";
import { MobileLayout } from "@/components/mobile";
// Demo is now loaded from /api/demo/[id] endpoint

// Global abort controller for canceling AI requests
let currentAbortController: AbortController | null = null;

// Streaming edit callback type
type StreamCallback = (event: {
  type: 'status' | 'chunk' | 'progress' | 'complete' | 'error';
  message?: string;
  phase?: string;
  text?: string;
  fullText?: string;
  code?: string;
  summary?: string;
  error?: string;
  isChat?: boolean;
  lines?: number;
  preview?: string;
}) => void;

// Client-side wrapper for editCodeWithAI that uses streaming API
async function editCodeWithAIStreaming(
  currentCode: string,
  editRequest: string,
  images?: { base64?: string; url?: string; mimeType: string; name: string }[],
  databaseContext?: string,
  isPlanMode?: boolean,
  chatHistory?: { role: string; content: string }[],
  onStream?: StreamCallback
): Promise<{ success: boolean; code?: string; error?: string; cancelled?: boolean; summary?: string }> {
  // Cancel any existing request
  if (currentAbortController) {
    currentAbortController.abort();
  }
  
  currentAbortController = new AbortController();
  
  try {
    const response = await fetch('/api/edit-code/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentCode,
        editRequest,
        images,
        databaseContext,
        isPlanMode,
        chatHistory,
      }),
      signal: currentAbortController.signal,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[editCodeWithAI] API error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      return { success: false, error: 'No response stream' };
    }
    
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: { success: boolean; code?: string; error?: string; summary?: string } = { success: false };
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Parse SSE events
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('event: ')) {
          const eventType = line.slice(7);
          continue;
        }
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.error) {
              onStream?.({ type: 'error', error: data.error });
              finalResult = { success: false, error: data.error };
            } else if (data.message && data.phase) {
              onStream?.({ type: 'status', message: data.message, phase: data.phase });
            } else if (data.text !== undefined && data.fullText !== undefined) {
              // Real-time code chunk
              onStream?.({ type: 'chunk', text: data.text, fullText: data.fullText });
            } else if (data.lines !== undefined) {
              // Progress update with lines count and optional preview
              onStream?.({ 
                type: 'progress', 
                message: `${data.lines} lines...`,
                lines: data.lines,
                preview: data.preview
              });
            } else if (data.code !== undefined) {
              onStream?.({ 
                type: 'complete', 
                code: data.code, 
                summary: data.summary,
                isChat: data.isChat 
              });
              // Include needsClarification and isChat in result
              finalResult = { 
                success: true, 
                code: data.code, 
                summary: data.summary,
                needsClarification: data.needsClarification,
                isChat: data.isChat
              } as any;
            }
          } catch (e) {
            // Ignore JSON parse errors for incomplete data
          }
        }
      }
    }
    
    return finalResult;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[editCodeWithAI] Request cancelled by user');
      return { success: false, cancelled: true, error: 'Request cancelled' };
    }
    console.error('[editCodeWithAI] Fetch error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  } finally {
    currentAbortController = null;
  }
}

// Non-streaming fallback for compatibility
async function editCodeWithAI(
  currentCode: string,
  editRequest: string,
  images?: { base64?: string; url?: string; mimeType: string; name: string }[],
  databaseContext?: string,
  isPlanMode?: boolean,
  chatHistory?: { role: string; content: string }[]
): Promise<{ success: boolean; code?: string; error?: string; cancelled?: boolean }> {
  // Cancel any existing request
  if (currentAbortController) {
    currentAbortController.abort();
  }
  
  // Create new abort controller
  currentAbortController = new AbortController();
  
  try {
    const response = await fetch('/api/edit-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentCode,
        editRequest,
        images,
        databaseContext,
        isPlanMode,
        chatHistory,
      }),
      signal: currentAbortController.signal,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[editCodeWithAI] API error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('[editCodeWithAI] Request cancelled by user');
      return { success: false, cancelled: true, error: 'Request cancelled' };
    }
    console.error('[editCodeWithAI] Fetch error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Network error' };
  } finally {
    currentAbortController = null;
  }
}

// Function to cancel ongoing AI request
function cancelAIRequest() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    return true;
  }
  return false;
}
import Logo from "@/components/Logo";
import StyleInjector from "@/components/StyleInjector";
import { Highlight, themes } from "prism-react-renderer";
import { usePendingFlow } from "@/app/providers";
import { useAuth } from "@/lib/auth/context";
import { useCredits, CREDIT_COSTS } from "@/lib/credits/context";
import { useProfile } from "@/lib/profile/context";
import Image from "next/image";
import Avatar from "@/components/Avatar";
import AuthModal from "@/components/modals/AuthModal";
import OutOfCreditsModal from "@/components/modals/OutOfCreditsModal";
import FeedbackGateModal from "@/components/modals/FeedbackGateModal";
import UpgradeModal from "@/components/modals/UpgradeModal";
import ProjectSettingsModal from "@/components/ProjectSettingsModal";
import { Toast, useToast } from "@/components/Toast";
// MobileScanner removed - mobile users now use MobileLayout exclusively
import Link from "next/link";
import type { CodeMode, FileNode, FileTreeFolder, FileTreeFile, CodeReferenceMap } from "@/types";
import { trackViewContent, trackStartGeneration } from "@/lib/fb-tracking";

// Generate smart version label from user input (like Bolt/Lovable)
function generateVersionLabel(userInput: string): string {
  // Clean up the input
  let label = userInput.trim();
  
  // Remove common prefixes
  label = label.replace(/^(please\s+|can you\s+|could you\s+|i want to\s+|i need to\s+)/i, '');
  
  // Capitalize first letter
  label = label.charAt(0).toUpperCase() + label.slice(1);
  
  // If it starts with a verb, keep it as is
  const actionVerbs = ['add', 'remove', 'update', 'change', 'fix', 'make', 'create', 'delete', 'modify', 'adjust', 'improve', 'refactor', 'style', 'align', 'center', 'move', 'replace', 'translate', 'convert', 'expand', 'collapse', 'show', 'hide', 'enable', 'disable'];
  const startsWithVerb = actionVerbs.some(v => label.toLowerCase().startsWith(v));
  
  // If it doesn't start with a verb and is a request, try to extract action
  if (!startsWithVerb) {
    // Look for verbs in the text
    for (const verb of actionVerbs) {
      const verbIndex = label.toLowerCase().indexOf(verb);
      if (verbIndex > 0 && verbIndex < 20) {
        // Found verb, restructure
        label = label.substring(verbIndex);
        label = label.charAt(0).toUpperCase() + label.slice(1);
        break;
      }
    }
  }
  
  // Truncate to reasonable length (50 chars) at word boundary
  if (label.length > 50) {
    label = label.substring(0, 50);
    const lastSpace = label.lastIndexOf(' ');
    if (lastSpace > 30) {
      label = label.substring(0, lastSpace);
    }
  }
  
  // Remove trailing punctuation except for meaningful ones
  label = label.replace(/[,;:]+$/, '');
  
  return label || 'Code update';
}

interface FlowItem {
  id: string;
  name: string;
  videoBlob: Blob;
  videoUrl: string;
  thumbnail?: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
}

interface ArchNode {
  id: string;
  name: string;
  type: "page" | "component" | "section" | "element" | "interactive";
  description?: string;
  x: number;
  y: number;
  connections?: string[];
}

// Flow = PRODUCT MAP (not timeline) - what's possible, not what happened
// Shows CONFIRMED paths (from video) + POSSIBLE paths (detected nav items)
interface ProductFlowNode {
  id: string;
  name: string;
  type: "view" | "section" | "modal" | "state";
  description?: string;
  x: number;
  y: number;
  components?: string[];
  status: "observed" | "detected" | "possible" | "added"; // observed = shown in video, detected = in navigation but not visited, possible = reachable continuation, added = generated by AI
  confidence: "high" | "medium" | "low"; // Confidence level based on video evidence
}

interface ProductFlowEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  type: "navigation" | "action" | "scroll" | "gated" | "possible";
  // navigation = thick solid line (route change)
  // scroll = thin solid line (in-page)
  // gated = dashed line with lock (auth/paywall required)
  // action = medium solid line (user action)
  // possible = dashed gray line (detected in nav, not implemented)
}

// UX Signals detected during analysis - Technical tags
interface UXSignal {
  type: "motion" | "interaction" | "responsive" | "hierarchy" | "data";
  label: string;
  value: string;
  icon?: string; // emoji or icon identifier
  tech?: string; // technical implementation detail
}

// Component tree structure for analysis
interface ComponentTreeNode {
  name: string;
  type: "Atom" | "Molecule" | "Organism" | "Template";
  status: "waiting" | "generating" | "done";
  children?: string[];
  hasDataConnection?: boolean; // If connected to database
}

interface StyleInfo {
  colors: { name: string; value: string }[];
  fonts: { name: string; usage: string; weight: string; family: string }[];
  spacing: string;
  borderRadius: string;
  shadows: string;
}

// Generation history for persistence (saved to Supabase)
interface GenerationVersion {
  id: string;
  timestamp: number;
  label: string; // e.g., "Initial generation", "AI Edit: added header"
  code: string;
  flowNodes: ProductFlowNode[];
  flowEdges: ProductFlowEdge[];
  styleInfo: StyleInfo | null;
}

interface GenerationRecord {
  id: string;
  title: string;
  autoTitle: boolean;
  timestamp: number;
  status: "running" | "complete" | "failed";
  code: string | null;
  styleDirective: string;
  refinements: string;
  flowNodes: ProductFlowNode[];
  flowEdges: ProductFlowEdge[];
  styleInfo: StyleInfo | null;
  videoUrl?: string;
  thumbnailUrl?: string;
  versions?: GenerationVersion[]; // Version history
  publishedSlug?: string; // Persistent publish URL slug
  chatMessages?: ChatMessage[]; // Chat history per project
  tokenUsage?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
  costCredits?: number;
}

// Chat message for Agentic Sidebar
interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: number;
  attachments?: {
    type: "element" | "image" | "video";
    label: string;
    selector?: string;
  }[];
  quickActions?: string[];
}

type ViewMode = "preview" | "code" | "flow" | "design" | "input";
type SidebarMode = "config" | "chat";
type SidebarTab = "chat" | "tree" | "style";
type SidebarView = "projects" | "detail"; // New: toggle between project list and detail view

// Different loading messages for each tab - extended for longer generations
const STREAMING_MESSAGES_PREVIEW = [
  "Reconstructing user interface...",
  "Building visual components...",
  "Rendering pixel-perfect layout...",
  "Assembling responsive design...",
  "Crafting interactive elements...",
  "Applying style treatments...",
  "Polishing animations...",
  "Optimizing visual hierarchy...",
  "Finalizing preview render...",
  "Adding finishing touches...",
  "Rendering final output...",
  "Processing visual layers...",
  "Composing UI structure...",
  "Building interactive preview...",
  "Analyzing layout patterns...",
  "Structuring components...",
  "Generating responsive views...",
  "Fine-tuning visual elements...",
  "Completing preview generation...",
  "Almost there, perfecting details...",
  "Processing design tokens...",
  "Building component hierarchy...",
  "Applying responsive breakpoints...",
  "Generating hover states...",
  "Setting up interactions...",
  "Rendering shadow effects...",
  "Processing color palette...",
  "Building navigation structure...",
  "Finalizing button states...",
  "Applying micro-animations...",
  "Setting up form elements...",
  "Building card layouts...",
  "Processing image placements...",
  "Finalizing typography...",
  "Setting up grid system...",
  "Almost ready for preview...",
  "Completing UI assembly...",
  "Running final validation...",
  "Preview nearly complete...",
  "Just a moment more...",
];

// Messages for updating an existing project
const STREAMING_MESSAGES_UPDATE = [
  "Updating your project...",
  "Applying your changes...",
  "Refining the design...",
  "Integrating modifications...",
  "Enhancing the layout...",
  "Processing updates...",
  "Optimizing components...",
  "Polishing the result...",
  "Fine-tuning details...",
  "Completing the update...",
  "Merging your changes...",
  "Updating visual elements...",
  "Syncing modifications...",
  "Applying style updates...",
  "Almost done updating...",
];

const STREAMING_MESSAGES_CODE = [
  "Analyzing video structure...",
  "Extracting component patterns...",
  "Generating semantic HTML...",
  "Writing Tailwind classes...",
  "Structuring responsive code...",
  "Adding interactivity logic...",
  "Implementing animations...",
  "Optimizing for performance...",
  "Cleaning up code output...",
  "Finalizing code generation...",
  "Building component hierarchy...",
  "Processing UI patterns...",
  "Generating styled components...",
  "Adding responsive breakpoints...",
  "Implementing hover states...",
  "Creating animation keyframes...",
  "Structuring CSS modules...",
  "Optimizing bundle size...",
  "Validating HTML structure...",
  "Completing code generation...",
  "Processing component props...",
  "Building state management...",
  "Adding event handlers...",
  "Generating utility functions...",
  "Creating reusable hooks...",
  "Setting up component exports...",
  "Building layout system...",
  "Processing grid structure...",
  "Generating flex containers...",
  "Adding accessibility attributes...",
  "Creating form handlers...",
  "Building navigation logic...",
  "Processing image components...",
  "Adding loading states...",
  "Creating error boundaries...",
  "Building modal components...",
  "Processing dropdown menus...",
  "Almost finished coding...",
  "Running final code checks...",
  "Code generation nearly done...",
];

const STREAMING_MESSAGES_FLOW = [
  "Mapping user journey...",
  "Detecting navigation paths...",
  "Identifying entry points...",
  "Building flow topology...",
  "Connecting interaction nodes...",
  "Analyzing transition logic...",
  "Structuring product map...",
  "Detecting possible routes...",
  "Finalizing flow architecture...",
  "Preparing canvas render...",
  "Mapping screen transitions...",
  "Building navigation graph...",
  "Identifying user paths...",
  "Connecting UI states...",
  "Processing flow nodes...",
  "Generating edge connections...",
  "Analyzing page hierarchy...",
  "Building interaction map...",
  "Completing flow diagram...",
  "Rendering flow canvas...",
  "Analyzing click patterns...",
  "Detecting scroll behaviors...",
  "Mapping hover interactions...",
  "Building state transitions...",
  "Processing conditional flows...",
  "Generating decision trees...",
  "Analyzing user choices...",
  "Building branching logic...",
  "Processing parallel paths...",
  "Detecting loop patterns...",
  "Mapping exit points...",
  "Building entry conditions...",
  "Processing user triggers...",
  "Generating flow metadata...",
  "Building canvas layout...",
  "Positioning flow nodes...",
  "Calculating edge paths...",
  "Almost done with flow...",
  "Finalizing flow structure...",
  "Flow generation complete soon...",
];

const STREAMING_MESSAGES_DESIGN = [
  "Extracting color palette...",
  "Analyzing typography system...",
  "Detecting spacing patterns...",
  "Building design tokens...",
  "Mapping component styles...",
  "Identifying visual patterns...",
  "Structuring design system...",
  "Analyzing border & shadow...",
  "Finalizing style extraction...",
  "Preparing design overview...",
  "Processing color values...",
  "Detecting font families...",
  "Mapping spacing scale...",
  "Building shadow tokens...",
  "Analyzing radius patterns...",
  "Extracting gradient styles...",
  "Processing animation curves...",
  "Generating style variables...",
  "Completing design tokens...",
  "Finalizing design system...",
  "Processing primary colors...",
  "Analyzing accent hues...",
  "Building color scales...",
  "Detecting contrast ratios...",
  "Processing font weights...",
  "Analyzing line heights...",
  "Building type scale...",
  "Processing letter spacing...",
  "Detecting icon styles...",
  "Analyzing button styles...",
  "Processing input styles...",
  "Building card patterns...",
  "Detecting hover effects...",
  "Analyzing focus states...",
  "Processing active states...",
  "Building state tokens...",
  "Almost done with design...",
  "Finalizing design tokens...",
  "Design system nearly ready...",
  "Completing style analysis...",
];

// Default messages (used for general loading)
const STREAMING_MESSAGES = [
  "Scanning video frames...",
  "Extracting visual information...",
  "Identifying components...",
  "Detecting UI elements...",
  "Mapping interactions...",
  "Understanding transitions...",
  "Processing with Gemini AI...",
  "Generating optimized code...",
  "Applying style preferences...",
  "Finalizing output...",
  "Analyzing UI patterns...",
  "Processing visual data...",
  "Building component tree...",
  "Generating responsive layout...",
  "Adding interactivity...",
  "Optimizing performance...",
  "Cleaning up output...",
  "Validating structure...",
  "Completing generation...",
  "Almost done...",
  "Analyzing video content...",
  "Processing user interactions...",
  "Detecting click patterns...",
  "Mapping scroll behavior...",
  "Building hover states...",
  "Processing form elements...",
  "Generating button styles...",
  "Creating navigation logic...",
  "Building page structure...",
  "Processing image assets...",
  "Generating icon elements...",
  "Creating card components...",
  "Building modal dialogs...",
  "Processing dropdown menus...",
  "Generating list items...",
  "Creating table structures...",
  "Building footer elements...",
  "Processing header components...",
  "Almost finished generating...",
  "Just a few more seconds...",
];

// Tips & Tricks shown during generation - technical, monospace style (NO "TIP:" prefix!)
const GENERATION_TIPS = [
  "Click, don't just watch. Interacting helps the engine differentiate functional elements from static containers.",
  "Cursor movement matters. Slow down over interactive elements to help us capture hover states accurately.",
  "Context is King. Providing specific context clues (e.g., 'Admin Dashboard') improves component density and typography.",
  "Don't be afraid to scroll. Replay can reconstruct long pages—just scroll slowly to ensure every section is captured.",
  "Use 'Edit with AI' after generation to refine specific parts — like 'make the button bigger' or 'add hover effect'.",
  "Record interactions, not just static views. Clicking, hovering, and scrolling help AI understand your UI better.",
  "Style injection is powerful. Specify 'Apple-style' or 'Linear dark mode' for consistent design language.",
  "Shorter videos often work better. Focus on one flow or feature at a time for more accurate results.",
  "Select a style preset before generating to match your design system — or use Auto-Detect to match the video.",
  "After generation, check the Flow Map tab to see how Replay understood your UI's navigation structure.",
  "Use 'Componentized' mode in the Code tab to get organized, production-ready component files.",
  "Replay extracts colors, fonts, and spacing into a reusable design system — check the Design tab.",
  "Show hover states in your video — Replay will recreate them with smooth CSS transitions.",
];

const LogoIcon = ({ className, color = "currentColor" }: { className?: string; color?: string }) => (
  <svg className={className} viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke={color} strokeWidth="11.6182" strokeLinejoin="round"/>
    <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" fill={color}/>
  </svg>
);

const getNodeIcon = (type: string) => {
  switch (type) {
    case "page": return Layout;
    case "component": return Box;
    case "section": return Layers;
    case "element": return Type;
    case "interactive": return MousePointer;
    default: return Box;
  }
};

// Function to analyze what changed between two code versions - HUMAN STYLE
const analyzeCodeChanges = (oldCode: string, newCode: string, userRequest: string): string => {
  const insights: string[] = [];
  const requestLower = userRequest.toLowerCase();
  
  // Detect the TYPE of change and respond appropriately
  const isAnimation = requestLower.includes('animat') || requestLower.includes('transition') || requestLower.includes('smooth') || requestLower.includes('fade') || requestLower.includes('płynn');
  const isResponsive = requestLower.includes('mobile') || requestLower.includes('responsive') || requestLower.includes('tablet') || requestLower.includes('telefon') || requestLower.includes('komórk');
  const isLayout = requestLower.includes('layout') || requestLower.includes('grid') || requestLower.includes('flex') || requestLower.includes('spacing') || requestLower.includes('odstęp') || requestLower.includes('układ');
  const isColors = requestLower.includes('color') || requestLower.includes('kolor') || requestLower.includes('theme') || requestLower.includes('dark') || requestLower.includes('ciemn') || requestLower.includes('jasn');
  const isButtons = requestLower.includes('button') || requestLower.includes('przycisk') || requestLower.includes('cta') || requestLower.includes('klik');
  const isNav = requestLower.includes('nav') || requestLower.includes('menu') || requestLower.includes('header') || requestLower.includes('sidebar') || requestLower.includes('nagłów');
  const isFix = requestLower.includes('fix') || requestLower.includes('napraw') || requestLower.includes('bug') || requestLower.includes('błąd') || requestLower.includes('zepsu') || requestLower.includes('wrong');
  const isAdd = requestLower.includes('add') || requestLower.includes('dodaj') || requestLower.includes('missing') || requestLower.includes('brakuj') || requestLower.includes('potrzeb');
  
  // Check for specific technical changes
  const addedTailwind = (newCode.match(/class="[^"]*(?:flex|grid|gap-|p-|m-|text-|bg-|rounded)/g) || []).length > (oldCode.match(/class="[^"]*(?:flex|grid|gap-|p-|m-|text-|bg-|rounded)/g) || []).length;
  const addedAnimations = (newCode.match(/@keyframes|animation:|transition:|animate-/g) || []).length > (oldCode.match(/@keyframes|animation:|transition:|animate-/g) || []).length;
  const addedAlpine = (newCode.match(/x-data|x-show|x-on:|@click/g) || []).length > (oldCode.match(/x-data|x-show|x-on:|@click/g) || []).length;
  const addedMedia = (newCode.match(/@media|sm:|md:|lg:|xl:/g) || []).length > (oldCode.match(/@media|sm:|md:|lg:|xl:/g) || []).length;
  const addedBackdrop = newCode.includes('backdrop-blur') && !oldCode.includes('backdrop-blur');
  const addedGradient = (newCode.match(/gradient/g) || []).length > (oldCode.match(/gradient/g) || []).length;
  
  // Build conversational response based on context - PROSTE, PO POLSKU
  if (isAnimation && addedAnimations) {
    insights.push("Dodałem płynne animacje ✨");
  } else if (isAnimation) {
    insights.push("Poprawiłem animacje - teraz są płynniejsze");
  }
  
  if (isResponsive || addedMedia) {
    insights.push("Dodałem responsywność - działa na mobile 📱");
  }
  
  if (isLayout && addedTailwind) {
    insights.push("Naprawiłem układ - lepsze odstępy");
  }
  
  if (isColors || addedGradient) {
    insights.push("Zmieniłem kolory 🎨");
  }
  
  if (isButtons) {
    insights.push("Ulepszyłem przyciski");
  }
  
  if (isNav) {
    insights.push("Rozbudowałem nawigację");
  }
  
  if (addedAlpine && !isNav) {
    insights.push("Dodałem interaktywność");
  }
  
  if (addedBackdrop) {
    insights.push("Dodałem efekt szkła");
  }
  
  if (isFix) {
    insights.push("Naprawione! 🔧");
  }
  
  if (isAdd && insights.length === 0) {
    insights.push("Dodane!");
  }
  
  // If no specific insights, provide a generic but still human response
  if (insights.length === 0) {
    insights.push("Gotowe! Sprawdź preview 👀");
  }
  
  // Always add "Preview updated"
  insights.push("Preview updated - take a look!");
  
  // Build the response
  let response = `**Done!** \n\n`;
  insights.forEach(insight => {
    response += `• ${insight}\n`;
  });
  
  return response;
};

function ReplayToolContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { pending, setPending, clearPending } = usePendingFlow();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { totalCredits: userTotalCredits, wallet, membership, canAfford, refreshCredits, isLoading: creditsLoading } = useCredits();
  const { profile } = useProfile();
  const { toast, showToast, hideToast } = useToast();
  
  // MOBILE HARD FORK - Mobile users get completely different app
  const isMobile = useIsMobile();
  
  // Job-based generation for mobile (recoverable when screen turns off)
  const { jobState, startJob, recoverPendingJob, resetJob, isJobActive } = useGenerationJob();
  
  // Demo mode state - for cached demo results
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  // Demo project IDs that should NOT be saved to user's account
  const DEMO_PROJECT_IDS = useMemo(() => new Set([
    "flow_1767827812458_823lpezg8", // dashboard - UBOLD Premium Admin
    "flow_1767826711350_55giwb69y", // yc - Y Combinator
    "flow_1767812494307_4c540djzy", // landing - Flooks
  ]), []);
  
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const hasRestoredFlowsRef = useRef(false);
  // Map of style IDs to their full names (for converting Settings preferences)
  const STYLE_ID_TO_NAME: Record<string, string> = {
    "auto-detect": "",
    "custom": "",
    "aura-glass": "High-End Dark Glass",
    "void-spotlight": "Void Spotlight",
    "dark-cosmos": "Dark Cosmos",
    "linear": "Linear",
    "liquid-chrome": "Liquid Chrome",
    "molten-aurora": "Molten Aurora SaaS",
    "midnight-aurora": "Midnight Aurora",
    "glass-cascade": "Glass Blue Tech",
    "glowframe-product": "Dark Product Glowframe",
    "swiss-grid": "Swiss Grid",
    "soft-organic": "Soft Organic",
    "silent-luxury": "Silent Luxury",
    "ethereal-mesh": "Ethereal Mesh",
    "glassmorphism": "Glassmorphism",
    "neubrutalism": "Neo-Brutalism",
    "kinetic-brutalism": "Kinetic Brutalism",
    "spatial-glass": "Spatial Glass",
    "particle-brain": "Particle Brain",
    "old-money": "Old Money Heritage",
    "tactical-hud": "Tactical HUD",
    "urban-grunge": "Urban Grunge",
    "ink-zen": "Ink & Zen",
    "infinite-tunnel": "Infinite Tunnel",
    "frosted-acrylic": "Frosted Acrylic",
    "datamosh": "Datamosh Glitch",
    "origami-fold": "Origami Fold",
    "gravity-physics": "Gravity Physics",
    "neo-retro-os": "Neo-Retro OS",
    "soft-clay-pop": "Soft Clay Pop",
    "deconstructed-editorial": "Deconstructed Editorial",
    "cinematic-product": "Cinematic Product",
    "digital-collage": "Digital Collage",
    "halftone-beam": "Halftone Solar Beam",
    "mono-wave": "Monochrome Wave",
    "fractured-grid": "Fractured Grid",
    "matrix-rain": "Matrix Rain",
    "xray-blueprint": "X-Ray Blueprint",
    "opposing-scroll": "Opposing Scroll",
    "stacked-cards": "Stacked Card Deck",
    "horizontal-inertia": "Horizontal Inertia",
    "split-curtain": "Split Curtain Reveal",
    "phantom-border": "Phantom Border UI",
    "inverted-lens": "Inverted Lens Cursor",
    "elastic-sidebar": "Elastic Sidebar",
    "morphing-nav": "Morphing Fluid Nav",
    "liquid-neon": "Liquid Neon",
    "chromatic-dispersion": "Chromatic Dispersion",
    "viscous-hover": "Viscous Hover",
    "globe-data": "Interactive Globe",
    "liquid-text-mask": "Liquid Text Masking",
    "noise-gradient": "Dynamic Noise Gradient",
    "fluid-prismatic": "Fluid Prismatic",
    "paper-shader-mesh": "Paper Shader Mesh",
    "gradient-bar-waitlist": "Gradient Bar Waitlist",
    "earthy-grid-reveal": "Earthy Grid Reveal",
    "gyroscopic-levitation": "Gyroscopic Levitation",
    "exploded-view": "Exploded View Scroll",
    "skeuomorphic": "Skeuomorphic Controls",
    "messy-physics": "Messy Colorful Physics",
    "apple": "Apple Style",
    "stripe": "Stripe Design",
    "vercel": "Vercel",
    "live-dashboard": "Live Dashboard",
    "crt-noise": "CRT Signal Noise",
    "airy-blue-aura": "Airy Blue Aura",
    "blur-hero-minimal": "Blur Hero Minimal",
    "myna-ai-mono": "Myna AI Mono",
    "acme-clean-rounded": "Acme Clean Rounded",
    "deadpan-documentation": "Deadpan Documentation",
    "bureaucratic-void": "Bureaucratic Void",
    "cctv-drift": "CCTV Drift",
    "abrupt-termination": "Abrupt Termination",
    "indifferent-kinetic": "Indifferent Kinetic",
    "inefficient-loop": "Inefficient Loop",
    "accidental-capture": "Accidental Capture",
    "biomimetic-organic": "Biomimetic Organic",
    "generative-ascii": "Generative ASCII",
    "cinematic-portals": "Cinematic Portals",
    "typographic-architecture": "Typographic Architecture",
  };
  
  // Helper function to get default style name from localStorage
  const getDefaultStyleName = () => {
    if (typeof window === 'undefined') return "";
    const defaultPreset = localStorage.getItem("replay_default_style_preset");
    if (!defaultPreset || defaultPreset === "auto-detect") return "";
    return STYLE_ID_TO_NAME[defaultPreset] || "";
  };
  
  const [styleDirective, setStyleDirective] = useState(() => {
    return getDefaultStyleName();
  });
  const [styleReferenceImage, setStyleReferenceImage] = useState<{ url: string; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);
  const [isMobileScanning, setIsMobileScanning] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [displayedCode, setDisplayedCode] = useState<string>("");
  const [editableCode, setEditableCode] = useState<string>("");
  const [isCodeEditable, setIsCodeEditable] = useState(false);
  const [isStreamingCode, setIsStreamingCode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  // const [showUserMenu, setShowUserMenu] = useState(false); // Removed in favor of direct link
  // streamingMessage state removed - loading handled in LoadingState component
  const [generationSessionId, setGenerationSessionId] = useState<string | null>(null); // Track current generation to hide old content
  
  // Auth/Credits modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasShownFeedback, setHasShownFeedback] = useState(false);
  
  // Flow node edit/delete modal
  const [flowNodeModal, setFlowNodeModal] = useState<{
    type: "rename" | "delete";
    nodeId: string;
    nodeName: string;
  } | null>(null);
  const [flowNodeRenameValue, setFlowNodeRenameValue] = useState("");
  
  // Upgrade modal for FREE users
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<"code" | "download" | "publish" | "supabase" | "general">("general");
  const [isUpgradeCheckingOut, setIsUpgradeCheckingOut] = useState(false);
  
  // Default Pro tier ($25/mo) for direct checkout
  const DEFAULT_PRO_PRICE_ID = "price_1SotL1Axch1s4iBGWMvO0JBZ";
  const DEFAULT_PRO_TIER_ID = "pro25";
  const DEFAULT_PRO_CREDITS = 1500;
  
  // Handler for direct checkout (used in inline upgrade buttons)
  const handleUpgradeCheckout = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    setIsUpgradeCheckingOut(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          priceId: DEFAULT_PRO_PRICE_ID,
          tierId: DEFAULT_PRO_TIER_ID,
          credits: DEFAULT_PRO_CREDITS,
          interval: "monthly"
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.error) {
        console.error("Checkout error:", data.error);
        showToast("Failed to start checkout: " + data.error, "error");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      showToast("Failed to start checkout. Please try again.", "error");
    } finally {
      setIsUpgradeCheckingOut(false);
    }
  };
  
  // Check if user has paid plan (PRO or higher)
  const isPaidPlan = membership?.plan === "pro" || membership?.plan === "agency" || membership?.plan === "enterprise";
  const [pendingAction, setPendingAction] = useState<"generate" | "edit" | null>(null);
  const [analysisDescription, setAnalysisDescription] = useState<string>("");
  const [editInput, setEditInput] = useState("");
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [isPointAndEdit, setIsPointAndEdit] = useState(false);
  const [refinements, setRefinements] = useState("");
  const [contextImages, setContextImages] = useState<{ id: string; url: string; name: string; uploading?: boolean }[]>([]);
  const [analysisSection, setAnalysisSection] = useState<"style" | "layout" | "components">("style");
  const contextImageInputRef = useRef<HTMLInputElement>(null);
  
  // Mobile state - input visible by default, chat after generation
  const [mobilePanel, setMobilePanel] = useState<"input" | "preview" | "code" | "flow" | "design" | "chat" | null>("input");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  
  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);
  
  const [showMobileBanner, setShowMobileBanner] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("replay_mobile_banner_dismissed") !== "true";
    }
    return true;
  });
  
  // Mobile Project Synced modal - shows after generation on mobile
  const [showMobileSyncModal, setShowMobileSyncModal] = useState(false);
  
  // Live analysis state for "Matrix" view
  interface AnalysisPhase {
    palette: string[];
    typography: string;
    vibe: string;
    layout: string;
    container: string;
    responsive: string;
    components: { name: string; status: "waiting" | "generating" | "done" }[];
    stats?: { tech: string; componentCount: number; imageCount: number; theme: string };
    // UX Signals - Technical analysis tags
    uxSignals?: UXSignal[];
    // Component tree structure (hierarchical)
    structureItems?: { name: string; status: "waiting" | "generating" | "done" }[];
    componentTree?: ComponentTreeNode[];
    // Detected data patterns for database connections
    dataPatterns?: { pattern: string; component: string; suggestedTable?: string }[];
  }
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase | null>(null);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  
  // Flow state = PRODUCT MAP (canvas with nodes/edges)
  const [flowNodes, setFlowNodes] = useState<ProductFlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<ProductFlowEdge[]>([]);
  const [flowBuilding, setFlowBuilding] = useState(false);
  const [selectedFlowNode, setSelectedFlowNode] = useState<string | null>(null);
  const [showStructureInFlow, setShowStructureInFlow] = useState(false); // Toggle to show components under nodes
  const [showPossiblePaths, setShowPossiblePaths] = useState(true); // Toggle to show/hide possible paths in Flow
  const [generationComplete, setGenerationComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showFloatingEdit, setShowFloatingEdit] = useState(false);
  const [editImages, setEditImages] = useState<{ id: string; url: string; name: string; file?: File; uploading?: boolean }[]>([]);
  const [architecture, setArchitecture] = useState<ArchNode[]>([]);
  const [archBuilding, setArchBuilding] = useState(false);
  const [selectedArchNode, setSelectedArchNode] = useState<string | null>(null);
  const [styleInfo, setStyleInfo] = useState<StyleInfo | null>(null);
  const [archZoom, setArchZoom] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedNodeModal, setSelectedNodeModal] = useState<ArchNode | null>(null);
  
  // Generation history for persistence  
  const [generations, setGenerations] = useState<GenerationRecord[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true); // Show loading until first Supabase fetch
  const [activeGeneration, setActiveGeneration] = useState<GenerationRecord | null>(null);
  const [generationTitle, setGenerationTitle] = useState<string>("Untitled Project");
  // Initialize showHistoryMode from URL params (works with SSR since searchParams is available)
  const [showHistoryMode, setShowHistoryMode] = useState(() => {
    // Check URL params first (most reliable, available during SSR via searchParams)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('projects') === 'true') {
        return true;
      }
      // Also check localStorage as fallback
      const openFromStorage = localStorage.getItem("replay_open_projects");
      if (openFromStorage === "true") {
        localStorage.removeItem("replay_open_projects");
        return true;
      }
    }
    return false;
  });
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  const [historyMenuOpen, setHistoryMenuOpen] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [expandedVersions, setExpandedVersions] = useState<string | null>(null); // Which generation's versions are shown
  
  // Agentic Chat Sidebar
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>("config");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("chat");
  const [sidebarView, setSidebarView] = useState<SidebarView>("detail"); // projects list vs detail view
  const [projectMenuOpen, setProjectMenuOpen] = useState<string | null>(null); // context menu for projects
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [isPlanMode, setIsPlanMode] = useState(false); // Plan mode - discuss without executing
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null); // Streaming status message
  const [streamingCode, setStreamingCode] = useState<string | null>(null); // Code being streamed
  const [streamingLines, setStreamingLines] = useState<number>(0); // Number of lines being written
  
  // Publishing state
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  
  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState<string>("");
  
  // Direct text editing mode (like Framer)
  const [isDirectEditMode, setIsDirectEditMode] = useState(false);
  const [pendingTextEdits, setPendingTextEdits] = useState<{ originalText: string; newText: string; elementPath: string }[]>([]);
  
  // Dragging state for flow nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  
  // Code tab state - Single-file vs Componentized mode
  const [codeMode, setCodeMode] = useState<CodeMode>("single-file");
  const [generatedFiles, setGeneratedFiles] = useState<FileNode[]>([]);
  const [activeFilePath, setActiveFilePath] = useState<string>("/pages/index.html");
  const [generatingFilePath, setGeneratingFilePath] = useState<string | null>(null); // Track which file is being generated
  const [codeReferenceMap, setCodeReferenceMap] = useState<CodeReferenceMap[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["/pages", "/components"]));
  
  // Agent Mode - Enhanced code with AI context for Cursor/v0
  const [agentMode, setAgentMode] = useState(false);
  const [showCopyDropdown, setShowCopyDropdown] = useState(false);
  const [highlightedLines, setHighlightedLines] = useState<{ start: number; end: number } | null>(null);
  
  // Canvas pan state for architecture - start centered
  const [canvasPan, setCanvasPan] = useState({ x: -200, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const archCanvasRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const previewIframeRef = useRef<HTMLIFrameElement>(null);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDraggingTrim, setIsDraggingTrim] = useState<"start" | "end" | null>(null);
  const [trimPreviewTime, setTrimPreviewTime] = useState<number | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const trimBarRef = useRef<HTMLDivElement>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const completionAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Pre-load completion audio and request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Pre-load audio
      const audio = new Audio("/finish.mp3");
      audio.volume = 1.0;
      audio.preload = "auto";
      audio.load();
      completionAudioRef.current = audio;
      
      // Request notification permission for background tab alerts
      if ('Notification' in window && Notification.permission === 'default') {
        // Request permission when user interacts (deferred)
        const requestPermission = () => {
          Notification.requestPermission();
          document.removeEventListener('click', requestPermission);
        };
        document.addEventListener('click', requestPermission, { once: true });
      }
    }
  }, []);

  const selectedFlow = flows.find(f => f.id === selectedFlowId);

  // Regenerate thumbnail from video URL (for restored flows)
  const regenerateThumbnail = useCallback(async (flowId: string, videoUrl: string) => {
    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.preload = "metadata";
      video.muted = true;
      
      video.onloadeddata = () => {
        video.currentTime = 0.5; // Seek to get a good frame
      };
      
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          const vw = video.videoWidth || 640;
          const vh = video.videoHeight || 360;
          canvas.width = 320; // Higher quality thumbnail
          canvas.height = Math.round((320 / vw) * vh) || 180;
          const ctx = canvas.getContext("2d");
          if (ctx && vw > 0 && vh > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            if (dataUrl.length > 1000) {
              setFlows(prev => prev.map(f => 
                f.id === flowId ? { ...f, thumbnail: dataUrl } : f
              ));
            }
          }
        } catch (e) {
          console.error("Failed to regenerate thumbnail:", e);
        }
      };
      
      video.src = videoUrl;
      video.load();
    } catch (e) {
      console.error("Failed to load video for thumbnail:", e);
    }
  }, []);

  // Get suggestions for @ mentions
  const getSuggestions = () => {
    if (!editInput.includes("@")) return [];
    const lastAt = editInput.lastIndexOf("@");
    const query = editInput.slice(lastAt + 1).toLowerCase();
    return architecture.filter(node => 
      node.id.toLowerCase().includes(query) || 
      node.name.toLowerCase().includes(query)
    ).slice(0, 5);
  };

  const suggestions = getSuggestions();

  // Show suggestions when typing @
  useEffect(() => {
    setShowSuggestions(editInput.includes("@") && suggestions.length > 0 && showFloatingEdit);
  }, [editInput, suggestions.length, showFloatingEdit]);

  // Get messages based on current tab
  const getStreamingMessages = useCallback(() => {
    switch (viewMode) {
      case "preview": return STREAMING_MESSAGES_PREVIEW;
      case "code": return STREAMING_MESSAGES_CODE;
      case "flow": return STREAMING_MESSAGES_FLOW;
      case "design": return STREAMING_MESSAGES_DESIGN;
      default: return STREAMING_MESSAGES;
    }
  }, [viewMode]);

  // Get messages based on mobile panel
  const getMobileStreamingMessages = useCallback(() => {
    switch (mobilePanel) {
      case "preview": return STREAMING_MESSAGES_PREVIEW;
      case "code": return STREAMING_MESSAGES_CODE;
      case "flow": return STREAMING_MESSAGES_FLOW;
      case "design": return STREAMING_MESSAGES_DESIGN;
      default: return STREAMING_MESSAGES;
    }
  }, [mobilePanel]);

  // Track if we have pending code to show (generation finished while tab was hidden)
  const pendingCodeRef = useRef<string | null>(null);
  const streamingCompleteRef = useRef(false);
  const generationStartTimeRef = useRef<number | null>(null);
  
  // Max generation time (6 minutes on mobile, 4 on desktop) - after this, consider it stuck/failed
  const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const MAX_GENERATION_TIME_MS = isMobileDevice ? 6 * 60 * 1000 : 4 * 60 * 1000;
  
  // Complete generation and show results
  const completeGeneration = useCallback((code: string) => {
    if (streamingCompleteRef.current) return;
    streamingCompleteRef.current = true;
    pendingCodeRef.current = null;
    generationStartTimeRef.current = null;
    
    console.log("Completing generation - showing result immediately");
    
    // Play notification sound and show browser notification if tab is hidden
    try {
      const soundEnabled = localStorage.getItem("replay_sound_on_complete");
      const isTabHidden = typeof document !== 'undefined' && document.hidden;
      
      // Show browser notification if tab is hidden (works in background!)
      if (isTabHidden && 'Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Replay - Generation Complete! 🎉', {
          body: 'Your interface is ready. Click to view.',
          icon: '/favicon.ico',
          tag: 'replay-generation-complete',
          requireInteraction: true // Keep notification visible until clicked
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      
      // Play sound (may not work in background tab, but notification will)
      if (soundEnabled !== "false") {
        if (completionAudioRef.current) {
          completionAudioRef.current.currentTime = 0;
          completionAudioRef.current.play().catch((err) => {
            console.log("Audio play failed (likely background tab):", err);
          });
        } else {
          const audio = new Audio("/finish.mp3");
          audio.volume = 1.0;
          audio.play().catch(() => {});
        }
      }
    } catch (e) { 
      console.log("Notification/Audio error:", e);
    }
    
    // Track successful generation (FB Pixel + CAPI)
    trackViewContent("Generation Complete", user?.id);
    
    setDisplayedCode(code);
    setEditableCode(code);
    setIsStreamingCode(false);
    setIsProcessing(false);
    setGenerationComplete(true);
    setViewMode("preview");
    
    // Clear streaming state
    setStreamingStatus(null);
    setStreamingCode(null);
    setStreamingLines(0);
    
    // Mark all components as done
    setAnalysisPhase(prev => prev ? {
      ...prev,
      components: prev.components.map(c => ({ ...c, status: "done" as const }))
    } : prev);
    
    // Auto-switch to preview on mobile and show sync modal
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setMobilePanel("preview");
      setShowMobileSyncModal(true);
    }
    
    // Generate description
    const description = generateAnalysisDescription(code, styleDirective);
    typeText(description, (typed) => setAnalysisDescription(typed), 15);
    
    // Update preview URL
    const blob = new Blob([code], { type: "text/html" });
    setPreviewUrl(URL.createObjectURL(blob));
    
    // 🚀 TRANSFORM SIDEBAR TO AGENTIC CHAT
    setSidebarMode("chat");
    setSidebarTab("chat");
    setMobilePanel("chat"); // Also switch mobile to chat
    setGenerationComplete(true); // Mark generation as complete to show chat view
    
    // Generate AI summary message
    const componentCount = (code.match(/<(?:div|section|header|footer|nav|aside|main|article)[^>]*>/gi) || []).length;
    const hasNav = /<nav/i.test(code);
    const hasHeader = /<header/i.test(code);
    const hasFooter = /<footer/i.test(code);
    const hasForms = /<form/i.test(code);
    const hasCards = /card/gi.test(code);
    
    const features: string[] = [];
    if (hasNav) features.push("Navigation");
    if (hasHeader) features.push("Header");
    if (hasFooter) features.push("Footer");
    if (hasForms) features.push("Forms");
    if (hasCards) features.push("Cards");
    
    // Build a more human description of what was built
    const techStack: string[] = ["Tailwind CSS"];
    if (hasNav) techStack.push("Alpine.js navigation");
    if (hasForms) techStack.push("form components");
    if (hasCards) techStack.push("card layouts");
    
    const summaryMessage: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: `**Boom. UI Reconstructed.** 🚀\n\nI focused on matching the exact layout and feel from your video. Used ${techStack.slice(0, 3).join(", ")} to keep it clean and maintainable.\n\n${features.length > 0 ? `**Key sections:** ${features.join(" • ")}\n\n` : ""}Ready to refine? Just tell me what to tweak.`,
      timestamp: Date.now(),
      quickActions: [
        "Make it mobile-friendly",
        "Tweak the colors",
        "Add hover effects",
        "Improve the spacing"
      ]
    };
    setChatMessages([summaryMessage]);
  }, [styleDirective]);
  
  // Reset stuck generation
  const resetStuckGeneration = useCallback(() => {
    console.log("Resetting stuck generation");
    setIsProcessing(false);
    setIsStreamingCode(false);
    generationStartTimeRef.current = null;
    pendingCodeRef.current = null;
    streamingCompleteRef.current = false;
    showToast("Generation timed out. Please try again.", "error");
  }, [showToast]);
  
  // Handle tab visibility change - show pending result, detect stuck generation, OR recover job
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        // Tab became visible
        
        // Check if we have pending code to show
        if (pendingCodeRef.current && !streamingCompleteRef.current) {
          console.log("Tab visible - showing pending generation result");
          completeGeneration(pendingCodeRef.current);
          return;
        }
        
        // Check for pending job recovery (mobile screen was off)
        const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobileDevice && !isProcessing && !generatedCode) {
          console.log("[Job Recovery] Tab visible on mobile - checking for pending job...");
          const recoveredJob = await recoverPendingJob();
          
          if (recoveredJob) {
            console.log("[Job Recovery] Found job:", recoveredJob.status);
            
            if (recoveredJob.status === "complete" && recoveredJob.code) {
              console.log("[Job Recovery] Job completed while away - showing result!");
              showToast("Generation completed! Showing your result.", "success");
              completeGeneration(recoveredJob.code);
              return;
            } else if (recoveredJob.status === "processing" || recoveredJob.status === "pending") {
              // Job still running - show loading state
              setIsProcessing(true);
              generationStartTimeRef.current = Date.now();
              showToast("Generation still in progress...", "info");
            } else if (recoveredJob.status === "failed") {
              showToast(recoveredJob.error || "Generation failed. Please try again.", "error");
            }
          }
        }
        
        // Check if generation is stuck (running too long)
        if (generationStartTimeRef.current && isProcessing) {
          const elapsedTime = Date.now() - generationStartTimeRef.current;
          console.log("Tab visible - checking generation status, elapsed:", elapsedTime / 1000, "s");
          
          if (elapsedTime > MAX_GENERATION_TIME_MS) {
            console.log("Generation stuck - elapsed time exceeds max");
            resetStuckGeneration();
          }
        }
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [completeGeneration, resetStuckGeneration, isProcessing, recoverPendingJob, generatedCode, showToast]);
  
  // Auto-timeout for stuck generations (runs every 30s)
  useEffect(() => {
    if (!isProcessing || !generationStartTimeRef.current) return;
    
    const checkInterval = setInterval(() => {
      if (generationStartTimeRef.current) {
        const elapsed = Date.now() - generationStartTimeRef.current;
        if (elapsed > MAX_GENERATION_TIME_MS) {
          console.log("Generation timeout - auto-resetting");
          resetStuckGeneration();
        }
      }
    }, 30000); // Check every 30 seconds
    
    return () => clearInterval(checkInterval);
  }, [isProcessing, resetStuckGeneration]);
  
  // Handle job state changes from polling (mobile job recovery)
  useEffect(() => {
    if (jobState.status === "complete" && jobState.code && isProcessing) {
      console.log("[Job Polling] Job completed via polling - showing result!");
      completeGeneration(jobState.code);
      resetJob();
    } else if (jobState.status === "failed" && isProcessing) {
      console.log("[Job Polling] Job failed via polling:", jobState.error);
      showToast(jobState.error || "Generation failed. Please try again.", "error");
      setIsProcessing(false);
      generationStartTimeRef.current = null;
      resetJob();
    }
  }, [jobState.status, jobState.code, jobState.error, isProcessing, completeGeneration, resetJob, showToast]);
  
  // Initial job recovery check on mobile page load
  useEffect(() => {
    const isMobileDevice = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobileDevice) return;
    
    const checkPendingJob = async () => {
      console.log("[Job Recovery] Checking for pending job on page load...");
      const recoveredJob = await recoverPendingJob();
      
      if (recoveredJob) {
        console.log("[Job Recovery] Found pending job on load:", recoveredJob.status);
        
        if (recoveredJob.status === "complete" && recoveredJob.code) {
          console.log("[Job Recovery] Job was completed - showing result!");
          showToast("Found completed generation! Showing your result.", "success");
          completeGeneration(recoveredJob.code);
        } else if (recoveredJob.status === "processing" || recoveredJob.status === "pending") {
          // Job still running - show loading state and poll
          setIsProcessing(true);
          generationStartTimeRef.current = Date.now();
          showToast("Resuming generation in progress...", "info");
        }
      }
    };
    
    // Slight delay to let the page initialize
    const timeoutId = setTimeout(checkPendingJob, 500);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Load demo from API if ?demo= parameter is present (instant load, no AI cost!)
  useEffect(() => {
    const demoId = searchParams.get('demo');
    if (demoId && !hasLoadedFromStorage) {
      console.log("Loading demo from API:", demoId);
      
      // Fetch demo data from API
      fetch(`/api/demo/${demoId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.generation) {
            const gen = data.generation;
            console.log("Demo loaded successfully:", gen.title);
            
            setIsDemoMode(true);
            setGeneratedCode(gen.code);
            setDisplayedCode(gen.code);
            setEditableCode(gen.code);
            setGenerationTitle(gen.title);
            setGenerationComplete(true);
            setSidebarMode("chat");
            
            // Load flow data
            if (gen.flowNodes?.length > 0) {
              setFlowNodes(gen.flowNodes);
            }
            if (gen.flowEdges?.length > 0) {
              setFlowEdges(gen.flowEdges);
            }
            
            // Load design system / style info
            if (gen.styleInfo) {
              setStyleInfo(gen.styleInfo);
            }
            
            // Load style directive
            if (gen.styleDirective) {
              setStyleDirective(gen.styleDirective);
            }
            
            // Load video input to show in sidebar and Input tab
            if (gen.videoUrl) {
              const demoFlowId = `demo_${demoId}`;
              // Create a demo flow item to show video was used
              setFlows([{
                id: demoFlowId,
                name: gen.title || "Demo Video",
                videoBlob: new Blob(), // Empty blob for demo
                videoUrl: gen.videoUrl,
                thumbnail: undefined,
                duration: 30, // Approximate
                trimStart: 0,
                trimEnd: 30,
              }]);
              setSelectedFlowId(demoFlowId);
              
              // Generate thumbnail from video URL
              regenerateThumbnail(demoFlowId, gen.videoUrl);
            }
            
            // Set activeGeneration so edits can be saved (for authenticated owners)
            const demoGeneration: GenerationRecord = {
              id: gen.id,
              title: gen.title,
              autoTitle: false,
              timestamp: gen.timestamp || Date.now(),
              status: "complete",
              code: gen.code,
              styleDirective: gen.styleDirective || "",
              refinements: gen.refinements || "",
              flowNodes: gen.flowNodes || [],
              flowEdges: gen.flowEdges || [],
              styleInfo: gen.styleInfo,
              videoUrl: gen.videoUrl,
              versions: gen.versions || [],
              publishedSlug: gen.publishedSlug,
            };
            setActiveGeneration(demoGeneration);
            setGenerations([demoGeneration]);
            
            // Add welcome message in chat explaining this is a real demo
            setChatMessages([{
              id: `demo_welcome_${Date.now()}`,
              role: "assistant",
              content: `🎬 **This is a real Replay generation!**

This UI was reconstructed entirely from a screen recording using Replay's AI.

**What you're seeing:**
• Pixel-perfect layout extracted from video
• All text content via OCR
• Interactive components with Alpine.js
• Responsive design with Tailwind CSS
• Flow map showing detected navigation

**Try it yourself:**
1. Click tabs above to explore Code, Flow, Design System
2. Sign up free to upload your own video
3. Get 1 free generation - no credit card required!

*Ready to reconstruct your own interfaces?*`,
              timestamp: Date.now()
            }]);
            
            // Create blob URL for preview
            const blob = new Blob([gen.code], { type: "text/html" });
            setPreviewUrl(URL.createObjectURL(blob));
            
            // On mobile, show preview tab immediately
            setMobilePanel("preview");
            
            // Show toast - better formatted
            showToast("Demo loaded!\nSign up free to generate your own projects.", "info");
            
            setHasLoadedFromStorage(true);
          } else {
            console.error("Failed to load demo:", data.error);
            showToast("Demo not available yet. Try generating your own!", "error");
          }
        })
        .catch(err => {
          console.error("Error loading demo:", err);
          showToast("Failed to load demo.", "error");
        });
    }
  }, [searchParams, hasLoadedFromStorage, showToast, regenerateThumbnail]);

  // Handle ?projects=true URL param - set history mode and clean up URL
  useEffect(() => {
    const openProjects = searchParams.get('projects');
    if (openProjects === 'true') {
      // Ensure history mode is open
      if (!showHistoryMode) {
        setShowHistoryMode(true);
      }
      // Clean up URL after state is set
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [searchParams, showHistoryMode]);

  // When new code arrives, either stream it or mark as pending
  useEffect(() => {
    if (!generatedCode || !isStreamingCode) return;
    
    // Reset completion flag for new generation
    streamingCompleteRef.current = false;
    
    // If tab is hidden, store as pending and complete immediately (state-wise)
    if (document.hidden) {
      console.log("Tab hidden - storing code as pending, will show when visible");
      pendingCodeRef.current = generatedCode;
      // Don't animate, just mark internally as ready
      // The visibility handler will show it when user returns
      return;
    }
    
    // Tab is visible - animate the streaming
    let index = 0;
    const chunkSize = 20;
    let lastTime = Date.now();
    
    const interval = setInterval(() => {
      if (streamingCompleteRef.current) {
        clearInterval(interval);
        return;
      }
      
      const now = Date.now();
      
      // If tab became hidden, store as pending and stop
      if (document.hidden) {
        console.log("Tab became hidden - storing pending code");
        pendingCodeRef.current = generatedCode;
        clearInterval(interval);
        return;
      }
      
      // Fast-forward if there was a gap
      const elapsed = now - lastTime;
      if (elapsed > 200) {
        completeGeneration(generatedCode);
        clearInterval(interval);
        return;
      }
      lastTime = now;
      
      if (index < generatedCode.length) {
        setDisplayedCode(generatedCode.slice(0, index + chunkSize));
        setEditableCode(generatedCode.slice(0, index + chunkSize));
        index += chunkSize;
        if (codeContainerRef.current) codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
      } else {
        completeGeneration(generatedCode);
        clearInterval(interval);
      }
    }, 8);
    
    return () => clearInterval(interval);
  }, [generatedCode, isStreamingCode, completeGeneration]);
  
  // SAFEGUARD: Ensure code is visible when generation is complete
  // This fixes cases where streaming failed or sidebar wasn't set
  useEffect(() => {
    if (generatedCode && !isStreamingCode && !isProcessing) {
      // Ensure displayedCode is set
      if (!displayedCode && generatedCode) {
        console.log("[Safeguard] displayedCode was empty but generatedCode exists - fixing");
        setDisplayedCode(generatedCode);
        setEditableCode(generatedCode);
      }
      // Ensure sidebar is in chat mode when we have code
      if (sidebarMode !== "chat" && generatedCode) {
        console.log("[Safeguard] sidebarMode was not chat but code exists - fixing");
        setSidebarMode("chat");
        setGenerationComplete(true);
      }
    }
  }, [generatedCode, displayedCode, isStreamingCode, isProcessing, sidebarMode]);
  
  // Show feedback modal after generation (separate effect)
  // Feedback modal effect removed
  /*
  useEffect(() => {
    if (generationComplete && !hasShownFeedback) {
      const timer = setTimeout(() => {
        setShowFeedbackModal(true);
        setHasShownFeedback(true);
        localStorage.setItem("replay_feedback_shown", "true");
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [generationComplete, hasShownFeedback]);
  */

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Load on mount - Supabase is primary, localStorage is quick cache
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedFeedbackShown = localStorage.getItem("replay_feedback_shown");
        if (savedFeedbackShown === "true") {
          setHasShownFeedback(true);
        }
        
        // Quick cache: load minimal index from localStorage for instant History display
        const cachedIndex = localStorage.getItem("replay_generation_index");
        if (cachedIndex) {
          try {
            const index = JSON.parse(cachedIndex);
            // Set minimal generations for History list while Supabase loads
            // Sort by timestamp (newest first) before setting
            const sorted = index
              .map((g: any) => ({ ...g, code: '' }))
              .sort((a: any, b: any) => b.timestamp - a.timestamp);
            setGenerations(sorted);
          } catch (e) {
            // Ignore cache parse errors
          }
        }
        
        setHasLoadedFromStorage(true);
      } catch (e) {
        console.error("Error loading initial data:", e);
        setHasLoadedFromStorage(true);
      }
    };
    
    loadData();
  }, []);

  // Save flows to localStorage (but not blob URLs - they don't persist)
  useEffect(() => {
    if (!hasLoadedFromStorage) return; // Don't save until we've loaded
    
    try {
      // Don't save blob URLs as they won't work after reload
      const flowsToSave = flows.map(f => ({
        ...f,
        // Keep data URLs (base64 thumbnails), but clear blob URLs
        videoUrl: f.videoUrl?.startsWith("blob:") ? "" : f.videoUrl,
        // Keep data: URLs for thumbnails (base64), only clear blob: URLs
        thumbnail: f.thumbnail?.startsWith("data:") ? f.thumbnail : (f.thumbnail?.startsWith("blob:") ? "" : f.thumbnail),
        // Don't save the videoBlob - it's not serializable
        videoBlob: undefined,
      })).filter(f => f.videoUrl); // Only save flows with valid URLs
      
      if (flowsToSave.length > 0) {
        console.log("Saving flows to localStorage:", flowsToSave.map(f => ({ 
          id: f.id, 
          name: f.name,
          hasVideoUrl: !!f.videoUrl, 
          hasThumbnail: !!f.thumbnail,
          thumbnailLength: f.thumbnail?.length || 0
        })));
      }
      
      localStorage.setItem("replay_flows", JSON.stringify(flowsToSave));
    } catch (e) {
      console.error("Error saving flows:", e);
    }
  }, [flows, hasLoadedFromStorage]);

  // Save generated code to localStorage
  useEffect(() => {
    if (!hasLoadedFromStorage || !generatedCode) return;
    try {
      localStorage.setItem("replay_generated_code", generatedCode);
    } catch (e) {
      console.error("Error saving code:", e);
    }
  }, [generatedCode, hasLoadedFromStorage]);

  // Save style to localStorage
  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    try {
      localStorage.setItem("replay_style", styleDirective);
      localStorage.setItem("replay_refinements", refinements);
    } catch (e) {
      console.error("Error saving style:", e);
    }
  }, [styleDirective, refinements, hasLoadedFromStorage]);
  
  // Save chat state to activeGeneration (per-project chat)
  // Using useRef to track the last saved state and debounce saves
  const lastSavedChatRef = useRef<string>("");
  const lastProjectIdRef = useRef<string | null>(null);
  const chatSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Reset chat ref when switching projects
  useEffect(() => {
    if (activeGeneration?.id !== lastProjectIdRef.current) {
      lastSavedChatRef.current = "";
      lastProjectIdRef.current = activeGeneration?.id || null;
    }
  }, [activeGeneration?.id]);
  
  // Debounced chat save - only save after 500ms of no changes
  useEffect(() => {
    if (!hasLoadedFromStorage || !activeGeneration) return;
    
    const currentChatHash = JSON.stringify(chatMessages.map(m => m.id));
    if (currentChatHash === lastSavedChatRef.current) return;
    
    // Clear previous timeout
    if (chatSaveTimeoutRef.current) {
      clearTimeout(chatSaveTimeoutRef.current);
    }
    
    // Debounce save by 500ms
    chatSaveTimeoutRef.current = setTimeout(() => {
      setGenerations(prev => prev.map(g => 
        g.id === activeGeneration.id ? { ...g, chatMessages } : g
      ));
      lastSavedChatRef.current = currentChatHash;
      localStorage.setItem("replay_sidebar_mode", sidebarMode);
    }, 500);
    
    return () => {
      if (chatSaveTimeoutRef.current) {
        clearTimeout(chatSaveTimeoutRef.current);
      }
    };
  }, [chatMessages, sidebarMode, hasLoadedFromStorage, activeGeneration?.id]);
  
  // Validate Supabase credentials format
  const isValidSupabaseUrl = (url: string): boolean => {
    if (!url || url.trim().length === 0) return false;
    // Must be https://*.supabase.co format
    const pattern = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/;
    return pattern.test(url.trim());
  };
  
  const isValidSupabaseKey = (key: string): boolean => {
    if (!key || key.trim().length === 0) return false;
    // JWT tokens start with eyJ (base64 encoded {"alg":...)
    return key.trim().startsWith('eyJ') && key.trim().length > 100;
  };

  // Clean up invalid/legacy Supabase data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // Remove global fallback keys (legacy) - we only use project-specific now
    localStorage.removeItem("replay_supabase_url");
    localStorage.removeItem("replay_supabase_key");
    
    console.log("[Supabase Cleanup] Removed legacy global keys");
  }, []);

  // Check Supabase connection status - validates format strictly
  // Only check once on project change, not continuously
  useEffect(() => {
    if (typeof window === "undefined" || !activeGeneration?.id) {
      setIsSupabaseConnected(false);
      return;
    }
    
    const projectId = activeGeneration.id;
    let connected = false;
    
    try {
      const stored = localStorage.getItem(`replay_secrets_${projectId}`);
      
      if (stored) {
        const secrets = JSON.parse(stored);
        const url = secrets.supabaseUrl || '';
        const key = secrets.supabaseAnonKey || '';
        
        // Strict validation
        const urlValid = url && /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/.test(url.trim());
        const keyValid = key && key.trim().length >= 100 && key.trim().startsWith('eyJ');
        
        connected = urlValid && keyValid;
      }
    } catch (e) {
      // Silent fail - no connection
    }
    
    setIsSupabaseConnected(connected);
  }, [activeGeneration?.id]);
  
  // Save flow nodes and edges to localStorage
  useEffect(() => {
    if (!hasLoadedFromStorage || flowNodes.length === 0) return;
    try {
      localStorage.setItem("replay_flow_nodes", JSON.stringify(flowNodes));
      localStorage.setItem("replay_flow_edges", JSON.stringify(flowEdges));
    } catch (e) {
      console.error("Error saving flow:", e);
    }
  }, [flowNodes, flowEdges, hasLoadedFromStorage]);
  
  // Save style info to localStorage
  useEffect(() => {
    if (!hasLoadedFromStorage || !styleInfo) return;
    try {
      localStorage.setItem("replay_style_info", JSON.stringify(styleInfo));
    } catch (e) {
      console.error("Error saving style info:", e);
    }
  }, [styleInfo, hasLoadedFromStorage]);
  
  // Save generation history - PRIMARY: Supabase, SECONDARY: minimal localStorage cache
  const lastSavedGenerationsRef = useRef<string>("");
  const generationsSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLoadingProjectRef = useRef(false); // Flag to prevent saves during project load
  
  useEffect(() => {
    if (!hasLoadedFromStorage || generations.length === 0) return;
    
    // Skip save if we're just loading a project (not editing)
    if (isLoadingProjectRef.current) {
      isLoadingProjectRef.current = false;
      return;
    }
    
    // Create a simple hash to detect real changes (includes title for rename detection!)
    const currentHash = generations.map(g => `${g.id}:${g.title}:${g.chatMessages?.length || 0}:${g.versions?.length || 0}`).join('|');
    if (currentHash === lastSavedGenerationsRef.current) return;
    
    // Clear previous timeout
    if (generationsSaveTimeoutRef.current) {
      clearTimeout(generationsSaveTimeoutRef.current);
    }
    
    // Debounce save by 2 seconds
    generationsSaveTimeoutRef.current = setTimeout(async () => {
      lastSavedGenerationsRef.current = currentHash;
      
      // PRIMARY: Save to Supabase (if logged in) - full data, no limits
      if (user) {
        for (const gen of generations) {
          if (gen.status === "complete" && gen.code) {
            try {
              await fetch("/api/generations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: gen.id,
                  title: gen.title,
                  code: gen.code, // Full code - no limit
                  timestamp: gen.timestamp,
                  publishedSlug: gen.publishedSlug,
                  chatMessages: gen.chatMessages, // Full chat history
                  versions: gen.versions, // All versions
                  status: gen.status,
                  videoUrl: gen.videoUrl,
                  thumbnailUrl: gen.thumbnailUrl,
                }),
              });
            } catch (e) {
              console.error("Error saving to Supabase:", e);
            }
          }
        }
      }
      
      // SECONDARY: Save ONLY index to localStorage (cache for quick History list)
      try {
        const historyIndex = generations.slice(-100).map(gen => ({
          id: gen.id,
          title: gen.title,
          timestamp: gen.timestamp,
          status: gen.status,
          thumbnailUrl: gen.thumbnailUrl?.substring(0, 200) || '',
        }));
        localStorage.setItem("replay_generation_index", JSON.stringify(historyIndex));
      } catch (e) {
        // Ignore localStorage errors - Supabase is primary
        console.log("localStorage cache skipped (quota)");
      }
    }, 2000);
    
    return () => {
      if (generationsSaveTimeoutRef.current) {
        clearTimeout(generationsSaveTimeoutRef.current);
      }
    };
  }, [generations, hasLoadedFromStorage, user]);
  
  // Fetch lock to prevent multiple simultaneous requests
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  
  // PRIMARY DATA SOURCE: Supabase - load full history when user logs in
  useEffect(() => {
    if (!user || !hasLoadedFromStorage) {
      // If no user, mark history as loaded (empty)
      if (!user && hasLoadedFromStorage) {
        setIsLoadingHistory(false);
      }
      return;
    }
    
    const fetchFromSupabase = async (force = false) => {
      // Prevent concurrent fetches
      if (isFetchingRef.current) {
        console.log("[Supabase] Fetch already in progress, skipping");
        return;
      }
      
      // Don't fetch more than once every 10 seconds (unless forced)
      const now = Date.now();
      if (!force && now - lastFetchTimeRef.current < 10000) {
        console.log("[Supabase] Debounced, last fetch was", Math.round((now - lastFetchTimeRef.current) / 1000), "s ago");
        return;
      }
      
      isFetchingRef.current = true;
      lastFetchTimeRef.current = now;
      
      try {
        // Fetch minimal data for history list (much faster) - increased limit to 500
        const response = await fetch("/api/generations?minimal=true&limit=500");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.generations) {
            // Merge with existing generations to preserve full data for current session
            // IMPORTANT: Supabase is the source of truth - don't keep old local-only generations
            setGenerations(prev => {
              const supabaseMap = new Map<string, GenerationRecord>(
                data.generations.map((g: GenerationRecord) => [g.id, g])
              );
              const merged: GenerationRecord[] = [];
              
              // Only keep generations that exist in Supabase, but preserve full data from prev
              for (const prevGen of prev) {
                const newGen = supabaseMap.get(prevGen.id);
                if (newGen) {
                  // Merge: keep code/versions from prev if not in new (minimal fetch)
                  merged.push({
                    ...newGen,
                    code: prevGen.code || newGen.code,
                    versions: prevGen.versions || newGen.versions,
                    flowNodes: prevGen.flowNodes || newGen.flowNodes,
                    flowEdges: prevGen.flowEdges || newGen.flowEdges,
                    styleInfo: prevGen.styleInfo || newGen.styleInfo,
                    styleDirective: prevGen.styleDirective || newGen.styleDirective || '',
                    refinements: prevGen.refinements || newGen.refinements || '',
                  } as GenerationRecord);
                  supabaseMap.delete(prevGen.id);
                }
                // REMOVED: Don't keep local-only generations - Supabase is source of truth
                // Old stale data in localStorage was causing projects to show that don't exist
              }
              
              // Add any new generations from Supabase
              for (const newGen of supabaseMap.values()) {
                merged.push(newGen);
              }
              
              // Sort by timestamp (newest first)
              return merged.sort((a, b) => b.timestamp - a.timestamp);
            });
            console.log(`[Supabase] Synced ${data.generations.length} generations (total: ${data.total})`);
          }
        }
      } catch (e) {
        console.error("Error syncing with Supabase:", e);
      } finally {
        isFetchingRef.current = false;
        setIsLoadingHistory(false); // Mark history as loaded
      }
    };
    
    // Initial fetch
    fetchFromSupabase(true);
    
    // Set up periodic sync (every 60 seconds - reduced from 15s to prevent DB overload)
    const intervalId = setInterval(() => fetchFromSupabase(false), 60000);
    
    // Sync when tab becomes visible (but debounced)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchFromSupabase(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Don't sync on every focus - removed to reduce DB load
    
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, hasLoadedFromStorage]);
  
  
  // Save active generation to Supabase when complete
  // Track failed saves to prevent spam
  const failedSavesRef = useRef<Set<string>>(new Set());
  
  const saveGenerationToSupabase = useCallback(async (gen: GenerationRecord) => {
    if (!user) {
      console.log("[Save] Skipping - no user logged in");
      return;
    }
    
    // Only skip demo saves if in demo mode (user came via ?demo= URL, not logged in as owner)
    // The owner CAN save changes to demo projects when loaded from their history
    if (isDemoMode && DEMO_PROJECT_IDS.has(gen.id)) {
      console.log("[Save] Skipping demo project in demo mode:", gen.id);
      return;
    }
    
    // Don't retry if already failed for this generation
    if (failedSavesRef.current.has(gen.id)) {
      console.log("[Save] Skipping - previously failed:", gen.id);
      return;
    }
    
    console.log("[Save] Saving to Supabase:", gen.id, "title:", gen.title);
    
    try {
      const response = await fetch("/api/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(gen),
      });
      
      const data = await response.json();
      if (!response.ok) {
        console.error("Error saving generation:", data);
        // Mark as failed to prevent retries
        failedSavesRef.current.add(gen.id);
      }
    } catch (e) {
      console.error("Error saving to Supabase:", e);
      failedSavesRef.current.add(gen.id);
    }
  }, [user, isDemoMode, DEMO_PROJECT_IDS]);
  
  // Lazy load full generation data (called when user selects from history)
  const loadFullGeneration = useCallback(async (genId: string): Promise<GenerationRecord | null> => {
    try {
      // Check if this is a demo project - use demo API instead
      const isDemo = DEMO_PROJECT_IDS.has(genId);
      const endpoint = isDemo 
        ? `/api/demo/${genId}` 
        : `/api/generations?id=${genId}`;
      
      console.log(`[History] Loading ${isDemo ? 'demo' : 'user'} generation: ${genId}`);
      
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.generation) {
          // Update in generations list
          const fullGen = data.generation as GenerationRecord;
          setGenerations(prev => prev.map(g => g.id === genId ? fullGen : g));
          console.log(`[History] Loaded full data for generation ${genId}`);
          return fullGen;
        }
      } else {
        console.error(`[History] Failed to load generation ${genId}:`, response.status);
      }
    } catch (e) {
      console.error("Error loading full generation:", e);
    }
    return null;
  }, [DEMO_PROJECT_IDS]);
  
  // Save generation title to localStorage
  useEffect(() => {
    if (!hasLoadedFromStorage) return;
    try {
      localStorage.setItem("replay_generation_title", generationTitle);
    } catch (e) {
      console.error("Error saving title:", e);
    }
  }, [generationTitle, hasLoadedFromStorage]);
  
  // Save analysis phase to localStorage
  useEffect(() => {
    if (!hasLoadedFromStorage || !analysisPhase) return;
    try {
      localStorage.setItem("replay_analysis_phase", JSON.stringify(analysisPhase));
    } catch (e) {
      console.error("Error saving analysis phase:", e);
    }
  }, [analysisPhase, hasLoadedFromStorage]);
  
  // Save analysis description to localStorage
  useEffect(() => {
    if (!hasLoadedFromStorage || !analysisDescription) return;
    try {
      localStorage.setItem("replay_analysis_description", analysisDescription);
    } catch (e) {
      console.error("Error saving analysis description:", e);
    }
  }, [analysisDescription, hasLoadedFromStorage]);
  
  // Update active generation when code/flow changes (for persistence)
  useEffect(() => {
    if (!activeGeneration || !generatedCode || !generationComplete) return;
    
    // Update the active generation with latest state
    const updatedGen: GenerationRecord = {
      ...activeGeneration,
      code: generatedCode,
      flowNodes: flowNodes,
      flowEdges: flowEdges,
      styleInfo: styleInfo,
      styleDirective: styleDirective,
      title: generationTitle || activeGeneration.title,
      status: "complete"
    };
    
    setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
    
    // Sync to Supabase
    saveGenerationToSupabase(updatedGen);
  }, [generatedCode, flowNodes, flowEdges, styleInfo, styleDirective, generationTitle, generationComplete, activeGeneration?.id, saveGenerationToSupabase]);

  // Video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [selectedFlowId]);

  // Close history menu when clicking outside
  useEffect(() => {
    if (!historyMenuOpen) return;
    const handleClick = () => setHistoryMenuOpen(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [historyMenuOpen]);

  // Point-and-edit: listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'element-selected') {
        const { tagName, id, className, textContent, isSvg, svgType } = event.data;
        // Build a descriptive element reference (not CSS selector format)
        let elementDesc = '';
        const tag = tagName?.toLowerCase() || 'element';
        
        // Handle SVG elements specially
        if (isSvg) {
          if (tag === 'svg') {
            elementDesc = id ? `the SVG icon with id "${id}"` : (className ? `the SVG icon with class "${className.split(' ')[0]}"` : 'the SVG icon/graphic');
          } else if (svgType) {
            // It's an element inside an SVG (path, circle, rect, etc.)
            elementDesc = `the ${svgType} inside the SVG icon`;
          } else {
            elementDesc = 'the SVG element';
          }
        } else if (textContent && textContent.length > 0 && textContent.length < 40) {
          // Use text content as primary identifier - most intuitive
          elementDesc = `the "${textContent.substring(0, 35).trim()}" ${tag}`;
        } else if (id) {
          elementDesc = `the ${tag} with id "${id}"`;
        } else if (className) {
          const firstClass = className.split(' ')[0];
          elementDesc = `the ${tag} with class "${firstClass}"`;
        } else {
          elementDesc = `the ${tag} element`;
        }
        
        setSelectedElement(elementDesc);
        // Don't use @ - just describe the element naturally
        // Only change if not currently editing
        if (!isEditing) {
          setEditInput(`For ${elementDesc}: `);
        }
        setIsPointAndEdit(false);
        editInputRef.current?.focus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Inject pointer script into iframe when point-and-edit is enabled
  useEffect(() => {
    if (!isPointAndEdit || !previewIframeRef.current) return;
    
    const iframe = previewIframeRef.current;
    const injectScript = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        
        // Check if already injected
        if (doc.getElementById('point-and-edit-script')) return;
        
        const script = doc.createElement('script');
        script.id = 'point-and-edit-script';
        script.textContent = `
          (function() {
            let hovered = null;
            const overlay = document.createElement('div');
            overlay.id = 'point-edit-overlay';
            overlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #FF6E3C;background:rgba(255,110,60,0.1);z-index:99999;transition:all 0.1s ease;display:none;';
            document.body.appendChild(overlay);
            
            document.addEventListener('mousemove', function(e) {
              const el = document.elementFromPoint(e.clientX, e.clientY);
              if (el && el !== hovered && el !== overlay) {
                hovered = el;
                const rect = el.getBoundingClientRect();
                overlay.style.display = 'block';
                overlay.style.left = rect.left + 'px';
                overlay.style.top = rect.top + 'px';
                overlay.style.width = rect.width + 'px';
                overlay.style.height = rect.height + 'px';
              }
            });
            
            document.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              const el = document.elementFromPoint(e.clientX, e.clientY);
              if (el && el !== overlay) {
                // Get className safely - SVG elements have SVGAnimatedString which can't be cloned
                let classValue = '';
                if (el.className) {
                  if (typeof el.className === 'string') {
                    classValue = el.className;
                  } else if (el.className.baseVal !== undefined) {
                    // SVG element - use baseVal
                    classValue = el.className.baseVal;
                  } else {
                    classValue = el.getAttribute('class') || '';
                  }
                }
                window.parent.postMessage({
                  type: 'element-selected',
                  tagName: el.tagName,
                  id: el.id || '',
                  className: classValue,
                  textContent: el.textContent?.trim().substring(0, 50) || '',
                  // Add SVG-specific info
                  isSvg: el.tagName === 'svg' || el.closest('svg') !== null,
                  svgType: el.closest('svg') ? el.tagName.toLowerCase() : null
                }, '*');
              }
            }, true);
          })();
        `;
        doc.body.appendChild(script);
        
        // Add cursor style
        const style = doc.createElement('style');
        style.id = 'point-and-edit-style';
        style.textContent = 'body, body * { cursor: crosshair !important; }';
        doc.head.appendChild(style);
      } catch (e) {
        console.log('Cannot inject into iframe:', e);
      }
    };
    
    // Wait for iframe to load
    if (iframe.contentDocument?.readyState === 'complete') {
      injectScript();
    } else {
      iframe.addEventListener('load', injectScript);
      return () => iframe.removeEventListener('load', injectScript);
    }
  }, [isPointAndEdit, previewUrl]);

  // Clean up pointer script when disabled
  useEffect(() => {
    if (isPointAndEdit || !previewIframeRef.current) return;
    try {
      const doc = previewIframeRef.current.contentDocument;
      if (doc) {
        doc.getElementById('point-and-edit-script')?.remove();
        doc.getElementById('point-and-edit-style')?.remove();
        doc.getElementById('point-edit-overlay')?.remove();
      }
    } catch (e) { /* ignore */ }
  }, [isPointAndEdit]);

  // Direct text editing mode - inject contenteditable script
  useEffect(() => {
    if (!isDirectEditMode || !previewIframeRef.current) return;
    
    const iframe = previewIframeRef.current;
    const injectDirectEditScript = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) return;
        
        if (doc.getElementById('direct-edit-script')) return;
        
        const script = doc.createElement('script');
        script.id = 'direct-edit-script';
        script.textContent = `
          (function() {
            let activeElement = null;
            let originalText = '';
            
            // Editable tags list
            const editableTags = ['H1','H2','H3','H4','H5','H6','P','SPAN','A','BUTTON','LI','LABEL','TD','TH','STRONG','EM','B','I','SMALL','FOOTER','DIV','SECTION','ARTICLE','ASIDE','NAV','HEADER','TIME','ADDRESS','FIGCAPTION','BLOCKQUOTE','CITE','CODE','PRE','MARK','DEL','INS','SUB','SUP'];
            
            // Start editing function
            function startEdit(el) {
              if (activeElement) {
                finishEdit();
              }
              if (el.children.length > 3 && el.tagName !== 'A' && el.tagName !== 'BUTTON') return;
              if (!editableTags.includes(el.tagName)) return;
              
              activeElement = el;
              originalText = el.textContent;
              el.contentEditable = 'true';
              el.style.outline = '2px solid #FF6E3C';
              el.style.outlineOffset = '2px';
              el.focus();
              
              // Select all text
              setTimeout(function() {
                const range = document.createRange();
                range.selectNodeContents(el);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
              }, 10);
            }
            
            function finishEdit(cancelled) {
              if (!activeElement) return;
              
              const newText = activeElement.textContent.trim();
              activeElement.contentEditable = 'false';
              activeElement.style.outline = '';
              activeElement.style.outlineOffset = '';
              
              if (!cancelled && newText !== originalText.trim()) {
                const path = getElementPath(activeElement);
                window.parent.postMessage({
                  type: 'text-edited',
                  originalText: originalText.trim(),
                  newText: newText,
                  elementPath: path,
                  tagName: activeElement.tagName
                }, '*');
              }
              
              activeElement = null;
              originalText = '';
            }
            
            function getElementPath(el) {
              const parts = [];
              while (el && el.tagName !== 'HTML') {
                let selector = el.tagName.toLowerCase();
                if (el.id) selector += '#' + el.id;
                else if (el.className && typeof el.className === 'string') {
                  selector += '.' + el.className.split(' ').filter(function(c) { return c; }).join('.');
                }
                parts.unshift(selector);
                el = el.parentElement;
              }
              return parts.join(' > ');
            }
            
            // Block form submissions
            document.addEventListener('submit', function(e) {
              e.preventDefault();
              e.stopPropagation();
            }, true);
            
            // Single click handler - for buttons/links, start edit; for others, finish edit if clicking outside
            document.addEventListener('click', function(e) {
              const el = e.target;
              
              // Always prevent navigation on links
              const closestLink = el.closest('a');
              if (closestLink) {
                e.preventDefault();
              }
              
              // If clicking on a button or link (or inside one), start editing it
              const closestButton = el.closest('button');
              if (closestButton || closestLink) {
                e.preventDefault();
                e.stopPropagation();
                const target = closestButton || closestLink;
                if (target !== activeElement) {
                  startEdit(target);
                }
                return;
              }
              
              // If currently editing and clicked outside, finish edit
              if (activeElement && el !== activeElement && !activeElement.contains(el)) {
                finishEdit();
              }
            }, true);
            
            // Double-click on other text elements
            document.addEventListener('dblclick', function(e) {
              const el = e.target;
              
              // Skip if inside button/link (handled by single click)
              if (el.closest('button') || el.closest('a')) return;
              
              if (!editableTags.includes(el.tagName)) return;
              
              e.preventDefault();
              e.stopPropagation();
              startEdit(el);
            });
            
            // Handle Enter/Escape to finish editing
            document.addEventListener('keydown', function(e) {
              if (!activeElement) return;
              
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                finishEdit();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                activeElement.textContent = originalText;
                finishEdit(true);
              }
            });
            
            // Visual indicator that editing mode is active
            const indicator = document.createElement('div');
            indicator.id = 'direct-edit-indicator';
            indicator.style.cssText = 'position:fixed;top:8px;right:8px;padding:4px 10px;background:#FF6E3C;color:white;font-size:11px;font-family:system-ui;border-radius:4px;z-index:99999;pointer-events:none;';
            indicator.textContent = '✎ Editing Mode (click buttons/links, double-click text)';
            document.body.appendChild(indicator);
          })();
        `;
        doc.body.appendChild(script);
        
        // Add hover highlight style and disable all interactivity
        const style = doc.createElement('style');
        style.id = 'direct-edit-style';
        style.textContent = 'a, button, input, select, textarea, [onclick], [href] { pointer-events: auto !important; cursor: text !important; } a:hover, button:hover { outline: 2px dashed #FF6E3C !important; outline-offset: 2px; } h1,h2,h3,h4,h5,h6,p,span,li,label,td,th,strong,em,b,i,small,div,section,article,aside,nav,header,time,address,figcaption,blockquote,cite,code,pre,mark,del,ins,sub,sup { transition: outline 0.1s; } h1:hover,h2:hover,h3:hover,h4:hover,h5:hover,h6:hover,p:hover,span:hover,li:hover,label:hover,td:hover,th:hover,strong:hover,em:hover,b:hover,i:hover,small:hover,div:hover,section:hover,article:hover,aside:hover,nav:hover,header:hover,time:hover,address:hover,figcaption:hover,blockquote:hover,cite:hover,code:hover,pre:hover,mark:hover,del:hover,ins:hover,sub:hover,sup:hover { outline: 1px dashed rgba(255,110,60,0.5); outline-offset: 2px; cursor: text; }';
        doc.head.appendChild(style);
      } catch (e) {
        console.log('Cannot inject direct edit script:', e);
      }
    };
    
    if (iframe.contentDocument?.readyState === 'complete') {
      injectDirectEditScript();
    } else {
      iframe.addEventListener('load', injectDirectEditScript);
      return () => iframe.removeEventListener('load', injectDirectEditScript);
    }
  }, [isDirectEditMode, previewUrl]);

  // Clean up direct edit script when disabled
  useEffect(() => {
    if (isDirectEditMode || !previewIframeRef.current) return;
    try {
      const doc = previewIframeRef.current.contentDocument;
      if (doc) {
        doc.getElementById('direct-edit-script')?.remove();
        doc.getElementById('direct-edit-style')?.remove();
        doc.getElementById('direct-edit-indicator')?.remove();
      }
    } catch (e) { /* ignore */ }
  }, [isDirectEditMode]);

  // Reset editing modes when changing tabs
  useEffect(() => {
    if (viewMode !== "preview") {
      setIsDirectEditMode(false);
      setIsPointAndEdit(false);
      // If there were pending edits and user switched tabs, discard them
      if (pendingTextEdits.length > 0) {
        setPendingTextEdits([]);
        // Refresh preview to original code
        if (editableCode) {
          setPreviewUrl(URL.createObjectURL(new Blob([editableCode], { type: "text/html" })));
        }
      }
    }
  }, [viewMode]);

  // Listen for text edit messages from iframe
  useEffect(() => {
    const handleTextEdit = (event: MessageEvent) => {
      if (event.data?.type === 'text-edited') {
        const { originalText, newText, elementPath, tagName } = event.data;
        setPendingTextEdits(prev => {
          // Check if this edit already exists (update it)
          const existing = prev.findIndex(e => e.originalText === originalText);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { originalText, newText, elementPath };
            return updated;
          }
          return [...prev, { originalText, newText, elementPath }];
        });
      }
    };
    window.addEventListener('message', handleTextEdit);
    return () => window.removeEventListener('message', handleTextEdit);
  }, []);

  // Apply pending text edits to the code
  const applyPendingTextEdits = useCallback(() => {
    if (pendingTextEdits.length === 0 || !editableCode) return;
    
    let newCode = editableCode;
    let appliedCount = 0;
    
    for (const edit of pendingTextEdits) {
      // Simple text replacement - find the original text and replace with new
      // We need to be careful to only replace text content, not attribute values
      const escapedOriginal = edit.originalText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      let matched = false;
      
      // Strategy 1: Match text between tags (strict)
      const regex1 = new RegExp(`(>\\s*)${escapedOriginal}(\\s*<)`, 'g');
      let newCodeAfter = newCode.replace(regex1, `$1${edit.newText}$2`);
      if (newCodeAfter !== newCode) {
        newCode = newCodeAfter;
        matched = true;
      }
      
      // Strategy 2: Match text with possible whitespace/newlines around it
      if (!matched) {
        const regex2 = new RegExp(`(>[^<]*?)${escapedOriginal}([^<]*?<)`, 'g');
        newCodeAfter = newCode.replace(regex2, `$1${edit.newText}$2`);
        if (newCodeAfter !== newCode) {
          newCode = newCodeAfter;
          matched = true;
        }
      }
      
      // Strategy 3: Simple replace but avoid attribute values (check not inside quotes)
      if (!matched) {
        // Find all occurrences and only replace those not inside attribute values
        const parts = newCode.split(edit.originalText);
        if (parts.length > 1) {
          let result = parts[0];
          for (let i = 1; i < parts.length; i++) {
            // Check if we're inside an attribute (count quotes before this position)
            const before = result;
            const doubleQuotes = (before.match(/"/g) || []).length;
            const singleQuotes = (before.match(/'/g) || []).length;
            // If odd number of quotes, we're inside an attribute - don't replace
            if (doubleQuotes % 2 === 0 && singleQuotes % 2 === 0) {
              result += edit.newText + parts[i];
              matched = true;
            } else {
              result += edit.originalText + parts[i];
            }
          }
          if (matched) {
            newCode = result;
          }
        }
      }
      
      if (matched) {
        appliedCount++;
      }
    }
    
    if (appliedCount > 0) {
      setEditableCode(newCode);
      setDisplayedCode(newCode);
      setGeneratedCode(newCode);
      setPreviewUrl(URL.createObjectURL(new Blob([newCode], { type: "text/html" })));
      
      // Save version
      if (activeGeneration) {
        const versionLabel = `Text edits (${appliedCount} changes)`;
        const updatedGen = { 
          ...activeGeneration, 
          code: newCode, 
          versions: [...(activeGeneration.versions || []), { 
            id: generateId(), 
            timestamp: Date.now(), 
            label: versionLabel, 
            code: newCode, 
            flowNodes, 
            flowEdges, 
            styleInfo 
          }] 
        };
        setActiveGeneration(updatedGen);
        setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
        saveGenerationToSupabase(updatedGen);
      }
      
      showToast(`Applied ${appliedCount} text edit${appliedCount > 1 ? 's' : ''}`, "success");
    }
    
    setPendingTextEdits([]);
    setIsDirectEditMode(false);
  }, [pendingTextEdits, editableCode, activeGeneration, flowNodes, flowEdges, styleInfo]);

  // Build architecture from code - better positioning with no overlaps
  const buildArchitectureLive = async (code: string) => {
    setArchBuilding(true);
    setArchitecture([]);
    
    const addNode = async (node: ArchNode) => {
      await new Promise(r => setTimeout(r, 120));
      setArchitecture(prev => [...prev, node]);
    };
    
    // Better layout - tree structure with proper spacing
    const centerX = 400;
    let currentY = 40;
    const rowHeight = 120;
    const colWidth = 250;
    
    // Analyze code for smarter naming
    const hasNav = /<nav/i.test(code);
    const hasHeader = /<header/i.test(code);
    const hasSidebar = /sidebar|aside/i.test(code);
    const hasHero = /hero|banner|jumbotron/i.test(code);
    const hasCards = /card/gi.test(code);
    const hasForms = /<form/i.test(code);
    const hasTable = /<table/i.test(code);
    
    await addNode({ id: "root", name: "Document", type: "page", description: "HTML root", x: centerX, y: currentY, connections: [] });
    currentY += rowHeight;
    
    // Row 2: Layout structure
    const row2Nodes: string[] = [];
    if (hasNav || hasHeader) {
      await addNode({ id: "nav", name: hasNav ? "Navigation" : "Header", type: "component", description: hasNav ? "Site navigation menu" : "Page header", x: centerX - colWidth, y: currentY, connections: ["root"] });
      row2Nodes.push("nav");
    }
    
    await addNode({ id: "content", name: "Content Area", type: "section", description: "Main page content", x: centerX, y: currentY, connections: ["root"] });
    row2Nodes.push("content");
    
    if (hasSidebar) {
      await addNode({ id: "sidebar", name: "Sidebar", type: "component", description: "Side navigation", x: centerX + colWidth, y: currentY, connections: ["root"] });
    }
    
    currentY += rowHeight;
    
    // Row 3: Content sections
    const row3Nodes: { id: string; name: string; desc: string }[] = [];
    if (hasHero) row3Nodes.push({ id: "hero", name: "Hero Section", desc: "Main visual banner" });
    if (hasCards) row3Nodes.push({ id: "cards", name: "Card Grid", desc: "Content cards layout" });
    if (hasForms) row3Nodes.push({ id: "forms", name: "Form Block", desc: "User input forms" });
    if (hasTable) row3Nodes.push({ id: "table", name: "Data Table", desc: "Tabular data display" });
    
    // Add generic sections if none detected
    const sections = (code.match(/<section/gi) || []).length;
    if (row3Nodes.length === 0 && sections > 0) {
      for (let i = 0; i < Math.min(sections, 3); i++) {
        row3Nodes.push({ id: `section-${i}`, name: `Section ${i + 1}`, desc: "Content section" });
      }
    }
    
    const spacing3 = colWidth;
    const startX3 = centerX - ((row3Nodes.length - 1) * spacing3) / 2;
    for (let i = 0; i < row3Nodes.length; i++) {
      await addNode({ 
        id: row3Nodes[i].id, 
        name: row3Nodes[i].name, 
        type: "component",
        description: row3Nodes[i].desc,
        x: startX3 + (i * spacing3), 
        y: currentY, 
        connections: ["content"] 
      });
    }
    
    currentY += rowHeight;
    
    // Row 4: Elements
    const buttons = (code.match(/<button/gi) || []).length;
    const images = (code.match(/<img/gi) || []).length;
    const inputs = (code.match(/<input/gi) || []).length;
    const links = (code.match(/<a /gi) || []).length;
    
    const row4Nodes: { id: string; name: string; type: "interactive" | "element"; desc: string }[] = [];
    if (buttons > 0) row4Nodes.push({ id: "btns", name: `${buttons} Buttons`, type: "interactive", desc: "Click actions" });
    if (links > 5) row4Nodes.push({ id: "links", name: `${links} Links`, type: "interactive", desc: "Navigation links" });
    if (images > 0) row4Nodes.push({ id: "imgs", name: `${images} Images`, type: "element", desc: "Visual media" });
    if (inputs > 0) row4Nodes.push({ id: "inputs", name: `${inputs} Inputs`, type: "interactive", desc: "Form fields" });
    
    const spacing4 = colWidth;
    const startX4 = centerX - ((row4Nodes.length - 1) * spacing4) / 2;
    const parentNode = row3Nodes.length > 0 ? row3Nodes[0].id : "content";
    for (let i = 0; i < row4Nodes.length; i++) {
      await addNode({ 
        id: row4Nodes[i].id, 
        name: row4Nodes[i].name, 
        type: row4Nodes[i].type, 
        description: row4Nodes[i].desc, 
        x: startX4 + (i * spacing4), 
        y: currentY, 
        connections: [parentNode] 
      });
    }
    
    currentY += rowHeight;
    
    // Row 5: Footer
    if (/<footer/i.test(code)) {
      await addNode({ id: "footer", name: "Footer", type: "component", description: "Page footer & links", x: centerX, y: currentY, connections: ["root"] });
    }
    
    setArchBuilding(false);
  };

  // Build PRODUCT FLOW MAP from ACTUAL code content
  // Analyzes the generated code to detect:
  // - CONFIRMED pages: x-show Alpine.js pages with actual content
  // - POSSIBLE pages: Navigation items without content (marked with comments)
  // - Flow edges: Navigation relationships between pages
  const buildFlowLive = async (code: string) => {
    console.log('[buildFlowLive] Starting flow build, code length:', code.length);
    setFlowBuilding(true);
    setFlowNodes([]);
    setFlowEdges([]);
    
    const addNode = async (node: ProductFlowNode) => {
      await new Promise(r => setTimeout(r, 30));
      setFlowNodes(prev => [...prev, node]);
    };
    
    const addEdge = async (edge: ProductFlowEdge) => {
      await new Promise(r => setTimeout(r, 15));
      setFlowEdges(prev => [...prev, edge]);
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: Detect CONFIRMED pages (Alpine.js x-show with actual content)
    // These are pages that were actually shown in the video
    // ═══════════════════════════════════════════════════════════════════════════
    
    interface DetectedPage {
      id: string;
      name: string;
      isConfirmed: boolean; // Has actual content (shown in video)
      hasContent: boolean;
      contentPreview?: string;
      isAddedByAI?: boolean; // Was this page added by Edit with AI?
    }
    
    const detectedPages: DetectedPage[] = [];
    const processedIds = new Set<string>();
    
    // Check if code has Alpine.js multi-page structure
    const hasAlpinePages = /x-show\s*=\s*["'](?:currentPage|page|activeTab|activeView)/i.test(code);
    console.log('[buildFlowLive] hasAlpinePages:', hasAlpinePages);
    
    // Pattern 1: Find ALL x-show page identifiers first
    const pageIdentifiers: string[] = [];
    const pageIdRegex = /x-show\s*=\s*["'](?:currentPage|page|activeTab|activeView)\s*===?\s*['"]([^'"]+)['"]/gi;
    let match;
    while ((match = pageIdRegex.exec(code)) !== null) {
      const pageId = match[1];
      if (!pageIdentifiers.includes(pageId)) {
        pageIdentifiers.push(pageId);
      }
    }
    console.log('[buildFlowLive] Found page identifiers:', pageIdentifiers);
    
    // For each page identifier, check if it has real content
    for (const pageId of pageIdentifiers) {
      const normalizedId = pageId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (processedIds.has(normalizedId)) continue;
      processedIds.add(normalizedId);
      
      // Look for the content of this page
      const contentRegex = new RegExp(
        `x-show\\s*=\\s*["'](?:currentPage|page|activeTab|activeView)\\s*===?\\s*['"]${pageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"][^>]*>([\\s\\S]*?)(?=<(?:main|div|section)[^>]*x-show\\s*=|</body>|$)`,
        'i'
      );
      const contentMatch = code.match(contentRegex);
      const content = contentMatch ? contentMatch[1] : '';
      
      // Check if has real content (not placeholder)
      const hasRealContent = content.length > 100 && 
                            !content.includes('Page not shown in video') &&
                            !content.includes('POSSIBLE:') &&
                            !content.includes('not yet created') &&
                            (/<(?:div|section|article|img|h[1-6]|p|ul|table|form)/i.test(content));
      
      const pageName = pageId
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      
      // Check if this page was added by AI (has our marker comment)
      const aiMarkerRegex = new RegExp(`<!--\\s*=+\\s*${pageId.toUpperCase()}\\s+PAGE\\s*=+\\s*-->`, 'i');
      const isAddedByAI = aiMarkerRegex.test(code);
      
      detectedPages.push({
        id: normalizedId,
        name: pageName,
        isConfirmed: hasRealContent,
        hasContent: hasRealContent,
        contentPreview: content.slice(0, 100),
        isAddedByAI
      });
    }
    
    // Pattern 2: Navigation buttons that set currentPage (to find pages we might have missed)
    const navButtonRegex = /@click\s*=\s*["'](?:currentPage|page|activeTab|activeView)\s*=\s*['"]([^'"]+)['"]/gi;
    while ((match = navButtonRegex.exec(code)) !== null) {
      const pageId = match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      if (processedIds.has(pageId)) continue;
      processedIds.add(pageId);
      
      // Check if this page has x-show content
      const hasXShow = new RegExp(`x-show\\s*=\\s*["'][^"']*${match[1]}`, 'i').test(code);
      
      detectedPages.push({
        id: pageId,
        name: match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        isConfirmed: hasXShow,
        hasContent: hasXShow
      });
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: Detect navigation items from sidebar/header/nav/tabs (POSSIBLE paths)
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Get navigation areas - look for nav, header, aside, sidebar, tabs sections
    const navAreaMatches = [
      ...(code.match(/<aside[^>]*>[\s\S]*?<\/aside>/gi) || []),
      ...(code.match(/<nav[^>]*>[\s\S]*?<\/nav>/gi) || []),
      ...(code.match(/<header[^>]*>[\s\S]*?<\/header>/gi) || []),
      ...(code.match(/<footer[^>]*>[\s\S]*?<\/footer>/gi) || []), // Footer often has nav links
      ...(code.match(/<div[^>]*class\s*=\s*["'][^"']*(?:sidebar|menu|navigation|nav-|topbar|tabs?|tab-)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi) || []),
      ...(code.match(/<ul[^>]*class\s*=\s*["'][^"']*(?:nav|menu|tabs?)[^"']*["'][^>]*>[\s\S]*?<\/ul>/gi) || []),
      // Also match role="tablist" and similar
      ...(code.match(/<[^>]*role\s*=\s*["'](?:tablist|navigation|menu)['""][^>]*>[\s\S]*?<\/[^>]+>/gi) || []),
    ];
    const navAreas = navAreaMatches.join(' ');
    
    // Also detect tabs/panels that might be page-like
    const tabPanelRegex = /(?:role\s*=\s*["']tabpanel["']|class\s*=\s*["'][^"']*tab-(?:panel|content|pane)[^"']*["'])[^>]*>/gi;
    const tabPanels = code.match(tabPanelRegex) || [];
    console.log('[buildFlowLive] Found tab panels:', tabPanels.length);
    
    // ALSO look in the ENTIRE code for @click navigation buttons
    // This catches Alpine.js navigation buttons anywhere in the page
    const alpineNavRegex = /@click\s*=\s*["'](?:currentPage|page|activeTab|activeView)\s*=\s*['"]([^'"]+)['"]['"]/gi;
    while ((match = alpineNavRegex.exec(code)) !== null) {
      const pageId = match[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (!processedIds.has(pageId)) {
        processedIds.add(pageId);
        // Check if this page has content
        const hasContent = new RegExp(`x-show\\s*=\\s*["'][^"']*${match[1]}`, 'i').test(code);
        if (!hasContent) {
          detectedPages.push({
            id: pageId,
            name: match[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            isConfirmed: false,
            hasContent: false
          });
        }
      }
    }
    
    // Extract navigation items (links and buttons) from nav areas
    // More comprehensive patterns to catch ALL sidebar items
    const navItemPatterns = [
      /<a[^>]*href\s*=\s*["'][^"']*["'][^>]*>([^<]{2,50})<\/a>/gi,
      /<a[^>]*>([^<]{2,50})<\/a>/gi, // Links without href
      /<button[^>]*>([^<]{2,50})<\/button>/gi,
      /<button[^>]*>(?:<[^>]*>)*([^<]{2,50})/gi, // Buttons with nested elements
      /<span[^>]*class\s*=\s*["'][^"']*(?:nav|menu|link|item)[^"']*["'][^>]*>([^<]{2,50})<\/span>/gi, // Spans with nav classes
      /<span[^>]*font-bold[^>]*>([^<]{2,50})<\/span>/gi, // Bold spans often used for nav
      /<li[^>]*>(?:<[^>]*>)*([^<]{2,50})/gi, // List items in nav
      /<div[^>]*class\s*=\s*["'][^"']*(?:nav-item|menu-item|sidebar-item)[^"']*["'][^>]*>([^<]{2,50})/gi,
      // Also look for text content between tags in nav
      />([A-ZŁŻŹĆŃ][A-ZŁŻŹĆŃ\s]{3,45})</gi, // Uppercase Polish text (likely nav items like SALDA BIEŻĄCE)
    ];
    
    // ALSO search the entire code for any Alpine.js click handlers that navigate
    const globalAlpineNavRegex = /@click\s*=\s*["'][^"']*(?:currentPage|page|activeTab)\s*=\s*['"]([^'"]+)['"]/gi;
    while ((match = globalAlpineNavRegex.exec(code)) !== null) {
      const pageId = match[1].trim();
      if (pageId && !processedIds.has(pageId.toLowerCase())) {
        const id = pageId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        processedIds.add(id);
        detectedPages.push({
          id,
          name: pageId.charAt(0).toUpperCase() + pageId.slice(1).replace(/-/g, ' '),
          isConfirmed: false,
          hasContent: false
        });
      }
    }
    
    for (const pattern of navItemPatterns) {
      pattern.lastIndex = 0;
      while ((match = pattern.exec(navAreas)) !== null) {
        let text = match[1].trim();
        
        // Clean up text - remove extra whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        // Filter out non-navigation items (less aggressive filtering)
        if (
          text.length < 2 ||
          text.length > 50 ||                // Allow longer Polish text
          /^\d+:\d+/.test(text) ||           // Time format "12:34"
          /^\d+\s*(tys|mln|K|M)/i.test(text) || // View counts
          /\.\.\.$/.test(text) ||            // Truncated text
          /^(więcej|more|less|mniej|see all|view all|expand|collapse)$/i.test(text) ||
          /^(submit|send|search|login|logout|wyloguj|zaloguj)$/i.test(text) ||
          /^\d+$/.test(text) ||              // Just numbers
          /^[\s\W]+$/.test(text) ||          // Only whitespace/symbols
          /^[<>\/]/.test(text)               // HTML artifacts
        ) continue;
        
        const id = text.toLowerCase().replace(/[^a-z0-9ąęłńóśźżć]+/g, '-').replace(/^-|-$/g, '');
        if (!id || id.length < 2 || processedIds.has(id)) continue;
        processedIds.add(id);
        
        detectedPages.push({
          id,
          name: text,
          isConfirmed: false, // Navigation item without confirmed page
          hasContent: false
        });
      }
    }
    
    console.log('[buildFlowLive] Total detected pages after nav extraction:', detectedPages.length);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: Check for POSSIBLE comments in code
    // Pattern: <!-- POSSIBLE: Page not shown in video -->
    // ═══════════════════════════════════════════════════════════════════════════
    
    const possibleCommentRegex = /<!--\s*POSSIBLE:\s*([^-]+)\s*-->/gi;
    while ((match = possibleCommentRegex.exec(code)) !== null) {
      const possiblePage = match[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const existing = detectedPages.find(p => p.id === possiblePage);
      if (existing) {
        existing.isConfirmed = false;
        existing.hasContent = false;
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: Detect structural components for Home page
    // ═══════════════════════════════════════════════════════════════════════════
    
    const mainComponents: string[] = [];
    
    if (/<header/i.test(code)) mainComponents.push("Header");
    if (/<aside|sidebar/i.test(code)) mainComponents.push("Sidebar");
    if (/<nav/i.test(code)) mainComponents.push("Navigation");
    if (/grid|cards?/i.test(code)) mainComponents.push("Content Grid");
    if (/<main/i.test(code)) mainComponents.push("Main Content");
    if (/<footer/i.test(code)) mainComponents.push("Footer");
    
    if (mainComponents.length === 0) mainComponents.push("Page Content");
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 5: Build Flow Map with CONFIRMED and POSSIBLE nodes
    // ═══════════════════════════════════════════════════════════════════════════
    
    const centerX = 400;
    let currentY = 60;
    const rowHeight = 160;
    const colWidth = 200;
    
    // Separate confirmed from possible pages
    let confirmedPages = detectedPages.filter(p => p.isConfirmed);
    const possiblePages = detectedPages.filter(p => !p.isConfirmed);
    
    // If we have generated code but no confirmed pages, the entire page is "Home" - CONFIRMED
    // This happens when there's no Alpine.js multi-page structure
    if (confirmedPages.length === 0 && code.length > 500) {
      confirmedPages = [{
        id: 'home',
        name: 'Home',
        isConfirmed: true,
        hasContent: true,
        isAddedByAI: false
      }];
    }
    
    // Make sure Home is in confirmed if it exists
    const homeInPossible = possiblePages.findIndex(p => p.id === 'home' || p.id === 'glowna' || p.id === 'main');
    if (homeInPossible >= 0) {
      const homePage = possiblePages.splice(homeInPossible, 1)[0];
      homePage.isConfirmed = true;
      homePage.hasContent = true;
      confirmedPages.unshift(homePage);
    }
    
    // Entry node (Home or first confirmed page)
    const entryPage = confirmedPages[0] || { id: 'home', name: 'Home', isConfirmed: true, hasContent: true, isAddedByAI: false };
    
    await addNode({
      id: entryPage.id,
      name: entryPage.name,
      type: "view",
      description: entryPage.isAddedByAI ? "Generated by AI based on site context" : "Shown and confirmed in the video recording",
      x: centerX,
      y: currentY,
      components: mainComponents,
      status: entryPage.isAddedByAI ? "added" : "observed",
      confidence: entryPage.isAddedByAI ? "medium" : "high"
    });
    
    currentY += rowHeight;
    
    // Add CONFIRMED pages (other than entry)
    const otherConfirmed = confirmedPages.filter(p => p.id !== entryPage.id);
    if (otherConfirmed.length > 0) {
      const startX = centerX - ((otherConfirmed.length - 1) * colWidth) / 2;
      
      for (let i = 0; i < otherConfirmed.length; i++) {
        const page = otherConfirmed[i];
        const x = startX + i * colWidth;
        
        await addNode({
          id: page.id,
          name: page.name,
          type: "view",
          description: page.isAddedByAI ? "Generated by AI based on site context" : "Shown and confirmed in the video recording",
          x: x,
          y: currentY,
          components: page.hasContent ? ["Content"] : [],
          status: page.isAddedByAI ? "added" : "observed",
          confidence: page.isAddedByAI ? "medium" : "high"
        });
        
        await addEdge({
          id: `${entryPage.id}-${page.id}`,
          from: entryPage.id,
          to: page.id,
          label: "Navigate",
          type: "navigation"
        });
      }
      
      currentY += rowHeight;
    }
    
    // Add POSSIBLE pages (navigation items not shown in video)
    // Use wider spacing to prevent overlap - nodes are ~200px wide
    if (possiblePages.length > 0) {
      // Show ALL possible pages, not just 8 - user wants full detection
      const displayItems = possiblePages.slice(0, 24); // Allow up to 24 items
      const nodeSpacing = 240; // Width of node + gap (prevents overlap)
      
      // Calculate how many can fit per row (max 5 per row for wider displays)
      const nodesPerRow = Math.min(5, Math.max(3, Math.ceil(displayItems.length / 4)));
      const totalRows = Math.ceil(displayItems.length / nodesPerRow);
      
      console.log('[buildFlowLive] Displaying', displayItems.length, 'possible pages in', totalRows, 'rows');
      
      for (let row = 0; row < totalRows; row++) {
        const rowItems = displayItems.slice(row * nodesPerRow, (row + 1) * nodesPerRow);
        const rowStartX = centerX - ((rowItems.length - 1) * nodeSpacing) / 2;
        
        for (let i = 0; i < rowItems.length; i++) {
          const page = rowItems[i];
          const x = rowStartX + i * nodeSpacing;
          const y = currentY + row * rowHeight;
          
          await addNode({
            id: page.id,
            name: page.name,
            type: "view",
            description: "Present in navigation, but not shown in video",
            x: x,
            y: y,
            components: [],
            status: "detected",
            confidence: "medium"
          });
          
          await addEdge({
            id: `${entryPage.id}-${page.id}`,
            from: entryPage.id,
            to: page.id,
            label: "Possible",
            type: "possible"
          });
        }
      }
      
      // Update currentY for any future nodes
      currentY += totalRows * rowHeight;
    }
    
    setFlowBuilding(false);
  };

  // Extract style info from code - with actual fonts and colors
  const extractStyleInfo = (code: string): StyleInfo => {
    const colors: { name: string; value: string }[] = [];
    
    // Extract hex colors
    const hexMatches = code.match(/#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}/g) || [];
    // Extract rgb/rgba colors
    const rgbMatches = code.match(/rgba?\([^)]+\)/g) || [];
    
    // Prioritize actual color values, filter out common neutrals at the end
    const allColors = [...hexMatches, ...rgbMatches];
    const neutrals = ['#fff', '#ffffff', '#000', '#000000', '#fff', 'rgba(0', 'rgb(0', 'rgba(255', 'rgb(255'];
    
    const colorFrequency = new Map<string, number>();
    allColors.forEach(c => {
      const normalized = c.toLowerCase();
      colorFrequency.set(normalized, (colorFrequency.get(normalized) || 0) + 1);
    });
    
    // Sort by frequency and filter out pure black/white
    const sortedColors = [...colorFrequency.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(([c]) => !neutrals.some(n => c.startsWith(n)))
      .slice(0, 4);
    
    // Add back black/white at end if space
    const finalColors = sortedColors.map(([c]) => c);
    if (finalColors.length < 6 && hexMatches.some(c => c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#fff')) {
      finalColors.push('#ffffff');
    }
    if (finalColors.length < 6 && hexMatches.some(c => c.toLowerCase() === '#000000' || c.toLowerCase() === '#000')) {
      finalColors.push('#000000');
    }
    
    finalColors.slice(0, 6).forEach((c, i) => {
      const names = ["Primary", "Secondary", "Accent", "Background", "Text", "Border"];
      colors.push({ name: names[i] || `Color ${i + 1}`, value: c });
    });
    
    // If no colors found, use defaults
    if (colors.length === 0) {
      colors.push({ name: "Primary", value: "#6366f1" });
      colors.push({ name: "Background", value: "#ffffff" });
    }
    
    const fonts: { name: string; usage: string; weight: string; family: string }[] = [];
    
    // Extract actual font families from code
    const fontFamilyMatch = code.match(/font-family:\s*['"]?([^'";,]+)/gi) || [];
    const googleFontsMatch = code.match(/family=([^&:]+)/gi) || [];
    
    const detectedFonts = new Set<string>();
    
    fontFamilyMatch.forEach(f => {
      const name = f.replace(/font-family:\s*['"]?/i, '').trim();
      if (name && !name.includes('sans-serif') && !name.includes('system') && name.length < 30) {
        detectedFonts.add(name);
      }
    });
    
    googleFontsMatch.forEach(f => {
      const name = f.replace(/family=/i, '').replace(/\+/g, ' ').split(':')[0].trim();
      if (name && name.length < 30) detectedFonts.add(name);
    });
    
    // Check for common font names in code
    const commonFonts = ["Inter", "Space Grotesk", "Poppins", "Roboto", "Open Sans", "Montserrat", "Nunito", "Lato", "Raleway", "Playfair Display"];
    commonFonts.forEach(font => {
      if (code.includes(font)) detectedFonts.add(font);
    });
    
    Array.from(detectedFonts).slice(0, 4).forEach((font, i) => {
      fonts.push({ 
        name: font, 
        usage: i === 0 ? "Primary font" : i === 1 ? "Secondary font" : "Accent font",
        weight: "400-700",
        family: `'${font}', sans-serif`
      });
    });
    
    if (fonts.length === 0) {
      fonts.push({ name: "System UI", usage: "Default", weight: "400", family: "system-ui, sans-serif" });
    }
    
    return {
      colors,
      fonts,
      spacing: code.includes("gap-") || code.includes("space-") ? "Tailwind spacing scale" : "Custom spacing",
      borderRadius: code.includes("rounded-xl") || code.includes("rounded-2xl") ? "Large (12-16px)" : code.includes("rounded-lg") ? "Medium (8px)" : "Small (4px)",
      shadows: code.includes("shadow-xl") || code.includes("shadow-2xl") ? "Prominent shadows" : code.includes("shadow") ? "Subtle shadows" : "Minimal shadows"
    };
  };

  // Generate file structure from code based on Structure/Flow nodes
  // Supports both single-file (HTML) and componentized (TSX) modes
  const generateFileStructure = useCallback((code: string, nodes: ProductFlowNode[], mode: CodeMode): FileNode[] => {
    const files: FileNode[] = [];
    
    // Extract Alpine.js pages from the code - IMPROVED detection
    const extractAlpinePages = (): { id: string; name: string; content: string; isConfirmed: boolean }[] => {
      const pages: { id: string; name: string; content: string; isConfirmed: boolean }[] = [];
      const processedIds = new Set<string>();
      
      // First find all page identifiers
      const pageIdRegex = /x-show\s*=\s*["'](?:currentPage|page|activeTab|activeView)\s*===?\s*['"]([^'"]+)['"]/gi;
      const pageIdentifiers: string[] = [];
      let match;
      
      while ((match = pageIdRegex.exec(code)) !== null) {
        if (!pageIdentifiers.includes(match[1])) {
          pageIdentifiers.push(match[1]);
        }
      }
      
      // For each identifier, extract its content
      for (const pageId of pageIdentifiers) {
        const normalizedId = pageId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (processedIds.has(normalizedId)) continue;
        processedIds.add(normalizedId);
        
        // Look for the content - find the element with x-show and get its innerHTML
        const escapedPageId = pageId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const contentRegex = new RegExp(
          `<(?:main|div|section)[^>]*x-show\\s*=\\s*["'](?:currentPage|page|activeTab|activeView)\\s*===?\\s*['"]${escapedPageId}['"][^>]*>([\\s\\S]*?)(?=<(?:main|div|section)[^>]*x-show\\s*=|</body>|$)`,
          'i'
        );
        const contentMatch = code.match(contentRegex);
        const content = contentMatch ? contentMatch[0] : '';
        
        const isConfirmed = content.length > 100 && 
                           !content.includes('POSSIBLE:') && 
                           !content.includes('Page not shown in video') &&
                           !content.includes('not yet created');
        
        pages.push({
          id: normalizedId,
          name: pageId.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          content: content,
          isConfirmed
        });
      }
      
      return pages;
    };
    
    const detectedPages = extractAlpinePages();
    const confirmedPages = detectedPages.filter(p => p.isConfirmed);
    
    if (mode === "single-file") {
      // Single-file mode: main HTML file with all pages in one file
      files.push({
        path: "/pages/index.html",
        name: "index.html",
        content: code,
        type: "page",
        language: "html",
        sourceNodeId: "home",
        lineCount: code.split('\n').length
      });
      
      // Show confirmed pages as indicators in file tree (but they're in main file)
      confirmedPages.forEach(page => {
        if (page.id !== 'home' && page.id !== 'glowna' && page.id !== 'main') {
          files.push({
            path: `/pages/${page.id}.html`,
            name: `${page.id}.html`,
            content: `<!-- This page is embedded in index.html as Alpine.js view: ${page.name} -->
<!-- To view, look for: x-show="currentPage === '${page.id}'" in index.html -->
${page.content}`,
            type: "page",
            language: "html",
            sourceNodeId: page.id,
            lineCount: page.content.split('\n').length
          });
        }
      });
      
      // Only add stub files for detected/possible pages (not observed yet)
      nodes.filter(n => (n.status === "detected" || n.status === "possible") && n.type === "view").forEach(node => {
        // Don't add stub if we already have this page
        if (files.some(f => f.sourceNodeId === node.id)) return;
        
        const stubContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${node.name}</title>
</head>
<body>
  <!-- POSSIBLE: This page was in navigation but not shown in video -->
  <div class="min-h-screen bg-gray-900 text-white flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-3xl font-bold mb-4">${node.name}</h1>
      <p class="text-gray-400">Page not yet created. Click "Create" to generate this page.</p>
    </div>
  </div>
</body>
</html>`;
        files.push({
          path: `/pages/${node.id}.html`,
          name: `${node.id}.html`,
          content: stubContent,
          type: "stub",
          language: "html",
          sourceNodeId: node.id,
          isStub: true,
          lineCount: stubContent.split('\n').length
        });
      });
    } else {
      // Componentized mode: Create proper Next.js pages from detected Alpine.js pages
      const homeNode = nodes.find(n => n.id === "home" || n.id === "dashboard");
      const components = homeNode?.components || [];
      const componentFiles: FileNode[] = [];
      
      // Extract body content from full HTML
      const bodyMatch = code.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const fullBodyContent = bodyMatch ? bodyMatch[1] : code;
      
      // Also detect all Alpine.js pages in the code
      const alpinePageRegex = /x-show\s*=\s*["'](?:currentPage|page|activeTab|activeView)\s*===?\s*['"]([^'"]+)['"][^>]*>([\s\S]*?)(?=<(?:main|div|section)[^>]*x-show\s*=|<\/body>)/gi;
      const detectedAlpinePages: { id: string; name: string; content: string }[] = [];
      let alpineMatch;
      while ((alpineMatch = alpinePageRegex.exec(code)) !== null) {
        const pageId = alpineMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const pageName = alpineMatch[1].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const content = alpineMatch[0];
        // Include pages with actual content
        if (content.length > 100 && !content.includes('POSSIBLE:') && !content.includes('not shown in video')) {
          detectedAlpinePages.push({ id: pageId, name: pageName, content });
        }
      }
      
      console.log('[generateFileStructure] Detected Alpine pages:', detectedAlpinePages.map(p => p.id));
      
      // Better extraction patterns for actual HTML sections
      const extractComponent = (compName: string): string => {
        const compId = compName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const compNameClean = compName.toLowerCase();
        
        let extracted = '';
        
        // 1. Try to find semantic HTML elements directly
        if (compNameClean.includes('navigation') || compNameClean.includes('nav') || compNameClean.includes('sidebar')) {
          // Try nav first, then aside (sidebar)
          const navMatch = code.match(/<nav[^>]*>[\s\S]*?<\/nav>/i);
          const asideMatch = code.match(/<aside[^>]*>[\s\S]*?<\/aside>/i);
          extracted = navMatch?.[0] || asideMatch?.[0] || '';
        } else if (compNameClean.includes('header')) {
          const headerMatch = code.match(/<header[^>]*>[\s\S]*?<\/header>/i);
          extracted = headerMatch?.[0] || '';
        } else if (compNameClean.includes('footer')) {
          const footerMatch = code.match(/<footer[^>]*>[\s\S]*?<\/footer>/i);
          extracted = footerMatch?.[0] || '';
        } else if (compNameClean.includes('hero')) {
          // Hero is usually first section or div with hero class
          const heroMatch = code.match(/<section[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/section>/i) ||
                          code.match(/<div[^>]*class="[^"]*hero[^"]*"[^>]*>[\s\S]*?<\/div>/i) ||
                          code.match(/<section[^>]*>[\s\S]*?<\/section>/i); // First section as fallback
          extracted = heroMatch?.[0] || '';
        } else if (compNameClean.includes('main') || compNameClean.includes('content')) {
          const mainMatch = code.match(/<main[^>]*>[\s\S]*?<\/main>/i);
          extracted = mainMatch?.[0] || '';
        } else if (compNameClean.includes('grid') || compNameClean.includes('card')) {
          // Look for grid/card containers
          const gridMatch = code.match(/<div[^>]*class="[^"]*(?:grid|cards)[^"]*"[^>]*>[\s\S]*?<\/div>/i);
          extracted = gridMatch?.[0] || '';
        } else if (compNameClean.includes('section')) {
          // Get all sections
          const sectionMatches = code.match(/<section[^>]*>[\s\S]*?<\/section>/gi) || [];
          extracted = sectionMatches.join('\n\n');
        } else {
          // 2. Try to find element with matching ID or class
          const patterns = [
            new RegExp(`<section[^>]*id="[^"]*${compId}[^"]*"[^>]*>[\\s\\S]*?</section>`, 'i'),
            new RegExp(`<section[^>]*class="[^"]*${compId}[^"]*"[^>]*>[\\s\\S]*?</section>`, 'i'),
            new RegExp(`<div[^>]*id="[^"]*${compId}[^"]*"[^>]*>[\\s\\S]*?</div>`, 'i'),
            new RegExp(`<div[^>]*class="[^"]*${compId}[^"]*"[^>]*>[\\s\\S]*?</div>`, 'i'),
          ];
          
          for (const pattern of patterns) {
            const match = code.match(pattern);
            if (match) {
              extracted = match[0];
              break;
            }
          }
          
          // 3. Try to find a section that contains a heading with this name
          if (!extracted) {
            const sectionRegex = /<section[^>]*>([\s\S]*?)<\/section>/gi;
            let match;
            while ((match = sectionRegex.exec(code)) !== null) {
              const sectionContent = match[0];
              // Check if section contains heading with component name (case insensitive)
              const nameWords = compName.split(/\s+/).filter(w => w.length > 2);
              const hasMatch = nameWords.some(word => 
                new RegExp(`<h[1-3][^>]*>[^<]*${word}[^<]*</h[1-3]>`, 'i').test(sectionContent)
              );
              if (hasMatch) {
                extracted = sectionContent;
                break;
              }
            }
          }
        }
        
        // If still nothing, return a meaningful placeholder
        if (!extracted) {
          return `<!-- ${compName}: Component content not found in generated HTML -->
<div class="${compId}">
  <!-- This component could not be automatically extracted -->
  <!-- The original HTML may not have a distinct section for "${compName}" -->
</div>`;
        }
        
        return extracted;
      };
      
      // Extract each component
      components.forEach((compName) => {
        const compId = compName.toLowerCase().replace(/\s+/g, '-');
        const componentContent = extractComponent(compName);
        
        const folder = compName.toLowerCase().includes('header') || 
                      compName.toLowerCase().includes('footer') || 
                      compName.toLowerCase().includes('navigation') ||
                      compName.toLowerCase().includes('nav')
          ? 'layout' 
          : 'sections';
        
        const reactComponent = wrapAsReactComponent(compName, componentContent);
        
        componentFiles.push({
          path: `/components/${folder}/${compId}.tsx`,
          name: `${compId}.tsx`,
          content: reactComponent,
          type: "component",
          language: "tsx",
          sourceNodeId: "home",
          lineCount: reactComponent.split('\n').length
        });
      });
      
      // Main page file - use first detected page or full body content
      const mainPageId = detectedAlpinePages.length > 0 ? detectedAlpinePages[0].id : 'home';
      const mainPageContent = detectedAlpinePages.length > 0 
        ? wrapAsReactComponent(detectedAlpinePages[0].name, detectedAlpinePages[0].content)
        : generateMainPageFile(components, fullBodyContent);
      
      files.push({
        path: "/pages/index.tsx",
        name: "index.tsx",
        content: mainPageContent,
        type: "page",
        language: "tsx",
        sourceNodeId: mainPageId,
        lineCount: mainPageContent.split('\n').length
      });
      
      // Add page files for all detected Alpine.js pages (skip first one as it's index)
      detectedAlpinePages.slice(1).forEach(page => {
        // Skip home/main/index as we already have that
        if (page.id === 'home' || page.id === 'glowna' || page.id === 'main' || page.id === 'index') return;
        
        const pageComponent = wrapAsReactComponent(page.name, page.content);
        files.push({
          path: `/pages/${page.id}.tsx`,
          name: `${page.id}.tsx`,
          content: pageComponent,
          type: "page",
          language: "tsx",
          sourceNodeId: page.id,
          lineCount: pageComponent.split('\n').length
        });
      });
      
      // Also add pages from flow nodes that are observed
      nodes.filter(n => n.status === "observed" && n.type === "view")
        .forEach(node => {
          // Skip if we already have this page
          if (files.some(f => f.sourceNodeId === node.id)) return;
          // Skip generic home/index
          if (node.id === 'home' || node.id === 'index' || node.id === 'main') return;
          
          // Try to extract content for this page from the code using multiple patterns
          const patterns = [
            new RegExp(`x-show\\s*=\\s*["'][^"']*${node.id}[^"']*["'][^>]*>([\\s\\S]*?)(?=<(?:main|div|section)[^>]*x-show|<\\/body>)`, 'i'),
            new RegExp(`x-show\\s*=\\s*["']currentPage\\s*===?\\s*['"]${node.id}["'][^>]*>([\\s\\S]*?)(?=<(?:main|div|section)[^>]*x-show|<\\/body>)`, 'i'),
          ];
          
          let content = '';
          for (const pattern of patterns) {
            const match = code.match(pattern);
            if (match && match[0].length > 100) {
              content = match[0];
              break;
            }
          }
          
          // If no content found, create a proper placeholder
          if (!content || content.length < 100) {
            content = `<main className="min-h-screen bg-gray-50">
              <div className="container mx-auto px-4 py-16">
                <h1 className="text-4xl font-bold mb-8">${node.name}</h1>
                <p className="text-gray-600">This page content was not captured in the video.</p>
              </div>
            </main>`;
          }
          
          const pageComponent = wrapAsReactComponent(node.name, content);
          files.push({
            path: `/pages/${node.id}.tsx`,
            name: `${node.id}.tsx`,
            content: pageComponent,
            type: "page",
            language: "tsx",
            sourceNodeId: node.id,
            lineCount: pageComponent.split('\n').length
          });
        });
      
      // Extract and add layout components (Header, Sidebar, Navigation, Footer)
      const layoutComponents: { name: string; selector: RegExp; path: string }[] = [
        { name: 'Header', selector: /<header[^>]*>[\s\S]*?<\/header>/i, path: '/components/layout/Header.tsx' },
        { name: 'Sidebar', selector: /<aside[^>]*>[\s\S]*?<\/aside>/i, path: '/components/layout/Sidebar.tsx' },
        { name: 'Navigation', selector: /<nav[^>]*>[\s\S]*?<\/nav>/i, path: '/components/layout/Navigation.tsx' },
        { name: 'Footer', selector: /<footer[^>]*>[\s\S]*?<\/footer>/i, path: '/components/layout/Footer.tsx' },
      ];
      
      layoutComponents.forEach(({ name, selector, path }) => {
        const match = code.match(selector);
        if (match && match[0].length > 50) {
          const componentContent = wrapAsReactComponent(name, match[0]);
          files.push({
            path,
            name: `${name}.tsx`,
            content: componentContent,
            type: "component",
            language: "tsx",
            sourceNodeId: "layout",
            lineCount: componentContent.split('\n').length
          });
        }
      });
      
      files.push(...componentFiles);
      
      // Add layout wrapper for Next.js App Router
      const layoutContent = `// Next.js App Router Layout
import './globals.css';

export const metadata = {
  title: 'Generated App',
  description: 'Generated by Replay from video',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}`;
      
      files.push({
        path: "/app/layout.tsx",
        name: "layout.tsx",
        content: layoutContent,
        type: "component",
        language: "tsx",
        lineCount: layoutContent.split('\n').length
      });
      
      // Add tokens file
      const tokensContent = generateTokensFile(extractStyleInfo(code));
      files.push({
        path: "/styles/tokens.ts",
        name: "tokens.ts",
        content: tokensContent,
        type: "style",
        language: "ts",
        lineCount: tokensContent.split('\n').length
      });
      
      // Add globals.css with extracted styles
      const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const extractedStyles = styleMatch ? styleMatch[1] : '';
      const globalsCss = `/* Generated styles from video analysis */
@tailwind base;
@tailwind components;
@tailwind utilities;

${extractedStyles}
`;
      files.push({
        path: "/app/globals.css",
        name: "globals.css",
        content: globalsCss,
        type: "style",
        language: "css",
        lineCount: globalsCss.split('\n').length
      });
    }
    
    return files;
  }, []);
  
  // Helper: Convert HTML to JSX (comprehensive conversion)
  const htmlToJsx = (html: string): string => {
    return html
      // STEP 1: Remove Vue/Alpine template wrappers - replace with content
      .replace(/<template\s+:key="[^"]*">\s*/gi, '{/* ')
      .replace(/<template\s+v-for="[^"]*">\s*/gi, '{/* ')
      .replace(/<template>\s*/gi, '')
      .replace(/\s*<\/template>/gi, ' */}')
      // STEP 2: Convert Vue :key to React key
      .replace(/:key=/g, 'key=')
      // STEP 3: Convert Vue :className to className (dynamic)
      .replace(/:className="([^"]*)"/g, 'className={$1}')
      // STEP 4: Convert Vue :class to className (dynamic)
      .replace(/:class="([^"]*)"/g, 'className={$1}')
      // STEP 5: Convert regular class to className
      .replace(/\bclass=/g, 'className=')
      // STEP 6: Convert for to htmlFor
      .replace(/\bfor=/g, 'htmlFor=')
      // STEP 7: Self-closing tags
      .replace(/<(img|input|br|hr|meta|link)([^>]*)(?<!\/)>/gi, '<$1$2 />')
      // STEP 8: Convert inline style strings to objects
      .replace(/style="([^"]*)"/g, (match, style) => {
        if (!style.trim()) return 'style={{}}';
        const jsStyle = style.split(';')
          .filter((s: string) => s.trim())
          .map((s: string) => {
            const colonIndex = s.indexOf(':');
            if (colonIndex === -1) return '';
            const prop = s.substring(0, colonIndex).trim();
            const val = s.substring(colonIndex + 1).trim();
            const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
            // Handle numeric values
            const isNumeric = !isNaN(parseFloat(val)) && !val.includes('px') && !val.includes('%') && !val.includes('em');
            const formattedVal = isNumeric ? val : `'${val.replace(/'/g, "\\'")}'`;
            return `${camelProp}: ${formattedVal}`;
          })
          .filter(Boolean)
          .join(', ');
        return `style={{ ${jsStyle} }}`;
      })
      // STEP 9: Remove Alpine.js x-* attributes
      .replace(/\s*x-[a-z-]+="[^"]*"/gi, '')
      .replace(/\s*x-[a-z-]+/gi, '')
      // STEP 10: Remove Alpine @ event handlers
      .replace(/\s*@[a-z.]+="[^"]*"/gi, '')
      // STEP 11: Remove Vue v-* directives
      .replace(/\s*v-[a-z-]+="[^"]*"/gi, '')
      .replace(/\s*v-[a-z-]+/gi, '')
      // STEP 12: Remove inline onclick/onmouseover etc
      .replace(/\s*on[a-z]+="[^"]*"/gi, '')
      // STEP 13: Convert tabindex to tabIndex
      .replace(/\btabindex=/gi, 'tabIndex=')
      // STEP 14: Convert colspan/rowspan
      .replace(/\bcolspan=/gi, 'colSpan=')
      .replace(/\browspan=/gi, 'rowSpan=')
      // STEP 15: Convert maxlength, minlength
      .replace(/\bmaxlength=/gi, 'maxLength=')
      .replace(/\bminlength=/gi, 'minLength=')
      // STEP 16: Convert autocomplete
      .replace(/\bautocomplete=/gi, 'autoComplete=')
      // STEP 17: Convert autofocus
      .replace(/\bautofocus/gi, 'autoFocus')
      // STEP 18: Clean up escaped characters
      .replace(/`/g, "'")
      // STEP 19: Remove HTML comments
      .replace(/<!--[\s\S]*?-->/g, '')
      // STEP 20: Remove any remaining :attr Vue syntax
      .replace(/\s*:[a-z-]+="[^"]*"/gi, '')
      .trim();
  };

  // Helper: Wrap HTML content as React component (proper JSX)
  const wrapAsReactComponent = (name: string, htmlContent: string): string => {
    const componentName = name.replace(/[^a-zA-Z0-9]/g, '');
    
    // Convert HTML to JSX
    const jsxContent = htmlToJsx(htmlContent);
    
    // If content is just a comment (not extracted), create a placeholder
    if (jsxContent.startsWith('<!--') && jsxContent.length < 100) {
      return `export default function ${componentName}Page() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-8">${name}</h1>
        {/* Content will be generated here */}
      </div>
    </main>
  );
}`;
    }
    
    // For pages with actual content, wrap properly
    return `export default function ${componentName}Page() {
  return (
    <>
      ${jsxContent}
    </>
  );
}`;
  };
  
  // Helper: Generate main page file for Next.js App Router
  const generateMainPageFile = (components: string[], fullHtmlContent?: string): string => {
    // If we have full HTML content, convert it to JSX for the main page
    if (fullHtmlContent) {
      const jsxContent = htmlToJsx(fullHtmlContent);
      
      // Extract body content only (between <body> and </body>)
      const bodyMatch = jsxContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const bodyContent = bodyMatch ? bodyMatch[1].trim() : jsxContent;
      
      return `// Next.js App Router Page
// Generated by Replay from video analysis

export default function HomePage() {
  return (
    <>
      ${bodyContent}
    </>
  );
}`;
    }
    
    // Fallback: Generate with component imports
    if (components.length === 0) {
      return `// Next.js App Router Page
// Generated by Replay

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Page content - switch to Single-file view to see full HTML */}
    </main>
  );
}`;
    }
    
    const imports = components.map(comp => {
      const compName = comp.replace(/\s+/g, '');
      const compId = comp.toLowerCase().replace(/\s+/g, '-');
      const folder = comp.toLowerCase().includes('header') || comp.toLowerCase().includes('footer') || comp.toLowerCase().includes('navigation') 
        ? 'layout' 
        : 'sections';
      return `import ${compName} from '@/components/${folder}/${compId}';`;
    }).join('\n');
    
    const componentUsage = components.map(comp => {
      const compName = comp.replace(/\s+/g, '');
      return `      <${compName} />`;
    }).join('\n');
    
    return `// Next.js App Router Page
${imports}

export default function HomePage() {
  return (
    <main className="min-h-screen">
${componentUsage}
    </main>
  );
}`;
  };
  
  // Helper: Generate tokens file from style info
  const generateTokensFile = (style: StyleInfo): string => {
    const colorTokens = style.colors.map(c => `  '${c.name.toLowerCase()}': '${c.value}',`).join('\n');
    const fontTokens = style.fonts.map(f => `  '${f.name.toLowerCase().replace(/\s+/g, '-')}': '${f.family}',`).join('\n');
    
    return `// Design System Tokens
// Generated from video analysis

export const colors = {
${colorTokens}
};

export const fonts = {
${fontTokens}
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
};

export const borderRadius = {
  sm: '0.25rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
};
`;
  };
  
  // ===========================================
  // AGENT MODE - Generate AI-enhanced code pack
  // ===========================================
  
  // Generate Agent Pack instructions for Cursor/v0
  const generateAgentInstructions = useCallback((projectName: string, nodes: ProductFlowNode[]): string => {
    const pages = nodes.filter(n => n.type === "view");
    const components = nodes.flatMap(n => n.components || []);
    
    return `/*
╔══════════════════════════════════════════════════════════════════════════════╗
║                           REPLAY AGENT PACK                                   ║
║                    AI-Optimized Code Context for Cursor/v0                   ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 PROJECT: ${projectName || 'Untitled Project'}
🔧 GENERATED BY: Replay (https://replay.build)
📅 DATE: ${new Date().toLocaleDateString()}

═══════════════════════════════════════════════════════════════════════════════
                              QUICK START GUIDE
═══════════════════════════════════════════════════════════════════════════════

This code was reconstructed from a video recording by Replay AI. It includes:
• Full HTML/CSS layout with Tailwind styling
• Alpine.js for interactivity and page navigation
• Responsive design patterns
• All visible UI components from the video

🎯 HOW TO USE IN CURSOR:
1. Paste this entire file into your project
2. Ask Cursor: "Convert this to React/Next.js components"
3. Or ask: "Add [feature] to the [section]"
4. Or ask: "Change the color scheme to [theme]"

═══════════════════════════════════════════════════════════════════════════════
                              PAGE STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

${pages.map(p => '• ' + p.name + ' (' + (p.status === 'observed' ? '✅ Observed in video' : '⚠️ Detected in navigation') + ')').join('\n')}

═══════════════════════════════════════════════════════════════════════════════
                              COMPONENTS
═══════════════════════════════════════════════════════════════════════════════

${components.length > 0 ? components.map(c => '• ' + c).join('\n') : '• See inline comments for component boundaries'}

═══════════════════════════════════════════════════════════════════════════════
                              AI CONTEXT MARKERS
═══════════════════════════════════════════════════════════════════════════════

Look for these markers in the code:
• <!-- COMPONENT: Name --> = Component boundary
• <!-- PAGE: Name --> = Page/view boundary  
• <!-- INTERACTIVE --> = Has click/hover behavior
• <!-- RESPONSIVE --> = Has mobile breakpoints
• <!-- NAVIGATION --> = Links to other pages

═══════════════════════════════════════════════════════════════════════════════
                              EXAMPLE PROMPTS FOR AI
═══════════════════════════════════════════════════════════════════════════════

Try these prompts in Cursor or v0:

1. "Extract the header into a reusable React component"
2. "Add a dark mode toggle that persists to localStorage"
3. "Convert the Alpine.js navigation to React Router"
4. "Add form validation to the contact form"
5. "Make the cards grid display 2 columns on mobile"
6. "Add smooth scroll animations on page load"
7. "Connect this to Supabase and fetch real data"

═══════════════════════════════════════════════════════════════════════════════
*/

`;
  }, []);
  
  // Enhance code with AI context comments
  const enhanceCodeWithAgentContext = useCallback((code: string): string => {
    let enhanced = code;
    
    // Add component boundary markers
    enhanced = enhanced
      // Mark header
      .replace(/<header([^>]*)>/gi, '<!-- COMPONENT: Header -->\n<header$1>')
      // Mark navigation
      .replace(/<nav([^>]*)>/gi, '<!-- COMPONENT: Navigation -->\n<nav$1>')
      // Mark footer  
      .replace(/<footer([^>]*)>/gi, '<!-- COMPONENT: Footer -->\n<footer$1>')
      // Mark aside/sidebar
      .replace(/<aside([^>]*)>/gi, '<!-- COMPONENT: Sidebar -->\n<aside$1>')
      // Mark main content
      .replace(/<main([^>]*)>/gi, '<!-- COMPONENT: MainContent -->\n<main$1>')
      // Mark forms
      .replace(/<form([^>]*)>/gi, '<!-- COMPONENT: Form - Add validation here -->\n<!-- INTERACTIVE -->\n<form$1>')
      // Mark buttons with actions
      .replace(/<button([^>]*@click[^>]*)>/gi, '<!-- INTERACTIVE -->\n<button$1>')
      // Mark links that navigate
      .replace(/@click="currentPage\s*=\s*'([^']+)'"/gi, '@click="currentPage=\'$1\'" <!-- NAVIGATION: to $1 -->')
      // Mark Alpine.js page views
      .replace(/x-show="currentPage\s*===?\s*'([^']+)'"/gi, 'x-show="currentPage===\'$1\'" <!-- PAGE: $1 -->');
    
    // Add section markers for common patterns
    const sectionPatterns = [
      { pattern: /<section([^>]*class="[^"]*hero[^"]*"[^>]*)>/gi, marker: '<!-- SECTION: Hero -->\n' },
      { pattern: /<section([^>]*class="[^"]*features?[^"]*"[^>]*)>/gi, marker: '<!-- SECTION: Features -->\n' },
      { pattern: /<section([^>]*class="[^"]*pricing[^"]*"[^>]*)>/gi, marker: '<!-- SECTION: Pricing -->\n' },
      { pattern: /<section([^>]*class="[^"]*testimonials?[^"]*"[^>]*)>/gi, marker: '<!-- SECTION: Testimonials -->\n' },
      { pattern: /<section([^>]*class="[^"]*faq[^"]*"[^>]*)>/gi, marker: '<!-- SECTION: FAQ -->\n' },
      { pattern: /<section([^>]*class="[^"]*contact[^"]*"[^>]*)>/gi, marker: '<!-- SECTION: Contact -->\n' },
      { pattern: /<section([^>]*class="[^"]*cta[^"]*"[^>]*)>/gi, marker: '<!-- SECTION: CTA -->\n' },
    ];
    
    sectionPatterns.forEach(({ pattern, marker }) => {
      enhanced = enhanced.replace(pattern, marker + '<section$1>');
    });
    
    return enhanced;
  }, []);
  
  // Get code content with optional Agent Mode enhancements
  const getAgentPackCode = useCallback((code: string): string => {
    if (!agentMode) return code;
    
    const instructions = generateAgentInstructions(generationTitle, flowNodes);
    const enhancedCode = enhanceCodeWithAgentContext(code);
    
    return instructions + enhancedCode;
  }, [agentMode, generationTitle, flowNodes, generateAgentInstructions, enhanceCodeWithAgentContext]);
  
  // Build file tree structure from files
  const buildFileTree = useCallback((files: FileNode[]): (FileTreeFolder | FileTreeFile)[] => {
    const root: Map<string, FileTreeFolder | FileTreeFile> = new Map();
    const folders: Map<string, FileTreeFolder> = new Map();
    
    // Create folders
    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean);
      let currentPath = '';
      
      parts.slice(0, -1).forEach(part => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : `/${part}`;
        
        if (!folders.has(currentPath)) {
          const folder: FileTreeFolder = {
            name: part,
            path: currentPath,
            type: "folder",
            children: [],
            expanded: expandedFolders.has(currentPath)
          };
          folders.set(currentPath, folder);
          
          if (parentPath) {
            const parent = folders.get(parentPath);
            if (parent) {
              parent.children.push(folder);
            }
          }
        }
      });
    });
    
    // Add files to their folders
    files.forEach(file => {
      const parts = file.path.split('/').filter(Boolean);
      const folderPath = '/' + parts.slice(0, -1).join('/');
      const folder = folders.get(folderPath);
      
      const fileNode: FileTreeFile = {
        name: file.name,
        path: file.path,
        type: "file",
        fileType: file.type,
        isStub: file.isStub,
        sourceNodeId: file.sourceNodeId
      };
      
      if (folder) {
        folder.children.push(fileNode);
      }
    });
    
    // Get root level folders
    const rootFolders: (FileTreeFolder | FileTreeFile)[] = [];
    folders.forEach((folder, path) => {
      if (path.split('/').filter(Boolean).length === 1) {
        rootFolders.push(folder);
      }
    });
    
    return rootFolders.sort((a, b) => {
      const order = { pages: 1, components: 2, styles: 3, types: 4 };
      return (order[a.name as keyof typeof order] || 99) - (order[b.name as keyof typeof order] || 99);
    });
  }, [expandedFolders]);
  
  // Get active file content
  const getActiveFileContent = useCallback((): string => {
    // First, try to find the file in generatedFiles
    const file = generatedFiles.find(f => f.path === activeFilePath);
    if (file && file.content) return file.content;
    
    // Fallback to displayedCode for the main HTML file
    if (activeFilePath === "/pages/index.html" || activeFilePath === "/pages/index.tsx") {
      return displayedCode;
    }
    
    return displayedCode;
  }, [generatedFiles, activeFilePath, displayedCode]);
  
  // Handle node click from Flow - focus on corresponding code
  const handleFlowNodeCodeFocus = useCallback((nodeId: string) => {
    setViewMode("code");
    
    // Find file for this node
    const file = generatedFiles.find(f => f.sourceNodeId === nodeId);
    if (file) {
      setActiveFilePath(file.path);
      
      // Find reference map entry
      const ref = codeReferenceMap.find(r => r.nodeId === nodeId);
      if (ref) {
        setHighlightedLines({ start: ref.startLine, end: ref.endLine });
        // Clear highlight after 3 seconds
        setTimeout(() => setHighlightedLines(null), 3000);
      }
    } else if (nodeId !== "home") {
      // Node is possible but not built - set up AI edit
      // Only if not currently editing
      if (isEditing) return;
      const node = flowNodes.find(n => n.id === nodeId);
      if (node) {
        setEditInput(`@${node.name} Create this page with full content and layout`);
        setShowFloatingEdit(true);
      }
    }
  }, [generatedFiles, codeReferenceMap, flowNodes]);
  
  // Toggle folder expansion
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);
  
  // Generate a suggested flow node extension - directly adds to flow and triggers AI
  const suggestFlowExtension = (fromNode: ProductFlowNode, actionType: string) => {
    // Block if currently editing
    if (isEditing) {
      showToast("Wait for current generation to finish", "info");
      return;
    }
    console.log('[suggestFlowExtension] Called with:', fromNode.name, actionType);
    
    // Generate context-aware names and prompts based on action type
    let nodeName = '';
    let nodeDescription = '';
    let edgeLabel = '';
    let aiPrompt = '';
    
    // Make unique names with timestamp
    const timestamp = Date.now();
    const existingNodeNames = flowNodes.map(n => n.name.toLowerCase());
    
    switch (actionType) {
      case 'extend':
        nodeName = `${fromNode.name}-detail`;
        nodeDescription = `Detail view for ${fromNode.name}`;
        edgeLabel = 'opens';
        aiPrompt = `@${nodeName} Create a detail page for ${fromNode.name}. Show expanded information, more details, and actions related to ${fromNode.name}. Include a back button to return. Match the existing design.`;
        break;
      case 'alternative':
        nodeName = `${fromNode.name}-v2`;
        nodeDescription = `Alternative version of ${fromNode.name}`;
        edgeLabel = 'alternative';
        aiPrompt = `@${nodeName} Create an alternative version of the ${fromNode.name} page. Keep the same purpose but use a different layout, different visual hierarchy, or different interaction pattern. Include same navigation as original.`;
        break;
      case 'subflow':
        nodeName = `${fromNode.name}-items`;
        nodeDescription = `Items/list within ${fromNode.name}`;
        edgeLabel = 'contains';
        aiPrompt = `@${nodeName} Create a list/items view within ${fromNode.name}. Show a collection of items with filtering, search, or categorization. Each item should be clickable. Match the existing design patterns.`;
        break;
      default:
        nodeName = `${fromNode.name}-next`;
        nodeDescription = `Next step from ${fromNode.name}`;
        edgeLabel = 'leads to';
        aiPrompt = `@${nodeName} Create a logical next page after ${fromNode.name}. Think about what action a user would take on ${fromNode.name} and create the resulting page.`;
    }
    
    // Make name unique if already exists
    let finalName = nodeName;
    let counter = 1;
    while (existingNodeNames.includes(finalName.toLowerCase())) {
      finalName = `${nodeName}-${counter}`;
      counter++;
    }
    nodeName = finalName;
    aiPrompt = aiPrompt.replace(/@[a-zA-Z0-9-_]+/, `@${nodeName}`);
    
    const nodeId = `node_${timestamp}`;
    
    // Position below/beside source node
    const newNode: ProductFlowNode = {
      id: nodeId,
      name: nodeName,
      type: 'view',
      description: nodeDescription,
      x: actionType === 'alternative' ? fromNode.x + 200 : fromNode.x + 50,
      y: actionType === 'alternative' ? fromNode.y : fromNode.y + 150,
      status: 'added',
      confidence: 'medium',
    };
    
    const newEdge: ProductFlowEdge = {
      id: `edge_${fromNode.id}_${nodeId}`,
      from: fromNode.id,
      to: nodeId,
      label: edgeLabel,
      type: 'navigation',
    };
    
    console.log('[suggestFlowExtension] Adding node:', newNode);
    console.log('[suggestFlowExtension] Adding edge:', newEdge);
    
    // Directly add the node and edge
    setFlowNodes(prev => [...prev, newNode]);
    setFlowEdges(prev => [...prev, newEdge]);
    
    // Close the node detail panel
    setSelectedFlowNode(null);
    
    // Open AI edit panel with context-aware prompt and auto-trigger
    setEditInput(aiPrompt);
    setShowFloatingEdit(true);
    
    // Auto-trigger AI generation
    setTimeout(() => {
      const sendBtn = document.querySelector('[data-edit-send-btn]') as HTMLButtonElement;
      if (sendBtn && !sendBtn.disabled) {
        sendBtn.click();
        showToast(`Generating ${nodeName}...`, 'info');
      }
    }, 150);
  };
  

  useEffect(() => {
    if (generatedCode && !isStreamingCode) {
      buildArchitectureLive(generatedCode);
      buildFlowLive(generatedCode);
      setStyleInfo(extractStyleInfo(generatedCode));
    }
  }, [generatedCode, isStreamingCode]);
  
  // Generate file structure when code or flow nodes change
  useEffect(() => {
    if (generatedCode && !isStreamingCode) {
      const files = generateFileStructure(generatedCode, flowNodes, codeMode);
      setGeneratedFiles(files);
      
      // Set default active file based on mode
      const newPath = codeMode === "single-file" ? "/pages/index.html" : "/pages/index.tsx";
      setActiveFilePath(newPath);
    }
  }, [generatedCode, isStreamingCode, flowNodes, codeMode, generateFileStructure]);
  
  // When activeFilePath changes, update editableCode to match the file content
  useEffect(() => {
    if (generatedFiles.length > 0 && activeFilePath) {
      const file = generatedFiles.find(f => f.path === activeFilePath);
      if (file && file.content) {
        setEditableCode(file.content);
      }
    }
  }, [activeFilePath, generatedFiles]);

  const getSupportedMimeType = () => {
    const types = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "video/webm";
  };

  // Check if mobile device (function version for runtime checks)
  const checkIsMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  };

  const [showMobileRecordingInfo, setShowMobileRecordingInfo] = useState(false);

  const startRecording = async () => {
    // Check for mobile - show custom modal
    if (checkIsMobile()) {
      setShowMobileRecordingInfo(true);
      return;
    }

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = screenStream;
      chunksRef.current = [];
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(screenStream, { mimeType });
      
      mediaRecorder.ondataavailable = (e) => { 
        console.log("Data chunk received:", e.data.size);
        if (e.data.size > 0) chunksRef.current.push(e.data); 
      };
      
      let hasProcessedStop = false;
      
      mediaRecorder.onstop = async () => {
        // Guard against multiple calls
        if (hasProcessedStop) {
          console.log("onstop already processed, skipping");
          return;
        }
        hasProcessedStop = true;
        
        console.log("=== MediaRecorder.onstop fired ===");
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        // Create blob and add to flows - copy chunks immediately
        const chunks = [...chunksRef.current];
        chunksRef.current = []; // Clear immediately to prevent reuse
        
        console.log("Chunks collected:", chunks.length);
        
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          console.log("Created blob, size:", blob.size, "bytes");
          
          try {
            await addVideoToFlows(blob, "");
            console.log("Flow added successfully");
          } catch (e) {
            console.error("Error adding flow:", e);
          }
        } else {
          console.log("WARNING: No chunks available!");
        }
        
        // Update state after flow is added
        setIsRecording(false);
        setRecordingDuration(0);
        setViewMode("input");
        mediaRecorderRef.current = null;
        
        console.log("=== Recording cleanup complete ===");
      };
      
      // Handle when user clicks "Stop sharing" in browser UI
      const videoTrack = screenStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.log("Screen sharing stopped by user (track ended)");
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }
        };
      }
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      timerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
      console.log("Recording started");
    } catch (err) {
      console.error("Recording error:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    console.log("stopRecording called, state:", mediaRecorderRef.current?.state);
    
    // Request final data chunk before stopping
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.requestData(); // Get any pending data
      mediaRecorderRef.current.stop();
    }
    
    // Clear timer (onstop will also do this, but just in case)
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const addVideoToFlows = async (blob: Blob, name: string) => {
    console.log("addVideoToFlows called, blob size:", blob.size, "type:", blob.type);
    
    // Validate blob
    if (!blob || blob.size === 0) {
      console.error("Invalid blob - empty or null");
      showToast("Invalid video file", "error");
      return;
    }
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("webkit-playsinline", "true");
    
    // Don't set crossOrigin for local blob URLs - it can cause issues on mobile
    // video.crossOrigin = "anonymous";
    
    return new Promise<void>((resolve) => {
      let resolved = false;
      
      const generateThumbnail = (videoEl: HTMLVideoElement): string | undefined => {
        try {
          const canvas = document.createElement("canvas");
          const vw = videoEl.videoWidth || 640;
          const vh = videoEl.videoHeight || 360;
          canvas.width = 320; // Higher quality thumbnail
          canvas.height = Math.round((320 / vw) * vh) || 180;
          const ctx = canvas.getContext("2d");
          if (ctx && vw > 0 && vh > 0) {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
            if (dataUrl.length > 1000) return dataUrl;
          }
        } catch (e) {
          console.error("Thumbnail error:", e);
        }
        return undefined;
      };
      
      // Get valid duration - handle Infinity for webm
      const getValidDuration = (): number => {
        const d = video.duration;
        if (d && isFinite(d) && !isNaN(d) && d > 0 && d < 7200) {
          return Math.round(d);
        }
        if (recordingDuration > 0) return recordingDuration;
        // Estimate from blob size (rough average ~800KB/s)
        const est = Math.max(5, Math.round(blob.size / 800000));
        console.log("Estimated duration from blob size:", est);
        return Math.min(est, 300);
      };
      
      const finishCreation = async (thumbnail?: string) => {
        if (resolved) return;
        resolved = true;
        
        const duration = getValidDuration();
        const flowId = generateId();
        
        // Generate name - use file name if provided, otherwise create unique recording name
        let baseName = name && name.trim() ? name.trim() : "";
        
        // For mobile, upload to Supabase immediately for persistence
        let permanentUrl = url;
        if (isMobile && user) {
          try {
            // Get upload URL
            const uploadRes = await fetch("/api/upload-video/get-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ 
                fileName: `${flowId}.${blob.type.includes("mp4") ? "mp4" : "webm"}`,
                contentType: blob.type || "video/mp4"
              }),
            });
            
            if (uploadRes.ok) {
              const { uploadUrl, publicUrl } = await uploadRes.json();
              
              // Upload video
              const upload = await fetch(uploadUrl, {
                method: "PUT",
                headers: { "Content-Type": blob.type || "video/mp4" },
                body: blob,
              });
              
              if (upload.ok) {
                permanentUrl = publicUrl;
                console.log("Video uploaded to Supabase for persistence:", publicUrl);
              }
            }
          } catch (e) {
            console.error("Background upload failed:", e);
            // Continue with blob URL - video won't persist after refresh
          }
        }
        
        setFlows(prev => {
          // If no name provided, generate based on count
          if (!baseName) {
            baseName = `Recording ${prev.length + 1}`;
          }
          
          // Ensure unique name by checking existing flows
          const existingNames = prev.map(f => f.name);
          let finalName = baseName;
          let counter = 1;
          while (existingNames.includes(finalName)) {
            counter++;
            finalName = `${baseName} (${counter})`;
          }
          
          const newFlow: FlowItem = {
            id: flowId, 
            name: finalName, 
            videoBlob: blob, 
            videoUrl: permanentUrl, 
            thumbnail: thumbnail || "",
            duration, 
            trimStart: 0, 
            trimEnd: duration,
          };
          console.log("Flow added:", newFlow.name, "duration:", duration, "blob size:", blob.size, "url:", permanentUrl.substring(0, 50));
          return [...prev, newFlow];
        });
        setSelectedFlowId(flowId);
        showToast("Video added", "success");
        resolve();
      };
      
      // Mobile: Use aggressive fast path - don't wait for all events
      if (isMobile) {
        console.log("Mobile device - using fast path");
        // Just wait a short moment for any metadata we can get, then finish
        setTimeout(() => {
          if (!resolved) {
            finishCreation(generateThumbnail(video));
          }
        }, 1500); // 1.5 seconds max wait on mobile
      }
      
      // Handle metadata when loaded
      video.onloadedmetadata = () => {
        console.log("Metadata loaded, raw duration:", video.duration);
        if (isMobile) {
          // On mobile, finish as soon as we have metadata
          setTimeout(() => finishCreation(generateThumbnail(video)), 200);
        } else if (!isFinite(video.duration) || video.duration <= 0) {
          video.currentTime = 1e10; // Seek far to get real duration for webm
        } else {
          video.currentTime = Math.min(1, video.duration * 0.25);
        }
      };
      
      // Handle canplay
      video.oncanplay = () => {
        if (resolved) return;
        console.log("Video can play");
        setTimeout(() => {
          if (!resolved) {
            finishCreation(generateThumbnail(video));
          }
        }, 300);
      };
      
      // Desktop seeking for webm duration fix
      video.onseeked = () => {
        if (resolved || isMobile) return;
        console.log("Seeked to:", video.currentTime, "duration now:", video.duration);
        if (video.currentTime > 100) {
          video.currentTime = Math.min(1, getValidDuration() * 0.25);
          return;
        }
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (resolved) return;
            finishCreation(generateThumbnail(video));
          }, 100);
        });
      };
      
      video.onerror = (e) => {
        console.error("Video load error:", e);
        // Even on error, add the video with estimated data
        if (!resolved) {
          console.log("Attempting fallback despite error");
          finishCreation();
        }
      };
      
      // Ultimate fallback timeout
      setTimeout(() => {
        if (!resolved) {
          console.log("Final timeout - using estimated data");
          finishCreation(generateThumbnail(video));
        }
      }, isMobile ? 3000 : 8000);
      
      video.load();
      
      // Try to play to trigger loading (helps on some mobile browsers)
      video.play().catch(() => {
        console.log("Autoplay blocked");
      });
    });
  };

  // Import flow from landing hero (upload/record/context/style) without touching tool behavior.
  useEffect(() => {
    if (!pending?.blob) return;

    // Safety: only consume once per pending payload
    const payload = pending;
    (async () => {
      try {
        await addVideoToFlows(payload.blob, payload.name || "Flow");
        if (payload.context) setRefinements(payload.context);
        if (payload.styleDirective) setStyleDirective(payload.styleDirective);
        setViewMode("input");
      } finally {
        clearPending();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.createdAt]);

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        // Accept video files - be more lenient with MIME type checking for mobile
        const isVideo = file.type.startsWith("video/") || 
                        file.name.toLowerCase().match(/\.(mp4|mov|webm|avi|mkv|m4v)$/);
        if (isVideo) {
          const sizeMB = file.size / 1024 / 1024;
          console.log(`Adding video: ${file.name}, size: ${sizeMB.toFixed(1)}MB, type: ${file.type}`);
          
          // Just add the video - no size restrictions on frontend
          // Backend will handle any size issues during processing
          await addVideoToFlows(file, file.name.replace(/\.[^/.]+$/, ""));
        } else {
          showToast("Please select a video file", "error");
        }
      }
    }
    e.target.value = "";
  }, [showToast]);

  // Drag and drop handlers for video upload
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        const isVideo = file.type.startsWith("video/") || 
                        file.name.toLowerCase().match(/\.(mp4|mov|webm|avi|mkv|m4v)$/);
        if (isVideo) {
          const sizeMB = file.size / 1024 / 1024;
          console.log(`Dropped video: ${file.name}, size: ${sizeMB.toFixed(1)}MB, type: ${file.type}`);
          await addVideoToFlows(file, file.name.replace(/\.[^/.]+$/, ""));
        } else {
          showToast("Please drop a video file", "error");
        }
      }
    }
  }, [showToast]);

  const removeFlow = (flowId: string) => {
    setFlows(prev => prev.filter(f => f.id !== flowId));
    if (selectedFlowId === flowId) setSelectedFlowId(flows.length > 1 ? flows.find(f => f.id !== flowId)?.id || null : null);
  };

  // Context image/file upload handler - uploads to Supabase Storage
  const handleContextImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        const id = `ctx-file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        
        // First add with loading state (local blob for preview)
        const localUrl = URL.createObjectURL(file);
        setContextImages(prev => [...prev, { id, url: localUrl, name: file.name, uploading: true }]);
        
        // Upload to Supabase
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", user?.id || "anon");
          
          const response = await fetch("/api/upload-image", {
            method: "POST",
            body: formData,
          });
          
          const data = await response.json();
          
          if (data.success && data.url) {
            // Replace local URL with Supabase URL
            URL.revokeObjectURL(localUrl);
            setContextImages(prev => prev.map(img => 
              img.id === id ? { ...img, url: data.url, uploading: false } : img
            ));
            console.log("[Upload] Image uploaded to Supabase:", data.url);
          } else {
            console.error("[Upload] Failed:", data.error);
            showToast("Failed to upload image", "error");
            // Keep local URL as fallback
            setContextImages(prev => prev.map(img => 
              img.id === id ? { ...img, uploading: false } : img
            ));
          }
        } catch (error) {
          console.error("[Upload] Error:", error);
          showToast("Failed to upload image", "error");
          setContextImages(prev => prev.map(img => 
            img.id === id ? { ...img, uploading: false } : img
          ));
        }
      }
    }
    e.target.value = "";
  }, [user, showToast]);

  const removeContextImage = useCallback((id: string) => {
    setContextImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter(i => i.id !== id);
    });
  }, []);

  // CRUD operations for generations
  const renameGeneration = (id: string, newTitle: string) => {
    const updatedGen = generations.find(g => g.id === id);
    if (updatedGen) {
      // Ensure title is not empty - fallback to current title if empty
      const finalTitle = newTitle.trim() || updatedGen.title || "Untitled Project";
      console.log("[Rename] Renaming generation", id, "to:", finalTitle);
      
      const renamedGen = { ...updatedGen, title: finalTitle, autoTitle: false };
      setGenerations(prev => prev.map(g => g.id === id ? renamedGen : g));
      if (activeGeneration?.id === id) {
        setActiveGeneration(prev => prev ? { ...prev, title: finalTitle, autoTitle: false } : null);
        setGenerationTitle(finalTitle);
      }
      // Sync rename to Supabase immediately
      saveGenerationToSupabase(renamedGen);
    }
    setRenamingId(null);
    setRenameValue("");
  };
  
  // Save a version snapshot to the active generation
  const saveVersion = useCallback((label: string) => {
    if (!activeGeneration || !generatedCode) return;
    
    const newVersion: GenerationVersion = {
      id: generateId(),
      timestamp: Date.now(),
      label,
      code: generatedCode,
      flowNodes: [...flowNodes],
      flowEdges: [...flowEdges],
      styleInfo: styleInfo ? { ...styleInfo } : null,
    };
    
    setGenerations(prev => prev.map(gen => {
      if (gen.id === activeGeneration.id) {
        const existingVersions = gen.versions || [];
        // Keep last 20 versions max
        const updatedVersions = [...existingVersions, newVersion].slice(-20);
        return { ...gen, versions: updatedVersions };
      }
      return gen;
    }));
    
    // Also update active generation
    setActiveGeneration(prev => {
      if (!prev) return prev;
      const existingVersions = prev.versions || [];
      const updatedVersions = [...existingVersions, newVersion].slice(-20);
      return { ...prev, versions: updatedVersions };
    });
  }, [activeGeneration, generatedCode, flowNodes, flowEdges, styleInfo]);
  
  // Restore to a specific version
  const restoreVersion = useCallback((genId: string, version: GenerationVersion) => {
    const gen = generations.find(g => g.id === genId);
    if (!gen) return;
    
    // Save current state as a version before restoring (with descriptive name)
    if (activeGeneration?.id === genId && generatedCode && generatedCode !== version.code) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      saveVersion(`Snapshot @ ${timeStr} (before "${version.label.slice(0, 20)}${version.label.length > 20 ? '...' : ''}")`);
    }
    
    // Restore the version
    setGeneratedCode(version.code);
    setDisplayedCode(version.code);
    setEditableCode(version.code);
    setFlowNodes(version.flowNodes);
    setFlowEdges(version.flowEdges);
    if (version.styleInfo) setStyleInfo(version.styleInfo);
    
    // Update preview
    const blob = new Blob([version.code], { type: "text/html" });
    setPreviewUrl(URL.createObjectURL(blob));
    
    showToast(`Restored to: ${version.label}`, "success");
    setExpandedVersions(null);
  }, [generations, activeGeneration, generatedCode, saveVersion]);
  
  const duplicateGeneration = async (gen: GenerationRecord) => {
    setHistoryMenuOpen(null);
    
    // If generation doesn't have code, load full data first
    let fullGen = gen;
    if (!gen.code) {
      showToast("Loading project data...", "info");
      const loaded = await loadFullGeneration(gen.id);
      if (!loaded || !loaded.code) {
        showToast("Failed to load project data", "error");
        return;
      }
      fullGen = loaded;
    }
    
    const newGen: GenerationRecord = {
      ...fullGen,
      id: generateId(),
      title: `${fullGen.title} (Copy)`,
      timestamp: Date.now(),
      autoTitle: false,
      publishedSlug: undefined, // Don't copy published slug
    };
    setGenerations(prev => [...prev, newGen]);
    // Save duplicated generation to Supabase
    saveGenerationToSupabase(newGen);
    showToast("Project duplicated!", "success");
  };
  
  // Open delete confirmation modal
  const confirmDeleteGeneration = (id: string, title: string) => {
    setDeleteTargetId(id);
    setDeleteTargetTitle(title || "Untitled Project");
    setShowDeleteModal(true);
    setHistoryMenuOpen(null);
  };
  
  // Actually delete after confirmation
  const deleteGeneration = async (id: string) => {
    setGenerations(prev => prev.filter(g => g.id !== id));
    if (activeGeneration?.id === id) {
      setActiveGeneration(null);
      // Reset to empty state
      setGeneratedCode(null);
      setDisplayedCode("");
      setEditableCode("");
      setPreviewUrl(null);
      setFlowNodes([]);
      setFlowEdges([]);
      setStyleInfo(null);
      setGenerationTitle("Untitled Project");
      setGenerationComplete(false);
    }
    setHistoryMenuOpen(null);
    setShowDeleteModal(false);
    setDeleteTargetId(null);
    showToast("Project deleted", "info");
    
    // Sync deletion to Supabase
    if (user) {
      try {
        await fetch(`/api/generations?id=${id}`, { method: "DELETE" });
      } catch (e) {
        console.error("Error deleting from Supabase:", e);
      }
    }
  };

  // Smooth trim handlers with live preview
  const handleTrimDrag = (e: React.MouseEvent, type: "start" | "end") => {
    e.preventDefault();
    e.stopPropagation();
    if (!trimBarRef.current || !selectedFlow) return;
    
    // Capture values at start
    const flowId = selectedFlow.id;
    const duration = selectedFlow.duration;
    
    // Guard against invalid duration
    if (!duration || !isFinite(duration) || duration <= 0) return;
    
    setIsDraggingTrim(type);
    
    const updateTrim = (clientX: number) => {
      if (!trimBarRef.current) return;
      const rect = trimBarRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = x / rect.width;
      let time = percent * duration;
      
      // Guard against NaN/Infinity
      if (!isFinite(time)) time = 0;
      time = Math.max(0, Math.min(time, duration));
      
      setTrimPreviewTime(time);
      
      // Seek video to show preview - guard against invalid values
      if (videoRef.current && isFinite(time)) {
        videoRef.current.currentTime = time;
      }
      
      setFlows(prev => prev.map(f => {
        if (f.id !== flowId) return f;
        if (type === "start") {
          return { ...f, trimStart: Math.min(time, f.trimEnd - 0.5) };
        }
        return { ...f, trimEnd: Math.max(time, f.trimStart + 0.5) };
      }));
    };
    
    const handleMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      requestAnimationFrame(() => updateTrim(moveEvent.clientX));
    };
    
    const handleUp = () => {
      setIsDraggingTrim(null);
      setTrimPreviewTime(null);
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
    };
    
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  };

  const applyTrim = async () => {
    if (!selectedFlow) return;
    
    const trimDuration = selectedFlow.trimEnd - selectedFlow.trimStart;
    console.log(`Trim applied: ${selectedFlow.trimStart}s - ${selectedFlow.trimEnd}s (${trimDuration}s)`);
    
    // Remove any previous trim info from name and add new one
    // Match patterns like "(0s-30s)" or "(29s-30s)"
    const baseName = selectedFlow.name.replace(/\s*\(\d+s-\d+s\)\s*/g, '').trim();
    const newName = `${baseName} (${Math.round(selectedFlow.trimStart)}s-${Math.round(selectedFlow.trimEnd)}s)`;
    
    setFlows(prev => prev.map(f => 
      f.id === selectedFlow.id 
        ? { ...f, name: newName }
        : f
    ));
  };

  // Canvas pan handlers for architecture
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.arch-node-card')) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX, y: e.clientY, panX: canvasPan.x, panY: canvasPan.y };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setCanvasPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  // Handle suggestion click
  const handleSuggestionClick = (nodeId: string) => {
    const lastAt = editInput.lastIndexOf("@");
    setEditInput(editInput.slice(0, lastAt) + `@${nodeId} `);
    setShowSuggestions(false);
    setSelectedArchNode(nodeId);
    editInputRef.current?.focus();
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const typeText = async (text: string, onUpdate: (typed: string) => void, speed = 20) => {
    for (let i = 0; i <= text.length; i++) {
      onUpdate(text.slice(0, i));
      await new Promise(r => setTimeout(r, speed));
    }
  };

  // Helper: Convert blob to base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just base64
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Streaming generation - shows LIVE AI output as it happens
  const generateWithStreaming = async (
    videoBlob: Blob,
    styleDirective: string,
    databaseContext?: string,
    styleReferenceImage?: { url: string; base64?: string }
  ): Promise<{ success: boolean; code?: string; error?: string; tokenUsage?: any }> => {
    try {
      // Convert video blob to base64
      setStreamingStatus("📦 Preparing video for AI...");
      setStreamingCode(null);
      setStreamingLines(0);
      
      const videoBase64 = await blobToBase64(videoBlob);
      const mimeType = videoBlob.type || "video/mp4";
      
      setStreamingStatus("🚀 Connecting to AI...");
      
      // Call streaming endpoint
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 280000); // 280s timeout (just under Vercel's 300s)
      
      const response = await fetch("/api/generate/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoBase64,
          mimeType,
          styleDirective,
          databaseContext,
          styleReferenceImage,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Handle specific status codes
        if (response.status === 504) {
          throw new Error("Server timeout - will try backup generation method");
        }
        if (response.status === 502) {
          throw new Error("Gateway error - will try backup generation method");
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Streaming request failed (${response.status})`);
      }

      // Process SSE stream
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullCode = "";
      let tokenUsage: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            switch (data.type) {
              case "status":
                setStreamingStatus(data.message);
                break;
                
              case "chunk":
                // Accumulate full response
                fullCode += data.content;
                
                // Only show CODE portion in UI (after ```html or <!DOCTYPE) - hide AI preamble
                let displayCode = fullCode;
                const htmlBlockStart = fullCode.indexOf("```html");
                const doctypeStart = fullCode.indexOf("<!DOCTYPE");
                
                if (htmlBlockStart !== -1) {
                  // Extract code after ```html
                  displayCode = fullCode.slice(htmlBlockStart + 7);
                } else if (doctypeStart !== -1) {
                  // Extract from <!DOCTYPE
                  displayCode = fullCode.slice(doctypeStart);
                } else {
                  // Code hasn't started yet - just show status
                  displayCode = "";
                }
                
                setStreamingCode(displayCode || null);
                setStreamingLines(data.lineCount || 0);
                
                // Update status with line count
                if (data.lineCount > 0) {
                  setStreamingStatus(`✨ Writing code: ${data.lineCount} lines...`);
                }
                break;
                
              case "progress":
                setStreamingStatus(data.message);
                setStreamingLines(data.lineCount || 0);
                break;
                
              case "complete":
                setStreamingStatus("✅ Generation complete!");
                tokenUsage = data.tokenUsage;
                // Return the clean extracted code
                return { 
                  success: true, 
                  code: data.code, 
                  tokenUsage: data.tokenUsage 
                };
                
              case "error":
                throw new Error(data.error);
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }

      // If we got here without complete event, return accumulated code
      if (fullCode.length > 100) {
        return { success: true, code: fullCode, tokenUsage };
      }

      return { success: false, error: "Generation incomplete" };
      
    } catch (error: any) {
      console.error("[streaming] Error:", error);
      setStreamingStatus(null);
      setStreamingCode(null);
      return { success: false, error: error.message };
    }
  };

  const handleGenerate = async () => {
    if (flows.length === 0) return;
    
    // Auth gate: require login
    if (!user) {
      // Save flow to persistent storage so it survives auth redirect
      const flow = flows.find(f => f.id === selectedFlowId) || flows[0];
      if (flow && flow.videoBlob) {
        await setPending({
          blob: flow.videoBlob,
          name: flow.name || "Flow",
          context: refinements?.trim() || "",
          styleDirective: styleDirective?.trim() || "Auto-Detect",
          createdAt: Date.now(),
        });
      }
      setPendingAction("generate");
      setShowAuthModal(true);
      return;
    }
    
    // Track generation start (FB Pixel + CAPI)
    trackStartGeneration(user.id);
    
    // FREE PLAN RESTRICTIONS
    if (!isPaidPlan) {
      // Check video duration - max 5min for FREE (same as PRO)
      const flow = flows.find(f => f.id === selectedFlowId) || flows[0];
      if (flow && flow.duration && flow.duration > 300) {
        showToast("Video too long. Maximum 5 minutes allowed.", "error");
        return;
      }
      
      // Check context length - max 2000 chars for FREE
      if (refinements && refinements.length > 2000) {
        showToast(`Context too long for Free Plan. Maximum ${2000} characters allowed. You have ${refinements.length}. Upgrade to PRO for up to 20,000 characters.`, "error");
        return;
      }
    } else {
      // PRO plan limits
      const flow = flows.find(f => f.id === selectedFlowId) || flows[0];
      if (flow && flow.duration && flow.duration > 300) {
        showToast("Video too long. Maximum 5 minutes allowed.", "error");
        return;
      }
      
      if (refinements && refinements.length > 20000) {
        showToast(`Context too long. Maximum 20,000 characters allowed. You have ${refinements.length}.`, "error");
        return;
      }
    }
    
    // SMART EDIT MODE: If we already have generated code, and context has changed,
    // use AI edit instead of regenerating from scratch
    const hasExistingProject = activeGeneration && generatedCode && generationComplete;
    const contextChanged = (refinements || "").trim() !== (activeGeneration?.refinements || "").trim();
    const styleChanged = (styleDirective || "").trim() !== (activeGeneration?.styleDirective || "").trim();
    
    if (hasExistingProject && (contextChanged || styleChanged) && (refinements || "").trim()) {
      // Use Edit mode - cheaper and preserves existing structure
      const editPrompt = (refinements || "").trim() + (styleChanged ? ` Apply style: ${styleDirective}` : "");
      
      // Credits gate for edit
      if (!canAfford(CREDIT_COSTS.AI_EDIT)) {
        setShowOutOfCreditsModal(true);
        return;
      }
      
      // Spend credits for edit
      try {
        const spendRes = await fetch("/api/credits/spend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cost: CREDIT_COSTS.AI_EDIT,
            reason: "ai_edit",
            referenceId: `edit_${Date.now()}`,
          }),
        });
        const spendData = await spendRes.json();
        if (!spendData.success) {
          setShowOutOfCreditsModal(true);
          return;
        }
        refreshCredits();
      } catch (error) {
        console.error("Failed to spend credits:", error);
        return;
      }
      
      setIsEditing(true);
      showToast("Updating project with your changes...", "info");
      
      // Get database context if connected
      let dbContextStr: string | undefined;
      if (activeGeneration) {
        try {
          const dbCtx = await getDatabaseContext(activeGeneration.id);
          if (dbCtx.isConnected) {
            dbContextStr = formatDatabaseContextForPrompt(dbCtx);
          }
        } catch {}
      }
      
      try {
        const result = await editCodeWithAI(generatedCode, editPrompt, undefined, dbContextStr);
        if (result.success && result.code) {
          // Save current state as a version before applying changes
          const versionLabel = `Context update: ${refinements.slice(0, 30)}${refinements.length > 30 ? '...' : ''}`;
          
          const newVersion: GenerationVersion = {
            id: generateId(),
            timestamp: Date.now(),
            label: versionLabel,
            code: result.code,
            flowNodes: [...flowNodes],
            flowEdges: [...flowEdges],
            styleInfo: styleInfo ? { ...styleInfo } : null,
          };
          
          // Update active generation with new refinements
          const updatedGen: GenerationRecord = {
            ...activeGeneration,
            code: result.code,
            refinements: refinements,
            styleDirective: styleDirective,
            versions: [...(activeGeneration.versions || []), newVersion].slice(-20),
          };
          
          setActiveGeneration(updatedGen);
          setGenerations(prev => prev.map(g => 
            g.id === activeGeneration.id ? updatedGen : g
          ));
          saveGenerationToSupabase(updatedGen);
          
          setGeneratedCode(result.code);
          setEditableCode(result.code);
          setDisplayedCode(result.code);
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(URL.createObjectURL(new Blob([result.code], { type: "text/html" })));
          buildArchitectureLive(result.code);
          buildFlowLive(result.code);
          setStyleInfo(extractStyleInfo(result.code));
          
          const files = generateFileStructure(result.code, flowNodes, codeMode);
          setGeneratedFiles(files);
          
          // 🚀 Switch to chat mode and add response message
          setSidebarMode("chat");
          setSidebarTab("chat");
          setViewMode("preview");
          
          // Add chat message about what was updated
          const updateMsg: ChatMessage = {
            id: generateId(),
            role: "assistant",
            content: `**Project Updated!** ✨\n\nI've applied your changes:\n${contextChanged ? `- Updated context/requirements\n` : ""}${styleChanged ? `- Applied new style: ${styleDirective}\n` : ""}\nThe preview is now showing your updated design. Let me know if you want any more tweaks!`,
            timestamp: Date.now(),
            quickActions: [
              "Make more changes",
              "Adjust the layout",
              "Change colors",
              "Add animations"
            ]
          };
          setChatMessages(prev => [...prev, updateMsg]);
          
          showToast("Project updated successfully!", "success");
        } else {
          showToast(result.error || "Failed to update project", "error");
        }
      } catch (error) {
        console.error("Edit error:", error);
        showToast("Failed to update project", "error");
      } finally {
        setIsEditing(false);
      }
      return;
    }
    
    // Credits gate: check if user can afford
    if (!canAfford(CREDIT_COSTS.VIDEO_GENERATE)) {
      setShowOutOfCreditsModal(true);
      return;
    }
    
    // Spend credits before generation
    try {
      const spendRes = await fetch("/api/credits/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost: CREDIT_COSTS.VIDEO_GENERATE,
          reason: "video_generate",
          referenceId: `gen_${Date.now()}`,
        }),
      });
      const spendData = await spendRes.json();
      if (!spendData.success) {
        setShowOutOfCreditsModal(true);
        return;
      }
      // Refresh credits after spending
      refreshCredits();
    } catch (error) {
      console.error("Failed to spend credits:", error);
      return;
    }
    
    setIsProcessing(true);
    setGenerationComplete(false);
    setAnalysisDescription("");
    setGeneratedCode(null);
    setDisplayedCode("");
    setEditableCode("");
    // Auto-switch to Preview mode when generation starts
    setViewMode("preview");
    
    // Track generation start time for stuck detection
    generationStartTimeRef.current = Date.now();
    streamingCompleteRef.current = false;
    pendingCodeRef.current = null;
    
    // MOBILE: Request Wake Lock to prevent screen from turning off during generation
    let wakeLock: WakeLockSentinel | null = null;
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && 'wakeLock' in navigator) {
      try {
        wakeLock = await (navigator as any).wakeLock.request('screen');
        console.log("Wake Lock acquired - screen will stay on during generation");
      } catch (err) {
        console.log("Wake Lock not available:", err);
        // Show warning to user
        showToast("Keep your screen on during generation for best results", "info");
      }
    } else if (isMobile) {
      // Wake Lock not supported - warn user
      showToast("Keep your screen on during generation", "info");
    }
    setPreviewUrl(null);
    setIsCodeEditable(false);
    setArchitecture([]);
    setStyleInfo(null);
    // Reset to single-file mode for new generation
    setCodeMode("single-file");
    setActiveFilePath("/pages/index.html");
    // Mark new generation session - hide old content until new content arrives
    const sessionId = `session_${Date.now()}`;
    setGenerationSessionId(sessionId);
    
    // Initialize live analysis phase - Technical UX Analysis
    const initialPhase: AnalysisPhase = {
      palette: [],
      typography: "Scanning...",
      vibe: "Analyzing...",
      layout: "Detecting...",
      container: "Scanning...",
      responsive: "Checking...",
      components: [],
      uxSignals: [],
      structureItems: [],
      componentTree: [],
      dataPatterns: []
    };
    setAnalysisPhase(initialPhase);
    setAnalysisSection("style");
    
    // Real-time technical analysis - shows AI thinking like an engineer
    const updatePhaseRealTime = async () => {
      // Phase 1: UX SIGNALS (0-3s) - Detect technical patterns
      setAnalysisSection("style");
      
      // Motion Profile Detection
      await new Promise(r => setTimeout(r, 500));
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [{ type: "motion", label: "Motion Profile", value: "Scanning..." }]
      } : prev);
      
      await new Promise(r => setTimeout(r, 600));
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [
          { type: "motion", label: "Motion Profile", value: "CSS Transitions", tech: "transition-all" },
          { type: "interaction", label: "Interaction Model", value: "Detecting..." }
        ]
      } : prev);
      
      await new Promise(r => setTimeout(r, 700));
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [
          { type: "motion", label: "Motion Profile", value: "CSS Transitions", tech: "transition-all" },
          { type: "interaction", label: "Interaction Model", value: "Click + Hover", tech: "Alpine.js x-on" },
          { type: "responsive", label: "Layout Strategy", value: "Analyzing..." }
        ]
      } : prev);
      
      await new Promise(r => setTimeout(r, 600));
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [
          { type: "motion", label: "Motion Profile", value: "CSS Transitions", tech: "transition-all" },
          { type: "interaction", label: "Interaction Model", value: "Click + Hover", tech: "Alpine.js x-on" },
          { type: "responsive", label: "Layout Strategy", value: "Mobile-First", tech: "Flexbox + Grid" },
          { type: "hierarchy", label: "Visual Hierarchy", value: "Checking..." }
        ]
      } : prev);
      
      // Phase 2: STRUCTURE (3-5s) - Component Tree Detection
      await new Promise(r => setTimeout(r, 500));
      setAnalysisSection("layout");
      
      // Build component tree hierarchically
      const componentTree: ComponentTreeNode[] = [
        { name: "PageLayout", type: "Template", status: "generating", children: ["Header", "MainContent", "Footer"] }
      ];
      setAnalysisPhase(prev => prev ? { ...prev, componentTree } : prev);
      
      await new Promise(r => setTimeout(r, 400));
      componentTree[0].status = "done";
      componentTree.push({ name: "Header", type: "Organism", status: "generating", children: ["Logo", "Navigation", "CTA Button"] });
      setAnalysisPhase(prev => prev ? { ...prev, componentTree: [...componentTree] } : prev);
      
      await new Promise(r => setTimeout(r, 350));
      componentTree[1].status = "done";
      componentTree.push({ name: "HeroSection", type: "Organism", status: "generating", children: ["Headline", "Subtext", "CTAGroup"] });
      setAnalysisPhase(prev => prev ? { ...prev, componentTree: [...componentTree] } : prev);
      
      await new Promise(r => setTimeout(r, 400));
      componentTree[2].status = "done";
      componentTree.push({ name: "ContentGrid", type: "Molecule", status: "generating", hasDataConnection: true, children: ["Card (×n)"] });
      setAnalysisPhase(prev => prev ? { ...prev, componentTree: [...componentTree] } : prev);
      
      await new Promise(r => setTimeout(r, 350));
      componentTree[3].status = "done";
      componentTree.push({ name: "Footer", type: "Organism", status: "generating", children: ["FooterNav", "Copyright"] });
      setAnalysisPhase(prev => prev ? { ...prev, componentTree: [...componentTree] } : prev);
      
      // Phase 3: COMPONENTS (5s+) - Finalize analysis
      await new Promise(r => setTimeout(r, 500));
      setAnalysisSection("components");
      
      // Finalize all
      componentTree[4].status = "done";
      
      // Finalize UX signals with technical values
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [
          { type: "motion", label: "Motion Profile", value: "CSS Transitions", tech: "transition-all duration-300" },
          { type: "interaction", label: "Interaction Model", value: "Click + Hover", tech: "Alpine.js x-on:click" },
          { type: "responsive", label: "Layout Strategy", value: "Mobile-First", tech: "Tailwind sm: md: lg:" },
          { type: "hierarchy", label: "Visual Hierarchy", value: "Landing Page", tech: "Hero → Content → CTA" }
        ],
        componentTree: componentTree.map(c => ({ ...c, status: "done" as const })),
        dataPatterns: [
          { pattern: "List Iteration", component: "ContentGrid", suggestedTable: "items" }
        ],
        responsive: "Mobile-First",
        layout: "Flexbox + Grid",
        container: "Centered layout"
      } : prev);
    };
    
    updatePhaseRealTime();
    
    try {
      let flow = flows[0];
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
      
      // Determine video URL - use existing URL if available, or upload new
      let videoUrl: string = "";
      
      // Check if we already have a valid URL (not a blob URL, not empty)
      const hasValidUrl = flow.videoUrl && 
        flow.videoUrl.startsWith("https://") && 
        !flow.videoUrl.startsWith("blob:");
      
      if (hasValidUrl) {
        // Use existing URL (flow was restored from localStorage or already uploaded)
        videoUrl = flow.videoUrl;
        console.log("Using existing video URL:", videoUrl);
      } else {
        // Need to upload the video blob
        const videoSizeMB = flow.videoBlob.size / 1024 / 1024;
        console.log(`Video size: ${videoSizeMB.toFixed(2)} MB, mobile: ${isMobileDevice}`);
        
        // Check if blob is empty (happens when flow is restored incorrectly)
        if (flow.videoBlob.size === 0) {
          showToast("Video not available. Please re-upload the video.", "error");
          setIsProcessing(false);
          generationStartTimeRef.current = null;
          return;
        }
        
        // Max 50MB
        if (videoSizeMB > 50) {
          showToast("Video too large (max 50MB). Please use a shorter recording.", "error");
          setIsProcessing(false);
          generationStartTimeRef.current = null;
          return;
        }
        
        // MOBILE: Try FFmpeg conversion for problematic formats
        const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
        let blobToUpload = flow.videoBlob;
        
        if (isMobile && !videoUrl && flow.videoBlob.size > 0) {
          const videoType = flow.videoBlob.type.toLowerCase();
          // Check if video needs conversion (MOV, HEVC, etc.)
          const needsConversion = videoType.includes("quicktime") || 
                                  videoType.includes("mov") ||
                                  videoType.includes("hevc") ||
                                  videoType.includes("x-m4v") ||
                                  videoType === "" ||
                                  !videoType.includes("mp4");
          
          if (needsConversion) {
            console.log("Mobile video needs FFmpeg conversion:", videoType);
            showToast("Converting video for compatibility...", "info");
            
            try {
              const { convertToMP4, isFFmpegSupported } = await import("@/lib/ffmpeg-converter");
              
              if (isFFmpegSupported()) {
                const convertedBlob = await Promise.race([
                  convertToMP4(flow.videoBlob, (progress) => {
                    console.log("FFmpeg progress:", progress, "%");
                  }),
                  // 3 minute timeout for conversion
                  new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error("Conversion timeout")), 180000)
                  )
                ]);
                
                console.log("FFmpeg conversion success:", convertedBlob.size, "bytes");
                blobToUpload = convertedBlob;
                showToast("Video converted successfully!", "success");
              } else {
                console.log("FFmpeg not supported, using original");
              }
            } catch (ffmpegError) {
              console.error("FFmpeg conversion failed:", ffmpegError);
              // Continue with original blob - might work, might not
              showToast("Conversion failed, trying original format...", "info");
            }
          }
        }
        
        // Upload to Supabase (converted or original blob)
        if (!videoUrl) {
          // Use converted blob type if available, otherwise original
          let videoContentType = blobToUpload.type || flow.videoBlob.type || "video/webm";
          
          // Normalize mobile formats for the upload
          if (videoContentType === "video/quicktime" || videoContentType === "video/x-m4v" || 
              videoContentType === "video/3gpp" || !videoContentType.startsWith("video/")) {
            videoContentType = "video/mp4";
          }
          
          const fileExt = videoContentType.includes("webm") ? "webm" : "mp4";
          const uploadSizeMB = blobToUpload.size / (1024 * 1024);
          console.log(`Uploading video to Supabase: type=${videoContentType}, size=${uploadSizeMB.toFixed(2)}MB`);
          
          // Get signed upload URL
          const urlRes = await fetch("/api/upload-video/get-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: `recording-${Date.now()}.${fileExt}`,
              contentType: videoContentType,
            }),
          });
          
          if (!urlRes.ok) {
            const errorData = await urlRes.json().catch(() => ({}));
            console.error("Failed to get upload URL:", errorData);
            showToast(errorData.error || "Failed to prepare upload. Please try again.", "error");
            setIsProcessing(false);
            generationStartTimeRef.current = null;
            return;
          }
          
          const { signedUrl, publicUrl } = await urlRes.json();
          
          // Upload directly to Supabase Storage (use converted blob)
          const uploadRes = await fetch(signedUrl, {
            method: "PUT",
            headers: { "Content-Type": videoContentType },
            body: blobToUpload,
          });
          
          if (!uploadRes.ok) {
            console.error("Direct upload failed:", uploadRes.status, uploadRes.statusText);
            showToast("Failed to upload video. Please try again.", "error");
            setIsProcessing(false);
            generationStartTimeRef.current = null;
            return;
          }
          
          videoUrl = publicUrl;
          console.log("Video uploaded to Supabase:", videoUrl);
          
          // Update flow with permanent URL
          setFlows(prev => prev.map(f => 
            f.id === flow.id ? { ...f, videoUrl: publicUrl } : f
          ));
        }
      }
      
      // Build style directive with refinements and trim info
      let fullStyleDirective = styleDirective || "Modern, clean design with smooth animations";
      
      // Add refinements if provided
      if ((refinements || "").trim()) {
        fullStyleDirective += `. Additional refinements: ${(refinements || "").trim()}`;
      }
      
      // Add trim info if applicable
      const isTrimmed = flow.trimStart > 0 || flow.trimEnd < flow.duration;
      console.log(`Flow: trimStart=${flow.trimStart}, trimEnd=${flow.trimEnd}, duration=${flow.duration}, isTrimmed=${isTrimmed}`);
      
      if (isTrimmed) {
        fullStyleDirective += `. CRITICAL: ONLY analyze video content between timestamps ${flow.trimStart.toFixed(1)}s and ${flow.trimEnd.toFixed(1)}s. Ignore ALL content before ${flow.trimStart.toFixed(1)}s and after ${flow.trimEnd.toFixed(1)}s.`;
      } else {
        // Full video selected - add explicit instruction to watch entire video
        fullStyleDirective += `. This is a ${flow.duration} second video. Watch and analyze the ENTIRE video from 0:00 to ${formatDuration(flow.duration)}. Multiple screens or states may appear - include ALL of them.`;
      }
      
      // Check for Supabase integration
      let databaseContextStr = "";
      try {
        const dbContext = await getDatabaseContext(flow.id);
        if (dbContext.isConnected && dbContext.schemaText) {
          databaseContextStr = formatDatabaseContextForPrompt(dbContext);
          console.log("[Generate] Database context found:", dbContext.tables);
        }
      } catch (err) {
        console.log("[Generate] No database context:", err);
      }
      
      console.log("[Generate] ===== STYLE REFERENCE DEBUG =====");
      console.log("[Generate] styleReferenceImage:", styleReferenceImage);
      console.log("[Generate] styleReferenceImage URL:", styleReferenceImage?.url?.substring(0, 100));
      console.log("[Generate] styleDirective:", fullStyleDirective.substring(0, 200));
      
      // Use STREAMING for real-time AI output when we have a video blob
      let result;
      let videoBlobToUse = flow.videoBlob;
      
      // If blob is empty but we have a URL, fetch the video first
      if ((!videoBlobToUse || videoBlobToUse.size === 0) && flow.videoUrl) {
        console.log("[Generate] Blob empty, fetching video from URL:", flow.videoUrl);
        setStreamingStatus("📥 Loading video from storage...");
        try {
          const response = await fetch(flow.videoUrl);
          if (response.ok) {
            videoBlobToUse = await response.blob();
            console.log("[Generate] Fetched video blob, size:", videoBlobToUse.size);
          }
        } catch (fetchError) {
          console.error("[Generate] Failed to fetch video:", fetchError);
        }
      }
      
      if (videoBlobToUse && videoBlobToUse.size > 0) {
        console.log("[Generate] Using STREAMING mode with video blob, size:", videoBlobToUse.size);
        try {
          result = await generateWithStreaming(
            videoBlobToUse,
            fullStyleDirective,
            databaseContextStr || undefined,
            styleReferenceImage || undefined
          );
          
          // If streaming failed, fallback to server action
          if (!result.success) {
            console.log("[Generate] Streaming failed, falling back to server action:", result.error);
            setStreamingStatus("⚠️ Switching to backup mode...");
            result = await transmuteVideoToCode({
              videoUrl,
              styleDirective: fullStyleDirective,
              databaseContext: databaseContextStr || undefined,
              styleReferenceImage: styleReferenceImage || undefined,
            });
          }
        } catch (streamError: any) {
          console.error("[Generate] Streaming error, using fallback:", streamError);
          setStreamingStatus("⚠️ Switching to backup mode...");
          result = await transmuteVideoToCode({
            videoUrl,
            styleDirective: fullStyleDirective,
            databaseContext: databaseContextStr || undefined,
            styleReferenceImage: styleReferenceImage || undefined,
          });
        }
      } else {
        // Fallback to server action for URL-only cases
        console.log("[Generate] Using server action (no blob available)");
        result = await transmuteVideoToCode({
          videoUrl,
          styleDirective: fullStyleDirective,
          databaseContext: databaseContextStr || undefined,
          styleReferenceImage: styleReferenceImage || undefined,
        });
      }
      
      // Clear streaming status after generation
      setStreamingStatus(null);
      setStreamingCode(null);
      
      console.log("Generation result:", result);
      
      if (result && result.success && result.code) {
        // Track analytics
        updateProjectAnalytics(flow.id, "generation", result.tokenUsage?.totalTokens);
        
        // Set code and preview URL
        setGeneratedCode(result.code);
        const blob = new Blob([result.code], { type: "text/html" });
        setPreviewUrl(URL.createObjectURL(blob));
        
        // Check if tab is hidden - if so, store for immediate display when visible
        if (document.hidden) {
          console.log("Tab hidden - storing code for immediate display when visible");
          pendingCodeRef.current = result.code;
          // DON'T start streaming - the visibility handler will call completeGeneration
        } else {
          // Tab visible - normal streaming flow
          setIsStreamingCode(true);
        }
        // DON'T switch view here - let the streaming completion handler do it (to "preview")
        
        // Extract real stats from code - but DON'T set complete yet (streaming first)
        const buttonCount = (result.code.match(/<button/gi) || []).length;
        const imageCount = (result.code.match(/<img/gi) || []).length;
        const componentCount = (result.code.match(/<section|<header|<footer|<nav|<aside/gi) || []).length;
        
        // Store stats but don't show complete state yet
        setAnalysisPhase(prev => prev ? {
          ...prev,
          structureItems: (prev.structureItems || []).map(s => ({ ...s, status: "done" as const })),
          stats: {
            tech: "Tailwind CSS + Alpine.js",
            componentCount: componentCount + buttonCount,
            imageCount,
            theme: styleDirective || "Modern Design"
          }
        } : prev);
        
        // Add to generation history for persistence
        // Auto-generate title from code if user hasn't set one
        let currentTitle = generationTitle || "Untitled Project";
        let isAutoTitle = false;
        
        if (currentTitle === "Untitled Project") {
          const extractedName = extractProjectName(result.code);
          if (extractedName) {
            currentTitle = extractedName;
            isAutoTitle = true;
            // Update the title state so user sees it
            setGenerationTitle(extractedName);
            console.log(`[Auto-title] Generated name: "${extractedName}"`);
          }
        }
        
        // Create initial version
        const initialVersion: GenerationVersion = {
          id: generateId(),
          timestamp: Date.now(),
          label: "Initial generation",
          code: result.code,
          flowNodes: [],
          flowEdges: [],
          styleInfo: null,
        };
        
        const newGeneration: GenerationRecord = {
          id: generateId(),
          title: currentTitle,
          autoTitle: isAutoTitle,
          timestamp: Date.now(),
          status: "complete",
          code: result.code,
          styleDirective: styleDirective,
          refinements: refinements,
          flowNodes: [], // Will be populated after buildFlowLive
          flowEdges: [],
          styleInfo: null,
          videoUrl: videoUrl,
          thumbnailUrl: flow.thumbnail, // Save video thumbnail for history
          versions: [initialVersion], // Include initial version
          tokenUsage: result.tokenUsage, // Store Gemini API token usage
          costCredits: CREDIT_COSTS.VIDEO_GENERATE, // 75 credits per generation
        };
        setGenerations(prev => [...prev, newGeneration]);
        setActiveGeneration(newGeneration);
        // Reset published URL for new project (don't show old project's publish link)
        setPublishedUrl(null);
        
        // Immediately save to Supabase for cross-device sync
        saveGenerationToSupabase(newGeneration);
        
        // Set initial chat message showing generation is complete
        setChatMessages([{
          id: generateId(),
          role: "assistant",
          content: `**Boom. UI Reconstructed.** 🚀\n\nMatched the layout from your video using Tailwind CSS and Alpine.js for interactivity.\n\nReady to refine? Just tell me what to tweak.`,
          timestamp: Date.now(),
          quickActions: ["Make it mobile-friendly", "Tweak the colors", "Add hover effects", "Improve the spacing"]
        }]);
        
        // Generation complete - no toast needed, UI shows the result
      } else {
        const errorMsg = result?.error || "Generation failed. Please try again.";
        console.error("Generation failed:", errorMsg);
        setAnalysisDescription(`Error: ${errorMsg}`);
        showToast(errorMsg, "error");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      // Check for 413 payload too large
      let errorMsg = error.message || "Unknown error occurred";
      if (errorMsg.includes("413") || errorMsg.includes("payload") || errorMsg.includes("too large")) {
        errorMsg = "Video file is too large for processing. Try a shorter clip.";
      }
      setAnalysisDescription(`Error: ${errorMsg}`);
      showToast(errorMsg, "error");
      setIsProcessing(false);
      generationStartTimeRef.current = null;
    } finally {
      // Don't set isProcessing to false here - let the streaming effect handle it
      // isProcessing will be set to false when streaming completes
      // This prevents the loading state from disappearing while code is still being streamed
      
      // Release Wake Lock when generation ends (success or error)
      if (wakeLock) {
        try {
          await wakeLock.release();
          console.log("Wake Lock released");
        } catch (e) {
          console.log("Wake Lock release failed:", e);
        }
      }
    }
  };

  // Auto-generate project name from HTML content
  const extractProjectName = (code: string): string | null => {
    // Try to extract from <title> tag
    const titleMatch = code.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      const title = titleMatch[1].trim();
      if (title && title.length > 0 && title.length < 50 && !title.toLowerCase().includes('untitled')) {
        return title;
      }
    }
    
    // Try to extract from nav/header logo or brand text
    // Look for text in logo area, brand element, or first link in nav
    const brandPatterns = [
      /<(?:a|span|div)[^>]*class="[^"]*(?:logo|brand|site-name)[^"]*"[^>]*>([^<]+)</i,
      /<nav[^>]*>[\s\S]*?<(?:a|span|div)[^>]*>([A-Z][a-zA-Z0-9\s]{2,20})</,
      /<header[^>]*>[\s\S]*?<(?:a|span|div)[^>]*>([A-Z][a-zA-Z0-9\s]{2,20})</,
    ];
    
    for (const pattern of brandPatterns) {
      const match = code.match(pattern);
      if (match && match[1]) {
        const brand = match[1].trim().replace(/<[^>]*>/g, '');
        if (brand && brand.length >= 2 && brand.length < 30 && /^[A-Z]/.test(brand)) {
          return brand;
        }
      }
    }
    
    // Try to extract from first H1 (hero headline)
    const h1Match = code.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      // Clean HTML tags and get text
      let h1Text = h1Match[1].replace(/<[^>]*>/g, ' ').trim();
      // Remove multiple spaces
      h1Text = h1Text.replace(/\s+/g, ' ').trim();
      // Take first 3-4 words or 30 chars max
      const words = h1Text.split(' ').slice(0, 4).join(' ');
      if (words && words.length >= 3 && words.length < 40) {
        return words;
      }
    }
    
    // Try to find any prominent brand-like text (capitalized words in header area)
    const headerArea = code.match(/<(?:header|nav)[^>]*>([\s\S]*?)<\/(?:header|nav)>/i);
    if (headerArea) {
      const capitalizedMatch = headerArea[1].match(/>([A-Z][a-zA-Z0-9]+(?:\s+[A-Z]?[a-zA-Z0-9]+)?)</);
      if (capitalizedMatch && capitalizedMatch[1]) {
        const text = capitalizedMatch[1].trim();
        if (text.length >= 2 && text.length < 25) {
          return text;
        }
      }
    }
    
    return null;
  };

  // Generate description based on code content
  const generateAnalysisDescription = (code: string, style: string): string => {
    const hasHeader = /<header|<nav/i.test(code);
    const hasHero = /hero|banner|jumbotron/i.test(code);
    const hasCards = /card|grid.*card/i.test(code);
    const hasForms = /<form|<input/i.test(code);
    const hasFooter = /<footer/i.test(code);
    const buttonCount = (code.match(/<button/gi) || []).length;
    const imageCount = (code.match(/<img/gi) || []).length;
    
    let desc = `Generated a modern ${style || "clean"} web page`;
    
    const features: string[] = [];
    if (hasHeader) features.push("navigation header");
    if (hasHero) features.push("hero section");
    if (hasCards) features.push("card components");
    if (hasForms) features.push("interactive forms");
    if (hasFooter) features.push("footer");
    
    if (features.length > 0) {
      desc += ` featuring ${features.slice(0, 3).join(", ")}`;
      if (features.length > 3) desc += ` and more`;
    }
    
    desc += `. Includes ${buttonCount} interactive button${buttonCount !== 1 ? 's' : ''}`;
    if (imageCount > 0) desc += ` and ${imageCount} image${imageCount !== 1 ? 's' : ''}`;
    desc += `. Built with Tailwind CSS and Alpine.js for smooth interactions and modern styling.`;
    
    return desc;
  };

  // Convert image URL to base64 (for sending to AI)
  const urlToBase64 = useCallback(async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data URL prefix to get just the base64
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Error converting URL to base64:", e);
      return null;
    }
  }, []);

  // Handle paste for images in chat/edit input (CTRL+V)
  const handlePasteImage = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return;
    
    // Check for files first (screenshot, copied file)
    const files = clipboardData.files;
    const items = clipboardData.items;
    
    // Try to find an image in files
    let imageFile: File | null = null;
    
    if (files && files.length > 0) {
      for (const file of Array.from(files)) {
        if (file.type.startsWith('image/')) {
          imageFile = file;
          break;
        }
      }
    }
    
    // If no file found, check items (for some browsers)
    if (!imageFile && items) {
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          imageFile = item.getAsFile();
          if (imageFile) break;
        }
      }
    }
    
    // If no image found, let default paste behavior happen
    if (!imageFile) return;
    
    // Prevent default to stop text paste
    e.preventDefault();
    
    // Create temporary preview immediately
    const tempId = generateId();
    const tempUrl = URL.createObjectURL(imageFile);
    const imgName = `Zdjęcie ${new Date().toLocaleTimeString()}`;
    
    // Add with uploading state
    setEditImages(prev => [...prev, { id: tempId, url: tempUrl, name: imgName, file: imageFile!, uploading: true }]);
    showToast("📷 Wgrywanie zdjęcia...", "info");
    
    // Upload to Supabase
    try {
      const formData = new FormData();
      formData.append('file', imageFile, `pasted-${Date.now()}.png`);
      formData.append('userId', user?.id || 'anon');
      
      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update with real URL
        setEditImages(prev => prev.map(img => 
          img.id === tempId ? { ...img, url: data.url, uploading: false } : img
        ));
        showToast("✅ Zdjęcie dołączone!", "success");
      } else {
        // Remove failed upload
        setEditImages(prev => prev.filter(img => img.id !== tempId));
        showToast("❌ Nie udało się wgrać zdjęcia", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setEditImages(prev => prev.filter(img => img.id !== tempId));
      showToast("❌ Błąd podczas wgrywania", "error");
    }
  }, [user?.id, showToast]);

  const handleEdit = async () => {
    // Prevent double execution
    if (isEditing) {
      console.log('[handleEdit] Already editing, skipping...');
      return;
    }
    
    console.log('[handleEdit] Starting edit...');
    console.log('[handleEdit] editInput:', editInput);
    console.log('[handleEdit] editImages:', editImages.length);
    console.log('[handleEdit] editableCode exists:', !!editableCode);
    
    if ((!(editInput || "").trim() && editImages.length === 0) || !editableCode) {
      console.log('[handleEdit] Early return - no input or no code');
      showToast("Enter a description of what to change", "error");
      return;
    }
    
    // Auth gate
    if (!user) {
      console.log('[handleEdit] No user - showing auth modal');
      setPendingAction("edit");
      setShowAuthModal(true);
      return;
    }
    
    // Credits gate
    if (!canAfford(CREDIT_COSTS.AI_EDIT)) {
      console.log('[handleEdit] Not enough credits');
      setShowOutOfCreditsModal(true);
      return;
    }
    
    // Spend credits
    try {
      console.log('[handleEdit] Spending credits...');
      const spendRes = await fetch("/api/credits/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cost: CREDIT_COSTS.AI_EDIT,
          reason: "ai_edit",
          referenceId: `edit_${Date.now()}`,
        }),
      });
      const spendData = await spendRes.json();
      console.log('[handleEdit] Spend result:', spendData);
      if (!spendData.success) {
        setShowOutOfCreditsModal(true);
        return;
      }
      refreshCredits();
    } catch (error) {
      console.error("[handleEdit] Failed to spend credits:", error);
      showToast("Failed to process credits", "error");
      return;
    }
    
    setIsEditing(true);
    
    // Extract page name from editInput to track which file is being generated
    const pageMatch = editInput.match(/@([a-zA-Z0-9-_]+)/);
    if (pageMatch) {
      const pageName = pageMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      setGeneratingFilePath(`/pages/${pageName}.html`);
    }
    
    try {
      // Include selected node context if any
      let prompt = editInput;
      if (selectedArchNode) {
        prompt = `For the @${selectedArchNode} element: ${editInput}`;
      }
      
      // Process images - use Supabase URLs directly, convert blob URLs to base64
      let imageData: { base64?: string; url?: string; mimeType: string; name: string }[] = [];
      if (editImages.length > 0) {
        console.log('[handleEdit] Processing', editImages.length, 'images');
        for (const img of editImages) {
          try {
            // Check if it's a Supabase URL (public URL)
            if (img.url.startsWith('https://') && !img.url.startsWith('blob:')) {
              // Use URL directly
              console.log('[handleEdit] Using Supabase URL:', img.url);
              imageData.push({
                url: img.url,
                mimeType: 'image/png',
                name: img.name,
              });
            } else {
              // Convert blob URL to base64
              let blob: Blob;
              if (img.file) {
                blob = img.file;
              } else {
                const response = await fetch(img.url);
                blob = await response.blob();
              }
              const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  const result = reader.result as string;
                  if (result && result.includes(',')) {
                    const base64Data = result.split(',')[1];
                    resolve(base64Data || '');
                  } else {
                    reject(new Error('Invalid base64 result'));
                  }
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
              });
              if (base64 && base64.length > 100) {
                imageData.push({
                  base64,
                  mimeType: blob.type || 'image/png',
                  name: img.name,
                });
              }
            }
          } catch (e) {
            console.error('Failed to process image:', img.name, e);
          }
        }
        console.log('[handleEdit] Successfully processed', imageData.length, 'images');
      }
      
      console.log('[handleEdit] Calling editCodeWithAI with prompt:', prompt.substring(0, 100));
      console.log('[handleEdit] Images to send:', imageData.length);
      
      // Get database context if connected
      let editDbContext: string | undefined;
      if (activeGeneration) {
        try {
          const dbCtx = await getDatabaseContext(activeGeneration.id);
          if (dbCtx.isConnected) {
            editDbContext = formatDatabaseContextForPrompt(dbCtx);
            console.log('[handleEdit] Database context loaded:', dbCtx.tables);
          }
        } catch {}
      }
      
      const result = await editCodeWithAI(editableCode, prompt, imageData.length > 0 ? imageData : undefined, editDbContext);
      
      console.log('[handleEdit] Full result:', JSON.stringify({ success: result.success, error: result.error, codeLength: result.code?.length }));
      console.log('[handleEdit] Result code exists:', !!result.code);
      console.log('[handleEdit] Result code type:', typeof result.code);
      
      if (result.success && result.code && result.code.length > 0) {
        console.log('[handleEdit] SUCCESS - Applying code changes...');
        
        // Track analytics
        if (activeGeneration) {
          updateProjectAnalytics(activeGeneration.id, "edit");
        }
        
        // Save current state as a version before applying changes
        if (activeGeneration && generatedCode) {
          console.log('[handleEdit] Saving version...');
          const versionLabel = selectedArchNode 
            ? `AI Edit: @${selectedArchNode}` 
            : `AI Edit: ${editInput.slice(0, 30)}${editInput.length > 30 ? '...' : ''}`;
          
          const newVersion: GenerationVersion = {
            id: generateId(),
            timestamp: Date.now(),
            label: versionLabel,
            code: result.code,
            flowNodes: [...flowNodes],
            flowEdges: [...flowEdges],
            styleInfo: styleInfo ? { ...styleInfo } : null,
          };
          
          setGenerations(prev => prev.map(gen => {
            if (gen.id === activeGeneration.id) {
              const existingVersions = gen.versions || [];
              const updatedVersions = [...existingVersions, newVersion].slice(-20);
              return { ...gen, versions: updatedVersions };
            }
            return gen;
          }));
          
          setActiveGeneration(prev => {
            if (!prev) return prev;
            const existingVersions = prev.versions || [];
            const updatedVersions = [...existingVersions, newVersion].slice(-20);
            // Also save to Supabase for sync
            const updatedGen: GenerationRecord = { 
              ...prev, 
              versions: updatedVersions, 
              code: result.code || prev.code 
            };
            saveGenerationToSupabase(updatedGen);
            return updatedGen;
          });
        }
        
        console.log('[handleEdit] Setting generatedCode...');
        setGeneratedCode(result.code);
        console.log('[handleEdit] Setting editableCode...');
        setEditableCode(result.code);
        console.log('[handleEdit] Setting displayedCode...');
        setDisplayedCode(result.code);
        console.log('[handleEdit] Creating preview URL...');
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const newPreviewUrl = URL.createObjectURL(new Blob([result.code], { type: "text/html" }));
        setPreviewUrl(newPreviewUrl);
        console.log('[handleEdit] Preview URL created:', newPreviewUrl);
        // Debug: Check if new page was injected
        const pageMatches = result.code.match(/x-show\s*=\s*["']currentPage\s*===\s*['"]([^'"]+)['"]/gi);
        console.log('[handleEdit] Pages found in returned code:', pageMatches?.map(m => m.match(/['"]([^'"]+)['"]$/)?.[1]));
        console.log('[handleEdit] Building architecture...');
        buildArchitectureLive(result.code);
        console.log('[handleEdit] Building flow...');
        buildFlowLive(result.code);
        console.log('[handleEdit] Extracting style info...');
        setStyleInfo(extractStyleInfo(result.code));
        
        // Regenerate file structure with the new code
        const newCode = result.code;
        setTimeout(() => {
          console.log('[handleEdit] Regenerating file structure...');
          const files = generateFileStructure(newCode, flowNodes, codeMode);
          setGeneratedFiles(files);
          setGeneratingFilePath(null);
        }, 100);
        
        console.log('[handleEdit] ALL DONE - showing toast');
        showToast("Changes applied!", "success");
        
        // Add response to chat explaining what was done
        const responseMsg = analyzeCodeChanges(editableCode, result.code, editInput);
        setChatMessages(prev => [...prev, 
          { id: generateId(), role: "user", content: editInput, timestamp: Date.now() - 1 },
          { id: generateId(), role: "assistant", content: responseMsg, timestamp: Date.now() }
        ]);
        
        // Switch to preview tab to show the result
        setViewMode("preview");
        
        // Only close panel and clear state on success
        setIsEditing(false);
        setEditInput("");
        setSelectedElement(null);
        editImages.forEach(img => URL.revokeObjectURL(img.url));
        setEditImages([]);
        setShowFloatingEdit(false);
        setSelectedArchNode(null);
      } else {
        // Show error but keep panel open so user can retry
        console.error('[handleEdit] AI edit failed:', result.error);
        showToast(result.error || "Edit failed - try again", "error");
        setIsEditing(false);
        setSelectedElement(null); // Clear pointer selection on error
      }
    } catch (error: any) {
      console.error("Edit error:", error);
      showToast(error.message || "Failed to edit - try again", "error");
      setIsEditing(false);
      setSelectedElement(null); // Clear pointer selection on error
    }
  };

  const applyCodeChanges = () => {
    if (editableCode) {
      // Update the source HTML
      setGeneratedCode(editableCode);
      setDisplayedCode(editableCode);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(new Blob([editableCode], { type: "text/html" })));
      setIsCodeEditable(false);
      
      // Regenerate file structure with updated code
      const files = generateFileStructure(editableCode, flowNodes, codeMode);
      setGeneratedFiles(files);
    }
  };
  
  // When entering edit mode, always show the raw HTML for editing
  const handleEnterEditMode = () => {
    setEditableCode(generatedCode || displayedCode);
    setIsCodeEditable(true);
    // Switch to single-file mode for editing the actual HTML
    setCodeMode("single-file");
    setActiveFilePath("/pages/index.html");
  };

  const handleDownload = () => {
    if (!editableCode) return;
    
    // Demo mode: require sign up to download
    if (isDemoMode && !user) {
      setShowAuthModal(true);
      showToast("Sign up free to download code. You get 1 free generation!", "info");
      return;
    }
    
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([editableCode], { type: "text/html" }));
    // Use project title for filename, sanitize for safe filename
    const filename = (generationTitle || "generated")
      .replace(/[^a-zA-Z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 50) || "generated";
    a.download = `${filename}.html`;
    a.click();
  };

  const handlePublishClick = () => {
    if (!editableCode) return;
    
    // Demo mode: require sign up to publish
    if (isDemoMode && !user) {
      setShowAuthModal(true);
      showToast("Sign up free to publish. You get 1 free generation!", "info");
      return;
    }
    
    // Initialize published URL from active generation if exists
    if (activeGeneration?.publishedSlug) {
      setPublishedUrl(`https://www.replay.build/p/${activeGeneration.publishedSlug}`);
    }
    setShowPublishModal(true);
  };

  const handlePublish = async () => {
    if (!editableCode || isPublishing) return;
    
    setIsPublishing(true);
    try {
      // ONLY use the slug from the active generation - never from publishedUrl state (which could be from a different project)
      const existingSlug = activeGeneration?.publishedSlug;
      console.log('[handlePublish] existingSlug:', existingSlug, 'activeGeneration:', activeGeneration?.id);
      
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editableCode,
          title: generationTitle || "Untitled Project",
          thumbnailDataUrl: null,
          existingSlug,
        }),
      });
      
      const data = await response.json();
      console.log('[handlePublish] API response:', data);
      
      if (data.success && data.url) {
        const newSlug = data.slug;
        setPublishedUrl(data.url);
        
        // Save the slug to the generation record for future updates
        if (newSlug) {
          if (activeGeneration) {
            const updatedGen: GenerationRecord = {
              ...activeGeneration,
              publishedSlug: newSlug,
            };
            setActiveGeneration(updatedGen);
            setGenerations(prev => prev.map(g => 
              g.id === activeGeneration.id ? updatedGen : g
            ));
            // Also save to Supabase
            saveGenerationToSupabase(updatedGen);
          }
          // Skip localStorage save here - let the dedicated effect handle it
          // This prevents quota issues from multiple save attempts
        }
        
        // Track export analytics
        if (activeGeneration && !data.updated) {
          updateProjectAnalytics(activeGeneration.id, "export");
        }
        
        showToast(data.updated ? "Project updated!" : "Project published!", "success");
      } else {
        showToast(data.error || "Failed to publish", "error");
      }
    } catch (error) {
      console.error("Publish error:", error);
      showToast("Failed to publish project", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleRefresh = () => {
    // Disable editing modes on refresh
    setIsDirectEditMode(false);
    setIsPointAndEdit(false);
    setSelectedElement(null);
    
    // Refresh the preview by re-creating the blob URL
    if (editableCode) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(new Blob([editableCode], { type: "text/html" })));
      // Rebuild architecture, flow and style
      buildArchitectureLive(editableCode);
      buildFlowLive(editableCode);
      setStyleInfo(extractStyleInfo(editableCode));
    }
  };

  // Select architecture node and open edit
  const handleArchNodeClick = (nodeId: string) => {
    if (selectedArchNode === nodeId) {
      setSelectedArchNode(null);
    } else if (!isEditing) {
      setSelectedArchNode(nodeId);
      setEditInput(`@${nodeId} `);
      setShowFloatingEdit(true);
    }
  };

  // File Tree Item Component for Code tab
  const FileTreeItem = ({ 
    item, 
    activeFilePath, 
    onFileClick, 
    onFolderToggle,
    expandedFolders,
    generatingPath,
    depth = 0 
  }: { 
    item: FileTreeFolder | FileTreeFile;
    activeFilePath: string;
    onFileClick: (path: string, isStub?: boolean, nodeId?: string) => void;
    onFolderToggle: (path: string) => void;
    expandedFolders: Set<string>;
    generatingPath?: string | null;
    depth?: number;
  }) => {
    const paddingLeft = depth * 12 + 4;
    
    if (item.type === "folder") {
      const folder = item as FileTreeFolder;
      const isExpanded = expandedFolders.has(folder.path);
      const folderColors: Record<string, string> = {
        pages: "text-blue-400/60",
        components: "text-yellow-400/60",
        styles: "text-purple-400/60",
        types: "text-green-400/60",
        layout: "text-cyan-400/60",
        sections: "text-orange-400/60"
      };
      const colorClass = folderColors[folder.name] || "text-white/40";
      
      return (
        <div>
          <button
            onClick={() => onFolderToggle(folder.path)}
            className="w-full flex items-center gap-1 px-1 py-0.5 hover:bg-white/5 rounded text-white/50 transition-colors min-w-0"
            style={{ paddingLeft }}
          >
            <ChevronRight className={cn("w-2.5 h-2.5 flex-shrink-0 transition-transform", isExpanded && "rotate-90")} />
            <Folder className={cn("w-3 h-3 flex-shrink-0", colorClass)} />
            <span className="text-[10px] truncate">{folder.name}</span>
            <span className="flex-shrink-0 ml-auto text-[8px] text-white/20">{folder.children.length}</span>
          </button>
          {isExpanded && (
            <div>
              {folder.children
                .sort((a, b) => {
                  // Folders first, then files
                  if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
                  return a.name.localeCompare(b.name);
                })
                .map((child) => (
                  <FileTreeItem
                    key={child.path}
                    item={child}
                    activeFilePath={activeFilePath}
                    onFileClick={onFileClick}
                    onFolderToggle={onFolderToggle}
                    expandedFolders={expandedFolders}
                    generatingPath={generatingPath}
                    depth={depth + 1}
                  />
                ))}
            </div>
          )}
        </div>
      );
    }
    
    // File
    const file = item as FileTreeFile;
    const isActive = file.path === activeFilePath;
    const isStub = file.isStub;
    const isGenerating = generatingPath === file.path || generatingPath === file.sourceNodeId;
    
    const fileIcons: Record<string, { icon: typeof FileCode; color: string }> = {
      page: { icon: FileCode, color: "text-blue-400" },
      component: { icon: Box, color: "text-yellow-400" },
      style: { icon: Paintbrush, color: "text-purple-400" },
      type: { icon: FileCode, color: "text-green-400" },
      stub: { icon: FileCode, color: "text-white/20" }
    };
    const { icon: FileIcon, color: iconColor } = fileIcons[file.fileType] || fileIcons.page;
    
    return (
      <button
        onClick={() => !isGenerating && onFileClick(file.path, isStub, file.sourceNodeId)}
        className={cn(
          "w-full flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] transition-colors min-w-0",
          isGenerating 
            ? "bg-[#FF6E3C]/5 text-[#FF6E3C]/70 animate-pulse"
            : isActive 
              ? "bg-[#FF6E3C]/10 text-[#FF6E3C]" 
              : isStub 
                ? "text-white/20 hover:bg-white/5 italic" 
                : "text-white/50 hover:bg-white/5 hover:text-white/70"
        )}
        style={{ paddingLeft: paddingLeft + 14 }}
        title={isGenerating ? `Generating ${file.name}...` : isStub ? `${file.name} - Click to create with AI` : file.name}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="w-3 h-3 flex-shrink-0 text-[#FF6E3C] animate-spin" />
        ) : (
          <FileIcon className={cn("w-3 h-3 flex-shrink-0", isActive ? "text-[#FF6E3C]" : isStub ? "opacity-30" : iconColor)} />
        )}
        <span className={cn("truncate", isStub && "opacity-60", isGenerating && "text-[#FF6E3C]/70")}>{file.name}</span>
        {isGenerating && <span className="flex-shrink-0 ml-auto text-[8px] text-[#FF6E3C]/60 animate-pulse">...</span>}
        {isStub && !isGenerating && <span className="flex-shrink-0 ml-auto text-[7px] text-[#FF6E3C]/50">+</span>}
      </button>
    );
  };

  const EmptyState = ({ icon: Icon, title, subtitle, showEarlyAccess = false }: { icon: any; title: string; subtitle: string; showEarlyAccess?: boolean }) => (
    <div className="empty-state">
      <div className="empty-logo-container">
        {Icon === "logo" ? (
          <svg className="empty-logo" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="currentColor" strokeWidth="11.6182" strokeLinejoin="round"/>
            <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" fill="currentColor"/>
          </svg>
        ) : (
          <Icon className="w-12 h-12 text-white/10 mx-auto" />
        )}
      </div>
      <p className="text-base text-white/25 mt-6">{title}</p>
      <p className="text-lg text-white/15 mt-1">{subtitle}</p>
      {showEarlyAccess && (
        <div className="mt-6 px-4 py-3 rounded-xl bg-[#FF6E3C]/5 border border-[#FF6E3C]/10 max-w-xs">
          <p className="text-xs text-[#FF6E3C]/80 font-medium">Early Access</p>
          <p className="text-[10px] text-white/40 mt-1">We're reconstructing real-world UI behavior — edge cases welcome.</p>
        </div>
      )}
    </div>
  );

  // Stable loading message - doesn't depend on streamingMessage to prevent flickering
  const [loadingMessage, setLoadingMessage] = useState("Reconstructing from video...");
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  
  // Rotate tips every 5 seconds - AnimatePresence handles the transition
  useEffect(() => {
    if (!isProcessing && !isStreamingCode && !isEditing) return;
    
    const tipInterval = setInterval(() => {
      // Just update the index - AnimatePresence handles smooth fade
      setCurrentTipIndex(prev => (prev + 1) % GENERATION_TIPS.length);
    }, 5000);
    
    return () => clearInterval(tipInterval);
  }, [isProcessing, isStreamingCode, isEditing]);
  
  // Rotate loading messages - AnimatePresence handles the transition animation
  useEffect(() => {
    if (!isProcessing && !isStreamingCode && !isEditing) return;
    
    // Use update messages when editing, otherwise use normal streaming messages
    const msgs = isEditing ? STREAMING_MESSAGES_UPDATE : getStreamingMessages();
    const defaultMsg = isEditing ? "Updating your project..." : "Reconstructing from video...";
    let index = 0;
    
    // Set initial message
    setLoadingMessage(msgs[0] || defaultMsg);
    
    const interval = setInterval(() => {
      // Just update the message - AnimatePresence handles smooth fade
      index = (index + 1) % msgs.length;
      setLoadingMessage(msgs[index] || defaultMsg);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isProcessing, isStreamingCode, isEditing, viewMode]); // Only depend on stable values
  
  const LoadingState = ({ customMessage }: { customMessage?: string }) => {
    const defaultMsg = isEditing ? "Updating your project..." : "Reconstructing from video...";
    const displayMessage = customMessage || loadingMessage || defaultMsg;
    // Using parent state for tips to persist across renders
    
    return (
      <div className="w-full h-full flex flex-col bg-[#050505] overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          
          {/* Skeleton UI with Logo in Center */}
          <div className="w-full max-w-2xl relative">
            {/* Centered Logo with Gradient Sweep - Overlay on skeleton */}
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="relative">
                {/* Animated Glow */}
                <div className="absolute inset-0 blur-2xl bg-[#FF6E3C]/30 scale-[2]" style={{ animation: "glow-pulse 2s ease-in-out infinite" }} />
                {/* Logo with gradient sweep */}
                <div className="logo-loader-container relative">
                  <svg className="logo-loader-svg" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" />
                    <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" />
                  </svg>
                  <div className="logo-loader-gradient" />
                </div>
              </div>
            </div>
            
            {/* Skeleton Frame - More visible */}
            <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-black/40 opacity-50">
              {/* Skeleton Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
                <div className="w-6 h-6 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite" }} />
                <div className="w-24 h-3 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.1s" }} />
                <div className="flex-1" />
                <div className="flex gap-2">
                  <div className="w-16 h-6 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.2s" }} />
                  <div className="w-16 h-6 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.3s" }} />
                </div>
              </div>
              
              {/* Skeleton Body */}
              <div className="flex min-h-[220px]">
                {/* Sidebar */}
                <div className="w-40 border-r border-white/[0.06] p-3 space-y-2 hidden sm:block">
                  <div className="w-full h-7 rounded bg-white/5" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.1s" }} />
                  <div className="w-3/4 h-7 rounded bg-white/[0.03]" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.2s" }} />
                  <div className="w-5/6 h-7 rounded bg-white/[0.03]" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.3s" }} />
                  <div className="w-2/3 h-7 rounded bg-white/[0.03]" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.4s" }} />
                </div>
                
                {/* Main Content */}
                <div className="flex-1 p-4">
                  <div className="w-2/3 h-5 rounded bg-white/5 mb-3" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.1s" }} />
                  <div className="w-1/2 h-3 rounded bg-white/[0.03] mb-6" style={{ animation: "skeleton-pulse 2s ease-in-out infinite 0.2s" }} />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-lg border border-white/[0.04] p-3 bg-white/[0.02]">
                        <div className="w-8 h-8 rounded bg-white/5 mb-2" style={{ animation: `skeleton-pulse 2s ease-in-out infinite ${0.1 * i}s` }} />
                        <div className="w-full h-3 rounded bg-white/5 mb-1.5" style={{ animation: `skeleton-pulse 2s ease-in-out infinite ${0.1 * i + 0.1}s` }} />
                        <div className="w-2/3 h-2 rounded bg-white/[0.03]" style={{ animation: `skeleton-pulse 2s ease-in-out infinite ${0.1 * i + 0.2}s` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Status Message - Below skeleton, centered with smooth fade animation */}
          <div className="h-8 mt-6 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={displayMessage}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="text-sm text-white/50 text-center"
              >
                {displayMessage}
              </motion.p>
            </AnimatePresence>
          </div>
          
          {/* Tip Banner - Below status, centered with smooth fade animation */}
          <div className="w-full max-w-lg mt-4 h-12 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentTipIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="font-mono text-[10px] text-white/35 leading-relaxed text-center"
              >
                {GENERATION_TIPS[currentTipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Live Code Streaming - Shows code being written in real-time */}
          {(streamingCode || streamingLines > 0) && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl mt-6 rounded-xl border border-white/[0.08] overflow-hidden"
              style={{ background: '#0a0a0a' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]" style={{ background: '#0d0d0d' }}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF6E3C] animate-pulse" />
                  <span className="text-[10px] text-white/50 font-mono">
                    {streamingStatus || "Writing code..."}
                  </span>
                  {streamingLines > 0 && (
                    <span className="text-[9px] text-[#FF6E3C]/70 font-mono ml-2">
                      {streamingLines} lines
                    </span>
                  )}
                </div>
              </div>
              
              {/* Live Code Display */}
              <div className="p-3 h-[140px] overflow-hidden relative font-mono text-[10px] leading-relaxed">
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
                <pre className="m-0 pt-2 whitespace-pre-wrap break-words">
                  {streamingCode ? (
                    streamingCode.split('\n').slice(-10).map((line, i) => (
                      <div key={i} className="min-h-[14px]">
                        {/* Syntax highlighting */}
                        {line.split(/(<[^>]+>|"[^"]*"|'[^']*'|\/\*.*\*\/|\/\/.*$|{|}|\(|\)|class=|className=|style=|\b(?:const|let|var|function|return|if|else|for|while|import|export|from|default)\b)/g).map((part, j) => {
                          if (!part) return null;
                          if (part.startsWith('<') && part.endsWith('>')) return <span key={j} className="text-[#7fdbca]">{part}</span>;
                          if (part.startsWith('"') || part.startsWith("'")) return <span key={j} className="text-[#ecc48d]">{part}</span>;
                          if (part.startsWith('//') || part.startsWith('/*')) return <span key={j} className="text-[#637777]">{part}</span>;
                          if (/^(const|let|var|function|return|if|else|for|while|import|export|from|default)$/.test(part)) return <span key={j} className="text-[#c792ea]">{part}</span>;
                          if (part === 'class=' || part === 'className=' || part === 'style=') return <span key={j} className="text-[#addb67]">{part}</span>;
                          if (part === '{' || part === '}' || part === '(' || part === ')') return <span key={j} className="text-[#ffd700]">{part}</span>;
                          return <span key={j} className="text-[#d6deeb]">{part}</span>;
                        })}
                      </div>
                    ))
                  ) : (
                    <span className="text-white/20">Waiting for code...</span>
                  )}
                  <span className="inline-block w-2 h-4 bg-[#FF6E3C] ml-0.5 animate-pulse" />
                </pre>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  // Render edit input with highlighted @tags
  const renderEditDisplay = () => {
    const parts = editInput.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="at-tag">{part}</span>;
      }
      return part;
    });
  };

  // ====== MOBILE SAVE GENERATION HANDLER ======
  // Must be defined BEFORE any early returns to follow React hooks rules
  const handleMobileSaveGeneration = useCallback((data: { title: string; code: string; videoUrl?: string }) => {
    console.log("[MOBILE] Saving generation to history:", data.title);
    
    // Create initial version
    const initialVersion: GenerationVersion = {
      id: generateId(),
      timestamp: Date.now(),
      label: "Initial generation",
      code: data.code,
      flowNodes: [],
      flowEdges: [],
      styleInfo: null,
    };
    
    // Create generation record (same structure as desktop)
    const newGeneration: GenerationRecord = {
      id: generateId(),
      title: data.title,
      autoTitle: true,
      timestamp: Date.now(),
      status: "complete",
      code: data.code,
      styleDirective: "Mobile generation",
      refinements: "",
      flowNodes: [],
      flowEdges: [],
      styleInfo: null,
      videoUrl: data.videoUrl,
      versions: [initialVersion],
      costCredits: CREDIT_COSTS.VIDEO_GENERATE,
    };
    
    // Add to local state
    setGenerations(prev => [...prev, newGeneration]);
    setActiveGeneration(newGeneration);
    setGeneratedCode(data.code);
    
    // Save to Supabase for cross-device sync
    saveGenerationToSupabase(newGeneration);
    
    console.log("[MOBILE] Generation saved:", newGeneration.id);
  }, [saveGenerationToSupabase]);

  // ====== DEVICE DETECTION LOADING ======
  if (isMobile === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#FF6E3C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ====== MOBILE HARD FORK ======
  // Mobile uses server-side async processing (like Bolt/Lovable)
  // User can lock screen - generation continues on server
  // EXCEPTION: Stay in desktop view if:
  // - ?projects=true is in URL
  // - showHistoryMode is active (checked synchronously in useState initializer)
  // - We have an active/loaded project (generatedCode or activeGeneration)
  const hasActiveProject = !!generatedCode || !!activeGeneration;
  const shouldShowMobileLayout = isMobile === true && 
    searchParams.get('projects') !== 'true' && 
    !showHistoryMode && 
    !hasActiveProject;
  
  if (shouldShowMobileLayout) {
    return (
      <>
        <MobileLayout
          user={user}
          isPro={isPaidPlan}
          plan={membership?.plan || "free"}
          credits={userTotalCredits}
          creditsLoading={creditsLoading}
          onLogin={() => setShowAuthModal(true)}
          onOpenCreditsModal={() => setShowProfileMenu(true)}
          onCreditsRefresh={refreshCredits}
          onSaveGeneration={handleMobileSaveGeneration}
          onOpenHistory={() => setShowHistoryMode(true)}
        />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setPendingAction(null);
          }}
          title="Sign in to continue"
          description="Your scans and credits are saved to your account."
        />
        <OutOfCreditsModal
          isOpen={showOutOfCreditsModal}
          onClose={() => setShowOutOfCreditsModal(false)}
          requiredCredits={CREDIT_COSTS.VIDEO_GENERATE}
          availableCredits={userTotalCredits}
        />
      </>
    );
  }

  // ====== DESKTOP APP ======
  return (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden font-poppins">
      <div className="gradient-bg" />
      <div className="grain-overlay" />
      <div className="vignette" />
      
      {/* Desktop Header removed - Logo now in sidebar, tabs in work area */}
      
      {/* Mobile Header - Fixed - Hide when panels with own headers are open */}
      {!(mobilePanel === "chat" && generatedCode) && mobilePanel !== "preview" && mobilePanel !== "code" && mobilePanel !== "flow" && mobilePanel !== "design" && mobilePanel !== "input" && (
        <header className="fixed top-0 left-0 right-0 z-50 flex md:hidden items-center justify-between px-4 py-3 border-b border-white/5 bg-black/95 backdrop-blur-xl">
          <a href="/" className="hover:opacity-80 transition-opacity">
            <Logo />
          </a>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center justify-center"
          >
            {user ? (
              <span className={cn(
                "text-xs font-semibold uppercase",
                isPaidPlan ? "text-[#FF6E3C]" : "text-white/50"
              )}>
                {isPaidPlan ? (membership?.plan === "agency" ? "Agency" : "Pro") : "Free"}
              </span>
            ) : (
              <User className="w-5 h-5 text-white/60" />
            )}
          </button>
        </header>
      )}
      
      {/* Mobile Menu - Full Screen Overlay - Static */}
      {showMobileMenu && (
          <div className="fixed inset-0 z-[100] bg-[#0a0a0a] md:hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 safe-area-pt">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#FF6E3C]" />
                  <span className="text-base font-semibold text-white">Account</span>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="p-3 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-auto">
              
              {user ? (
                <>
                  {/* Credits section */}
                  {(() => {
                    const plan = membership?.plan || "free";
                    const maxCredits = plan === "agency" ? 10000 : plan === "pro" ? 3000 : 100;
                    const percentage = Math.min(100, (userTotalCredits / maxCredits) * 100);
                    return (
                      <Link 
                        href="/settings?tab=plans" 
                        onClick={() => setShowMobileMenu(false)}
                        className="block p-4 hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-white">{userTotalCredits} credits</span>
                            {isPaidPlan ? (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white uppercase">
                                {plan === "agency" ? "Agency" : plan === "enterprise" ? "Enterprise" : "Pro"}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/10 text-white/50 uppercase">
                                Free
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/40" />
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        {!isPaidPlan && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-[#FF6E3C] font-medium">Upgrade →</span>
                          </div>
                        )}
                        {isPaidPlan && (
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-white/40">Add credits →</span>
                          </div>
                        )}
                      </Link>
                    );
                  })()}
                  
                  <div className="p-2 space-y-1">
                    <button 
                      onClick={() => { setShowMobileMenu(false); setShowHistoryMode(true); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 active:bg-white/10 text-white/80"
                    >
                      <History className="w-4 h-4 opacity-50" /> Projects
                    </button>
                    <Link 
                      href="/settings" 
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-white/80"
                    >
                      <Settings className="w-4 h-4 opacity-50" /> Settings
                    </Link>
                  </div>
                  <div className="p-4 border-t border-white/5 safe-area-pb">
                    <button 
                      onClick={() => { setShowMobileMenu(false); signOut(); }}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 active:bg-white/10 text-white/80 min-h-[48px]"
                    >
                      <LogOut className="w-5 h-5 opacity-50" /> Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 safe-area-pb">
                  <button
                    onClick={() => { setShowMobileMenu(false); setShowAuthModal(true); }}
                    className="w-full py-4 rounded-xl bg-[#FF6E3C] text-white font-medium active:bg-[#FF8F5C] transition-colors min-h-[52px]"
                  >
                    Sign in
                  </button>
                </div>
              )}
              </div>
          </div>
      )}

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Panel - Hidden on mobile */}
        <div className="hidden md:flex w-[340px] border-r border-white/5 bg-black/40 backdrop-blur-sm flex-col">
          
          {/* Logo - same height as main top bar (h-12) */}
          <div className="flex-shrink-0 h-12 px-4 flex items-center border-b border-white/5">
            <a href="/" className="hover:opacity-80 transition-opacity">
              <Logo />
            </a>
          </div>
          
          {/* PROJECT Header - Clickable button to open projects dropdown */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
            <button 
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 hover:border-white/15 transition-all group"
              onClick={() => setSidebarView(sidebarView === "projects" ? "detail" : "projects")}
            >
              <div className="flex flex-col items-start min-w-0">
                <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Project</span>
                <span className="text-sm font-medium text-white truncate max-w-[230px]">
                  {generationTitle || "Untitled Project"}
                </span>
              </div>
              <ChevronDown className={cn(
                "w-4 h-4 text-white/50 transition-transform flex-shrink-0 group-hover:text-white/70",
                sidebarView === "projects" && "rotate-180"
              )} />
            </button>
          </div>
          
          {/* PROJECTS LIST VIEW */}
          {sidebarView === "projects" ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* + Create New Project - at the top, highlighted */}
              <div className="flex-shrink-0 px-3 pt-3 pb-2">
                <button
                  onClick={() => {
                    // Create new project
                    setGeneratedCode(null);
                    setDisplayedCode("");
                    setEditableCode("");
                    setPreviewUrl(null);
                    setGenerationComplete(false);
                    setSidebarMode("config");
                    setChatMessages([]);
                    setActiveGeneration(null);
                    setGenerationTitle("Untitled Project");
                    setFlowNodes([]);
                    setFlowEdges([]);
                    setStyleInfo(null);
                    setPublishedUrl(null);
                    setStyleDirective(getDefaultStyleName());
                    setStyleReferenceImage(null);
                    setFlows([]);
                    setSelectedFlowId(null);
                    setSidebarView("detail");
                    localStorage.removeItem("replay_sidebar_mode");
                    localStorage.removeItem("replay_generated_code");
                    localStorage.removeItem("replay_generation_title");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 text-sm font-medium text-[#FF6E3C] hover:bg-[#FF6E3C]/20 hover:border-[#FF6E3C]/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Project</span>
                </button>
              </div>
              
              {/* Divider */}
              <div className="border-b border-white/10 mx-3" />
              
              {/* Search */}
              <div className="px-3 py-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    placeholder="Search projects..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-white/70 placeholder:text-white/30 focus:outline-none focus:border-white/10"
                  />
                </div>
              </div>
              
              {/* Generation List - sorted newest first */}
              <div 
                className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2"
                style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
              >
                {isLoadingHistory ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-[#FF6E3C] animate-spin mx-auto" />
                    <p className="text-sm text-white/40 mt-4">Loading...</p>
                  </div>
                ) : generations.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="empty-logo-container mx-auto" style={{ width: 60, height: 75 }}>
                      <svg className="empty-logo" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="currentColor" strokeWidth="11.6182" strokeLinejoin="round"/>
                        <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" fill="currentColor"/>
                      </svg>
                    </div>
                    <p className="text-sm text-white/40 mt-4">No generations yet</p>
                    <p className="text-xs text-white/25 mt-1">Upload a video and generate code to start</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {generations
                      .slice()
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .filter(gen => !historySearch || gen.title.toLowerCase().includes(historySearch.toLowerCase()))
                      .map((gen) => (
                      <div 
                        key={gen.id}
                        className={cn(
                          "group relative p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/5",
                          activeGeneration?.id === gen.id && "bg-[#FF6E3C]/10 border border-[#FF6E3C]/20"
                        )}
                        onClick={async () => {
                          if (renamingId === gen.id) return; // Don't load while renaming
                          
                          try {
                            // If code is missing (minimal fetch), load full data first
                            let genToLoad = gen;
                            const isDemo = DEMO_PROJECT_IDS.has(gen.id);
                            if (!gen.code && (user || isDemo)) {
                              console.log("[History] Loading full data for generation:", gen.id, isDemo ? "(demo)" : "");
                              const fullGen = await loadFullGeneration(gen.id);
                              if (fullGen) {
                                genToLoad = fullGen;
                              } else {
                                console.error("[History] Failed to load generation data");
                                showToast("Failed to load project", "error");
                                return;
                              }
                            }
                            
                            // Set flag to prevent auto-save during load
                            isLoadingProjectRef.current = true;
                            
                            // Reset editing modes when switching projects
                            setIsDirectEditMode(false);
                            setIsPointAndEdit(false);
                            setPendingTextEdits([]);
                            setShowFloatingEdit(false);
                            
                            // DON'T create initial version here - UI already shows hardcoded "Initial generation" at bottom
                            // versions array should only contain EDITS made after initial generation
                            
                            // Load this generation
                            setActiveGeneration(genToLoad);
                            setGenerationTitle(genToLoad.title || "Untitled");
                            // Reset published URL state to match the loaded generation
                            setPublishedUrl(genToLoad.publishedSlug ? `https://www.replay.build/p/${genToLoad.publishedSlug}` : null);
                            setShowPublishModal(false);
                            if (genToLoad.code) {
                              setGeneratedCode(genToLoad.code);
                              setDisplayedCode(genToLoad.code);
                              setEditableCode(genToLoad.code);
                              const blob = new Blob([genToLoad.code], { type: "text/html" });
                              setPreviewUrl(URL.createObjectURL(blob));
                            }
                            if (genToLoad.flowNodes) setFlowNodes(genToLoad.flowNodes);
                            if (genToLoad.flowEdges) setFlowEdges(genToLoad.flowEdges);
                            if (genToLoad.styleInfo) setStyleInfo(genToLoad.styleInfo);
                            setStyleDirective(genToLoad.styleDirective || '');
                            setRefinements(genToLoad.refinements || '');
                            // Load chat messages for this project
                            setChatMessages(genToLoad.chatMessages || []);
                            lastSavedChatRef.current = JSON.stringify((genToLoad.chatMessages || []).map(m => m.id));
                            
                            // Auto-expand versions if there are any
                            if (genToLoad.versions && genToLoad.versions.length > 0) {
                              setExpandedVersions(genToLoad.id);
                            }
                            
                            // Restore video from generation if available
                            if (genToLoad.videoUrl && !flows.some(f => f.videoUrl === genToLoad.videoUrl)) {
                              const newFlowId = generateId();
                              const newFlow: FlowItem = {
                                id: newFlowId,
                                name: genToLoad.title || "Recording",
                                videoBlob: new Blob(), // Empty blob as placeholder
                                videoUrl: genToLoad.videoUrl,
                                thumbnail: genToLoad.thumbnailUrl || "",
                                duration: 30,
                                trimStart: 0,
                                trimEnd: 30,
                              };
                              setFlows([newFlow]);
                              setSelectedFlowId(newFlowId);
                              // Regenerate thumbnail if missing
                              if (!genToLoad.thumbnailUrl) {
                                regenerateThumbnail(newFlowId, genToLoad.videoUrl);
                              }
                            }
                            setSidebarView("detail"); // Switch to detail view
                            setGenerationComplete(true);
                            setSidebarMode("chat");
                            setMobilePanel("chat"); // Also switch mobile to chat
                            // Load chat messages for this project, or create initial if none exist
                            if (genToLoad.chatMessages && genToLoad.chatMessages.length > 0) {
                              setChatMessages(genToLoad.chatMessages);
                            } else if (genToLoad.code) {
                              setChatMessages([{
                                id: generateId(),
                                role: "assistant",
                                content: `**Boom. UI Reconstructed.** 🚀\n\nMatched the layout from your video using Tailwind CSS and Alpine.js for interactivity.\n\nReady to refine? Just tell me what to tweak.`,
                                timestamp: Date.now(),
                                quickActions: ["Make it mobile-friendly", "Tweak the colors", "Add hover effects", "Improve the spacing"]
                              }]);
                            }
                          } catch (e) {
                            console.error("[History] Error loading generation:", e);
                            showToast("Error loading generation", "error");
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {renamingId === gen.id ? (
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onBlur={() => renameGeneration(gen.id, renameValue || gen.title)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") renameGeneration(gen.id, renameValue || gen.title);
                                    if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                  className="flex-1 min-w-0 text-sm font-medium text-white/80 bg-white/5 border border-white/10 rounded px-2 py-0.5 focus:outline-none focus:border-[#FF6E3C]/50"
                                />
                              ) : (
                                <p className="text-sm font-medium text-white/80 truncate">{gen.title}</p>
                              )}
                            </div>
                            <p className="text-[10px] text-white/30 mt-1">
                              {new Date(gen.timestamp).toLocaleDateString()} • {new Date(gen.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          
                          {/* Actions menu */}
                          <div className="relative">
                            <button 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setHistoryMenuOpen(historyMenuOpen === gen.id ? null : gen.id);
                              }}
                              className={cn(
                                "p-1.5 rounded hover:bg-white/10 transition-opacity",
                                historyMenuOpen === gen.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                              )}
                            >
                              <MoreVertical className="w-4 h-4 text-white/40" />
                            </button>
                            
                            {/* Dropdown menu */}
                            <AnimatePresence>
                              {historyMenuOpen === gen.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                  className="absolute right-0 top-8 z-50 w-32 bg-[#151515] border border-white/10 rounded-lg shadow-xl overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => { 
                                      setHistoryMenuOpen(null);
                                      // Start renaming this project
                                      setRenamingId(gen.id);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 flex items-center gap-2"
                                  >
                                    <Pencil className="w-3 h-3" /> Edit Name
                                  </button>
                                  <button
                                    onClick={() => { 
                                      setHistoryMenuOpen(null);
                                      // Load this generation and open settings
                                      setActiveGeneration(gen);
                                      setGenerationTitle(gen.title || "Untitled Project");
                                      setShowProjectSettings(true);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 flex items-center gap-2"
                                  >
                                    <Settings className="w-3 h-3" /> Settings
                                  </button>
                                  <button
                                    onClick={() => {
                                      setHistoryMenuOpen(null);
                                      duplicateGeneration(gen);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 flex items-center gap-2"
                                  >
                                    <Copy className="w-3 h-3" /> Duplicate
                                  </button>
                                  <button
                                    onClick={() => {
                                      setHistoryMenuOpen(null);
                                      // Export - download the project
                                      if (!isPaidPlan) {
                                        setUpgradeFeature("download");
                                        setShowUpgradeModal(true);
                                      } else if (gen.code) {
                                        const blob = new Blob([gen.code], { type: "text/html" });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement("a");
                                        a.href = url;
                                        a.download = `${gen.title || "project"}.html`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                        showToast("Project exported!", "success");
                                      }
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 flex items-center gap-2"
                                  >
                                    <Download className="w-3 h-3" /> Export
                                  </button>
                                  <div className="border-t border-white/5 my-1" />
                                  <button
                                    onClick={() => {
                                      setHistoryMenuOpen(null);
                                      confirmDeleteGeneration(gen.id, gen.title);
                                    }}
                                    className="w-full px-3 py-2 text-left text-xs text-red-400/80 hover:bg-red-500/10 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3 h-3" /> Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        
                        {/* Latest change or style info */}
                        <div className="mt-1.5 space-y-0.5">
                          {(() => {
                            const filteredVersions = (gen.versions || []).filter(v => v.label !== "Initial generation");
                            return filteredVersions.length > 0 ? (
                              <p className="text-[10px] text-white/40 truncate">
                                <span className="text-emerald-400/60">Latest:</span> {filteredVersions[filteredVersions.length - 1]?.label || "Code update"}
                              </p>
                            ) : (
                              <p className="text-[10px] text-white/25 truncate">
                                <span className="text-white/15">Style:</span> {gen.styleDirective?.split('.')[0]?.split('⚠️')[0]?.trim() || "Auto-Detect"}
                              </p>
                            );
                          })()}
                          {gen.refinements && (
                            <p className="text-[10px] text-white/20 truncate italic">
                              <span className="text-white/15">Context:</span> {gen.refinements}
                            </p>
                          )}
                        </div>
                        
                        {/* Version History Toggle - always show */}
                        <div className="mt-2 pt-2 border-t border-white/5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedVersions(expandedVersions === gen.id ? null : gen.id);
                            }}
                            className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white/60 transition-colors"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{((gen.versions || []).filter(v => v.label !== "Initial generation").length) + 1} version{((gen.versions || []).filter(v => v.label !== "Initial generation").length) >= 1 ? 's' : ''}</span>
                            <ChevronDown className={cn(
                              "w-3 h-3 transition-transform",
                              expandedVersions === gen.id && "rotate-180"
                            )} />
                          </button>
                            
                            {/* Expanded Versions List */}
                          <AnimatePresence>
                            {expandedVersions === gen.id && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 ml-1 space-y-1 overflow-hidden"
                              >
                                {/* Version timeline - newest at top, oldest at bottom */}
                                <div className="relative pl-3 border-l border-white/10">
                                  {/* Versions in reverse order (newest/current at top) - filter out "Initial generation" as it's shown separately below */}
                                  {(gen.versions || []).filter(v => v.label !== "Initial generation").slice().reverse().map((version, idx) => (
                                    <div 
                                      key={version.id}
                                      className="relative py-1.5 group/version"
                                    >
                                      <div className={cn(
                                        "absolute -left-[7px] top-2.5 w-2.5 h-2.5 rounded-full border-2",
                                        idx === 0 
                                          ? "bg-[#FF6E3C] border-[#FF6E3C]" 
                                          : "bg-[#0a0a0a] border-white/20 group-hover/version:border-white/40"
                                      )} />
                                      
                                      <div className="flex items-center justify-between gap-2 pl-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] text-white/50 truncate">{version.label}</p>
                                          <p className="text-[8px] text-white/25">
                                            {new Date(version.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                        
                                        {idx === 0 ? (
                                          <span className="text-[8px] text-[#FF6E3C]/60 uppercase">Current</span>
                                        ) : (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              restoreVersion(gen.id, version);
                                            }}
                                            className="opacity-0 group-hover/version:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
                                            title="Restore this version"
                                          >
                                            <Play className="w-3 h-3 text-[#FF6E3C]" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  
                                  {/* Initial generation - at the bottom */}
                                  <div className="relative py-1.5 group/version">
                                    <div className={cn(
                                      "absolute -left-[7px] top-2.5 w-2.5 h-2.5 rounded-full border-2",
                                      !gen.versions?.length ? "bg-[#FF6E3C] border-[#FF6E3C]" : "bg-[#0a0a0a] border-white/20 group-hover/version:border-white/40"
                                    )} />
                                    <div className="flex items-center justify-between gap-2 pl-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-white/50 truncate">Initial generation</p>
                                        <p className="text-[8px] text-white/25">
                                          {new Date(gen.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                      {!gen.versions?.length ? (
                                        <span className="text-[8px] text-[#FF6E3C]/60 uppercase">Current</span>
                                      ) : (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Restore to initial generation - remove all versions from current code
                                            restoreVersion(gen.id, { 
                                              id: 'initial', 
                                              timestamp: gen.timestamp, 
                                              label: 'Initial generation',
                                              code: gen.code || '',
                                              flowNodes: gen.flowNodes,
                                              flowEdges: gen.flowEdges,
                                              styleInfo: gen.styleInfo
                                            });
                                          }}
                                          className="opacity-0 group-hover/version:opacity-100 p-1 rounded hover:bg-white/10 transition-all"
                                          title="Restore to initial"
                                        >
                                          <Play className="w-3 h-3 text-[#FF6E3C]" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : sidebarView === "detail" && sidebarMode === "chat" && generationComplete ? (
            /* AGENTIC CHAT MODE - After Generation - With Tabs */
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Tabs: Replay AI | Settings */}
              <div className="flex-shrink-0 px-3 py-2 border-b border-white/5">
                <div className="flex gap-1 p-0.5 bg-white/[0.02] rounded-lg">
                  <button
                    onClick={() => setSidebarTab("chat")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                      sidebarTab === "chat" 
                        ? "bg-white/10 text-white" 
                        : "text-white/40 hover:text-white/60"
                    )}
                  >
                    <Send className="w-3 h-3" />
                    Replay AI
                  </button>
                  <button
                    onClick={() => setSidebarTab("style")}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                      sidebarTab === "style" 
                        ? "bg-white/10 text-white" 
                        : "text-white/40 hover:text-white/60"
                    )}
                  >
                    <Boxes className="w-3 h-3" />
                    Configuration
                  </button>
                </div>
              </div>
              
              {sidebarTab === "chat" ? (
                /* TAB: Replay AI - Chat Interface */
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Chat Messages - Premium Look */}
                  <div 
                    className="flex-1 overflow-y-auto px-3 py-3 space-y-3 custom-scrollbar"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}
                  >
                    {chatMessages.map((msg) => (
                      <motion.div 
                        key={msg.id} 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        {msg.role === "assistant" ? (
                          /* AI Message - Clean, no avatar */
                          <div className="space-y-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <LogoIcon className="w-3.5 h-3.5" color="#FF6E3C" />
                              <span className="text-[10px] font-medium text-white/40">Replay</span>
                            </div>
                            <div className="text-[11px] leading-relaxed text-white/70 space-y-1.5">
                              {msg.content.split('\n').map((line, i) => {
                                if (line.includes('Complete')) {
                                  return (
                                    <p key={i} className="flex items-center gap-1.5 text-emerald-400/90 font-medium text-xs">
                                      <Check className="w-3 h-3" />
                                      {line.replace(/\*\*/g, '').replace('✅ ', '')}
                                    </p>
                                  );
                                }
                                if (line.startsWith('**') && line.endsWith('**')) {
                                  return <p key={i} className="font-medium text-white/90 text-xs">{line.replace(/\*\*/g, '')}</p>;
                                }
                                if (line.startsWith('• ') || line.startsWith('- ')) {
                                  return (
                                    <p key={i} className="flex items-start gap-1.5 text-white/60">
                                      <span className="text-[#FF6E3C]/70 mt-px">•</span>
                                      <span>{line.replace(/^[•-]\s/, '')}</span>
                                    </p>
                                  );
                                }
                                if (!line.trim()) return <div key={i} className="h-1" />;
                                return (
                                  <p key={i} className="text-white/60">
                                    {line.split(/(\*\*[^*]+\*\*)/).map((part, j) => 
                                      part.startsWith('**') && part.endsWith('**') 
                                        ? <span key={j} className="text-white/90 font-medium">{part.replace(/\*\*/g, '')}</span>
                                        : part
                                    )}
                                  </p>
                                );
                              })}
                            </div>
                            
                            {/* Quick Actions as chips */}
                            {msg.quickActions && msg.quickActions.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {msg.quickActions.map((action, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setChatInput(action)}
                                    className="px-2 py-1 rounded text-[10px] bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white/80 border border-white/[0.05] transition-all"
                                  >
                                    {action}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          /* User Message - Right aligned, compact */
                          <div className="flex justify-end">
                            <div className="max-w-[85%]">
                              <div className="px-3 py-2 rounded-xl bg-white/[0.06] text-[11px] text-white/80">
                                {msg.content}
                              </div>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex justify-end gap-1 mt-1">
                                  {msg.attachments.map((att, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300/80 text-[9px]">
                                      {att.type === "element" && <MousePointer className="w-2.5 h-2.5" />}
                                      {att.type === "image" && <ImageIcon className="w-2.5 h-2.5" />}
                                      {att.label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {/* Thinking Indicator with LIVE CODE streaming */}
                    {isEditing && (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="rounded-xl overflow-hidden border border-[#FF6E3C]/20"
                        style={{ background: '#0a0a0a' }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]" style={{ background: '#0d0d0d' }}>
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 text-[#FF6E3C] animate-spin" />
                            <span className="text-[10px] font-medium text-[#FF6E3C]">{streamingStatus || "Generating..."}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {streamingLines > 0 && (
                              <span className="text-[10px] text-white/50 font-mono bg-white/5 px-2 py-0.5 rounded">{streamingLines} lines</span>
                            )}
                            <button
                              onClick={() => {
                                cancelAIRequest();
                                setIsEditing(false);
                                showToast("Request cancelled", "info");
                              }}
                              className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        {/* LIVE Code streaming - syntax highlighted */}
                        <div className="p-3 h-[200px] overflow-hidden relative font-mono text-[10px] leading-relaxed">
                          <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10" />
                          <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10" />
                          <pre className="m-0 pt-4 pb-4 whitespace-pre-wrap break-words overflow-y-auto h-full custom-scrollbar">
                            {streamingCode ? (
                              streamingCode.split('\n').slice(-15).map((line, i) => (
                                <div key={i} className="min-h-[14px]">
                                  {/* Syntax highlighting */}
                                  {line.split(/(<[^>]+>|"[^"]*"|'[^']*'|\/\*.*\*\/|\/\/.*$|{|}|\(|\)|class=|className=|style=|\b(?:const|let|var|function|return|if|else|for|while|import|export|from|default)\b)/g).map((part, j) => {
                                    if (!part) return null;
                                    if (part.startsWith('<') && part.endsWith('>')) return <span key={j} className="text-[#7fdbca]">{part}</span>;
                                    if (part.startsWith('"') || part.startsWith("'")) return <span key={j} className="text-[#ecc48d]">{part}</span>;
                                    if (part.startsWith('//') || part.startsWith('/*')) return <span key={j} className="text-[#637777]">{part}</span>;
                                    if (/^(const|let|var|function|return|if|else|for|while|import|export|from|default)$/.test(part)) return <span key={j} className="text-[#c792ea]">{part}</span>;
                                    if (part === 'class=' || part === 'className=' || part === 'style=') return <span key={j} className="text-[#addb67]">{part}</span>;
                                    if (part === '{' || part === '}' || part === '(' || part === ')') return <span key={j} className="text-[#ffd700]">{part}</span>;
                                    return <span key={j} className="text-[#d6deeb]">{part}</span>;
                                  })}
                                </div>
                              ))
                            ) : (
                              <div className="flex items-center gap-2 text-white/30">
                                <div className="w-2 h-2 bg-[#FF6E3C] rounded-full animate-pulse" />
                                Preparing code...
                              </div>
                            )}
                            <span className="inline-block w-2 h-4 bg-[#FF6E3C] ml-0.5 animate-pulse" />
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Input Area - Minimal */}
                  <div className="flex-shrink-0 p-2 border-t border-white/5">
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] relative">
                      {/* Auth overlay for non-logged users only */}
                      {!user && (
                        <div 
                          onClick={() => {
                            setShowAuthModal(true);
                            showToast("Sign up free to edit with AI. Get 1 free generation!", "info");
                          }}
                          className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl"
                        >
                          <div className="flex items-center gap-2 text-white/50 text-xs">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Sign up to edit with AI</span>
                          </div>
                        </div>
                      )}
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={!user}
                        onPaste={handlePasteImage}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && !e.shiftKey && chatInput.trim() && editableCode) {
                            e.preventDefault();
                            // Auth check - only block non-logged users
                            if (!user) {
                              setShowAuthModal(true);
                              showToast("Sign up free to edit with AI. Get 1 free generation!", "info");
                              return;
                            }
                            const userMsg: ChatMessage = { id: generateId(), role: "user", content: chatInput, timestamp: Date.now(), attachments: selectedElement ? [{ type: "element", label: selectedElement }] : editImages.length > 0 ? editImages.map(img => ({ type: "image" as const, label: img.name })) : undefined };
                            setChatMessages(prev => [...prev, userMsg]);
                            const currentInput = chatInput;
                            const currentSelectedElement = selectedElement;
                            const currentPlanMode = isPlanMode;
                            const currentChatHistory = chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
                            setChatInput(""); setSelectedElement(null); setIsEditing(true); setStreamingStatus(null);
                            try {
                              if (currentPlanMode) {
                                // PLAN MODE: Conversational response without code editing with streaming
                                const result = await editCodeWithAIStreaming(
                                  editableCode, currentInput, undefined, undefined, true, undefined,
                                  (event) => {
                                    if (event.type === 'status') setStreamingStatus(event.message || null);
                                    else if (event.type === 'chunk' && event.fullText) {
                                      // Update streaming text in real-time (optional for plan mode)
                                    }
                                  }
                                );
                                const response = result?.code || "I can help you plan that! What would you like to discuss?";
                                setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: response, timestamp: Date.now() }]);
                              } else {
                                // EXECUTE MODE: Make actual changes with streaming status
                                // Convert images to base64 for API
                                let imageData: { base64?: string; url?: string; mimeType: string; name: string }[] | undefined;
                                if (editImages.length > 0) {
                                  setStreamingStatus("Processing images...");
                                  imageData = [];
                                  for (const img of editImages) {
                                    const base64 = await urlToBase64(img.url);
                                    if (base64) {
                                      imageData.push({ base64, mimeType: 'image/png', name: img.name, url: img.url });
                                    }
                                  }
                                  if (imageData.length === 0) imageData = undefined;
                                }
                                const prompt = currentSelectedElement 
                                  ? `IMPORTANT: Only modify the specific element that matches this selector/description: "${currentSelectedElement}". Do NOT change any other elements. User request: ${currentInput}`
                                  : currentInput;
                                
                                // Use streaming API with status updates and code preview
                                let currentStreamCode = '';
                                const result = await editCodeWithAIStreaming(
                                  editableCode, prompt, imageData, undefined, false, currentChatHistory,
                                  (event) => {
                                    if (event.type === 'status') {
                                      setStreamingStatus(event.message || null);
                                      if (event.phase === 'writing') {
                                        currentStreamCode = '';
                                        setStreamingCode('');
                                      }
                                    } else if (event.type === 'progress') {
                                      setStreamingStatus(`Writing code...`);
                                      setStreamingLines(event.lines || 0);
                                      if (event.preview) {
                                        setStreamingCode(event.preview);
                                      }
                                    } else if (event.type === 'chunk' && event.text) {
                                      // Real-time code streaming
                                      currentStreamCode += event.text;
                                      setStreamingCode(currentStreamCode.slice(-1500)); // Show last 1500 chars for better visibility
                                      setStreamingLines(currentStreamCode.split('\n').length);
                                    }
                                  }
                                );
                                
                                if (result && result.success && result.code) {
                                  // Check if AI returned a clarifying question or chat response instead of code
                                  const isChatResponse = (result as any).needsClarification || (result as any).isChat;
                                  // Also check if the "code" doesn't look like HTML at all
                                  const looksLikeHTML = result.code.includes('<!DOCTYPE') || result.code.includes('<html') || result.code.includes('<div') || result.code.includes('<body');
                                  
                                  if (isChatResponse || !looksLikeHTML) {
                                    // Show as chat message only - DON'T update the code
                                    setChatMessages(prev => [...prev, { 
                                      id: generateId(), 
                                      role: "assistant", 
                                      content: result.code || "What would you like me to change?", 
                                      timestamp: Date.now() 
                                    }]);
                                  } else {
                                    const codeChanged = result.code !== editableCode;
                                    
                                    if (codeChanged) {
                                      setEditableCode(result.code); setDisplayedCode(result.code); setGeneratedCode(result.code);
                                      setPreviewUrl(URL.createObjectURL(new Blob([result.code], { type: "text/html" })));
                                      
                                      // Use summary from streaming if available, otherwise analyze
                                      const responseMsg = result.summary 
                                        ? `✅ Done! ${result.summary}`
                                        : analyzeCodeChanges(editableCode, result.code, currentInput);
                                      
                                      setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: responseMsg, timestamp: Date.now() }]);
                                      if (activeGeneration) {
                                        const versionLabel = generateVersionLabel(currentInput);
                                        const updatedGen = { ...activeGeneration, code: result.code, versions: [...(activeGeneration.versions || []), { id: generateId(), timestamp: Date.now(), label: versionLabel, code: result.code, flowNodes, flowEdges, styleInfo }] };
                                        setActiveGeneration(updatedGen); 
                                        setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
                                        saveGenerationToSupabase(updatedGen);
                                      }
                                    } else {
                                      setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: `No changes detected. The AI returned the same code. Try being more specific about what you want to change.`, timestamp: Date.now() }]);
                                    }
                                  }
                                } else if (!result?.cancelled) { setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: `Error: ${result?.error || "Something went wrong. Please try again with a different request."}`, timestamp: Date.now() }]); }
                              }
                            } catch (error) { 
                              if (!(error instanceof Error && error.name === 'AbortError')) {
                                setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`, timestamp: Date.now() }]); 
                              }
                            }
                            finally { setIsEditing(false); setStreamingStatus(null); setStreamingCode(null); setStreamingLines(0); setEditImages([]); setIsPointAndEdit(false); }
                          }
                        }}
                        placeholder={isPlanMode ? "Plan and discuss changes..." : "Ask Replay to edit..."}
                        rows={1}
                        className="w-full px-3 py-2.5 bg-transparent text-[11px] text-white/80 placeholder:text-white/25 resize-none focus:outline-none min-h-[36px]"
                      />
                      
                      {/* Attachments preview */}
                      {(editImages.length > 0 || selectedElement) && (
                        <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
                          {editImages.map((img) => (
                            <div key={img.id} className="relative group">
                              <img src={img.url} alt="" className={cn("w-8 h-8 rounded object-cover border border-white/10", img.uploading && "opacity-50")} />
                              {img.uploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                                </div>
                              )}
                              <button onClick={() => setEditImages(prev => prev.filter(i => i.id !== img.id))} className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="w-2 h-2" /></button>
                            </div>
                          ))}
                          {selectedElement && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#FF6E3C]/10 text-[#FF6E3C]/80 text-[9px] border border-[#FF6E3C]/20">
                              <MousePointer className="w-2.5 h-2.5" />{selectedElement}
                              <button onClick={() => { setSelectedElement(null); setIsPointAndEdit(false); }}><X className="w-2 h-2" /></button>
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Tools */}
                      <div className="px-2 py-1.5 border-t border-white/[0.03] flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {/* Pointer Select - same as Edit with AI */}
                          <button 
                            onClick={() => {
                              const newState = !isPointAndEdit;
                              setIsPointAndEdit(newState);
                              setIsSelectingElement(newState);
                              if (!newState) setSelectedElement(null);
                            }} 
                            className={cn(
                              "relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-all",
                              isPointAndEdit 
                                ? "bg-[#FF6E3C]/20 text-[#FF6E3C] border border-[#FF6E3C]/30" 
                                : "text-white/40 hover:text-white/60 hover:bg-white/5"
                            )}
                          >
                            <MousePointer className={cn("w-3.5 h-3.5", isPointAndEdit && "animate-pulse")} />
                            <span>Select</span>
                            {isPointAndEdit && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#FF6E3C] rounded-full" />}
                          </button>
                          {/* Image upload - same icon as Edit with AI */}
                          <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] text-white/40 hover:text-white/60 hover:bg-white/5 cursor-pointer transition-all">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Image</span>
                            <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(file => { const reader = new FileReader(); reader.onload = () => setEditImages(prev => [...prev, { id: generateId(), url: reader.result as string, name: file.name, file }]); reader.readAsDataURL(file); }); }} />
                          </label>
                        </div>
                        {/* Plan + Send grouped on right */}
                        <div className="flex items-center gap-1.5">
                          {/* Plan Mode Toggle */}
                          <button
                            onClick={() => setIsPlanMode(!isPlanMode)}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                              isPlanMode 
                                ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" 
                                : "text-white/40 hover:text-white/60 hover:bg-white/5"
                            )}
                            title={isPlanMode ? "Plan mode ON - discussing without executing" : "Plan mode OFF - will execute changes"}
                          >
                            <MessageSquare className="w-3 h-3" />
                            Plan
                          </button>
                        <button 
                          onClick={async () => {
                            if (!chatInput.trim() || !editableCode || isEditing) return;
                            const userMsg: ChatMessage = { id: generateId(), role: "user", content: chatInput, timestamp: Date.now(), attachments: selectedElement ? [{ type: "element", label: selectedElement }] : editImages.length > 0 ? editImages.map(img => ({ type: "image" as const, label: img.name })) : undefined };
                            setChatMessages(prev => [...prev, userMsg]);
                            const currentInput = chatInput;
                            const currentSelectedElement = selectedElement;
                            const currentPlanMode = isPlanMode;
                            const currentChatHistory = chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
                            setChatInput(""); setSelectedElement(null); setIsEditing(true);
                            try {
                              if (currentPlanMode) {
                                // PLAN MODE: Conversational response without code editing
                                const result = await editCodeWithAI(editableCode, currentInput, undefined, undefined, true, undefined);
                                const response = result?.code || "I can help you plan that! What would you like to discuss?";
                                setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: response, timestamp: Date.now() }]);
                              } else {
                                // EXECUTE MODE: Make actual changes with chat history context
                                // Convert images to base64 for API (button click handler)
                                let imageData: { base64?: string; url?: string; mimeType: string; name: string }[] | undefined;
                                if (editImages.length > 0) {
                                  imageData = [];
                                  for (const img of editImages) {
                                    const base64 = await urlToBase64(img.url);
                                    if (base64) {
                                      imageData.push({ base64, mimeType: 'image/png', name: img.name, url: img.url });
                                    }
                                  }
                                  if (imageData.length === 0) imageData = undefined;
                                }
                                const prompt = currentSelectedElement 
                                  ? `IMPORTANT: Only modify the specific element that matches this selector/description: "${currentSelectedElement}". Do NOT change any other elements. User request: ${currentInput}`
                                  : currentInput;
                                const result = await editCodeWithAI(editableCode, prompt, imageData, undefined, false, currentChatHistory);
                                if (result && result.success && result.code) {
                                  const codeChanged = result.code !== editableCode;
                                  
                                  if (codeChanged) {
                                    setEditableCode(result.code); setDisplayedCode(result.code); setGeneratedCode(result.code);
                                    setPreviewUrl(URL.createObjectURL(new Blob([result.code], { type: "text/html" })));
                                    
                                    const responseMsg = analyzeCodeChanges(editableCode, result.code, currentInput);
                                    
                                    setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: responseMsg, timestamp: Date.now() }]);
                                    if (activeGeneration) {
                                      const updatedGen = { ...activeGeneration, code: result.code, versions: [...(activeGeneration.versions || []), { id: generateId(), timestamp: Date.now(), label: generateVersionLabel(currentInput), code: result.code, flowNodes, flowEdges, styleInfo }] };
                                      setActiveGeneration(updatedGen); 
                                      setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
                                      saveGenerationToSupabase(updatedGen);
                                    }
                                  } else {
                                    setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: `No changes detected. The AI returned the same code. Try being more specific about what you want to change.`, timestamp: Date.now() }]);
                                  }
                                } else if (!result?.cancelled) { setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: `Error: ${result?.error || "Something went wrong. Please try again with a different request."}`, timestamp: Date.now() }]); }
                              }
                            } catch (error) { 
                              if (!(error instanceof Error && error.name === 'AbortError')) {
                                setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`, timestamp: Date.now() }]); 
                              }
                            }
                            finally { setIsEditing(false); setEditImages([]); setIsPointAndEdit(false); }
                          }}
                          disabled={!chatInput.trim() || isEditing}
                          className={cn("p-1.5 rounded-lg transition-all", chatInput.trim() && !isEditing ? "bg-white text-black" : "bg-white/5 text-white/30")}
                        >
                          {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* TAB: Configuration - Simplified with Quick Start */
                <div className="flex-1 overflow-y-auto custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
                  
                  {/* Upload Section - Primary */}
                  <div className="p-3 border-b border-white/5">
                    {flows.length === 0 ? (
                      <>
                        {/* Upload Area with Drag & Drop */}
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={cn(
                            "relative rounded-xl border-2 border-dashed bg-white/[0.02] transition-all cursor-pointer group mb-3",
                            isDragging 
                              ? "border-[#FF6E3C] bg-[#FF6E3C]/10" 
                              : "border-white/[0.08] hover:border-[#FF6E3C]/30 hover:bg-white/[0.03]"
                          )}
                        >
                          <div className="p-4 text-center">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-colors",
                              isDragging ? "bg-[#FF6E3C]/20" : "bg-white/5 group-hover:bg-[#FF6E3C]/10"
                            )}>
                              <Upload className={cn(
                                "w-5 h-5 transition-colors",
                                isDragging ? "text-[#FF6E3C]" : "text-white/30 group-hover:text-[#FF6E3C]/60"
                              )} />
                            </div>
                            <p className="text-xs text-white/50 font-medium">{isDragging ? "Drop video here" : "Upload your video"}</p>
                            <p className="text-[10px] text-white/25 mt-0.5">or drag & drop</p>
                          </div>
                        </div>
                        
                        {/* Record Button */}
                        <button 
                          onClick={startRecording}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-red-500/30 hover:border-red-500/50 hover:bg-white/[0.06] text-xs text-white/60 hover:text-white/80 transition-all"
                        >
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Record screen
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Video List */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                            <Video className="w-3 h-3" /> Videos
                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded">{flows.length}</span>
                          </span>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[9px] text-white/30 hover:text-white/50 flex items-center gap-1"
                          >
                            <Plus className="w-2.5 h-2.5" /> Add
                          </button>
                        </div>
                        <div className="space-y-1">
                          {flows.map((flow) => (
                            <button key={flow.id} onClick={() => setSelectedFlowId(flow.id)} className={cn("w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer text-left", selectedFlowId === flow.id ? "bg-[#FF6E3C]/10 border border-[#FF6E3C]/20" : "bg-white/[0.02] hover:bg-white/[0.04]")} aria-label={`Select flow ${flow.name || flow.id}`}>
                              <div className="w-10 h-6 rounded overflow-hidden bg-white/5 flex-shrink-0">
                                {flow.thumbnail ? <img src={flow.thumbnail} alt="" className="w-full h-full object-cover" /> : <Film className="w-3 h-3 text-white/20 mx-auto mt-1.5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] text-white/70 truncate">{flow.name}</p>
                                <p className="text-[9px] text-white/30">{formatDuration(flow.duration)}</p>
                              </div>
                              <span onClick={(e) => { e.stopPropagation(); setFlows(prev => prev.filter(f => f.id !== flow.id)); }} className="p-1 text-white/20 hover:text-red-400" role="button" tabIndex={0} aria-label="Remove flow" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setFlows(prev => prev.filter(f => f.id !== flow.id)); }}}>
                                <Trash2 className="w-3 h-3" />
                              </span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Context Section */}
                  <div className="p-3 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                        <MousePointer2 className="w-3 h-3" /> Context
                      </span>
                      <span className="text-[9px] text-white/30">Optional</span>
                    </div>
                    <textarea
                      value={refinements}
                      onChange={(e) => setRefinements(e.target.value)}
                      placeholder="Add data logic, constraints or details..."
                      rows={2}
                      className="w-full px-2.5 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[11px] text-white/70 placeholder:text-white/25 resize-y focus:outline-none focus:border-white/10 min-h-[60px] max-h-[200px]"
                    />
                  </div>
                  
                  {/* Style Section */}
                  <div className="p-3 border-b border-white/5">
                    <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                      <Palette className="w-3 h-3" /> Visual Style
                    </span>
                    <StyleInjector 
                      value={styleDirective} 
                      onChange={setStyleDirective} 
                      disabled={isProcessing}
                      referenceImage={styleReferenceImage}
                      onReferenceImageChange={setStyleReferenceImage}
                    />
                  </div>
                  
                  {/* Generate Button */}
                  <div className="p-3">
                    <button 
                      onClick={handleGenerate}
                      disabled={isProcessing || flows.length === 0}
                      className="w-full py-2.5 rounded-lg bg-[#FF6E3C]/10 hover:bg-[#FF6E3C]/20 border border-[#FF6E3C]/20 text-[11px] font-medium text-[#FF6E3C] flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <LogoIcon className="w-3.5 h-3.5" color="#FF6E3C" />
                      Reconstruct
                    </button>
                  </div>
                  
                  {/* Database Section */}
                  <div className="p-3 border-b border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                        <Database className="w-3 h-3" /> Database
                      </span>
                      <span className="text-[9px] text-white/30" title="Connect Supabase to wire real data to your UI">Optional</span>
                    </div>
                    <button 
                      onClick={() => {
                        // Require login for Supabase connection
                        if (!user || isDemoMode) {
                          setShowAuthModal(true);
                          showToast("Sign up free to connect Supabase. Get 1 free generation!", "info");
                          return;
                        }
                        // Require paid plan for Supabase
                        if (!isPaidPlan) {
                          showToast("Supabase integration is a Pro feature. Upgrade to connect your database!", "info");
                          return;
                        }
                        setShowProjectSettings(true);
                      }}
                      className={cn(
                        "w-full py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[10px] flex items-center justify-center gap-1.5 transition-colors group",
                        (!user || isDemoMode || !isPaidPlan) 
                          ? "text-white/30 hover:text-white/40 cursor-not-allowed" 
                          : "text-white/50 hover:text-white/70 hover:bg-white/[0.05]"
                      )}
                      title={!user || isDemoMode ? "Sign up to use Supabase integration" : !isPaidPlan ? "Pro feature - Upgrade to connect" : "Connect Supabase to fetch real data"}
                    >
                      <Database className="w-3 h-3 group-hover:text-[#3ECF8E]" />
                      Wire to Supabase
                      {(!user || isDemoMode || !isPaidPlan) && <Lock className="w-2.5 h-2.5 text-white/20" />}
                    </button>
                    <p className="text-[9px] text-white/25 mt-1.5 text-center">
                      {!user || isDemoMode ? "Sign up to connect database" : !isPaidPlan ? "Pro feature" : "Connect your database to wire real data"}
                    </p>
                  </div>
                  
                  {/* Colors Preview */}
                  {styleInfo && styleInfo.colors.length > 0 && (
                    <div className="p-3">
                      <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider block mb-2">Current Colors</span>
                      <div className="flex gap-1 flex-wrap">
                        {styleInfo.colors.slice(0, 6).map((c, i) => (
                          <div key={i} className="w-6 h-6 rounded border border-white/10" style={{ background: c.value }} title={c.value} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : sidebarView === "detail" ? (
            /* CONFIG MODE - Before Generation */
            <div 
              className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar"
              style={{ 
                scrollbarWidth: 'thin', 
                scrollbarColor: 'rgba(255,255,255,0.08) transparent' 
              }}
            >
              {/* Videos Section */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-white/40" />
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Videos</span>
                    {flows.length > 0 && <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-white/40">{flows.length}</span>}
                  </div>
                  <div className="flex gap-1.5">
                    {isRecording ? (
                      <button onClick={stopRecording} className="btn-black flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs">
                        <Square className="w-3 h-3 fill-red-500 text-red-500" />{formatDuration(recordingDuration)}
                      </button>
                    ) : (
                      <button onClick={startRecording} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-red-500/30 hover:border-red-500/50 text-white/60 hover:text-white/80 transition-all"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Record</button>
                    )}
                    <button onClick={() => fileInputRef.current?.click()} className="btn-black flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"><Upload className="w-3.5 h-3.5" /> Upload</button>
                  </div>
                </div>
                <div 
                  className="space-y-2"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {flows.length === 0 ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className={cn(
                        "relative rounded-xl border-2 border-dashed transition-all cursor-pointer",
                        isDragging 
                          ? "border-[#FF6E3C] bg-[#FF6E3C]/10" 
                          : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.03]"
                      )}
                    >
                      <div className="p-5 text-center">
                        <Video className={cn("w-5 h-5 mx-auto mb-2", isDragging ? "text-[#FF6E3C]" : "text-white/30")} />
                        <p className={cn("text-[10px]", isDragging ? "text-[#FF6E3C]" : "text-white/40")}>
                          {isDragging ? "Drop video here!" : "Drop your video here"}
                        </p>
                        <p className="text-[9px] text-white/25 mt-1">
                          Screen recording, product demo, or UI walkthrough
                        </p>
                      </div>
                    </div>
                  ) : flows.map((flow) => (
                    <button key={flow.id} onClick={() => setSelectedFlowId(flow.id)} className={cn("flow-item w-full flex items-center gap-2.5 p-2 cursor-pointer group text-left", selectedFlowId === flow.id && "selected")} aria-label={`Select flow ${flow.name}`}>
                      <div className="w-14 h-8 rounded overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                        {flow.thumbnail ? <img src={flow.thumbnail} alt="" className="w-full h-full object-cover" /> : <Film className="w-3 h-3 text-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{flow.name}</p>
                        <p className="text-xs text-white/40">
                          {formatDuration(flow.trimEnd - flow.trimStart)} / {formatDuration(flow.duration)}
                        </p>
                      </div>
                      <span onClick={(e) => { e.stopPropagation(); removeFlow(flow.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded" role="button" tabIndex={0} aria-label="Remove flow" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); removeFlow(flow.id); }}}><Trash2 className="w-3 h-3 text-white/40" /></span>
                    </button>
                  ))}
                  
                  {/* Add video button */}
                  {flows.length > 0 && (
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/5 border border-dashed border-white/10 hover:border-white/20 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add video</span>
                    </button>
                  )}
                </div>
              </div>
              {/* CONTEXT Section - Above Style */}
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-white/40" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Context</span>
                </div>
                
                {/* Textarea only */}
                <textarea
                  value={refinements}
                  onChange={(e) => {
                    const maxLen = isPaidPlan ? 20000 : 2000;
                    if (e.target.value.length <= maxLen) {
                      setRefinements(e.target.value);
                    } else {
                      showToast(`Context limit: ${isPaidPlan ? "20,000" : "2,000"} characters${!isPaidPlan ? ". Upgrade to PRO for 20k" : ""}`, "error");
                    }
                  }}
                  placeholder="Add data logic, constraints or details. Replay works without it — context just sharpens the result (optional)"
                  disabled={isProcessing}
                  rows={3}
                  className={cn(
                    "w-full px-3 py-3 rounded-lg text-xs text-white/70 placeholder:text-white/30 placeholder:text-[11px] transition-colors focus:outline-none textarea-grow input-subtle min-h-[80px] max-h-[300px] resize-y",
                    isProcessing && "opacity-50 cursor-not-allowed"
                  )}
                />
              </div>

              <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-2 mb-3"><Palette className="w-4 h-4 text-white/40" /><span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Style</span></div>
                <StyleInjector 
                  value={styleDirective} 
                  onChange={setStyleDirective} 
                  disabled={isProcessing}
                  referenceImage={styleReferenceImage}
                  onReferenceImageChange={setStyleReferenceImage}
                />
              </div>

              {/* Generate Button */}
              <div className="p-4 border-b border-white/5">
                {(() => {
                  // Determine if we're in update mode (existing project + changed context)
                  const hasProject = activeGeneration && generatedCode && generationComplete;
                  const hasContextChange = refinements.trim() !== (activeGeneration?.refinements || "").trim();
                  const hasStyleChange = styleDirective.trim() !== (activeGeneration?.styleDirective || "").trim();
                  const isUpdateMode = hasProject && (hasContextChange || hasStyleChange) && refinements.trim();
                  
                  return (
                    <button onClick={handleGenerate} disabled={isProcessing || isEditing || flows.length === 0} className={cn("w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all btn-generate", (isProcessing || isEditing) && "processing")}>
                      <div className="btn-generate-grain" />
                      <span className="relative z-10 flex items-center gap-2.5">
                        {isProcessing || isEditing ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /><span className="generating-text">{isEditing ? "Updating..." : "Reconstructing..."}</span></>
                        ) : (
                          <><LogoIcon className="btn-logo-icon" color="#FF6E3C" /><span>Reconstruct</span><ChevronRight className="w-4 h-4" /></>
                        )}
                      </span>
                    </button>
                  );
                })()}
              </div>

              {/* Analysis Section - now scrolls with everything */}
              <div className="border-b border-white/5">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2"><Activity className="w-4 h-4 text-white/40" /><span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Analysis</span></div>
                <div ref={analysisRef} className="p-4">
              {(isProcessing || isStreamingCode) && analysisPhase ? (
                <div className="space-y-4">
                  {/* UX SIGNALS - Technical analysis tags */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="analysis-section"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">UX Signals</span>
                      {analysisSection === "style" && <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50 ml-auto" />}
                    </div>
                    <div className="space-y-2.5">
                      {/* Technical UX tags with Lucide icons */}
                      {analysisPhase.uxSignals && analysisPhase.uxSignals.length > 0 ? (
                        analysisPhase.uxSignals.map((signal, i) => (
                          <motion.div 
                            key={signal.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-2.5"
                          >
                            {/* Lucide icon based on signal type */}
                            <div className={cn(
                              "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
                              signal.value.includes("...") ? "bg-white/5" : "bg-white/[0.03]"
                            )}>
                              {signal.type === "motion" && <RefreshCw className={cn("w-3 h-3", signal.value.includes("...") ? "text-white/30 animate-spin" : "text-cyan-400/70")} />}
                              {signal.type === "interaction" && <MousePointer className={cn("w-3 h-3", signal.value.includes("...") ? "text-white/30" : "text-amber-400/70")} />}
                              {signal.type === "responsive" && <Smartphone className={cn("w-3 h-3", signal.value.includes("...") ? "text-white/30" : "text-green-400/70")} />}
                              {signal.type === "hierarchy" && <Layers className={cn("w-3 h-3", signal.value.includes("...") ? "text-white/30" : "text-purple-400/70")} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] text-white/50">{signal.label}</span>
                                {signal.value.includes("...") ? (
                                  <span className="text-[10px] text-[#FF6E3C]/60 italic">{signal.value}</span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/80 font-medium border border-white/5">
                                    {signal.value}
                                  </span>
                                )}
                              </div>
                              {signal.tech && !signal.value.includes("...") && (
                                <code className="text-[9px] text-white/30 mt-0.5 block font-mono">{signal.tech}</code>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] text-white/30">
                          <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50" />
                          <span>Detecting patterns...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* STRUCTURE & COMPONENTS - Component Tree Hierarchy */}
                  <AnimatePresence>
                    {(analysisSection === "layout" || analysisSection === "components") && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }}
                        className="analysis-section"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Structure & Components</span>
                          {analysisSection === "layout" && <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50 ml-auto" />}
                          {analysisSection === "components" && <Check className="w-3 h-3 text-green-500/50 ml-auto" />}
                        </div>
                        
                        {/* Component Tree - hierarchical view */}
                        <div className="space-y-1 font-mono">
                          {analysisPhase.componentTree && analysisPhase.componentTree.length > 0 ? (
                            analysisPhase.componentTree.map((node, i) => (
                              <motion.div 
                                key={node.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="group"
                              >
                                <div className="flex items-center gap-1.5">
                                  {/* Tree structure indicator */}
                                  <span className="text-white/20 text-[10px]">
                                    {i === 0 ? "▼" : i === analysisPhase.componentTree!.length - 1 ? "└" : "├"}
                                  </span>
                                  
                                  {/* Status icon */}
                                  {node.status === "done" ? (
                                    <Check className="w-2.5 h-2.5 text-green-500/70 flex-shrink-0" />
                                  ) : node.status === "generating" ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin text-[#FF6E3C]/70 flex-shrink-0" />
                                  ) : (
                                    <div className="w-2.5 h-2.5 rounded-full border border-white/10 flex-shrink-0" />
                                  )}
                                  
                                  {/* Component name */}
                                  <span className={cn(
                                    "text-[10px]", 
                                    node.status === "done" ? "text-white/70" : 
                                    node.status === "generating" ? "text-[#FF6E3C]/70" : "text-white/30"
                                  )}>
                                    {node.name}
                                  </span>
                                  
                                  {/* Type badge */}
                                  <span className={cn(
                                    "text-[8px] px-1 py-0.5 rounded",
                                    node.type === "Template" ? "bg-purple-500/20 text-purple-400/80" :
                                    node.type === "Organism" ? "bg-blue-500/20 text-blue-400/80" :
                                    node.type === "Molecule" ? "bg-green-500/20 text-green-400/80" :
                                    "bg-white/10 text-white/40"
                                  )}>
                                    {node.type}
                                  </span>
                                  
                                  {/* Database connection indicator */}
                                  {node.hasDataConnection && (
                                    <span className="text-[9px] text-yellow-500/80 flex items-center gap-0.5" title="Dynamic Collection">
                                      <Database className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </div>
                                
                                {/* Children preview (collapsed) */}
                                {node.children && node.children.length > 0 && node.status === "done" && (
                                  <div className="ml-5 mt-0.5 text-[9px] text-white/25">
                                    {node.children.slice(0, 3).join(" • ")}
                                    {node.children.length > 3 && ` +${node.children.length - 3}`}
                                  </div>
                                )}
                              </motion.div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] text-white/30">
                              <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50" />
                              <span>Building component tree...</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Data Patterns - detected database connections + Supabase status */}
                        {analysisPhase.dataPatterns && analysisPhase.dataPatterns.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 pt-2 border-t border-white/5"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Database className={cn("w-3 h-3", isSupabaseConnected ? "text-green-500/60" : "text-white/20")} />
                                <span className="text-[9px] text-white/30 uppercase tracking-wide">Data Patterns</span>
                              </div>
                              {/* Supabase connection status - PRO only */}
                              {isPaidPlan ? (
                                <span className={cn(
                                  "text-[9px]",
                                  isSupabaseConnected ? "text-green-500" : "text-white/30"
                                )}>
                                  {isSupabaseConnected ? "Supabase Connected" : "Supabase Not Connected"}
                                </span>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setUpgradeFeature("supabase");
                                    setShowUpgradeModal(true);
                                  }}
                                  className="flex items-center gap-1 text-[9px] text-[#FF6E3C] hover:text-[#FF8F5C]"
                                >
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>PRO</span>
                                </button>
                              )}
                            </div>
                            {isPaidPlan ? (
                              analysisPhase.dataPatterns.map((pattern, i) => (
                                <div key={i} className="flex items-center gap-2 text-[9px] py-0.5">
                                  <span className="text-white/50">{pattern.pattern}</span>
                                  <span className="text-white/20">→</span>
                                  <code className={cn(
                                    "font-mono px-1 rounded",
                                    isSupabaseConnected ? "text-green-400/80 bg-green-500/5" : "text-white/40 bg-white/5"
                                  )}>{pattern.suggestedTable || pattern.component}</code>
                                </div>
                              ))
                            ) : (
                              <div className="text-[9px] text-white/30 italic">
                                {analysisPhase.dataPatterns.length} patterns detected — upgrade to see details
                              </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : generationComplete && analysisPhase?.stats ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <LogoIcon className="w-4 h-5" color="#FF6E3C" />
                    <span className="text-xs font-medium text-white/60">Complete</span>
                  </div>
                  
                  {/* Stats tiles - compact single line */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">Stack</span>
                      <span className="text-xs text-white/70 font-medium">Tailwind + Alpine</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">Elements</span>
                      <span className="text-xs text-white/70 font-medium">{analysisPhase.stats.componentCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/40">Style</span>
                      <span className="text-xs text-white/70 font-medium truncate max-w-[140px]">{analysisPhase.stats.theme.split(' ')[0]}</span>
                    </div>
                  </div>
                  
                  {/* Show actual colors from generated code */}
                  {styleInfo && styleInfo.colors.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <span className="text-xs text-white/30">Colors:</span>
                      <div className="flex gap-1">
                        {styleInfo.colors.slice(0, 5).map((c, i) => (
                          <div key={i} className="w-5 h-5 rounded-sm border border-white/10" style={{ background: c.value }} title={c.value} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {analysisDescription && (
                    <p className="text-xs text-white/40 leading-relaxed mt-2 pt-2 border-t border-white/5">
                      {analysisDescription}
                    </p>
                  )}
                </motion.div>
              ) : (
                <div className="analysis-section">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-3.5 h-3.5 text-white/20" />
                    <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">Waiting for generation</span>
                  </div>
                  <p className="text-xs text-white/25 leading-relaxed">Live analysis logs will display here once generation starts.</p>
                </div>
              )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a] min-w-0 overflow-hidden">
          {/* Desktop Top Bar: Tabs Left | Options Center | User/Actions Right */}
          <div className="hidden md:flex items-center justify-between px-3 h-12 border-b border-white/5 bg-black/40">
            {/* Left: Navigation Tabs */}
            <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5">
              {[
                { id: "preview", icon: Eye, label: "Preview" },
                { id: "code", icon: Code, label: "Code" },
                { id: "flow", icon: GitBranch, label: "Flow" },
                { id: "design", icon: Paintbrush, label: "Design System" },
                { id: "input", icon: FileInput, label: "Input" },
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setViewMode(tab.id as ViewMode)} 
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", 
                    viewMode === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>
            
            {/* Center: Tab-specific options */}
            <div className="flex items-center gap-2">
              {viewMode === "flow" && (
                <div className="flex items-center gap-1 mr-2">
                  <button onClick={() => setArchZoom(z => Math.max(0.5, z - 0.1))} className="btn-black p-1.5 rounded-lg"><ZoomOut className="w-3.5 h-3.5" /></button>
                  <span className="text-xs text-white/40 w-12 text-center">{Math.round(archZoom * 100)}%</span>
                  <button onClick={() => setArchZoom(z => Math.min(2, z + 0.1))} className="btn-black p-1.5 rounded-lg"><ZoomIn className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {viewMode === "code" && editableCode && !isCodeEditable && (
                <button onClick={handleEnterEditMode} className="btn-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"><Pencil className="w-3.5 h-3.5" /> Edit</button>
              )}
              {viewMode === "code" && isCodeEditable && (
                <button onClick={applyCodeChanges} className="btn-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400"><Check className="w-3.5 h-3.5" /> Apply</button>
              )}
              {editableCode && (
                <>
                  {viewMode === "preview" && (
                    <>
                      {/* Pending edits indicator and Save All */}
                      {pendingTextEdits.length > 0 && (
                        <>
                          <button 
                            onClick={() => { 
                              // Reset pending edits and refresh preview to original
                              setPendingTextEdits([]); 
                              setIsDirectEditMode(false);
                              // Force refresh preview to discard visual changes
                              if (editableCode) {
                                setPreviewUrl(URL.createObjectURL(new Blob([editableCode], { type: "text/html" })));
                              }
                            }}
                            className="btn-black px-2 py-1 rounded-lg text-[10px] text-white/50 hover:text-white/70"
                          >
                            Discard All
                          </button>
                          <button 
                            onClick={applyPendingTextEdits}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                          >
                            <Check className="w-3 h-3" /> Save All ({pendingTextEdits.length})
                          </button>
                        </>
                      )}
                      
                      {/* Editing / Select toggle - click again to deselect */}
                      <div className="flex items-center rounded-lg overflow-hidden border border-white/10">
                        <button 
                          onClick={() => { 
                            if (isDirectEditMode) {
                              setIsDirectEditMode(false);
                            } else {
                              setIsDirectEditMode(true); 
                              setIsPointAndEdit(false);
                              setShowFloatingEdit(false); // Close Edit with AI when entering direct edit mode
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 text-[11px] transition-colors",
                            isDirectEditMode ? "bg-[#FF6E3C]/20 text-[#FF6E3C]" : "bg-white/5 text-white/50 hover:text-white/70"
                          )}
                        >
                          <Pencil className="w-3 h-3" /> Editing
                        </button>
                        <button 
                          onClick={() => { 
                            if (isPointAndEdit) {
                              setIsPointAndEdit(false);
                            } else {
                              setIsPointAndEdit(true); 
                              setIsDirectEditMode(false); 
                            }
                          }}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1.5 text-[11px] transition-colors border-l border-white/10",
                            isPointAndEdit ? "bg-[#FF6E3C]/20 text-[#FF6E3C]" : "bg-white/5 text-white/50 hover:text-white/70"
                          )}
                        >
                          <MousePointer className="w-3 h-3" /> Select
                        </button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
            
            {/* Right: User Menu + Refresh + Mobile + Publish */}
            <div className="flex items-center gap-2">
              {/* User Menu */}
              <div className="relative" ref={profileMenuRef}>
                {user ? (
                  <>
                    {(() => {
                      const meta = user.user_metadata;
                      const displayName = meta?.full_name || meta?.name || user.email?.split('@')[0] || 'User';
                      const plan = membership?.plan || "free";
                      return (
                        <button 
                          onClick={() => setShowProfileMenu(!showProfileMenu)}
                          className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <span className="text-xs font-medium text-white/80 max-w-[80px] truncate">{displayName}</span>
                          {isPaidPlan ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white uppercase">
                              {plan === "agency" ? "Agency" : plan === "enterprise" ? "Enterprise" : "Pro"}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/10 text-white/50 uppercase">
                              Free
                            </span>
                          )}
                        </button>
                      );
                    })()}
                    
                    {/* Profile Dropdown */}
                    <AnimatePresence>
                      {showProfileMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                        >
                          {/* Credits section */}
                          {(() => {
                            const plan = membership?.plan || "free";
                            const maxCredits = plan === "agency" ? 10000 : plan === "pro" ? 3000 : 100;
                            const percentage = Math.min(100, (userTotalCredits / maxCredits) * 100);
                            return (
                              <Link 
                                href="/settings?tab=plans"
                                onClick={() => setShowProfileMenu(false)}
                                className="block p-4 hover:bg-white/5 transition-colors border-b border-white/5"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-white">{userTotalCredits} credits</span>
                                    {isPaidPlan ? (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white uppercase">
                                        {plan === "agency" ? "Agency" : plan === "enterprise" ? "Enterprise" : "Pro"}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/10 text-white/50 uppercase">
                                        Free
                                      </span>
                                    )}
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-white/40" />
                                </div>
                                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                {isPaidPlan ? (
                                  <div className="mt-2">
                                    <span className="text-xs text-white/40">Add credits →</span>
                                  </div>
                                ) : (
                                  <div className="mt-2">
                                    <span className="text-xs text-[#FF6E3C] font-medium">Upgrade →</span>
                                  </div>
                                )}
                              </Link>
                            );
                          })()}
                          
                          {/* Your Projects */}
                          <button 
                            onClick={() => { setShowProfileMenu(false); setSidebarView("projects"); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                          >
                            <Folder className="w-4 h-4 opacity-50" />
                            Your Projects
                          </button>
                          
                          {/* Settings */}
                          <Link 
                            href="/settings"
                            onClick={() => setShowProfileMenu(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                          >
                            <Settings className="w-4 h-4 opacity-50" />
                            Settings
                          </Link>
                          
                          {/* Sign out */}
                          <div className="border-t border-white/5">
                            <button 
                              onClick={() => { setShowProfileMenu(false); signOut(); }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                            >
                              <LogOut className="w-4 h-4 opacity-50" />
                              Sign out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                  >
                    Sign in
                  </button>
                )}
              </div>
              
              {/* Refresh button */}
              <button 
                onClick={handleRefresh}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Refresh preview"
              >
                <RefreshCw className="w-4 h-4 text-white/60" />
              </button>
              
              {/* Mobile toggle */}
              <button 
                onClick={() => setIsMobilePreview(!isMobilePreview)} 
                className={cn(
                  "p-2 rounded-lg transition-colors", 
                  isMobilePreview 
                    ? "bg-[#FF6E3C]/20 text-[#FF6E3C]" 
                    : "bg-white/5 hover:bg-white/10"
                )} 
                title={isMobilePreview ? "Desktop view" : "Mobile view"}
              >
                {isMobilePreview ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4 text-white/60" />}
              </button>
              
              {/* Publish button - always brand color */}
              <button
                onClick={() => {
                  if (!user || isDemoMode) {
                    setShowAuthModal(true);
                    showToast("Sign up free to publish. You get 1 free generation!", "info");
                    return;
                  }
                  if (!isPaidPlan) {
                    setUpgradeFeature("publish");
                    setShowUpgradeModal(true);
                    return;
                  }
                  if (!editableCode) return;
                  handlePublish();
                }}
                disabled={isPublishing}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#FF6E3C] hover:bg-[#FF8F5C] text-white transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Publishing...
                  </>
                ) : publishedUrl ? (
                  <>
                    <ExternalLink className="w-3 h-3" />
                    Published
                  </>
                ) : (
                  "Publish"
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative bg-[#0a0a0a]">
            {/* Preview - show loading during generation, keep preview visible during editing */}
            {viewMode === "preview" && (
              <div className="flex-1 preview-container relative bg-[#0a0a0a] flex flex-col overflow-hidden" style={{ overscrollBehavior: 'none' }}>
                {(isProcessing || isStreamingCode) ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                    <LoadingState />
                  </div>
                ) : previewUrl ? (
                  <>
                    {/* Iframe container */}
                    <div className={cn("flex-1 flex items-center justify-center bg-[#0a0a0a] overflow-hidden relative", isMobilePreview && "py-4")} style={{ overscrollBehavior: 'none' }}>
                      <iframe 
                        key={previewUrl}
                        ref={previewIframeRef}
                        src={previewUrl} 
                        className={cn(
                          "border-0 bg-[#0a0a0a] transition-all duration-300",
                          isMobilePreview 
                            ? "w-[375px] h-[667px] rounded-3xl shadow-2xl ring-4 ring-black/50" 
                            : "w-full h-full",
                          isPointAndEdit && "cursor-crosshair",
                          isEditing && "opacity-50"
                        )} 
                        style={{ overscrollBehavior: 'none', backgroundColor: '#0a0a0a' }}
                        title="Preview" 
                        sandbox="allow-scripts allow-same-origin" 
                      />
                      {/* Editing overlay indicator */}
                      {isEditing && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/80 backdrop-blur-sm px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-3">
                            <Loader2 className="w-5 h-5 text-[#FF6E3C] animate-spin" />
                            <span className="text-white/80 text-sm font-medium">Applying changes...</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!showFloatingEdit && !isEditing && (
                      <button onClick={() => { setShowFloatingEdit(true); setIsDirectEditMode(false); }} className="floating-edit-btn flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white/90">
                        <Sparkles className="w-4 h-4 text-[#FF6E3C]" /> Edit with AI
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                    <EmptyState icon="logo" title="Drop or record video. Get code." subtitle="We analyze the flow, map interactions, and export clean code." showEarlyAccess={generations.length === 0} />
                  </div>
                )}
              </div>
            )}

            {/* Code - Professional Code Tab with mode toggle and file tree */}
            {viewMode === "code" && (
              <div className="flex-1 flex flex-col relative bg-[#0a0a0a] min-h-0 overflow-hidden">
                {/* Show loading during generation - hide everything else */}
                {(isProcessing || isStreamingCode) ? (
                  <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                    <LoadingState />
                  </div>
                ) : (
                  <>
                {/* Code Tab Header - Mode toggle, Agent Mode, actions */}
                {displayedCode && (
                  <div className="flex-shrink-0 border-b border-white/5 bg-[#0c0c0c] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Mode toggle - Single-file / Componentized + Agent Mode */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-black/50 rounded-lg p-0.5">
                          <button
                            onClick={() => setCodeMode("single-file")}
                            className={cn(
                              "px-3 py-1 rounded-md text-[10px] font-medium transition-all",
                              codeMode === "single-file" 
                                ? "bg-white/10 text-white" 
                                : "text-white/40 hover:text-white/60"
                            )}
                          >
                            Single-file
                          </button>
                          <button
                            onClick={() => generationComplete && setCodeMode("componentized")}
                            disabled={!generationComplete}
                            className={cn(
                              "px-3 py-1 rounded-md text-[10px] font-medium transition-all",
                              !generationComplete && "opacity-50 cursor-not-allowed",
                              codeMode === "componentized" 
                                ? "bg-white/10 text-white" 
                                : "text-white/40 hover:text-white/60"
                            )}
                            title={!generationComplete ? "Complete generation first" : ""}
                          >
                            Componentized
                          </button>
                        </div>
                        
                        {/* Agent Mode Toggle - Clean minimal design */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setAgentMode(!agentMode)}
                            className={cn(
                              "relative w-8 h-4 rounded-full transition-all",
                              agentMode 
                                ? "bg-[#FF6E3C]" 
                                : "bg-white/20"
                            )}
                            aria-label="Toggle Agent Mode"
                          >
                            <span className={cn(
                              "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all",
                              agentMode ? "left-[18px]" : "left-0.5"
                            )} />
                          </button>
                          <span className={cn(
                            "text-[10px] font-medium",
                            agentMode ? "text-white" : "text-white/40"
                          )}>
                            Agent Mode
                          </span>
                          {/* Info tooltip - positioned below */}
                          <div className="relative group">
                            <Info className="w-3 h-3 text-white/30 cursor-help" />
                            <div className="absolute left-0 top-full mt-2 w-64 p-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                              <div className="absolute left-2 -top-1 w-2 h-2 bg-[#1a1a1a] border-l border-t border-white/10 rotate-45" />
                              <p className="text-[10px] text-white/70 leading-relaxed">
                                Adds hidden context markers to the code. Optimized for <span className="text-white font-medium">Cursor</span>, <span className="text-white font-medium">Windsurf</span>, and <span className="text-white font-medium">Copilot</span> to understand your UI intent instantly.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Actions - Copy for AI dropdown & Download */}
                      <div className="flex items-center gap-1.5">
                        {/* Copy for AI - Single dropdown button */}
                        <div className="relative">
                          <button 
                            onClick={() => {
                              // Demo mode + no user -> Sign up
                              if (!user) {
                                setShowAuthModal(true);
                                showToast("Sign up free to export code. You get 1 free generation!", "info");
                                return;
                              }
                              // User exists but no credits and not paid -> Show starter pack modal
                              if (!isPaidPlan && userTotalCredits <= 0) {
                                setShowOutOfCreditsModal(true);
                                return;
                              }
                              // User can export (paid OR has credits)
                              setShowCopyDropdown(!showCopyDropdown);
                            }}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors",
                              agentMode 
                                ? "bg-[#FF6E3C]/10 text-[#FF6E3C] hover:bg-[#FF6E3C]/20 border border-[#FF6E3C]/30" 
                                : "text-white/40 hover:text-white/60 hover:bg-white/5",
                              (!user || (!isPaidPlan && userTotalCredits <= 0)) && "opacity-50"
                            )}
                          >
                            {(!user || (!isPaidPlan && userTotalCredits <= 0)) && <Lock className="w-2.5 h-2.5" />}
                            <Copy className="w-3 h-3" />
                            <span>Copy for AI</span>
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {/* Copy Dropdown Menu */}
                          {showCopyDropdown && user && (isPaidPlan || userTotalCredits > 0) && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setShowCopyDropdown(false)}
                              />
                              <div className="absolute right-0 top-full mt-1 w-56 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                                <div className="p-1.5">
                                  <button
                                    onClick={() => {
                                      const content = getActiveFileContent();
                                      navigator.clipboard.writeText(content);
                                      showToast("Clean code copied", "success");
                                      setShowCopyDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px] text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-white/40" />
                                    <div>
                                      <div className="font-medium">Copy Clean Code</div>
                                      <div className="text-[9px] text-white/40">For manual implementation</div>
                                    </div>
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      const content = getAgentPackCode(getActiveFileContent());
                                      navigator.clipboard.writeText(content);
                                      showToast("Agent Pack copied! Paste into Cursor", "success");
                                      setShowCopyDropdown(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px] transition-colors text-left",
                                      agentMode 
                                        ? "bg-[#FF6E3C]/10 text-[#FF6E3C]" 
                                        : "text-white/70 hover:bg-[#FF6E3C]/10 hover:text-[#FF6E3C]"
                                    )}
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <div>
                                      <div className="font-medium">Copy for AI Editors</div>
                                      <div className="text-[9px] opacity-60">With context markers & instructions</div>
                                    </div>
                                    {agentMode && <Check className="w-3 h-3 ml-auto" />}
                                  </button>
                                  
                                  <div className="border-t border-white/5 my-1" />
                                  
                                  <button
                                    onClick={() => {
                                      const instructions = generateAgentInstructions(generationTitle, flowNodes);
                                      navigator.clipboard.writeText(instructions);
                                      showToast("Prompt instructions copied", "success");
                                      setShowCopyDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[11px] text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5 text-white/40" />
                                    <div>
                                      <div className="font-medium">Copy Prompt Only</div>
                                      <div className="text-[9px] text-white/40">Just the AI instructions</div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        <button 
                          onClick={() => {
                            // No user -> Sign up
                            if (!user) {
                              setShowAuthModal(true);
                              showToast("Sign up free to download code. You get 1 free generation!", "info");
                              return;
                            }
                            // No credits and not paid -> Show starter pack modal
                            if (!isPaidPlan && userTotalCredits <= 0) {
                              setShowOutOfCreditsModal(true);
                              return;
                            }
                            // Allow download
                            handleDownload();
                          }}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded text-[10px] text-white/40 hover:text-white/60 hover:bg-white/5 transition-colors",
                            (!user || (!isPaidPlan && userTotalCredits <= 0)) && "opacity-50"
                          )}
                        >
                          {(!user || (!isPaidPlan && userTotalCredits <= 0)) && <Lock className="w-2.5 h-2.5" />}
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Main Code Area */}
                <div className="flex-1 flex min-h-0 overflow-hidden">
                  {/* File Tree Panel - Same width for both modes */}
                  {displayedCode && (
                    <div className="w-56 flex-shrink-0 border-r border-white/5 overflow-y-auto bg-[#0a0a0a]">
                      <div className="p-2 border-b border-white/5 sticky top-0 bg-[#0a0a0a] z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-[9px] text-white/40 uppercase tracking-wider">
                            <FolderTree className="w-3 h-3" />
                            <span>Files</span>
                          </div>
                          <span className="text-[8px] text-white/20">{generatedFiles.length} files</span>
                        </div>
                      </div>
                      
                      <div className="p-1 text-[10px]">
                        {/* Render file tree */}
                        {buildFileTree(generatedFiles).map((item) => (
                          <FileTreeItem 
                            key={item.path} 
                            item={item} 
                            activeFilePath={activeFilePath}
                            onFileClick={(path, isStub, nodeId) => {
                              if (isStub && nodeId) {
                                // For stubs, only fill the edit input - DON'T start generating yet
                                // Generation only starts when user clicks the send button
                                // Block if currently editing
                                if (isEditing) return;
                                const node = flowNodes.find(n => n.id === nodeId);
                                if (node) {
                                  setEditInput(`@${node.name} Create this page with full content and layout`);
                                  setShowFloatingEdit(true);
                                  // Focus the edit input
                                  setTimeout(() => editInputRef.current?.focus(), 100);
                                }
                              } else {
                                setActiveFilePath(path);
                              }
                            }}
                            onFolderToggle={toggleFolder}
                            expandedFolders={expandedFolders}
                            generatingPath={generatingFilePath}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Code Editor Panel */}
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Breadcrumb bar */}
                    {displayedCode && (
                      <div className="flex-shrink-0 px-3 py-1.5 border-b border-white/5 bg-[#0a0a0a] flex items-center gap-2">
                        <span className="text-[10px] text-white/30">
                          {activeFilePath.split('/').filter(Boolean).map((part, i, arr) => (
                            <span key={i}>
                              <span className={i === arr.length - 1 ? "text-white/60" : ""}>{part}</span>
                              {i < arr.length - 1 && <span className="mx-1 text-white/20">/</span>}
                            </span>
                          ))}
                        </span>
                        {generatedFiles.find(f => f.path === activeFilePath)?.isStub && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-yellow-500/10 text-yellow-400/70 border border-yellow-500/20">
                            STUB
                          </span>
                        )}
                        {agentMode && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] bg-[#FF6E3C]/10 text-[#FF6E3C] border border-[#FF6E3C]/20">
                            AGENT
                          </span>
                        )}
                        {generatedFiles.find(f => f.path === activeFilePath)?.lineCount && (
                          <span className="ml-auto text-[9px] text-white/20">
                            {agentMode ? "~" : ""}{generatedFiles.find(f => f.path === activeFilePath)?.lineCount}{agentMode ? "+ lines" : " lines"}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Code content */}
                    <div ref={codeContainerRef} className="flex-1 overflow-auto">
                      {isCodeEditable ? (
                        <textarea 
                          value={editableCode} 
                          onChange={(e) => setEditableCode(e.target.value)} 
                          className="w-full h-full p-3 bg-[#0a0a0a] text-[11px] text-white/80 font-mono resize-none focus:outline-none" 
                          style={{ fontFamily: "'JetBrains Mono', monospace" }} 
                          spellCheck={false} 
                        />
                      ) : generatingFilePath && generatingFilePath === activeFilePath ? (
                        // Show loading state when generating the currently viewed file
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] gap-4">
                          <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin" />
                          <div className="text-center">
                            <p className="text-sm text-white/60 font-medium">Generating page...</p>
                            <p className="text-xs text-white/30 mt-1">{activeFilePath.split('/').pop()}</p>
                          </div>
                        </div>
                      ) : displayedCode ? (
                        <div className="overflow-x-auto relative h-full">
                          {/* For PRO users: show real code (with Agent Mode enhancements if enabled) */}
                          {isPaidPlan ? (
                            <Highlight 
                              theme={themes.nightOwl} 
                              code={agentMode ? getAgentPackCode(getActiveFileContent()) : getActiveFileContent()} 
                              language={activeFilePath.endsWith('.tsx') || activeFilePath.endsWith('.ts') ? 'tsx' : 'html'}
                            >
                              {({ style, tokens, getLineProps, getTokenProps }) => (
                                <pre 
                                  className="p-3 text-[11px] leading-relaxed" 
                                  style={{ 
                                    ...style, 
                                    background: "#0a0a0a", 
                                    fontFamily: "'JetBrains Mono', monospace", 
                                    minHeight: "100%",
                                    minWidth: "fit-content"
                                  }}
                                >
                                  {tokens.map((line, i) => {
                                    const lineNum = i + 1;
                                    const isHighlighted = highlightedLines && lineNum >= highlightedLines.start && lineNum <= highlightedLines.end;
                                    return (
                                      <div 
                                        key={i} 
                                        {...getLineProps({ line })}
                                        className={cn(
                                          isHighlighted && "bg-[#FF6E3C]/10 -mx-3 px-3 border-l-2 border-[#FF6E3C]"
                                        )}
                                      >
                                        <span className="inline-block w-8 pr-3 text-right text-white/15 select-none text-[10px]">{lineNum}</span>
                                        {line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}
                                      </div>
                                    );
                                  })}
                                  {isStreamingCode && <span className="text-[#FF6E3C] animate-pulse">▋</span>}
                                </pre>
                              )}
                            </Highlight>
                          ) : (
                            /* For FREE users: show blurred mock code with upgrade overlay */
                            <div className="relative h-full">
                              {/* Blurred mock code background - visible but unreadable */}
                              <div className="absolute inset-0 overflow-hidden select-none pointer-events-none">
                                <pre 
                                  className="p-3 text-[11px] leading-relaxed blur-[8px] opacity-60" 
                                  style={{ 
                                    background: "#0a0a0a", 
                                    fontFamily: "'JetBrains Mono', monospace",
                                  }}
                                >
                                  {`import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function GeneratedPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data from API
    fetchData().then(setData);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b">
      <header className="fixed top-0 w-full">
        <nav className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Logo />
            <Navigation />
          </div>
        </nav>
      </header>

      <main className="pt-20">
        <section className="hero-section">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold"
          >
            Welcome to Your App
          </motion.h1>
          <p className="text-xl text-muted">
            Build something amazing today
          </p>
          <Button size="lg">Get Started</Button>
        </section>

        <section className="features-grid">
          {features.map((feature, i) => (
            <Card key={i} className="p-6">
              <feature.icon className="w-12 h-12" />
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Card>
          ))}
        </section>
      </main>

      <footer className="border-t">
        <div className="container py-8">
          <p>© 2026 Your Company</p>
        </div>
      </footer>
    </div>
  );
}`.split('\n').map((line, i) => (
                                    <div key={i} className="whitespace-pre">
                                      <span className="inline-block w-8 pr-3 text-right text-white/15 text-[10px]">{i + 1}</span>
                                      <span className="text-white/50">{line}</span>
                                    </div>
                                  ))}
                                </pre>
                              </div>
                              
                              {/* Upgrade overlay - FOMO style */}
                              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-[#0a0a0a]/40 via-[#0a0a0a]/70 to-[#0a0a0a]/90">
                                <div className="relative text-center p-8 bg-[#111]/95 border border-white/10 rounded-2xl shadow-2xl max-w-md mx-4">
                                  {/* Close button */}
                                  <button 
                                    onClick={() => setViewMode("preview")}
                                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                                  >
                                    <X className="w-4 h-4 text-white/40" />
                                  </button>
                                  
                                  <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 border border-[#FF6E3C]/20 flex items-center justify-center">
                                    <Lock className="w-7 h-7 text-[#FF6E3C]" />
                                  </div>
                                  <h3 className="text-xl font-bold text-white mb-3">Unlock Full Source Code</h3>
                                  <p className="text-sm text-white/60 mb-4">
                                    Your code is ready. We've successfully reconstructed the UI logic, animations, and data structure.
                                  </p>
                                  
                                  {/* Features list */}
                                  <div className="text-left space-y-2 mb-6 px-4">
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <span>Clean React + Tailwind Components</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <span>Framer Motion Interactions</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-white/70">
                                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                      <span>Supabase Schema & Data Fetching</span>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={handleUpgradeCheckout}
                                    disabled={isUpgradeCheckingOut}
                                    className="block w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white text-sm font-semibold hover:opacity-90 transition-opacity mb-3 text-center disabled:opacity-50"
                                  >
                                    {isUpgradeCheckingOut ? (
                                      <span className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                      </span>
                                    ) : (
                                      "Upgrade to Pro"
                                    )}
                                  </button>
                                  <p className="text-[11px] text-white/40">
                                    Includes commercial license. Cancel anytime.
                                  </p>
                                  
                                  <button
                                    onClick={() => setViewMode("preview")}
                                    className="mt-4 text-xs text-white/30 hover:text-white/50 transition-colors"
                                  >
                                    Maybe later
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                          {isProcessing ? <LoadingState /> : <EmptyState icon="logo" title="No code generated" subtitle="Generate from a video to see the code" />}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Inspector Panel removed - simplified UI */}
                </div>
                
                {editableCode && !isStreamingCode && !isCodeEditable && !showFloatingEdit && (
                  <button onClick={() => { setShowFloatingEdit(true); setIsDirectEditMode(false); }} className="floating-edit-btn flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white/90">
                    <Sparkles className="w-4 h-4 text-[#FF6E3C]" /> Edit with AI
                  </button>
                )}
                  </>
                )}
              </div>
            )}

            {/* Flow - PRODUCT MAP (Canvas) - what's possible, not what happened */}
            {viewMode === "flow" && (
              <div className="flex-1 overflow-hidden relative flex flex-col">
                {/* Show loader when processing (same as other views) */}
                {(isProcessing || isStreamingCode) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <LoadingState />
                  </div>
                ) : flowNodes.length > 0 || flowBuilding ? (
                  <>
                    {/* Toggle buttons - top right */}
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                      {/* Possible paths toggle */}
                      <button 
                        onClick={() => setShowPossiblePaths(!showPossiblePaths)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg",
                          showPossiblePaths 
                            ? "bg-white/10 border border-white/20 text-white/80" 
                            : "bg-[#1a1a1a] border border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        Possible
                      </button>
                      {/* Structure toggle */}
                      <button 
                        onClick={() => setShowStructureInFlow(!showStructureInFlow)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg",
                          showStructureInFlow 
                            ? "bg-[#FF6E3C] text-white" 
                            : "bg-[#1a1a1a] border border-white/10 text-white/60 hover:border-white/20"
                        )}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Structure
                      </button>
                    </div>
                    
                    {/* Node Detail Panel removed - simplified UI */}
                    
                    
                    <div 
                      ref={archCanvasRef}
                      className={cn("arch-canvas w-full h-full", isPanning && !draggingNodeId && "dragging")}
                      onMouseDown={(e) => {
                        if (!draggingNodeId) handleCanvasMouseDown(e);
                      }}
                      onMouseMove={(e) => {
                        if (draggingNodeId) {
                          // Dragging a node
                          const dx = (e.clientX - dragStartPos.current.x) / archZoom;
                          const dy = (e.clientY - dragStartPos.current.y) / archZoom;
                          setFlowNodes(prev => prev.map(n => 
                            n.id === draggingNodeId 
                              ? { ...n, x: dragStartPos.current.nodeX + dx, y: dragStartPos.current.nodeY + dy }
                              : n
                          ));
                        } else {
                          handleCanvasMouseMove(e);
                        }
                      }}
                      onMouseUp={() => {
                        if (draggingNodeId) {
                          setDraggingNodeId(null);
                        } else {
                          handleCanvasMouseUp();
                        }
                      }}
                      onMouseLeave={() => {
                        setDraggingNodeId(null);
                        handleCanvasMouseUp();
                      }}
                    >
                      <div 
                        className="arch-canvas-inner" 
                        style={{ 
                          transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${archZoom})`,
                          transformOrigin: 'center center'
                        }}
                      >
                        {/* Edge lines with semantic styling - Full coverage SVG */}
                        <svg 
                          className="absolute pointer-events-none" 
                          style={{ left: 0, top: 0, width: "20000px", height: "12000px" }}
                        >
                          <defs>
                            <marker id="flow-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                              <polygon points="0 0, 8 3, 0 6" fill="rgba(255, 255, 255, 0.5)" />
                            </marker>
                            <marker id="flow-arrow-thick" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                              <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 255, 255, 0.6)" />
                            </marker>
                            <marker id="flow-arrow-gated" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                              <polygon points="0 0, 8 3, 0 6" fill="rgba(255, 255, 255, 0.4)" />
                            </marker>
                          </defs>
                          {flowEdges
                            .filter(edge => showPossiblePaths || edge.type !== "possible")
                            .map(edge => {
                            const fromNode = flowNodes.find(n => n.id === edge.from);
                            const toNode = flowNodes.find(n => n.id === edge.to);
                            if (!fromNode || !toNode) return null;
                            // Hide edges to hidden detected/possible nodes
                            if (!showPossiblePaths && (toNode.status === "detected" || toNode.status === "possible")) return null;
                            const x1 = fromNode.x + 90;
                            const y1 = fromNode.y + (showStructureInFlow ? 100 : 60);
                            const x2 = toNode.x + 90;
                            const y2 = toNode.y;
                            const midX = (x1 + x2) / 2;
                            const midY = (y1 + y2) / 2;
                            
                            // Edge styles: implemented = solid, possible = dashed gray
                            const edgeStyles: Record<string, { stroke: string; width: number; dash?: string; marker: string; labelBg: string }> = {
                              navigation: { stroke: "rgba(255, 255, 255, 0.4)", width: 2, marker: "url(#flow-arrow-thick)", labelBg: "rgba(10, 10, 10, 0.9)" },
                              action: { stroke: "rgba(255, 255, 255, 0.35)", width: 1.5, marker: "url(#flow-arrow)", labelBg: "rgba(10, 10, 10, 0.9)" },
                              scroll: { stroke: "rgba(255, 255, 255, 0.25)", width: 1.5, marker: "url(#flow-arrow)", labelBg: "rgba(10, 10, 10, 0.9)" },
                              gated: { stroke: "rgba(255, 255, 255, 0.3)", width: 1.5, dash: "5 3", marker: "url(#flow-arrow-gated)", labelBg: "rgba(10, 10, 10, 0.9)" },
                              possible: { stroke: "rgba(255, 255, 255, 0.12)", width: 1, dash: "4 4", marker: "url(#flow-arrow-gated)", labelBg: "rgba(20, 20, 20, 0.8)" }
                            };
                            const style = edgeStyles[edge.type] || edgeStyles.action;
                            const isPossible = edge.type === "possible";
                            
                            return (
                              <g key={edge.id} className={isPossible ? "opacity-60" : ""}>
                                <path 
                                  d={`M ${x1} ${y1} Q ${x1} ${midY} ${midX} ${midY} Q ${x2} ${midY} ${x2} ${y2}`}
                                  stroke={style.stroke}
                                  strokeWidth={style.width}
                                  strokeDasharray={style.dash}
                                  fill="none"
                                  markerEnd={style.marker}
                                />
                                {/* Label */}
                                <rect 
                                  x={midX - 45} 
                                  y={midY - 9} 
                                  width="90" 
                                  height="18" 
                                  rx="9" 
                                  fill={style.labelBg}
                                  stroke={isPossible ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.1)"}
                                  strokeWidth="1"
                                  strokeDasharray={isPossible ? "3 2" : undefined}
                                />
                                {edge.type === "gated" && (
                                  <text x={midX - 32} y={midY + 3} fill="rgba(255, 255, 255, 0.4)" fontSize="9">🔒</text>
                                )}
                                {isPossible && (
                                  <text x={midX - 32} y={midY + 3} fill="rgba(255, 255, 255, 0.25)" fontSize="8">○</text>
                                )}
                                <text 
                                  x={edge.type === "gated" || isPossible ? midX + 4 : midX} 
                                  y={midY + 3} 
                                  fill={isPossible ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.5)"} 
                                  fontSize="9" 
                                  textAnchor="middle" 
                                  className="font-medium"
                                  fontStyle={isPossible ? "italic" : "normal"}
                                >
                                  {edge.label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                        
                        {/* Flow Nodes - Draggable */}
                        {flowNodes
                          .filter(node => showPossiblePaths || node.status === "observed" || node.status === "added")
                          .map((node, idx) => {
                          const isObserved = node.status === "observed";
                          const isDetected = node.status === "detected";
                          const isPossible = node.status === "possible";
                          const isAdded = node.status === "added";
                          const typeIcons: Record<string, any> = { view: Layout, section: Layers, modal: Box, state: CheckCircle };
                          const Icon = typeIcons[node.type] || Layout;
                          const isDragging = draggingNodeId === node.id;
                          
                          // Confidence-based styling - "added" looks like "observed" (green) since they're active
                          const confidenceStyles: Record<string, string> = {
                            observed: "border-solid border-emerald-500/40 bg-[#0a0a0a]",
                            detected: "border-solid border-amber-500/30 bg-[#0a0a0a]",
                            possible: "border-dashed border-white/20 bg-[#0a0a0a]/50",
                            added: "border-solid border-emerald-500/40 bg-[#0a0a0a]"
                          };
                          
                          return (
                            <div 
                              key={node.id}
                              className={cn(
                                "absolute w-44 rounded-xl border backdrop-blur-sm select-none",
                                confidenceStyles[node.status] || confidenceStyles.detected,
                                selectedFlowNode === node.id && "ring-1 ring-[#FF6E3C]/50 border-[#FF6E3C]/30",
                                isDragging ? "cursor-grabbing shadow-2xl z-50 scale-[1.02]" : "hover:border-white/30"
                              )}
                              style={{ 
                                left: node.x, 
                                top: node.y,
                                transition: isDragging ? 'none' : 'border-color 0.15s, box-shadow 0.15s',
                                opacity: isPossible ? 0.6 : isDetected ? 0.8 : 1
                              }}
                              title={isObserved ? "Shown and confirmed in the video recording" : isDetected ? "Present in navigation, but not shown in video" : "Reachable from observed paths, not yet confirmed"}
                            >
                              {/* Node header - DRAGGABLE */}
                              <div 
                                className={cn(
                                  "pt-4 px-3 pb-3 border-b cursor-grab active:cursor-grabbing group/nodeheader relative",
                                  isPossible ? "border-white/5 border-dashed" : "border-white/5",
                                  draggingNodeId === node.id && "cursor-grabbing"
                                )}
                                onMouseDown={(e) => {
                                  // Don't start drag if clicking edit/delete buttons
                                  if ((e.target as HTMLElement).closest('.flow-node-action')) return;
                                  e.stopPropagation();
                                  setDraggingNodeId(node.id);
                                  dragStartPos.current = { 
                                    x: e.clientX, 
                                    y: e.clientY, 
                                    nodeX: node.x, 
                                    nodeY: node.y 
                                  };
                                }}
                                onClick={(e) => {
                                  if ((e.target as HTMLElement).closest('.flow-node-action')) return;
                                  if (!draggingNodeId) {
                                    setSelectedFlowNode(node.id === selectedFlowNode ? null : node.id);
                                    // For detected/possible nodes, open edit with @NodeName prefilled
                                    // Only if not currently editing
                                    if ((isDetected || isPossible) && node.id !== "home" && !isEditing) {
                                      setEditInput(`@${node.name} `);
                                      setShowFloatingEdit(true);
                                    }
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  if ((e.target as HTMLElement).closest('.flow-node-action')) return;
                                  e.stopPropagation();
                                  // Double-click to view code for this node
                                  handleFlowNodeCodeFocus(node.id);
                                }}
                              >
                                {/* Edit/Delete buttons on hover */}
                                <div className="flow-node-action absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover/nodeheader:opacity-100 transition-opacity z-10">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFlowNodeRenameValue(node.name);
                                      setFlowNodeModal({ type: "rename", nodeId: node.id, nodeName: node.name });
                                    }}
                                    className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors"
                                    title="Rename node"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFlowNodeModal({ type: "delete", nodeId: node.id, nodeName: node.name });
                                    }}
                                    className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                                    title="Delete node"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                
                                <div className="flex items-center gap-2 pr-12">
                                  {/* Confidence indicator */}
                                  {isObserved && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Observed" />}
                                  {isDetected && <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Detected" />}
                                  {isPossible && <div className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" title="Possible" />}
                                  <Icon className={cn("w-4 h-4 flex-shrink-0", 
                                    isObserved ? "text-emerald-400" : isDetected ? "text-amber-400" : "text-white/40"
                                  )} />
                                  <span className={cn(
                                    "text-sm font-semibold truncate", 
                                    isPossible ? "text-white/50 italic" : isDetected ? "text-white/70" : "text-white/90"
                                  )} title={node.name}>{node.name}</span>
                                </div>
                                {node.description && (
                                  <p className={cn("text-[10px] mt-1 line-clamp-2", isPossible ? "text-white/25" : isDetected ? "text-white/30" : "text-white/40")}>{node.description}</p>
                                )}
                              </div>
                              
                              {/* Structure overlay (when toggle is ON) */}
                              <AnimatePresence>
                                {showStructureInFlow && node.components && node.components.length > 0 && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-2 bg-white/[0.02]">
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <GitBranch className="w-3 h-3 text-white/30" />
                                        <span className="text-[9px] text-white/30 uppercase tracking-wider">Components</span>
                                      </div>
                                      <div className="space-y-1">
                                        {node.components.map((comp, i) => (
                                          <div key={i} className="flex items-center gap-1.5 text-[10px] text-white/50">
                                            <div className="w-1 h-1 rounded-full bg-[#FF6E3C]/50" />
                                            {comp}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              
                              {/* Action buttons - CTAs based on status */}
                              <div className="flex items-center gap-1 p-2 border-t border-white/5">
                                {(isObserved || isAdded) ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleFlowNodeCodeFocus(node.id);
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[9px] bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/70 transition-colors"
                                  >
                                    <Code className="w-3 h-3" />
                                    View Code
                                  </button>
                                ) : isDetected ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Auth check for Reconstruct
                                      if (!user || isDemoMode) {
                                        setShowAuthModal(true);
                                        showToast("Sign up free to reconstruct pages. Get 1 free generation!", "info");
                                        return;
                                      }
                                      if (isEditing) return;
                                      setEditInput(`@${node.name} Reconstruct this page based on observed navigation patterns and styling from the main page`);
                                      setShowFloatingEdit(true);
                                    }}
                                    disabled={isEditing}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[9px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-400/80 hover:text-amber-400 transition-colors disabled:opacity-50"
                                    title={!user || isDemoMode ? "Sign up to reconstruct" : "Reconstruct from observed patterns"}
                                  >
                                    <Plus className="w-3 h-3" />
                                    Reconstruct
                                    {(!user || isDemoMode) && <Lock className="w-2.5 h-2.5 ml-0.5" />}
                                  </button>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Auth check for Generate
                                      if (!user || isDemoMode) {
                                        setShowAuthModal(true);
                                        showToast("Sign up free to generate pages. Get 1 free generation!", "info");
                                        return;
                                      }
                                      if (isEditing) return;
                                      setEditInput(`@${node.name} Generate this flow continuation with consistent style and navigation`);
                                      setShowFloatingEdit(true);
                                    }}
                                    disabled={isEditing}
                                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[9px] bg-white/10 hover:bg-white/15 text-white/50 hover:text-white/70 transition-colors disabled:opacity-50"
                                    title={!user || isDemoMode ? "Sign up to generate" : "Generate flow continuation"}
                                  >
                                    <Plus className="w-3 h-3" />
                                    Generate
                                    {(!user || isDemoMode) && <Lock className="w-2.5 h-2.5 ml-0.5" />}
                                  </button>
                                )}
                              </div>
                              
                              {/* Status badge - centered on top with more spacing */}
                              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                                <span className={cn(
                                  "text-[7px] px-2 py-0.5 rounded-full bg-[#0a0a0a] border capitalize whitespace-nowrap",
                                  isObserved 
                                    ? "border-emerald-500/30 text-emerald-400/70" 
                                    : isAdded
                                    ? "border-emerald-500/30 text-emerald-400/70"
                                    : isDetected
                                    ? "border-amber-500/30 text-amber-400/70"
                                    : "border-dashed border-white/10 text-white/30 italic"
                                )}>
                                  {isObserved ? "observed" : isAdded ? "added" : isDetected ? "detected" : "possible"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        
                        
                        {flowBuilding && (
                          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs text-white/40 bg-black/50 px-3 py-2 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin text-[#FF6E3C]" />
                            Building product map...
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <EmptyState icon="logo" title="No product flow yet" subtitle="Flow shows how the product is connected - views, states, transitions" />
                  </div>
                )}
                
                {/* Edit with AI button for Flow */}
                {!flowBuilding && flowNodes.length > 0 && !showFloatingEdit && !isProcessing && (
                  <button 
                    onClick={() => { setShowFloatingEdit(true); setIsDirectEditMode(false); }} 
                    className="floating-edit-btn flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white/90"
                  >
                    <Sparkles className="w-4 h-4 text-[#FF6E3C]" /> Edit with AI
                  </button>
                )}
              </div>
            )}
            

            {/* Design System */}
            {viewMode === "design" && (
              <div className="flex-1 overflow-auto p-6 relative">
                {(isProcessing || isStreamingCode) ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <LoadingState />
                  </div>
                ) : styleInfo ? (
                  <div className="max-w-3xl mx-auto space-y-6">
                    <div className="flex items-center gap-2 mb-6"><Paintbrush className="w-5 h-5 text-[#FF6E3C]/60" /><h3 className="text-sm font-medium text-white/70">Design System</h3></div>
                    
                    {/* Colors with usage badges */}
                    <div className="style-card">
                      <div className="flex items-center gap-2 mb-4"><Droplet className="w-4 h-4 text-[#FF6E3C]/60" /><span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Colors</span></div>
                      <div className="space-y-4">
                        {styleInfo.colors.map((color, i) => {
                          // Generate usage hints based on color role
                          const usageHints: Record<string, string> = {
                            "Primary": "Used in: Primary CTAs, Active states, Links",
                            "Secondary": "Used in: Secondary buttons, Borders, Icons",
                            "Accent": "Used in: Highlights, Badges, Alerts",
                            "Background": "Used in: Page background, Cards",
                            "Text": "Used in: Body text, Headings",
                            "Border": "Used in: Dividers, Input borders"
                          };
                          return (
                            <div key={i} className="flex items-start gap-3">
                              <div className="color-swatch-large flex-shrink-0" style={{ backgroundColor: color.value }} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-white/70">{color.name}</p>
                                  <p className="text-[10px] text-white/40 font-mono">{color.value}</p>
                                </div>
                                <p className="text-[9px] text-white/30 mt-1">{usageHints[color.name] || "Used in: UI elements"}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Typography with usage badges */}
                    <div className="style-card">
                      <div className="flex items-center gap-2 mb-4"><Type className="w-4 h-4 text-[#FF6E3C]/60" /><span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Typography</span></div>
                      <div className="space-y-4">
                        {styleInfo.fonts.map((font, i) => {
                          const fontUsageHints = [
                            "Used in: Headers (H1–H3), Hero titles, CTAs",
                            "Used in: Body text, Paragraphs, Forms",
                            "Used in: Labels, Captions, Meta info",
                            "Used in: Code blocks, Data displays"
                          ];
                          return (
                            <div key={i} className="font-preview">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-lg text-white/80" style={{ fontFamily: font.family }}>{font.name}</p>
                                  <p className="text-[10px] text-white/40">{font.usage}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-white/30">{font.weight}</span>
                                  <p className="text-[10px] text-white/20 font-mono mt-1">{font.family}</p>
                                </div>
                              </div>
                              <p className="text-[9px] text-white/30 mt-1 pt-1 border-t border-white/5">{fontUsageHints[i] || "Used in: Various UI elements"}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Other Styles */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="style-card"><p className="text-[10px] text-white/40 uppercase mb-2">Spacing</p><p className="text-sm text-white/70">{styleInfo.spacing}</p></div>
                      <div className="style-card"><p className="text-[10px] text-white/40 uppercase mb-2">Border Radius</p><p className="text-sm text-white/70">{styleInfo.borderRadius}</p></div>
                      <div className="style-card"><p className="text-[10px] text-white/40 uppercase mb-2">Shadows</p><p className="text-sm text-white/70">{styleInfo.shadows}</p></div>
                    </div>
                    
                    {!showFloatingEdit && (
                      <button onClick={() => { setShowFloatingEdit(true); setIsDirectEditMode(false); }} className="floating-edit-btn flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white/90">
                        <Sparkles className="w-4 h-4 text-[#FF6E3C]" /> Edit with AI
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <EmptyState icon="logo" title="No style info yet" subtitle="Generate code to see the design system" />
                  </div>
                )}
              </div>
            )}

            {/* Input - Custom Video Player with better trim */}
            {viewMode === "input" && (
              <div className="flex-1 bg-black flex flex-col overflow-hidden">
                {selectedFlow ? (
                  <>
                    <div className="flex-1 flex items-center justify-center min-h-0 bg-black">
                      <video 
                        ref={videoRef} 
                        src={selectedFlow.videoUrl} 
                        preload="metadata"
                        playsInline
                        className="w-full h-full object-contain" 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%',
                          imageRendering: 'auto'
                        }}
                        onLoadedMetadata={(e) => {
                          const video = e.currentTarget;
                          // Seek to 0.5s to show a good frame instead of black
                          if (video.currentTime === 0) {
                            video.currentTime = 0.5;
                          }
                          // Always update duration when we get valid metadata (fixes loaded projects showing wrong duration)
                          if (video.duration && isFinite(video.duration) && video.duration > 0) {
                            const newDuration = Math.round(video.duration);
                            // Update if duration changed or was a placeholder (30s default)
                            if (newDuration !== selectedFlow.duration) {
                              setFlows(prev => prev.map(f => 
                                f.id === selectedFlow.id 
                                  ? { ...f, duration: newDuration, trimEnd: Math.min(f.trimEnd, newDuration), trimStart: Math.min(f.trimStart, newDuration) }
                                  : f
                              ));
                            }
                          }
                        }}
                        onPlay={() => setIsPlaying(true)} 
                        onPause={() => setIsPlaying(false)}
                        onCanPlay={(e) => {
                          // Force first frame display when video data is ready
                          const video = e.currentTarget;
                          if (video.currentTime === 0 && video.paused) {
                            video.currentTime = 0.001;
                          }
                        }}
                        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                      />
                    </div>
                    <div className="p-4 border-t border-white/5 bg-[#0a0a0a]">
                      {/* Playback controls */}
                      <div className="flex items-center gap-3 mb-4">
                        <button onClick={togglePlayPause} className="btn-black p-2.5 rounded-lg">
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <span className="text-xs text-white/50 font-mono w-24">{formatDuration(Math.floor(currentTime))} / {formatDuration(selectedFlow.duration)}</span>
                      </div>
                      
                      {/* Trim bar with live preview */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                          <span>Trim selection</span>
                          <span className="font-mono">{formatDuration(selectedFlow.trimStart)} - {formatDuration(selectedFlow.trimEnd)}</span>
                        </div>
                        <div 
                          ref={trimBarRef} 
                          className="trim-slider-container relative cursor-pointer"
                          onClick={(e) => {
                            // Click to seek - only if not clicking on handles
                            if ((e.target as HTMLElement).classList.contains('trim-handle')) return;
                            const rect = trimBarRef.current?.getBoundingClientRect();
                            if (!rect || !videoRef.current || !selectedFlow || !selectedFlow.duration || selectedFlow.duration <= 0) return;
                            const x = e.clientX - rect.left;
                            const percent = Math.max(0, Math.min(1, x / rect.width));
                            const time = percent * selectedFlow.duration;
                            if (isFinite(time) && time >= 0 && time <= selectedFlow.duration) {
                              videoRef.current.currentTime = time;
                              setCurrentTime(time);
                            }
                          }}
                        >
                          <div className="trim-waveform" />
                          {/* Selected area */}
                          {selectedFlow.duration > 0 && isFinite(selectedFlow.duration) && (
                            <>
                              <div className="trim-selected-area" style={{
                                left: `${Math.max(0, (selectedFlow.trimStart / selectedFlow.duration) * 100)}%`,
                                width: `${Math.max(0, ((selectedFlow.trimEnd - selectedFlow.trimStart) / selectedFlow.duration) * 100)}%`
                              }} />
                              {/* Start handle with tooltip */}
                              <div 
                                className="trim-handle" 
                                style={{ left: `calc(${Math.max(0, (selectedFlow.trimStart / selectedFlow.duration) * 100)}% - 7px)` }}
                                onMouseDown={(e) => { e.stopPropagation(); handleTrimDrag(e, "start"); }} 
                              >
                                {isDraggingTrim === "start" && trimPreviewTime !== null && (
                                  <div className="trim-time-tooltip">{formatDuration(trimPreviewTime)}</div>
                                )}
                              </div>
                              {/* End handle with tooltip */}
                              <div 
                                className="trim-handle" 
                                style={{ left: `calc(${Math.min(100, (selectedFlow.trimEnd / selectedFlow.duration) * 100)}% - 7px)` }}
                                onMouseDown={(e) => { e.stopPropagation(); handleTrimDrag(e, "end"); }} 
                              >
                                {isDraggingTrim === "end" && trimPreviewTime !== null && (
                                  <div className="trim-time-tooltip">{formatDuration(trimPreviewTime)}</div>
                                )}
                              </div>
                              {/* Playhead */}
                              <div className="trim-playhead" style={{ left: `${Math.min(100, (currentTime / selectedFlow.duration) * 100)}%` }} />
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => fileInputRef.current?.click()} className="btn-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"><Upload className="w-3.5 h-3.5" /> Upload New</button>
                          <button onClick={startRecording} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] border border-red-500/30 hover:border-red-500/50 text-white/60 hover:text-white/80 transition-all"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Record New</button>
                        </div>
                        <button onClick={applyTrim} className="btn-black flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs bg-[#FF6E3C]/20 text-[#FF6E3C] border border-[#FF6E3C]/30">
                          <Check className="w-3.5 h-3.5" /> Apply Trim
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-[#0a0a0a]">
                    <div className="text-center">
                      <EmptyState icon="logo" title="No video selected" subtitle="Record or upload a video first" showEarlyAccess={generations.length === 0} />
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button onClick={() => fileInputRef.current?.click()} className="btn-black flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"><Upload className="w-3.5 h-3.5" /> Upload</button>
                        <button onClick={startRecording} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs bg-white/[0.03] border border-red-500/30 hover:border-red-500/50 text-white/60 hover:text-white/80 transition-all"><div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Record</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Global Floating Edit - Properly Centered */}
            <AnimatePresence>
              {showFloatingEdit && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: 20 }} 
                  className="absolute bottom-6 left-0 right-0 flex justify-center z-50 px-6"
                >
                  <div className="w-full max-w-[500px] backdrop-blur-xl bg-[#0a0a0a]/95 border border-white/[0.04] rounded-2xl p-3 shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      {isEditing ? (
                        <Loader2 className="w-3.5 h-3.5 text-[#FF6E3C] animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#FF6E3C]" />
                      )}
                      <span className="text-xs text-white/50">
                        {isEditing ? (
                          <span className="text-[#FF6E3C]/80 animate-pulse">
                            {selectedElement ? `Editing ${selectedElement.substring(0, 20)}...` : editInput.includes('@') ? `Creating ${editInput.match(/@([a-zA-Z0-9-_]+)/)?.[1] || 'page'}...` : 'Applying changes...'}
                          </span>
                        ) : selectedArchNode ? (
                          <>Editing <span className="at-tag">@{selectedArchNode}</span></>
                        ) : "Describe your changes"}
                      </span>
                      {isEditing ? (
                        /* Cancel button during editing */
                        <button 
                          onClick={() => { 
                            cancelAIRequest(); 
                            setIsEditing(false); 
                            showToast("Request cancelled", "info"); 
                          }} 
                          className="ml-auto p-1.5 hover:bg-red-500/20 rounded-lg transition-colors group"
                          title="Cancel request"
                        >
                          <X className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                        </button>
                      ) : (
                        /* Close button when not editing */
                        <button onClick={() => { setShowFloatingEdit(false); setSelectedArchNode(null); setShowSuggestions(false); }} className="ml-auto p-1 hover:bg-white/5 rounded">
                          <X className="w-3 h-3 text-white/20" />
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      {/* Image previews */}
                      {editImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {editImages.map(img => (
                            <div key={img.id} className="relative group">
                              <img src={img.url} alt={img.name} className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                              <button 
                                onClick={() => {
                                  URL.revokeObjectURL(img.url);
                                  setEditImages(prev => prev.filter(i => i.id !== img.id));
                                }}
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-2.5 h-2.5 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {/* Pointer tool button */}
                        <button
                          onClick={() => {
                            if (isEditing) return;
                            const newState = !isPointAndEdit;
                            setIsPointAndEdit(newState);
                            // Clear selected element when turning off pointer
                            if (!newState) {
                              setSelectedElement(null);
                            }
                          }}
                          disabled={isEditing}
                          className={cn(
                            "relative flex items-center justify-center w-10 h-10 rounded-lg border transition-all",
                            isEditing 
                              ? "bg-white/[0.02] border-white/[0.02] text-white/20 cursor-not-allowed"
                              : isPointAndEdit 
                                ? "bg-[#FF6E3C]/20 border-[#FF6E3C] text-[#FF6E3C] shadow-[0_0_10px_rgba(255,110,60,0.3)]" 
                                : "bg-white/[0.03] border-white/[0.04] hover:border-white/10 text-white/40"
                          )}
                          title={isEditing ? "Disabled during editing" : isPointAndEdit ? "Click to deactivate pointer" : "Click element in preview to edit"}
                        >
                          <MousePointer className={cn("w-4 h-4", isPointAndEdit && !isEditing && "animate-pulse")} />
                          {isPointAndEdit && !isEditing && (
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF6E3C] rounded-full animate-pulse" />
                          )}
                        </button>
                        {/* Image upload button */}
                        <label 
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-lg border transition-colors",
                            isEditing 
                              ? "bg-white/[0.02] border-white/[0.02] text-white/20 cursor-not-allowed"
                              : "bg-white/[0.03] border-white/[0.04] hover:border-white/10 cursor-pointer"
                          )}
                          title={isEditing ? "Disabled during editing" : "Upload image"}
                        >
                          <input 
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            disabled={isEditing}
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (files) {
                                for (const file of Array.from(files)) {
                                  const id = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                                  const localUrl = URL.createObjectURL(file);
                                  
                                  // Add with loading state
                                  setEditImages(prev => [...prev, { id, url: localUrl, name: file.name, file, uploading: true }]);
                                  
                                  // Upload to Supabase
                                  try {
                                    const formData = new FormData();
                                    formData.append("file", file);
                                    formData.append("userId", user?.id || "anon");
                                    
                                    const response = await fetch("/api/upload-image", {
                                      method: "POST",
                                      body: formData,
                                    });
                                    
                                    const data = await response.json();
                                    
                                    if (data.success && data.url) {
                                      URL.revokeObjectURL(localUrl);
                                      setEditImages(prev => prev.map(img => 
                                        img.id === id ? { ...img, url: data.url, uploading: false } : img
                                      ));
                                      console.log("[EditImages] Uploaded to Supabase:", data.url);
                                    } else {
                                      setEditImages(prev => prev.map(img => 
                                        img.id === id ? { ...img, uploading: false } : img
                                      ));
                                    }
                                  } catch (error) {
                                    console.error("[EditImages] Upload error:", error);
                                    setEditImages(prev => prev.map(img => 
                                      img.id === id ? { ...img, uploading: false } : img
                                    ));
                                  }
                                }
                              }
                              e.target.value = "";
                            }}
                          />
                          <ImageIcon className={cn("w-4 h-4", isEditing ? "text-white/20" : "text-white/40")} />
                        </label>
                        <input 
                          ref={editInputRef}
                          type="text" 
                          value={editInput} 
                          onChange={(e) => setEditInput(e.target.value)} 
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !showSuggestions) handleEdit();
                            if (e.key === "Escape" && !isEditing) { setShowFloatingEdit(false); setSelectedArchNode(null); setEditImages([]); }
                          }}
                          placeholder={selectedArchNode ? `Describe changes for @${selectedArchNode}...` : "Type @ to select a component or add images..."} 
                          className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white/80 placeholder:text-white/20 bg-white/[0.03] border border-white/[0.04] focus:outline-none focus:border-white/10" 
                          disabled={isEditing} 
                          autoFocus 
                        />
                        <button onClick={handleEdit} disabled={(!editInput.trim() && editImages.length === 0) || isEditing} className="btn-black px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
                          {isEditing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      
                      {/* Suggestions dropdown */}
                      <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="suggestions-dropdown"
                          >
                            {suggestions.map(node => {
                              const Icon = getNodeIcon(node.type);
                              return (
                                <div
                                  key={node.id}
                                  onClick={() => handleSuggestionClick(node.id)}
                                  className="suggestion-item"
                                >
                                  <Icon className="w-3.5 h-3.5 icon" />
                                  <div>
                                    <span className="text-xs text-white/80">@{node.id}</span>
                                    <span className="text-[10px] text-white/40 ml-2">{node.name}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Node Detail Modal */}
            <AnimatePresence>
              {selectedNodeModal && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center"
                  onClick={() => setSelectedNodeModal(null)}
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {(() => { const Icon = getNodeIcon(selectedNodeModal.type); return <Icon className="w-6 h-6 text-[#FF6E3C]" />; })()}
                        <div>
                          <h3 className="text-lg font-semibold text-white">{selectedNodeModal.name}</h3>
                          <span className="text-xs text-white/40 uppercase">{selectedNodeModal.type}</span>
                        </div>
                      </div>
                      <button onClick={() => setSelectedNodeModal(null)} className="p-1 hover:bg-white/5 rounded">
                        <X className="w-5 h-5 text-white/40" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] text-white/30 uppercase">Description</span>
                        <p className="text-sm text-white/70 mt-1">{selectedNodeModal.description || "Component in the page structure"}</p>
                      </div>
                      
                      <div>
                        <span className="text-[10px] text-white/30 uppercase">User Flow</span>
                        <p className="text-sm text-white/50 mt-1">
                          {selectedNodeModal.type === "page" && "Root container for all page elements"}
                          {selectedNodeModal.type === "component" && "Reusable UI component that can contain other elements"}
                          {selectedNodeModal.type === "section" && "Major content section of the page"}
                          {selectedNodeModal.type === "interactive" && "User can click, tap, or interact with this element"}
                          {selectedNodeModal.type === "element" && "Visual or content element (text, image, etc.)"}
                        </p>
                      </div>
                      
                      {selectedNodeModal.connections && selectedNodeModal.connections.length > 0 && (
                        <div>
                          <span className="text-[10px] text-white/30 uppercase">Connected To</span>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {selectedNodeModal.connections.map(conn => (
                              <span key={conn} className="px-2 py-1 bg-white/5 rounded text-xs text-white/60">@{conn}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => { 
                          if (isEditing) return;
                          setEditInput(`@${selectedNodeModal.id} `); 
                          setSelectedArchNode(selectedNodeModal.id);
                          setShowFloatingEdit(true); 
                          setSelectedNodeModal(null); 
                        }}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 rounded-xl text-sm text-[#FF6E3C] hover:bg-[#FF6E3C]/15 transition-colors"
                      >
                        <Sparkles className="w-4 h-4" /> Edit with AI
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Mobile Auth Gate - Require login on mobile (EXCEPT in demo mode or loading demo!) */}
      {!user && !authLoading && !isDemoMode && !searchParams.get('demo') && (
        <>
          {/* Backdrop with blur - see content behind */}
          <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-sm" />
          
          {/* Auth Popup Modal - Static, no animations */}
          <div className="fixed inset-0 z-50 md:hidden flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mx-auto mb-5">
                <Lock className="w-8 h-8 text-[#FF6E3C]" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Sign in to continue</h2>
              <p className="text-white/50 text-sm mb-6">
                Create an account or sign in to start building. Get 100 free credits.
              </p>
              <button
                onClick={() => setShowAuthModal(true)}
                className="w-full px-6 py-3.5 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors mb-4"
              >
                Sign in / Sign up
              </button>
              <a href="/landing" className="text-sm text-white/40 hover:text-white/60 transition-colors">
                ← Back to home
              </a>
            </div>
          </div>
        </>
      )}
      
      {/* Mobile Tip Banner */}
      <AnimatePresence>
        {showMobileBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[80px] left-3 right-3 z-50 md:hidden"
          >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#FF6E3C]/10 flex items-center justify-center flex-shrink-0">
                  <Monitor className="w-5 h-5 text-[#FF6E3C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90">Quick preview mode</p>
                  <p className="text-xs text-white/50 mt-0.5">Full features available on desktop</p>
                </div>
                <button 
                  onClick={() => {
                    setShowMobileBanner(false);
                    localStorage.setItem("replay_mobile_banner_dismissed", "true");
                  }}
                  className="p-3 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white/40" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Bottom Navigation - 72px height, proper touch targets */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 bg-[#0a0a0a] safe-area-pb" style={{ height: '72px' }}>
        <div className="flex items-center justify-around h-full px-1">
          {/* Show Chat tab when we have generated code, otherwise show Input */}
          {generatedCode ? (
            <button 
              onClick={() => setMobilePanel("chat")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl transition-colors min-w-[64px] min-h-[56px]",
                mobilePanel === "chat" && !showHistoryMode ? "text-[#FF6E3C] bg-[#FF6E3C]/10" : "text-white/40"
              )}
            >
              <Sparkles className="w-6 h-6" />
              <span className="text-[10px] font-medium">Chat</span>
            </button>
          ) : (
            <button 
              onClick={() => setMobilePanel("input")}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl transition-colors min-w-[64px] min-h-[56px]",
                mobilePanel === "input" && !showHistoryMode ? "text-[#FF6E3C] bg-[#FF6E3C]/10" : "text-white/40"
              )}
            >
              <Film className="w-6 h-6" />
              <span className="text-[10px] font-medium">Input</span>
            </button>
          )}
          
          <button 
            onClick={() => setMobilePanel("preview")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl transition-colors min-w-[64px] min-h-[56px]",
              mobilePanel === "preview" && !showHistoryMode ? "text-[#FF6E3C] bg-[#FF6E3C]/10" : "text-white/40"
            )}
          >
            <Eye className="w-6 h-6" />
            <span className="text-[10px] font-medium">Preview</span>
          </button>
          
          <button 
            onClick={() => setMobilePanel("code")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl transition-colors min-w-[64px] min-h-[56px]",
              mobilePanel === "code" && !showHistoryMode ? "text-[#FF6E3C] bg-[#FF6E3C]/10" : "text-white/40"
            )}
          >
            <Code className="w-6 h-6" />
            <span className="text-[10px] font-medium">Code</span>
          </button>
          
          <button 
            onClick={() => setMobilePanel("flow")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl transition-colors min-w-[64px] min-h-[56px]",
              mobilePanel === "flow" && !showHistoryMode ? "text-[#FF6E3C] bg-[#FF6E3C]/10" : "text-white/40"
            )}
          >
            <GitBranch className="w-6 h-6" />
            <span className="text-[10px] font-medium">Flow</span>
          </button>
          
          <button 
            onClick={() => setMobilePanel("design")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl transition-colors min-w-[64px] min-h-[56px]",
              mobilePanel === "design" && !showHistoryMode ? "text-[#FF6E3C] bg-[#FF6E3C]/10" : "text-white/40"
            )}
          >
            <Palette className="w-6 h-6" />
            <span className="text-[10px] font-medium">Design</span>
          </button>
        </div>
      </div>
      
      {/* Mobile History - Full Screen Overlay - Static */}
      {showHistoryMode && (
          <div className="fixed inset-0 z-[100] md:hidden bg-[#0a0a0a] flex flex-col">
            {/* History Header - Same height as tool headers */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-black/95 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#FF6E3C]" />
                <span className="text-sm font-semibold text-white">Your Projects</span>
              </div>
              <button 
                onClick={() => setShowHistoryMode(false)}
                className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            
            {/* Search */}
            <div className="p-4 border-b border-white/5 flex-shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search projects..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 placeholder:text-white/30 focus:outline-none focus:border-white/10"
                />
              </div>
            </div>
            
            {/* Generation List - sorted newest first */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
              {isLoadingHistory ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin mx-auto" />
                  <p className="text-sm text-white/40 mt-4">Loading your projects...</p>
                </div>
              ) : generations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="empty-logo-container mx-auto" style={{ width: 60, height: 75 }}>
                    <svg className="empty-logo" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="currentColor" strokeWidth="11.6182" strokeLinejoin="round"/>
                      <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" fill="currentColor"/>
                    </svg>
                  </div>
                  <p className="text-sm text-white/40 mt-4">No generations yet</p>
                  <p className="text-xs text-white/25 mt-1">Upload a video and generate code to start</p>
                </div>
              ) : (
                generations
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .filter(gen => !historySearch || gen.title.toLowerCase().includes(historySearch.toLowerCase()))
                  .map((gen) => (
                  <div 
                    key={gen.id}
                    className={cn(
                      "relative p-3 pr-10 rounded-xl cursor-pointer transition-colors border",
                      activeGeneration?.id === gen.id 
                        ? "bg-[#FF6E3C]/10 border-[#FF6E3C]/30" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/5"
                    )}
                    onClick={async () => {
                      if (renamingId === gen.id) return;
                      
                      try {
                        // If code is missing (minimal fetch), load full data first
                        let genToLoad = gen;
                        const isDemo = DEMO_PROJECT_IDS.has(gen.id);
                        if (!gen.code && (user || isDemo)) {
                          console.log("[History Mobile] Loading full data for generation:", gen.id, isDemo ? "(demo)" : "");
                          const fullGen = await loadFullGeneration(gen.id);
                          if (fullGen) {
                            genToLoad = fullGen;
                          } else {
                            console.error("[History Mobile] Failed to load generation data");
                            showToast("Failed to load project", "error");
                            return;
                          }
                        }
                        
                        // MOBILE: Save project to localStorage for MobileLayout to pick up
                        const projectData = {
                          id: genToLoad.id,
                          title: genToLoad.title,
                          code: genToLoad.code,
                          videoUrl: genToLoad.videoUrl,
                          publishedSlug: genToLoad.publishedSlug,
                        };
                        console.log("[History Mobile] Saving project to localStorage:", {
                          id: projectData.id,
                          title: projectData.title,
                          hasCode: !!projectData.code,
                          videoUrl: projectData.videoUrl,
                        });
                        localStorage.setItem("replay_mobile_load_project", JSON.stringify(projectData));
                        
                        // Close history mode - MobileLayout will render and load the project
                        setShowHistoryMode(false);
                      } catch (e) {
                        console.error("[History Mobile] Error loading generation:", e);
                        showToast("Error loading generation", "error");
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white/80 truncate flex-1">{gen.title}</p>
                    </div>
                    <p className="text-[10px] text-white/30">
                      {new Date(gen.timestamp).toLocaleDateString()} • {new Date(gen.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {/* Delete action - right aligned */}
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); confirmDeleteGeneration(gen.id, gen.title); }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    {/* Latest change or style info */}
                    <div className="mt-1">
                      {gen.versions && gen.versions.length > 0 ? (
                        <p className="text-[10px] text-white/40 truncate">
                          <span className="text-emerald-400/60">Latest:</span> {gen.versions[gen.versions.length - 1]?.label || "Code update"}
                        </p>
                      ) : (
                        <p className="text-[10px] text-white/25 truncate">
                          <span className="text-white/15">Style:</span> {gen.styleDirective?.split('.')[0]?.split('⚠️')[0]?.trim() || "Auto-Detect"}
                        </p>
                      )}
                    </div>
                    
                    {/* Version History Toggle - Mobile */}
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedVersions(expandedVersions === gen.id ? null : gen.id);
                        }}
                        className="flex items-center gap-2 text-[10px] text-white/40 hover:text-white/60 transition-colors"
                      >
                        <Clock className="w-3 h-3" />
                        <span>{((gen.versions || []).filter(v => v.label !== "Initial generation").length) + 1} version{((gen.versions || []).filter(v => v.label !== "Initial generation").length) >= 1 ? 's' : ''}</span>
                        <ChevronDown className={cn(
                          "w-3 h-3 transition-transform",
                          expandedVersions === gen.id && "rotate-180"
                        )} />
                      </button>
                      
                      <AnimatePresence>
                        {expandedVersions === gen.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2 ml-1 space-y-1 overflow-hidden"
                          >
                            {/* Version timeline - newest at top, oldest at bottom */}
                            <div className="relative pl-3 border-l border-white/10">
                              {/* Versions in reverse order (newest/current at top) - filter out "Initial generation" */}
                              {(gen.versions || []).filter(v => v.label !== "Initial generation").slice().reverse().map((version, idx) => (
                                <div 
                                  key={version.id}
                                  className="relative py-1.5"
                                >
                                  <div className={cn(
                                    "absolute -left-[7px] top-2.5 w-2.5 h-2.5 rounded-full border-2",
                                    idx === 0 
                                      ? "bg-[#FF6E3C] border-[#FF6E3C]" 
                                      : "bg-[#0a0a0a] border-white/20"
                                  )} />
                                  
                                  <div className="flex items-center justify-between gap-2 pl-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] text-white/50 truncate">{version.label}</p>
                                      <p className="text-[8px] text-white/25">
                                        {new Date(version.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    </div>
                                    
                                    {idx === 0 ? (
                                      <span className="text-[8px] text-[#FF6E3C]/60 uppercase">Current</span>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          restoreVersion(gen.id, version);
                                        }}
                                        className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition-all"
                                        title="Restore"
                                      >
                                        <Play className="w-3 h-3 text-[#FF6E3C]" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                              
                              {/* Initial generation - at the bottom */}
                              <div className="relative py-1.5">
                                <div className={cn(
                                  "absolute -left-[7px] top-2.5 w-2.5 h-2.5 rounded-full border-2",
                                  !gen.versions?.length ? "bg-[#FF6E3C] border-[#FF6E3C]" : "bg-[#0a0a0a] border-white/20"
                                )} />
                                <div className="flex items-center justify-between gap-2 pl-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-white/50 truncate">Initial generation</p>
                                    <p className="text-[8px] text-white/25">
                                      {new Date(gen.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  {!gen.versions?.length ? (
                                    <span className="text-[8px] text-[#FF6E3C]/60 uppercase">Current</span>
                                  ) : (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        restoreVersion(gen.id, { 
                                          id: 'initial', 
                                          timestamp: gen.timestamp, 
                                          label: 'Initial generation',
                                          code: gen.code || '',
                                          flowNodes: gen.flowNodes,
                                          flowEdges: gen.flowEdges,
                                          styleInfo: gen.styleInfo
                                        });
                                      }}
                                      className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition-all"
                                      title="Restore to initial"
                                    >
                                      <Play className="w-3 h-3 text-[#FF6E3C]" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
      )}
      
      {/* Mobile Input Panel - Standard Input (MobileScanner users go to MobileLayout) */}
      {mobilePanel === "input" && !showHistoryMode && !showMobileMenu && (
          <div className="fixed inset-x-0 bottom-[72px] top-0 z-30 md:hidden bg-black flex flex-col">
            {flows.length === 0 && !isProcessing && !generatedCode ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Upload a video</h2>
                  <p className="text-white/50">Record your screen and upload it here</p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full max-w-xs py-4 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3"
                >
                  <Upload className="w-5 h-5" />
                  Upload Video
                </button>
              </div>
            ) : (
              <>
              {/* Standard Mobile Header - when video is loaded */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-black/95 backdrop-blur-xl">
                <a href="/" className="flex-shrink-0 p-1.5 -ml-1.5">
                  <LogoIcon className="w-6 h-6" color="#FF6E3C" />
                </a>
                <input
                  type="text"
                  value={generationTitle}
                  onChange={(e) => setGenerationTitle(e.target.value)}
                  className="flex-1 min-w-0 text-sm font-medium text-white/80 bg-transparent focus:outline-none truncate"
                  placeholder="Untitled"
                />
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => { setGenerationTitle("Untitled Project"); setFlows([]); setRefinements(""); setStyleDirective(getDefaultStyleName()); setStyleReferenceImage(null); setActiveGeneration(null); setGeneratedCode(null); setDisplayedCode(""); setEditableCode(""); setFlowNodes([]); setFlowEdges([]); setStyleInfo(null); setGenerationComplete(false); setPublishedUrl(null); setChatMessages([]); localStorage.removeItem("replay_generation_title"); }} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="New Project">
                    <Plus className="w-5 h-5 text-white/50" />
                  </button>
                  <button onClick={() => setShowHistoryMode(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Your Projects">
                    <History className="w-5 h-5 text-white/50" />
                  </button>
                  <button onClick={() => setShowProjectSettings(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Settings">
                    <Settings className="w-5 h-5 text-white/50" />
                  </button>
                  <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center justify-center">
                    {user ? (
                      <span className={cn(
                        "text-xs font-semibold uppercase",
                        isPaidPlan ? "text-[#FF6E3C]" : "text-white/50"
                      )}>
                        {isPaidPlan ? (membership?.plan === "agency" ? "Agency" : "Pro") : "Free"}
                      </span>
                    ) : (
                      <User className="w-5 h-5 text-white/50" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col flex-1 overflow-auto">
              {/* Videos Section - Consistent sizing */}
              <div className="p-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-4 h-4 text-white/50" />
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Videos</span>
                  </div>
                  <div className="flex gap-2">
                    {isRecording ? (
                      <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-red-500/20 text-red-400 min-h-[44px]">
                        <Square className="w-3 h-3 fill-current" />{formatDuration(recordingDuration)}
                      </button>
                    ) : (
                      <button onClick={startRecording} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-red-500/30 active:bg-red-500/10 text-white/70 transition-all min-h-[44px]">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" /> Record
                      </button>
                    )}
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm bg-white/5 active:bg-white/10 text-white/70 min-h-[44px]">
                      <Upload className="w-4 h-4" /> Upload
                    </button>
                  </div>
                </div>
                
                <div 
                  className="space-y-2"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {flows.length === 0 ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className={cn(
                        "relative rounded-xl border-2 border-dashed transition-all cursor-pointer min-h-[100px]",
                        isDragging 
                          ? "border-[#FF6E3C] bg-[#FF6E3C]/10" 
                          : "border-white/[0.08] bg-white/[0.02] active:bg-white/[0.05]"
                      )}
                    >
                      <div className="p-6 text-center">
                        <Video className={cn("w-6 h-6 mx-auto mb-2", isDragging ? "text-[#FF6E3C]" : "text-white/30")} />
                        <p className={cn("text-sm", isDragging ? "text-[#FF6E3C]" : "text-white/50")}>
                          {isDragging ? "Drop video here!" : "Drop your video here"}
                        </p>
                        <p className="text-xs text-white/30 mt-1">
                          Screen recording or UI walkthrough
                        </p>
                      </div>
                    </div>
                  ) : flows.map((flow) => (
                    <div 
                      key={flow.id} 
                      onClick={() => setSelectedFlowId(flow.id)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer min-h-[56px]",
                        selectedFlowId === flow.id ? "bg-[#FF6E3C]/10 border border-[#FF6E3C]/30" : "bg-white/5 active:bg-white/10"
                      )}
                    >
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                        {flow.thumbnail ? <img src={flow.thumbnail} alt="" className="w-full h-full object-cover" /> : <Film className="w-4 h-4 text-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white/80 truncate">{flow.name}</p>
                        <p className="text-xs text-white/40">{formatDuration(flow.trimEnd - flow.trimStart)} / {formatDuration(flow.duration)}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeFlow(flow.id); }} className="p-3 rounded-xl active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-white/40" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Context Section - Consistent sizing */}
              <div className="p-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-white/50" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Context</span>
                </div>
                <textarea
                  value={refinements}
                  onChange={(e) => {
                    const maxLen = isPaidPlan ? 20000 : 2000;
                    if (e.target.value.length <= maxLen) {
                      setRefinements(e.target.value);
                    } else {
                      showToast(`Context limit: ${isPaidPlan ? "20,000" : "2,000"} characters${!isPaidPlan ? ". Upgrade to PRO for 20k" : ""}`, "error");
                    }
                  }}
                  placeholder="Add data logic, constraints or details (optional)"
                  disabled={isProcessing}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white/70 placeholder:text-white/30 bg-white/[0.03] border border-white/[0.06] focus:outline-none focus:border-[#FF6E3C]/20 min-h-[88px] max-h-[200px] resize-y leading-relaxed"
                />
              </div>

              {/* Style Section - Consistent sizing */}
              <div className="p-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-white/50" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Style</span>
                </div>
                <StyleInjector 
                  value={styleDirective} 
                  onChange={setStyleDirective} 
                  disabled={isProcessing}
                  referenceImage={styleReferenceImage}
                  onReferenceImageChange={setStyleReferenceImage}
                />
              </div>

              {/* Generate Button */}
              <div className="p-4 border-b border-white/5 flex-shrink-0">
                {(() => {
                  // Determine if we're in update mode (existing project + changed context)
                  const hasProject = activeGeneration && generatedCode && generationComplete;
                  const hasContextChange = refinements.trim() !== (activeGeneration?.refinements || "").trim();
                  const hasStyleChange = styleDirective.trim() !== (activeGeneration?.styleDirective || "").trim();
                  const isUpdateMode = hasProject && (hasContextChange || hasStyleChange) && refinements.trim();
                  
                  return (
                    <button 
                      onClick={handleGenerate}
                      disabled={isProcessing || isEditing || flows.length === 0}
                      className={cn(
                        "w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all",
                        (isProcessing || isEditing) ? "bg-[#FF6E3C]/80" : "bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C]",
                        "text-white shadow-lg shadow-[#FF6E3C]/30 disabled:opacity-50"
                      )}
                    >
                      {isProcessing || isEditing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>{isEditing ? "Updating..." : "Reconstructing..."}</span></>
                      ) : (
                        <><LogoIcon className="w-5 h-5" color="white" /><span>Reconstruct</span><ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  );
                })()}
              </div>

              {/* Analysis Section */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2 flex-shrink-0">
                  <Activity className="w-4 h-4 text-white/40" />
                  <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Analysis</span>
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  {(isProcessing || isStreamingCode) && analysisPhase ? (
                    <div className="space-y-4">
                      {/* UX Signals */}
                      <div className="bg-white/[0.02] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">UX Signals</span>
                        </div>
                        <div className="space-y-1.5">
                          {analysisPhase.uxSignals && analysisPhase.uxSignals.length > 0 ? (
                            analysisPhase.uxSignals.map((signal, i) => (
                              <div key={signal.label} className="flex items-center justify-between">
                                <span className="text-[10px] text-white/30">{signal.label}</span>
                                <span className="text-[10px] text-white/50">{signal.value}</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] text-white/30">
                              <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50" />
                              <span>Detecting UX patterns...</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Structure & Components */}
                      {analysisPhase.structureItems && analysisPhase.structureItems.length > 0 && (
                        <div className="bg-white/[0.02] rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Structure</span>
                          </div>
                          <div className="space-y-1">
                            {analysisPhase.structureItems.map((item, i) => (
                              <div key={item.name} className="flex items-center gap-2">
                                <div className={cn("w-1.5 h-1.5 rounded-full", item.status === "done" ? "bg-green-500/60" : "bg-[#FF6E3C]/40")} />
                                <span className="text-[10px] text-white/50">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : !generatedCode ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <Clock className="w-8 h-8 text-white/10 mb-3" />
                      <p className="text-xs font-medium text-white/40 uppercase tracking-wider">Waiting for generation</p>
                      <p className="text-[10px] text-white/25 mt-1">Live analysis logs will display here once generation starts.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500/60" />
                        <span className="text-xs text-white/60">Generation complete</span>
                      </div>
                      {styleInfo && (
                        <p className="text-[10px] text-white/40">{styleInfo.colors.length} colors, {styleInfo.fonts.length} fonts detected</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
              </>
            )}
          </div>
      )}
      
      {/* Mobile Preview Panel - Static */}
      {mobilePanel === "preview" && !showHistoryMode && !showMobileMenu && (
          <div className="fixed inset-x-0 bottom-[72px] top-0 z-30 md:hidden bg-[#0a0a0a] flex flex-col">
            {/* Unified Mobile Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-black/95 backdrop-blur-xl">
              <a href="/" className="flex-shrink-0 p-1.5 -ml-1.5">
                <LogoIcon className="w-6 h-6" color="#FF6E3C" />
              </a>
              <input
                type="text"
                value={generationTitle}
                onChange={(e) => setGenerationTitle(e.target.value)}
                onBlur={() => {
                  if (activeGeneration) {
                    const updated = { ...activeGeneration, title: generationTitle };
                    setActiveGeneration(updated);
                    setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updated : g));
                  }
                }}
                className="flex-1 min-w-0 text-sm font-medium text-white/80 bg-transparent focus:outline-none truncate"
                placeholder="Untitled"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { setChatMessages([]); setActiveGeneration(null); setGeneratedCode(null); setMobilePanel("input"); setGenerationTitle("Untitled Project"); setDisplayedCode(""); setEditableCode(""); setFlowNodes([]); setFlowEdges([]); setStyleInfo(null); setGenerationComplete(false); setPublishedUrl(null); setStyleDirective(getDefaultStyleName()); setStyleReferenceImage(null); localStorage.removeItem("replay_generation_title"); }} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="New">
                  <Plus className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowHistoryMode(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Your Projects">
                  <History className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowProjectSettings(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Settings">
                  <Settings className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center justify-center">
                  {user ? (
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      isPaidPlan ? "text-[#FF6E3C]" : "text-white/50"
                    )}>
                      {isPaidPlan ? (membership?.plan === "agency" ? "Agency" : "Pro") : "Free"}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white/50" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {(isProcessing || isStreamingCode) ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <LoadingState />
                </div>
              ) : previewUrl ? (
                <div className="w-full h-full overflow-hidden bg-[#0a0a0a]" style={{ overscrollBehavior: 'none' }}>
                  <iframe 
                    key={previewUrl}
                    src={previewUrl} 
                    className="w-full h-full border-0 bg-[#0a0a0a]" 
                    style={{ 
                      overflow: 'hidden',
                      touchAction: 'pan-y',
                      overscrollBehavior: 'none',
                      backgroundColor: '#0a0a0a'
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                    <Eye className="w-8 h-8 text-[#FF6E3C]/50" />
                  </div>
                  <p className="text-sm text-white/50 font-medium">No preview yet</p>
                  <p className="text-xs text-white/30 mt-1">Generate to see preview</p>
                </div>
              )}
            </div>
          </div>
      )}
      
      {/* Mobile Code Panel - Static */}
      {mobilePanel === "code" && !showHistoryMode && !showMobileMenu && (
          <div className="fixed inset-x-0 bottom-[72px] top-0 z-30 md:hidden bg-[#0a0a0a] flex flex-col">
            {/* Unified Mobile Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-black/95 backdrop-blur-xl">
              <a href="/" className="flex-shrink-0 p-1.5 -ml-1.5">
                <LogoIcon className="w-6 h-6" color="#FF6E3C" />
              </a>
              <input
                type="text"
                value={generationTitle}
                onChange={(e) => setGenerationTitle(e.target.value)}
                onBlur={() => {
                  if (activeGeneration) {
                    const updated = { ...activeGeneration, title: generationTitle };
                    setActiveGeneration(updated);
                    setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updated : g));
                  }
                }}
                className="flex-1 min-w-0 text-sm font-medium text-white/80 bg-transparent focus:outline-none truncate"
                placeholder="Untitled"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { setChatMessages([]); setActiveGeneration(null); setGeneratedCode(null); setMobilePanel("input"); setGenerationTitle("Untitled Project"); setDisplayedCode(""); setEditableCode(""); setFlowNodes([]); setFlowEdges([]); setStyleInfo(null); setGenerationComplete(false); setPublishedUrl(null); setStyleDirective(getDefaultStyleName()); setStyleReferenceImage(null); localStorage.removeItem("replay_generation_title"); }} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="New">
                  <Plus className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowHistoryMode(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Your Projects">
                  <History className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowProjectSettings(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Settings">
                  <Settings className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center justify-center">
                  {user ? (
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      isPaidPlan ? "text-[#FF6E3C]" : "text-white/50"
                    )}>
                      {isPaidPlan ? (membership?.plan === "agency" ? "Agency" : "Pro") : "Free"}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white/50" />
                  )}
                </button>
              </div>
            </div>
            
            {(isProcessing || isStreamingCode) ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <LoadingState />
              </div>
            ) : generatedCode ? (
              <>
                {/* Secondary Header with toggle, copy, and download */}
                <div className="flex items-center justify-between p-2 border-b border-white/10 flex-shrink-0 bg-black/50">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCodeMode("single-file")}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded-md transition-colors",
                        codeMode === "single-file" ? "bg-white/10 text-white" : "text-white/40"
                      )}
                    >
                      Single-file
                    </button>
                    <button
                      onClick={() => generationComplete && setCodeMode("componentized")}
                      disabled={!generationComplete}
                      className={cn(
                        "text-[10px] px-2 py-1 rounded-md transition-colors",
                        codeMode === "componentized" ? "bg-white/10 text-white" : "text-white/40",
                        !generationComplete && "opacity-50"
                      )}
                    >
                      Componentized
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        if (!isPaidPlan) {
                          setUpgradeFeature("code");
                          setShowUpgradeModal(true);
                        } else {
                          navigator.clipboard.writeText(getActiveFileContent());
                          showToast("Copied!", "success");
                        }
                      }} 
                      className={cn(
                        "text-[10px] text-white/40 hover:text-white/60 flex items-center gap-1",
                        !isPaidPlan && "opacity-50"
                      )}
                    >
                      {!isPaidPlan && <Lock className="w-2.5 h-2.5" />}
                      <Copy className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => {
                        if (!isPaidPlan) {
                          setUpgradeFeature("download");
                          setShowUpgradeModal(true);
                        } else {
                          handleDownload();
                        }
                      }}
                      className={cn(
                        "text-[10px] text-white/40 hover:text-white/60 flex items-center gap-1",
                        !isPaidPlan && "opacity-50"
                      )}
                    >
                      {!isPaidPlan && <Lock className="w-2.5 h-2.5" />}
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* File tree (compact for mobile) */}
                {codeMode === "componentized" && generatedFiles.length > 0 && (
                  <div className="flex overflow-x-auto gap-1 p-2 border-b border-white/5 flex-shrink-0">
                    {generatedFiles.filter(f => !f.isStub).slice(0, 8).map(file => (
                      <button
                        key={file.path}
                        onClick={() => setActiveFilePath(file.path)}
                        className={cn(
                          "text-[9px] px-2 py-1 rounded whitespace-nowrap flex-shrink-0",
                          activeFilePath === file.path 
                            ? "bg-[#FF6E3C]/20 text-[#FF6E3C]" 
                            : "bg-white/5 text-white/50"
                        )}
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Code display with syntax highlighting - Visible for all, export locked */}
                <div className="flex-1 overflow-auto bg-[#0a0a0a] relative">
                  {generatingFilePath && generatingFilePath === activeFilePath ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-6 h-6 text-[#FF6E3C] animate-spin" />
                      <div className="text-center">
                        <p className="text-xs text-white/60">Generating page...</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{activeFilePath.split('/').pop()}</p>
                      </div>
                    </div>
                  ) : (
                    <Highlight 
                      theme={themes.nightOwl} 
                      code={getActiveFileContent()} 
                      language={activeFilePath.endsWith('.tsx') || activeFilePath.endsWith('.ts') ? 'tsx' : 'html'}
                    >
                      {({ style, tokens, getLineProps, getTokenProps }) => (
                        <pre 
                          className="p-3 text-[10px] leading-relaxed min-h-full" 
                          style={{ 
                            ...style, 
                            background: "#0a0a0a", 
                            fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                          }}
                        >
                          {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line })}>
                              <span className="inline-block w-6 pr-2 text-right text-white/15 select-none text-[9px]">{i + 1}</span>
                              {line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}
                            </div>
                          ))}
                        </pre>
                      )}
                    </Highlight>
                  )}
                </div>
                
                {/* Edit with AI button */}
                {!showFloatingEdit && !isStreamingCode && (
                  <div className="flex-shrink-0 p-3 border-t border-white/5">
                    <button 
                      onClick={() => { setShowFloatingEdit(true); setIsDirectEditMode(false); }} 
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FF6E3C]" /> Edit with AI
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                  <Code className="w-8 h-8 text-[#FF6E3C]/50" />
                </div>
                <p className="text-sm text-white/50 font-medium">No code yet</p>
                <p className="text-xs text-white/30 mt-1">Generate to see code</p>
              </div>
            )}
          </div>
      )}
      
      {/* Mobile Flow Panel - Static */}
      {mobilePanel === "flow" && !showHistoryMode && !showMobileMenu && (
          <div className="fixed inset-x-0 bottom-[72px] top-0 z-30 md:hidden bg-[#0a0a0a] flex flex-col">
            {/* Unified Mobile Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-black/95 backdrop-blur-xl">
              <a href="/" className="flex-shrink-0 p-1.5 -ml-1.5">
                <LogoIcon className="w-6 h-6" color="#FF6E3C" />
              </a>
              <input
                type="text"
                value={generationTitle}
                onChange={(e) => setGenerationTitle(e.target.value)}
                onBlur={() => {
                  if (activeGeneration) {
                    const updated = { ...activeGeneration, title: generationTitle };
                    setActiveGeneration(updated);
                    setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updated : g));
                  }
                }}
                className="flex-1 min-w-0 text-sm font-medium text-white/80 bg-transparent focus:outline-none truncate"
                placeholder="Untitled"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { setChatMessages([]); setActiveGeneration(null); setGeneratedCode(null); setMobilePanel("input"); setGenerationTitle("Untitled Project"); setDisplayedCode(""); setEditableCode(""); setFlowNodes([]); setFlowEdges([]); setStyleInfo(null); setGenerationComplete(false); setPublishedUrl(null); setStyleDirective(getDefaultStyleName()); setStyleReferenceImage(null); localStorage.removeItem("replay_generation_title"); }} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="New">
                  <Plus className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowHistoryMode(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Your Projects">
                  <History className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowProjectSettings(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Settings">
                  <Settings className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center justify-center">
                  {user ? (
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      isPaidPlan ? "text-[#FF6E3C]" : "text-white/50"
                    )}>
                      {isPaidPlan ? (membership?.plan === "agency" ? "Agency" : "Pro") : "Free"}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white/50" />
                  )}
                </button>
              </div>
            </div>
            
            {flowNodes.length > 0 ? (
              <>
                {/* Secondary Header with toggles */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 flex-shrink-0 bg-black/50">
                  <div>
                    <span className="text-xs text-white/50 flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-[#FF6E3C]" />
                      Product Flow
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setShowPossiblePaths(!showPossiblePaths)}
                      className={cn(
                        "text-[9px] px-2 py-1 rounded-lg flex items-center gap-1",
                        showPossiblePaths ? "bg-[#FF6E3C]/20 text-[#FF6E3C]" : "bg-white/5 text-white/40"
                      )}
                    >
                      <GitBranch className="w-2.5 h-2.5" />
                      Possible
                    </button>
                    <button 
                      onClick={() => setShowStructureInFlow(!showStructureInFlow)}
                      className={cn(
                        "text-[9px] px-2 py-1 rounded-lg flex items-center gap-1",
                        showStructureInFlow ? "bg-[#FF6E3C]/20 text-[#FF6E3C]" : "bg-white/5 text-white/40"
                      )}
                    >
                      <Layers className="w-2.5 h-2.5" />
                      Structure
                    </button>
                  </div>
                </div>
                
                {/* Flow nodes list */}
                <div className="flex-1 overflow-auto p-4 space-y-3">
                  {flowNodes
                    .filter(node => showPossiblePaths || node.status === "observed" || node.status === "added")
                    .map(node => {
                    const isObserved = node.status === "observed";
                    const isDetected = node.status === "detected";
                    const isPossible = node.status === "possible";
                    return (
                      <div 
                        key={node.id} 
                        className={cn(
                          "p-3 rounded-xl border",
                          isObserved
                            ? "border-emerald-500/30 bg-emerald-500/5"
                            : isDetected 
                            ? "border-amber-500/30 bg-amber-500/5" 
                            : isPossible 
                            ? "border-dashed border-white/20 bg-white/5 opacity-60" 
                            : "border-[#FF6E3C]/30 bg-[#FF6E3C]/5"
                        )}
                        onClick={() => {
                          if (isEditing) return;
                          if (isDetected || isPossible) {
                            // Full prompt like on desktop
                            setEditInput(`@${node.name} Create this page with the same style and navigation as the main page`);
                            setShowFloatingEdit(true);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {isObserved && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                            {isDetected && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                            {isPossible && <div className="w-1.5 h-1.5 rounded-full bg-white/40" />}
                            <p className={cn(
                              "text-sm font-medium",
                              isPossible ? "text-white/50 italic" : isDetected ? "text-white/70" : "text-white/80"
                            )}>{node.name}</p>
                          </div>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded uppercase",
                            isPossible ? "bg-white/5 text-white/30" : isDetected ? "bg-amber-500/10 text-amber-400/60" : "bg-emerald-500/10 text-emerald-400/60"
                          )}>
                            {isPossible ? "possible" : isDetected ? "detected" : "observed"}
                          </span>
                        </div>
                        {node.description && (
                          <p className={cn("text-xs", isPossible ? "text-white/25" : isDetected ? "text-white/30" : "text-white/40")}>
                            {node.description}
                          </p>
                        )}
                        
                        {/* Structure components (when toggle is ON) */}
                        {showStructureInFlow && node.components && node.components.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <span className="text-[9px] text-white/30 uppercase">Components:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {node.components.map((comp, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/50">{comp}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Transitions section inside scrollable area */}
                  {flowEdges.filter(e => showPossiblePaths || e.type !== "possible").length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <span className="text-xs text-white/50 block mb-2">Transitions</span>
                      {flowEdges
                        .filter(e => showPossiblePaths || e.type !== "possible")
                        .slice(0, 10)
                        .map(edge => {
                          const fromNode = flowNodes.find(n => n.id === edge.from);
                          const toNode = flowNodes.find(n => n.id === edge.to);
                          if (!fromNode || !toNode) return null;
                          return (
                            <div key={edge.id} className="text-[10px] text-white/40 py-1 flex items-center gap-1">
                              <span className="text-white/60">{fromNode.name}</span>
                              <span className="text-white/20">→</span>
                              <span className="text-[#FF6E3C]/70">{edge.label}</span>
                              <span className="text-white/20">→</span>
                              <span className={cn(
                                toNode.status === "possible" ? "text-white/30 italic" : 
                                toNode.status === "detected" ? "text-amber-400/50" : "text-white/60"
                              )}>
                                {toNode.name}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                
                {/* Edit with AI button */}
                {!showFloatingEdit && !isProcessing && (
                  <div className="flex-shrink-0 p-3 border-t border-white/5">
                    <button 
                      onClick={() => { setShowFloatingEdit(true); setIsDirectEditMode(false); }} 
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FF6E3C]" /> Edit with AI
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                  <GitBranch className="w-8 h-8 text-[#FF6E3C]/50" />
                </div>
                <p className="text-sm text-white/50 font-medium">No flow yet</p>
                <p className="text-xs text-white/30 mt-1">Generate to see product flow</p>
              </div>
            )}
          </div>
      )}
      
      {/* Mobile Design Panel - Static */}
      {mobilePanel === "design" && !showHistoryMode && !showMobileMenu && (
          <div className="fixed inset-x-0 bottom-[72px] top-0 z-30 md:hidden bg-[#0a0a0a] flex flex-col">
            {/* Unified Mobile Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-black/95 backdrop-blur-xl">
              <a href="/" className="flex-shrink-0 p-1.5 -ml-1.5">
                <LogoIcon className="w-6 h-6" color="#FF6E3C" />
              </a>
              <input
                type="text"
                value={generationTitle}
                onChange={(e) => setGenerationTitle(e.target.value)}
                onBlur={() => {
                  if (activeGeneration) {
                    const updated = { ...activeGeneration, title: generationTitle };
                    setActiveGeneration(updated);
                    setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updated : g));
                  }
                }}
                className="flex-1 min-w-0 text-sm font-medium text-white/80 bg-transparent focus:outline-none truncate"
                placeholder="Untitled"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { setChatMessages([]); setActiveGeneration(null); setGeneratedCode(null); setMobilePanel("input"); setGenerationTitle("Untitled Project"); setDisplayedCode(""); setEditableCode(""); setFlowNodes([]); setFlowEdges([]); setStyleInfo(null); setGenerationComplete(false); setPublishedUrl(null); setStyleDirective(getDefaultStyleName()); setStyleReferenceImage(null); localStorage.removeItem("replay_generation_title"); }} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="New">
                  <Plus className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowHistoryMode(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Your Projects">
                  <History className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowProjectSettings(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Settings">
                  <Settings className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center justify-center">
                  {user ? (
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      isPaidPlan ? "text-[#FF6E3C]" : "text-white/50"
                    )}>
                      {isPaidPlan ? (membership?.plan === "agency" ? "Agency" : "Pro") : "Free"}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white/50" />
                  )}
                </button>
              </div>
            </div>
            
            {styleInfo ? (
              <div className="flex-1 overflow-auto p-4 space-y-6">
                {/* Colors */}
                <div>
                  <span className="text-xs text-white/50 flex items-center gap-1.5 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#FF6E3C]" />
                    Colors
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {styleInfo.colors.slice(0, 8).map((color, i) => (
                      <div key={i} className="space-y-1">
                        <div 
                          className="h-12 rounded-lg border border-white/10" 
                          style={{ backgroundColor: color.value }} 
                        />
                        <p className="text-[9px] text-white/40 text-center truncate">{color.name || color.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Typography */}
                {styleInfo.fonts.length > 0 && (
                  <div>
                    <span className="text-xs text-white/50 flex items-center gap-1.5 mb-3">
                      <Type className="w-3 h-3 text-[#FF6E3C]" />
                      Typography
                    </span>
                    <div className="space-y-2">
                      {styleInfo.fonts.map((font, i) => (
                        <div key={i} className="p-2 bg-white/5 rounded-lg">
                          <p className="text-sm text-white/70" style={{ fontFamily: font.family }}>
                            {font.family || font.name}
                          </p>
                          <p className="text-[10px] text-white/30">{font.usage || font.weight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Spacing & Radius */}
                <div className="grid grid-cols-2 gap-4">
                  {styleInfo.spacing && (
                    <div>
                      <span className="text-xs text-white/50 block mb-2">Spacing</span>
                      <p className="text-sm text-white/70">{styleInfo.spacing}</p>
                    </div>
                  )}
                  {styleInfo.borderRadius && (
                    <div>
                      <span className="text-xs text-white/50 block mb-2">Radius</span>
                      <p className="text-sm text-white/70">{styleInfo.borderRadius}</p>
                    </div>
                  )}
                </div>
                
                {/* Shadows */}
                {styleInfo.shadows && (
                  <div>
                    <span className="text-xs text-white/50 block mb-2">Shadows</span>
                    <p className="text-sm text-white/70">{styleInfo.shadows}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                  <Palette className="w-8 h-8 text-[#FF6E3C]/50" />
                </div>
                <p className="text-sm text-white/50 font-medium">No style analysis yet</p>
                <p className="text-xs text-white/30 mt-1">Generate to see design system</p>
              </div>
            )}
          </div>
      )}
      
      {/* Mobile Chat Panel - Static */}
      {mobilePanel === "chat" && generatedCode && !showHistoryMode && !showMobileMenu && (
          <div className="fixed inset-x-0 bottom-[72px] top-0 z-30 md:hidden bg-[#0a0a0a] flex flex-col">
            {/* Combined Header - Logo, Project Name, Actions, Avatar in one row */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/5 flex-shrink-0 bg-black/95 backdrop-blur-xl">
              <a href="/" className="flex-shrink-0 p-1.5 -ml-1.5">
                <LogoIcon className="w-6 h-6" color="#FF6E3C" />
              </a>
              <input
                type="text"
                value={generationTitle}
                onChange={(e) => setGenerationTitle(e.target.value)}
                onBlur={() => {
                  if (activeGeneration) {
                    const updated = { ...activeGeneration, title: generationTitle };
                    setActiveGeneration(updated);
                    setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updated : g));
                  }
                }}
                className="flex-1 min-w-0 text-sm font-medium text-white/80 bg-transparent focus:outline-none truncate"
                placeholder="Untitled"
              />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => { setChatMessages([]); setActiveGeneration(null); setGeneratedCode(null); setMobilePanel("input"); setGenerationTitle("Untitled Project"); setDisplayedCode(""); setEditableCode(""); setFlowNodes([]); setFlowEdges([]); setStyleInfo(null); setGenerationComplete(false); setPublishedUrl(null); setStyleDirective(getDefaultStyleName()); setStyleReferenceImage(null); localStorage.removeItem("replay_generation_title"); }} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="New">
                  <Plus className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowHistoryMode(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Your Projects">
                  <History className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowProjectSettings(true)} className="p-2.5 rounded-xl hover:bg-white/5 active:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center" title="Settings">
                  <Settings className="w-5 h-5 text-white/50" />
                </button>
                <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="px-3 py-2 rounded-xl hover:bg-white/5 active:bg-white/10 min-h-[44px] flex items-center justify-center">
                  {user ? (
                    <span className={cn(
                      "text-xs font-semibold uppercase",
                      isPaidPlan ? "text-[#FF6E3C]" : "text-white/50"
                    )}>
                      {isPaidPlan ? (membership?.plan === "agency" ? "Agency" : "Pro") : "Free"}
                    </span>
                  ) : (
                    <User className="w-5 h-5 text-white/50" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Tabs: Replay AI | Configuration */}
            <div className="flex-shrink-0 px-3 py-1.5 border-b border-white/[0.03]">
              <div className="flex gap-1">
                <button
                  onClick={() => setSidebarTab("chat")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    sidebarTab === "chat" 
                      ? "bg-white/[0.08] text-white" 
                      : "text-white/40"
                  )}
                >
                  <Send className="w-3.5 h-3.5" />
                  Replay AI
                </button>
                <button
                  onClick={() => setSidebarTab("style")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    sidebarTab === "style" 
                      ? "bg-white/[0.08] text-white" 
                      : "text-white/40"
                  )}
                >
                  <Boxes className="w-3.5 h-3.5" />
                  Config
                </button>
              </div>
            </div>

            {sidebarTab === "chat" ? (
              <>
                {/* Chat Messages - Same style as desktop */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {chatMessages.map((msg) => (
                    <motion.div 
                      key={msg.id} 
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1"
                    >
                      {msg.role === "assistant" ? (
                        /* AI Message */
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <LogoIcon className="w-4 h-4" color="#FF6E3C" />
                            <span className="text-xs font-medium text-white/40">Replay</span>
                          </div>
                          <div className="text-sm leading-relaxed text-white/70 space-y-2">
                            {msg.content.split('\n').map((line, i) => {
                              if (line.includes('Complete')) {
                                return <p key={i} className="text-emerald-400/90 font-medium flex items-center gap-1.5"><Check className="w-4 h-4" />{line.replace(/\*\*/g, '')}</p>;
                              }
                              if (line.startsWith('**') && line.endsWith('**')) {
                                return <p key={i} className="font-semibold text-white/90">{line.replace(/\*\*/g, '')}</p>;
                              }
                              if (line.startsWith('• ') || line.startsWith('- ')) {
                                return <p key={i} className="text-white/60 pl-3 border-l-2 border-white/10">{line.substring(2)}</p>;
                              }
                              if (line.trim()) {
                                return <p key={i}>{line.replace(/\*\*([^*]+)\*\*/g, (_, t) => t)}</p>;
                              }
                              return null;
                            })}
                          </div>
                          {/* Quick Actions */}
                          {msg.quickActions && msg.quickActions.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {msg.quickActions.map((action, i) => (
                                <button
                                  key={i}
                                  onClick={() => setChatInput(action)}
                                  className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/80 border border-white/[0.06] transition-all"
                                >
                                  {action}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* User Message */
                        <div className="flex justify-end">
                          <div className="max-w-[85%]">
                            <div className="px-4 py-2.5 rounded-2xl bg-white/[0.06] text-sm text-white/80">
                              {msg.content}
                            </div>
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex justify-end gap-1.5 mt-1.5">
                                {msg.attachments.map((att, i) => (
                                  <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-violet-500/10 text-violet-300/80 text-xs">
                                    {att.type === "image" && <ImageIcon className="w-3 h-3" />}
                                    {att.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {/* Thinking Indicator with Code Streaming - Mobile */}
                  {isEditing && (
                    <motion.div 
                      initial={{ opacity: 0, y: 8 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="rounded-xl overflow-hidden border border-white/[0.08]"
                      style={{ background: '#0a0a0a' }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-[#FF6E3C] animate-spin" />
                          <span className="text-xs text-white/50">{streamingStatus || "Pracuję..."}</span>
                          {streamingLines > 0 && (
                            <span className="text-[10px] text-[#FF6E3C]/60 font-mono">{streamingLines} linii</span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            cancelAIRequest();
                            setIsEditing(false);
                            setStreamingStatus(null);
                            setStreamingCode(null);
                            setStreamingLines(0);
                            showToast("Anulowano", "info");
                          }}
                          className="p-1 rounded hover:bg-white/10 text-white/30"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {/* Code Streaming Display - LIVE CODE */}
                      <div className="p-3 h-[100px] overflow-hidden relative font-mono text-[9px] leading-relaxed">
                        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10" />
                        <pre className="m-0 pt-1 whitespace-pre-wrap break-words">
                          {streamingCode ? (
                            streamingCode.split('\n').slice(-6).map((line, i) => (
                              <div key={i} className="min-h-[13px]">
                                {/* Syntax highlighting */}
                                {line.split(/(<[^>]+>|"[^"]*"|'[^']*'|{|}|\(|\)|\b(?:const|let|var|function|return|if|else|for|while|class)\b)/g).map((part, j) => {
                                  if (!part) return null;
                                  if (part.startsWith('<') && part.endsWith('>')) return <span key={j} className="text-[#7fdbca]">{part}</span>;
                                  if (part.startsWith('"') || part.startsWith("'")) return <span key={j} className="text-[#ecc48d]">{part}</span>;
                                  if (/^(const|let|var|function|return|if|else|for|while|class)$/.test(part)) return <span key={j} className="text-[#c792ea]">{part}</span>;
                                  if (part === '{' || part === '}' || part === '(' || part === ')') return <span key={j} className="text-[#ffd700]">{part}</span>;
                                  return <span key={j} className="text-[#d6deeb]">{part}</span>;
                                })}
                              </div>
                            ))
                          ) : (
                            <span className="text-white/30">Inicjalizuję...</span>
                          )}
                          <span className="inline-block w-2 h-3.5 bg-[#FF6E3C] ml-0.5 animate-pulse" />
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            ) : (
              /* Configuration Tab - Same as PC sidebar */
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Videos Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider flex items-center gap-1">
                      <Video className="w-2.5 h-2.5" /> Videos
                      {flows.length > 0 && <span className="text-[8px] bg-white/10 px-1 py-0.5 rounded">{flows.length}</span>}
                    </label>
                  </div>
                  <div className="flex gap-1.5 mb-2">
                    <button 
                      onClick={startRecording}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] text-[10px] text-white/60 hover:text-white/80 transition-colors"
                    >
                      <Monitor className="w-3 h-3" /> Record
                    </button>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] text-[10px] text-white/60 hover:text-white/80 transition-colors"
                    >
                      <Upload className="w-3 h-3" /> Upload
                    </button>
                  </div>
                  {/* Video list */}
                  <div className="space-y-1.5 max-h-[120px] overflow-auto">
                    {flows.map((flow) => (
                      <button key={flow.id} onClick={() => setSelectedFlowId(flow.id)} className={cn("w-full flex items-center gap-2 p-2 rounded-lg cursor-pointer text-left", selectedFlowId === flow.id ? "bg-[#FF6E3C]/10 border border-[#FF6E3C]/20" : "bg-white/[0.03] hover:bg-white/[0.05]")} aria-label={`Select flow ${flow.name}`}>
                        <div className="w-10 h-6 rounded overflow-hidden bg-white/5 flex-shrink-0">
                          {flow.thumbnail ? <img src={flow.thumbnail} alt="" className="w-full h-full object-cover" /> : <Film className="w-3 h-3 text-white/20 mx-auto mt-1.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white/70 truncate">{flow.name}</p>
                          <p className="text-[10px] text-white/30">{formatDuration(flow.duration)}</p>
                        </div>
                        <span onClick={(e) => { e.stopPropagation(); setFlows(prev => prev.filter(f => f.id !== flow.id)); }} className="p-1 text-white/20 hover:text-red-400" role="button" tabIndex={0} aria-label="Remove flow" onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setFlows(prev => prev.filter(f => f.id !== flow.id)); }}}>
                          <Trash2 className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                    {flows.length === 0 && (
                      <div className="text-center py-3 text-[10px] text-white/30">
                        Record or upload a video to get started
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Context */}
                <div>
                  <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Context</label>
                  <textarea
                    value={refinements}
                    onChange={(e) => setRefinements(e.target.value)}
                    placeholder="Add data logic, constraints..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/15 resize-y min-h-[60px] max-h-[200px] transition-colors"
                  />
                </div>
                
                {/* Visual Style */}
                <div>
                  <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Visual Style</label>
                  <StyleInjector 
                    value={styleDirective} 
                    onChange={setStyleDirective} 
                    disabled={isProcessing}
                    referenceImage={styleReferenceImage}
                    onReferenceImageChange={setStyleReferenceImage}
                  />
                </div>
                
                {/* Reconstruct Button */}
                <div className="pt-1">
                  <button 
                    onClick={handleGenerate}
                    disabled={isProcessing || flows.length === 0}
                    className="w-full py-2.5 rounded-lg bg-[#FF6E3C]/10 hover:bg-[#FF6E3C]/20 border border-[#FF6E3C]/20 text-xs font-medium text-[#FF6E3C] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <LogoIcon className="w-3.5 h-3.5" color="#FF6E3C" />
                    Reconstruct
                  </button>
                </div>
                
                {/* Current Colors */}
                {styleInfo?.colors && styleInfo.colors.length > 0 && (
                  <div>
                    <label className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-1.5 block">Current Colors</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {styleInfo.colors.slice(0, 6).map((color, i) => (
                        <div 
                          key={i} 
                          className="w-7 h-7 rounded-lg border border-white/10" 
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Chat Input - Only show in chat tab */}
            {sidebarTab === "chat" && (
            <div className="p-3 border-t border-white/5 flex-shrink-0 relative">
              {/* Auth overlay for non-logged users OR demo mode - Mobile */}
              {(!user || isDemoMode) && (
                <div 
                  onClick={() => {
                    setShowAuthModal(true);
                    showToast("Sign up free to edit with AI. Get 1 free generation!", "info");
                  }}
                  className="absolute inset-0 z-10 cursor-pointer flex items-center justify-center bg-black/60 backdrop-blur-[2px]"
                >
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Lock className="w-4 h-4" />
                    <span>Sign up to edit with AI</span>
                  </div>
                </div>
              )}
              {/* Attachments preview - images only on mobile */}
              {editImages.length > 0 && (
                <div className="pb-2 flex gap-1.5 flex-wrap">
                  {editImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.url} alt="" className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                      <button onClick={() => setEditImages(prev => prev.filter(i => i.id !== img.id))} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center"><X className="w-2.5 h-2.5" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={!user || isDemoMode}
                    onPaste={handlePasteImage}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && !e.shiftKey && chatInput.trim() && editableCode) {
                        e.preventDefault();
                        // Auth check on mobile - block non-logged users AND demo mode
                        if (!user || isDemoMode) {
                          setShowAuthModal(true);
                          showToast("Sign up free to edit with AI. Get 1 free generation!", "info");
                          return;
                        }
                        const userMsg: ChatMessage = { id: generateId(), role: "user", content: chatInput, timestamp: Date.now(), attachments: editImages.length > 0 ? editImages.map(img => ({ type: "image" as const, label: img.name })) : undefined };
                        setChatMessages(prev => [...prev, userMsg]);
                        const currentInput = chatInput;
                        const currentPlanMode = isPlanMode;
                        const currentChatHistory = chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
                        setChatInput(""); setIsEditing(true);
                        try {
                          // Convert images to base64 for API (mobile handler)
                          let imageData: { base64?: string; url?: string; mimeType: string; name: string }[] | undefined;
                          if (editImages.length > 0) {
                            imageData = [];
                            for (const img of editImages) {
                              const base64 = await urlToBase64(img.url);
                              if (base64) imageData.push({ base64, mimeType: 'image/png', name: img.name, url: img.url });
                            }
                            if (imageData.length === 0) imageData = undefined;
                          }
                          
                          // USE STREAMING API FOR LIVE CODE DISPLAY
                          setStreamingStatus("Analyzing...");
                          setStreamingCode(null);
                          setStreamingLines(0);
                          
                          let currentStreamCode = '';
                          const result = await editCodeWithAIStreaming(
                            editableCode, 
                            currentInput, 
                            imageData, 
                            undefined, 
                            currentPlanMode, 
                            currentChatHistory,
                            (event) => {
                              if (event.type === 'status') {
                                setStreamingStatus(event.message || null);
                                if (event.phase === 'writing') {
                                  currentStreamCode = '';
                                  setStreamingCode('');
                                }
                              } else if (event.type === 'progress') {
                                setStreamingStatus(`Writing code...`);
                                setStreamingLines(event.lines || 0);
                                if (event.preview) {
                                  setStreamingCode(event.preview);
                                }
                              } else if (event.type === 'chunk' && event.text) {
                                // Real-time code streaming
                                currentStreamCode += event.text;
                                setStreamingCode(currentStreamCode.slice(-1500)); // Show last 1500 chars for better visibility
                                setStreamingLines(currentStreamCode.split('\n').length);
                              }
                            }
                          );
                          
                          setStreamingStatus(null);
                          setStreamingCode(null);
                          setStreamingLines(0);
                          
                          if (currentPlanMode) {
                            // Plan mode - just chat response
                            const response = result?.code || "Jasne, mogę w tym pomóc! Co chcesz omówić?";
                            setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: response, timestamp: Date.now() }]);
                          } else if (result?.success && result.code && result.code !== editableCode) {
                            // Code was changed
                            const responseMsg = analyzeCodeChanges(editableCode, result.code, currentInput);
                            setEditableCode(result.code); setDisplayedCode(result.code); setGeneratedCode(result.code);
                            setPreviewUrl(URL.createObjectURL(new Blob([result.code], { type: "text/html" })));
                            setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: responseMsg, timestamp: Date.now() }]);
                            if (activeGeneration) {
                              const versionLabel = generateVersionLabel(currentInput);
                              const updatedGen = { ...activeGeneration, code: result.code, versions: [...(activeGeneration.versions || []), { id: generateId(), timestamp: Date.now(), label: versionLabel, code: result.code, flowNodes, flowEdges, styleInfo }] };
                              setActiveGeneration(updatedGen); 
                              setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
                              saveGenerationToSupabase(updatedGen);
                            }
                          } else if (!result?.cancelled) {
                            setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: result?.error ? `Błąd: ${result.error}` : "Nie wykryto zmian. Spróbuj być bardziej konkretny.", timestamp: Date.now() }]);
                          }
                        } catch (error) { 
                          if (!(error instanceof Error && error.name === 'AbortError')) {
                            setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`, timestamp: Date.now() }]); 
                          }
                        }
                        finally { setIsEditing(false); setEditImages([]); }
                      }
                    }}
                    placeholder={isPlanMode ? "Plan..." : "Ask Replay..."}
                    rows={1}
                    className="w-full px-3 py-2.5 bg-transparent text-xs text-white/80 placeholder:text-white/30 resize-none focus:outline-none min-h-[38px]"
                  />
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {/* Image */}
                  <label className="p-2 rounded-lg text-white/40 cursor-pointer hover:text-white/60 hover:bg-white/5 transition-colors" title="Upload image">
                    <ImageIcon className="w-4 h-4" />
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { if (e.target.files) Array.from(e.target.files).forEach(file => { const reader = new FileReader(); reader.onload = () => setEditImages(prev => [...prev, { id: generateId(), url: reader.result as string, name: file.name, file }]); reader.readAsDataURL(file); }); }} />
                  </label>
                  {/* Plan Mode Toggle */}
                  <button
                    onClick={() => setIsPlanMode(!isPlanMode)}
                    className={cn(
                      "p-2 rounded-lg transition-all",
                      isPlanMode 
                        ? "bg-violet-500/20 text-violet-300" 
                        : "text-white/40 hover:text-white/60"
                    )}
                    title={isPlanMode ? "Plan mode ON" : "Plan mode OFF"}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  {/* Send */}
                  <button 
                    onClick={async () => {
                      if (!chatInput.trim() || !editableCode || isEditing) return;
                      const userMsg: ChatMessage = { id: generateId(), role: "user", content: chatInput, timestamp: Date.now(), attachments: editImages.length > 0 ? editImages.map(img => ({ type: "image" as const, label: img.name })) : undefined };
                      setChatMessages(prev => [...prev, userMsg]);
                      const currentInput = chatInput;
                      const currentPlanMode = isPlanMode;
                      const currentChatHistory = chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
                      setChatInput(""); setIsEditing(true);
                      try {
                        if (currentPlanMode) {
                          const result = await editCodeWithAI(editableCode, currentInput, undefined, undefined, true, undefined);
                          const response = result?.code || "I can help you plan that! What would you like to discuss?";
                          setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: response, timestamp: Date.now() }]);
                        } else {
                          // Convert images to base64 for API (mobile handler 2)
                          let imageData: { base64?: string; url?: string; mimeType: string; name: string }[] | undefined;
                          if (editImages.length > 0) {
                            imageData = [];
                            for (const img of editImages) {
                              const base64 = await urlToBase64(img.url);
                              if (base64) imageData.push({ base64, mimeType: 'image/png', name: img.name, url: img.url });
                            }
                            if (imageData.length === 0) imageData = undefined;
                          }
                          const result = await editCodeWithAI(editableCode, currentInput, imageData, undefined, false, currentChatHistory);
                          if (result?.success && result.code && result.code !== editableCode) {
                            const responseMsg = analyzeCodeChanges(editableCode, result.code, currentInput);
                            setEditableCode(result.code); setDisplayedCode(result.code); setGeneratedCode(result.code);
                            setPreviewUrl(URL.createObjectURL(new Blob([result.code], { type: "text/html" })));
                            setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: responseMsg, timestamp: Date.now() }]);
                            if (activeGeneration) {
                              const versionLabel = generateVersionLabel(currentInput);
                              const updatedGen = { ...activeGeneration, code: result.code, versions: [...(activeGeneration.versions || []), { id: generateId(), timestamp: Date.now(), label: versionLabel, code: result.code, flowNodes, flowEdges, styleInfo }] };
                              setActiveGeneration(updatedGen); 
                              setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
                              saveGenerationToSupabase(updatedGen);
                            }
                          } else if (!result?.cancelled) {
                            setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: result?.error ? `Error: ${result.error}` : "No changes detected. Try being more specific.", timestamp: Date.now() }]);
                          }
                        }
                      } catch (error) { 
                        if (!(error instanceof Error && error.name === 'AbortError')) {
                          setChatMessages(prev => [...prev, { id: generateId(), role: "assistant", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`, timestamp: Date.now() }]); 
                        }
                      }
                      finally { setIsEditing(false); setEditImages([]); }
                    }}
                    disabled={!chatInput.trim() || isEditing}
                    className={cn("p-2 rounded-lg transition-all flex-shrink-0", chatInput.trim() && !isEditing ? "bg-[#FF6E3C] text-white" : "bg-white/5 text-white/30")}
                  >
                    {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
      )}
      
      {/* Mobile Floating Edit - Appears above bottom navigation */}
      <AnimatePresence>
        {showFloatingEdit && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-[72px] inset-x-3 z-50 md:hidden"
          >
            <div className="backdrop-blur-xl bg-[#0a0a0a]/95 border border-white/[0.08] rounded-2xl p-3 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                {isEditing ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#FF6E3C] animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-[#FF6E3C]" />
                )}
                <span className="text-xs text-white/50 flex-1">
                  {isEditing ? (
                    <span className="text-[#FF6E3C]/80 animate-pulse">
                      {selectedElement ? `Editing ${selectedElement.substring(0, 20)}...` : editInput.includes('@') ? `Creating ${editInput.match(/@([a-zA-Z0-9-_]+)/)?.[1] || 'page'}...` : 'Applying changes...'}
                    </span>
                  ) : selectedArchNode ? (
                    <>Editing <span className="text-[#FF6E3C]">@{selectedArchNode}</span></>
                  ) : "Describe your changes"}
                </span>
                {!isEditing && (
                  <button 
                    onClick={() => { setShowFloatingEdit(false); setSelectedArchNode(null); setShowSuggestions(false); }} 
                    className="p-1 hover:bg-white/5 rounded"
                  >
                    <X className="w-3.5 h-3.5 text-white/30" />
                  </button>
                )}
              </div>
              {/* Image previews for mobile */}
              {editImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {editImages.map(img => (
                    <div key={img.id} className="relative group">
                      <img src={img.url} alt={img.name} className="w-10 h-10 object-cover rounded-lg border border-white/10" />
                      <button 
                        onClick={() => {
                          URL.revokeObjectURL(img.url);
                          setEditImages(prev => prev.filter(i => i.id !== img.id));
                        }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-1.5">
                {/* Image upload button for mobile */}
                <label className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] cursor-pointer flex-shrink-0">
                  <input 
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (files) {
                        for (const file of Array.from(files)) {
                          const id = `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;
                          const localUrl = URL.createObjectURL(file);
                          
                          setEditImages(prev => [...prev, { id, url: localUrl, name: file.name, file, uploading: true }]);
                          
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            formData.append("userId", user?.id || "anon");
                            
                            const response = await fetch("/api/upload-image", {
                              method: "POST",
                              body: formData,
                            });
                            
                            const data = await response.json();
                            
                            if (data.success && data.url) {
                              URL.revokeObjectURL(localUrl);
                              setEditImages(prev => prev.map(img => 
                                img.id === id ? { ...img, url: data.url, uploading: false } : img
                              ));
                            } else {
                              setEditImages(prev => prev.map(img => 
                                img.id === id ? { ...img, uploading: false } : img
                              ));
                            }
                          } catch (error) {
                            setEditImages(prev => prev.map(img => 
                              img.id === id ? { ...img, uploading: false } : img
                            ));
                          }
                        }
                      }
                      e.target.value = "";
                    }}
                  />
                  <ImageIcon className="w-4 h-4 text-white/40" />
                </label>
                <input 
                  type="text" 
                  value={editInput} 
                  onChange={(e) => setEditInput(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !showSuggestions) handleEdit();
                    if (e.key === "Escape" && !isEditing) { setShowFloatingEdit(false); setSelectedArchNode(null); setEditImages([]); }
                  }}
                  placeholder={selectedArchNode ? `@${selectedArchNode}...` : "Type @ or add images..."} 
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs text-white/80 placeholder:text-white/25 bg-white/[0.03] border border-white/[0.06] focus:outline-none focus:border-white/10" 
                  disabled={isEditing} 
                  autoFocus 
                />
                <button 
                  onClick={handleEdit} 
                  disabled={(!editInput.trim() && editImages.length === 0) || isEditing} 
                  className="p-2 rounded-lg bg-[#FF6E3C] text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                >
                  {isEditing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          setPendingAction(null);
        }}
        title="Sign in to generate"
        description="Your credits and projects are saved to your account."
      />
      
      {/* Out of Credits Modal */}
      <OutOfCreditsModal
        isOpen={showOutOfCreditsModal}
        onClose={() => setShowOutOfCreditsModal(false)}
        requiredCredits={pendingAction === "generate" ? CREDIT_COSTS.VIDEO_GENERATE : CREDIT_COSTS.AI_EDIT}
        availableCredits={userTotalCredits}
      />
      
      {/* Flow Node Edit/Delete Modal */}
      <AnimatePresence>
        {flowNodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setFlowNodeModal(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {flowNodeModal.type === "rename" ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FF6E3C]/10 flex items-center justify-center">
                      <Pencil className="w-5 h-5 text-[#FF6E3C]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Rename Node</h3>
                      <p className="text-sm text-white/40">Enter a new name for this node</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={flowNodeRenameValue}
                    onChange={(e) => setFlowNodeRenameValue(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#FF6E3C]/50 focus:ring-1 focus:ring-[#FF6E3C]/30"
                    placeholder="Node name..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && flowNodeRenameValue.trim()) {
                        const newNodes = flowNodes.map(n => 
                          n.id === flowNodeModal.nodeId ? { ...n, name: flowNodeRenameValue.trim() } : n
                        );
                        setFlowNodes(newNodes);
                        // Save to Supabase
                        if (activeGeneration) {
                          const updatedGen = { ...activeGeneration, flowNodes: newNodes };
                          setActiveGeneration(updatedGen);
                          setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
                          saveGenerationToSupabase(updatedGen);
                        }
                        showToast(`Renamed to "${flowNodeRenameValue.trim()}"`, "success");
                        setFlowNodeModal(null);
                      } else if (e.key === "Escape") {
                        setFlowNodeModal(null);
                      }
                    }}
                  />
                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setFlowNodeModal(null)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (flowNodeRenameValue.trim()) {
                          const newNodes = flowNodes.map(n => 
                            n.id === flowNodeModal.nodeId ? { ...n, name: flowNodeRenameValue.trim() } : n
                          );
                          setFlowNodes(newNodes);
                          // Save to Supabase
                          if (activeGeneration) {
                            const updatedGen = { ...activeGeneration, flowNodes: newNodes };
                            setActiveGeneration(updatedGen);
                            setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
                            saveGenerationToSupabase(updatedGen);
                          }
                          showToast(`Renamed to "${flowNodeRenameValue.trim()}"`, "success");
                          setFlowNodeModal(null);
                        }
                      }}
                      disabled={!flowNodeRenameValue.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-[#FF6E3C] hover:bg-[#FF6E3C]/90 text-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Rename
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Delete Node</h3>
                      <p className="text-sm text-white/40">This action cannot be undone</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 mb-5">
                    Are you sure you want to delete <span className="font-medium text-white">"{flowNodeModal.nodeName}"</span>? 
                    This will also remove all connections to this node.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFlowNodeModal(null)}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const newNodes = flowNodes.filter(n => n.id !== flowNodeModal.nodeId);
                        const newEdges = flowEdges.filter(edge => edge.from !== flowNodeModal.nodeId && edge.to !== flowNodeModal.nodeId);
                        setFlowNodes(newNodes);
                        setFlowEdges(newEdges);
                        if (selectedFlowNode === flowNodeModal.nodeId) setSelectedFlowNode(null);
                        // Save to Supabase
                        if (activeGeneration) {
                          const updatedGen = { ...activeGeneration, flowNodes: newNodes, flowEdges: newEdges };
                          setActiveGeneration(updatedGen);
                          setGenerations(prev => prev.map(g => g.id === activeGeneration.id ? updatedGen : g));
                          saveGenerationToSupabase(updatedGen);
                        }
                        showToast(`Deleted "${flowNodeModal.nodeName}"`, "info");
                        setFlowNodeModal(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Project Settings Modal */}
      <ProjectSettingsModal
        isOpen={showProjectSettings}
        onClose={() => setShowProjectSettings(false)}
        project={{
          id: activeGeneration?.id || `project_${Date.now()}`,
          name: generationTitle || "Untitled Project",
          createdAt: new Date().toISOString(),
        }}
        onDelete={(id) => {
          // Delete project from generations
          setGenerations(prev => prev.filter(g => g.id !== id));
          if (activeGeneration?.id === id) {
            setActiveGeneration(null);
            setGeneratedCode(null);
            setDisplayedCode("");
            setEditableCode("");
            setPreviewUrl(null);
            setGenerationTitle("Untitled Project");
          }
        }}
        onRename={(id, newName) => {
          setGenerationTitle(newName);
          if (activeGeneration?.id === id) {
            setActiveGeneration(prev => prev ? { ...prev, title: newName } : null);
          }
          setGenerations(prev => prev.map(g => g.id === id ? { ...g, title: newName } : g));
        }}
      />
      
      {/* Upgrade Modal for FREE users */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
      />
      
      {/* Global file input for video upload - accessible from both mobile and desktop */}
      <input 
        ref={fileInputRef} 
        type="file" 
        accept="video/*,video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm,.m4v" 
        multiple 
        onChange={handleFileInput} 
        className="hidden" 
      />
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && deleteTargetId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-semibold text-white text-center mb-2">
                Delete Project?
              </h3>
              
              {/* Project name */}
              <p className="text-sm text-white/50 text-center mb-2">
                Are you sure you want to delete
              </p>
              <p className="text-sm text-white/80 text-center font-medium mb-6 truncate px-4">
                "{deleteTargetTitle}"
              </p>
              
              {/* Warning */}
              <p className="text-xs text-white/40 text-center mb-6">
                This action cannot be undone.
              </p>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteTargetId && deleteGeneration(deleteTargetId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      
      {/* Mobile Project Synced Modal */}
      {showMobileSyncModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]" 
            onClick={() => setShowMobileSyncModal(false)}
          />
          <div className="fixed inset-0 z-[200] flex items-end justify-center p-0 md:items-center md:p-4">
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full md:max-w-md bg-[#0a0a0a] border border-white/10 rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={() => setShowMobileSyncModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
              
              <div className="p-6 pt-8">
                {/* Phone → Desktop icons */}
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 flex items-center justify-center">
                    <Smartphone className="w-7 h-7 text-[#FF6E3C]" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/30" />
                  <div className="w-14 h-14 rounded-2xl bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 flex items-center justify-center">
                    <Monitor className="w-7 h-7 text-[#FF6E3C]" />
                  </div>
                </div>
                
                {/* Title */}
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                    Project Synced! <Rocket className="w-5 h-5 text-[#FF6E3C]" />
                  </h2>
                  <p className="text-sm text-white/50 mt-1">Unlock Full Power on Desktop:</p>
                </div>
                
                {/* Features list */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                      <Code className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Production-Ready React Architecture</p>
                      <p className="text-xs text-white/40 mt-0.5">Clean Code • TypeScript • Tailwind</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">AI Co-Pilot Refinement</p>
                      <p className="text-xs text-white/40 mt-0.5">Chat & Iterate • Real-time changes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Product Flow Map</p>
                      <p className="text-xs text-white/40 mt-0.5">Visualize User Journeys</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                      <Paintbrush className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Automated Design System</p>
                      <p className="text-xs text-white/40 mt-0.5">Tokens • Variables • Assets</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                      <Layers className="w-4 h-4 text-pink-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Componentized Code Export</p>
                      <p className="text-xs text-white/40 mt-0.5">Atomic Structure • Reusable</p>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <p className="text-center text-xs text-white/40 mb-4">
                  Synced & live on <span className="text-[#FF6E3C]">replay.build</span>
                </p>
                
                {/* CTA Button */}
                <button
                  onClick={() => {
                    setShowMobileSyncModal(false);
                    handlePublishClick();
                  }}
                  className="w-full py-4 rounded-xl bg-[#FF6E3C] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#FF8F5C] transition-colors"
                >
                  <ExternalLink className="w-4 h-4" /> Publish & Copy Link
                </button>
                
                {/* Secondary actions */}
                <div className="flex gap-3 mt-3">
                  <button
                    onClick={() => { setShowMobileSyncModal(false); setMobilePanel("input"); }}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Settings className="w-4 h-4" /> Configure
                  </button>
                  <button
                    onClick={() => { setShowMobileSyncModal(false); setMobilePanel("preview"); }}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" /> Preview
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Mobile Recording Info Modal - Static, no animations */}
      {showMobileRecordingInfo && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]" />
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#FF6E3C]/20 flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-[#FF6E3C]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Use your phone's recorder</h3>
                  <p className="text-xs text-white/50 mt-0.5">Browser recording unavailable on mobile</p>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-white/70 bg-white/5 rounded-xl p-4">
                <p className="font-medium text-white">How to record your screen:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Use your phone's built-in screen recorder</li>
                  <li>Record the app/website you want to convert</li>
                  <li>Come back here and upload the video</li>
                </ol>
                <div className="pt-3 border-t border-white/10 space-y-1 text-xs text-white/50">
                  <p><span className="text-white/70">iOS:</span> Control Center → Screen Recording</p>
                  <p><span className="text-white/70">Android:</span> Quick Settings → Screen Record</p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowMobileRecordingInfo(false)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 transition-colors"
                >
                  Got it
                </button>
                <button
                  onClick={() => { setShowMobileRecordingInfo(false); fileInputRef.current?.click(); }}
                  className="flex-1 py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Export with Suspense boundary for useSearchParams
export default function ReplayTool() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#FF6E3C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ReplayToolContent />
    </Suspense>
  );
}
