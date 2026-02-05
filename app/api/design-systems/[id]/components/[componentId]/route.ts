import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import type { UpdateComponentRequest } from "@/types/design-system";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string; componentId: string }>;
}

/**
 * GET /api/design-systems/[id]/components/[componentId]
 * Fetch a single component
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, componentId } = await params;
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

    // Fetch component
    const { data: component, error } = await adminSupabase
      .from("design_system_components")
      .select("*")
      .eq("id", componentId)
      .eq("design_system_id", id)
      .single();

    if (error || !component) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      component 
    });
  } catch (err: any) {
    console.error("[Components] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PATCH /api/design-systems/[id]/components/[componentId]
 * Update a component
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, componentId } = await params;
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

    // Check component exists
    const { data: existing, error: compError } = await adminSupabase
      .from("design_system_components")
      .select("id, name")
      .eq("id", componentId)
      .eq("design_system_id", id)
      .single();

    if (compError || !existing) {
      return NextResponse.json({ error: "Component not found" }, { status: 404 });
    }

    const body: UpdateComponentRequest = await request.json();
    
    // Build update object
    const updates: Record<string, any> = {};
    if (body.name !== undefined) {
      // Check for duplicate name if changing
      if (body.name.trim() !== existing.name) {
        const { data: duplicate } = await adminSupabase
          .from("design_system_components")
          .select("id")
          .eq("design_system_id", id)
          .eq("name", body.name.trim())
          .neq("id", componentId)
          .single();

        if (duplicate) {
          return NextResponse.json({ 
            error: `Component "${body.name}" already exists` 
          }, { status: 409 });
        }
      }
      updates.name = body.name.trim();
    }
    if (body.layer !== undefined) updates.layer = body.layer;
    if (body.category !== undefined) updates.category = body.category;
    if (body.code !== undefined) updates.code = body.code;
    if (body.variants !== undefined) updates.variants = body.variants;
    if (body.props !== undefined) updates.props = body.props;
    if (body.docs !== undefined) updates.docs = body.docs;
    if (body.is_approved !== undefined) updates.is_approved = body.is_approved;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Update
    const { data: updated, error: updateError } = await adminSupabase
      .from("design_system_components")
      .update(updates)
      .eq("id", componentId)
      .select()
      .single();

    if (updateError) {
      console.error("[Components] Update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      component: updated 
    });
  } catch (err: any) {
    console.error("[Components] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/design-systems/[id]/components/[componentId]
 * Delete a component
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, componentId } = await params;
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

    // Delete component
    const { error: deleteError } = await adminSupabase
      .from("design_system_components")
      .delete()
      .eq("id", componentId)
      .eq("design_system_id", id);

    if (deleteError) {
      console.error("[Components] Delete error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Components] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
