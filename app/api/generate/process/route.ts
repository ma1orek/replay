"use server";

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { transmuteVideoToCode } from "@/actions/transmute";
import { CREDIT_COSTS } from "@/lib/credits/context";

// Import job storage from status route
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

// Helper to update job status
async function updateJobStatus(
  jobId: string,
  status: "pending" | "processing" | "complete" | "failed",
  progress: number,
  message: string,
  extra?: { code?: string; title?: string; error?: string }
) {
  const job = global.generationJobs.get(jobId);
  if (job) {
    global.generationJobs.set(jobId, {
      ...job,
      status,
      progress,
      message,
      ...extra,
    });
  }

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
    global.generationJobs.set(jobId, {
      status: "processing",
      progress: 10,
      message: "Initializing...",
      userId,
      createdAt: Date.now(),
    });

    // Update status: Spending credits
    await updateJobStatus(jobId, "processing", 20, "Verifying credits...");

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
        await updateJobStatus(jobId, "failed", 0, "Insufficient credits", {
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
    await updateJobStatus(jobId, "processing", 40, "Analyzing video...");

    // Call the actual generation
    console.log(`[generate/process] Calling transmuteVideoToCode for job ${jobId}`);
    
    await updateJobStatus(jobId, "processing", 60, "Reconstructing user interface...");

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

      await updateJobStatus(jobId, "complete", 100, "Generation complete!", {
        code: result.code,
        title,
      });

      console.log(`[generate/process] Job ${jobId} completed successfully`);
      return NextResponse.json({ success: true, jobId });
    } else {
      await updateJobStatus(jobId, "failed", 0, "Generation failed", {
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
        await updateJobStatus(body.jobId, "failed", 0, "Processing error", {
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
