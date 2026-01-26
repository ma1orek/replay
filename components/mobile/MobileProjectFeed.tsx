"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Play,
  ChevronRight,
  Filter,
  Sparkles
} from "lucide-react";

interface Project {
  id: string;
  title: string;
  timestamp: number;
  status: "running" | "complete" | "failed";
  videoUrl?: string;
  publishedSlug?: string;
  approvalStatus?: "in_review" | "approved" | "changes_requested";
  lastActivityBy?: string;
  lastActivityType?: string;
}

interface MobileProjectFeedProps {
  onSelectProject: (project: Project) => void;
  onRefresh?: () => void;
}

const STATUS_CONFIG = {
  approved: {
    color: "bg-emerald-500",
    textColor: "text-emerald-400",
    label: "Approved",
    icon: CheckCircle2,
  },
  in_review: {
    color: "bg-amber-500",
    textColor: "text-amber-400",
    label: "In Review",
    icon: Clock,
  },
  changes_requested: {
    color: "bg-red-500",
    textColor: "text-red-400",
    label: "Changes Requested",
    icon: AlertCircle,
  },
};

type FilterType = "all" | "in_review" | "approved" | "changes_requested";

export default function MobileProjectFeed({ 
  onSelectProject,
  onRefresh 
}: MobileProjectFeedProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");

  // Fetch projects from API
  const fetchProjects = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      }
      
      const response = await fetch("/api/generations?minimal=true&limit=50");
      
      if (!response.ok) {
        if (response.status === 401) {
          setError("Please log in to see your projects");
          return;
        }
        throw new Error("Failed to fetch projects");
      }
      
      const data = await response.json();
      
      if (data.success && data.generations) {
        // Transform to Project format with mock approval status for now
        const transformed: Project[] = data.generations.map((gen: any) => ({
          id: gen.id,
          title: gen.title || "Untitled Project",
          timestamp: gen.timestamp,
          status: gen.status,
          videoUrl: gen.videoUrl,
          publishedSlug: gen.publishedSlug,
          // Mock approval status based on existing status for demo
          approvalStatus: gen.status === "complete" 
            ? (gen.publishedSlug ? "approved" : "in_review")
            : "in_review",
        }));
        
        setProjects(transformed);
        setError(null);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Pull to refresh
  const handleRefresh = useCallback(() => {
    fetchProjects(true);
    onRefresh?.();
  }, [fetchProjects, onRefresh]);

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Filter projects
  const filteredProjects = filter === "all" 
    ? projects 
    : projects.filter(p => p.approvalStatus === filter);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FF6E3C] animate-spin" />
          <p className="text-white/50 text-sm">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={() => fetchProjects()}
            className="px-4 py-2 bg-white/10 rounded-lg text-white text-sm"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black p-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-[#FF6E3C]/50 mx-auto mb-3" />
          <h3 className="text-white font-medium mb-2">No projects yet</h3>
          <p className="text-white/50 text-sm">
            Record or upload a video to create your first project
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black overflow-hidden">
      {/* Header with filter */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white">Projects</h2>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-full bg-white/5 text-white/50 hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { key: "all", label: "All" },
            { key: "in_review", label: "In Review" },
            { key: "approved", label: "Approved" },
            { key: "changes_requested", label: "Changes" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as FilterType)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? "bg-[#FF6E3C] text-white"
                  : "bg-white/5 text-white/50"
              }`}
            >
              {label}
              {key !== "all" && (
                <span className="ml-1 opacity-60">
                  ({projects.filter(p => p.approvalStatus === key).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-white/30 text-sm">
            No projects match this filter
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredProjects.map((project) => {
              const statusConfig = STATUS_CONFIG[project.approvalStatus || "in_review"];
              const StatusIcon = statusConfig.icon;

              return (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="w-full px-4 py-4 flex items-center gap-4 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
                >
                  {/* Status indicator */}
                  <div className={`w-2.5 h-2.5 rounded-full ${statusConfig.color} flex-shrink-0`} />

                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium truncate">
                        {project.title}
                      </h3>
                      {project.status === "running" && (
                        <Loader2 className="w-3 h-3 text-[#FF6E3C] animate-spin flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="text-white/30 text-xs">
                        {formatRelativeTime(project.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-5 h-5 text-white/20 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
