import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * POST /api/voice-command
 * Submit a voice command for AI processing
 * 
 * Body:
 * - projectId: string (optional - for context)
 * - command: string (required - the voice command text)
 * 
 * This creates a task that will be processed asynchronously.
 * The client can poll for status or receive a push notification when done.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, command } = body;

    if (!command?.trim()) {
      return NextResponse.json({ error: "Command is required" }, { status: 400 });
    }

    // Generate a unique task ID
    const taskId = `voice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // For now, we'll store the task in a simple way
    // In production, you'd use a proper job queue (Redis, BullMQ, etc.)
    
    // Try to create task in ai_tasks table
    if (adminSupabase) {
      const { error: insertError } = await adminSupabase
        .from("ai_tasks")
        .insert({
          id: taskId,
          user_id: user.id,
          project_id: projectId || null,
          type: "voice_command",
          command: command.trim(),
          status: "pending",
          created_at: new Date().toISOString(),
        });

      // If table doesn't exist, that's okay - we'll process synchronously
      if (insertError && !insertError.message?.includes("does not exist")) {
        console.error("Error creating task:", insertError);
      }
    }

    // For MVP, we'll process simple commands synchronously
    // Complex commands would be queued for background processing
    
    const simpleCommands = [
      { pattern: /make.*(?:it\s+)?(\w+)/i, action: "color_change" },
      { pattern: /change.*color.*to\s+(\w+)/i, action: "color_change" },
      { pattern: /add\s+(?:a\s+)?(\w+)/i, action: "add_element" },
      { pattern: /remove\s+(?:the\s+)?(\w+)/i, action: "remove_element" },
      { pattern: /make.*(?:buttons?|text)\s+(\w+)/i, action: "style_change" },
    ];

    let matchedAction = null;
    let extractedValue = null;

    for (const { pattern, action } of simpleCommands) {
      const match = command.match(pattern);
      if (match) {
        matchedAction = action;
        extractedValue = match[1];
        break;
      }
    }

    // Log the command for analytics
    console.log(`[Voice Command] User ${user.id}: "${command}"`, {
      projectId,
      matchedAction,
      extractedValue,
    });

    // Return task info
    return NextResponse.json({
      success: true,
      taskId,
      status: "queued",
      message: "Command received and queued for processing",
      parsed: matchedAction ? {
        action: matchedAction,
        value: extractedValue,
      } : null,
      // For simple commands, we could process immediately
      // For complex ones, client will poll /api/voice-command/status?taskId=xxx
    });

  } catch (error: any) {
    console.error("Error in voice command POST:", error);
    return NextResponse.json({ error: error.message || "Failed to process command" }, { status: 500 });
  }
}

/**
 * GET /api/voice-command?taskId=xxx
 * Check status of a voice command task
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 });
    }

    // Try to get task from database
    if (adminSupabase) {
      const { data: task, error } = await adminSupabase
        .from("ai_tasks")
        .select("*")
        .eq("id", taskId)
        .eq("user_id", user.id)
        .single();

      if (error && !error.message?.includes("does not exist")) {
        console.error("Error fetching task:", error);
      }

      if (task) {
        return NextResponse.json({
          success: true,
          task: {
            id: task.id,
            status: task.status,
            command: task.command,
            result: task.result,
            error: task.error,
            createdAt: task.created_at,
            completedAt: task.completed_at,
          },
        });
      }
    }

    // Task not found or table doesn't exist
    return NextResponse.json({
      success: true,
      task: {
        id: taskId,
        status: "unknown",
        message: "Task not found or already processed",
      },
    });

  } catch (error: any) {
    console.error("Error in voice command GET:", error);
    return NextResponse.json({ error: error.message || "Failed to get task status" }, { status: 500 });
  }
}
