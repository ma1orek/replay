import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey, spendCreditsForApi } from "@/lib/api-auth";
import { createClient } from "@supabase/supabase-js";

const COST = 5;

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateApiKey(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { code, design_system_id } = body;

    if (!code || !design_system_id) {
      return NextResponse.json(
        { error: "code and design_system_id are required" },
        { status: 400 }
      );
    }

    // Fetch design system tokens
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: ds, error: dsError } = await supabase
      .from("design_systems")
      .select("name, tokens")
      .eq("id", design_system_id)
      .single();

    if (dsError || !ds) {
      return NextResponse.json(
        { error: "Design system not found" },
        { status: 404 }
      );
    }

    const spend = await spendCreditsForApi(auth.user_id, COST, "api_validate");
    if (!spend.success) {
      return NextResponse.json(
        { error: spend.error || "Insufficient credits", credits_required: COST },
        { status: 402 }
      );
    }

    // Validate code against DS tokens
    const tokens = ds.tokens || {};
    const errors: Array<{ type: string; message: string; value?: string }> = [];

    // Extract colors from DS
    const dsColors: Record<string, string> = {};
    const colorSources = tokens.colors || tokens.colour || {};
    for (const [name, value] of Object.entries(colorSources)) {
      if (typeof value === "string" && value.startsWith("#")) {
        dsColors[name] = value.toLowerCase();
      }
    }

    // Extract fonts from DS
    const dsFonts: string[] = [];
    const fontSources = tokens.typography || tokens.fonts || {};
    for (const [, value] of Object.entries(fontSources)) {
      if (typeof value === "string") dsFonts.push(value.toLowerCase());
    }

    // Check for hardcoded hex colors not in DS
    const hexPattern = /#[0-9a-fA-F]{3,8}/g;
    const foundColors = code.match(hexPattern) || [];
    const dsColorValues = new Set(Object.values(dsColors));
    // Common neutrals are OK
    const neutrals = new Set(["#000", "#000000", "#fff", "#ffffff", "#f5f5f5", "#e5e5e5", "#333", "#333333", "#666", "#666666", "#999", "#999999"]);

    for (const color of foundColors) {
      const normalized = color.toLowerCase();
      if (!dsColorValues.has(normalized) && !neutrals.has(normalized)) {
        errors.push({
          type: "color",
          message: `Hardcoded color ${color} not found in design system. Use a DS token instead.`,
          value: color,
        });
      }
    }

    // Check font-family usage
    const fontPattern = /font-family:\s*['"]?([^'";,}]+)/gi;
    let fontMatch;
    while ((fontMatch = fontPattern.exec(code)) !== null) {
      const usedFont = fontMatch[1].trim().toLowerCase();
      if (dsFonts.length > 0 && !dsFonts.some((f) => usedFont.includes(f))) {
        errors.push({
          type: "font",
          message: `Font "${fontMatch[1].trim()}" not in design system. DS fonts: ${dsFonts.join(", ")}`,
          value: fontMatch[1].trim(),
        });
      }
    }

    // Deduplicate color errors (same color mentioned multiple times)
    const seen = new Set<string>();
    const uniqueErrors = errors.filter((e) => {
      const key = `${e.type}:${e.value}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({
      valid: uniqueErrors.length === 0,
      errors: uniqueErrors,
      design_system: ds.name,
      credits_used: COST,
    });
  } catch (error: any) {
    console.error("[API v1/validate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error?.message },
      { status: 500 }
    );
  }
}
