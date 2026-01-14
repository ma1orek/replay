"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Settings,
  Key,
  Database,
  BarChart3,
  Loader2,
  Eye,
  EyeOff,
  Check,
  Table,
  Shield,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle,
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

// Types
interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: {
    id: string;
    name: string;
    createdAt?: string;
  };
  onDelete?: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

interface TableInfo {
  table_name: string;
  table_type: string;
  row_count?: number;
  has_rls?: boolean;
}

interface SecretsData {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// Tabs configuration
const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "secrets", label: "Secrets", icon: Key },
  { id: "database", label: "Database", icon: Database },
  { id: "analytics", label: "Share", icon: ExternalLink },
];

// Helper to get secrets from localStorage
function getProjectSecrets(projectId: string): SecretsData | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(`replay_secrets_${projectId}`);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

// Helper to save secrets to localStorage
function saveProjectSecrets(projectId: string, secrets: SecretsData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`replay_secrets_${projectId}`, JSON.stringify(secrets));
  // Also save globally for iframe preview access
  if (secrets.supabaseUrl) {
    localStorage.setItem('replay_supabase_url', secrets.supabaseUrl);
  }
  if (secrets.supabaseAnonKey) {
    localStorage.setItem('replay_supabase_key', secrets.supabaseAnonKey);
  }
}

// Helper to clear secrets
function clearProjectSecrets(projectId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`replay_secrets_${projectId}`);
}

