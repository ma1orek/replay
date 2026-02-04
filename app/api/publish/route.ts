import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/lib/supabase/server";

// Generate a URL-safe slug from title
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Multiple hyphens to single
    .slice(0, 50) // Max length
    .replace(/^-|-$/g, ""); // Trim hyphens
  
  // Add random suffix for uniqueness
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base}-${suffix}`;
}

// Generate SEO description from code content
function generateDescription(code: string, title: string): string {
  // Extract text content from code for description
  const textMatches = code.match(/>([^<]{10,100})</g) || [];
  const texts = textMatches
    .map(m => m.replace(/^>|<$/g, "").trim())
    .filter(t => t.length > 20 && !t.includes("{") && !t.includes("className"))
    .slice(0, 3);
  
  if (texts.length > 0) {
    return `${title} - ${texts.join(". ").slice(0, 150)}...`;
  }
  
  return `${title} - UI rebuilt with Replay. Transform screen recordings into production-ready code.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, title, thumbnailDataUrl, existingSlug, libraryData } = body;

    if (!code || !title) {
      return NextResponse.json(
        { error: "Code and title are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    
    // Get current user (optional - allow anonymous publishing)
    const { data: { user } } = await supabase.auth.getUser();

    // Generate description
    const description = generateDescription(code, title);

    // Upload thumbnail if provided
    let thumbnailUrl: string | null = null;
    const slugForThumbnail = existingSlug || generateSlug(title);
    if (thumbnailDataUrl && thumbnailDataUrl.startsWith("data:image")) {
      try {
        // Convert data URL to blob
        const base64Data = thumbnailDataUrl.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const fileName = `${slugForThumbnail}.png`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("thumbnails")
          .upload(fileName, buffer, {
            contentType: "image/png",
            upsert: true,
          });
        
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from("thumbnails")
            .getPublicUrl(fileName);
          thumbnailUrl = publicUrl;
        }
      } catch (e) {
        console.error("Thumbnail upload error:", e);
      }
    }

    // If existing slug provided, update instead of create
    if (existingSlug) {
      console.log('[publish] Attempting to update existing slug:', existingSlug);
      
      // Try admin client first (bypasses RLS), fallback to regular client
      const adminSupabase = createAdminClient();
      const updateClient = adminSupabase || supabase;
      
      // First check if the record exists
      const { data: existingRecord, error: checkError } = await updateClient
        .from("published_projects")
        .select("id, slug, user_id")
        .eq("slug", existingSlug)
        .single();
      
      console.log('[publish] Existing record check:', existingRecord, checkError?.message);
      
      if (existingRecord) {
        // Record exists, update it
        console.log('[publish] Updating record, code length:', code.length);
        
        const { data, error } = await updateClient
          .from("published_projects")
          .update({
            title,
            description,
            code,
            library_data: libraryData || null,
            thumbnail_url: thumbnailUrl || existingRecord.thumbnail_url,
            updated_at: new Date().toISOString(),
          })
          .eq("slug", existingSlug)
          .select()
          .single();

        if (error) {
          console.error("Database update error:", error);
          
          // Try with admin client if regular client failed
          if (updateClient === supabase && adminSupabase) {
            console.log('[publish] Retrying with admin client...');
            const { data: retryData, error: retryError } = await adminSupabase
              .from("published_projects")
              .update({
                title,
                description,
                code,
                library_data: libraryData || null,
                thumbnail_url: thumbnailUrl || existingRecord.thumbnail_url,
                updated_at: new Date().toISOString(),
              })
              .eq("slug", existingSlug)
              .select()
              .single();
            
            if (retryError) {
              console.error("Admin update also failed:", retryError);
              return NextResponse.json({
                error: "Failed to update project: " + retryError.message,
              }, { status: 500 });
            }
            console.log('[publish] Admin update succeeded');
          } else {
            return NextResponse.json({
              error: "Failed to update project: " + error.message,
            }, { status: 500 });
          }
        } else {
          console.log('[publish] Successfully updated existing project, new code length:', data?.code?.length);
        }
        
        return NextResponse.json({
          success: true,
          slug: existingSlug,
          url: `https://www.replay.build/p/${existingSlug}`,
          updated: true,
        });
      } else {
        console.log('[publish] No existing record found for slug, will create new');
      }
    }

    // Generate new slug for new publish
    const slug = generateSlug(title);

    // Insert into database
    const { data, error } = await supabase
      .from("published_projects")
      .insert({
        slug,
        title,
        description,
        code,
        library_data: libraryData || null,
        thumbnail_url: thumbnailUrl,
        user_id: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      
      // If slug collision, try again with new slug
      if (error.code === "23505") {
        const newSlug = generateSlug(title);
        const { data: retryData, error: retryError } = await supabase
          .from("published_projects")
          .insert({
            slug: newSlug,
            title,
            description,
            code,
            library_data: libraryData || null,
            thumbnail_url: thumbnailUrl,
            user_id: user?.id || null,
          })
          .select()
          .single();
        
        if (retryError) {
          return NextResponse.json(
            { error: "Failed to publish project" },
            { status: 500 }
          );
        }
        
        return NextResponse.json({
          success: true,
          slug: newSlug,
          url: `https://www.replay.build/p/${newSlug}`,
        });
      }
      
      return NextResponse.json(
        { error: "Failed to publish project" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      slug,
      url: `https://www.replay.build/p/${slug}`,
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

