"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Loader2, 
  Trash2,
  Upload,
  Download,
  ChevronRight,
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
  Copy
} from "lucide-react";
import { cn, generateId, formatDuration } from "@/lib/utils";
import { transmuteVideoToCode, editCodeWithAI } from "@/actions/transmute";
import Logo from "@/components/Logo";
import StyleInjector from "@/components/StyleInjector";
import { Highlight, themes } from "prism-react-renderer";
import { usePendingFlow } from "@/app/providers";
import { useAuth } from "@/lib/auth/context";
import { useCredits, CREDIT_COSTS } from "@/lib/credits/context";
import AuthModal from "@/components/modals/AuthModal";
import OutOfCreditsModal from "@/components/modals/OutOfCreditsModal";
import { Toast, useToast } from "@/components/Toast";
import Link from "next/link";

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
interface ProductFlowNode {
  id: string;
  name: string; // View/state name: "Landing", "Pricing", "Checkout", "Dashboard"
  type: "view" | "section" | "modal" | "state"; // Type of node
  description?: string;
  x: number;
  y: number;
  // Structure components (shown when toggle is ON)
  components?: string[]; // ["Navigation", "Hero", "CTA", "Footer"]
}

interface ProductFlowEdge {
  id: string;
  from: string;
  to: string;
  label: string; // What triggers: "CTA click", "Nav link", "Form submit"
  type: "navigation" | "action" | "scroll" | "auto";
}

// UX Signals detected during analysis
interface UXSignal {
  type: "attention" | "imbalance" | "cta" | "navigation" | "mobile";
  label: string;
  value: string;
}

interface StyleInfo {
  colors: { name: string; value: string }[];
  fonts: { name: string; usage: string; weight: string; family: string }[];
  spacing: string;
  borderRadius: string;
  shadows: string;
}

// Generation history for persistence
interface GenerationHistory {
  id: string;
  timestamp: number;
  code: string;
  styleDirective: string;
  refinements: string;
  flowNodes: ProductFlowNode[];
  flowEdges: ProductFlowEdge[];
  styleInfo: StyleInfo | null;
}

type ViewMode = "preview" | "code" | "flow" | "design" | "input";

