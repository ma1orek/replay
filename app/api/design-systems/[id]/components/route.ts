import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import type { 
  DesignSystemComponent, 
  CreateComponentRequest 
} from "@/types/design-system";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/design-systems/[id]/components
 * Fetch all components for a design system
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Check design system access
    const { data: ds, error: dsError } = await adminSupabase
      .from("design_systems")
      .select("user_id, is_public")
      .eq("id", id)
      .single();

    if (dsError || !ds) {
      return NextResponse.json({ error: "Design system not found" }, { status: 404 });
    }

    if (ds.user_id !== user.id && !ds.is_public) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get query params for filtering
    const { searchParams } = new URL(request.url);
    const layer = searchParams.get("layer");
    const category = searchParams.get("category");

    // Build query
    let query = adminSupabase
      .from("design_system_components")
      .select("*")
      .eq("design_system_id", id);

    if (layer) {
      query = query.eq("layer", layer);
    }
    if (category) {
      query = query.eq("category", category);
    }

    const { data: components, error } = await query
      .order("layer", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("[Components] Error fetching:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      components: components || [] 
    });
  } catch (err: any) {
    console.error("[Components] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/design-systems/[id]/components
 * Add a new component to a design system (Save to Library)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const adminSupabase = createAdminClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Check design system ownership
    const { data: ds, error: dsError } = await adminSupabase
      .from("design_systems")
      .select("user_id")
      .eq("id", id)
      .single();

    if (dsError || !ds) {
      return NextResponse.json({ error: "Design system not found" }, { status: 404 });
    }

    if (ds.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body: CreateComponentRequest = await request.json();
    
    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.code || body.code.trim() === '') {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }
    if (!body.layer) {
      return NextResponse.json({ error: "Layer is required" }, { status: 400 });
    }

    // Check for duplicate name
    const { data: existing } = await adminSupabase
      .from("design_system_components")
      .select("id")
      .eq("design_system_id", id)
      .eq("name", body.name.trim())
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: `Component "${body.name}" already exists in this design system` 
      }, { status: 409 });
    }

    // Default docs structure
    const defaultDocs = {
      description: body.docs?.description || '',
      usage: body.docs?.usage || '',
      accessibility: body.docs?.accessibility || '',
      bestPractices: body.docs?.bestPractices || [],
    };

    // Insert component
    const { data: newComponent, error: insertError } = await adminSupabase
      .from("design_system_components")
      .insert({
        design_system_id: id,
        name: body.name.trim(),
        layer: body.layer,
        category: body.category || null,
        code: body.code,
        variants: body.variants || [],
        props: body.props || [],
        docs: defaultDocs,
        source_generation_id: body.source_generation_id || null,
        is_approved: true,
        usage_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Components] Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      component: newComponent 
    }, { status: 201 });
  } catch (err: any) {
    console.error("[Components] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
