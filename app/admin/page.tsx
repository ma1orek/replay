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
  Play, FileText, PenSquare, Trash2, Plus, Send, Sparkles, Check, X, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

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
}

interface Stats {
  totalUsers: number;
  totalGenerations: number;
  totalCreditsUsed: number;
  totalTokensUsed: number;
  estimatedCostUSD: number;
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

// Gemini API cost estimation (based on approximate pricing)
// gemini-3-pro: ~$0.00125 per 1K input tokens, ~$0.005 per 1K output tokens
// Average video generation uses ~40-50K input tokens (video), ~10-15K output tokens (code)
// Estimated: (45K * 0.00125) + (12K * 0.005) = ~$0.056 + ~$0.060 = ~$0.12 per generation
const ESTIMATED_COST_PER_GENERATION_USD = 0.12; // ~$0.12 per generation (conservative)
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
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [generations, setGenerations] = useState<GenerationData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData[]>([]);
  const [feedbackStats, setFeedbackStats] = useState<FeedbackStats | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "generations" | "feedback" | "content">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [previewGeneration, setPreviewGeneration] = useState<GenerationData | null>(null);
  
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
  const [generationProgress, setGenerationProgress] = useState({ current: 0, total: 0, currentTitle: "" });

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
      alert("Enter at least 1 article");
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
    
    const credits = prompt(`Enter credits to set for ${userEmail}:`, "150");
    if (!credits) return;
    
    const creditsNum = parseInt(credits, 10);
    if (isNaN(creditsNum) || creditsNum < 0) {
      alert("Invalid credits amount");
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
        alert(`✅ Credits updated for ${userEmail}\n\nPrevious: ${data.previousCredits ?? 0}\nNew: ${creditsNum}`);
        refreshData();
      } else {
        alert(`❌ Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Toggle PRO status for a user
  const toggleUserPro = async (userId: string, currentMembership: string) => {
    if (!adminToken) return;
    
    const newMembership = currentMembership === "pro" ? "free" : "pro";
    
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${adminToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId, membership: newMembership })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, membership: newMembership } : u
        ));
      } else {
        alert(`❌ Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
    }
  };

