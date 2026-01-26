import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export type PlanTier = "sandbox" | "free" | "pro" | "agency" | "enterprise";

interface PlanLimits {
  activeProjects: number;
  teamSeats: number;
  canUpload: boolean;
  canExport: boolean;
}

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  sandbox: { activeProjects: 0, teamSeats: 1, canUpload: false, canExport: false },
  free: { activeProjects: 0, teamSeats: 1, canUpload: false, canExport: false },
  pro: { activeProjects: 1, teamSeats: 1, canUpload: true, canExport: true },
  agency: { activeProjects: 10, teamSeats: 5, canUpload: true, canExport: true },
  enterprise: { activeProjects: 999999, teamSeats: 999999, canUpload: true, canExport: true },
};

interface ProjectLimitsState {
  plan: PlanTier;
  limits: PlanLimits;
  activeProjectCount: number;
  canCreateProject: boolean;
  slotsRemaining: number;
  isLoading: boolean;
  error: string | null;
}

export function useProjectLimits() {
  const [state, setState] = useState<ProjectLimitsState>({
    plan: "free",
    limits: PLAN_LIMITS.free,
    activeProjectCount: 0,
    canCreateProject: false,
    slotsRemaining: 0,
    isLoading: true,
    error: null,
  });

  const fetchLimits = useCallback(async () => {
    const supabase = createClient();

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: "Not authenticated",
        }));
        return;
      }

      // Get user's membership/plan
      const { data: membership, error: membershipError } = await supabase
        .from("memberships")
        .select("plan")
        .eq("user_id", user.id)
        .single();

      if (membershipError) {
        console.error("Error fetching membership:", membershipError);
      }

      const plan = (membership?.plan as PlanTier) || "free";
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

      // Get active project count
      const { count, error: countError } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_archived", false);

      if (countError) {
        console.error("Error fetching project count:", countError);
      }

      const activeProjectCount = count || 0;
      const slotsRemaining = Math.max(0, limits.activeProjects - activeProjectCount);
      const canCreateProject = activeProjectCount < limits.activeProjects;

      setState({
        plan,
        limits,
        activeProjectCount,
        canCreateProject,
        slotsRemaining,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message,
      }));
    }
  }, []);

  useEffect(() => {
    fetchLimits();
  }, [fetchLimits]);

  return {
    ...state,
    refresh: fetchLimits,
  };
}

/**
 * Archive a project to free up a slot
 */
export async function archiveProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("projects")
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Unarchive a project (if slot available)
 */
export async function unarchiveProject(projectId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // First check if slot is available using RPC
  const { data: canCreate, error: checkError } = await supabase.rpc("can_create_project", {
    p_user_id: user.id,
  });

  if (checkError || !canCreate?.allowed) {
    return { 
      success: false, 
      error: canCreate?.reason || "No available project slots. Archive another project first." 
    };
  }

  const { error } = await supabase
    .from("projects")
    .update({ is_archived: false, updated_at: new Date().toISOString() })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/**
 * Get plan display info
 */
export function getPlanDisplayInfo(plan: PlanTier) {
  const info: Record<PlanTier, { name: string; price: string; color: string }> = {
    sandbox: { name: "Sandbox", price: "Free", color: "gray" },
    free: { name: "Free", price: "Free", color: "gray" },
    pro: { name: "Pro", price: "$149/mo", color: "orange" },
    agency: { name: "Agency", price: "$499/mo", color: "blue" },
    enterprise: { name: "Enterprise", price: "Custom", color: "purple" },
  };
  return info[plan] || info.free;
}
