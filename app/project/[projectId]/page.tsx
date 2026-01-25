"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

// This page handles shareable project links for multiplayer collaboration
// URL: /project/[projectId] -> loads the project and redirects to main editor
export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [status, setStatus] = useState<"loading" | "notfound" | "redirecting">("loading");
  const supabase = createClient();

  useEffect(() => {
    if (!projectId) {
      setStatus("notfound");
      return;
    }

    async function loadAndRedirect() {
      try {
        // Check if project exists in Supabase
        const { data: generation, error } = await supabase
          .from("generations")
          .select("id, title, code, user_id")
          .eq("id", projectId)
          .single();

        if (error || !generation) {
          // Project not found - might be a new project or invalid ID
          // For new projects, we'll create them on the fly
          console.log("[Project] Not found in DB, treating as new project:", projectId);
        }

        // Store the project ID to load in main editor
        localStorage.setItem("replay_load_project", projectId);
        
        // Store project data if found (for faster loading)
        if (generation) {
          localStorage.setItem(`replay_project_${projectId}`, JSON.stringify({
            id: generation.id,
            title: generation.title,
            code: generation.code,
            loadedAt: Date.now()
          }));
        }

        setStatus("redirecting");
        
        // Redirect to main tool with project context
        // The main page will pick up the project from localStorage
        router.push(`/?project=${projectId}`);
        
      } catch (err) {
        console.error("[Project] Error loading:", err);
        // Even on error, try to redirect - the main page will handle it
        localStorage.setItem("replay_load_project", projectId);
        router.push(`/?project=${projectId}`);
      }
    }

    loadAndRedirect();
  }, [projectId, router, supabase]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Loading project...</p>
          </>
        )}
        {status === "redirecting" && (
          <>
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500 mx-auto mb-4" />
            <p className="text-zinc-400 text-sm">Opening editor...</p>
          </>
        )}
        {status === "notfound" && (
          <>
            <p className="text-zinc-400 text-sm mb-4">Project not found</p>
            <button 
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
            >
              Go to Editor
            </button>
          </>
        )}
      </div>
    </div>
  );
}