  // Add credits to a user
  const addUserCredits = async (userId: string, userEmail: string) => {
    if (!adminToken) return;
    
    const credits = prompt(`Enter credits to ADD to ${userEmail}:`, "100");
    if (!credits) return;
    
    const creditsNum = parseInt(credits, 10);
    if (isNaN(creditsNum)) {
      alert("Invalid credits amount");
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
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, credits_free: data.user.credits_free } : u
        ));
        alert(`✅ Added ${creditsNum} credits to ${userEmail}`);
      } else {
        alert(`❌ Failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`❌ Error: ${err.message}`);
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#FF6E3C] border-t-transparent rounded-full" />
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <svg className="w-10 h-10 text-[#FF6E3C]" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="currentColor" strokeWidth="11.6182" strokeLinejoin="round"/>
              <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" fill="currentColor"/>
            </svg>
            <span className="text-2xl font-bold text-white">Admin</span>
          </div>

          <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-[#FF6E3C]" />
              <h1 className="text-xl font-semibold text-white">Admin Access</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs text-white/50 block mb-2">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
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
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#FF6E3C]/50 pr-12"
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
                className="w-full py-3 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
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
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/landing" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity shrink-0">
            <Logo />
            <div className="hidden sm:block h-6 w-px bg-white/20" />
            <span className="hidden sm:block text-lg font-medium text-white/70">Admin Panel</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/tool"
              className="p-2 sm:px-4 sm:py-2 bg-[#FF6E3C]/10 hover:bg-[#FF6E3C]/20 border border-[#FF6E3C]/20 rounded-lg text-sm text-[#FF6E3C] flex items-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">Go to Tool</span>
            </Link>
            <button
              onClick={refreshData}
              disabled={dataLoading}
              className="p-2 sm:px-4 sm:py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white/70 flex items-center gap-2 transition-colors"
            >
              <Activity className={cn("w-4 h-4", dataLoading && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 sm:px-4 sm:py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm text-red-400 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Tabs - Scrollable on mobile */}
        <div className="flex gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-none">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "generations", label: "Generations", icon: Code },
            { id: "feedback", label: "Feedback", icon: MessageSquare },
            { id: "content", label: "Content", icon: FileText },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap shrink-0",
                activeTab === tab.id
                  ? "bg-[#FF6E3C] text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Pro Users"
                value={stats?.proUsers || 0}
                icon={Shield}
                color="orange"
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
            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#FF6E3C]" />
                Gemini API Costs
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span className="text-xs text-white/50">Total Tokens</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats?.totalTokensUsed ? `${(stats.totalTokensUsed / 1000).toFixed(1)}K` : "N/A"}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    Tracked from generations
                  </p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-white/50">Est. Total Cost</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    ${stats?.estimatedCostUSD?.toFixed(2) || ((stats?.totalGenerations || generations.length) * ESTIMATED_COST_PER_GENERATION_USD).toFixed(2)}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    ~{((stats?.estimatedCostUSD || (stats?.totalGenerations || generations.length) * ESTIMATED_COST_PER_GENERATION_USD) * USD_TO_PLN).toFixed(2)} PLN
                  </p>
                </div>
                <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-white/50">Avg Tokens/Gen</span>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stats?.totalGenerations && stats?.totalTokensUsed 
                      ? `${Math.round(stats.totalTokensUsed / stats.totalGenerations / 1000)}K` 
                      : "~50K"}
                  </p>
                  <p className="text-xs text-white/30 mt-1">Per generation</p>
                </div>
              </div>
              
              {/* Cost per generation breakdown */}
              <div className="mt-4 p-3 bg-black/20 rounded-lg border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/40">Cost per generation</span>
                  <span className="text-xs font-medium text-white/80">
                    ~${stats?.totalGenerations && stats?.estimatedCostUSD 
                      ? (stats.estimatedCostUSD / stats.totalGenerations).toFixed(3) 
                      : ESTIMATED_COST_PER_GENERATION_USD.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">Cost per generation (PLN)</span>
                  <span className="text-xs font-medium text-white/80">
                    ~{((stats?.totalGenerations && stats?.estimatedCostUSD 
                      ? (stats.estimatedCostUSD / stats.totalGenerations) 
                      : ESTIMATED_COST_PER_GENERATION_USD) * USD_TO_PLN).toFixed(2)} zł
                  </span>
                </div>
              </div>
              
              <p className="text-[10px] text-white/20 mt-4">
                * Estimates based on gemini-3-pro pricing. Actual costs may vary. Check Google Cloud Console for exact billing.
              </p>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Generations Chart */}
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#FF6E3C]" />
                  Generations (Last 7 Days)
                </h3>
                <div className="h-48 flex items-end gap-2">
                  {(stats?.generationsPerDay || []).slice(-7).map((day, i) => {
                    const maxCount = Math.max(...(stats?.generationsPerDay || []).map(d => d.count), 1);
                    const height = (day.count / maxCount) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-gradient-to-t from-[#FF6E3C] to-[#FF8F5C] rounded-t-lg transition-all"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? "8px" : "2px" }}
                        />
                        <span className="text-[10px] text-white/30">{day.date.split("-")[2]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Styles */}
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#FF6E3C]" />
                  Popular Styles
                </h3>
                <div className="space-y-3">
                  {(stats?.topStyles || []).slice(0, 5).map((style, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-white/70">{style.style || "Default"}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#FF6E3C] rounded-full"
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
            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-medium text-white/70 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF6E3C]" />
                Recent Generations
              </h3>
              <div className="space-y-2">
                {generations.slice(0, 10).map(gen => (
                  <div key={gen.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Video className="w-4 h-4 text-[#FF6E3C]" />
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
                className="w-full pl-12 pr-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
              />
            </div>

            {/* Users Table */}
            <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
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
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center text-white text-xs font-medium">
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
                              toggleUserPro(user.id, user.membership || "free");
                            }}
                            className={cn(
                              "text-xs px-2 py-1 rounded-full transition-colors cursor-pointer hover:opacity-80",
                              user.membership === "pro" 
                                ? "bg-[#FF6E3C]/20 text-[#FF6E3C] hover:bg-[#FF6E3C]/30" 
                                : "bg-white/5 text-white/50 hover:bg-white/10"
                            )}
                            title="Click to toggle PRO status"
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
                            <span className="text-[#FF6E3C]">{user.credits_purchased || 0}</span>
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
                            className="text-xs px-2 py-1 rounded bg-[#FF6E3C]/20 text-[#FF6E3C] hover:bg-[#FF6E3C]/30 transition-colors"
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
                  className="w-full pl-12 pr-4 py-3 bg-[#111] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
                />
              </div>
              {selectedUser && (
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-3 bg-[#FF6E3C]/10 border border-[#FF6E3C]/20 rounded-xl text-[#FF6E3C] text-sm flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Clear filter
                </button>
              )}
            </div>

            {/* Generations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGenerations.map(gen => (
                <div key={gen.id} className="bg-[#111] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center">
                        <Code className="w-4 h-4 text-[#FF6E3C]" />
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
                      <span className="text-[#FF6E3C]">{gen.credits_used}</span>
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
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#FF6E3C]/20 text-[#FF6E3C] hover:bg-[#FF6E3C]/30 transition-colors text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Preview
                    </button>
                  )}
                </div>
              ))}
            </div>

            {filteredGenerations.length === 0 && (
              <div className="py-12 text-center text-white/30 bg-[#111] border border-white/10 rounded-xl">
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
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">{feedbackStats?.total || 0}</p>
                <p className="text-xs text-white/50 mt-1">Total Responses</p>
              </div>
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                    <ThumbsUp className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{feedbackStats?.yes || 0}</p>
                <p className="text-xs text-white/50 mt-1">Yes (Matched)</p>
              </div>
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
                    <Meh className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{feedbackStats?.kinda || 0}</p>
                <p className="text-xs text-white/50 mt-1">Kinda</p>
              </div>
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
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
              <div className="bg-[#111] border border-white/10 rounded-xl p-6">
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
            <div className="bg-[#111] border border-white/10 rounded-xl">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#FF6E3C]" />
                  All Feedback ({feedback.length})
                </h3>
              </div>
              <div className="divide-y divide-white/5">
                {feedback.length === 0 ? (
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
            <div className="bg-[#111] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#FF6E3C]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Replay Content Engine</h2>
                  <p className="text-xs text-white/50">Generate SEO-optimized articles using Gemini 2.5</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left - Mode Toggle & Input */}
                <div className="space-y-4">
                  {/* Mode Toggle */}
                  <div className="flex items-center gap-2 p-1 bg-black/30 rounded-xl border border-white/10">
                    <button
                      onClick={() => setAutoMode(true)}
                      className={cn(
                        "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                        autoMode 
                          ? "bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white" 
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
                          ? "bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white" 
                          : "text-white/50 hover:text-white/70"
                      )}
                    >
                      <PenSquare className="w-4 h-4" />
                      Manual
                    </button>
                  </div>

                  {/* Auto Mode - Just Number Input */}
                  {autoMode ? (
                    <div className="p-5 bg-gradient-to-br from-[#FF6E3C]/10 to-transparent border border-[#FF6E3C]/20 rounded-xl">
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="w-5 h-5 text-[#FF6E3C]" />
                        <div>
                          <p className="text-sm font-medium text-white">AI picks the best SEO topics</p>
                          <p className="text-xs text-white/50">Just enter how many articles you want</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-white/70">Generate</label>
                        <input
                          type="number"
                          min={1}
                          value={autoCount}
                          onChange={(e) => setAutoCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-24 px-4 py-3 bg-black/50 border border-white/20 rounded-xl text-white text-lg font-bold text-center focus:outline-none focus:border-[#FF6E3C]/50"
                        />
                        <label className="text-sm text-white/70">articles</label>
                      </div>
                      <p className="text-xs text-white/40 mt-3">
                        AI will generate {autoCount} unique SEO-optimized topics: comparisons, tutorials, how-tos
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
                        placeholder="Replay vs v0.dev - which handles complex state better?&#10;How to build a SaaS dashboard with Supabase using Video&#10;Stop renaming props manually: The problem with Image-to-Code AI"
                        rows={6}
                        className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 resize-none"
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
                      placeholder="video to code ai"
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50"
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
                              ? "border-[#FF6E3C]/50 bg-[#FF6E3C]/10"
                              : "border-white/10 bg-black/20 hover:border-white/20"
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
                      placeholder="Mention Supabase integration&#10;Include code examples&#10;Compare with competitors"
                      rows={3}
                      className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 resize-none"
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
                  className="px-6 py-3 bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
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
                        className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] transition-all duration-300"
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
                <div className="mt-6 p-4 bg-black/30 rounded-xl border border-white/10">
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
                                  className="text-[#FF6E3C] text-xs hover:underline flex-shrink-0"
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
                                className="px-2 py-1 text-xs bg-[#FF6E3C]/20 text-[#FF6E3C] rounded hover:bg-[#FF6E3C]/30 transition-colors flex items-center gap-1"
                              >
                                <ExternalLink className="w-3 h-3" /> View
                              </a>
                            )}
                            {result.content && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(result.content);
                                  alert("Content copied to clipboard!");
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
            <div className="bg-[#111] border border-white/10 rounded-xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-sm font-medium text-white/70 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#FF6E3C]" />
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
                          ? "bg-[#FF6E3C]/20 text-[#FF6E3C]"
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
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div>
                  <h3 className="text-lg font-semibold text-white">{editingPost.title}</h3>
                  <p className="text-xs text-white/50">/{editingPost.slug} • {editingPost.read_time_minutes} min • SEO: {editingPost.seo_score}/100</p>
                </div>
                <button onClick={() => setEditingPost(null)} className="p-2 hover:bg-white/10 rounded-lg">
                  <X className="w-5 h-5 text-white/50" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-sm text-white/70 whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-xl border border-white/10">
                  {editingPost.content}
                </pre>
              </div>
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
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
      
      {/* Preview Modal */}
      <AnimatePresence>
        {previewGeneration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewGeneration(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF8F5C]/10 flex items-center justify-center">
                    <Code className="w-5 h-5 text-[#FF6E3C]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{previewGeneration.title || "Generation Preview"}</h3>
                    <p className="text-xs text-white/50">
                      {previewGeneration.user_email} • {new Date(previewGeneration.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download HTML
                  </button>
                  <button
                    onClick={() => setPreviewGeneration(null)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="text-white/60 text-xl">×</span>
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 h-[calc(90vh-80px)]">
                {/* Preview iframe */}
                <div className="border-r border-white/10 p-4 h-full">
                  <div className="text-xs text-white/40 mb-2 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    Live Preview
                  </div>
                  <div className="bg-white rounded-lg overflow-hidden h-[calc(100%-24px)]">
                    {previewGeneration.code && (
                      <iframe
                        srcDoc={previewGeneration.code}
                        className="w-full h-full border-0"
                        sandbox="allow-scripts allow-same-origin"
                        title="Generation Preview"
                      />
                    )}
                  </div>
                </div>
                
                {/* Code view */}
                <div className="p-4 h-full overflow-hidden flex flex-col">
                  <div className="text-xs text-white/40 mb-2 flex items-center gap-2">
                    <Code className="w-3.5 h-3.5" />
                    Generated Code ({previewGeneration.code?.length.toLocaleString() || 0} chars)
                  </div>
                  <div className="flex-1 bg-[#0d0d0d] rounded-lg overflow-auto">
                    <pre className="p-4 text-xs text-white/70 font-mono whitespace-pre-wrap break-all">
                      {previewGeneration.code || "No code available"}
                    </pre>
                  </div>
                </div>
              </div>
              
              {/* Meta info */}
              <div className="p-4 border-t border-white/10 flex items-center gap-6 text-xs text-white/50">
                <span>Style: <span className="text-white/70">{previewGeneration.style_directive || "Default"}</span></span>
                <span>Status: <span className={previewGeneration.status === "complete" ? "text-green-400" : "text-yellow-400"}>{previewGeneration.status}</span></span>
                <span>Credits: <span className="text-[#FF6E3C]">{previewGeneration.credits_used}</span></span>
                {previewGeneration.video_url && (
                  <a 
                    href={previewGeneration.video_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#FF6E3C] hover:underline flex items-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5" />
                    View Source Video
                  </a>
                )}
              </div>
            </motion.div>
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
  color: "blue" | "green" | "yellow" | "purple" | "orange" | "cyan" | "pink"
}) {
  const colors = {
    blue: "from-blue-500/20 to-blue-600/10 text-blue-400",
    green: "from-green-500/20 to-green-600/10 text-green-400",
    yellow: "from-yellow-500/20 to-yellow-600/10 text-yellow-400",
    purple: "from-purple-500/20 to-purple-600/10 text-purple-400",
    orange: "from-orange-500/20 to-orange-600/10 text-orange-400",
    cyan: "from-cyan-500/20 to-cyan-600/10 text-cyan-400",
    pink: "from-pink-500/20 to-pink-600/10 text-pink-400",
  };

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center", colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/20" />
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="text-xs text-white/50 mt-1">{title}</p>
    </div>
  );
}

