"use server";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// In-memory job storage (fallback if DB not available)
// In production, use Redis/Supabase/etc.
declare global {
  var generationJobs: Map<string, {
    status: "pending" | "processing" | "complete" | "failed";
    progress: number;
    message: string;
    code?: string;
    title?: string;
    error?: string;
    userId: string;
    createdAt: number;
  }>;
}

if (!global.generationJobs) {
  global.generationJobs = new Map();
}

export { global as jobStorage };

// GET /api/generate/status/[jobId]
// Returns current status of generation job
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    // Check authentication
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to get from in-memory storage first (faster)
    const memoryJob = global.generationJobs.get(jobId);
    if (memoryJob) {
      // Verify user owns this job
      if (memoryJob.userId !== user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        jobId,
        status: memoryJob.status,
        progress: memoryJob.progress,
        message: memoryJob.message,
        code: memoryJob.code,
        title: memoryJob.title,
        error: memoryJob.error,
      });
    }

    // Fallback: try database
    const admin = createAdminClient();
    if (admin) {
      const { data: dbJob, error } = await admin
        .from("generation_jobs")
        .select("*")
        .eq("id", jobId)
        .eq("user_id", user.id)
        .single();

      if (dbJob && !error) {
        return NextResponse.json({
          success: true,
          jobId,
          status: dbJob.status,
          progress: dbJob.progress || 0,
          message: dbJob.message || "",
          code: dbJob.code,
          title: dbJob.title,
          error: dbJob.error,
        });
      }
    }

    // Job not found
    return NextResponse.json({ error: "Job not found" }, { status: 404 });

  } catch (error) {
    console.error("[generate/status] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
