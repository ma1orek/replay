import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get user (optional - allow anonymous uploads for now)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "anonymous";

    const formData = await request.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    // Check file size (50MB max)
    const maxSizeMB = 50;
    if (file.size > maxSizeMB * 1024 * 1024) {
      return NextResponse.json({ 
        error: `Video too large. Maximum size is ${maxSizeMB}MB.` 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "webm";
    const filename = `${userId}/${timestamp}.${extension}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("videos")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || "video/webm",
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json({ error: "Failed to upload video" }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("videos")
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
      size: file.size,
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

