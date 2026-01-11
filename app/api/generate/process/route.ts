"use server";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { transmuteVideoToCode } from "@/actions/transmute";
import { CREDIT_COSTS } from "@/lib/credits/context";
import { getJobStorage, setJob, updateJob, type GenerationJob } from "@/lib/jobStorage";

// Helper to update job status (in-memory + database)
async function updateJobStatusFull(
  jobId: string,
  status: "pending" | "processing" | "complete" | "failed",
  progress: number,
  message: string,
  extra?: { code?: string; title?: string; error?: string }
) {
  // Update in-memory
  updateJob(jobId, {
    status,
    progress,
    message,
    ...extra,
  });

  // Also update database if available
  const admin = createAdminClient();
  if (admin) {
    await admin
      .from("generation_jobs")
      .update({
        status,
        progress,
        message,
        code: extra?.code,
        title: extra?.title,
        error: extra?.error,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }
}

// POST /api/generate/process
// Background worker that processes generation jobs
// Called by /api/generate/start
export async function POST(request: NextRequest) {
  try {
    const { jobId, videoUrl, styleDirective, userId } = await request.json();

    if (!jobId || !videoUrl || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[generate/process] Starting job ${jobId}`);

    // Initialize job in memory
    setJob(jobId, {
      status: "processing",
      progress: 10,
      message: "Initializing...",
      userId,
      createdAt: Date.now(),
    });

    // Update status: Spending credits
    await updateJobStatusFull(jobId, "processing", 20, "Verifying credits...");

    // Spend credits
    const admin = createAdminClient();
    if (admin) {
      // Check user credits
      const { data: creditData } = await admin
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (!creditData || creditData.balance < CREDIT_COSTS.VIDEO_GENERATE) {
        await updateJobStatusFull(jobId, "failed", 0, "Insufficient credits", {
          error: "Not enough credits for generation",
        });
        return NextResponse.json({ error: "Insufficient credits" }, { status: 402 });
      }

      // Deduct credits
      await admin
        .from("user_credits")
        .update({ balance: creditData.balance - CREDIT_COSTS.VIDEO_GENERATE })
        .eq("user_id", userId);
    }

    // Update status: Processing video
    await updateJobStatusFull(jobId, "processing", 40, "Analyzing video...");

    // Call the actual generation
    console.log(`[generate/process] Calling transmuteVideoToCode for job ${jobId}`);
    
    await updateJobStatusFull(jobId, "processing", 60, "Reconstructing user interface...");

    const result = await transmuteVideoToCode({
      videoUrl,
      styleDirective: styleDirective || "Modern, clean design with Tailwind CSS",
    });

    console.log(`[generate/process] Job ${jobId} result:`, { success: result.success, hasCode: !!result.code });

    if (result.success && result.code) {
      // Extract title from code
      let title: string | undefined;
      const titleMatch = result.code.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const extractedTitle = titleMatch[1].trim();
        if (extractedTitle && extractedTitle.length > 0 && extractedTitle.length < 50 && !extractedTitle.toLowerCase().includes("untitled")) {
          title = extractedTitle;
        }
      }

      await updateJobStatusFull(jobId, "complete", 100, "Generation complete!", {
        code: result.code,
        title,
      });

      console.log(`[generate/process] Job ${jobId} completed successfully`);
      return NextResponse.json({ success: true, jobId });
    } else {
      await updateJobStatusFull(jobId, "failed", 0, "Generation failed", {
        error: result.error || "No code returned",
      });

      console.error(`[generate/process] Job ${jobId} failed:`, result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

  } catch (error) {
    console.error("[generate/process] Error:", error);
    
    // Try to update job status if we have the jobId
    try {
      const body = await request.clone().json();
      if (body.jobId) {
        await updateJobStatusFull(body.jobId, "failed", 0, "Processing error", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } catch {}

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
