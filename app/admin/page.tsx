"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users, Code, Activity, TrendingUp, Clock,
  Eye, EyeOff, LogOut, Search, ChevronDown,
  BarChart3, Zap, CreditCard, Video, Palette,
  Calendar, ArrowUpRight, Filter, Download,
  User, Mail, Shield, AlertTriangle, Loader2,
  DollarSign, Cpu, MessageSquare, ThumbsUp, ThumbsDown, Meh,
  Play, FileText, PenSquare, Trash2, Plus, Send, Sparkles, Check, X, ExternalLink,
  Layers, GitBranch, Monitor, Maximize2, Copy, Menu, Target, TrendingDown, RefreshCw, BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
// DitheringShader removed for performance - heavy WebGL shader was causing lag

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  credits_free: number;
  credits_purchased: number;
  membership: string;
  generations_count: number;
}

interface GenerationData {
  id: string;
  user_id: string;
  user_email?: string;
  created_at: string;
  video_duration: number | null;
  style_directive: string | null;
  status: string;
  credits_used: number;
  code?: string;
  title?: string;
  video_url?: string;
  design_system?: {
    colors?: string[];
    fonts?: string[];
    styleName?: string;
    stylePreset?: string;
  } | null;
  architecture?: {
    flowNodes?: Array<{ id: string; type?: string; data?: { label?: string } }>;
    flowEdges?: Array<{ id: string; source: string; target: string }>;
  } | null;
}

interface Stats {
  totalUsers: number;
  totalGenerations: number;
  totalCreditsUsed: number;
  totalTokensUsed: number;
  estimatedCostUSD: number;
  estimatedCostPLN: number;
  costPerGeneration: number;
  generationsWithTokenTracking: number;
  avgTokensPerGeneration: number;
  activeToday: number;
  avgGenerationsPerUser: number;
  topStyles: { style: string; count: number }[];
  generationsPerDay: { date: string; count: number }[];
  proUsers: number;
}

interface FeedbackData {
  id: string;
  user_id: string | null;
  generation_id: string | null;
  rating: "yes" | "kinda" | "no";
  feedback_text: string | null;
  dismissed: boolean;
  created_at: string;
}

interface FeedbackStats {
  total: number;
  yes: number;
  kinda: number;
  no: number;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  target_keyword: string;
  tone: string;
  status: 'draft' | 'review' | 'published';
  read_time_minutes: number;
  seo_score: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  devto_url: string | null;
  hashnode_url: string | null;
}

