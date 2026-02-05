"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Palette,
  Star,
  MoreVertical,
  Trash2,
  Pencil,
  Copy,
  Download,
  Loader2,
  Check,
  X,
  Component,
  Code,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import type { 
  DesignSystem, 
  DesignSystemComponent,
  DesignSystemListItem,
  DesignTokens 
} from "@/types/design-system";
import { exportToCSS, exportToTailwind, exportToJSON } from "@/lib/tokens/export";

export default function DesignSystemsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  
  const [designSystems, setDesignSystems] = useState<DesignSystemListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create new DS state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDSName, setNewDSName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Selected DS for detail view
  const [selectedDS, setSelectedDS] = useState<DesignSystem | null>(null);
  const [selectedDSComponents, setSelectedDSComponents] = useState<DesignSystemComponent[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Actions
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch design systems
  const fetchDesignSystems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/design-systems");
      if (!response.ok) throw new Error("Failed to fetch design systems");
      const data = await response.json();
      setDesignSystems(data.designSystems || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchDesignSystems();
    }
  }, [user, fetchDesignSystems]);

  // Fetch details for selected DS
  const fetchDSDetails = useCallback(async (dsId: string) => {
    try {
      setIsLoadingDetails(true);
      const response = await fetch(`/api/design-systems/${dsId}`);
      if (!response.ok) throw new Error("Failed to fetch details");
      const data = await response.json();
      setSelectedDS(data.designSystem);
      setSelectedDSComponents(data.designSystem.components || []);
    } catch (err: any) {
      console.error("[DesignSystems] Error fetching details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Create new Design System
  const handleCreate = async () => {
    if (!newDSName.trim()) return;
    
    try {
      setIsCreating(true);
      const response = await fetch("/api/design-systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newDSName.trim() }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create");
      }
      
      setShowCreateModal(false);
      setNewDSName("");
      fetchDesignSystems();
    } catch (err: any) {
      console.error("[DesignSystems] Create error:", err);
      alert(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  // Delete Design System
  const handleDelete = async (dsId: string) => {
    if (!confirm("Are you sure you want to delete this Design System? This cannot be undone.")) {
      return;
    }
    
    try {
      setDeletingId(dsId);
      const response = await fetch(`/api/design-systems/${dsId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }
      
      if (selectedDS?.id === dsId) {
        setSelectedDS(null);
        setSelectedDSComponents([]);
      }
      fetchDesignSystems();
    } catch (err: any) {
      console.error("[DesignSystems] Delete error:", err);
      alert(err.message);
    } finally {
      setDeletingId(null);
      setActiveMenu(null);
    }
  };

  // Set as default
  const handleSetDefault = async (dsId: string) => {
    try {
      const response = await fetch(`/api/design-systems/${dsId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_default: true }),
      });
      
      if (!response.ok) throw new Error("Failed to update");
      
      fetchDesignSystems();
      setActiveMenu(null);
    } catch (err: any) {
      console.error("[DesignSystems] Set default error:", err);
    }
  };

  // Export tokens
  const handleExport = (format: "css" | "tailwind" | "json") => {
    if (!selectedDS?.tokens) return;
    
    let content = "";
    let filename = "";
    
    switch (format) {
      case "css":
        content = exportToCSS(selectedDS.tokens);
        filename = `${selectedDS.name.toLowerCase().replace(/\s+/g, "-")}-tokens.css`;
        break;
      case "tailwind":
        content = exportToTailwind(selectedDS.tokens);
        filename = `tailwind.config.${selectedDS.name.toLowerCase().replace(/\s+/g, "-")}.js`;
        break;
      case "json":
        content = exportToJSON(selectedDS.tokens);
        filename = `${selectedDS.name.toLowerCase().replace(/\s+/g, "-")}-tokens.json`;
        break;
    }
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Auth guard
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/settings"
                className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-400" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold">Design Systems</h1>
                <p className="text-xs text-zinc-500">Manage your component libraries</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Design System
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Design Systems List */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="text-sm font-medium text-zinc-300">Your Design Systems</h2>
              </div>
              
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-6 h-6 text-zinc-400 animate-spin mx-auto" />
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <p className="text-red-400 text-sm">{error}</p>
                  <button
                    onClick={fetchDesignSystems}
                    className="text-orange-400 text-sm mt-2 hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : designSystems.length === 0 ? (
                <div className="p-8 text-center">
                  <Palette className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No design systems yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-orange-400 text-sm mt-2 hover:underline"
                  >
                    Create your first one
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {designSystems.map((ds) => (
                    <div
                      key={ds.id}
                      onClick={() => fetchDSDetails(ds.id)}
                      className={cn(
                        "p-4 cursor-pointer transition-colors relative group",
                        selectedDS?.id === ds.id
                          ? "bg-orange-500/10 border-l-2 border-orange-500"
                          : "hover:bg-zinc-800/50"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                            <Palette className="w-5 h-5 text-orange-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{ds.name}</span>
                              {ds.is_default && (
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-zinc-500">
                              {ds.component_count} component{ds.component_count !== 1 ? "s" : ""}
                              {ds.source_type && ` • ${ds.source_type}`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenu(activeMenu === ds.id ? null : ds.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <MoreVertical className="w-4 h-4 text-zinc-400" />
                          </button>
                          
                          {activeMenu === ds.id && (
                            <div className="absolute right-0 top-8 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-10">
                              {!ds.is_default && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSetDefault(ds.id);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
                                >
                                  <Star className="w-4 h-4" />
                                  Set as Default
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(ds.id);
                                }}
                                disabled={deletingId === ds.id}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-zinc-800"
                              >
                                {deletingId === ds.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail View */}
          <div className="lg:col-span-2">
            {isLoadingDetails ? (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin mx-auto" />
              </div>
            ) : selectedDS ? (
              <div className="space-y-6">
                {/* Header Card */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold">{selectedDS.name}</h2>
                        {selectedDS.is_default && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/20 text-yellow-400">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-500 mt-1">
                        {selectedDSComponents.length} components • 
                        Created {new Date(selectedDS.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExport("css")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Download className="w-3 h-3" />
                        CSS
                      </button>
                      <button
                        onClick={() => handleExport("tailwind")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Download className="w-3 h-3" />
                        Tailwind
                      </button>
                      <button
                        onClick={() => handleExport("json")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Download className="w-3 h-3" />
                        JSON
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tokens Preview */}
                {selectedDS.tokens && Object.keys(selectedDS.tokens.colors || {}).length > 0 && (
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-sm font-medium text-zinc-300 mb-4">Color Tokens</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedDS.tokens.colors || {}).slice(0, 12).map(([name, value]) => (
                        <div
                          key={name}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/50"
                        >
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: value }}
                          />
                          <span className="text-xs text-zinc-400">{name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Components */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <h3 className="text-sm font-medium text-zinc-300">Components</h3>
                  </div>
                  
                  {selectedDSComponents.length === 0 ? (
                    <div className="p-8 text-center">
                      <Component className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                      <p className="text-zinc-500 text-sm">No components yet</p>
                      <p className="text-zinc-600 text-xs mt-1">
                        Generate from video or save components from projects
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800 max-h-96 overflow-y-auto">
                      {selectedDSComponents.map((comp) => (
                        <div key={comp.id} className="p-4 hover:bg-zinc-800/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                <Code className="w-4 h-4 text-zinc-400" />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-white">{comp.name}</span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                                    {comp.layer}
                                  </span>
                                  {comp.category && (
                                    <span className="text-[10px] text-zinc-600">{comp.category}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-600">
                              Used {comp.usage_count}x
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
                <FolderOpen className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500">Select a Design System to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Create Design System</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newDSName}
                    onChange={(e) => setNewDSName(e.target.value)}
                    placeholder="e.g., My Company UI"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-orange-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreate();
                    }}
                  />
                </div>
                
                <button
                  onClick={handleCreate}
                  disabled={!newDSName.trim() || isCreating}
                  className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Create Design System
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
