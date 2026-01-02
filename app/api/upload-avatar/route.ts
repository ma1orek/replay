import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Check auth
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be less than 5MB" }, { status: 400 });
    }

    // Convert file to base64 for Cloudinary
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Cloudinary not configured");
      return NextResponse.json({ error: "Image upload service not configured" }, { status: 500 });
    }

    // Generate signature for signed upload
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "replay-avatars";
    const publicId = `avatar_${user.id}_${timestamp}`;
    
    const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    const crypto = await import("crypto");
    const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

    // Upload to Cloudinary
    const uploadFormData = new FormData();
    uploadFormData.append("file", base64);
    uploadFormData.append("api_key", apiKey);
    uploadFormData.append("timestamp", timestamp.toString());
    uploadFormData.append("signature", signature);
    uploadFormData.append("folder", folder);
    uploadFormData.append("public_id", publicId);
    // Add transformation for cropping to square
    uploadFormData.append("transformation", "c_fill,w_256,h_256,g_face");

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    if (!cloudinaryRes.ok) {
      const errorData = await cloudinaryRes.json();
      console.error("Cloudinary error:", errorData);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }

    const cloudinaryData = await cloudinaryRes.json();
    const avatarUrl = cloudinaryData.secure_url;

    // Update user profile in Supabase using admin client (bypasses RLS)
    const adminClient = createAdminClient();
    if (adminClient) {
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({ 
          avatar_url: avatarUrl, 
          updated_at: new Date().toISOString() 
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        // Still return URL - client can retry update
      }
    } else {
      console.error("Admin client not available for profile update");
    }

    return NextResponse.json({ 
      success: true, 
      url: avatarUrl 
    });

  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
