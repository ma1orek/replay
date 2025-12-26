import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const supabase = await createServerSupabaseClient();
    
    // Get user
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "anon";
    
    const { filename, contentType } = await request.json();
    
    // Generate unique path
    const timestamp = Date.now();
    const extension = filename?.split(".").pop() || "webm";
    const path = `${userId}/${timestamp}.${extension}`;
    
    // Create signed upload URL (valid for 1 hour)
    const { data, error } = await adminClient.storage
      .from("videos")
      .createSignedUploadUrl(path);
    
    if (error) {
      console.error("Error creating signed URL:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Also get the public URL for after upload
    const { data: { publicUrl } } = adminClient.storage
      .from("videos")
      .getPublicUrl(path);
    
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: path,
      publicUrl: publicUrl,
    });
    
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message || "Failed to get upload URL" }, { status: 500 });
  }
}

