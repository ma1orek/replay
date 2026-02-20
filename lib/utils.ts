import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  // Guard against invalid values
  if (!isFinite(seconds) || seconds < 0 || isNaN(seconds)) {
    return "00:00";
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Analytics tracking for projects
export interface ProjectAnalytics {
  generations: number;
  edits: number;
  exports: number;
  tokensUsed: number;
}

export function updateProjectAnalytics(
  projectId: string,
  type: "generation" | "edit" | "export",
  tokensUsed?: number
): void {
  if (typeof window === "undefined") return;
  
  const key = `replay_analytics_${projectId}`;
  let analytics: ProjectAnalytics = {
    generations: 0,
    edits: 0,
    exports: 0,
    tokensUsed: 0,
  };
  
  // Load existing
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      analytics = JSON.parse(stored);
    } catch {}
  }
  
  // Update
  if (type === "generation") {
    analytics.generations += 1;
    analytics.tokensUsed += tokensUsed || 20000; // Default estimate
  } else if (type === "edit") {
    analytics.edits += 1;
    analytics.tokensUsed += tokensUsed || 10000;
  } else if (type === "export") {
    analytics.exports += 1;
  }
  
  // Save (with quota protection)
  try {
    localStorage.setItem(key, JSON.stringify(analytics));
  } catch (e) {
    // localStorage full — try to free space by removing old analytics entries
    console.warn("[Analytics] localStorage quota exceeded, cleaning up old data");
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("replay_analytics_") && k !== key) {
          keysToRemove.push(k);
        }
      }
      // Remove oldest analytics entries (keep last 5)
      if (keysToRemove.length > 5) {
        keysToRemove.slice(0, keysToRemove.length - 5).forEach(k => localStorage.removeItem(k));
      }
      // Also remove old local project backups
      const projectKeys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("replay_local_project_")) {
          projectKeys.push(k);
        }
      }
      if (projectKeys.length > 3) {
        projectKeys.slice(0, projectKeys.length - 3).forEach(k => localStorage.removeItem(k));
      }
      // Retry save
      localStorage.setItem(key, JSON.stringify(analytics));
    } catch {
      // Still can't save — silently skip (analytics is non-critical)
      console.warn("[Analytics] Could not save analytics after cleanup");
    }
  }
}

