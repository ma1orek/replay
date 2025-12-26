import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    // Use admin client for storage operations (bypass RLS)
    const adminClient = createAdminClient();
    
    // Check if admin client is properly initialized
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not set!");
      return NextResponse.json({ 
        error: "Server configuration error: missing service role key" 
      }, { status: 500 });
    }
    
    const supabase = await createServerSupabaseClient();
    
    // Get user (optional - allow anonymous uploads for now)
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || "anon";
    console.log("Uploading for user:", userId);

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

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage using admin client
    const { data, error } = await adminClient.storage
      .from("videos")
      .upload(filename, buffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "video/webm",
      });

    if (error) {
      console.error("Supabase Storage upload error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Check for specific error types
      if (error.message?.includes("not found") || error.message?.includes("Bucket")) {
        return NextResponse.json({ 
          error: "Storage bucket 'videos' not found. Please create it in Supabase Dashboard." 
        }, { status: 500 });
      }
      if (error.message?.includes("policy") || error.message?.includes("403") || error.statusCode === "403") {
        return NextResponse.json({ 
          error: "Storage policy error. Check that 'videos' bucket allows uploads or service role key is correct." 
        }, { status: 500 });
      }
      return NextResponse.json({ error: `Upload failed: ${error.message}` }, { status: 500 });
    }
    
    console.log("Upload successful:", data.path);

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from("videos")
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
      size: file.size,
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}

