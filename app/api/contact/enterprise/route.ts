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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #111; color: #fff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #FF6E3C; font-size: 28px; margin: 0; font-weight: bold;">Replay</h2>
          </div>
          
          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 24px;">
            <h1 style="color: #FF6E3C; font-size: 20px; margin: 0 0 20px 0;">📩 New Contact Form Submission</h1>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #888; width: 100px;">Name</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #fff;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #888;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333;"><a href="mailto:${email}" style="color: #FF6E3C;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #888;">Company</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #fff;">${company}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #888;">Topic</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #333; color: #fff;">${role || "Not specified"}</td>
              </tr>
            </table>
            
            <div style="margin-top: 20px; background: #222; padding: 16px; border-radius: 8px; border-left: 3px solid #FF6E3C;">
              <p style="color: #FF6E3C; margin: 0 0 8px 0; font-size: 13px; font-weight: bold;">MESSAGE:</p>
              <p style="color: #fff; margin: 0; line-height: 1.6; white-space: pre-wrap;">${useCase || "No message provided"}</p>
            </div>
            
            ${links ? `
            <div style="margin-top: 16px;">
              <p style="color: #888; margin: 0 0 4px 0; font-size: 13px;">Links:</p>
              <p style="color: #FF6E3C; margin: 0; word-break: break-all;">${links}</p>
            </div>
            ` : ""}
          </div>
          
          <p style="text-align: center; color: #666; font-size: 11px; margin-top: 24px;">
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
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #111; color: #fff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #FF6E3C; font-size: 28px; margin: 0; font-weight: bold;">Replay</h2>
          </div>
          
          <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 32px; text-align: center;">
            <div style="width: 48px; height: 48px; margin: 0 auto 20px; background: #FF6E3C; border-radius: 50%; line-height: 48px; font-size: 24px; color: #fff;">✓</div>
            
            <h1 style="color: #fff; font-size: 24px; margin: 0 0 12px 0;">Thanks, ${firstName}!</h1>
            
            <p style="color: #aaa; font-size: 15px; line-height: 1.5; margin: 0 0 20px 0;">
              We've received your message and will get back to you within 48 hours.
            </p>
            
            <p style="color: #666; font-size: 13px; margin: 0;">
              In the meantime, feel free to explore Replay with our free tier.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 24px;">
            <a href="https://replay.build" style="display: inline-block; background: #FF6E3C; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Start Building →
            </a>
          </div>
          
          <p style="text-align: center; color: #666; font-size: 11px; margin-top: 24px;">
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