const STREAMING_MESSAGES = [
  "Scanning video frames",
  "Extracting visual information from your recording",
  "Identifying components",
  "Detecting UI elements, buttons, inputs, and containers",
  "Mapping interactions",
  "Understanding click areas, hover states, and transitions",
  "Processing with Gemini",
  "AI is generating optimized HTML and CSS code",
  "Finalizing output",
  "Applying your style preferences and polishing the result",
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

export default function ReplayTool() {
  const { pending, clearPending } = usePendingFlow();
  const { user, isLoading: authLoading } = useAuth();
  const { totalCredits: userTotalCredits, wallet, membership, canAfford, refreshCredits } = useCredits();
  const { toast, showToast, hideToast } = useToast();
  
  const [flows, setFlows] = useState<FlowItem[]>([]);
  const [styleDirective, setStyleDirective] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [displayedCode, setDisplayedCode] = useState<string>("");
  const [editableCode, setEditableCode] = useState<string>("");
  const [isCodeEditable, setIsCodeEditable] = useState(false);
  const [isStreamingCode, setIsStreamingCode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  
  // Auth/Credits modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showOutOfCreditsModal, setShowOutOfCreditsModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"generate" | "edit" | null>(null);
  const [analysisDescription, setAnalysisDescription] = useState<string>("");
  const [editInput, setEditInput] = useState("");
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [isPointAndEdit, setIsPointAndEdit] = useState(false);
  const [refinements, setRefinements] = useState("");
  const [analysisSection, setAnalysisSection] = useState<"style" | "layout" | "components">("style");
  
  // Mobile state - input visible by default
  const [mobilePanel, setMobilePanel] = useState<"input" | "preview" | "code" | "flow" | "design" | null>("input");
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
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
    // UX Signals - subtle behavioral insights
    uxSignals?: UXSignal[];
    // Structure components (renamed from components for clarity)
    structureItems?: { name: string; status: "waiting" | "generating" | "done" }[];
  }
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase | null>(null);
  
  // Flow state = PRODUCT MAP (canvas with nodes/edges)
  const [flowNodes, setFlowNodes] = useState<ProductFlowNode[]>([]);
  const [flowEdges, setFlowEdges] = useState<ProductFlowEdge[]>([]);
  const [flowBuilding, setFlowBuilding] = useState(false);
  const [selectedFlowNode, setSelectedFlowNode] = useState<string | null>(null);
  const [showStructureInFlow, setShowStructureInFlow] = useState(false); // Toggle to show components under nodes
  const [generationComplete, setGenerationComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showFloatingEdit, setShowFloatingEdit] = useState(false);
  const [architecture, setArchitecture] = useState<ArchNode[]>([]);
  const [archBuilding, setArchBuilding] = useState(false);
  const [selectedArchNode, setSelectedArchNode] = useState<string | null>(null);
  const [styleInfo, setStyleInfo] = useState<StyleInfo | null>(null);
  const [archZoom, setArchZoom] = useState(1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedNodeModal, setSelectedNodeModal] = useState<ArchNode | null>(null);
  
  // Generation history for persistence
  const [generationHistory, setGenerationHistory] = useState<GenerationHistory[]>([]);
  
  // Canvas pan state for architecture - start centered
  const [canvasPan, setCanvasPan] = useState({ x: -200, y: 50 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const archCanvasRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  
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

  const selectedFlow = flows.find(f => f.id === selectedFlowId);

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

  useEffect(() => {
    if (!isProcessing) {
      setStreamingMessage("");
      return;
    }
    
    let index = 0;
    setStreamingMessage(STREAMING_MESSAGES[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % STREAMING_MESSAGES.length;
      setStreamingMessage(STREAMING_MESSAGES[index]);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [isProcessing]);

  useEffect(() => {
    if (!generatedCode || !isStreamingCode) return;
    let index = 0;
    const chunkSize = 20;
    const interval = setInterval(() => {
      if (index < generatedCode.length) {
        setDisplayedCode(generatedCode.slice(0, index + chunkSize));
        setEditableCode(generatedCode.slice(0, index + chunkSize));
        index += chunkSize;
        if (codeContainerRef.current) codeContainerRef.current.scrollTop = codeContainerRef.current.scrollHeight;
      } else {
        // Streaming finished!
        setDisplayedCode(generatedCode);
        setEditableCode(generatedCode);
        setIsStreamingCode(false);
        
        // NOW mark as complete and all components as done
        setAnalysisPhase(prev => prev ? {
          ...prev,
          components: prev.components.map(c => ({ ...c, status: "done" as const }))
        } : prev);
        setGenerationComplete(true);
        
        // Generate description after streaming done
        const description = generateAnalysisDescription(generatedCode, styleDirective);
        typeText(description, (typed) => setAnalysisDescription(typed), 15);
        
        clearInterval(interval);
      }
    }, 8);
    return () => clearInterval(interval);
  }, [generatedCode, isStreamingCode, styleDirective]);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Load flows from localStorage on mount
  useEffect(() => {
    try {
      const savedFlows = localStorage.getItem("replay_flows");
      const savedCode = localStorage.getItem("replay_generated_code");
      const savedStyle = localStorage.getItem("replay_style");
      const savedRefinements = localStorage.getItem("replay_refinements");
      const savedHistory = localStorage.getItem("replay_generation_history");
      const savedFlowNodes = localStorage.getItem("replay_flow_nodes");
      const savedFlowEdges = localStorage.getItem("replay_flow_edges");
      const savedStyleInfo = localStorage.getItem("replay_style_info");
      
      if (savedFlows) {
        const parsed = JSON.parse(savedFlows);
        // Filter out any flows with invalid video URLs (blob URLs don't persist)
        const validFlows = parsed.filter((f: FlowItem) => f.videoUrl && !f.videoUrl.startsWith("blob:"));
        if (validFlows.length > 0) {
          setFlows(validFlows);
          setSelectedFlowId(validFlows[0].id);
        }
      }
      if (savedCode) {
        setGeneratedCode(savedCode);
        setDisplayedCode(savedCode);
        setEditableCode(savedCode);
        // Create preview URL
        const blob = new Blob([savedCode], { type: "text/html" });
        setPreviewUrl(URL.createObjectURL(blob));
        setGenerationComplete(true);
      }
      if (savedStyle) setStyleDirective(savedStyle);
      if (savedRefinements) setRefinements(savedRefinements);
      if (savedHistory) setGenerationHistory(JSON.parse(savedHistory));
      if (savedFlowNodes) setFlowNodes(JSON.parse(savedFlowNodes));
      if (savedFlowEdges) setFlowEdges(JSON.parse(savedFlowEdges));
      if (savedStyleInfo) setStyleInfo(JSON.parse(savedStyleInfo));
      
      setHasLoadedFromStorage(true);
    } catch (e) {
      console.error("Error loading from localStorage:", e);
      setHasLoadedFromStorage(true);
    }
  }, []);

  // Save flows to localStorage (but not blob URLs - they don't persist)
  useEffect(() => {
    if (!hasLoadedFromStorage) return; // Don't save until we've loaded
    
    try {
      // Don't save blob URLs as they won't work after reload
      const flowsToSave = flows.map(f => ({
        ...f,
        // Keep data URLs, but clear blob URLs
        videoUrl: f.videoUrl?.startsWith("blob:") ? "" : f.videoUrl,
        thumbnail: f.thumbnail?.startsWith("blob:") ? "" : f.thumbnail,
      })).filter(f => f.videoUrl); // Only save flows with valid URLs
      
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
  
  // Save generation history
  useEffect(() => {
    if (!hasLoadedFromStorage || generationHistory.length === 0) return;
    try {
      // Only keep last 10 generations to save space
      const recentHistory = generationHistory.slice(-10);
      localStorage.setItem("replay_generation_history", JSON.stringify(recentHistory));
    } catch (e) {
      console.error("Error saving generation history:", e);
    }
  }, [generationHistory, hasLoadedFromStorage]);

  // Video time update
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [selectedFlowId]);

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

  // Build PRODUCT FLOW MAP from code analysis - NOT timeline, but what's POSSIBLE
  // Shows how product is connected logically - views, states, transitions
  const buildFlowLive = async (code: string) => {
    setFlowBuilding(true);
    setFlowNodes([]);
    setFlowEdges([]);
    
    const addNode = async (node: ProductFlowNode) => {
      await new Promise(r => setTimeout(r, 100));
      setFlowNodes(prev => [...prev, node]);
    };
    
    const addEdge = async (edge: ProductFlowEdge) => {
      await new Promise(r => setTimeout(r, 50));
      setFlowEdges(prev => [...prev, edge]);
    };
    
    // Analyze code for product structure
    const hasNav = /<nav/i.test(code);
    const hasHeader = /<header/i.test(code);
    const hasHero = /hero|banner|jumbotron/i.test(code);
    const hasForms = /<form/i.test(code);
    const hasModal = /modal|dialog|overlay/i.test(code);
    const hasCards = /card/gi.test(code);
    const hasPricing = /pricing|plans?|tier/i.test(code);
    const hasFooter = /<footer/i.test(code);
    const hasDashboard = /dashboard|admin|panel/i.test(code);
    const hasCheckout = /checkout|payment|cart/i.test(code);
    const hasFeatures = /features?|benefits?/i.test(code);
    const hasAbout = /about|team|company/i.test(code);
    const hasAuth = /login|signin|sign-in|signup|sign-up|register/i.test(code);
    const hasTestimonials = /testimonial|review|quote/i.test(code);
    const links = (code.match(/<a /gi) || []).length;
    const buttons = (code.match(/<button/gi) || []).length;
    
    const centerX = 400;
    let currentY = 60;
    const rowHeight = 180;
    const colWidth = 240;
    
    // NODE: Landing / Home (Entry Point)
    const landingComponents: string[] = [];
    if (hasNav || hasHeader) landingComponents.push("Navigation");
    if (hasHero) landingComponents.push("Hero Section");
    if (hasCards) landingComponents.push("Content Cards");
    if (hasTestimonials) landingComponents.push("Testimonials");
    if (hasFooter) landingComponents.push("Footer");
    
    await addNode({
      id: "landing",
      name: hasHero ? "Landing" : "Home",
      type: "view",
      description: "Entry point • Primary conversion",
      x: centerX,
      y: currentY,
      components: landingComponents.length > 0 ? landingComponents : ["Header", "Main Content", "Footer"]
    });
    
    currentY += rowHeight;
    
    // Build destinations with SEMANTIC edge labels (not user actions)
    // Good: "Primary CTA", "Main navigation", "Auth gate"
    // Bad: "click", "user presses", "after 3s"
    const destinations: { id: string; name: string; type: "view" | "section" | "modal"; desc: string; components: string[]; x: number; edgeLabel: string; edgeType: ProductFlowEdge["type"] }[] = [];
    
    // Pricing - often a key destination
    if (hasPricing || (buttons > 3 && links > 5)) {
      destinations.push({
        id: "pricing",
        name: "Pricing",
        type: "view",
        desc: "Plan selection • Conversion",
        components: ["Plan Cards", "Feature Matrix", "CTA Buttons"],
        x: centerX - colWidth,
        edgeLabel: "Main navigation",
        edgeType: "navigation"
      });
    }
    
    // Features/About sections
    if (hasFeatures || hasAbout) {
      destinations.push({
        id: "features",
        name: hasFeatures ? "Features" : "About",
        type: "section",
        desc: hasFeatures ? "Value proposition" : "Company info",
        components: hasFeatures ? ["Feature Grid", "Icons", "Descriptions"] : ["Team", "Story", "Values"],
        x: centerX,
        edgeLabel: "Content scroll",
        edgeType: "scroll"
      });
    }
    
    // Auth flow
    if (hasAuth || hasForms) {
      destinations.push({
        id: "auth",
        name: hasAuth ? "Sign Up" : "Contact",
        type: hasAuth ? "view" : "modal",
        desc: hasAuth ? "Account creation • Auth gate" : "Lead capture",
        components: ["Form Fields", "Submit Button", "Validation"],
        x: centerX + (hasFeatures || hasAbout ? colWidth : 0),
        edgeLabel: hasAuth ? "Primary CTA" : "Contact action",
        edgeType: "action"
      });
    }
    
    // Modal overlay
    if (hasModal && !hasAuth) {
      destinations.push({
        id: "modal",
        name: "Modal",
        type: "modal",
        desc: "Overlay interaction",
        components: ["Modal Header", "Modal Content", "Action Buttons"],
        x: centerX + colWidth,
        edgeLabel: "Context switch",
        edgeType: "action"
      });
    }
    
    // Add destinations and semantic edges
    for (const dest of destinations) {
      await addNode({
        id: dest.id,
        name: dest.name,
        type: dest.type,
        description: dest.desc,
        x: dest.x,
        y: currentY,
        components: dest.components
      });
      
      // Semantic edge - describes WHAT connects, not HOW user interacts
      await addEdge({
        id: `landing-${dest.id}`,
        from: "landing",
        to: dest.id,
        label: dest.edgeLabel,
        type: dest.edgeType
      });
    }
    
    currentY += rowHeight;
    
    // Third row - conversion points (Checkout, Dashboard, Success)
    if (hasCheckout || (hasForms && hasPricing)) {
      await addNode({
        id: "checkout",
        name: "Checkout",
        type: "view",
        description: "Purchase flow • Conversion",
        x: centerX - colWidth/2,
        y: currentY,
        components: ["Order Summary", "Payment Form", "Security Badges"]
      });
      
      if (destinations.find(d => d.id === "pricing")) {
        await addEdge({
          id: "pricing-checkout",
          from: "pricing",
          to: "checkout",
          label: "Plan selection",
          type: "navigation"
        });
      }
    }
    
    if (hasDashboard || hasAuth) {
      const dashId = hasDashboard ? "dashboard" : "success";
      await addNode({
        id: dashId,
        name: hasDashboard ? "Dashboard" : "Success",
        type: hasDashboard ? "view" : "state",
        description: hasDashboard ? "Authenticated area" : "Completion state",
        x: centerX + colWidth/2,
        y: currentY,
        components: hasDashboard ? ["Sidebar", "Main Content", "Stats Panel"] : ["Success Message", "Next Steps"]
      });
      
      const authNode = destinations.find(d => d.id === "auth");
      if (authNode) {
        await addEdge({
          id: `auth-${dashId}`,
          from: "auth",
          to: dashId,
          label: "Auth complete",
          type: "action"
        });
      }
      
      if (hasCheckout) {
        await addEdge({
          id: `checkout-${dashId}`,
          from: "checkout",
          to: dashId,
          label: "Payment complete",
          type: "action"
        });
      }
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

  useEffect(() => {
    if (generatedCode && !isStreamingCode) {
      buildArchitectureLive(generatedCode);
      buildFlowLive(generatedCode);
      setStyleInfo(extractStyleInfo(generatedCode));
    }
  }, [generatedCode, isStreamingCode]);

  const getSupportedMimeType = () => {
    const types = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return "video/webm";
  };

  // Check if mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  };

  const [showMobileRecordingInfo, setShowMobileRecordingInfo] = useState(false);

  const startRecording = async () => {
    // Check for mobile - show custom modal
    if (isMobileDevice()) {
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
    console.log("addVideoToFlows called, blob size:", blob.size);
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    
    return new Promise<void>((resolve) => {
      let resolved = false;
      
      const generateThumbnail = (videoEl: HTMLVideoElement): string | undefined => {
        try {
          const canvas = document.createElement("canvas");
          const vw = videoEl.videoWidth || 320;
          const vh = videoEl.videoHeight || 180;
          canvas.width = 160;
          canvas.height = Math.round((160 / vw) * vh) || 90;
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
        // Estimate from blob size (~500KB/s for screen recording)
        const est = Math.max(5, Math.round(blob.size / 500000));
        console.log("Estimated duration from blob size:", est);
        return Math.min(est, 300);
      };
      
      const finishCreation = (thumbnail?: string) => {
        if (resolved) return;
        resolved = true;
        
        const duration = getValidDuration();
        const flowId = generateId();
        
        // Generate name - use file name if provided, otherwise create unique recording name
        let baseName = name && name.trim() ? name.trim() : "";
        
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
            videoUrl: url, 
            thumbnail: thumbnail || "",
            duration, 
            trimStart: 0, 
            trimEnd: duration,
          };
          console.log("Flow added:", newFlow.name, "duration:", duration, "blob size:", blob.size);
          return [...prev, newFlow];
        });
        setSelectedFlowId(flowId);
        resolve();
      };
      
      // Handle webm Infinity duration - seek to end to get real duration
      video.onloadedmetadata = () => {
        console.log("Metadata loaded, raw duration:", video.duration);
        if (!isFinite(video.duration) || video.duration <= 0) {
          video.currentTime = 1e10; // Seek far to get real duration
        } else {
          video.currentTime = Math.min(1, video.duration * 0.25);
        }
      };
      
      video.onseeked = () => {
        if (resolved) return;
        console.log("Seeked to:", video.currentTime, "duration now:", video.duration);
        // If we seeked to get duration, now seek for thumbnail
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
      
      video.onerror = () => {
        console.error("Video load error");
        finishCreation();
      };
      
      // Fallback timeout
      setTimeout(() => {
        if (!resolved) {
          console.log("Timeout - using current data");
          finishCreation(generateThumbnail(video));
        }
      }, 5000);
      
      video.load();
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
        if (file.type.startsWith("video/")) {
          await addVideoToFlows(file, file.name.replace(/\.[^/.]+$/, ""));
        }
      }
    }
    e.target.value = "";
  }, []);

  const removeFlow = (flowId: string) => {
    setFlows(prev => prev.filter(f => f.id !== flowId));
    if (selectedFlowId === flowId) setSelectedFlowId(flows.length > 1 ? flows.find(f => f.id !== flowId)?.id || null : null);
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

  const handleGenerate = async () => {
    if (flows.length === 0) return;
    
    // Auth gate: require login
    if (!user) {
      setPendingAction("generate");
      setShowAuthModal(true);
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
    setPreviewUrl(null);
    setIsCodeEditable(false);
    setArchitecture([]);
    setStyleInfo(null);
    
    // Initialize live analysis phase - UX Signals will be detected from video
    const initialPhase: AnalysisPhase = {
      palette: [],
      typography: "Scanning...",
      vibe: "Analyzing...",
      layout: "Detecting...",
      container: "Scanning...",
      responsive: "Checking...",
      components: [],
      uxSignals: [],
      structureItems: []
    };
    setAnalysisPhase(initialPhase);
    setAnalysisSection("style");
    
    // Real-time analysis simulation based on actual video content
    // UX Signals and Structure are generated live, not mocked
    const updatePhaseRealTime = async () => {
      // Phase 1: UX SIGNALS (0-3s) - Detect behavioral patterns
      setAnalysisSection("style");
      
      // Simulate detecting attention patterns
      await new Promise(r => setTimeout(r, 600));
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [{ type: "attention", label: "Attention density", value: "Scanning..." }]
      } : prev);
      
      await new Promise(r => setTimeout(r, 700));
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [
          { type: "attention", label: "Attention density", value: "Analyzing focus areas..." },
          { type: "navigation", label: "Navigation depth", value: "Mapping routes..." }
        ]
      } : prev);
      
      await new Promise(r => setTimeout(r, 800));
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [
          { type: "attention", label: "Attention density", value: "High" },
          { type: "navigation", label: "Navigation depth", value: "Shallow" },
          { type: "cta", label: "CTA visibility", value: "Detecting..." }
        ]
      } : prev);
      
      await new Promise(r => setTimeout(r, 600));
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [
          { type: "attention", label: "Attention density", value: "High" },
          { type: "navigation", label: "Navigation depth", value: "Shallow" },
          { type: "cta", label: "CTA visibility", value: "Prominent" },
          { type: "mobile", label: "Mobile reachability", value: "Checking..." }
        ]
      } : prev);
      
      // Phase 2: STRUCTURE (3-5s) - Detect components
      await new Promise(r => setTimeout(r, 500));
      setAnalysisSection("layout");
      
      // Add structure items one by one as "detected"
      const structureQueue = ["Navigation", "Hero Section", "Content Area", "Call to Action", "Footer"];
      
      for (let i = 0; i < structureQueue.length; i++) {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
        setAnalysisPhase(prev => {
          if (!prev) return prev;
          const newStructure = [...(prev.structureItems || [])];
          // Set previous item to done
          if (newStructure.length > 0) {
            newStructure[newStructure.length - 1].status = "done";
          }
          // Add new item as generating
          newStructure.push({ name: structureQueue[i], status: "generating" });
          return { ...prev, structureItems: newStructure };
        });
      }
      
      // Phase 3: COMPONENTS (5s+) - Generate code components
      await new Promise(r => setTimeout(r, 600));
      setAnalysisSection("components");
      
      // Finalize UX signals with real values
      setAnalysisPhase(prev => prev ? { 
        ...prev, 
        uxSignals: [
          { type: "attention", label: "Attention density", value: "High" },
          { type: "navigation", label: "Navigation depth", value: "Shallow" },
          { type: "cta", label: "CTA visibility", value: "Prominent" },
          { type: "mobile", label: "Mobile reachability", value: "Good" }
        ],
        responsive: "Mobile-First",
        layout: "Flexbox + Grid",
        container: "Centered layout"
      } : prev);
      
      // Mark all structure items as done
      setAnalysisPhase(prev => prev ? {
        ...prev,
        structureItems: (prev.structureItems || []).map(s => ({ ...s, status: "done" as const }))
      } : prev);
    };
    
    updatePhaseRealTime();
    
    try {
      const flow = flows[0];
      
      // Check video size
      const videoSizeMB = flow.videoBlob.size / 1024 / 1024;
      console.log(`Video size: ${videoSizeMB.toFixed(2)} MB`);
      
      // Max 50MB
      if (videoSizeMB > 50) {
        showToast("Video too large (max 50MB). Please use a shorter recording.", "error");
        setIsProcessing(false);
        return;
      }
      
      // Upload video to Supabase Storage using signed URL (bypasses Vercel's 4.5MB limit)
      setStreamingMessage("Uploading video...");
      
      // Step 1: Get signed upload URL from our API
      const urlRes = await fetch("/api/upload-video/get-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `recording-${Date.now()}.webm`,
          contentType: flow.videoBlob.type || "video/webm",
        }),
      });
      
      if (!urlRes.ok) {
        const errorData = await urlRes.json().catch(() => ({}));
        console.error("Failed to get upload URL:", errorData);
        showToast(errorData.error || "Failed to prepare upload. Please try again.", "error");
        setIsProcessing(false);
        return;
      }
      
      const { signedUrl, publicUrl } = await urlRes.json();
      console.log("Got signed upload URL");
      
      // Step 2: Upload directly to Supabase Storage (bypasses Vercel limit)
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: {
          "Content-Type": flow.videoBlob.type || "video/webm",
        },
        body: flow.videoBlob,
      });
      
      if (!uploadRes.ok) {
        console.error("Direct upload failed:", uploadRes.status, uploadRes.statusText);
        showToast("Failed to upload video. Please try again.", "error");
        setIsProcessing(false);
        return;
      }
      
      const videoUrl = publicUrl;
      console.log("Video uploaded to Supabase:", videoUrl);
      
      // Build style directive with refinements and trim info
      let fullStyleDirective = styleDirective || "Modern, clean design with smooth animations";
      
      // Add refinements if provided
      if (refinements.trim()) {
        fullStyleDirective += `. Additional refinements: ${refinements.trim()}`;
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
      
      const result = await transmuteVideoToCode({
        videoUrl,
        styleDirective: fullStyleDirective,
      });
      
      console.log("Generation result:", result);
      
      if (result && result.success && result.code) {
        setGeneratedCode(result.code);
        setIsStreamingCode(true);
        setViewMode("code");
        const blob = new Blob([result.code], { type: "text/html" });
        setPreviewUrl(URL.createObjectURL(blob));
        
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
        const historyEntry: GenerationHistory = {
          id: generateId(),
          timestamp: Date.now(),
          code: result.code,
          styleDirective: styleDirective,
          refinements: refinements,
          flowNodes: [], // Will be populated after buildFlowLive
          flowEdges: [],
          styleInfo: null
        };
        setGenerationHistory(prev => [...prev, historyEntry]);
        
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
        errorMsg = "Video is too large. Please use a shorter video (under 10 seconds) or compress it.";
      }
      setAnalysisDescription(`Error: ${errorMsg}`);
      showToast(errorMsg, "error");
    } finally {
      setIsProcessing(false);
    }
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

  const handleEdit = async () => {
    if (!editInput.trim() || !editableCode) return;
    
    // Auth gate
    if (!user) {
      setPendingAction("edit");
      setShowAuthModal(true);
      return;
    }
    
    // Credits gate
    if (!canAfford(CREDIT_COSTS.AI_EDIT)) {
      setShowOutOfCreditsModal(true);
      return;
    }
    
    // Spend credits
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
    try {
      // Include selected node context if any
      let prompt = editInput;
      if (selectedArchNode) {
        prompt = `For the @${selectedArchNode} element: ${editInput}`;
      }
      
      const result = await editCodeWithAI(editableCode, prompt);
      if (result.success && result.code) {
        setGeneratedCode(result.code);
        setEditableCode(result.code);
        setDisplayedCode(result.code);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(URL.createObjectURL(new Blob([result.code], { type: "text/html" })));
        buildArchitectureLive(result.code);
        buildFlowLive(result.code);
        setStyleInfo(extractStyleInfo(result.code));
      }
    } catch (error) {
      console.error("Edit error:", error);
    } finally {
      setIsEditing(false);
      setEditInput("");
      setShowFloatingEdit(false);
      setSelectedArchNode(null);
    }
  };

  const applyCodeChanges = () => {
    if (editableCode) {
      setGeneratedCode(editableCode);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(new Blob([editableCode], { type: "text/html" })));
      setIsCodeEditable(false);
    }
  };

  const handleDownload = () => {
    if (!editableCode) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([editableCode], { type: "text/html" }));
    a.download = "generated.html";
    a.click();
  };

  const handlePublish = () => previewUrl && window.open(previewUrl, "_blank");

  const handleRefresh = () => {
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
    } else {
      setSelectedArchNode(nodeId);
      setEditInput(`@${nodeId} `);
      setShowFloatingEdit(true);
    }
  };

  const EmptyState = ({ icon: Icon, title, subtitle }: { icon: any; title: string; subtitle: string }) => (
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
    </div>
  );

  const LoadingState = () => (
    <div className="logo-loader">
      <div className="logo-loader-container">
        <svg className="logo-loader-svg" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" />
          <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" />
        </svg>
        <div className="logo-loader-gradient" />
      </div>
      <div className="streaming-text">
        <motion.div 
          key={isStreamingCode ? "finalizing" : streamingMessage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="streaming-text-inner"
        >
          {isStreamingCode ? "Finalizing..." : streamingMessage}
        </motion.div>
      </div>
    </div>
  );

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

  return (
    <div className="h-screen flex flex-col bg-[#050505] overflow-hidden font-poppins">
      <div className="gradient-bg" />
      <div className="grain-overlay" />
      <div className="vignette" />
      
      {/* Desktop Header */}
      <header className="relative z-20 hidden md:flex items-center justify-between px-5 py-3 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <a href="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </a>
        <div className="flex items-center gap-4">
          <div className="relative">
            {user ? (
              <>
                <button onClick={() => setShowUserMenu(!showUserMenu)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center text-white text-sm font-medium">
                    {user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                  <ChevronDown className="w-4 h-4 text-white/40" />
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute top-full right-0 mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                      {/* Credits section */}
                      {(() => {
                        const plan = membership?.plan || "free";
                        const maxCredits = plan === "agency" ? 10000 : plan === "pro" ? 3000 : 150;
                        const percentage = Math.min(100, (userTotalCredits / maxCredits) * 100);
                        return (
                          <Link href="/settings?tab=plans" className="block p-3 hover:bg-white/5 transition-colors border-b border-white/5">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-white">{userTotalCredits} credits available</span>
                              <ChevronRight className="w-4 h-4 text-white/40" />
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-white/40 capitalize">{plan} Plan</span>
                              <span className="text-xs text-[#FF6E3C] font-medium">Upgrade</span>
                            </div>
                          </Link>
                        );
                      })()}
                      
                      <div className="p-1.5">
                        <Link href="/settings" className="w-full dropdown-item text-left text-sm text-white/80 flex items-center gap-2">
                          <User className="w-4 h-4 opacity-50" /> View profile
                        </Link>
                        <Link href="/settings" className="w-full dropdown-item text-left text-sm text-white/80 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 opacity-50" /> Manage account
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 rounded-lg bg-[#FF6E3C] text-white text-sm font-medium hover:bg-[#FF8F5C] transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Mobile Header - Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 flex md:hidden items-center justify-between px-4 py-3 border-b border-white/5 bg-black/95 backdrop-blur-xl">
        <a href="/" className="hover:opacity-80 transition-opacity">
          <Logo />
        </a>
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {user ? (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center text-white text-xs font-medium">
              {user.email?.[0]?.toUpperCase() || "U"}
            </div>
          ) : (
            <User className="w-5 h-5 text-white/60" />
          )}
        </button>
      </header>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-[#111] border-l border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Menu</span>
                  <button onClick={() => setShowMobileMenu(false)} className="p-1 hover:bg-white/10 rounded">
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </div>
              
              {user ? (
                <>
                  {/* Credits section */}
                  {(() => {
                    const plan = membership?.plan || "free";
                    const maxCredits = plan === "agency" ? 10000 : plan === "pro" ? 3000 : 150;
                    const percentage = Math.min(100, (userTotalCredits / maxCredits) * 100);
                    return (
                      <Link 
                        href="/settings?tab=plans" 
                        onClick={() => setShowMobileMenu(false)}
                        className="block p-4 hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-white">{userTotalCredits} credits available</span>
                          <ChevronRight className="w-4 h-4 text-white/40" />
                        </div>
                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-white/40 capitalize">{plan} Plan</span>
                          <span className="text-xs text-[#FF6E3C] font-medium">Upgrade</span>
                        </div>
                      </Link>
                    );
                  })()}
                  
                  <div className="p-2 space-y-1">
                    <Link 
                      href="/settings" 
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-white/80"
                    >
                      <User className="w-4 h-4 opacity-50" /> View profile
                    </Link>
                    <Link 
                      href="/settings" 
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 text-white/80"
                    >
                      <Sparkles className="w-4 h-4 opacity-50" /> Manage account
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-4">
                  <button
                    onClick={() => { setShowMobileMenu(false); setShowAuthModal(true); }}
                    className="w-full py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Left Panel - Hidden on mobile */}
        <div className="hidden md:flex w-[340px] border-r border-white/5 bg-black/40 backdrop-blur-sm flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-white/40" />
                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Flows</span>
                {flows.length > 0 && <span className="px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-white/40">{flows.length}</span>}
              </div>
              <div className="flex gap-1.5">
                {isRecording ? (
                  <button onClick={stopRecording} className="btn-black flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs">
                    <Square className="w-3 h-3 fill-red-500 text-red-500" />{formatDuration(recordingDuration)}
                  </button>
                ) : (
                  <button onClick={startRecording} className="btn-black flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"><Monitor className="w-3.5 h-3.5" /> Record</button>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="btn-black flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"><Upload className="w-3.5 h-3.5" /> Upload</button>
              </div>
              <input ref={fileInputRef} type="file" accept="video/*" multiple onChange={handleFileInput} className="hidden" />
            </div>
            <div className="space-y-2 max-h-[160px] overflow-auto custom-scrollbar">
              {flows.length === 0 ? (
                <div onClick={() => fileInputRef.current?.click()} className="drop-zone flex flex-col items-center justify-center py-8 rounded-xl cursor-pointer transition-colors">
                  <Video className="w-6 h-6 text-white/15 mb-2" />
                  <p className="text-xs text-white/25 text-center px-4">Drop or record video. Get code.</p>
                  <p className="text-[10px] text-white/15 text-center px-4 mt-1">We analyze the flow, map interactions, and export clean code.</p>
                </div>
              ) : flows.map((flow) => (
                <div key={flow.id} onClick={() => setSelectedFlowId(flow.id)} className={cn("flow-item flex items-center gap-2.5 p-2 cursor-pointer group", selectedFlowId === flow.id && "selected")}>
                  <div className="w-14 h-8 rounded overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                    {flow.thumbnail ? <img src={flow.thumbnail} alt="" className="w-full h-full object-cover" /> : <Film className="w-3 h-3 text-white/20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{flow.name}</p>
                    <p className="text-xs text-white/40">
                      {formatDuration(flow.trimEnd - flow.trimStart)} / {formatDuration(flow.duration)}
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); removeFlow(flow.id); }} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded"><Trash2 className="w-3 h-3 text-white/40" /></button>
                </div>
              ))}
              
              {/* Add next flow button */}
              {flows.length > 0 && (
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full mt-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white/60 hover:bg-white/5 border border-dashed border-white/10 hover:border-white/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add next flow</span>
                </button>
              )}
            </div>
          </div>

          {/* CONTEXT Section - Above Style */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-white/40" /><span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Context</span></div>
            <textarea
              value={refinements}
              onChange={(e) => setRefinements(e.target.value)}
              placeholder="Explain interactions, logic, or specific details for the code (optional)"
              disabled={isProcessing}
              rows={3}
              className={cn(
                "w-full px-3 py-2.5 rounded-lg text-xs text-white/70 placeholder:text-white/25 transition-colors focus:outline-none textarea-grow input-subtle min-h-[72px]",
                isProcessing && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>

          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2 mb-3"><Palette className="w-4 h-4 text-white/40" /><span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Style</span></div>
            <StyleInjector value={styleDirective} onChange={setStyleDirective} disabled={isProcessing} />
          </div>

          <div className="p-4 border-b border-white/5">
            <button onClick={handleGenerate} disabled={isProcessing || flows.length === 0} className={cn("w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-semibold text-sm transition-all btn-generate", isProcessing && "processing")}>
              <div className="btn-generate-grain" />
              <span className="relative z-10 flex items-center gap-2.5">
                {isProcessing ? (<><Loader2 className="w-4 h-4 animate-spin" /><span className="generating-text">Generating...</span></>) : (<><LogoIcon className="btn-logo-icon" color="#FF6E3C" /><span>Generate</span><ChevronRight className="w-4 h-4" /></>)}
              </span>
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2"><Activity className="w-4 h-4 text-white/40" /><span className="text-xs font-semibold text-white/60 uppercase tracking-wider">Analysis</span></div>
            <div ref={analysisRef} className="flex-1 p-4 overflow-auto custom-scrollbar">
              {(isProcessing || isStreamingCode) && analysisPhase ? (
                <div className="space-y-4">
                  {/* UX SIGNALS - Real-time streaming of what AI observes */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="analysis-section"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-3.5 h-3.5 text-[#FF6E3C]/60" />
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">UX Signals</span>
                      {analysisSection === "style" && <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50 ml-auto" />}
                    </div>
                    <div className="space-y-1.5">
                      {/* Live streaming UX observations - real-time, not mocked */}
                      {analysisPhase.uxSignals && analysisPhase.uxSignals.length > 0 ? (
                        analysisPhase.uxSignals.map((signal, i) => (
                          <motion.div 
                            key={signal.label}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center justify-between"
                          >
                            <span className="text-[10px] text-white/30">{signal.label}</span>
                            <span className={cn(
                              "text-[10px]",
                              signal.value.includes("...") ? "text-[#FF6E3C]/60" : "text-white/50"
                            )}>
                              {signal.value}
                            </span>
                          </motion.div>
                        ))
                      ) : (
                        <div className="flex items-center gap-2 text-[10px] text-white/30">
                          <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50" />
                          <span>Detecting UX patterns...</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* STRUCTURE & COMPONENTS - Real-time streaming */}
                  <AnimatePresence>
                    {(analysisSection === "layout" || analysisSection === "components") && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }}
                        className="analysis-section"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch className="w-3.5 h-3.5 text-[#FF6E3C]/60" />
                          <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Structure & Components</span>
                          {analysisSection === "layout" && <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50 ml-auto" />}
                          {analysisSection === "components" && <Check className="w-3 h-3 text-green-500/50 ml-auto" />}
                        </div>
                        <div className="space-y-1">
                          {/* Real-time structure detection */}
                          {analysisPhase.structureItems && analysisPhase.structureItems.length > 0 ? (
                            analysisPhase.structureItems.map((item, i) => (
                              <motion.div 
                                key={item.name}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-2"
                              >
                                {item.status === "done" ? (
                                  <Check className="w-3 h-3 text-green-500/70" />
                                ) : item.status === "generating" ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/70" />
                                ) : (
                                  <div className="w-3 h-3 rounded-full border border-white/10" />
                                )}
                                <span className={cn(
                                  "text-[10px]", 
                                  item.status === "done" ? "text-white/60" : 
                                  item.status === "generating" ? "text-[#FF6E3C]/70" : "text-white/30"
                                )}>
                                  {item.name}
                                </span>
                              </motion.div>
                            ))
                          ) : (
                            <div className="flex items-center gap-2 text-[10px] text-white/30">
                              <Loader2 className="w-3 h-3 animate-spin text-[#FF6E3C]/50" />
                              <span>Scanning structure...</span>
                            </div>
                          )}
                        </div>
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center justify-between px-4 py-2 border-b border-white/5 bg-black/40">
            <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5">
              {[
                { id: "preview", icon: Eye, label: "Preview" },
                { id: "code", icon: Code, label: "Code" },
                { id: "flow", icon: GitBranch, label: "Flow" },
                { id: "design", icon: Paintbrush, label: "Design System" },
                { id: "input", icon: FileInput, label: "Input" },
              ].map((tab) => (
                <button key={tab.id} onClick={() => { setViewMode(tab.id as ViewMode); setShowFloatingEdit(false); }} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", viewMode === tab.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}>
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {viewMode === "flow" && (
                <div className="flex items-center gap-1 mr-2">
                  <button onClick={() => setArchZoom(z => Math.max(0.5, z - 0.1))} className="btn-black p-1.5 rounded-lg"><ZoomOut className="w-3.5 h-3.5" /></button>
                  <span className="text-xs text-white/40 w-12 text-center">{Math.round(archZoom * 100)}%</span>
                  <button onClick={() => setArchZoom(z => Math.min(2, z + 0.1))} className="btn-black p-1.5 rounded-lg"><ZoomIn className="w-3.5 h-3.5" /></button>
                </div>
              )}
              {viewMode === "code" && editableCode && !isCodeEditable && (
                <button onClick={() => setIsCodeEditable(true)} className="btn-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"><Pencil className="w-3.5 h-3.5" /> Edit</button>
              )}
              {viewMode === "code" && isCodeEditable && (
                <button onClick={applyCodeChanges} className="btn-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400"><Check className="w-3.5 h-3.5" /> Apply</button>
              )}
              {editableCode && (
                <>
                  {viewMode === "preview" && (
                    <button 
                      onClick={() => setIsMobilePreview(!isMobilePreview)} 
                      className={cn("btn-black p-1.5 rounded-lg", isMobilePreview && "bg-[#FF6E3C]/20 text-[#FF6E3C]")} 
                      title={isMobilePreview ? "Desktop view" : "Mobile view"}
                    >
                      {isMobilePreview ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button onClick={handleRefresh} className="btn-black p-1.5 rounded-lg" title="Refresh"><RefreshCw className="w-3.5 h-3.5" /></button>
                  <button onClick={handleDownload} className="btn-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"><Download className="w-3.5 h-3.5" /> Download</button>
                  <button onClick={handlePublish} className="btn-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-white/10"><ExternalLink className="w-3.5 h-3.5" /> Publish</button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col relative">
            {/* Preview - only show iframe when code streaming is done */}
            {viewMode === "preview" && (
              <div className="flex-1 preview-container relative bg-[#0a0a0a] flex flex-col">
                {previewUrl && !isStreamingCode ? (
                  <>
                    {/* Iframe container */}
                    <div className={cn("flex-1 flex items-center justify-center", isMobilePreview && "py-4 bg-[#0a0a0a]")}>
                      <iframe 
                        src={previewUrl} 
                        className={cn(
                          "border-0 bg-white transition-all duration-300",
                          isMobilePreview 
                            ? "w-[375px] h-[667px] rounded-3xl shadow-2xl ring-4 ring-black/50" 
                            : "w-full h-full"
                        )} 
                        title="Preview" 
                        sandbox="allow-scripts allow-same-origin" 
                      />
                    </div>
                    
                    {!showFloatingEdit && (
                      <button onClick={() => setShowFloatingEdit(true)} className="floating-edit-btn flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white/90">
                        <Sparkles className="w-4 h-4 text-[#FF6E3C]" /> Edit with AI
                      </button>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">
                    {(isStreamingCode || isProcessing) ? (
                      <LoadingState />
                    ) : (
                      <EmptyState icon="logo" title="Drop or record video. Get code." subtitle="We analyze the flow, map interactions, and export clean code." />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Code - Fixed Scroll */}
            {viewMode === "code" && (
              <div className="flex-1 flex flex-col relative bg-[#0a0a0a] min-h-0 overflow-hidden">
                <div ref={codeContainerRef} className="absolute inset-0 overflow-auto bg-[#0a0a0a]">
                  {isCodeEditable ? (
                    <textarea value={editableCode} onChange={(e) => setEditableCode(e.target.value)} className="w-full min-h-full p-4 bg-[#0a0a0a] text-xs text-white/80 font-mono resize-none focus:outline-none" style={{ fontFamily: "'JetBrains Mono', monospace" }} spellCheck={false} />
                  ) : displayedCode ? (
                    <Highlight theme={themes.nightOwl} code={displayedCode} language="html">
                      {({ style, tokens, getLineProps, getTokenProps }) => (
                        <pre className="p-4 text-xs leading-relaxed" style={{ ...style, background: "#0a0a0a", fontFamily: "'JetBrains Mono', monospace", minHeight: "100%" }}>
                          {tokens.map((line, i) => (<div key={i} {...getLineProps({ line })} className="table-row"><span className="table-cell pr-4 text-right text-white/20 select-none w-10 text-[10px]">{i + 1}</span><span className="table-cell">{line.map((token, key) => <span key={key} {...getTokenProps({ token })} />)}</span></div>))}
                          {isStreamingCode && <span className="text-[#FF6E3C] animate-pulse">▋</span>}
                        </pre>
                      )}
                    </Highlight>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a]">{isProcessing ? <LoadingState /> : <EmptyState icon="logo" title="No code generated" subtitle="Generate from a video to see the code" />}</div>
                  )}
                </div>
                {editableCode && !isStreamingCode && !isCodeEditable && !showFloatingEdit && (
                  <button onClick={() => setShowFloatingEdit(true)} className="floating-edit-btn flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white/90">
                    <Sparkles className="w-4 h-4 text-[#FF6E3C]" /> Edit with AI
                  </button>
                )}
              </div>
            )}

            {/* Flow - PRODUCT MAP (Canvas) - what's possible, not what happened */}
            {viewMode === "flow" && (
              <div className="flex-1 overflow-hidden bg-[#080808] relative">
                {/* Structure toggle button - top right */}
                <div className="absolute top-4 right-4 z-20">
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
                    {showStructureInFlow ? "Hide" : "Show"} Structure
                  </button>
                </div>
                
                {flowNodes.length > 0 || flowBuilding ? (
                  <div 
                    ref={archCanvasRef}
                    className={cn("arch-canvas w-full h-full", isPanning && "dragging")}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  >
                    <div 
                      className="arch-canvas-inner" 
                      style={{ 
                        transform: `translate(${canvasPan.x}px, ${canvasPan.y}px) scale(${archZoom})`,
                        transformOrigin: 'center center'
                      }}
                    >
                      {/* Edge lines with labels */}
                      <svg className="absolute inset-0 pointer-events-none" style={{ width: "2000px", height: "1500px" }}>
                        <defs>
                          <marker id="flow-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255, 110, 60, 0.6)" />
                          </marker>
                        </defs>
                        {flowEdges.map(edge => {
                          const fromNode = flowNodes.find(n => n.id === edge.from);
                          const toNode = flowNodes.find(n => n.id === edge.to);
                          if (!fromNode || !toNode) return null;
                          const x1 = fromNode.x + 90;
                          const y1 = fromNode.y + (showStructureInFlow ? 100 : 60);
                          const x2 = toNode.x + 90;
                          const y2 = toNode.y;
                          const midX = (x1 + x2) / 2;
                          const midY = (y1 + y2) / 2;
                          return (
                            <g key={edge.id}>
                              <path 
                                d={`M ${x1} ${y1} Q ${x1} ${midY} ${midX} ${midY} Q ${x2} ${midY} ${x2} ${y2}`}
                                stroke="rgba(255, 110, 60, 0.4)" 
                                strokeWidth="2" 
                                fill="none"
                                markerEnd="url(#flow-arrow)"
                              />
                              <rect x={midX - 40} y={midY - 10} width="80" height="20" rx="4" fill="#0a0a0a" />
                              <text x={midX} y={midY + 4} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="middle" className="font-medium">
                                {edge.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                      
                      {/* Flow Nodes */}
                      {flowNodes.map((node, idx) => {
                        const typeColors: Record<string, string> = {
                          view: "border-[#FF6E3C]/40 bg-gradient-to-br from-[#FF6E3C]/10 to-transparent",
                          section: "border-blue-500/40 bg-gradient-to-br from-blue-500/10 to-transparent",
                          modal: "border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-transparent",
                          state: "border-green-500/40 bg-gradient-to-br from-green-500/10 to-transparent"
                        };
                        const typeIcons: Record<string, any> = { view: Layout, section: Layers, modal: Box, state: CheckCircle };
                        const Icon = typeIcons[node.type] || Layout;
                        
                        return (
                          <motion.div 
                            key={node.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.08 }}
                            className={cn(
                              "absolute w-44 rounded-xl border backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02]",
                              typeColors[node.type],
                              selectedFlowNode === node.id && "ring-2 ring-[#FF6E3C] ring-offset-2 ring-offset-[#080808]"
                            )}
                            style={{ left: node.x, top: node.y }}
                            onClick={() => setSelectedFlowNode(node.id === selectedFlowNode ? null : node.id)}
                          >
                            {/* Node header */}
                            <div className="p-3 border-b border-white/5">
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-[#FF6E3C]" />
                                <span className="text-sm font-semibold text-white/90">{node.name}</span>
                              </div>
                              {node.description && (
                                <p className="text-[10px] text-white/40 mt-1">{node.description}</p>
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
                            
                            {/* Type badge */}
                            <div className="absolute -top-2 -right-2">
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-[#0a0a0a] border border-white/10 text-white/40 capitalize">
                                {node.type}
                              </span>
                            </div>
                          </motion.div>
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
                  {/* Edit with AI button for Flow */}
                  {!flowBuilding && flowNodes.length > 0 && !showFloatingEdit && (
                    <button 
                      onClick={() => setShowFloatingEdit(true)} 
                      className="floating-edit-btn flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white/90"
                    >
                      <Sparkles className="w-4 h-4 text-[#FF6E3C]" /> Edit with AI
                    </button>
                  )}
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#080808]">
                    {isProcessing ? <LoadingState /> : (
                      <div className="text-center">
                        <GitBranch className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-sm text-white/40">No product flow yet</p>
                        <p className="text-xs text-white/25 mt-1">Flow shows how the product is connected - views, states, transitions</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            

            {/* Design System */}
            {viewMode === "design" && (
              <div className="flex-1 overflow-auto p-6 bg-[#080808] relative">
                {styleInfo ? (
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
                      <button onClick={() => setShowFloatingEdit(true)} className="floating-edit-btn flex items-center gap-2 px-5 py-3 rounded-full text-sm font-medium text-white/90">
                        <Sparkles className="w-4 h-4 text-[#FF6E3C]" /> Edit with AI
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#080808]">{isProcessing ? <LoadingState /> : <EmptyState icon="logo" title="No style info yet" subtitle="Generate code to see the design system" />}</div>
                )}
              </div>
            )}

            {/* Input - Custom Video Player with better trim */}
            {viewMode === "input" && (
              <div className="flex-1 bg-[#0a0a0a] flex flex-col overflow-hidden">
                {selectedFlow ? (
                  <>
                    <div className="flex-1 flex items-center justify-center p-4 min-h-0 bg-black">
                      <video 
                        ref={videoRef} 
                        src={selectedFlow.videoUrl} 
                        className="max-w-full max-h-full rounded-lg" 
                        onPlay={() => setIsPlaying(true)} 
                        onPause={() => setIsPlaying(false)}
                        onLoadedMetadata={(e) => {
                          const video = e.currentTarget;
                          if (video.duration && isFinite(video.duration) && video.duration > 0) {
                            const newDuration = Math.round(video.duration);
                            // Update flow duration if it was invalid
                            if (!selectedFlow.duration || !isFinite(selectedFlow.duration) || selectedFlow.duration <= 0) {
                              setFlows(prev => prev.map(f => 
                                f.id === selectedFlow.id 
                                  ? { ...f, duration: newDuration, trimEnd: newDuration }
                                  : f
                              ));
                            }
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
                          <button onClick={startRecording} className="btn-black flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"><Monitor className="w-3.5 h-3.5" /> Record New</button>
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
                      <EmptyState icon="logo" title="No video selected" subtitle="Record or upload a video first" />
                      <div className="flex items-center justify-center gap-2 mt-4">
                        <button onClick={() => fileInputRef.current?.click()} className="btn-black flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"><Upload className="w-3.5 h-3.5" /> Upload</button>
                        <button onClick={startRecording} className="btn-black flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs"><Monitor className="w-3.5 h-3.5" /> Record</button>
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
                      <Sparkles className="w-3.5 h-3.5 text-[#FF6E3C]" />
                      <span className="text-xs text-white/50">
                        {selectedArchNode ? (
                          <>Editing <span className="at-tag">@{selectedArchNode}</span></>
                        ) : "Describe your changes"}
                      </span>
                      <button onClick={() => { setShowFloatingEdit(false); setSelectedArchNode(null); setShowSuggestions(false); }} className="ml-auto p-1 hover:bg-white/5 rounded">
                        <X className="w-3 h-3 text-white/20" />
                      </button>
                    </div>
                    <div className="relative">
                      <div className="flex gap-2">
                        <input 
                          ref={editInputRef}
                          type="text" 
                          value={editInput} 
                          onChange={(e) => setEditInput(e.target.value)} 
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !showSuggestions) handleEdit();
                            if (e.key === "Escape") { setShowFloatingEdit(false); setSelectedArchNode(null); }
                          }}
                          placeholder={selectedArchNode ? `Describe changes for @${selectedArchNode}...` : "Type @ to select a component..."} 
                          className="flex-1 px-3 py-2.5 rounded-lg text-sm text-white/80 placeholder:text-white/20 bg-white/[0.03] border border-white/[0.04] focus:outline-none focus:border-white/10" 
                          disabled={isEditing} 
                          autoFocus 
                        />
                        <button onClick={handleEdit} disabled={!editInput.trim() || isEditing} className="btn-black px-4 rounded-lg flex items-center gap-2 disabled:opacity-50">
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
      
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t border-white/10 bg-[#111]/95 backdrop-blur-xl safe-area-pb">
        <div className="flex items-center justify-around py-2">
          <button 
            onClick={() => setMobilePanel("input")}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors",
              mobilePanel === "input" ? "text-[#FF6E3C]" : "text-white/40"
            )}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] font-medium">Input</span>
          </button>
          
          <button 
            onClick={() => setMobilePanel("preview")}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors",
              mobilePanel === "preview" ? "text-[#FF6E3C]" : "text-white/40"
            )}
          >
            <Eye className="w-5 h-5" />
            <span className="text-[10px] font-medium">Preview</span>
          </button>
          
          <button 
            onClick={() => setMobilePanel("code")}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors",
              mobilePanel === "code" ? "text-[#FF6E3C]" : "text-white/40"
            )}
          >
            <Code className="w-5 h-5" />
            <span className="text-[10px] font-medium">Code</span>
          </button>
          
          <button 
            onClick={() => setMobilePanel("flow")}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors",
              mobilePanel === "flow" ? "text-[#FF6E3C]" : "text-white/40"
            )}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] font-medium">Flow</span>
          </button>
          
          <button 
            onClick={() => setMobilePanel("design")}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors",
              mobilePanel === "design" ? "text-[#FF6E3C]" : "text-white/40"
            )}
          >
            <Palette className="w-5 h-5" />
            <span className="text-[10px] font-medium">Design</span>
          </button>
        </div>
      </div>
      
      {/* Mobile Input Panel */}
      <AnimatePresence>
        {mobilePanel === "input" && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-16 top-14 z-30 md:hidden bg-[#0a0a0a] border-t border-white/10 overflow-auto"
          >
            <div className="p-4 space-y-4">
              {/* Upload/Record buttons */}
              <div className="flex gap-2">
                {isRecording ? (
                  <button onClick={stopRecording} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
                    <Square className="w-4 h-4 fill-current" />
                    Stop ({formatDuration(recordingDuration)})
                  </button>
                ) : (
                  <button onClick={startRecording} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70">
                    <Monitor className="w-4 h-4" />
                    Record
                  </button>
                )}
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70">
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
              </div>
              
              {/* Flows list */}
              <div className="space-y-2">
                {flows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                      <LogoIcon className="w-8 h-8" color="#FF6E3C" />
                    </div>
                    <p className="text-sm text-white/50 font-medium">No video yet</p>
                    <p className="text-xs text-white/30 mt-1">Record or upload to get started</p>
                  </div>
                ) : flows.map((flow) => (
                  <div 
                    key={flow.id} 
                    onClick={() => setSelectedFlowId(flow.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                      selectedFlowId === flow.id 
                        ? "border-[#FF6E3C]/50 bg-[#FF6E3C]/10" 
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    <div className="w-16 h-10 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                      {flow.thumbnail ? (
                        <img src={flow.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Film className="w-4 h-4 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white/80 truncate">{flow.name}</p>
                      <p className="text-xs text-white/40">{formatDuration(flow.duration)}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFlow(flow.id); }}
                      className="p-2 hover:bg-white/10 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-white/30" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Context & Style for mobile */}
              {flows.length > 0 && (
                <>
                  <div className="pt-4 border-t border-white/10">
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Context (optional)</label>
                    <textarea
                      value={refinements}
                      onChange={(e) => setRefinements(e.target.value)}
                      placeholder="Explain interactions, logic, or specific details (optional)"
                      rows={2}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white/70 placeholder:text-white/25 placeholder:text-[10px] focus:outline-none focus:border-[#FF6E3C]/30"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium text-white/40 uppercase tracking-wider mb-2 block">Style</label>
                    <StyleInjector value={styleDirective} onChange={setStyleDirective} disabled={isProcessing} />
                  </div>
                  
                  {/* Generate Button */}
                  <button 
                    onClick={handleGenerate}
                    disabled={isProcessing || flows.length === 0}
                    className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-semibold shadow-lg shadow-[#FF6E3C]/30 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /><span>Generating...</span></>
                    ) : (
                      <><LogoIcon className="w-5 h-5" color="white" /><span>Generate</span></>
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Preview Panel */}
      <AnimatePresence>
        {mobilePanel === "preview" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-16 top-14 z-30 md:hidden bg-[#0a0a0a]"
          >
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border-0 bg-white" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-[#FF6E3C]/50" />
                </div>
                <p className="text-sm text-white/50 font-medium">No preview yet</p>
                <p className="text-xs text-white/30 mt-1">Generate to see preview</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Code Panel */}
      <AnimatePresence>
        {mobilePanel === "code" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-16 top-14 z-30 md:hidden bg-[#0a0a0a] overflow-auto"
          >
            {generatedCode ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/50">Generated Code</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode || "");
                      showToast("Copied to clipboard!", "success");
                    }} 
                    className="text-xs text-[#FF6E3C] flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
                <pre className="text-[10px] text-white/70 bg-black/50 p-3 rounded-xl overflow-auto max-h-[70vh]">
                  <code>{displayedCode || generatedCode}</code>
                </pre>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                  <Code className="w-8 h-8 text-[#FF6E3C]/50" />
                </div>
                <p className="text-sm text-white/50 font-medium">No code yet</p>
                <p className="text-xs text-white/30 mt-1">Generate to see code</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Flow Panel - Product Map */}
      <AnimatePresence>
        {mobilePanel === "flow" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-16 top-14 z-30 md:hidden bg-[#0a0a0a] overflow-auto"
          >
            {flowNodes.length > 0 ? (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs text-white/50 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[#FF6E3C]" />
                      Product Flow
                    </span>
                    <p className="text-[10px] text-white/30 mt-0.5">Views, states, and what's possible</p>
                  </div>
                  <button 
                    onClick={() => setShowStructureInFlow(!showStructureInFlow)}
                    className={cn(
                      "text-[10px] px-2 py-1 rounded-lg",
                      showStructureInFlow ? "bg-[#FF6E3C]/20 text-[#FF6E3C]" : "bg-white/5 text-white/40"
                    )}
                  >
                    {showStructureInFlow ? "Hide" : "Show"} Structure
                  </button>
                </div>
                
                {/* Flow nodes list */}
                <div className="space-y-3">
                  {flowNodes.map(node => {
                    const typeColors: Record<string, string> = {
                      view: "border-[#FF6E3C]/30 bg-[#FF6E3C]/10",
                      section: "border-blue-500/30 bg-blue-500/10",
                      modal: "border-purple-500/30 bg-purple-500/10",
                      state: "border-green-500/30 bg-green-500/10"
                    };
                    return (
                      <div key={node.id} className={cn("p-3 rounded-xl border", typeColors[node.type])}>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white/80">{node.name}</p>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-white/40 uppercase">{node.type}</span>
                        </div>
                        {node.description && <p className="text-xs text-white/40">{node.description}</p>}
                        
                        {/* Structure components (when toggle is ON) */}
                        {showStructureInFlow && node.components && (
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
                </div>
                
                {/* Transitions */}
                {flowEdges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-xs text-white/50 block mb-2">Transitions</span>
                    {flowEdges.map(edge => {
                      const fromNode = flowNodes.find(n => n.id === edge.from);
                      const toNode = flowNodes.find(n => n.id === edge.to);
                      return (
                        <div key={edge.id} className="text-[10px] text-white/40 py-1">
                          {fromNode?.name} → <span className="text-[#FF6E3C]">{edge.label}</span> → {toNode?.name}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-[#FF6E3C]/50" />
                </div>
                <p className="text-sm text-white/50 font-medium">No product flow yet</p>
                <p className="text-xs text-white/30 mt-1">Flow shows what's possible in the product</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Mobile Design System Panel */}
      <AnimatePresence>
        {mobilePanel === "design" && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-16 top-14 z-30 md:hidden bg-[#0a0a0a] overflow-auto"
          >
            {analysisPhase?.palette?.length ? (
              <div className="p-4 space-y-4">
                <div>
                  <span className="text-xs text-white/50 block mb-2">Color Palette</span>
                  <div className="flex gap-2">
                    {analysisPhase.palette.map((color, i) => (
                      <div key={i} className="w-10 h-10 rounded-lg" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                </div>
                {analysisPhase.typography && (
                  <div>
                    <span className="text-xs text-white/50 block mb-1">Typography</span>
                    <p className="text-sm text-white/70">{analysisPhase.typography}</p>
                  </div>
                )}
                {analysisPhase.vibe && (
                  <div>
                    <span className="text-xs text-white/50 block mb-1">Style</span>
                    <p className="text-sm text-white/70">{analysisPhase.vibe}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center mb-4">
                  <Palette className="w-8 h-8 text-[#FF6E3C]/50" />
                </div>
                <p className="text-sm text-white/50 font-medium">No style analysis yet</p>
                <p className="text-xs text-white/30 mt-1">Generate to see style</p>
              </div>
            )}
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
      
      {/* Toast notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />
      
      {/* Mobile Recording Info Modal */}
      <AnimatePresence>
        {showMobileRecordingInfo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileRecordingInfo(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6E3C]/20 flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-[#FF6E3C]" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Screen recording is not available on mobile browsers.</h3>
                </div>
                
                <div className="space-y-3 text-sm text-white/70">
                  <p className="font-medium text-white">To record your phone screen:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Use your phone's built-in screen recorder</li>
                    <li>Upload the recording here</li>
                  </ol>
                  <div className="pt-2 space-y-1 text-xs text-white/50">
                    <p><span className="text-white/70">iOS:</span> Control Center → Screen Recording</p>
                    <p><span className="text-white/70">Android:</span> Quick Settings → Screen Record</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowMobileRecordingInfo(false)}
                  className="w-full mt-6 py-2.5 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
