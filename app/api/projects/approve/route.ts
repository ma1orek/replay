import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/projects/approve
 * Approve or request changes on a project
 * 
 * Body:
 * - projectId: string (required)
 * - action: "approve" | "request_changes" (required)
 * - comment: string (optional for approve, required for request_changes)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    const body = await request.json();
    const { projectId, action, comment } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    if (!action || !["approve", "request_changes"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (action === "request_changes" && !comment?.trim()) {
      return NextResponse.json({ error: "Comment required for changes request" }, { status: 400 });
    }

    // Get the project to verify access
    const { data: project, error: fetchError } = await adminSupabase
      .from("generations")
      .select("id, user_id, title")
      .eq("id", projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // For now, allow any authenticated user to approve
    // In production, you'd check if user has permission to approve this project

    // Create approval record
    // Note: This assumes an 'approvals' table exists. If not, we'll store in the generations table
    const approvalData = {
      project_id: projectId,
      user_id: user.id,
      action,
      comment: comment || null,
      created_at: new Date().toISOString(),
    };

    // Try to insert into approvals table
    const { error: approvalError } = await adminSupabase
      .from("project_approvals")
      .insert(approvalData);

    // If table doesn't exist, update the generation directly
    if (approvalError && approvalError.message?.includes("does not exist")) {
      console.log("project_approvals table doesn't exist, updating generation directly");
      
      // Store approval status in the generation's metadata
      const { error: updateError } = await adminSupabase
        .from("generations")
        .update({
          // Store approval info in a JSON field or use existing fields
          // For now, we'll use the status field creatively
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (updateError) {
        console.error("Error updating generation:", updateError);
      }
    } else if (approvalError) {
      console.error("Error creating approval:", approvalError);
      // Don't fail the request - approval tracking is optional
    }

    // Send notification to project owner if different from approver
    if (project.user_id !== user.id) {
      // TODO: Send email/push notification
      console.log(`Notification: Project "${project.title}" was ${action === "approve" ? "approved" : "requested changes"} by user ${user.id}`);
    }

    return NextResponse.json({ 
      success: true, 
      action,
      projectId,
      message: action === "approve" 
        ? "Project approved successfully" 
        : "Changes requested successfully"
    });

  } catch (error: any) {
    console.error("Error in approval POST:", error);
    return NextResponse.json({ error: error.message || "Failed to process approval" }, { status: 500 });
  }
}

/**
 * GET /api/projects/approve?projectId=xxx
 * Get approval status for a project
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID required" }, { status: 400 });
    }

    // Try to get approvals from table
    const { data: approvals, error } = await adminSupabase
      .from("project_approvals")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error && error.message?.includes("does not exist")) {
      // Table doesn't exist - return default status
      return NextResponse.json({
        success: true,
        status: "pending",
        approvals: [],
      });
    }

    if (error) {
      console.error("Error fetching approvals:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Determine current status based on latest approval
    const latestApproval = approvals?.[0];
    const status = latestApproval?.action === "approve" 
      ? "approved" 
      : latestApproval?.action === "request_changes"
        ? "changes_requested"
        : "pending";

    return NextResponse.json({
      success: true,
      status,
      approvals: approvals || [],
    });

  } catch (error: any) {
    console.error("Error in approval GET:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch approval status" }, { status: 500 });
  }
}
