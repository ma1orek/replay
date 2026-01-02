import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// GET - Fetch user's generations
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

    // Fetch generations for this user using admin client
    const { data: generations, error } = await adminSupabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching generations:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to match the frontend GenerationRecord format
    const records = (generations || []).map((gen: any) => ({
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
      publishedSlug: gen.published_slug || null, // Will be null if column doesn't exist yet
    }));

    return NextResponse.json({ success: true, generations: records });

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
      publishedSlug
    } = body;

    // Check if generation already exists (update) or new (insert)
    const { data: existing } = await adminSupabase
      .from("generations")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Update existing generation
      const updateData: any = {
        title: title || 'Untitled Project',
        status: status || 'complete',
        output_code: code,
        input_style: styleDirective,
        input_context: refinements,
        output_architecture: { flowNodes, flowEdges },
        output_design_system: styleInfo,
        versions: versions || [],
        completed_at: status === 'complete' ? new Date().toISOString() : null,
      };
      
      // Only update token_usage if provided (don't overwrite with null)
      if (tokenUsage) {
        updateData.token_usage = tokenUsage;
      }
      
      // Try to update with published_slug first, then retry without if column doesn't exist
      if (publishedSlug) {
        updateData.published_slug = publishedSlug;
      }
      
      let { error } = await adminSupabase
        .from("generations")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      // If error is about missing column, retry without published_slug
      if (error && error.message?.includes('published_slug')) {
        console.warn("published_slug column missing, retrying without it");
        delete updateData.published_slug;
        const retryResult = await adminSupabase
          .from("generations")
          .update(updateData)
          .eq("id", id)
          .eq("user_id", user.id);
        error = retryResult.error;
      }

      if (error) {
        console.error("Error updating generation:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, id, action: "updated" });
    } else {
      // Insert new generation
      console.log("Inserting new generation with id:", id);
      
      const insertData: any = {
        id,
        user_id: user.id,
        title: title || 'Untitled Project',
        status: status || 'complete',
        cost_credits: costCredits || 75, // Default to generation cost (75)
        input_video_url: videoUrl,
        input_context: refinements,
        input_style: styleDirective,
        output_code: code,
        output_architecture: { flowNodes, flowEdges },
        output_design_system: styleInfo,
        versions: versions || [],
        token_usage: tokenUsage || null,
        completed_at: status === 'complete' ? new Date().toISOString() : null,
      };
      
      // Only add published_slug if provided
      if (publishedSlug) {
        insertData.published_slug = publishedSlug;
      }
      
      console.log("Insert data prepared, attempting insert...");
      
      let { data, error } = await adminSupabase
        .from("generations")
        .insert(insertData)
        .select()
        .single();

      // If error is about missing column, retry without published_slug
      if (error && error.message?.includes('published_slug')) {
        console.warn("published_slug column missing, retrying insert without it");
        delete insertData.published_slug;
        const retryResult = await adminSupabase
          .from("generations")
          .insert(insertData)
          .select()
          .single();
        data = retryResult.data;
        error = retryResult.error;
      }

      if (error) {
        console.error("Error inserting generation:", JSON.stringify(error, null, 2));
        return NextResponse.json({ error: error.message, details: error }, { status: 500 });
      }

      console.log("Generation inserted successfully:", data?.id);
      return NextResponse.json({ success: true, id: data.id, action: "created" });
    }

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

