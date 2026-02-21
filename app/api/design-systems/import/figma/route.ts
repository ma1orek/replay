import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiKey } from "@/lib/api-auth";

// Admin client for DB operations (bypasses RLS)
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// CORS headers for Figma plugin iframe
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// Categorize component into layer based on name/category
function categorizeLayer(category: string, name: string): string {
  const cat = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (cat.includes("foundation") || cat.includes("token") || cat.includes("color") || cat.includes("typography")) return "foundations";
  if (cat.includes("pattern") || cat.includes("template") || cat.includes("layout")) return "patterns";
  if (cat.includes("product") || cat.includes("feature") || cat.includes("page")) return "product";

  // Default most components to "components" layer
  return "components";
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate via API key (Bearer rk_live_...)
    const auth = await authenticateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key. Use Authorization: Bearer rk_live_..." },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    const adminSupabase = getAdminClient();
    if (!adminSupabase) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    const body = await request.json();
    const { name, tokens, components, source_url } = body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!tokens || typeof tokens !== "object") {
      return NextResponse.json(
        { error: "Tokens object is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Normalize tokens to match DesignTokens shape
    const normalizedTokens = {
      colors: tokens.colors && typeof tokens.colors === "object" ? tokens.colors : {},
      typography: {
        fontFamily: tokens.typography?.fontFamily || {},
        fontSize: tokens.typography?.fontSize || {},
        fontWeight: tokens.typography?.fontWeight || {},
        lineHeight: tokens.typography?.lineHeight || {},
      },
      spacing: tokens.spacing && typeof tokens.spacing === "object" ? tokens.spacing : {},
      borderRadius: tokens.borderRadius && typeof tokens.borderRadius === "object" ? tokens.borderRadius : {},
      shadows: tokens.shadows && typeof tokens.shadows === "object" ? tokens.shadows : {},
    };

    // Log token counts
    console.log("[Figma Import] Tokens:", {
      colors: Object.keys(normalizedTokens.colors).length,
      fonts: Object.keys(normalizedTokens.typography.fontFamily).length,
      fontSizes: Object.keys(normalizedTokens.typography.fontSize).length,
      spacing: Object.keys(normalizedTokens.spacing).length,
      radii: Object.keys(normalizedTokens.borderRadius).length,
      shadows: Object.keys(normalizedTokens.shadows).length,
    });

    // Create the design system
    const { data: newDS, error: dsError } = await adminSupabase
      .from("design_systems")
      .insert({
        user_id: auth.user_id,
        name: name.trim(),
        source_type: "figma",
        source_url: source_url || null,
        tokens: normalizedTokens,
        is_default: false,
        is_public: false,
      })
      .select()
      .single();

    if (dsError) {
      console.error("[Figma Import] Failed to create design system:", dsError);
      return NextResponse.json(
        { error: dsError.message },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Insert components as lightweight specs (metadata for AI context only)
    let insertedCount = 0;
    const componentArray = Array.isArray(components) ? components : [];

    if (componentArray.length > 0) {
      const componentInserts = componentArray.slice(0, 200).map((comp: any) => {
        const compName = comp.name || "Unknown";
        const compCategory = comp.category || "Uncategorized";
        const layer = categorizeLayer(compCategory, compName);
        const variants = Array.isArray(comp.variants)
          ? comp.variants.map((v: any) =>
              typeof v === "string"
                ? { name: v, propsOverride: {}, description: `${v} variant` }
                : v
            )
          : [{ name: "Default", propsOverride: {}, description: "Default variant" }];

        const variantNames = variants.map((v: any) => v.name).filter((n: string) => n !== "Default").join(", ") || "Default";
        const props = Array.isArray(comp.props) ? comp.props : [];
        const description = comp.description || `${compName} component from Figma`;

        return {
          design_system_id: newDS.id,
          name: compName,
          layer,
          category: compCategory,
          code: `/* ${compName} - ${compCategory} | Layer: ${layer} | Variants: ${variantNames} | Source: Figma */`,
          variants,
          props,
          docs: {
            description,
            usage: `Use ${compName} for ${layer}-level UI elements`,
            states: variants.map((v: any) => v.name).join(", "),
            category: compCategory,
          },
          is_approved: true,
          usage_count: 0,
        };
      });

      // Insert in batches of 20
      const batchSize = 20;
      for (let i = 0; i < componentInserts.length; i += batchSize) {
        const batch = componentInserts.slice(i, i + batchSize);
        const { error: compError, data: insertedData } = await adminSupabase
          .from("design_system_components")
          .insert(batch)
          .select("id");

        if (compError) {
          console.error(`[Figma Import] Batch ${i / batchSize + 1} failed:`, compError.message);
          // Try one by one
          for (const comp of batch) {
            const { error: singleError } = await adminSupabase
              .from("design_system_components")
              .insert(comp);
            if (!singleError) insertedCount++;
            else console.error(`[Figma Import] Component "${comp.name}" failed:`, singleError.message);
          }
        } else {
          insertedCount += insertedData?.length || batch.length;
        }
      }
      console.log(`[Figma Import] Inserted ${insertedCount}/${componentInserts.length} components`);
    }

    return NextResponse.json(
      {
        success: true,
        designSystem: {
          id: newDS.id,
          name: newDS.name,
          component_count: insertedCount,
          source_type: "figma",
          source_url: source_url || null,
        },
        components: insertedCount,
        totalParsed: componentArray.length,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error("[Figma Import] Error:", err);
    return NextResponse.json(
      { error: err.message || "Import failed" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