// Gemini API cost estimation (based on actual Google AI Studio billing)
// gemini-3-pro: ~$304 / 500 generations = $0.61 per generation
const ESTIMATED_COST_PER_GENERATION_USD = 0.61;
const USD_TO_PLN = 4.05;

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  
  // Plan selection modal state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalUser, setPlanModalUser] = useState<{ id: string; email: string; membership: string } | null>(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [generations, setGenerations] = useState<GenerationData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "generations" | "feedback" | "content" | "viral" | "aeo">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [previewGeneration, setPreviewGeneration] = useState<GenerationData | null>(null);
  const [previewTab, setPreviewTab] = useState<"preview" | "input" | "code" | "library" | "flow">("preview");
  
  // Content Engine state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogTotal, setBlogTotal] = useState(0);
  const [blogLoading, setBlogLoading] = useState(false);
  const [generateTitles, setGenerateTitles] = useState("");
  const [generateKeyword, setGenerateKeyword] = useState("");
  const [generateTone, setGenerateTone] = useState<"technical" | "controversial" | "tutorial" | "comparison" | "ai-optimized">("technical");
  const [generateTakeaways, setGenerateTakeaways] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResults, setGenerateResults] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [blogFilter, setBlogFilter] = useState<"all" | "draft" | "review" | "published">("all");
  const [blogPage, setBlogPage] = useState(0);
  const [blogSort, setBlogSort] = useState<"created_at" | "published_at" | "title" | "seo_score">("created_at");
  const [blogOrder, setBlogOrder] = useState<"asc" | "desc">("desc");
  const [blogSearch, setBlogSearch] = useState("");
  const BLOG_PAGE_SIZE = 100;
  const [autoMode, setAutoMode] = useState(true); // Auto-generate mode (AI picks topics)
  const [autoCount, setAutoCount] = useState(10); // Number of articles to auto-generate
  const [showMobileSidebar, setShowMobileSidebar] = useState(false); // Mobile sidebar state
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, currentTitle: "" });
  const [bgQueue, setBgQueue] = useState<{ processed: number; total: number; batchId: string; results: any[] } | null>(null);

  // Crosspost state
  const [crosspostStats, setCrosspostStats] = useState<{ totalPublished: number; devto: { posted: number; remaining: number }; hashnode: { posted: number; remaining: number }; configured: { devto: boolean; hashnode: boolean } } | null>(null);
  const [crossposting, setCrossposting] = useState<string | null>(null); // "devto" | "hashnode" | "all" | null
  const [crosspostLog, setCrosspostLog] = useState<string[]>([]);

  // Viral Post Generator state
  const [viralSubTab, setViralSubTab] = useState<"posts" | "replies" | "daily" | "accounts">("posts");
  const [viralContext, setViralContext] = useState("");
  const [viralCategory, setViralCategory] = useState<"arrogant" | "numbers" | "contrarian" | "philosophy">("arrogant");

  // AEO (AI Engine Optimization) state
  const [aeoData, setAeoData] = useState<any>(null);
  const [aeoLoading, setAeoLoading] = useState(false);
  const [aeoAutoPublish, setAeoAutoPublish] = useState(false);
  const [selectedGap, setSelectedGap] = useState<any>(null);
  const [viralTone, setViralTone] = useState<"aggressive" | "data-driven" | "philosophical" | "meme">("aggressive");
  const [viralAssetUrl, setViralAssetUrl] = useState("");
  const [isGeneratingViral, setIsGeneratingViral] = useState(false);
  const [viralResults, setViralResults] = useState<{
    posts: Array<{
      content: string;
      viralScore: number;
      hooks: string[];
      callToAction: string;
      charCount: number;
    }>;
    altText: string | null;
    bestPick: number;
  } | null>(null);
  const [copiedPostIndex, setCopiedPostIndex] = useState<number | null>(null);
  
  // Reply Generator state
  const [replyOriginalTweet, setReplyOriginalTweet] = useState("");
  const [replyOriginalAuthor, setReplyOriginalAuthor] = useState("");
  const [isGeneratingReply, setIsGeneratingReply] = useState(false);
  const [replyResults, setReplyResults] = useState<{
    replies: Array<{
      content: string;
      type: string;
      engagementPotential: string;
      rationale: string;
    }>;
    bestPick: number;
    suggestedFollowUp: string | null;
  } | null>(null);
  
  // Daily Plan state
  const [dailyPlanActivity, setDailyPlanActivity] = useState("");
  const [isGeneratingDailyPlan, setIsGeneratingDailyPlan] = useState(false);
  const [dailyPlan, setDailyPlan] = useState<{
    date: string;
    theme: string;
    tasks: Array<{ time: string; action: string; description: string; priority: string }>;
    accountsToEngage: Array<{ handle: string; reason: string; suggestedApproach: string }>;
    contentIdeas: string[];
    tip: string;
  } | null>(null);
  
  // Accounts list state
  const [accountsList, setAccountsList] = useState<any>(null);
  const [accountsFilter, setAccountsFilter] = useState<"all" | "tier1" | "tier2" | "tier3" | "techAI">("all");
  
  // Toast message for styled alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load admin data with token
  const loadAdminData = useCallback(async (token: string) => {
    setDataLoading(true);
    try {
      // Load main admin data
      const response = await fetch("/api/admin/data", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setGenerations(data.generations || []);
        setStats(data.stats || null);
      } else if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("replay_admin_token");
        setIsAuthenticated(false);
        setAdminToken(null);
        return;
      }
      
      // Load feedback data
      const feedbackResponse = await fetch("/api/feedback", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (feedbackResponse.ok) {
        const feedbackData = await feedbackResponse.json();
        setFeedback(feedbackData.feedback || []);
        setFeedbackStats(feedbackData.stats || null);
        if (feedbackData.error) {
          setFeedbackError(feedbackData.error);
        } else {
          setFeedbackError(null);
        }
      } else {
        setFeedbackError("Failed to load feedback data");
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Check if already authenticated
  useEffect(() => {
    const savedToken = localStorage.getItem("replay_admin_token");
    if (savedToken) {
      setAdminToken(savedToken);
      setIsAuthenticated(true);
      loadAdminData(savedToken);
    }
    setIsLoading(false);
  }, [loadAdminData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        localStorage.setItem("replay_admin_token", data.token);
        setAdminToken(data.token);
        setIsAuthenticated(true);
        loadAdminData(data.token);
      } else {
        setLoginError(data.error || "Invalid credentials");
      }
    } catch (error) {
      setLoginError("Login failed. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("replay_admin_token");
    setIsAuthenticated(false);
    setAdminToken(null);
    setUsers([]);
    setGenerations([]);
    setStats(null);
  };

  // Load blog posts
  const loadBlogPosts = useCallback(async (token: string) => {
    setBlogLoading(true);
    try {
      const offset = blogPage * BLOG_PAGE_SIZE;
      const params = new URLSearchParams({
        status: blogFilter,
        limit: String(BLOG_PAGE_SIZE),
        offset: String(offset),
        sort: blogSort,
        order: blogOrder,
        ...(blogSearch && { search: blogSearch }),
      });
      const response = await fetch(`/api/admin/blog?${params}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBlogPosts(data.posts || []);
        setBlogTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error loading blog posts:", error);
    } finally {
      setBlogLoading(false);
    }
  }, [blogFilter, blogPage, blogSort, blogOrder, blogSearch]);

  // Load crosspost stats
  const loadCrosspostStats = useCallback(async (token: string) => {
    try {
      const resp = await fetch("/api/aeo/crosspost-bulk", { headers: { "Authorization": `Bearer ${token}` } });
      if (resp.ok) setCrosspostStats(await resp.json());
    } catch {}
  }, []);

  // Run bulk crosspost
  const runBulkCrosspost = useCallback(async (platform: "devto" | "hashnode" | "all") => {
    if (!adminToken || crossposting) return;
    setCrossposting(platform);
    setCrosspostLog([`Starting bulk crosspost to ${platform}...`]);
    let totalProcessed = 0;
    let keepGoing = true;

    while (keepGoing) {
      try {
        const resp = await fetch("/api/aeo/crosspost-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` },
          body: JSON.stringify({ platform, batchSize: 10 }),
        });
        const data = await resp.json();
        if (!data.success) { setCrosspostLog(l => [...l, `Error: ${data.error}`]); break; }

        totalProcessed += data.processed;
        for (const r of data.results) {
          setCrosspostLog(l => [...l, r.url ? `✅ ${r.platform}: ${r.slug} → ${r.url}` : `⚠️ ${r.platform}: ${r.slug} — ${r.error}`]);
        }
        setCrosspostLog(l => [...l, `Batch done. Total: ${totalProcessed}. Remaining: Dev.to=${data.remaining.devto}, Hashnode=${data.remaining.hashnode}`]);

        const remaining = platform === "devto" ? data.remaining.devto : platform === "hashnode" ? data.remaining.hashnode : data.remaining.devto + data.remaining.hashnode;
        if (data.processed === 0 || remaining === 0) keepGoing = false;

        // Brief pause between batches
        await new Promise(r => setTimeout(r, 2000));
      } catch (e: any) {
        setCrosspostLog(l => [...l, `Fatal: ${e.message}`]);
        keepGoing = false;
      }
    }

    setCrosspostLog(l => [...l, `Done! ${totalProcessed} articles crossposted.`]);
    setCrossposting(null);
    loadCrosspostStats(adminToken);
    loadBlogPosts(adminToken);
  }, [adminToken, crossposting, loadCrosspostStats, loadBlogPosts]);

  // Poll background queue progress
  const pollBgQueue = useCallback(async () => {
    if (!adminToken) return;
    try {
      const res = await fetch("/api/aeo/dashboard", { headers: { "Authorization": `Bearer ${adminToken}` } });
      if (!res.ok) return;
      const data = await res.json();
      const q = data.config?.content_queue;
      if (q && q.total > 0) {
        setBgQueue({ processed: q.processed, total: q.total, batchId: q.batchId, results: q.results || [] });
        if (q.processed >= q.total) {
          // Done — clear after showing
          setTimeout(() => setBgQueue(null), 5000);
          loadBlogPosts(adminToken);
        }
      } else {
        setBgQueue(null);
      }
    } catch {}
  }, [adminToken, loadBlogPosts]);

  // Auto-poll queue when on Content tab
  useEffect(() => {
    if (activeTab !== "content" || !adminToken) return;
    pollBgQueue(); // Check immediately
    const interval = setInterval(pollBgQueue, 8000); // Poll every 8s
    return () => clearInterval(interval);
  }, [activeTab, adminToken, pollBgQueue]);

  // Generate articles — enqueues to background server-side cron
  const handleGenerateArticles = async () => {
    if (!adminToken) return;

    // Manual mode validation
    if (!autoMode) {
      if (!generateTitles.trim()) return;
      const titleList = generateTitles.split('\n').filter(t => t.trim()).map(t => t.trim());
      if (titleList.length === 0) return;
    }

    // Auto mode validation
    if (autoMode && autoCount < 1) {
      setToastMessage("❌ Enter at least 1 article");
      return;
    }

    setIsGenerating(true);
    setGenerateResults([]);
    setGenerationProgress({ current: 0, total: 0, currentTitle: "Getting topics..." });

    try {
      let titlesToGenerate: string[] = [];

      if (autoMode) {
        // First, get AI-generated topics
        const topicsResponse = await fetch("/api/admin/generate-article", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminToken}`
          },
          body: JSON.stringify({
            getTopicsOnly: true,
            autoCount: autoCount,
            targetKeyword: generateKeyword.trim() || undefined,
            tone: generateTone,
            topicStyle: generateTone === "ai-optimized" ? "ai-optimized" : "default",
          })
        });

        const topicsData = await topicsResponse.json();
        titlesToGenerate = topicsData.topics || [];

        if (titlesToGenerate.length === 0) {
          throw new Error("No topics generated");
        }
      } else {
        titlesToGenerate = generateTitles.split('\n').filter(t => t.trim()).map(t => t.trim());
      }

      setGenerationProgress({ current: 0, total: titlesToGenerate.length, currentTitle: `Queuing ${titlesToGenerate.length} articles...` });

      // Enqueue to background server-side cron (no browser required!)
      const enqueueRes = await fetch("/api/admin/content-cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titles: titlesToGenerate,
          tone: generateTone,
          keyword: generateKeyword.trim() || "",
          keyTakeaways: generateTakeaways.split('\n').filter(t => t.trim()),
          adminToken,
        })
      });

      const enqueueData = await enqueueRes.json();

      if (enqueueData.success) {
        setBgQueue({ processed: 0, total: titlesToGenerate.length, batchId: enqueueData.batchId, results: [] });
        setToastMessage(`✅ Queued ${titlesToGenerate.length} articles for background generation. You can close this tab!`);
        setGenerateTitles("");
        setGenerateKeyword("");
        setGenerateTakeaways("");
      } else {
        setToastMessage(`❌ ${enqueueData.error || "Failed to queue"}`);
      }

    } catch (error: any) {
      console.error("Generation error:", error);
      setToastMessage(`❌ ${error.message}`);
    } finally {
      setIsGenerating(false);
      setGenerationProgress({ current: 0, total: 0, currentTitle: "" });
    }
  };

  // Update blog post status
  const updatePostStatus = async (id: string, status: string) => {
    if (!adminToken) return;
    try {
      const response = await fetch("/api/admin/blog", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({ id, status })
      });
      if (response.ok) {
        loadBlogPosts(adminToken);
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  };

  // Delete blog post
  const deletePost = async (id: string) => {
    if (!adminToken || !confirm("Delete this post?")) return;
    try {
      const response = await fetch(`/api/admin/blog?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (response.ok) {
        loadBlogPosts(adminToken);
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // Load blog posts when tab changes or filter changes
  useEffect(() => {
    if (activeTab === "content" && adminToken) {
      loadBlogPosts(adminToken);
      loadCrosspostStats(adminToken);
    }
  }, [activeTab, blogFilter, blogPage, blogSort, blogOrder, blogSearch, adminToken, loadBlogPosts, loadCrosspostStats]);

  // Load AEO data when tab changes
  const loadAeoData = useCallback(async () => {
    if (!adminToken) return;

    setAeoLoading(true);
    try {
      const response = await fetch("/api/aeo/dashboard", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAeoData(data);
        setAeoAutoPublish(data.config?.auto_publish_enabled === true);
      }
    } catch (error) {
      console.error("AEO data load error:", error);
    } finally {
      setAeoLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (activeTab === "aeo" && adminToken) {
      loadAeoData();
    }
  }, [activeTab, adminToken, loadAeoData]);

  // Auto-refresh AEO dashboard every 30 seconds when on AEO tab
  useEffect(() => {
    if (activeTab !== "aeo" || !adminToken) return;
    const interval = setInterval(() => {
      loadAeoData();
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, adminToken, loadAeoData]);

  const refreshData = () => {
    if (adminToken) {
      loadAdminData(adminToken);
    }
  };

  // Fix credits for a user
  const fixUserCredits = async (userEmail: string) => {
    if (!adminToken) return;
    
    const credits = prompt(`Enter credits to set for ${userEmail}:`, "100");
    if (!credits) return;
    
    const creditsNum = parseInt(credits, 10);
    if (isNaN(creditsNum) || creditsNum < 0) {
      setToastMessage("❌ Invalid credits amount");
      return;
    }
    
    try {
      const response = await fetch("/api/admin/fix-credits", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: userEmail, credits: creditsNum })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setToastMessage(`✅ Credits updated for ${userEmail} (${data.previousCredits ?? 0} → ${creditsNum})`);
        refreshData();
      } else {
        setToastMessage(`❌ Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setToastMessage(`❌ Error: ${err.message}`);
    }
  };

  // Available tiers for admin assignment - matching pricing page
  // Free: $0, 300 credits (2 generations)
  // Pro: $149/mo, 15,000 credits (~100 generations)
  // Agency: $499/mo, 60,000 credits (~400 generations)
  // Enterprise: Custom
  const PRO_TIERS = [
    { id: "free", label: "Free", credits: 300, membership: "free", isTopup: false, price: "$0" },
    { id: "pro", label: "Pro ($149/mo)", credits: 15000, membership: "pro", isTopup: false, price: "$149/mo" },
    { id: "agency", label: "Agency ($499/mo)", credits: 60000, membership: "agency", isTopup: false, price: "$499/mo" },
    { id: "enterprise", label: "Enterprise (Custom)", credits: 50000, membership: "enterprise", isTopup: false, price: "Custom" },
  ];

  // Open plan selection modal
  const openPlanModal = (userId: string, userEmail: string, currentMembership: string) => {
    const currentIndex = PRO_TIERS.findIndex(t => t.id === currentMembership);
    setSelectedPlanIndex(currentIndex >= 0 ? currentIndex : 0);
    setPlanModalUser({ id: userId, email: userEmail, membership: currentMembership });
    setPlanModalOpen(true);
  };

  // Apply selected plan
  const applySelectedPlan = async () => {
    if (!adminToken || !planModalUser) return;
    
    setIsUpdatingPlan(true);
    const selectedTier = PRO_TIERS[selectedPlanIndex];
    const newMembership = selectedTier.membership;
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          userId: planModalUser.id, 
          membership: newMembership,
          credits: selectedTier.credits,
          isTopup: selectedTier.isTopup // For top-up credits
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUsers(prev => prev.map(u => 
          u.id === planModalUser.id ? { ...u, membership: newMembership } : u
        ));
        setToastMessage(`✅ ${planModalUser.email} updated to ${selectedTier.label}`);
        setPlanModalOpen(false);
        setPlanModalUser(null);
        refreshData();
      } else {
        setToastMessage(`❌ Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setToastMessage(`❌ Error: ${err.message}`);
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  // Add credits to a user
  const addUserCredits = async (userId: string, userEmail: string) => {
    if (!adminToken) return;
    
    const credits = prompt(`Enter credits to ADD to ${userEmail}:`, "100");
    if (!credits) return;
    
    const creditsNum = parseInt(credits, 10);
    if (isNaN(creditsNum)) {
      setToastMessage("❌ Invalid credits amount");
      return;
    }
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, addCredits: creditsNum, creditType: "free" })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update local state - wallet returns topup_credits, monthly_credits etc
        const wallet = data.wallet;
        const totalCredits = (wallet?.monthly_credits || 0) + (wallet?.rollover_credits || 0) + (wallet?.topup_credits || 0);
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, credits_free: totalCredits } : u
        ));
        // Refresh data to show updated credits
        refreshData();
        setToastMessage(`✅ Added ${creditsNum} credits to ${userEmail}`);
      } else {
        setToastMessage(`❌ Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setToastMessage(`❌ Error: ${err.message}`);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGenerations = generations.filter(gen => {
    if (selectedUser && gen.user_id !== selectedUser) return false;
    if (searchQuery && !gen.user_email?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative">
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
        <div className="relative z-10 animate-spin w-8 h-8 border-2 border-zinc-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Simple gradient background */}
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg className="w-10 h-10 text-white" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="currentColor" strokeWidth="11.6182" strokeLinejoin="round"/>
              <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" fill="currentColor"/>
            </svg>
            <span className="text-2xl font-bold text-white">Admin</span>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-zinc-400" />
              <h1 className="text-xl font-semibold text-white">Admin Access</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-2">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  placeholder="admin@replay.build"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-white/50 block mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600 pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 bg-white text-black font-medium rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <p className="text-center text-white/30 text-xs mt-6">
              Restricted access. Authorized personnel only.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* Simple gradient background - removed heavy DitheringShader for performance */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileSidebar(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Left Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 w-64 bg-[#0f0f0f]/95 backdrop-blur-xl border-r border-zinc-800/50 z-40 flex flex-col transition-transform duration-300",
        "lg:translate-x-0",
        showMobileSidebar ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-3">
            <Logo />
            <span className="text-sm font-medium text-zinc-400">Admin</span>
          </Link>
          {/* Close button on mobile */}
          <button
            onClick={() => setShowMobileSidebar(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Dashboard</span>
          </div>
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "generations", label: "Generations", icon: Code },
            { id: "feedback", label: "Feedback", icon: MessageSquare },
            { id: "content", label: "Content", icon: FileText },
            { id: "viral", label: "Viral", icon: Zap },
            { id: "aeo", label: "AEO", icon: Target },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setShowMobileSidebar(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all",
                activeTab === tab.id 
                  ? "bg-zinc-800/60 text-white border-l-2 border-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border-l-2 border-transparent"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Actions at bottom */}
        <div className="p-4 border-t border-zinc-800/50 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-zinc-700 rounded-xl text-sm text-zinc-300 transition-colors"
          >
            <Play className="w-4 h-4" />
            Go to Tool
          </Link>
          <button
            onClick={refreshData}
            disabled={dataLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 transition-colors disabled:opacity-50"
          >
            <Activity className={cn("w-4 h-4", dataLoading && "animate-spin")} />
            Refresh Data
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-sm text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6 -mt-2">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-300"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-sm font-medium text-zinc-400">Admin</span>
          </div>
          <button
            onClick={refreshData}
            disabled={dataLoading}
            className="p-2 rounded-xl bg-zinc-800/50 border border-zinc-700 text-zinc-300 disabled:opacity-50"
          >
            <Activity className={cn("w-5 h-5", dataLoading && "animate-spin")} />
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={stats?.totalUsers || users.length}
                icon={Users}
                color="blue"
              />
              <StatCard
                title="Total Generations"
                value={stats?.totalGenerations || generations.length}
                icon={Code}
                color="green"
              />
              <StatCard
                title="Credits Used"
                value={stats?.totalCreditsUsed || 0}
                icon={Zap}
                color="yellow"
              />
              <StatCard
                title="Active Today"
                value={stats?.activeToday || 0}
                icon={Activity}
                color="purple"
              />
            </div>

            {/* Stats Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                title="Pro Users"
                value={stats?.proUsers || 0}
                icon={Shield}
                color="orange"
              />
              <StatCard
                title="Pro Users"
                value={0}
                icon={Zap}
                color="gray"
              />
              <StatCard
                title="Tokens Used"
                value={stats?.totalTokensUsed ? `${(stats.totalTokensUsed / 1000).toFixed(0)}K` : "0"}
                icon={Cpu}
                color="cyan"
              />
              <StatCard
                title="Est. API Cost"
                value={`$${stats?.estimatedCostUSD?.toFixed(2) || ((stats?.totalGenerations || generations.length) * ESTIMATED_COST_PER_GENERATION_USD).toFixed(2)}`}
                icon={DollarSign}
                color="green"
              />
              <StatCard
                title="Avg Gen/User"
                value={stats?.avgGenerationsPerUser || 0}
                icon={TrendingUp}
                color="pink"
              />
            </div>

            {/* API Costs Section */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-zinc-300 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-zinc-400" />
                Gemini API Costs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-500">Est. Total Cost</span>
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    ${stats?.estimatedCostUSD?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    ~{stats?.estimatedCostPLN?.toFixed(0) || "0"} PLN
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-500">Cost/Generation</span>
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    ${stats?.costPerGeneration?.toFixed(2) || "0.61"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    ~{((stats?.costPerGeneration || 0.61) * 4.05).toFixed(2)} PLN
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-500">Total Tokens</span>
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    {stats?.totalTokensUsed ? `${(stats.totalTokensUsed / 1000000).toFixed(1)}M` : "N/A"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    {stats?.generationsWithTokenTracking || 0} tracked
                  </p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-500">Avg Tokens/Gen</span>
                  </div>
                  <p className="text-2xl font-semibold text-white">
                    {stats?.avgTokensPerGeneration 
                      ? `${Math.round(stats.avgTokensPerGeneration / 1000)}K` 
                      : "~50K"}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Per generation</p>
                </div>
              </div>
              
              <p className="text-[10px] text-zinc-600 mt-4">
                * Cost based on $0.61/generation (Gemini 3 Pro). Verify in Google Cloud Console.
              </p>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generations Chart */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-zinc-400" />
                  Generations (Last 7 Days)
                </h3>
                <div className="h-48 flex items-end gap-2">
                  {(stats?.generationsPerDay || []).slice(-7).map((day, i) => {
                    const maxCount = Math.max(...(stats?.generationsPerDay || []).map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-zinc-600 rounded-t-lg transition-all"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? "8px" : "2px" }}
                        />
                        <span className="text-[10px] text-white/30">{day.date.split("-")[2]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Styles */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  Popular Styles
                </h3>
                <div className="space-y-3">
                  {(stats?.topStyles || []).slice(0, 5).map((style, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{style.style || "Default"}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-zinc-500 rounded-full"
                            style={{ width: `${(style.count / (stats?.topStyles?.[0]?.count || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/40 w-8 text-right">{style.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#71717a]" />
                Recent Generations
              </h3>
              <div className="space-y-2">
                {generations.slice(0, 10).map(gen => (
                  <div key={gen.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Video className="w-4 h-4 text-[#71717a]" />
                      </div>
                      <div>
                        <p className="text-sm text-white/70">{gen.user_email || "Unknown user"}</p>
                        <p className="text-xs text-white/30">{gen.style_directive || "No style"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50">{new Date(gen.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-white/30">{gen.credits_used} credits</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by email or ID..."
                className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#71717a]/50"
              />
            </div>

            {/* Users Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">User</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Membership</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Credits</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Generations</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Last Active</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Joined</th>
                      <th className="text-left px-4 py-3 text-xs text-white/50 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr 
                        key={user.id} 
                        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user.id);
                          setActiveTab("generations");
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#71717a] to-[#52525b] flex items-center justify-center text-white text-xs font-medium">
                              {user.email?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="text-sm text-white/80">{user.email}</p>
                              <p className="text-[10px] text-white/30 font-mono">{user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPlanModal(user.id, user.email, user.membership || "free");
                            }}
                            className={cn(
                              "text-xs px-2 py-1 rounded-full transition-colors cursor-pointer hover:opacity-80",
                              user.membership === "pro" 
                                ? "bg-[#71717a]/20 text-[#71717a] hover:bg-[#71717a]/30" 
                                : false
                                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                  : "bg-white/5 text-white/50 hover:bg-white/10"
                            )}
                            title="Click to set user plan tier"
                          >
                            {user.membership === "enterprise" ? "🏢 ENT" : user.membership === "agency" ? "🚀 AGENCY" : user.membership === "pro" ? "⭐ PRO" : "Free"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              addUserCredits(user.id, user.email);
                            }}
                            className="text-sm hover:bg-white/5 px-2 py-1 rounded transition-colors"
                            title="Click to add credits"
                          >
                            <span className="text-white/70">{user.credits_free || 0}</span>
                            <span className="text-white/30"> + </span>
                            <span className="text-[#71717a]">{user.credits_purchased || 0}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-white/70">{user.generations_count || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-white/50">
                            {user.last_sign_in_at 
                              ? new Date(user.last_sign_in_at).toLocaleDateString()
                              : "Never"
                            }
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-white/50">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fixUserCredits(user.email);
                            }}
                            className="text-xs px-2 py-1 rounded bg-[#71717a]/20 text-[#71717a] hover:bg-[#71717a]/30 transition-colors"
                          >
                            Fix Credits
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="py-12 text-center text-white/30">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Generations Tab */}
        {activeTab === "generations" && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by user email..."
                  className="w-full pl-12 pr-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#71717a]/50"
                />
              </div>
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-3 bg-[#71717a]/10 border border-[#71717a]/20 rounded-xl text-[#71717a] text-sm flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear filter
                </button>
              )}
            </div>

            {/* Generations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGenerations.map(gen => (
                <div key={gen.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#71717a]/20 to-[#52525b]/10 flex items-center justify-center">
                        <Code className="w-4 h-4 text-[#71717a]" />
                      </div>
                      <div>
                        <p className="text-xs text-white/50">{gen.user_email || "Unknown"}</p>
                        <p className="text-[10px] text-white/30 font-mono">{gen.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full",
                      gen.status === "complete" 
                        ? "bg-green-500/20 text-green-400"
                        : gen.status === "failed"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    )}>
                      {gen.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    {gen.title && (
                      <div className="flex justify-between text-xs">
                        <span className="text-white/40">Title</span>
                        <span className="text-white/70 truncate max-w-[150px]">{gen.title}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Style</span>
                      <span className="text-white/70 truncate max-w-[150px]">{gen.style_directive || "Default"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Duration</span>
                      <span className="text-white/70">{gen.video_duration ? `${gen.video_duration}s` : "N/A"}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Credits</span>
                      <span className="text-[#71717a]">{gen.credits_used}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-white/40">Date</span>
                      <span className="text-white/70">{new Date(gen.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {/* Preview Button */}
                  {gen.code && (
                    <button
                      onClick={() => setPreviewGeneration(gen)}
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#71717a]/20 text-[#71717a] hover:bg-[#71717a]/30 transition-colors text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Preview
                    </button>
                  )}
                </div>
              ))}
            </div>

            {filteredGenerations.length === 0 && (
              <div className="py-12 text-center text-white/30 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                No generations found
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="space-y-6">
            {/* Feedback Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{feedbackStats?.total || 0}</p>
                <p className="text-xs text-white/50 mt-1">Total Responses</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{feedbackStats?.yes || 0}</p>
                <p className="text-xs text-white/50 mt-1">Yes (Matched)</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
                    <Meh className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{feedbackStats?.kinda || 0}</p>
                <p className="text-xs text-white/50 mt-1">Kinda</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/10 flex items-center justify-center">
                    <ThumbsDown className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-red-400">{feedbackStats?.no || 0}</p>
                <p className="text-xs text-white/50 mt-1">No (Didn't Match)</p>
              </div>
            </div>

            {/* Satisfaction Rate */}
            {feedbackStats && feedbackStats.total > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4">Satisfaction Rate</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-4 bg-white/5 rounded-full overflow-hidden flex">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(feedbackStats.yes / feedbackStats.total) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-yellow-500" 
                      style={{ width: `${(feedbackStats.kinda / feedbackStats.total) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-red-500" 
                      style={{ width: `${(feedbackStats.no / feedbackStats.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white">
                    {Math.round(((feedbackStats.yes + feedbackStats.kinda * 0.5) / feedbackStats.total) * 100)}% positive
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-white/50">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Yes ({Math.round((feedbackStats.yes / feedbackStats.total) * 100)}%)
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    Kinda ({Math.round((feedbackStats.kinda / feedbackStats.total) * 100)}%)
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    No ({Math.round((feedbackStats.no / feedbackStats.total) * 100)}%)
                  </div>
                </div>
              </div>
            )}

            {/* Feedback List */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="p-4 border-b border-zinc-800">
                <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#71717a]" />
                  All Feedback ({feedback.length})
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {feedbackError ? (
                  <div className="py-8 text-center">
                    <p className="text-red-400 mb-2">Error loading feedback</p>
                    <p className="text-white/50 text-sm mb-4">{feedbackError}</p>
                    <div className="bg-black/30 rounded-lg p-4 text-left max-w-xl mx-auto">
                      <p className="text-xs text-white/40 mb-2">Run this SQL in Supabase SQL Editor:</p>
                      <pre className="text-xs text-white/60 overflow-x-auto whitespace-pre-wrap">{`CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating TEXT NOT NULL,
  feedback_text TEXT,
  generation_id TEXT,
  user_id TEXT,
  dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON public.feedback FOR ALL USING (true) WITH CHECK (true);`}</pre>
                    </div>
                  </div>
                ) : feedback.length === 0 ? (
                  <div className="py-12 text-center text-white/30">
                    No feedback yet
                  </div>
                ) : (
                  feedback.map((fb) => (
                    <div key={fb.id} className="p-4 hover:bg-white/[0.02]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            fb.rating === "yes" && "bg-emerald-500/20",
                            fb.rating === "kinda" && "bg-yellow-500/20",
                            fb.rating === "no" && "bg-red-500/20"
                          )}>
                            {fb.rating === "yes" && <ThumbsUp className="w-4 h-4 text-emerald-400" />}
                            {fb.rating === "kinda" && <Meh className="w-4 h-4 text-yellow-400" />}
                            {fb.rating === "no" && <ThumbsDown className="w-4 h-4 text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                "text-xs font-medium px-2 py-0.5 rounded-full",
                                fb.rating === "yes" && "bg-emerald-500/20 text-emerald-400",
                                fb.rating === "kinda" && "bg-yellow-500/20 text-yellow-400",
                                fb.rating === "no" && "bg-red-500/20 text-red-400"
                              )}>
                                {fb.rating === "yes" ? "Matched" : fb.rating === "kinda" ? "Kinda" : "Didn't Match"}
                              </span>
                              {fb.dismissed && (
                                <span className="text-[10px] text-white/30">dismissed</span>
                              )}
                            </div>
                            {fb.feedback_text && (
                              <p className="text-sm text-white/70 mt-2">{fb.feedback_text}</p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-[10px] text-white/30">
                              <span>{new Date(fb.created_at).toLocaleString()}</span>
                              {fb.user_id && <span>User: {fb.user_id.slice(0, 8)}...</span>}
                              {fb.generation_id && <span>Gen: {fb.generation_id.slice(0, 8)}...</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Tab - SEO Article Generator */}
        {activeTab === "content" && (
          <div className="space-y-6">
            {/* Generator Form */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#71717a]/20 to-[#52525b]/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#71717a]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Replay Content Engine</h2>
                  <p className="text-xs text-white/50">Generate SEO articles about legacy modernization, technical debt & enterprise rewrites</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left - Mode Toggle & Input */}
                <div className="space-y-4">
                  {/* Mode Toggle */}
                  <div className="flex items-center gap-2 p-1 bg-black/30 rounded-xl border border-zinc-800">
                    <button
                      onClick={() => setAutoMode(true)}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        autoMode 
                          ? "bg-gradient-to-r from-[#71717a] to-[#52525b] text-white" 
                          : "text-white/50 hover:text-white/70"
                      )}
                    >
                      <Sparkles className="w-4 h-4" />
                      Auto SEO
                    </button>
                    <button
                      onClick={() => setAutoMode(false)}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        !autoMode 
                          ? "bg-gradient-to-r from-[#71717a] to-[#52525b] text-white" 
                          : "text-white/50 hover:text-white/70"
                      )}
                    >
                      <PenSquare className="w-4 h-4" />
                      Manual
                    </button>
                  </div>

                  {/* Auto Mode - Just Number Input */}
                  {autoMode ? (
                    <div className="p-5 bg-gradient-to-br from-[#71717a]/10 to-transparent border border-[#71717a]/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-5 h-5 text-[#71717a]" />
                        <div>
                          <p className="text-sm font-medium text-white">AI picks enterprise modernization topics</p>
                          <p className="text-xs text-white/50">Technical debt, legacy rewrites, ROI, industry-specific</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-white/70">Generate</label>
                        <input
                          type="number"
                          min={1}
                          value={autoCount}
                          onChange={(e) => setAutoCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-24 px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white text-lg font-bold text-center focus:outline-none focus:border-[#71717a]/50"
                        />
                        <label className="text-sm text-white/70">articles</label>
                      </div>
                      <p className="text-xs text-white/40 mt-3">
                        AI will generate {autoCount} unique topics: legacy modernization, technical debt, enterprise ROI, industry cases
                      </p>
                    </div>
                  ) : (
                    /* Manual Mode - Titles Textarea */
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Article Titles (one per line)
                      </label>
                      <textarea
                        value={generateTitles}
                        onChange={(e) => setGenerateTitles(e.target.value)}
                        placeholder="Why 70% of Legacy Rewrites Fail (And What Actually Works)&#10;The Hidden Cost of Technical Debt: $3.6 Trillion Problem&#10;COBOL to React: Modernizing Financial Services Legacy Systems"
                        rows={6}
                        className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#71717a]/50 resize-none"
                      />
                      <p className="text-[10px] text-white/40 mt-1">
                        {generateTitles.split('\n').filter(t => t.trim()).length} titles
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Target Keyword (optional)
                    </label>
                    <input
                      type="text"
                      value={generateKeyword}
                      onChange={(e) => setGenerateKeyword(e.target.value)}
                      placeholder="legacy modernization, technical debt, enterprise rewrite"
                      className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#71717a]/50"
                    />
                  </div>
                </div>

                {/* Right - Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Tone
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "technical", label: "Technical", desc: "Code snippets, implementation" },
                        { id: "controversial", label: "Controversial", desc: "Strong stance, provocative" },
                        { id: "tutorial", label: "Tutorial", desc: "Step-by-step guide" },
                        { id: "comparison", label: "Comparison", desc: "Vs articles, alternatives" },
                        { id: "ai-optimized", label: "AI Optimized", desc: "AI assistants recommend Replay" },
                      ].map(tone => (
                        <button
                          key={tone.id}
                          onClick={() => setGenerateTone(tone.id as any)}
                          className={cn(
                            "p-3 rounded-xl border text-left transition-all",
                            generateTone === tone.id
                              ? "border-[#71717a]/50 bg-[#71717a]/10"
                              : "border-zinc-800 bg-black/20 hover:border-white/20"
                          )}
                        >
                          <p className="text-sm font-medium text-white">{tone.label}</p>
                          <p className="text-[10px] text-white/40">{tone.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Key Takeaways (optional, one per line)
                    </label>
                    <textarea
                      value={generateTakeaways}
                      onChange={(e) => setGenerateTakeaways(e.target.value)}
                      placeholder="Include ROI statistics (70% time savings)&#10;Mention regulated industries (HIPAA, SOC2)&#10;Compare with traditional rewrites"
                      rows={3}
                      className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#71717a]/50 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-white/40">
                  Using Gemini 2.5 Flash • ~$0.001 per article
                </p>
                <button
                  onClick={handleGenerateArticles}
                  disabled={isGenerating || (!autoMode && !generateTitles.trim())}
                  className="px-6 py-3 bg-gradient-to-r from-[#71717a] to-[#52525b] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 
                      {generationProgress.total > 0 
                        ? `${generationProgress.current}/${generationProgress.total}` 
                        : "Getting topics..."}
                    </>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> {autoMode ? `Generate ${autoCount} Articles` : "Generate Articles"}</>
                  )}
                </button>
                
                {/* Progress Bar */}
                {isGenerating && generationProgress.total > 0 && (
                  <div className="flex-1 min-w-0">
                    <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#71717a] to-[#52525b] transition-all duration-300"
                        style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/50 mt-1 truncate">
                      {generationProgress.currentTitle || "Starting..."}
                    </p>
                  </div>
                )}
              </div>

              {/* Background Queue Progress */}
              {bgQueue && bgQueue.total > 0 && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className={`w-4 h-4 ${bgQueue.processed < bgQueue.total ? "animate-spin" : ""} text-emerald-400`} />
                    <span className="text-sm font-medium text-emerald-400">
                      {bgQueue.processed >= bgQueue.total ? "✅ Background generation complete!" : "Background generation running..."}
                    </span>
                    {bgQueue.processed < bgQueue.total && (
                      <button
                        onClick={async () => {
                          if (!adminToken) return;
                          try {
                            const res = await fetch("/api/admin/content-cron", {
                              method: "DELETE",
                              headers: { "Authorization": `Bearer ${adminToken}` },
                            });
                            if (res.ok) {
                              setBgQueue(null);
                              setToastMessage("Queue cleared");
                            }
                          } catch {}
                        }}
                        className="ml-auto text-xs text-red-400 hover:text-red-300 underline"
                      >
                        Clear Queue
                      </button>
                    )}
                    {bgQueue.processed >= bgQueue.total && (
                      <span className="text-xs text-white/50 ml-auto">Done</span>
                    )}
                  </div>
                  <div className="h-2.5 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                      style={{ width: `${(bgQueue.processed / bgQueue.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/60 mt-2">
                    {bgQueue.processed}/{bgQueue.total} articles generated
                    {bgQueue.results?.length > 0 && ` (${bgQueue.results.filter((r: any) => r.success).length} ✅ ${bgQueue.results.filter((r: any) => !r.success).length > 0 ? `, ${bgQueue.results.filter((r: any) => !r.success).length} ❌` : ""})`}
                  </p>
                </div>
              )}

              {/* Generation Results */}
              {generateResults.length > 0 && (
                <div className="mt-6 p-4 bg-black/30 rounded-xl border border-zinc-800">
                  <h3 className="text-sm font-medium text-white mb-3">Generation Results</h3>
                  <div className="space-y-3">
                    {generateResults.map((result, i) => (
                      <div key={i} className="p-3 bg-black/30 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                            {result.error && !result.content ? (
                              <>
                                <X className="w-4 h-4 text-red-400 flex-shrink-0" />
                                <span className="text-white/70 truncate">{result.title}</span>
                                <span className="text-red-400 text-xs flex-shrink-0">- Failed</span>
                              </>
                            ) : result.saved ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <span className="text-white/70 truncate">{result.title}</span>
                                <span className="text-emerald-400 text-xs flex-shrink-0">
                                  - Published! ({result.read_time_minutes}min)
                                </span>
                                <a
                                  href={`/blog/${result.slug}`}
                                  target="_blank"
                                  className="text-[#71717a] text-xs hover:underline flex-shrink-0"
                                >
                                  View →
                                </a>
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                                <span className="text-white/70 truncate">{result.title}</span>
                                <span className="text-yellow-400 text-xs flex-shrink-0">
                                  - Generated ({result.read_time_minutes}min)
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {result.saved && result.slug && (
                              <a
                                href={`/blog/${result.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2 py-1 text-xs bg-[#71717a]/20 text-[#71717a] rounded hover:bg-[#71717a]/30 transition-colors flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" /> View
                              </a>
                            )}
                            {result.content && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(result.content);
                                  setToastMessage("✅ Content copied to clipboard!");
                                }}
                                className="px-2 py-1 text-xs bg-white/5 text-white/60 rounded hover:bg-white/10 transition-colors"
                              >
                                Copy MD
                              </button>
                            )}
                          </div>
                        </div>
                        {result.content && (
                          <details className="mt-2">
                            <summary className="text-xs text-white/40 cursor-pointer hover:text-white/60">
                              Preview content ({result.content.length} chars)
                            </summary>
                            <div className="mt-2 p-3 bg-black/50 rounded-lg text-xs text-white/60 overflow-x-auto max-h-64 overflow-y-auto">
                              <pre className="whitespace-pre-wrap">{result.content}</pre>
                            </div>
                          </details>
                        )}
                        {!result.saved && result.content && (
                          <p className="text-[10px] text-yellow-500/60 mt-2">
                            ⚠️ Create blog_posts table in Supabase to save articles
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Crosspost Panel */}
            {crosspostStats && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <Send className="w-4 h-4 text-[#71717a]" />
                    Crossposting ({crosspostStats.totalPublished} published articles)
                  </h3>
                  <button
                    onClick={() => adminToken && loadCrosspostStats(adminToken)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/40 uppercase">Dev.to</span>
                      {crosspostStats.configured.devto ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">No API Key</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-white">{crosspostStats.devto.posted}<span className="text-xs text-white/30 font-normal"> / {crosspostStats.totalPublished}</span></div>
                    <div className="text-[10px] text-white/40">{crosspostStats.devto.remaining} remaining</div>
                    {crosspostStats.configured.devto && crosspostStats.devto.remaining > 0 && (
                      <button
                        onClick={() => runBulkCrosspost("devto")}
                        disabled={!!crossposting}
                        className="mt-2 w-full px-3 py-1.5 text-[10px] bg-[#71717a]/20 text-[#71717a] rounded-lg hover:bg-[#71717a]/30 disabled:opacity-30 transition-colors"
                      >
                        {crossposting === "devto" ? "Posting..." : `Crosspost ${Math.min(crosspostStats.devto.remaining, 10)} →`}
                      </button>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-white/40 uppercase">Hashnode</span>
                      {crosspostStats.configured.hashnode ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">No API Key</span>
                      )}
                    </div>
                    <div className="text-lg font-bold text-white">{crosspostStats.hashnode.posted}<span className="text-xs text-white/30 font-normal"> / {crosspostStats.totalPublished}</span></div>
                    <div className="text-[10px] text-white/40">{crosspostStats.hashnode.remaining} remaining</div>
                    {crosspostStats.configured.hashnode && crosspostStats.hashnode.remaining > 0 && (
                      <button
                        onClick={() => runBulkCrosspost("hashnode")}
                        disabled={!!crossposting}
                        className="mt-2 w-full px-3 py-1.5 text-[10px] bg-[#71717a]/20 text-[#71717a] rounded-lg hover:bg-[#71717a]/30 disabled:opacity-30 transition-colors"
                      >
                        {crossposting === "hashnode" ? "Posting..." : `Crosspost ${Math.min(crosspostStats.hashnode.remaining, 10)} →`}
                      </button>
                    )}
                  </div>
                </div>
                {(crosspostStats.devto.remaining > 0 || crosspostStats.hashnode.remaining > 0) && crosspostStats.configured.devto && crosspostStats.configured.hashnode && (
                  <button
                    onClick={() => runBulkCrosspost("all")}
                    disabled={!!crossposting}
                    className="w-full px-3 py-2 text-xs bg-gradient-to-r from-[#71717a]/20 to-[#52525b]/20 text-[#71717a] rounded-lg hover:from-[#71717a]/30 hover:to-[#52525b]/30 disabled:opacity-30 transition-colors font-medium"
                  >
                    {crossposting === "all" ? "Processing all platforms..." : "Crosspost All Platforms →"}
                  </button>
                )}
                {crosspostLog.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto bg-black/30 rounded-lg p-2 text-[10px] text-white/50 font-mono space-y-0.5">
                    {crosspostLog.slice(-20).map((line, i) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Blog Posts List */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="p-4 border-b border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#71717a]" />
                    Generated Articles ({blogTotal} total, page {blogPage + 1} of {Math.max(1, Math.ceil(blogTotal / BLOG_PAGE_SIZE))})
                  </h3>
                  <div className="flex items-center gap-2">
                    {["all", "draft", "review", "published"].map(status => (
                      <button
                        key={status}
                        onClick={() => { setBlogFilter(status as any); setBlogPage(0); }}
                        className={cn(
                          "px-3 py-1.5 text-xs rounded-lg transition-colors capitalize",
                          blogFilter === status
                            ? "bg-[#71717a]/20 text-[#71717a]"
                            : "bg-white/5 text-white/50 hover:text-white/70"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder="Search articles..."
                      value={blogSearch}
                      onChange={(e) => { setBlogSearch(e.target.value); setBlogPage(0); }}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#71717a]/50"
                    />
                  </div>
                  <select
                    value={blogSort}
                    onChange={(e) => { setBlogSort(e.target.value as any); setBlogPage(0); }}
                    className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70 focus:outline-none"
                  >
                    <option value="created_at">Date Created</option>
                    <option value="published_at">Date Published</option>
                    <option value="title">Title</option>
                    <option value="seo_score">SEO Score</option>
                  </select>
                  <button
                    onClick={() => setBlogOrder(o => o === "desc" ? "asc" : "desc")}
                    className="px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                  >
                    {blogOrder === "desc" ? "↓ Newest" : "↑ Oldest"}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {blogLoading ? (
                  <div className="py-12 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
                  </div>
                ) : blogPosts.length === 0 ? (
                  <div className="py-12 text-center text-white/30">
                    No articles yet. Generate some above!
                  </div>
                ) : (
                  blogPosts.map(post => (
                    <div key={post.id} className="p-4 hover:bg-white/[0.02]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-white truncate">{post.title}</h4>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full capitalize",
                              post.status === "published" && "bg-emerald-500/20 text-emerald-400",
                              post.status === "review" && "bg-yellow-500/20 text-yellow-400",
                              post.status === "draft" && "bg-white/10 text-white/50"
                            )}>
                              {post.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-white/40">
                            <span>/{post.slug}</span>
                            <span>{post.read_time_minutes} min read</span>
                            <span>SEO: {post.seo_score}/100</span>
                            <span>{new Date(post.created_at).toLocaleDateString()}</span>
                            {post.devto_url && <span className="text-blue-400">Dev.to</span>}
                            {post.hashnode_url && <span className="text-purple-400">Hashnode</span>}
                          </div>
                          {post.meta_description && (
                            <p className="text-xs text-white/50 mt-2 line-clamp-1">{post.meta_description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {post.status !== "published" && (
                            <button
                              onClick={() => updatePostStatus(post.id, "published")}
                              className="p-2 hover:bg-emerald-500/10 rounded-lg text-white/40 hover:text-emerald-400 transition-colors"
                              title="Publish"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {post.status === "draft" && (
                            <button
                              onClick={() => updatePostStatus(post.id, "review")}
                              className="p-2 hover:bg-yellow-500/10 rounded-lg text-white/40 hover:text-yellow-400 transition-colors"
                              title="Mark for Review"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingPost(post)}
                            className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                            title="Edit"
                          >
                            <PenSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deletePost(post.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* Pagination */}
              {blogTotal > BLOG_PAGE_SIZE && (
                <div className="p-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-white/40">
                    Showing {blogPage * BLOG_PAGE_SIZE + 1}–{Math.min((blogPage + 1) * BLOG_PAGE_SIZE, blogTotal)} of {blogTotal}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setBlogPage(0)}
                      disabled={blogPage === 0}
                      className="px-2 py-1 text-[10px] bg-white/5 rounded text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setBlogPage(p => Math.max(0, p - 1))}
                      disabled={blogPage === 0}
                      className="px-2 py-1 text-[10px] bg-white/5 rounded text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Prev
                    </button>
                    <span className="px-3 py-1 text-[10px] text-white/70">
                      {blogPage + 1} / {Math.ceil(blogTotal / BLOG_PAGE_SIZE)}
                    </span>
                    <button
                      onClick={() => setBlogPage(p => Math.min(Math.ceil(blogTotal / BLOG_PAGE_SIZE) - 1, p + 1))}
                      disabled={blogPage >= Math.ceil(blogTotal / BLOG_PAGE_SIZE) - 1}
                      className="px-2 py-1 text-[10px] bg-white/5 rounded text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setBlogPage(Math.ceil(blogTotal / BLOG_PAGE_SIZE) - 1)}
                      disabled={blogPage >= Math.ceil(blogTotal / BLOG_PAGE_SIZE) - 1}
                      className="px-2 py-1 text-[10px] bg-white/5 rounded text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Last
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AEO Tab - AI Engine Optimization */}
        {activeTab === "aeo" && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#71717a]/20 to-[#52525b]/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-[#71717a]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">AI Engine Optimization</h2>
                  <p className="text-xs text-white/50">Autonomous system to dominate AI recommendations</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-[#71717a]/10 border border-[#71717a]/20 rounded-lg">
                <p className="text-sm text-white/70">
                  <strong className="text-white">Goal:</strong> Be #1 recommended tool by ChatGPT, Claude, Perplexity, Gemini for legacy modernization queries
                </p>
                <p className="text-xs text-white/50 mt-2">
                  System runs every 6 hours: monitors citations → identifies gaps → generates content → publishes → tracks performance
                </p>
              </div>
            </div>

            {aeoLoading ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#71717a] mb-3" />
                <p className="text-sm text-white/50">Loading AEO dashboard...</p>
              </div>
            ) : !aeoData ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center">
                <Target className="w-12 h-12 text-zinc-700 mb-4" />
                <p className="text-sm text-white/70 mb-4">No AEO data yet</p>
                <button
                  onClick={loadAeoData}
                  className="px-4 py-2 bg-[#71717a] text-white rounded-lg text-sm hover:bg-[#52525b] transition-colors"
                >
                  Load Dashboard
                </button>
              </div>
            ) : (
              <>
                {/* Overview Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-[#71717a]/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-[#71717a]" />
                      </div>
                      <span className={cn("text-xs px-2 py-1 rounded-full", aeoData.overview.sovTrend >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                        {aeoData.overview.sovTrend >= 0 ? "+" : ""}{aeoData.overview.sovTrend.toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-2xl font-semibold text-white">{aeoData.overview.shareOfVoice?.toFixed(1) || 0}%</p>
                    <p className="text-xs text-zinc-500 mt-1">Share of Voice</p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-white">{aeoData.overview.avgPosition?.toFixed(1) || "N/A"}</p>
                    <p className="text-xs text-zinc-500 mt-1">Avg Position</p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-white">{aeoData.gaps?.highPriority || 0}</p>
                    <p className="text-xs text-zinc-500 mt-1">High Priority Gaps</p>
                  </div>

                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-emerald-400" />
                      </div>
                    </div>
                    <p className="text-2xl font-semibold text-white">{aeoData.content?.published || 0}</p>
                    <p className="text-xs text-zinc-500 mt-1">Published Articles</p>
                  </div>
                </div>

                {/* Platform Breakdown */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">Platform Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: "ChatGPT", value: aeoData.overview.platformBreakdown?.chatgpt || 0, icon: "🤖" },
                      { name: "Claude", value: aeoData.overview.platformBreakdown?.claude || 0, icon: "🔮" },
                      { name: "Gemini", value: aeoData.overview.platformBreakdown?.gemini || 0, icon: "✨" },
                      { name: "Perplexity", value: aeoData.overview.platformBreakdown?.perplexity || 0, icon: "🔍" }
                    ].map(platform => (
                      <div key={platform.name} className="p-4 bg-black/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{platform.icon}</span>
                          <span className="text-xs text-white/70">{platform.name}</span>
                        </div>
                        <p className="text-xl font-semibold text-white">{platform.value.toFixed(1)}%</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* System Controls */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4">System Controls</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        const newValue = !aeoAutoPublish;
                        setAeoAutoPublish(newValue);
                        await fetch("/api/aeo/dashboard", {
                          method: "POST",
                          headers: {
                            "Authorization": `Bearer ${adminToken}`,
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            key: "auto_publish_enabled",
                            value: newValue
                          })
                        });
                        setToastMessage(`✅ Auto-publish ${newValue ? "enabled" : "disabled"}`);
                      }}
                      className={cn(
                        "px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                        aeoAutoPublish
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-zinc-800 text-white/70 border border-zinc-700"
                      )}
                    >
                      {aeoAutoPublish ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      Auto-Publish: {aeoAutoPublish ? "ON" : "OFF"}
                    </button>

                    <button
                      onClick={async () => {
                        setToastMessage("⏳ Running monitoring...");
                        try {
                          const response = await fetch("/api/aeo/monitor-citations", {
                            method: "POST",
                            headers: {
                              "Authorization": `Bearer ${adminToken}`,
                              "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ testMode: true })
                          });
                          const data = await response.json();
                          if (data.success) {
                            setToastMessage(`✅ Monitoring complete: ${data.summary.shareOfVoice} Share of Voice`);
                            loadAeoData();
                          } else {
                            setToastMessage(`❌ ${data.error}`);
                          }
                        } catch (error) {
                          setToastMessage("❌ Monitoring failed");
                        }
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[#71717a] text-white hover:bg-[#52525b] transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Run Monitoring Now
                    </button>

                    <button
                      onClick={async () => {
                        setToastMessage("⏳ Identifying gaps...");
                        try {
                          const response = await fetch("/api/aeo/identify-gaps", {
                            method: "POST",
                            headers: {
                              "Authorization": `Bearer ${adminToken}`,
                              "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ daysToAnalyze: 7 })
                          });
                          const data = await response.json();
                          if (data.success) {
                            setToastMessage(`✅ Found ${data.gapsIdentified} gaps (${data.highPriorityGaps} high priority)`);
                            loadAeoData();
                          } else {
                            setToastMessage(`❌ ${data.error}`);
                          }
                        } catch (error) {
                          setToastMessage("❌ Gap identification failed");
                        }
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Identify Gaps Now
                    </button>

                    <button
                      onClick={async () => {
                        setToastMessage("⏳ Running full AEO pipeline (monitor → gaps → generate → publish)...");
                        try {
                          const response = await fetch("/api/aeo/cron", {
                            headers: { "x-vercel-cron": "true" }
                          });
                          const data = await response.json();
                          if (data.success) {
                            setToastMessage(`✅ Pipeline completed in ${data.duration}s`);
                            loadAeoData();
                          } else {
                            setToastMessage(`❌ ${data.error}`);
                          }
                        } catch (error) {
                          setToastMessage("❌ Pipeline failed");
                        }
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium bg-orange-600 text-white hover:bg-orange-500 transition-colors flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Run Full Pipeline
                    </button>

                    <button
                      onClick={loadAeoData}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      Refresh Dashboard
                    </button>
                  </div>

                  {aeoData.overview.lastMonitoringRun && (
                    <p className="text-xs text-white/40 mt-3">
                      Last monitoring: {new Date(aeoData.overview.lastMonitoringRun).toLocaleString()} ({aeoData.overview.lastMonitoringStatus})
                    </p>
                  )}
                </div>

                {/* Content Gaps Table */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Content Gaps (High Priority)</h3>
                      <p className="text-xs text-white/50 mt-1">Queries where competitors dominate</p>
                    </div>
                    <button
                      onClick={async () => {
                        const identifiedGaps = aeoData.gaps?.items?.filter((g: any) => g.status === "identified") || [];
                        if (identifiedGaps.length === 0) { setToastMessage("No identified gaps to generate"); return; }
                        setToastMessage(`⏳ Generating ${identifiedGaps.length} articles...`);
                        let success = 0;
                        let failed = 0;
                        for (let i = 0; i < identifiedGaps.length; i++) {
                          const gap = identifiedGaps[i];
                          try {
                            const response = await fetch("/api/aeo/generate-content", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ query: gap.query, targetKeywords: gap.target_keywords || [], gapId: gap.id, autoPublish: aeoAutoPublish })
                            });
                            const data = await response.json();
                            if (data.success) success++;
                            else failed++;
                            setToastMessage(`⏳ Progress: ${success} done, ${failed} failed, ${identifiedGaps.length - i - 1} remaining...`);
                          } catch { failed++; }
                        }
                        setToastMessage(`✅ Generated ${success} articles (${failed} failed)`);
                        loadAeoData();
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-600 text-white hover:bg-orange-500 transition-colors"
                    >
                      Generate All
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    {aeoData.gaps?.items && aeoData.gaps.items.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="text-left p-4 text-xs font-medium text-zinc-400">Query</th>
                            <th className="text-center p-4 text-xs font-medium text-zinc-400">Priority</th>
                            <th className="text-left p-4 text-xs font-medium text-zinc-400">Competitor</th>
                            <th className="text-center p-4 text-xs font-medium text-zinc-400">Status</th>
                            <th className="text-right p-4 text-xs font-medium text-zinc-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aeoData.gaps.items.slice(0, 50).map((gap: any) => (
                            <tr key={gap.id} className="border-b border-zinc-800/50 hover:bg-white/5">
                              <td className="p-4 text-sm text-white">{gap.query}</td>
                              <td className="p-4 text-center">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  gap.priority >= 9 ? "bg-red-500/20 text-red-400" :
                                  gap.priority >= 8 ? "bg-yellow-500/20 text-yellow-400" :
                                  "bg-zinc-700 text-zinc-300"
                                )}>
                                  {gap.priority}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-white/70">{gap.competitor_dominating}</td>
                              <td className="p-4 text-center">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-xs",
                                  gap.status === "published" ? "bg-emerald-500/20 text-emerald-400" :
                                  gap.status === "generating" ? "bg-yellow-500/20 text-yellow-400" :
                                  "bg-zinc-700 text-zinc-300"
                                )}>
                                  {gap.status}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {gap.status === "identified" && (
                                  <button
                                    onClick={async () => {
                                      setToastMessage("⏳ Generating content...");
                                      try {
                                        const response = await fetch("/api/aeo/generate-content", {
                                          method: "POST",
                                          headers: {
                                            "Authorization": `Bearer ${adminToken}`,
                                            "Content-Type": "application/json"
                                          },
                                          body: JSON.stringify({
                                            query: gap.query,
                                            targetKeywords: gap.target_keywords || [],
                                            gapId: gap.id,
                                            autoPublish: aeoAutoPublish
                                          })
                                        });
                                        const data = await response.json();
                                        if (data.success) {
                                          setToastMessage(`✅ Generated: ${data.title}`);
                                          loadAeoData();
                                        } else {
                                          setToastMessage(`❌ ${data.error}`);
                                        }
                                      } catch (error) {
                                        setToastMessage("❌ Generation failed");
                                      }
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#71717a] text-white hover:bg-[#52525b] transition-colors"
                                  >
                                    Generate
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-white/50 text-sm">
                        No content gaps identified yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Generated Content Queue */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="p-6 border-b border-zinc-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-white">Generated Content</h3>
                        <p className="text-xs text-white/50 mt-1">{aeoData.content?.pending || 0} pending approval</p>
                      </div>
                      {(aeoData.content?.pending || 0) > 0 && (
                        <button
                          onClick={async () => {
                            const pendingItems = aeoData.content?.items?.filter((c: any) => !c.published) || [];
                            if (pendingItems.length === 0) return;
                            setToastMessage(`⏳ Publishing ${pendingItems.length} articles...`);
                            let success = 0;
                            for (const item of pendingItems) {
                              try {
                                const response = await fetch("/api/aeo/generate-content", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ contentId: item.id, action: "publish" })
                                });
                                const data = await response.json();
                                if (data.success) success++;
                              } catch {}
                            }
                            setToastMessage(`✅ Published ${success} articles`);
                            loadAeoData();
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                        >
                          Publish All
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    {aeoData.content?.items && aeoData.content.items.length > 0 ? (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-800">
                            <th className="text-left p-4 text-xs font-medium text-zinc-400">Title</th>
                            <th className="text-center p-4 text-xs font-medium text-zinc-400">Words</th>
                            <th className="text-center p-4 text-xs font-medium text-zinc-400">Published</th>
                            <th className="text-center p-4 text-xs font-medium text-zinc-400">Performance</th>
                            <th className="text-right p-4 text-xs font-medium text-zinc-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {aeoData.content.items.slice(0, 50).map((content: any) => (
                            <tr key={content.id} className="border-b border-zinc-800/50 hover:bg-white/5">
                              <td className="p-4 text-sm text-white max-w-md truncate">{content.title}</td>
                              <td className="p-4 text-center text-sm text-white/70">
                                {content.content ? content.content.split(/\s+/).length : 0}
                              </td>
                              <td className="p-4 text-center">
                                {content.published ? (
                                  <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                                ) : (
                                  <X className="w-4 h-4 text-zinc-600 mx-auto" />
                                )}
                              </td>
                              <td className="p-4 text-center text-sm">
                                {content.citation_improvement_48h !== null ? (
                                  <span className={cn(
                                    "font-medium",
                                    content.citation_improvement_48h > 0 ? "text-emerald-400" : "text-red-400"
                                  )}>
                                    {content.citation_improvement_48h > 0 ? "+" : ""}{content.citation_improvement_48h.toFixed(1)}%
                                  </span>
                                ) : (
                                  <span className="text-white/40">-</span>
                                )}
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {!content.published && (
                                    <button
                                      onClick={async () => {
                                        setToastMessage("⏳ Publishing...");
                                        try {
                                          const response = await fetch("/api/aeo/generate-content", {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ contentId: content.id, action: "publish" })
                                          });
                                          const data = await response.json();
                                          if (data.success) {
                                            setToastMessage(`✅ Published: ${data.publishedUrl}`);
                                            loadAeoData();
                                          } else {
                                            setToastMessage(`❌ ${data.error}`);
                                          }
                                        } catch { setToastMessage("❌ Publish failed"); }
                                      }}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                                    >
                                      Publish
                                    </button>
                                  )}
                                  {content.published_url && (
                                    <a
                                      href={content.published_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      View
                                    </a>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (!confirm("Delete this article?")) return;
                                      try {
                                        const response = await fetch("/api/aeo/generate-content", {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ contentId: content.id, action: "delete" })
                                        });
                                        const data = await response.json();
                                        if (data.success) {
                                          setToastMessage("✅ Deleted");
                                          loadAeoData();
                                        } else {
                                          setToastMessage(`❌ ${data.error}`);
                                        }
                                      } catch { setToastMessage("❌ Delete failed"); }
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-white/50 text-sm">
                        No generated content yet
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Viral Tab - X Growth Manager */}
        {activeTab === "viral" && (
          <div className="space-y-6">
            {/* Header with Sub-tabs */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#1DA1F2]/20 to-[#1DA1F2]/5 border border-[#1DA1F2]/20">
                  <Zap className="w-5 h-5 text-[#1DA1F2]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">X Growth Manager</h2>
                  <p className="text-xs text-white/50">AI-powered posts, replies, and engagement strategy</p>
                </div>
              </div>
              
              {/* Sub-tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: "posts", label: "Create Posts", icon: "✍️" },
                  { id: "replies", label: "Reply Generator", icon: "💬" },
                  { id: "daily", label: "Daily Plan", icon: "📅" },
                  { id: "accounts", label: "Who to Engage", icon: "👥" },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setViralSubTab(tab.id as any)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                      viralSubTab === tab.id
                        ? "bg-[#1DA1F2] text-white"
                        : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                    )}
                  >
                    <span>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB: CREATE POSTS */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {viralSubTab === "posts" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">
                        Context <span className="text-white/30">(what happened today?)</span>
                      </label>
                      <textarea
                        value={viralContext}
                        onChange={(e) => setViralContext(e.target.value)}
                        placeholder="Got YC interview invite, fixed the RECITATION bug, shipped new feature..."
                        className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50 resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                        <select
                          value={viralCategory}
                          onChange={(e) => setViralCategory(e.target.value as any)}
                          className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#1DA1F2]/50"
                        >
                          <option value="arrogant">🏆 Arrogant Builder</option>
                          <option value="numbers">📊 Numbers Flex</option>
                          <option value="contrarian">🔥 Contrarian Take</option>
                          <option value="philosophy">💭 Philosophy</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-2">Tone</label>
                        <select
                          value={viralTone}
                          onChange={(e) => setViralTone(e.target.value as any)}
                          className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#1DA1F2]/50"
                        >
                          <option value="aggressive">⚡ Aggressive</option>
                          <option value="data-driven">📈 Data-Driven</option>
                          <option value="philosophical">🧠 Philosophical</option>
                          <option value="meme">😏 Meme</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        if (!viralContext.trim()) { setToastMessage("Enter context first!"); return; }
                        setIsGeneratingViral(true);
                        setViralResults(null);
                        try {
                          const res = await fetch("/api/admin/generate-viral", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                            body: JSON.stringify({ mode: "post", context: viralContext, category: viralCategory, tone: viralTone }),
                          });
                          const data = await res.json();
                          if (data.error) setToastMessage(`Error: ${data.error}`);
                          else setViralResults(data);
                        } catch (err: any) { setToastMessage(`Error: ${err.message}`); }
                        finally { setIsGeneratingViral(false); }
                      }}
                      disabled={isGeneratingViral || !viralContext.trim()}
                      className="w-full py-3 bg-gradient-to-r from-[#1DA1F2] to-[#1DA1F2]/80 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGeneratingViral ? <><Loader2 className="w-4 h-4 animate-spin" />Generating...</> : <><Zap className="w-4 h-4" />Generate 3 Posts</>}
                    </button>
                  </div>
                </div>

                {viralResults && (
                  <div className="space-y-4">
                    {viralResults.posts.map((post, index) => (
                      <div key={index} className={cn("bg-zinc-900/50 border rounded-xl p-5", index === viralResults.bestPick ? "border-[#1DA1F2]/50 ring-1 ring-[#1DA1F2]/20" : "border-zinc-800")}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">Post #{index + 1}</span>
                            {index === viralResults.bestPick && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1DA1F2]/20 text-[#1DA1F2]">⭐ BEST</span>}
                          </div>
                          <div className={cn("text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1", post.viralScore >= 80 ? "bg-emerald-500/20 text-emerald-400" : post.viralScore >= 60 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>
                            <TrendingUp className="w-3 h-3" />{post.viralScore}/100
                          </div>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4 border border-zinc-800 mb-3">
                          <pre className="text-sm text-white whitespace-pre-wrap font-sans">{post.content}</pre>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(post.content); setCopiedPostIndex(index); setTimeout(() => setCopiedPostIndex(null), 2000); }} className="flex-1 py-2 bg-white/10 text-white/70 rounded-lg text-sm hover:bg-white/20 flex items-center justify-center gap-2">
                            {copiedPostIndex === index ? <><Check className="w-4 h-4 text-emerald-400" />Copied!</> : <><Copy className="w-4 h-4" />Copy</>}
                          </button>
                          <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content)}`} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-lg text-sm hover:bg-[#1DA1F2]/30 flex items-center justify-center gap-2">
                            <ExternalLink className="w-4 h-4" />Post to X
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB: REPLY GENERATOR */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {viralSubTab === "replies" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#1DA1F2]" />
                    Generate Smart Replies
                  </h3>
                  <p className="text-xs text-white/50 mb-4">Paste a tweet you want to reply to. AI will generate strategic replies that add value and get noticed.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Author (optional)</label>
                      <input
                        type="text"
                        value={replyOriginalAuthor}
                        onChange={(e) => setReplyOriginalAuthor(e.target.value)}
                        placeholder="@username"
                        className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Original Tweet</label>
                      <textarea
                        value={replyOriginalTweet}
                        onChange={(e) => setReplyOriginalTweet(e.target.value)}
                        placeholder="Paste the tweet you want to reply to..."
                        className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50 resize-none"
                        rows={4}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (!replyOriginalTweet.trim()) { setToastMessage("Paste a tweet first!"); return; }
                        setIsGeneratingReply(true);
                        setReplyResults(null);
                        try {
                          const res = await fetch("/api/admin/generate-viral", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                            body: JSON.stringify({ mode: "reply", originalTweet: replyOriginalTweet, originalAuthor: replyOriginalAuthor }),
                          });
                          const data = await res.json();
                          if (data.error) setToastMessage(`Error: ${data.error}`);
                          else setReplyResults(data);
                        } catch (err: any) { setToastMessage(`Error: ${err.message}`); }
                        finally { setIsGeneratingReply(false); }
                      }}
                      disabled={isGeneratingReply || !replyOriginalTweet.trim()}
                      className="w-full py-3 bg-gradient-to-r from-[#1DA1F2] to-[#1DA1F2]/80 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGeneratingReply ? <><Loader2 className="w-4 h-4 animate-spin" />Generating replies...</> : <><MessageSquare className="w-4 h-4" />Generate 3 Replies</>}
                    </button>
                  </div>
                </div>

                {replyResults && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/70">Generated Replies</h3>
                    {replyResults.replies.map((reply, index) => (
                      <div key={index} className={cn("bg-zinc-900/50 border rounded-xl p-5", index === replyResults.bestPick ? "border-emerald-500/50 ring-1 ring-emerald-500/20" : "border-zinc-800")}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">Reply #{index + 1}</span>
                            {index === replyResults.bestPick && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">⭐ BEST</span>}
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/50">{reply.type}</span>
                          </div>
                          <span className={cn("text-xs px-2 py-1 rounded-lg", reply.engagementPotential === "high" ? "bg-emerald-500/20 text-emerald-400" : reply.engagementPotential === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/50")}>
                            {reply.engagementPotential} potential
                          </span>
                        </div>
                        <div className="bg-black/30 rounded-xl p-4 border border-zinc-800 mb-3">
                          <p className="text-sm text-white">{reply.content}</p>
                        </div>
                        <p className="text-xs text-white/40 mb-3">💡 {reply.rationale}</p>
                        <div className="flex gap-2">
                          <button onClick={() => { navigator.clipboard.writeText(reply.content); setToastMessage("Reply copied!"); }} className="flex-1 py-2 bg-white/10 text-white/70 rounded-lg text-sm hover:bg-white/20 flex items-center justify-center gap-2">
                            <Copy className="w-4 h-4" />Copy
                          </button>
                        </div>
                      </div>
                    ))}
                    {replyResults.suggestedFollowUp && (
                      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
                        <p className="text-xs text-white/50">💬 If they respond, follow up with: <span className="text-white/70">{replyResults.suggestedFollowUp}</span></p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB: DAILY PLAN */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {viralSubTab === "daily" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#1DA1F2]" />
                    Generate Today's Engagement Plan
                  </h3>
                  <p className="text-xs text-white/50 mb-4">AI will create a personalized daily strategy - what to post, who to engage with, and when.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-2">Recent Activity (optional)</label>
                      <textarea
                        value={dailyPlanActivity}
                        onChange={(e) => setDailyPlanActivity(e.target.value)}
                        placeholder="What did you work on recently? Any wins to share?"
                        className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50 resize-none"
                        rows={2}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        setIsGeneratingDailyPlan(true);
                        setDailyPlan(null);
                        try {
                          const res = await fetch("/api/admin/generate-viral", {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                            body: JSON.stringify({ mode: "daily-plan", recentActivity: dailyPlanActivity }),
                          });
                          const data = await res.json();
                          if (data.error) setToastMessage(`Error: ${data.error}`);
                          else setDailyPlan(data);
                        } catch (err: any) { setToastMessage(`Error: ${err.message}`); }
                        finally { setIsGeneratingDailyPlan(false); }
                      }}
                      disabled={isGeneratingDailyPlan}
                      className="w-full py-3 bg-gradient-to-r from-[#1DA1F2] to-[#1DA1F2]/80 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isGeneratingDailyPlan ? <><Loader2 className="w-4 h-4 animate-spin" />Creating plan...</> : <><Calendar className="w-4 h-4" />Generate Today's Plan</>}
                    </button>
                  </div>
                </div>

                {dailyPlan && (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-[#1DA1F2]/10 to-transparent border border-[#1DA1F2]/20 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-white">{dailyPlan.date}</h3>
                        <span className="text-xs px-3 py-1 bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-full">{dailyPlan.theme}</span>
                      </div>
                      <p className="text-sm text-white/70">💡 Tip: {dailyPlan.tip}</p>
                    </div>

                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/50" />
                        Today's Tasks
                      </h4>
                      <div className="space-y-3">
                        {dailyPlan.tasks.map((task, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                            <span className={cn("text-xs px-2 py-1 rounded", task.priority === "high" ? "bg-red-500/20 text-red-400" : task.priority === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/50")}>
                              {task.time}
                            </span>
                            <div>
                              <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-white/50 mr-2">{task.action}</span>
                              <p className="text-sm text-white/70 mt-1">{task.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {dailyPlan.accountsToEngage && dailyPlan.accountsToEngage.length > 0 && (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-white/50" />
                          Engage These Accounts Today
                        </h4>
                        <div className="space-y-2">
                          {dailyPlan.accountsToEngage.map((acc, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                              <div>
                                <a href={`https://twitter.com/${acc.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline font-medium">{acc.handle}</a>
                                <p className="text-xs text-white/50">{acc.reason}</p>
                              </div>
                              <span className="text-xs text-white/40">{acc.suggestedApproach}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dailyPlan.contentIdeas && dailyPlan.contentIdeas.length > 0 && (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <h4 className="text-sm font-medium text-white mb-3">💡 Content Ideas for Today</h4>
                        <ul className="space-y-2">
                          {dailyPlan.contentIdeas.map((idea, i) => (
                            <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                              <span className="text-[#1DA1F2]">•</span>
                              {idea}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════ */}
            {/* SUB-TAB: ACCOUNTS TO ENGAGE */}
            {/* ═══════════════════════════════════════════════════════════════════ */}
            {viralSubTab === "accounts" && (
              <div className="space-y-6">
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#1DA1F2]" />
                    Curated Accounts to Engage
                  </h3>
                  <p className="text-xs text-white/50 mb-4">These are VCs, founders, and builders who align with your narrative. Engage strategically!</p>
                  
                  <div className="flex gap-2 flex-wrap mb-4">
                    {["all", "tier1", "tier2", "tier3", "techAI"].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setAccountsFilter(filter as any)}
                        className={cn("px-3 py-1.5 text-xs rounded-lg transition-colors", accountsFilter === filter ? "bg-[#1DA1F2]/20 text-[#1DA1F2]" : "bg-white/5 text-white/50 hover:text-white")}
                      >
                        {filter === "all" ? "All" : filter === "tier1" ? "🔥 Daily (Tier 1)" : filter === "tier2" ? "📊 Weekly (Tier 2)" : filter === "tier3" ? "🎯 When Relevant" : "🤖 AI/Tech"}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/admin/generate-viral", {
                          method: "POST",
                          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
                          body: JSON.stringify({ mode: "accounts" }),
                        });
                        const data = await res.json();
                        if (data.accounts) setAccountsList(data.accounts);
                      } catch (err: any) { setToastMessage(`Error: ${err.message}`); }
                    }}
                    className="w-full py-2 bg-white/10 text-white/70 rounded-lg text-sm hover:bg-white/20 flex items-center justify-center gap-2 mb-4"
                  >
                    <Download className="w-4 h-4" />
                    Load Account List
                  </button>
                </div>

                {accountsList && (
                  <div className="space-y-4">
                    {(accountsFilter === "all" || accountsFilter === "tier1") && accountsList.tier1 && (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">🔥 Tier 1 - Engage Daily</h4>
                        <div className="grid gap-3">
                          {accountsList.tier1.map((acc: any, i: number) => (
                            <div key={i} className="p-3 bg-black/20 rounded-lg flex items-start justify-between">
                              <div>
                                <a href={`https://twitter.com/${acc.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline font-medium">{acc.handle}</a>
                                <span className="text-xs text-white/40 ml-2">{acc.name}</span>
                                <p className="text-xs text-white/50 mt-1">{acc.why}</p>
                                <p className="text-xs text-emerald-400/70 mt-1">→ {acc.engageHow}</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 bg-white/10 rounded text-white/40">{acc.followers}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(accountsFilter === "all" || accountsFilter === "tier2") && accountsList.tier2 && (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">📊 Tier 2 - Engage 3-4x/Week</h4>
                        <div className="grid gap-3">
                          {accountsList.tier2.map((acc: any, i: number) => (
                            <div key={i} className="p-3 bg-black/20 rounded-lg flex items-start justify-between">
                              <div>
                                <a href={`https://twitter.com/${acc.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline font-medium">{acc.handle}</a>
                                <span className="text-xs text-white/40 ml-2">{acc.name}</span>
                                <p className="text-xs text-white/50 mt-1">{acc.why}</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 bg-white/10 rounded text-white/40">{acc.followers}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(accountsFilter === "all" || accountsFilter === "tier3") && accountsList.tier3 && (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">🎯 Tier 3 - When Relevant</h4>
                        <div className="grid gap-3">
                          {accountsList.tier3.map((acc: any, i: number) => (
                            <div key={i} className="p-3 bg-black/20 rounded-lg flex items-start justify-between">
                              <div>
                                <a href={`https://twitter.com/${acc.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline font-medium">{acc.handle}</a>
                                <span className="text-xs text-white/40 ml-2">{acc.name}</span>
                                <p className="text-xs text-white/50 mt-1">{acc.why}</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 bg-white/10 rounded text-white/40">{acc.followers}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(accountsFilter === "all" || accountsFilter === "techAI") && accountsList.techAI && (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
                        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">🤖 AI/Tech Twitter</h4>
                        <div className="grid gap-3">
                          {accountsList.techAI.map((acc: any, i: number) => (
                            <div key={i} className="p-3 bg-black/20 rounded-lg flex items-start justify-between">
                              <div>
                                <a href={`https://twitter.com/${acc.handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-[#1DA1F2] hover:underline font-medium">{acc.handle}</a>
                                <span className="text-xs text-white/40 ml-2">{acc.name}</span>
                                <p className="text-xs text-white/50 mt-1">{acc.why}</p>
                              </div>
                              <span className="text-[10px] px-2 py-1 bg-white/10 rounded text-white/40">{acc.followers}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-white/60 mb-2">🎯 Engagement Strategy</h4>
                  <ul className="space-y-1 text-xs text-white/40">
                    <li>• <span className="text-white/60">Tier 1</span> - Reply to their tweets daily, they'll start recognizing you</li>
                    <li>• <span className="text-white/60">Tier 2</span> - Engage when they post relevant content</li>
                    <li>• <span className="text-white/60">Tier 3</span> - Only tag when genuinely relevant (they have huge audiences)</li>
                    <li>• <span className="text-white/60">Add value</span> - Never "great post!", always add insight</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Post Editor Modal */}
      <AnimatePresence>
        {editingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-lg font-semibold text-white">{editingPost.title}</h3>
                  <p className="text-xs text-white/50">/{editingPost.slug} • {editingPost.read_time_minutes} min • SEO: {editingPost.seo_score}/100</p>
                </div>
                <button onClick={() => setEditingPost(null)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-xl border border-zinc-800">
                  {editingPost.content}
                </pre>
              </div>
              <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-3 py-1 rounded-full capitalize",
                    editingPost.status === "published" && "bg-emerald-500/20 text-emerald-400",
                    editingPost.status === "review" && "bg-yellow-500/20 text-yellow-400",
                    editingPost.status === "draft" && "bg-white/10 text-white/50"
                  )}>
                    {editingPost.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {editingPost.status !== "published" && (
                    <button
                      onClick={() => {
                        updatePostStatus(editingPost.id, "published");
                        setEditingPost(null);
                      }}
                      className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/30 transition-colors flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Publish
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(editingPost.content);
                    }}
                    className="px-4 py-2 bg-white/10 text-white/70 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                  >
                    Copy Markdown
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Preview Modal - Fullscreen with Tabs */}
      <AnimatePresence>
        {previewGeneration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex flex-col"
          >
            {/* Header - Responsive */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#0a0a0a] gap-3">
              <div className="flex items-center justify-between lg:justify-start gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#71717a]/20 to-[#52525b]/10 flex items-center justify-center shrink-0">
                    <Code className="w-4 h-4 text-[#71717a]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{previewGeneration.title || "Generation Preview"}</h3>
                    <p className="text-xs text-white/50 truncate">
                      {previewGeneration.user_email} • {new Date(previewGeneration.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {/* Close button - mobile only */}
                <button
                  onClick={() => {
                    setPreviewGeneration(null);
                    setPreviewTab("preview");
                  }}
                  className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
              
              {/* Tabs - scrollable on mobile */}
              <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
                <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 w-max lg:w-auto">
                  {[
                    { id: "preview", label: "Preview", icon: Monitor },
                    { id: "input", label: "Input", icon: Video },
                    { id: "flow", label: "Flow", icon: GitBranch },
                    { id: "library", label: "Library", icon: BookOpen },
                    { id: "code", label: "Code", icon: Code },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setPreviewTab(tab.id as any)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap",
                        previewTab === tab.id
                          ? "bg-[#71717a] text-white"
                          : "text-white/50 hover:text-white/70 hover:bg-white/5"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={() => {
                    if (previewGeneration.code) {
                      navigator.clipboard.writeText(previewGeneration.code);
                      setToastMessage("✅ Code copied to clipboard!");
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
                <button
                  onClick={() => {
                    if (previewGeneration.code) {
                      const blob = new Blob([previewGeneration.code], { type: "text/html" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `generation-${previewGeneration.id.slice(0, 8)}.html`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={() => {
                    setPreviewGeneration(null);
                    setPreviewTab("preview");
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>
            </div>
            
            {/* Content Area - Fullscreen */}
            <div className="flex-1 overflow-hidden">
              {/* Preview Tab */}
              {previewTab === "preview" && (
                <div className="w-full h-full bg-white">
                  {previewGeneration.code ? (
                    <iframe
                      srcDoc={previewGeneration.code}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin"
                      title="Generation Preview"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/30">
                      No preview available
                    </div>
                  )}
                </div>
              )}
              
              {/* Input Tab - Video */}
              {previewTab === "input" && (
                <div className="w-full h-full flex items-center justify-center bg-[#0a0a0a] p-8">
                  {previewGeneration.video_url ? (
                    <div className="max-w-4xl w-full">
                      <video
                        src={previewGeneration.video_url}
                        controls
                        className="w-full rounded-2xl shadow-2xl"
                        style={{ maxHeight: "70vh" }}
                      />
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-white/50">
                          <span>Duration: {previewGeneration.video_duration || "N/A"}s</span>
                          <span>Style: {previewGeneration.style_directive || "Auto-Detect"}</span>
                        </div>
                        <a 
                          href={previewGeneration.video_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#71717a]/20 text-[#71717a] hover:bg-[#71717a]/30 transition-colors text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in New Tab
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-8 h-8 text-white/30" />
                      </div>
                      <p className="text-white/50">No input video available</p>
                      <p className="text-white/30 text-sm mt-1">Video might have been deleted or not saved</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Code Tab */}
              {previewTab === "code" && (
                <div className="w-full h-full overflow-auto bg-[#0d0d0d] p-6">
                  <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Code className="w-5 h-5 text-[#71717a]" />
                        <span className="text-white/70 text-sm">
                          Generated HTML • {previewGeneration.code?.length.toLocaleString() || 0} characters
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          if (previewGeneration.code) {
                            navigator.clipboard.writeText(previewGeneration.code);
                            setToastMessage("✅ Code copied to clipboard!");
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-sm"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </button>
                    </div>
                    <pre className="p-6 bg-black/50 rounded-xl border border-zinc-800 text-sm text-white/70 font-mono whitespace-pre-wrap overflow-x-auto">
                      {previewGeneration.code || "No code available"}
                    </pre>
                  </div>
                </div>
              )}
              
              {/* Library Tab (Design System) */}
              {previewTab === "library" && (
                <div className="w-full h-full overflow-auto bg-[#0a0a0a] p-8">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                      <Palette className="w-5 h-5 text-[#71717a]" />
                      <h3 className="text-lg font-semibold text-white">Design System</h3>
                    </div>
                    
                    {(() => {
                      // Use stored design system if available, otherwise extract from code
                      const ds = previewGeneration.design_system;
                      
                      // Try to extract colors from the code as fallback
                      const colorMatches = previewGeneration.code?.match(/(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|rgb\([^)]+\)|rgba\([^)]+\))/g) || [];
                      const extractedColors = [...new Set(colorMatches)].slice(0, 12);
                      const colors = ds?.colors?.length ? ds.colors : extractedColors;
                      
                      // Try to extract font families from code as fallback
                      const fontMatches = previewGeneration.code?.match(/font-family:\s*['"]?([^'";\n]+)/gi) || [];
                      const extractedFonts = [...new Set(fontMatches.map(f => f.replace(/font-family:\s*['"]?/i, '').trim()))].slice(0, 4);
                      const fonts = ds?.fonts?.length ? ds.fonts : extractedFonts;
                      
                      return (
                        <div className="space-y-8">
                          {/* Style Preset Banner */}
                          {(ds?.styleName || ds?.stylePreset) && (
                            <div className="bg-gradient-to-r from-[#71717a]/20 to-[#52525b]/10 rounded-2xl p-6 border border-[#71717a]/30">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#71717a]/30 flex items-center justify-center">
                                  <Sparkles className="w-6 h-6 text-[#71717a]" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-white">{ds?.styleName || ds?.stylePreset}</h4>
                                  <p className="text-sm text-white/50">Applied style preset</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Colors */}
                          <div className="bg-white/5 rounded-2xl p-6 border border-zinc-800">
                            <h4 className="text-sm font-medium text-white/70 mb-4">
                              {ds?.colors?.length ? "Design Colors" : "Extracted Colors"}
                            </h4>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                              {colors.length > 0 ? colors.map((color: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    navigator.clipboard.writeText(color);
                                    setToastMessage(`✅ Copied: ${color}`);
                                  }}
                                  className="group"
                                >
                                  <div 
                                    className="w-full aspect-square rounded-xl border border-zinc-800 mb-2 group-hover:scale-105 transition-transform"
                                    style={{ backgroundColor: color }}
                                  />
                                  <span className="text-[10px] text-white/40 font-mono">{color}</span>
                                </button>
                              )) : (
                                <p className="col-span-full text-white/30 text-sm">No colors detected</p>
                              )}
                            </div>
                          </div>
                          
                          {/* Typography */}
                          <div className="bg-white/5 rounded-2xl p-6 border border-zinc-800">
                            <h4 className="text-sm font-medium text-white/70 mb-4">Typography</h4>
                            {fonts.length > 0 ? (
                              <div className="space-y-3">
                                {fonts.map((font: string, i: number) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
                                    <span className="text-white/70" style={{ fontFamily: font }}>{font}</span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(font);
                                        setToastMessage(`✅ Copied: ${font}`);
                                      }}
                                      className="text-xs text-white/40 hover:text-white/60"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-white/30 text-sm">No fonts detected</p>
                            )}
                          </div>
                          
                          {/* Generation Info */}
                          <div className="bg-white/5 rounded-2xl p-6 border border-zinc-800">
                            <h4 className="text-sm font-medium text-white/70 mb-4">Generation Info</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="p-3 bg-black/30 rounded-lg">
                                <span className="text-xs text-white/40">Style Directive</span>
                                <p className="text-white/70 mt-1">{previewGeneration.style_directive || "Auto-Detect"}</p>
                              </div>
                              <div className="p-3 bg-black/30 rounded-lg">
                                <span className="text-xs text-white/40">Credits Used</span>
                                <p className="text-[#71717a] mt-1">{previewGeneration.credits_used}</p>
                              </div>
                              <div className="p-3 bg-black/30 rounded-lg">
                                <span className="text-xs text-white/40">Status</span>
                                <p className={cn("mt-1", previewGeneration.status === "complete" ? "text-green-400" : "text-yellow-400")}>
                                  {previewGeneration.status}
                                </p>
                              </div>
                              <div className="p-3 bg-black/30 rounded-lg">
                                <span className="text-xs text-white/40">Code Size</span>
                                <p className="text-white/70 mt-1">{((previewGeneration.code?.length || 0) / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              {/* Flow Map Tab */}
              {previewTab === "flow" && (
                <div className="w-full h-full overflow-auto bg-[#0a0a0a] p-8">
                  <div className="max-w-5xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                      <GitBranch className="w-5 h-5 text-[#71717a]" />
                      <h3 className="text-lg font-semibold text-white">Flow Map</h3>
                    </div>
                    
                    {(() => {
                      const arch = previewGeneration.architecture;
                      const flowNodes = arch?.flowNodes || [];
                      const flowEdges = arch?.flowEdges || [];
                      
                      // Fallback: Extract section IDs from code
                      const sectionMatches = previewGeneration.code?.match(/id=["']([^"']+)["']/g) || [];
                      const sections = sectionMatches.map(m => m.replace(/id=["']|["']/g, '')).filter(s => s.length > 1 && s.length < 30);
                      const uniqueSections = [...new Set(sections)].slice(0, 10);
                      
                      // Extract links
                      const linkMatches = previewGeneration.code?.match(/href=["']#([^"']+)["']/g) || [];
                      const links = linkMatches.map(m => m.replace(/href=["']#|["']/g, ''));
                      
                      const hasStoredFlow = flowNodes.length > 0;
                      
                      return (
                        <div className="space-y-6">
                          {/* Visual Flow Diagram */}
                          {hasStoredFlow && (
                            <div className="bg-gradient-to-br from-[#71717a]/10 to-transparent rounded-2xl p-6 border border-[#71717a]/20">
                              <h4 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#71717a]" />
                                Stored Flow Architecture
                              </h4>
                              <div className="relative">
                                {/* Simple flow visualization */}
                                <div className="flex flex-wrap gap-4 justify-center">
                                  {flowNodes.map((node: any, i: number) => (
                                    <div 
                                      key={node.id || i}
                                      className="relative"
                                    >
                                      <div className={cn(
                                        "px-4 py-3 rounded-xl border text-center min-w-[120px]",
                                        node.type === "screen" || node.type === "page"
                                          ? "bg-[#71717a]/20 border-[#71717a]/50 text-white"
                                          : "bg-white/5 border-white/20 text-white/70"
                                      )}>
                                        <span className="text-xs text-white/40 block mb-1">
                                          {node.type || "node"}
                                        </span>
                                        <span className="text-sm font-medium">
                                          {node.data?.label || node.id}
                                        </span>
                                      </div>
                                      {/* Connection indicator */}
                                      {i < flowNodes.length - 1 && (
                                        <div className="absolute -right-4 top-1/2 transform translate-x-full -translate-y-1/2 text-white/30">
                                          →
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                {flowEdges.length > 0 && (
                                  <p className="text-xs text-white/40 text-center mt-4">
                                    {flowEdges.length} connection{flowEdges.length !== 1 ? 's' : ''} between screens
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Page Sections */}
                          <div className="bg-white/5 rounded-2xl p-6 border border-zinc-800">
                            <h4 className="text-sm font-medium text-white/70 mb-4">
                              {hasStoredFlow ? "HTML Sections" : "Detected Sections"}
                            </h4>
                            {uniqueSections.length > 0 ? (
                              <div className="grid grid-cols-2 gap-3">
                                {uniqueSections.map((section, i) => (
                                  <div key={i} className="flex items-center gap-3 p-3 bg-black/30 rounded-lg">
                                    <div className="w-8 h-8 rounded-lg bg-[#71717a]/20 flex items-center justify-center text-[#71717a] text-sm font-bold shrink-0">
                                      {i + 1}
                                    </div>
                                    <div className="flex-1 flex items-center justify-between min-w-0">
                                      <span className="text-white/70 font-mono text-sm truncate">#{section}</span>
                                      {links.includes(section) && (
                                        <span className="text-[10px] text-green-400 bg-green-500/20 px-2 py-0.5 rounded shrink-0 ml-2">
                                          nav link
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-white/30 text-sm">No sections with IDs detected</p>
                            )}
                          </div>
                          
                          {/* Navigation Links */}
                          <div className="bg-white/5 rounded-2xl p-6 border border-zinc-800">
                            <h4 className="text-sm font-medium text-white/70 mb-4">Navigation Links</h4>
                            {links.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {[...new Set(links)].map((link, i) => (
                                  <span 
                                    key={i}
                                    className="px-3 py-1.5 bg-black/30 rounded-lg text-sm text-white/60 font-mono"
                                  >
                                    → #{link}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-white/30 text-sm">No internal navigation links detected</p>
                            )}
                          </div>
                          
                          {/* Structure Analysis */}
                          <div className="bg-white/5 rounded-2xl p-6 border border-zinc-800">
                            <h4 className="text-sm font-medium text-white/70 mb-4">Structure Analysis</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                              {hasStoredFlow && (
                                <>
                                  <div className="p-4 bg-[#71717a]/10 rounded-lg text-center border border-[#71717a]/20">
                                    <p className="text-2xl font-bold text-[#71717a]">{flowNodes.length}</p>
                                    <p className="text-xs text-white/40 mt-1">Flow Nodes</p>
                                  </div>
                                  <div className="p-4 bg-[#71717a]/10 rounded-lg text-center border border-[#71717a]/20">
                                    <p className="text-2xl font-bold text-[#71717a]">{flowEdges.length}</p>
                                    <p className="text-xs text-white/40 mt-1">Connections</p>
                                  </div>
                                </>
                              )}
                              <div className="p-4 bg-black/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-white">{uniqueSections.length}</p>
                                <p className="text-xs text-white/40 mt-1">HTML Sections</p>
                              </div>
                              <div className="p-4 bg-black/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-white">{[...new Set(links)].length}</p>
                                <p className="text-xs text-white/40 mt-1">Nav Links</p>
                              </div>
                              <div className="p-4 bg-black/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-white">
                                  {(previewGeneration.code?.match(/<img/gi) || []).length}
                                </p>
                                <p className="text-xs text-white/40 mt-1">Images</p>
                              </div>
                              <div className="p-4 bg-black/30 rounded-lg text-center">
                                <p className="text-2xl font-bold text-white">
                                  {(previewGeneration.code?.match(/<button/gi) || []).length}
                                </p>
                                <p className="text-xs text-white/40 mt-1">Buttons</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer with meta info */}
            <div className="px-4 py-2 border-t border-zinc-800 bg-[#0a0a0a] flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/50">
              <span>ID: <span className="text-white/70 font-mono">{previewGeneration.id.slice(0, 8)}...</span></span>
              <span className="hidden sm:inline">Style: <span className="text-white/70">{previewGeneration.style_directive || "Auto"}</span></span>
              <span>Status: <span className={previewGeneration.status === "complete" ? "text-green-400" : "text-yellow-400"}>{previewGeneration.status}</span></span>
              <span>Credits: <span className="text-[#71717a]">{previewGeneration.credits_used}</span></span>
              <span className="hidden sm:inline">Duration: <span className="text-white/70">{previewGeneration.video_duration || "N/A"}s</span></span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Plan Selection Modal */}
      <AnimatePresence>
        {planModalOpen && planModalUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !isUpdatingPlan && setPlanModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Set User Plan</h3>
                  <p className="text-sm text-white/50">{planModalUser.email}</p>
                </div>
                <button
                  onClick={() => !isUpdatingPlan && setPlanModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              
              {/* Plan Options */}
              <div className="p-4 max-h-[400px] overflow-y-auto">
                <div className="space-y-2">
                  {PRO_TIERS.map((tier, idx) => (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedPlanIndex(idx)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl text-left transition-all flex items-center justify-between",
                        selectedPlanIndex === idx
                          ? "bg-[#71717a]/20 border border-[#71717a]/50"
                          : "bg-white/5 border border-zinc-800 hover:bg-white/10"
                      )}
                    >
                      <div>
                        <p className={cn(
                          "font-medium",
                          selectedPlanIndex === idx ? "text-[#71717a]" : "text-white"
                        )}>
                          {tier.label}
                        </p>
                        <p className="text-sm text-white/50">
                          {tier.credits > 0 ? `${tier.credits.toLocaleString()} credits / month` : "Membership only"}
                        </p>
                      </div>
                      {selectedPlanIndex === idx && (
                        <div className="w-6 h-6 rounded-full bg-[#71717a] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setPlanModalOpen(false)}
                  disabled={isUpdatingPlan}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={applySelectedPlan}
                  disabled={isUpdatingPlan}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#71717a] text-white hover:bg-[#52525b] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isUpdatingPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Apply Plan
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-6 left-1/2 z-50 px-5 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl shadow-xl flex items-center gap-3"
          >
            {toastMessage.startsWith("✅") ? (
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-4 h-4 text-red-400" />
              </div>
            )}
            <span className="text-sm text-white">{toastMessage.replace(/^(✅|❌)\s*/, '')}</span>
            <button 
              onClick={() => setToastMessage(null)}
              className="p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-4 h-4 text-white/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, icon: Icon, color }: { 
  title: string; 
  value: number | string; 
  icon: any; 
  color: "blue" | "green" | "yellow" | "purple" | "orange" | "cyan" | "pink" | "gray"
}) {
  const colors = {
    blue: "bg-zinc-800 text-zinc-300",
    green: "bg-zinc-800 text-zinc-300",
    yellow: "bg-zinc-800 text-zinc-300",
    purple: "bg-zinc-800 text-zinc-300",
    orange: "bg-zinc-800 text-zinc-300",
    cyan: "bg-zinc-800 text-zinc-300",
    pink: "bg-zinc-800 text-zinc-300",
    gray: "bg-zinc-800 text-zinc-300",
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", colors[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-zinc-600" />
      </div>
      <p className="text-2xl font-semibold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-zinc-500 mt-1">{title}</p>
    </div>
  );
}

