import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  return new Resend(apiKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, company, role, useCase, links } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !company) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const resend = getResend();
    
    // Send email to support
    await resend.emails.send({
      from: "Replay <noreply@replay.build>",
      to: "support@replay.build",
      subject: `Enterprise inquiry — ${company} — ${firstName} ${lastName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff;">
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="https://replay.build/logo.png" alt="Replay" style="height: 32px;" />
          </div>
          
          <div style="background: linear-gradient(135deg, rgba(255,110,60,0.1) 0%, rgba(255,143,92,0.05) 100%); border: 1px solid rgba(255,110,60,0.2); border-radius: 16px; padding: 32px;">
            <h1 style="color: #FF6E3C; font-size: 24px; margin: 0 0 24px 0;">New Enterprise Inquiry</h1>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); width: 120px;">Name</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #fff;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);">Email</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);"><a href="mailto:${email}" style="color: #FF6E3C;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);">Company</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #fff;">${company}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.5);">Role</td>
                <td style="padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1); color: #fff;">${role || "Not specified"}</td>
              </tr>
            </table>
            
            <div style="margin-top: 24px;">
              <p style="color: rgba(255,255,255,0.5); margin: 0 0 8px 0; font-size: 14px;">What are they rebuilding?</p>
              <p style="color: #fff; margin: 0; line-height: 1.6;">${useCase || "Not specified"}</p>
            </div>
            
            ${links ? `
            <div style="margin-top: 24px;">
              <p style="color: rgba(255,255,255,0.5); margin: 0 0 8px 0; font-size: 14px;">Links</p>
              <p style="color: #FF6E3C; margin: 0; word-break: break-all;">${links}</p>
            </div>
            ` : ""}
          </div>
          
          <p style="text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 32px;">
            Replay — Behavior-Driven UI Rebuild
          </p>
        </div>
      `,
    });

    // Send confirmation to user
    await resend.emails.send({
      from: "Replay <noreply@replay.build>",
      to: email,
      subject: "Thanks for reaching out — Replay Enterprise",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff;">
          <div style="text-align: center; margin-bottom: 40px;">
            <img src="https://replay.build/logo.png" alt="Replay" style="height: 32px;" />
          </div>
          
          <div style="background: linear-gradient(135deg, rgba(255,110,60,0.1) 0%, rgba(255,143,92,0.05) 100%); border: 1px solid rgba(255,110,60,0.2); border-radius: 16px; padding: 32px; text-align: center;">
            <div style="width: 64px; height: 64px; margin: 0 auto 24px; background: linear-gradient(135deg, #FF6E3C 0%, #FF8F5C 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px;">✓</span>
            </div>
            
            <h1 style="color: #fff; font-size: 28px; margin: 0 0 16px 0;">Thanks, ${firstName}!</h1>
            
            <p style="color: rgba(255,255,255,0.7); font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
              We've received your Enterprise inquiry and will get back to you within 48 hours.
            </p>
            
            <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">
              In the meantime, feel free to explore Replay with our free tier — 150 credits included.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="https://replay.build/tool" style="display: inline-block; background: linear-gradient(135deg, #FF6E3C 0%, #FF8F5C 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600;">
              Start Building →
            </a>
          </div>
          
          <p style="text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 32px;">
            Replay — Behavior-Driven UI Rebuild
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Contact error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

