import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - Fetch user's generations
// Query params:
// - id: fetch single generation by ID (with full data)
// - limit: max number of generations (default 100)
// - offset: pagination offset (default 0)
// - minimal: if "true", fetch only metadata for history list (no code/versions)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If admin client not available, return empty (generations won't sync)
    if (!adminSupabase) {
      console.error("SUPABASE_SERVICE_ROLE_KEY not set - returning empty generations");
      return NextResponse.json({ success: true, generations: [] });
    }

    const { searchParams } = new URL(request.url);
    const singleId = searchParams.get("id");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500); // Max 500
    const offset = parseInt(searchParams.get("offset") || "0");
    const minimal = searchParams.get("minimal") === "true";

    // If fetching single generation by ID
    if (singleId) {
      const { data: gen, error } = await adminSupabase
        .from("generations")
        .select("*")
        .eq("id", singleId)
        .eq("user_id", user.id)
        .single();

      if (error || !gen) {
        return NextResponse.json({ error: "Generation not found" }, { status: 404 });
      }

      const record = {
        id: gen.id,
        title: gen.title || gen.input_context?.split('\n')[0]?.slice(0, 50) || 'Untitled Project',
        autoTitle: !gen.title,
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
        libraryData: gen.library_data || null,
        user_id: gen.user_id, // For access control
      };

      return NextResponse.json({ success: true, generation: record });
    }

    // For history list, fetch only essential fields (much faster)
    // Include versions for version count display, user_id for access control
    const selectFields = minimal
      ? "id, title, input_context, created_at, status, input_video_url, published_slug, versions, input_style, user_id"
      : "*";

    const { data: generations, error, count } = await adminSupabase
      .from("generations")
      .select(selectFields, { count: "exact" })
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching generations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to match the frontend GenerationRecord format
    const records = (generations || []).map((gen: any) => {
      if (minimal) {
        // Minimal response for history list (includes versions for display)
        return {
          id: gen.id,
          title: gen.title || gen.input_context?.split('\n')[0]?.slice(0, 50) || 'Untitled Project',
          autoTitle: !gen.title,
          timestamp: new Date(gen.created_at).getTime(),
          status: gen.status as "running" | "complete" | "failed",
          videoUrl: gen.input_video_url,
          publishedSlug: gen.published_slug || null,
          versions: gen.versions || [],
          styleDirective: gen.input_style || '',
          user_id: gen.user_id, // For access control
        };
      }
      // Full response
      return {
        id: gen.id,
        title: gen.title || gen.input_context?.split('\n')[0]?.slice(0, 50) || 'Untitled Project',
        autoTitle: !gen.title,
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
        libraryData: gen.library_data || null,
        user_id: gen.user_id, // For access control
      };
    });

    return NextResponse.json({ 
      success: true, 
      generations: records,
      total: count || records.length,
      limit,
      offset
    });

  } catch (error: any) {
    console.error("Error in generations GET:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch generations" }, { status: 500 });
  }
}

// POST - Save a new generation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    // Check if admin client is available
    if (!adminSupabase) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set - cannot save generations");
      return NextResponse.json({ 
        error: "Server configuration error - add SUPABASE_SERVICE_ROLE_KEY to environment variables",
        hint: "Get it from Supabase → Settings → API → service_role (secret)"
      }, { status: 503 });
    }
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      id, 
      title, 
      status, 
      code, 
      styleDirective, 
      refinements, 
      flowNodes, 
      flowEdges, 
      styleInfo, 
      videoUrl,
      versions,
      tokenUsage,
      costCredits,
      publishedSlug,
      libraryData
    } = body;

    // Use UPSERT to avoid race conditions (duplicate key errors)
    // This atomically inserts or updates based on the primary key
    const upsertData: any = {
      id,
      user_id: user.id,
      title: title || 'Untitled Project',
      status: status || 'complete',
      cost_credits: costCredits || 75,
      input_video_url: videoUrl,
      input_context: refinements,
      input_style: styleDirective,
      output_code: code,
      output_architecture: { flowNodes, flowEdges },
      output_design_system: styleInfo,
      versions: versions || [],
      completed_at: status === 'complete' ? new Date().toISOString() : null,
    };
    
    // Only add token_usage if provided
    if (tokenUsage) {
      upsertData.token_usage = tokenUsage;
    }
    
    // Only add published_slug if provided
    if (publishedSlug) {
      upsertData.published_slug = publishedSlug;
    }
    
    // Only add library_data if provided
    if (libraryData) {
      upsertData.library_data = libraryData;
    }
    
    console.log("Upserting generation:", id);
    
    let { data, error } = await adminSupabase
      .from("generations")
      .upsert(upsertData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    // If error is about missing column, retry without published_slug
    if (error && error.message?.includes('published_slug')) {
      console.warn("published_slug column missing, retrying upsert without it");
      delete upsertData.published_slug;
      const retryResult = await adminSupabase
        .from("generations")
        .upsert(upsertData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) {
      console.error("Error upserting generation:", JSON.stringify(error, null, 2));
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log("Generation saved successfully:", data?.id);
    return NextResponse.json({ success: true, id: data?.id || id, action: "saved" });

  } catch (error: any) {
    console.error("Error in generations POST:", error);
    return NextResponse.json({ error: error.message || "Failed to save generation" }, { status: 500 });
  }
}

// DELETE - Delete a generation
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Generation ID required" }, { status: 400 });
    }

    const { error } = await adminSupabase
      .from("generations")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting generation:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });

  } catch (error: any) {
    console.error("Error in generations DELETE:", error);
    return NextResponse.json({ error: error.message || "Failed to delete generation" }, { status: 500 });
  }
}

