"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search,
  Clock, 
  Loader2,
  Trash2,
  ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Project {
  id: string;
  title: string;
  timestamp: number;
  status: "running" | "complete" | "failed";
  videoUrl?: string;
  publishedSlug?: string;
  styleDirective?: string;
  versions?: Array<{
    id: string;
    label: string;
    timestamp: number;
  }>;
}

interface MobileProjectFeedProps {
  onSelectProject: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
}

export default function MobileProjectFeed({ 
  onSelectProject,
  onDeleteProject,
}: MobileProjectFeedProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedVersions, setExpandedVersions] = useState<string | null>(null);

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/generations?minimal=true&limit=50");
      
      if (!response.ok) {
        if (response.status === 401) {
          setError("Sign in to see your projects");
          return;
        }
        throw new Error("Failed to fetch projects");
      }
      
      const data = await response.json();
      
      if (data.success && data.generations) {
        const transformed: Project[] = data.generations.map((gen: any) => ({
          id: gen.id,
          title: gen.title || "Untitled Project",
          timestamp: gen.timestamp,
          status: gen.status,
          videoUrl: gen.videoUrl,
          publishedSlug: gen.publishedSlug,
          styleDirective: gen.styleDirective,
          versions: gen.versions || [],
        }));
        
        setProjects(transformed);
        setError(null);
      }
    } catch (err: any) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Filter by search
  const filteredProjects = projects
    .filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b.timestamp - a.timestamp);

  // Handle delete
  const handleDelete = useCallback(async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!confirm("Delete this project?")) return;
    
    try {
      const response = await fetch(`/api/generations?id=${projectId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        onDeleteProject?.(projectId);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, [onDeleteProject]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#111]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
          <p className="text-zinc-500 text-sm">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#111] p-6">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">{error}</p>
          <button
            onPointerUp={(e) => {
              e.preventDefault();
              setIsLoading(true);
              fetchProjects();
            }}
            className="px-4 py-2 bg-zinc-800 rounded-lg text-zinc-300 text-sm touch-manipulation active:scale-95"
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
      <div className="flex-1 flex items-center justify-center bg-[#111] p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 opacity-30">
            <svg viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="currentColor" strokeWidth="8" strokeLinejoin="round" className="text-zinc-600"/>
              <rect x="34.054" y="98.6841" width="48.6555" height="11.6182" rx="5.80909" transform="rotate(-30 34.054 98.6841)" fill="currentColor" className="text-zinc-600"/>
            </svg>
          </div>
          <h3 className="text-zinc-300 font-medium mb-2">No projects yet</h3>
          <p className="text-zinc-600 text-sm">
            Record or upload a video to create your first project
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#111] overflow-hidden">
      {/* Search */}
      <div className="p-4 border-b border-zinc-800 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-800/50 border border-zinc-800 text-sm text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </div>

      {/* Project List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-zinc-600 text-sm">
            No projects match your search
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div 
              key={project.id}
              className="relative p-3 pr-10 rounded-xl bg-zinc-800/50 border border-zinc-800 hover:bg-zinc-800/70 transition-colors"
              onPointerUp={(e) => {
                e.preventDefault();
                if (expandedVersions === project.id) return;
                onSelectProject(project);
              }}
            >
              {/* Title & timestamp */}
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-zinc-200 truncate flex-1">
                  {project.title}
                </p>
                {project.status === "running" && (
                  <Loader2 className="w-3.5 h-3.5 text-zinc-400 animate-spin flex-shrink-0" />
                )}
              </div>
              
              <p className="text-[10px] text-zinc-600">
                {new Date(project.timestamp).toLocaleDateString()} • {new Date(project.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              
              {/* Style info */}
              <div className="mt-1">
                <p className="text-[10px] text-zinc-500 truncate">
                  <span className="text-zinc-600">Style:</span> {project.styleDirective?.split('.')[0]?.split('⚠️')[0]?.trim() || "Auto-Detect"}
                </p>
              </div>
              
              {/* Version toggle */}
              {project.versions && project.versions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-800">
                  <button
                    onPointerUp={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setExpandedVersions(expandedVersions === project.id ? null : project.id);
                    }}
                    className="flex items-center gap-2 text-[10px] text-zinc-500 hover:text-zinc-400 transition-colors touch-manipulation"
                  >
                    <Clock className="w-3 h-3" />
                    <span>{project.versions.length + 1} version{project.versions.length >= 1 ? 's' : ''}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${expandedVersions === project.id ? "rotate-180" : ""}`} />
                  </button>
                  
                  <AnimatePresence>
                    {expandedVersions === project.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 ml-1 space-y-1 overflow-hidden"
                      >
                        <div className="relative pl-3 border-l border-zinc-700">
                          {project.versions.slice().reverse().map((version, idx) => (
                            <div key={version.id} className="relative py-1.5">
                              <div className={`absolute -left-[7px] top-2.5 w-2.5 h-2.5 rounded-full border-2 ${
                                idx === 0 
                                  ? "bg-zinc-800 border-white" 
                                  : "bg-[#111] border-zinc-600"
                              }`} />
                              <div className="pl-2">
                                <p className="text-[10px] text-zinc-500 truncate">{version.label}</p>
                                <p className="text-[8px] text-zinc-600">
                                  {new Date(version.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              
              {/* Delete button */}
              <div className="absolute top-3 right-3">
                <button
                  onPointerUp={(e) => handleDelete(e as any, project.id)}
                  className="p-1.5 rounded-lg bg-zinc-800/50 hover:bg-red-500/20 text-zinc-600 hover:text-red-400 transition-colors touch-manipulation active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
