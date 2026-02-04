import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData() as unknown as globalThis.FormData;
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // Create Supabase client with service role key for storage access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'png';
    const filename = `${userId || 'anon'}/${timestamp}-${randomStr}.${extension}`;
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("user-images")
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });
    
    if (error) {
      console.error("Supabase upload error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Use signed URL (works even if bucket is private) - valid for 1 year
    const { data: signedData, error: signedError } = await supabase.storage
      .from("user-images")
      .createSignedUrl(filename, 60 * 60 * 24 * 365);
    
    if (signedData?.signedUrl) {
      console.log("[upload-image] Uploaded with signed URL:", filename);
      return NextResponse.json({
        success: true,
        url: signedData.signedUrl,
        filename: filename,
      });
    }
    
    // Fallback to public URL if signed fails
    const { data: urlData } = supabase.storage
      .from("user-images")
      .getPublicUrl(filename);
    
    console.log("[upload-image] Uploaded with public URL:", filename);
    
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      filename: filename,
    });
    
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
