import { NextRequest, NextResponse } from "next/server";
import { editCodeWithAI } from "@/actions/transmute";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for AI edit with images

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentCode, editRequest, images, databaseContext, isPlanMode, chatHistory } = body;

    if (!currentCode || !editRequest) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: currentCode, editRequest" },
        { status: 400 }
      );
    }

    console.log("[API /edit-code] Starting edit with:", {
      codeLength: currentCode.length,
      editRequest: editRequest.substring(0, 100),
      imagesCount: images?.length || 0,
      isPlanMode,
      hasDbContext: !!databaseContext,
      chatHistoryLength: chatHistory?.length || 0,
    });

    const result = await editCodeWithAI(
      currentCode,
      editRequest,
      images,
      databaseContext,
      isPlanMode,
      chatHistory
    );

    console.log("[API /edit-code] Result:", {
      success: result.success,
      codeLength: result.code?.length || 0,
      error: result.error,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[API /edit-code] Error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      },
      { status: 500 }
    );
  }
}





