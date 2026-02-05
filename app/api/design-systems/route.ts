import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import type { 
  DesignSystem, 
  CreateDesignSystemRequest,
  DesignSystemListItem,
  DEFAULT_TOKENS 
} from "@/types/design-system";

export const runtime = "nodejs";

/**
 * GET /api/design-systems
 * Fetch user's design systems with component counts
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
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Fetch design systems with component count
    const { data: designSystems, error } = await adminSupabase
      .from("design_systems")
      .select(`
        id,
        name,
        source_type,
        tokens,
        is_default,
        is_public,
        created_at,
        updated_at
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Design Systems] Error fetching:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get component counts for each design system
    const dsIds = (designSystems || []).map(ds => ds.id);
    
    let componentCounts: Record<string, number> = {};
    if (dsIds.length > 0) {
      const { data: counts, error: countError } = await adminSupabase
        .from("design_system_components")
        .select("design_system_id")
        .in("design_system_id", dsIds);
      
      if (!countError && counts) {
        counts.forEach((c: any) => {
          componentCounts[c.design_system_id] = (componentCounts[c.design_system_id] || 0) + 1;
        });
      }
    }

    // Transform to list items
    const items: DesignSystemListItem[] = (designSystems || []).map(ds => ({
      id: ds.id,
      name: ds.name,
      component_count: componentCounts[ds.id] || 0,
      is_default: ds.is_default,
      source_type: ds.source_type,
      updated_at: ds.updated_at,
    }));

    return NextResponse.json({ 
      success: true, 
      designSystems: items 
    });
  } catch (err: any) {
    console.error("[Design Systems] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/design-systems
 * Create a new design system
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
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const body: CreateDesignSystemRequest = await request.json();
    
    // Validate required fields
    if (!body.name || body.name.trim() === '') {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Check if this is the user's first design system (make it default)
    const { count } = await adminSupabase
      .from("design_systems")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const isFirstDS = count === 0;

    // Default tokens structure
    const defaultTokens = {
      colors: {},
      typography: {
        fontFamily: {},
        fontSize: {},
        fontWeight: {},
        lineHeight: {},
      },
      spacing: {},
      borderRadius: {},
      shadows: {},
    };

    // Insert the design system
    const { data: newDS, error: insertError } = await adminSupabase
      .from("design_systems")
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        source_type: body.source_type || null,
        source_url: body.source_url || null,
        tokens: body.tokens || defaultTokens,
        is_default: body.is_default ?? isFirstDS, // First one is default
        is_public: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Design Systems] Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      designSystem: newDS 
    }, { status: 201 });
  } catch (err: any) {
    console.error("[Design Systems] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
