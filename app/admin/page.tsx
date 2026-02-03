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
  Layers, GitBranch, Monitor, Maximize2, Copy, Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { DitheringShader } from "@/components/ui/dithering-shader";

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
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "generations" | "feedback" | "content" | "viral">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [previewGeneration, setPreviewGeneration] = useState<GenerationData | null>(null);
  const [previewTab, setPreviewTab] = useState<"preview" | "input" | "code" | "design" | "flow">("preview");
  
  // Content Engine state
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [blogTotal, setBlogTotal] = useState(0);
  const [blogLoading, setBlogLoading] = useState(false);
  const [generateTitles, setGenerateTitles] = useState("");
  const [generateKeyword, setGenerateKeyword] = useState("");
  const [generateTone, setGenerateTone] = useState<"technical" | "controversial" | "tutorial" | "comparison">("technical");
  const [generateTakeaways, setGenerateTakeaways] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResults, setGenerateResults] = useState<any[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [blogFilter, setBlogFilter] = useState<"all" | "draft" | "review" | "published">("all");
  const [autoMode, setAutoMode] = useState(true); // Auto-generate mode (AI picks topics)
  const [autoCount, setAutoCount] = useState(10); // Number of articles to auto-generate
  const [showMobileSidebar, setShowMobileSidebar] = useState(false); // Mobile sidebar state
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, currentTitle: "" });
  
  // Viral Post Generator state
  const [viralContext, setViralContext] = useState("");
  const [viralCategory, setViralCategory] = useState<"arrogant" | "numbers" | "contrarian" | "philosophy">("arrogant");
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
  
  // Toast message for styled alerts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  // Update dimensions on mount
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth * 2, height: window.innerHeight * 2 });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
      const response = await fetch(`/api/admin/blog?status=${blogFilter}&limit=500`, {
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
  }, [blogFilter]);

  // Generate articles
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
      
      setGenerationProgress({ current: 0, total: titlesToGenerate.length, currentTitle: "" });
      
      // Generate articles one by one
      for (let i = 0; i < titlesToGenerate.length; i++) {
        const title = titlesToGenerate[i];
        setGenerationProgress({ current: i + 1, total: titlesToGenerate.length, currentTitle: title });
        
        try {
          const response = await fetch("/api/admin/generate-article", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Authorization": `Bearer ${adminToken}`
            },
            body: JSON.stringify({
              singleTitle: title,
              targetKeyword: generateKeyword.trim() || undefined,
              tone: generateTone,
              keyTakeaways: generateTakeaways.split('\n').filter(t => t.trim()),
              saveToDB: true
            })
          });

          const data = await response.json();
          
          if (data.result) {
            setGenerateResults(prev => [...prev, data.result]);
          } else {
            setGenerateResults(prev => [...prev, { title, error: true }]);
          }
        } catch (err) {
          console.error(`Error generating "${title}":`, err);
          setGenerateResults(prev => [...prev, { title, error: true }]);
        }
        
        // Longer delay between requests to avoid DB connection exhaustion
        if (i < titlesToGenerate.length - 1) {
          await new Promise(r => setTimeout(r, 2000)); // 2 seconds between each article
        }
      }
      
      // Refresh blog posts
      loadBlogPosts(adminToken);
      // Clear form
      setGenerateTitles("");
      setGenerateKeyword("");
      setGenerateTakeaways("");
      
    } catch (error) {
      console.error("Generation error:", error);
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
    }
  }, [activeTab, blogFilter, adminToken, loadBlogPosts]);

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
  // Sandbox: $0, 0 credits
  // Pro: $149/mo, 3,000 credits  
  // Agency: $499/mo, 15,000 credits
  // Enterprise: Custom
  const PRO_TIERS = [
    { id: "sandbox", label: "Sandbox (Free)", credits: 0, membership: "free", isTopup: false, price: "$0" },
    { id: "pro", label: "Pro ($149/mo)", credits: 3000, membership: "pro", isTopup: false, price: "$149/mo" },
    { id: "agency", label: "Agency ($499/mo)", credits: 15000, membership: "agency", isTopup: false, price: "$499/mo" },
    { id: "enterprise", label: "Enterprise (Custom)", credits: 50000, membership: "enterprise", isTopup: false, price: "Custom" },
  ];

  // Open plan selection modal
  const openPlanModal = (userId: string, userEmail: string, currentMembership: string) => {
    const currentIndex = PRO_TIERS.findIndex(t => 
      t.id === currentMembership || (currentMembership === "pro" && t.id === "pro100")
    );
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
        <div className="absolute inset-0 z-0">
          <DitheringShader
            width={dimensions.width}
            height={dimensions.height}
            shape="wave"
            type="8x8"
            colorBack="#0a0a0a"
            colorFront="#111111"
            pxSize={4}
            speed={0.2}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a]/90 via-[#0a0a0a]/70 to-[#0a0a0a]/90" />
        </div>
        <div className="relative z-10 animate-spin w-8 h-8 border-2 border-zinc-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Dithering Shader Background */}
        <div className="absolute inset-0 z-0">
          <DitheringShader
            width={dimensions.width}
            height={dimensions.height}
            shape="wave"
            type="8x8"
            colorBack="#0a0a0a"
            colorFront="#111111"
            pxSize={4}
            speed={0.2}
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a]/90 via-[#0a0a0a]/70 to-[#0a0a0a]/90" />
        </div>
        
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
      {/* Dithering Shader Background */}
      <div className="fixed inset-0 z-0">
        <DitheringShader
          width={dimensions.width}
          height={dimensions.height}
          shape="wave"
          type="8x8"
          colorBack="#0a0a0a"
          colorFront="#111111"
          pxSize={4}
          speed={0.2}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a]/90 via-[#0a0a0a]/70 to-[#0a0a0a]/90" />
      </div>

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
                            {user.membership === "pro" ? "⭐ PRO" : "free"}
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

            {/* Blog Posts List */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#71717a]" />
                  Generated Articles ({blogTotal} total{blogFilter !== 'all' ? `, showing ${blogPosts.length}` : ''})
                </h3>
                <div className="flex items-center gap-2">
                  {["all", "draft", "review", "published"].map(status => (
                    <button
                      key={status}
                      onClick={() => setBlogFilter(status as any)}
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
            </div>
          </div>
        )}

        {/* Viral Tab - X Post Generator */}
        {activeTab === "viral" && (
          <div className="space-y-6">
            {/* Generator Form */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-br from-[#1DA1F2]/20 to-[#1DA1F2]/5 border border-[#1DA1F2]/20">
                  <Zap className="w-5 h-5 text-[#1DA1F2]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Viral Post Generator</h2>
                  <p className="text-xs text-white/50">Tibo-style posts for X - generate 3 viral variations</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Context Input */}
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

                {/* Category & Tone Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Category</label>
                    <select
                      value={viralCategory}
                      onChange={(e) => setViralCategory(e.target.value as any)}
                      className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#1DA1F2]/50 appearance-none cursor-pointer"
                    >
                      <option value="arrogant">🏆 Arrogant Builder - Speed flex</option>
                      <option value="numbers">📊 Numbers Flex - Data/traction</option>
                      <option value="contrarian">🔥 Contrarian Take - Challenge status quo</option>
                      <option value="philosophy">💭 Philosophy - Founder wisdom</option>
                    </select>
                  </div>

                  {/* Tone */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Tone</label>
                    <select
                      value={viralTone}
                      onChange={(e) => setViralTone(e.target.value as any)}
                      className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white focus:outline-none focus:border-[#1DA1F2]/50 appearance-none cursor-pointer"
                    >
                      <option value="aggressive">⚡ Aggressive - Bold & direct</option>
                      <option value="data-driven">📈 Data-Driven - Numbers first</option>
                      <option value="philosophical">🧠 Philosophical - Reflective</option>
                      <option value="meme">😏 Meme - Witty & internet-native</option>
                    </select>
                  </div>
                </div>

                {/* Asset URL (optional) */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Asset URL <span className="text-white/30">(optional - image/video link)</span>
                  </label>
                  <input
                    type="url"
                    value={viralAssetUrl}
                    onChange={(e) => setViralAssetUrl(e.target.value)}
                    placeholder="https://... (optional)"
                    className="w-full px-4 py-3 bg-black/30 border border-zinc-800 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#1DA1F2]/50"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={async () => {
                    if (!viralContext.trim()) {
                      setToastMessage("Enter some context first!");
                      return;
                    }
                    setIsGeneratingViral(true);
                    setViralResults(null);
                    try {
                      const res = await fetch("/api/admin/generate-viral", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${adminToken}`,
                        },
                        body: JSON.stringify({
                          context: viralContext,
                          category: viralCategory,
                          tone: viralTone,
                          assetUrl: viralAssetUrl || undefined,
                        }),
                      });
                      const data = await res.json();
                      if (data.error) {
                        setToastMessage(`Error: ${data.error}`);
                      } else {
                        setViralResults(data);
                      }
                    } catch (err: any) {
                      setToastMessage(`Error: ${err.message}`);
                    } finally {
                      setIsGeneratingViral(false);
                    }
                  }}
                  disabled={isGeneratingViral || !viralContext.trim()}
                  className="w-full py-3 bg-gradient-to-r from-[#1DA1F2] to-[#1DA1F2]/80 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingViral ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating 3 viral posts...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Generate 3 Viral Posts
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            {viralResults && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#1DA1F2]" />
                  Generated Posts
                  <span className="text-white/30">- Best pick highlighted</span>
                </h3>

                {viralResults.posts.map((post, index) => (
                  <div
                    key={index}
                    className={cn(
                      "bg-zinc-900/50 border rounded-xl p-5 transition-all",
                      index === viralResults.bestPick
                        ? "border-[#1DA1F2]/50 ring-1 ring-[#1DA1F2]/20"
                        : "border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          Post #{index + 1}
                        </span>
                        {index === viralResults.bestPick && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1DA1F2]/20 text-[#1DA1F2] font-medium">
                            ⭐ BEST PICK
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/40">
                          {post.charCount} chars
                        </span>
                        <div className={cn(
                          "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg",
                          post.viralScore >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                          post.viralScore >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        )}>
                          <TrendingUp className="w-3 h-3" />
                          {post.viralScore}/100
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="bg-black/30 rounded-xl p-4 border border-zinc-800 mb-3">
                      <pre className="text-sm text-white whitespace-pre-wrap font-sans leading-relaxed">
                        {post.content}
                      </pre>
                    </div>

                    {/* Hooks & CTA */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      {post.hooks.slice(0, 2).map((hook, i) => (
                        <span key={i} className="text-[10px] px-2 py-1 bg-white/5 rounded-lg text-white/50 truncate max-w-[200px]">
                          Hook: {hook}
                        </span>
                      ))}
                      <span className="text-[10px] px-2 py-1 bg-[#1DA1F2]/10 rounded-lg text-[#1DA1F2]/70">
                        CTA: {post.callToAction}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(post.content);
                          setCopiedPostIndex(index);
                          setTimeout(() => setCopiedPostIndex(null), 2000);
                        }}
                        className="flex-1 py-2 bg-white/10 text-white/70 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
                      >
                        {copiedPostIndex === index ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                      <a
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.content)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 bg-[#1DA1F2]/20 text-[#1DA1F2] rounded-lg text-sm font-medium hover:bg-[#1DA1F2]/30 transition-colors flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Post to X
                      </a>
                    </div>
                  </div>
                ))}

                {/* Alt Text if asset was provided */}
                {viralResults.altText && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-white/70">Generated Alt Text</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(viralResults.altText!);
                          setToastMessage("Alt text copied!");
                        }}
                        className="p-1 hover:bg-white/10 rounded"
                      >
                        <Copy className="w-3 h-3 text-white/40" />
                      </button>
                    </div>
                    <p className="text-sm text-white/50">{viralResults.altText}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tips Section */}
            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4">
              <h4 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1DA1F2]/50" />
                Tibo-Style Tips
              </h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li>• <span className="text-white/60">Numbers win</span> - "4 minutes" beats "quickly"</li>
                <li>• <span className="text-white/60">Short lines</span> - Break after every 1-2 sentences</li>
                <li>• <span className="text-white/60">Hook first</span> - Controversial take or metric in line 1</li>
                <li>• <span className="text-white/60">No corporate speak</span> - Never "excited to announce"</li>
                <li>• <span className="text-white/60">End strong</span> - "Building X in public" or a question</li>
              </ul>
            </div>
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
                    { id: "code", label: "Code", icon: Code },
                    { id: "design", label: "Design", icon: Palette },
                    { id: "flow", label: "Flow", icon: GitBranch },
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
              
              {/* Design System Tab */}
              {previewTab === "design" && (
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

