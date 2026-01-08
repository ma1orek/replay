import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  return new Resend(apiKey);
}

// Generate a 6-digit verification code
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, action } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const resend = getResend();

    if (action === "send") {
      // Generate verification code
      const code = generateCode();
      
      // Store code in a cookie (expires in 10 minutes)
      const cookieStore = await cookies();
      cookieStore.set("verify_code", code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600, // 10 minutes
        path: "/",
      });
      cookieStore.set("verify_email", email, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
      });

      // Send email via Resend
      await resend.emails.send({
        from: "Replay <noreply@replay.build>",
        to: email,
        subject: "Verify your email - Replay",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff;">
            <div style="text-align: center; margin-bottom: 40px;">
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
              <svg width="24" height="32" viewBox="0 0 82 109" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M68.099 37.2285C78.1678 43.042 78.168 57.5753 68.099 63.3887L29.5092 85.668C15.6602 93.6633 0.510418 77.4704 9.40857 64.1836L17.4017 52.248C18.1877 51.0745 18.1876 49.5427 17.4017 48.3691L9.40857 36.4336C0.509989 23.1467 15.6602 6.95306 29.5092 14.9482L68.099 37.2285Z" stroke="#FF6E3C" stroke-width="8" stroke-linejoin="round"/>
                <rect x="34.054" y="98.6841" width="48.6555" height="8" rx="4" transform="rotate(-30 34.054 98.6841)" fill="#FF6E3C"/>
              </svg>
              <span style="font-size: 24px; font-weight: bold; color: #FF6E3C;">Replay</span>
            </div>
            </div>
            
            <div style="background: linear-gradient(135deg, rgba(255,110,60,0.1) 0%, rgba(255,143,92,0.05) 100%); border: 1px solid rgba(255,110,60,0.2); border-radius: 16px; padding: 32px; text-align: center;">
              <h1 style="color: #fff; font-size: 24px; margin: 0 0 16px 0;">Verify your email</h1>
              
              <p style="color: rgba(255,255,255,0.6); font-size: 16px; margin: 0 0 32px 0;">
                Enter this code in the app to verify your account:
              </p>
              
              <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin: 0 0 32px 0;">
                <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #FF6E3C;">${code}</span>
              </div>
              
              <p style="color: rgba(255,255,255,0.4); font-size: 14px; margin: 0;">
                This code expires in 10 minutes.
              </p>
            </div>
            
            <p style="text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 32px;">
              Replay — Behavior-Driven UI Rebuild
            </p>
          </div>
        `,
      });

      return NextResponse.json({ success: true, message: "Verification code sent" });
    } 
    
    if (action === "verify") {
      const { code } = body;
      
      if (!code) {
        return NextResponse.json({ error: "Code required" }, { status: 400 });
      }

      const cookieStore = await cookies();
      const storedCode = cookieStore.get("verify_code")?.value;
      const storedEmail = cookieStore.get("verify_email")?.value;

      if (!storedCode || !storedEmail) {
        return NextResponse.json({ error: "Verification expired. Please request a new code." }, { status: 400 });
      }

      if (storedEmail !== email) {
        return NextResponse.json({ error: "Email mismatch" }, { status: 400 });
      }

      if (storedCode !== code) {
        return NextResponse.json({ error: "Invalid code" }, { status: 400 });
      }

      // Code is correct - clear cookies
      cookieStore.delete("verify_code");
      cookieStore.delete("verify_email");

      // Mark email as verified in Supabase (update user metadata)
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.auth.updateUser({
          data: { email_verified: true }
        });
      }

      return NextResponse.json({ success: true, verified: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Email verification error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

