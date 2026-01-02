import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for video processing (HEVC can be slow)

// Server-side upload with transformation - handles video conversion properly
export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error("Cloudinary not configured");
      return NextResponse.json({ error: "Video processing service not configured" }, { status: 503 });
    }

    console.log("=== Cloudinary Server Upload Started ===");
    
    // Get the video file from the request
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    console.log("Received file:", file.name, "size:", file.size, "type:", file.type);
    
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    console.log("Buffer size:", buffer.length);
    
    // Upload to Cloudinary with EAGER transformation (waits for conversion)
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "video",
          folder: "replay-videos",
          // Eager transformation - converts to MP4 H.264 synchronously
          eager: [
            { 
              format: "mp4",
              video_codec: "h264",
              height: 720,
              crop: "scale",
              quality: "auto"
            }
          ],
          eager_async: false, // Wait for transformation to complete!
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            console.log("Cloudinary upload success:", result?.public_id);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(buffer);
    });
    
    console.log("Upload result:", {
      public_id: result.public_id,
      format: result.format,
      eager: result.eager,
    });
    
    // Get the transformed URL (MP4 H.264)
    let videoUrl: string;
    
    if (result.eager && result.eager[0]?.secure_url) {
      // Use the eager transformation URL
      videoUrl = result.eager[0].secure_url;
      console.log("Using eager transformation URL:", videoUrl);
    } else {
      // Fallback: construct URL manually
      videoUrl = cloudinary.url(result.public_id, {
        resource_type: "video",
        format: "mp4",
        video_codec: "h264",
        transformation: [{ height: 720, crop: "scale" }],
        secure: true,
      });
      console.log("Using constructed URL:", videoUrl);
    }
    
    console.log("=== Cloudinary Upload Complete ===");
    console.log("Final video URL:", videoUrl);
    
    return NextResponse.json({ 
      success: true,
      videoUrl,
      originalUrl: result.secure_url,
      publicId: result.public_id,
    });
    
  } catch (error: any) {
    console.error("Cloudinary server upload error:", error);
    return NextResponse.json(
      { error: error.message || "Video conversion failed" },
      { status: 500 }
    );
  }
}

// Keep GET for backwards compatibility
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const publicId = searchParams.get("publicId");

  if (!publicId) {
    return NextResponse.json({ error: "Public ID required" }, { status: 400 });
  }

  const videoUrl = cloudinary.url(publicId, {
    resource_type: "video",
    format: "mp4",
    video_codec: "h264",
    transformation: [{ height: 720, crop: "scale" }],
    secure: true,
  });

  return NextResponse.json({ videoUrl });
}
