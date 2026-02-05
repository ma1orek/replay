import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import type { 
  DesignSystemWithComponents, 
  UpdateDesignSystemRequest 
} from "@/types/design-system";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/design-systems/[id]
 * Fetch a single design system with all its components
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

    // Fetch design system
    const { data: ds, error: dsError } = await adminSupabase
      .from("design_systems")
      .select("*")
      .eq("id", id)
      .single();

    if (dsError || !ds) {
      return NextResponse.json({ error: "Design system not found" }, { status: 404 });
    }

    // Check ownership or public access
    if (ds.user_id !== user.id && !ds.is_public) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch components
    const { data: components, error: compError } = await adminSupabase
      .from("design_system_components")
      .select("*")
      .eq("design_system_id", id)
      .order("layer", { ascending: true })
      .order("name", { ascending: true });

    if (compError) {
      console.error("[Design Systems] Error fetching components:", compError);
    }

    const result: DesignSystemWithComponents = {
      ...ds,
      components: components || [],
    };

    return NextResponse.json({ 
      success: true, 
      designSystem: result 
    });
  } catch (err: any) {
    console.error("[Design Systems] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/design-systems/[id]
 * Update a design system
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Check ownership
    const { data: existing, error: checkError } = await adminSupabase
      .from("design_systems")
      .select("user_id")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Design system not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body: UpdateDesignSystemRequest = await request.json();
    
    // Build update object
    const updates: Record<string, any> = {};
    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.tokens !== undefined) updates.tokens = body.tokens;
    if (body.is_default !== undefined) updates.is_default = body.is_default;
    if (body.is_public !== undefined) updates.is_public = body.is_public;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Update
    const { data: updated, error: updateError } = await adminSupabase
      .from("design_systems")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("[Design Systems] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      designSystem: updated 
    });
  } catch (err: any) {
    console.error("[Design Systems] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/design-systems/[id]
 * Delete a design system and all its components
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check ownership
    const { data: existing, error: checkError } = await adminSupabase
      .from("design_systems")
      .select("user_id, is_default")
      .eq("id", id)
      .single();

    if (checkError || !existing) {
      return NextResponse.json({ error: "Design system not found" }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if any generations are using this design system
    const { count: usageCount } = await adminSupabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .eq("design_system_id", id);

    if (usageCount && usageCount > 0) {
      return NextResponse.json({ 
        error: `Cannot delete: ${usageCount} project(s) are using this design system`,
        usageCount 
      }, { status: 400 });
    }

    // Delete (CASCADE will remove components)
    const { error: deleteError } = await adminSupabase
      .from("design_systems")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[Design Systems] Delete error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // If this was the default, make another one default
    if (existing.is_default) {
      const { data: nextDS } = await adminSupabase
        .from("design_systems")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (nextDS) {
        await adminSupabase
          .from("design_systems")
          .update({ is_default: true })
          .eq("id", nextDS.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Design Systems] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