export default function ProjectSettingsModal({
  isOpen,
  onClose,
  project,
  onDelete,
  onRename,
}: ProjectSettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [projectName, setProjectName] = useState(project.name);

  // Sync projectName with project.name when it changes (e.g., when opening modal for different project)
  useEffect(() => {
    setProjectName(project.name);
  }, [project.name, project.id]);

  // Secrets state
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [showUrl, setShowUrl] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isSavingSecrets, setIsSavingSecrets] = useState(false);
  const [secretsSaved, setSecretsSaved] = useState(false);

  // Database state
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);


  // Load secrets on mount - with STRICT validation
  useEffect(() => {
    const secrets = getProjectSecrets(project.id);
    if (secrets) {
      setSupabaseUrl(secrets.supabaseUrl || '');
      setSupabaseAnonKey(secrets.supabaseAnonKey || '');
      
      // Only set connected if BOTH credentials are valid
      const url = secrets.supabaseUrl || '';
      const key = secrets.supabaseAnonKey || '';
      const urlRegex = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/;
      const urlValid = url.length > 0 && urlRegex.test(url.trim());
      const keyValid = key.length >= 100 && key.startsWith('eyJ');
      
      setIsConnected(urlValid && keyValid);
      console.log("[Modal Load] URL valid:", urlValid, "Key valid:", keyValid, "Connected:", urlValid && keyValid);
    } else {
      setIsConnected(false);
    }
  }, [project.id]);

  // Save secrets - STRICT validation required
  const handleSaveSecrets = async () => {
    setIsSavingSecrets(true);
    setDbError(null); // Clear any previous errors
    
    const trimmedUrl = supabaseUrl.trim();
    const trimmedKey = supabaseAnonKey.trim();
    
    // STRICT URL validation: must be https://[project-id].supabase.co
    const urlRegex = /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/;
    const urlValid = trimmedUrl.length > 0 && urlRegex.test(trimmedUrl);
    
    // STRICT Key validation: must start with eyJ and be 100+ chars (JWT format)
    const keyValid = trimmedKey.length >= 100 && trimmedKey.startsWith('eyJ');
    
    // If URL provided but invalid
    if (trimmedUrl.length > 0 && !urlValid) {
      setDbError("URL must be format: https://your-project.supabase.co");
      setIsSavingSecrets(false);
      return;
    }
    
    // If Key provided but invalid
    if (trimmedKey.length > 0 && !keyValid) {
      setDbError("API Key must be a valid JWT (starts with eyJ, 100+ characters)");
      setIsSavingSecrets(false);
      return;
    }
    
    // Only save if BOTH are valid OR BOTH are empty (clearing)
    const bothValid = urlValid && keyValid;
    const bothEmpty = trimmedUrl.length === 0 && trimmedKey.length === 0;
    
    if (!bothValid && !bothEmpty) {
      setDbError("Both URL and API Key are required and must be valid");
      setIsSavingSecrets(false);
      return;
    }

    // Save to localStorage (or clear if both empty)
    if (bothEmpty) {
      // Clear secrets
      localStorage.removeItem(`replay_secrets_${project.id}`);
      localStorage.removeItem('replay_supabase_url');
      localStorage.removeItem('replay_supabase_key');
      console.log("[Secrets] Cleared all Supabase credentials");
    } else {
      saveProjectSecrets(project.id, {
        supabaseUrl: trimmedUrl,
        supabaseAnonKey: trimmedKey,
      });
      console.log("[Secrets] Saved valid Supabase credentials");
    }

    // Small delay for UX
    await new Promise((r) => setTimeout(r, 500));
    
    setIsSavingSecrets(false);
    setSecretsSaved(true);
    setIsConnected(bothValid); // Only connected if BOTH are valid
    
    setTimeout(() => setSecretsSaved(false), 2000);
  };

  // Fetch tables from user's Supabase using probing (information_schema not available via REST)
  const fetchTables = useCallback(async () => {
    // Try multiple sources for credentials
    let url = supabaseUrl; // Use current state first
    let key = supabaseAnonKey;
    
    // If not in state, try localStorage
    if (!url || !key) {
      const secrets = getProjectSecrets(project.id);
      url = secrets?.supabaseUrl || '';
      key = secrets?.supabaseAnonKey || '';
    }
    
    // Also try global localStorage as fallback
    if (!url || !key) {
      url = url || localStorage.getItem('replay_supabase_url') || '';
      key = key || localStorage.getItem('replay_supabase_key') || '';
    }
    
    console.log('[fetchTables] URL:', url?.substring(0, 30), 'Key length:', key?.length);
    
    if (!url || !key) {
      setDbError("Please add your Supabase credentials in the Secrets tab first");
      setActiveTab("secrets"); // Auto-switch to secrets tab
      return;
    }

    setIsLoadingTables(true);
    setDbError(null);
    setTables([]);

    try {
      // First, validate the URL format
      if (!url.includes('.supabase.co')) {
        throw new Error("Invalid Supabase URL. Must be like: https://xxxxx.supabase.co");
      }

      // Test actual connection by making a request to the Supabase REST API
      const testUrl = `${url}/rest/v1/`;
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
      });

      // Check if we got a valid response (even 404 means server exists)
      if (!testResponse.ok && testResponse.status !== 404) {
        if (testResponse.status === 401) {
          throw new Error("Invalid API key. Check your SUPABASE_ANON_KEY.");
        }
        throw new Error(`Connection failed: ${testResponse.status} ${testResponse.statusText}`);
      }

      const supabase = createClient(url, key);
      const foundTables: TableInfo[] = [];

      // Common tables to probe
      const COMMON_TABLES = ["profiles", "users", "products", "orders", "items", "posts", "categories"];

      // Probe each common table
      let connectionVerified = false;
      for (const tableName of COMMON_TABLES) {
        try {
          const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: false })
            .limit(1);

          // Check for auth errors
          if (error) {
            if (error.message?.includes('JWT') || error.message?.includes('apikey')) {
              throw new Error("Invalid API key. Check your credentials.");
            }
            // Table doesn't exist - that's OK, continue
            continue;
          }

          connectionVerified = true;
          foundTables.push({
            table_name: tableName,
            table_type: "Table",
            row_count: count || (data?.length || 0),
            has_rls: true,
          });
        } catch (probeError: any) {
          // If it's an auth error, throw it up
          if (probeError.message?.includes('Invalid API key') || 
              probeError.message?.includes('JWT') ||
              probeError.message?.includes('apikey')) {
            throw probeError;
          }
          // Otherwise continue probing
        }
      }

      // If no tables found but connection verified, that's OK
      if (foundTables.length === 0) {
        // Try one more specific test
        const { error } = await supabase.from("profiles").select("id").limit(1);
        
        if (error) {
          // Check if it's a "table not found" vs "auth error"
          if (error.message?.includes('JWT') || error.message?.includes('apikey') || error.code === 'PGRST301') {
            throw new Error("Invalid credentials or no access. Check your API key.");
          }
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            // Table doesn't exist but connection works
            connectionVerified = true;
          } else {
            throw new Error(`Database error: ${error.message}`);
          }
        } else {
          connectionVerified = true;
          foundTables.push({
            table_name: "profiles",
            table_type: "Table",
            has_rls: true,
          });
        }
      }

      if (!connectionVerified && foundTables.length === 0) {
        throw new Error("Could not verify connection. Check your credentials.");
      }

      // Add success message
      foundTables.push({
        table_name: "Connected successfully!",
        table_type: "INFO",
        has_rls: false,
      });

      setTables(foundTables);
      setIsConnected(true);
    } catch (err: any) {
      console.error("Database connection error:", err);
      setDbError(err.message || "Failed to connect to database");
      setIsConnected(false);
      setTables([]);
    } finally {
      setIsLoadingTables(false);
    }
  }, [project.id]);

  // Handle project deletion

  // Handle rename
  const handleRename = () => {
    if (projectName !== project.name && onRename) {
      onRename(project.id, projectName);
    }
  };

  if (!isOpen) return null;

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center md:p-4">
        {/* Backdrop - no animation on mobile */}
        <div
          className="absolute inset-0 bg-black/80 md:backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal - fullscreen on mobile, no animations */}
        <div
          className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl bg-[#0a0a0a] md:rounded-2xl md:border md:border-white/10 overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/10 flex-shrink-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg md:text-xl font-semibold text-white truncate">Project Settings</h2>
              <p className="text-xs md:text-sm text-white/50 mt-0.5 truncate">{project.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 ml-2"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Mobile Tabs - horizontal scrollable */}
          <div className="md:hidden flex-shrink-0 border-b border-white/10 overflow-x-auto scrollbar-hide">
            <div className="flex p-2 gap-1 min-w-max">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-[#FF6E3C] text-white"
                      : "bg-white/5 text-white/50"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === "database" && isConnected && (
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* Desktop Sidebar - hidden on mobile */}
            <div className="hidden md:block w-56 border-r border-white/10 p-4 flex-shrink-0">
              <nav className="space-y-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? "bg-white/10 text-white"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                    {tab.id === "database" && isConnected && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                {/* General Tab */}
                {activeTab === "general" && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {/* Project Name */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Project Name
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <input
                          type="text"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-[#FF6E3C]/50"
                        />
                        <button
                          onClick={handleRename}
                          disabled={projectName === project.name}
                          className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          Save
                        </button>
                      </div>
                    </div>

                    {/* Project ID */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Project ID
                      </label>
                      <div className="flex items-center gap-2 px-3 md:px-4 py-3 rounded-xl bg-white/5 border border-white/10">
                        <code className="text-xs md:text-sm text-white/70 font-mono truncate flex-1">{project.id}</code>
                        <button
                          onClick={() => navigator.clipboard.writeText(project.id)}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                        >
                          <Copy className="w-4 h-4 text-white/50" />
                        </button>
                      </div>
                      <p className="text-xs text-white/40 mt-2">
                        To delete this project, use the History panel
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Secrets Tab */}
                {activeTab === "secrets" && (
                  <motion.div
                    key="secrets"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="p-4 rounded-xl bg-[#FF6E3C]/10 border border-[#FF6E3C]/20">
                      <div className="flex items-start gap-3">
                        <Key className="w-5 h-5 text-[#FF6E3C] mt-0.5" />
                        <div>
                          <p className="text-sm text-white/80">
                            Add your Supabase credentials to enable <strong>Agentic Database Access</strong>.
                            Your keys are stored locally in your browser.
                          </p>
                          <a
                            href="https://supabase.com/dashboard/project/_/settings/api"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-[#FF6E3C] hover:underline mt-2"
                          >
                            Get your keys from Supabase Dashboard
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Supabase URL */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        SUPABASE_URL
                      </label>
                      <div className="relative">
                        <input
                          type={showUrl ? "text" : "password"}
                          value={supabaseUrl}
                          onChange={(e) => setSupabaseUrl(e.target.value)}
                          placeholder="https://xxxxx.supabase.co"
                          className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border text-white font-mono text-sm focus:outline-none transition-colors ${
                            supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/)
                              ? "border-red-500/50 focus:border-red-500"
                              : supabaseUrl && supabaseUrl.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/)
                              ? "border-green-500/50 focus:border-green-500"
                              : "border-white/10 focus:border-[#FF6E3C]/50"
                          }`}
                        />
                        <button
                          onClick={() => setShowUrl(!showUrl)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {showUrl ? (
                            <EyeOff className="w-4 h-4 text-white/50" />
                          ) : (
                            <Eye className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                      </div>
                      {supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/) && (
                        <p className="text-xs text-red-400 mt-1.5">Must be: https://xxxxx.supabase.co</p>
                      )}
                    </div>

                    {/* Supabase Anon Key */}
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        SUPABASE_ANON_KEY
                      </label>
                      <div className="relative">
                        <input
                          type={showKey ? "text" : "password"}
                          value={supabaseAnonKey}
                          onChange={(e) => setSupabaseAnonKey(e.target.value)}
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className={`w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border text-white font-mono text-sm focus:outline-none transition-colors ${
                            supabaseAnonKey && (!supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.length < 100)
                              ? "border-red-500/50 focus:border-red-500"
                              : supabaseAnonKey && supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length >= 100
                              ? "border-green-500/50 focus:border-green-500"
                              : "border-white/10 focus:border-[#FF6E3C]/50"
                          }`}
                        />
                        <button
                          onClick={() => setShowKey(!showKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {showKey ? (
                            <EyeOff className="w-4 h-4 text-white/50" />
                          ) : (
                            <Eye className="w-4 h-4 text-white/50" />
                          )}
                        </button>
                      </div>
                      {supabaseAnonKey && (!supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.length < 100) && (
                        <p className="text-xs text-red-400 mt-1.5">Must be a valid JWT token (starts with eyJ...)</p>
                      )}
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveSecrets}
                      disabled={isSavingSecrets || !!(supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-zA-Z0-9-]+\.supabase\.co\/?$/)) || !!(supabaseAnonKey && (!supabaseAnonKey.startsWith('eyJ') || supabaseAnonKey.length < 100))}
                      className="w-full py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSavingSecrets ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : secretsSaved ? (
                        <>
                          <Check className="w-4 h-4" />
                          Saved!
                        </>
                      ) : (
                        "Save Secrets"
                      )}
                    </button>

                    {/* Clear secrets */}
                    {isConnected && (
                      <button
                        onClick={() => {
                          clearProjectSecrets(project.id);
                          setSupabaseUrl("");
                          setSupabaseAnonKey("");
                          setIsConnected(false);
                          setTables([]);
                        }}
                        className="w-full py-3 rounded-xl bg-white/5 text-white/70 font-medium hover:bg-white/10 transition-colors"
                      >
                        Clear Secrets
                      </button>
                    )}
                  </motion.div>
                )}

                {/* Database Tab */}
                {activeTab === "database" && (
                  <motion.div
                    key="database"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {!isConnected ? (
                      /* Not Connected State */
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                          <Database className="w-8 h-8 text-white/30" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">
                          Connect Supabase
                        </h3>
                        <p className="text-sm text-white/50 max-w-sm mb-6">
                          Add your Supabase credentials in the <strong>Secrets</strong> tab to unlock Agentic Database access.
                        </p>
                        <button
                          onClick={() => setActiveTab("secrets")}
                          className="px-6 py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors"
                        >
                          Go to Secrets
                        </button>
                      </div>
                    ) : (
                      /* Connected State */
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-white/70">Connected to Supabase</span>
                          </div>
                          <button
                            onClick={fetchTables}
                            disabled={isLoadingTables}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className={`w-4 h-4 ${isLoadingTables ? "animate-spin" : ""}`} />
                            {tables.length === 0 ? "Load Tables" : "Refresh"}
                          </button>
                        </div>

                        {dbError && (
                          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <p className="text-sm text-red-400">{dbError}</p>
                          </div>
                        )}

                        {isLoadingTables ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin" />
                          </div>
                        ) : tables.length > 0 ? (
                          <div className="border border-white/10 rounded-xl overflow-x-auto">
                            <table className="w-full min-w-[400px]">
                              <thead>
                                <tr className="bg-white/5">
                                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">
                                    Table Name
                                  </th>
                                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">
                                    Rows
                                  </th>
                                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">
                                    Type
                                  </th>
                                  <th className="text-left px-4 py-3 text-sm font-medium text-white/70">
                                    RLS
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {tables.map((table, i) => (
                                  <tr
                                    key={i}
                                    className="border-t border-white/5 hover:bg-white/5 transition-colors"
                                  >
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <Table className="w-4 h-4 text-white/40" />
                                        <span className="text-sm text-white font-mono">
                                          {table.table_name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      {table.table_type !== "INFO" ? (
                                        <span className={`text-sm font-mono ${(table.row_count ?? 0) === 0 ? 'text-yellow-400' : 'text-[#FF6E3C]'}`}>
                                          {table.row_count ?? 0}
                                          {(table.row_count ?? 0) === 0 && (
                                            <span className="ml-1 text-xs text-yellow-400/60" title="RLS might be blocking access">⚠️</span>
                                          )}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-white/40">—</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/60">
                                        {table.table_type === "BASE TABLE" ? "Table" : table.table_type}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      {table.has_rls ? (
                                        <span className="flex items-center gap-1 text-xs text-green-400">
                                          <Shield className="w-3 h-3" />
                                          Enabled
                                        </span>
                                      ) : (
                                        <span className="text-xs text-white/40">—</span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-sm text-white/50">
                              Click "Load Tables" to fetch your database schema
                            </p>
                          </div>
                        )}

                        {tables.length > 0 && (
                          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                              <div>
                                <p className="text-sm text-white/80">
                                  <strong>Agentic Access Enabled!</strong> Replay AI can now see your database schema
                                  and generate code that matches your actual tables.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* How to make tables visible */}
                        <details className="group">
                          <summary className="flex items-center gap-2 cursor-pointer text-sm text-white/50 hover:text-white/70 transition-colors">
                            <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            <span>📖 Tables showing 0 rows? How to fix</span>
                          </summary>
                          <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                            <p className="text-sm text-white/70">
                              Supabase uses <strong className="text-[#FF6E3C]">Row Level Security (RLS)</strong> which blocks access by default. 
                              To allow Replay to read your tables:
                            </p>
                            
                            <div className="space-y-2">
                              <p className="text-xs text-white/50 uppercase tracking-wider">Run this SQL in Supabase Dashboard → SQL Editor:</p>
                              <pre className="p-3 rounded-lg bg-black/50 border border-white/10 text-xs font-mono text-green-400 overflow-x-auto">
{`-- Replace 'your_table' with your table name
CREATE POLICY "Allow public read"
ON your_table FOR SELECT
USING (true);

-- Example for profiles table:
CREATE POLICY "Allow public read"
ON profiles FOR SELECT
USING (true);`}
                              </pre>
                            </div>

                            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                              <span className="text-yellow-400">⚠️</span>
                              <p className="text-xs text-yellow-200/80">
                                This allows anyone with your anon key to read the table. 
                                For sensitive data, use more restrictive policies.
                              </p>
                            </div>

                            <a 
                              href="https://supabase.com/docs/guides/auth/row-level-security" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-[#FF6E3C] hover:underline"
                            >
                              Learn more about RLS →
                            </a>
                          </div>
                        </details>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Share Tab (renamed from Analytics) */}
                {activeTab === "analytics" && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-lg font-medium text-white">Share & Export</h3>

                    {/* Check if project is published */}
                    {(() => {
                      // Try to get published slug from localStorage
                      const historyKey = "replay_generation_history";
                      const history = typeof window !== 'undefined' ? localStorage.getItem(historyKey) : null;
                      let publishedSlug = null;
                      
                      if (history) {
                        try {
                          const records = JSON.parse(history);
                          const projectRecord = records.find((r: any) => r.id === project.id);
                          publishedSlug = projectRecord?.publishedSlug;
                        } catch {}
                      }

                      if (publishedSlug) {
                        const publishedUrl = `https://replay.build/p/${publishedSlug}`;
                        return (
                          <div className="space-y-4">
                            {/* Published URL */}
                            <div className="p-5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-medium text-emerald-400">Published & Live</span>
                              </div>
                              <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg">
                                <code className="text-sm text-white/80 font-mono flex-1 truncate">{publishedUrl}</code>
                                <button
                                  onClick={() => navigator.clipboard.writeText(publishedUrl)}
                                  className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                                  title="Copy URL"
                                >
                                  <Copy className="w-4 h-4 text-white/50" />
                                </button>
                                <a
                                  href={publishedUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                                  title="Open in new tab"
                                >
                                  <ExternalLink className="w-4 h-4 text-white/50" />
                                </a>
                              </div>
                            </div>

                            {/* Share buttons */}
                            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                              <p className="text-sm font-medium text-white mb-3">Share your project</p>
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={`https://twitter.com/intent/tweet?text=Check out my project built with Replay!&url=${encodeURIComponent(publishedUrl)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 rounded-lg bg-[#1DA1F2]/20 text-[#1DA1F2] text-sm hover:bg-[#1DA1F2]/30 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                                  Share on X
                                </a>
                                <a
                                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publishedUrl)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2 rounded-lg bg-[#0A66C2]/20 text-[#0A66C2] text-sm hover:bg-[#0A66C2]/30 transition-colors flex items-center gap-2"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                                  Share on LinkedIn
                                </a>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(publishedUrl);
                                  }}
                                  className="px-4 py-2 rounded-lg bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors flex items-center gap-2"
                                >
                                  <Copy className="w-4 h-4" />
                                  Copy Link
                                </button>
                              </div>
                            </div>

                            {/* QR Code placeholder - could add later */}
                            <div className="p-5 rounded-xl bg-white/5 border border-white/10">
                              <p className="text-sm font-medium text-white mb-2">Embed Code</p>
                              <p className="text-xs text-white/50 mb-3">Add your project to any website</p>
                              <div className="p-3 bg-black/30 rounded-lg">
                                <code className="text-xs text-white/60 font-mono break-all">
                                  {`<iframe src="${publishedUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                                </code>
                              </div>
                              <button
                                onClick={() => navigator.clipboard.writeText(`<iframe src="${publishedUrl}" width="100%" height="600" frameborder="0"></iframe>`)}
                                className="mt-2 text-xs text-[#FF6E3C] hover:underline"
                              >
                                Copy embed code
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // Not published yet
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                            <ExternalLink className="w-8 h-8 text-white/30" />
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">
                            Not Published Yet
                          </h3>
                          <p className="text-sm text-white/50 max-w-sm mb-4">
                            Publish your project to get a shareable link.
                          </p>
                          <p className="text-xs text-white/30">
                            Use the <strong className="text-white/50">Publish</strong> button in the top toolbar to deploy your project.
                          </p>
                        </div>
                      );
                    })()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
  );
}

