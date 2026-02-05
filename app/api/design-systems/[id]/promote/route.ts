import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";
import type { PromoteComponentRequest } from "@/types/design-system";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/design-systems/[id]/promote
 * Promote a local component from a project to the Design System ("Save to Library")
 * This is the "bubble up" mechanism
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
      .select("user_id, name")
      .eq("id", id)
      .single();

    if (dsError || !ds) {
      return NextResponse.json({ error: "Design system not found" }, { status: 404 });
    }

    if (ds.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body: PromoteComponentRequest = await request.json();
    
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
    if (!body.generationId) {
      return NextResponse.json({ error: "Generation ID is required" }, { status: 400 });
    }

    // Verify generation belongs to user
    const { data: generation, error: genError } = await adminSupabase
      .from("generations")
      .select("user_id, local_components")
      .eq("id", body.generationId)
      .single();

    if (genError || !generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    if (generation.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check for duplicate name in design system
    const { data: existing } = await adminSupabase
      .from("design_system_components")
      .select("id")
      .eq("design_system_id", id)
      .eq("name", body.name.trim())
      .single();

    if (existing) {
      return NextResponse.json({ 
        error: `Component "${body.name}" already exists in "${ds.name}"`,
        existingId: existing.id
      }, { status: 409 });
    }

    // Default docs structure
    const defaultDocs = {
      description: body.docs?.description || `${body.name} component`,
      usage: body.docs?.usage || `import { ${body.name} } from '@/components/${body.name}'`,
      accessibility: body.docs?.accessibility || '',
      bestPractices: body.docs?.bestPractices || [],
    };

    // Insert component into design system
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
        source_generation_id: body.generationId,
        is_approved: true,
        usage_count: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("[Promote] Insert error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update local_components in generation to mark as saved
    const localComponents = generation.local_components || [];
    const updatedLocalComponents = localComponents.map((lc: any) => {
      if (lc.id === body.componentId || lc.name === body.name) {
        return { ...lc, savedToLibrary: true };
      }
      return lc;
    });

    await adminSupabase
      .from("generations")
      .update({ local_components: updatedLocalComponents })
      .eq("id", body.generationId);

    return NextResponse.json({ 
      success: true, 
      component: newComponent,
      message: `"${body.name}" has been added to "${ds.name}"`
    }, { status: 201 });
  } catch (err: any) {
    console.error("[Promote] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
