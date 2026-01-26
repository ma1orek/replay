import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Demo generation IDs - these are pre-generated projects that can be loaded without auth
// Edit these projects in the tool and changes will reflect live in demos!
const DEMO_KEY_TO_ID: Record<string, string> = {
  'dashboard': 'flow_1768474261072_uclbwqzdc', // SaaS Dashboard - Visual Refactor
  'yc': 'flow_1768470467213_35dvc8tap',        // YC Directory - Style Injection
  'landing': 'flow_1767812494307_4c540djzy',   // Landing Page - UX/UI Upgrade
};

// Also allow direct IDs (include both mapped IDs and any direct flow IDs)
const ALLOWED_IDS = new Set([
  ...Object.values(DEMO_KEY_TO_ID),
  // Additional direct flow IDs that can be accessed
  'flow_1768474261072_uclbwqzdc',
  'flow_1768470467213_35dvc8tap',
  'flow_1767812494307_4c540djzy',
  'flow_1769444036799_r8hrcxyx2', // Enterprise Dashboard - Showcase Demo
]);

// GET - Fetch demo generation (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const idParam = params.id;
    
    // Check if this is a short key OR a full generation ID
    let generationId: string | undefined;
    
    if (DEMO_KEY_TO_ID[idParam]) {
      // It's a short key like "dashboard"
      generationId = DEMO_KEY_TO_ID[idParam];
    } else if (ALLOWED_IDS.has(idParam)) {
      // It's a full generation ID like "flow_1767812459829_3ezutuops"
      generationId = idParam;
    }
    
    if (!generationId) {
      return NextResponse.json({ 
        error: "Invalid demo ID",
        hint: "Valid demos: dashboard, yc, landing"
      }, { status: 404 });
    }

    const adminSupabase = createAdminClient();
    
    if (!adminSupabase) {
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 503 });
    }

    // Fetch the demo generation without user check
    const { data: gen, error } = await adminSupabase
      .from("generations")
      .select("*")
      .eq("id", generationId)
      .single();

    if (error || !gen) {
      console.error("Demo generation not found:", generationId, error);
      return NextResponse.json({ 
        error: "Demo generation not found",
        hint: "The demo project may not exist yet. Generate it first."
      }, { status: 404 });
    }

    // Return full generation data
    const record = {
      id: gen.id,
      title: gen.title || 'Demo Project',
      timestamp: new Date(gen.created_at).getTime(),
      status: gen.status as "running" | "complete" | "failed",
      code: gen.output_code,
      styleDirective: gen.input_style || '',
      refinements: gen.input_context || '',
      flowNodes: gen.output_architecture?.flowNodes || [],
      flowEdges: gen.output_architecture?.flowEdges || [],
      styleInfo: gen.output_design_system,
      videoUrl: gen.input_video_url,
      versions: gen.versions || [],
      publishedSlug: gen.published_slug || null,
      isDemo: true, // Mark as demo so we know to show signup prompts
    };

    return NextResponse.json({ success: true, generation: record });

  } catch (error: any) {
    console.error("Error in demo GET:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to fetch demo" 
    }, { status: 500 });
  }
}

