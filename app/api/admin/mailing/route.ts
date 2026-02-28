import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";

// Admin credentials from environment
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET;

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }
  return new Resend(apiKey);
}

// Verify admin token (base64 encoded email:password)
function verifyAdminToken(token: string): { valid: boolean; email?: string } {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [email, password] = decoded.split(':');
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return { valid: true, email };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}

// Create admin Supabase client
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return null;
  }
  
  return createClient(url, key);
}

// Email template for new pricing announcement
function getPricingEmailHtml() {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a;">
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0a0a0a; color: #fff;">

    <!-- Logo -->
    <div style="text-align: center; margin-bottom: 40px;">
      <img src="https://auth.replay.build/storage/v1/object/public/f/logostan.png" alt="Replay" width="140" height="40" style="display: inline-block;" />
    </div>

    <!-- Main Content Card -->
    <div style="background: linear-gradient(135deg, rgba(255,110,60,0.1) 0%, rgba(255,143,92,0.05) 100%); border: 1px solid rgba(255,110,60,0.2); border-radius: 16px; padding: 32px;">

      <h1 style="color: #fff; font-size: 24px; margin: 0 0 20px 0; text-align: center;">We dropped our prices</h1>

      <p style="color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
        Hey! After listening to your feedback, we've made Replay significantly more accessible. Our new pricing is live today:
      </p>

      <!-- Pro Box -->
      <div style="background: rgba(255,110,60,0.12); border-radius: 12px; padding: 24px; margin: 0 0 16px 0; border: 1px solid rgba(255,110,60,0.25);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="color: #FF6E3C; font-size: 22px; margin: 0; font-weight: 700;">Pro</h2>
          <div style="text-align: right;">
            <span style="color: rgba(255,255,255,0.4); font-size: 14px; text-decoration: line-through;">$149/mo</span>
            <span style="color: #fff; font-size: 24px; font-weight: 700; margin-left: 8px;">$19/mo</span>
          </div>
        </div>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.9); font-size: 14px;">&#10003; 1,500 credits/month</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.9); font-size: 14px;">&#10003; Unlimited projects</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.9); font-size: 14px;">&#10003; React + Tailwind export</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.9); font-size: 14px;">&#10003; Flow Map, Design System, AI Editor</td></tr>
        </table>
      </div>

      <!-- Agency Box -->
      <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 24px; margin: 0 0 28px 0; border: 1px solid rgba(255,255,255,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h2 style="color: #fff; font-size: 22px; margin: 0; font-weight: 700;">Agency</h2>
          <div style="text-align: right;">
            <span style="color: rgba(255,255,255,0.4); font-size: 14px; text-decoration: line-through;">$499/mo</span>
            <span style="color: #fff; font-size: 24px; font-weight: 700; margin-left: 8px;">$99/mo</span>
          </div>
        </div>
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.9); font-size: 14px;">&#10003; 15,000 credits/month</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.9); font-size: 14px;">&#10003; 5 team members</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.9); font-size: 14px;">&#10003; Shared Design System</td></tr>
          <tr><td style="padding: 6px 0; color: rgba(255,255,255,0.9); font-size: 14px;">&#10003; Priority GPU processing</td></tr>
        </table>
      </div>

      <p style="color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
        Same AI that turns video recordings into production React code. Same Design System extraction, Flow Maps, and visual editor. Just a lot more affordable.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="https://replay.build/pricing" style="display: inline-block; background: linear-gradient(135deg, #FF6E3C 0%, #FF8F5C 100%); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          See new pricing →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 36px; text-align: center;">
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 8px 0;">
        Thanks for being part of Replay!
      </p>
      <p style="color: rgba(255,255,255,0.6); font-size: 15px; margin: 0; font-weight: 500;">
        — Bartosz, Founder of Replay
      </p>
    </div>

    <p style="text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; margin-top: 36px;">
      Replay — Rebuild UI from Video. Instantly.
    </p>

    <p style="text-align: center; color: rgba(255,255,255,0.2); font-size: 11px; margin-top: 16px;">
      You're receiving this because you signed up for Replay.<br/>
      <a href="https://replay.build" style="color: rgba(255,255,255,0.35);">replay.build</a>
    </p>
  </div>
</body>
</html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { valid } = verifyAdminToken(token);
    if (!valid) {
      return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
    }

    const body = await request.json();
    const { mode, testEmail } = body;

    const resend = getResend();

    // Test mode - send to single email
    if (mode === "test") {
      if (!testEmail) {
        return NextResponse.json({ error: "testEmail is required for test mode" }, { status: 400 });
      }

      const result = await resend.emails.send({
        from: "Bartosz from Replay <bartosz@replay.build>",
        to: testEmail,
        subject: "We dropped our prices — Pro is now $19/mo",
        html: getPricingEmailHtml(),
      });

      if (result.error) {
        console.error("[Mailing] Error sending test email:", result.error);
        return NextResponse.json({ error: result.error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        mode: "test",
        emailId: result.data?.id,
        sentTo: testEmail
      });
    }

    // Bulk mode - send to all users with generations
    if (mode === "bulk") {
      const adminSupabase = createAdminClient();
      if (!adminSupabase) {
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
      }

      // Get all users from auth
      const userEmails: string[] = [];
      let page = 1;
      const perPage = 1000;
      while (true) {
        const { data: { users }, error: listError } = await adminSupabase.auth.admin.listUsers({ page, perPage });
        if (listError || !users || users.length === 0) break;
        for (const u of users) {
          if (u.email) userEmails.push(u.email);
        }
        if (users.length < perPage) break;
        page++;
      }

      console.log(`[Mailing] Found ${userEmails.length} user emails`);

      // Send emails (with rate limiting - Resend has limits)
      const results: { email: string; success: boolean; error?: string; id?: string }[] = [];
      
      for (const email of userEmails) {
        try {
          const result = await resend.emails.send({
            from: "Bartosz from Replay <bartosz@replay.build>",
            to: email,
            subject: "We dropped our prices — Pro is now $19/mo",
            html: getPricingEmailHtml(),
          });

          if (result.error) {
            results.push({ email, success: false, error: result.error.message });
          } else {
            results.push({ email, success: true, id: result.data?.id });
          }

          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (err: any) {
          results.push({ email, success: false, error: err.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return NextResponse.json({
        success: true,
        mode: "bulk",
        totalUsers: userEmails.length,
        sent: successCount,
        failed: failCount,
        results
      });
    }

    return NextResponse.json({ error: "Invalid mode. Use 'test' or 'bulk'" }, { status: 400 });

  } catch (error: any) {
    console.error("[Mailing] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send emails" }, { status: 500 });
  }
}

// GET - Preview email or get stats
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const { valid } = verifyAdminToken(token);
    if (!valid) {
      return NextResponse.json({ error: "Invalid admin token" }, { status: 401 });
    }

    const adminSupabase = createAdminClient();
    if (!adminSupabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Get all users
    const users: { id: string; email: string }[] = [];
    let page = 1;
    const perPage = 1000;
    while (true) {
      const { data: { users: batch }, error: listError } = await adminSupabase.auth.admin.listUsers({ page, perPage });
      if (listError || !batch || batch.length === 0) break;
      for (const u of batch) {
        if (u.email) users.push({ id: u.id, email: u.email });
      }
      if (batch.length < perPage) break;
      page++;
    }

    return NextResponse.json({
      totalUsers: users.length,
      users,
      emailPreview: getPricingEmailHtml()
    });

  } catch (error: any) {
    console.error("[Mailing] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
