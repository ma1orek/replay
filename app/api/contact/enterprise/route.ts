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
    
    // Send email to support (with reply_to so you can easily respond)
    console.log("[Contact API] Sending email to support@replay.build...");
    console.log("[Contact API] Form data:", { firstName, lastName, email, company, role, useCase, links });
    
    const supportEmailResult = await resend.emails.send({
      from: "Replay Contact Form <system@replay.build>",
      to: ["support@replay.build"],
      replyTo: email,
      subject: `🔔 New Contact: ${firstName} ${lastName} from ${company}`,
      text: `
NEW CONTACT FORM SUBMISSION
============================

Name: ${firstName} ${lastName}
Email: ${email}
Company: ${company}
Topic: ${role || "Not specified"}

MESSAGE:
${useCase || "No message provided"}

${links ? `Links: ${links}` : ""}

---
Reply directly to this email to respond to the user.
      `.trim(),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff;">
          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://auth.replay.build/storage/v1/object/public/f/logostan.png" alt="Replay" width="120" height="34" style="display: inline-block;" />
          </div>
          
          <div style="background: #161616; border: 1px solid #2a2a2a; border-radius: 12px; padding: 28px;">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <span style="background: #FF6E3C; width: 32px; height: 32px; border-radius: 8px; display: inline-block; text-align: center; line-height: 32px; font-size: 16px; margin-right: 12px;">📩</span>
              <h1 style="color: #FF6E3C; font-size: 18px; margin: 0; font-weight: 600;">New Contact Form Submission</h1>
            </div>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; color: #888; width: 80px; font-size: 13px;">Name</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; color: #fff; font-weight: 500;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size: 13px;">Email</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a;"><a href="mailto:${email}" style="color: #FF6E3C; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; color: #888; font-size: 13px;">Company</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #2a2a2a; color: #fff;">${company}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #888; font-size: 13px;">Topic</td>
                <td style="padding: 12px 0; color: #fff;">${role || "Not specified"}</td>
              </tr>
            </table>
            
            <div style="margin-top: 24px; background: rgba(255,110,60,0.08); padding: 16px; border-radius: 8px; border-left: 3px solid #FF6E3C;">
              <p style="color: #FF6E3C; margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">MESSAGE:</p>
              <p style="color: rgba(255,255,255,0.9); margin: 0; line-height: 1.6; white-space: pre-wrap; font-size: 14px;">${useCase || "No message provided"}</p>
            </div>
            
            ${links ? `
            <div style="margin-top: 16px;">
              <p style="color: #888; margin: 0 0 4px 0; font-size: 12px;">Links:</p>
              <p style="color: #FF6E3C; margin: 0; word-break: break-all; font-size: 13px;">${links}</p>
            </div>
            ` : ""}
          </div>
          
          <p style="text-align: center; color: #555; font-size: 11px; margin-top: 28px;">
            Replay — Behavior-Driven UI Rebuild
          </p>
        </div>
      `,
    });
    console.log("[Contact API] Support email result:", JSON.stringify(supportEmailResult, null, 2));
    
    // Check if there was an error sending to support
    if (supportEmailResult.error) {
      console.error("[Contact API] ERROR sending to support:", supportEmailResult.error);
      // Don't return error - still try to send user confirmation
    } else {
      console.log("[Contact API] ✅ Email sent to support, ID:", supportEmailResult.data?.id);
    }

    // Send confirmation to user
    console.log("[Contact API] Sending confirmation to user:", email);
    const userEmailResult = await resend.emails.send({
      from: "Replay <system@replay.build>",
      to: email,
      subject: "Thanks for reaching out — Replay",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff;">
          <!-- Logo -->
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="https://auth.replay.build/storage/v1/object/public/f/logostan.png" alt="Replay" width="120" height="34" style="display: inline-block;" />
          </div>
          
          <div style="background: #161616; border: 1px solid #2a2a2a; border-radius: 16px; padding: 40px 32px; text-align: center;">
            <div style="width: 56px; height: 56px; margin: 0 auto 24px; background: linear-gradient(135deg, #FF6E3C 0%, #FF8F5C 100%); border-radius: 50%; line-height: 56px; font-size: 28px; color: #fff;">✓</div>
            
            <h1 style="color: #fff; font-size: 26px; margin: 0 0 16px 0; font-weight: 600;">Thanks, ${firstName}!</h1>
            
            <p style="color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
              We've received your message and will get back to you within 48 hours.
            </p>
            
            <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 0;">
              In the meantime, feel free to explore Replay with our free tier.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 28px;">
            <a href="https://replay.build/tool" style="display: inline-block; background: linear-gradient(135deg, #FF6E3C 0%, #FF8F5C 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">
              Start Building →
            </a>
          </div>
          
          <p style="text-align: center; color: #555; font-size: 11px; margin-top: 32px;">
            Replay — Behavior-Driven UI Rebuild
          </p>
        </div>
      `,
    });
    console.log("[Contact API] User email result:", JSON.stringify(userEmailResult, null, 2));

    console.log("[Contact API] Both emails processed!");
    return NextResponse.json({ 
      success: true,
      supportEmailId: supportEmailResult?.data?.id,
      userEmailId: userEmailResult?.data?.id,
      supportError: supportEmailResult.error || null
    });
  } catch (error: any) {
    console.error("[Contact API] Error sending email:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
