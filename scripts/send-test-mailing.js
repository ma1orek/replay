/**
 * Send test mailing email directly via Resend
 * 
 * Usage: node scripts/send-test-mailing.js
 * 
 * Reads RESEND_API_KEY from .env.local
 */

const fs = require('fs');
const path = require('path');

const testEmail = "idzikbartosz@gmail.com";

// Load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env.local not found");
    return {};
  }
  
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove surrounding quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key.trim()] = value;
      }
    }
  });
  
  return env;
}

// Email template
function getStarterEmailHtml() {
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
      
      <h1 style="color: #fff; font-size: 24px; margin: 0 0 20px 0; text-align: center;">Hey! 👋</h1>
      
      <p style="color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">
        I noticed you've already created a generation with Replay — that's awesome! I hope it's been helpful for your projects.
      </p>
      
      <p style="color: rgba(255,255,255,0.85); font-size: 16px; line-height: 1.7; margin: 0 0 28px 0;">
        I wanted to personally let you know about our new <strong style="color: #FF6E3C;">Starter</strong> plan:
      </p>
      
      <!-- Starter Box -->
      <div style="background: rgba(255,110,60,0.12); border-radius: 12px; padding: 24px; margin: 0 0 28px 0; border: 1px solid rgba(255,110,60,0.25);">
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #FF6E3C; font-size: 24px; margin: 0; font-weight: 700;">Starter</h2>
          <p style="color: rgba(255,255,255,0.55); font-size: 14px; margin: 6px 0 0 0;">One-time purchase, no subscription</p>
        </div>
        
        <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; color: rgba(255,255,255,0.9); font-size: 15px;">
              ✓ <strong>300 credits</strong> to use whenever you want
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: rgba(255,255,255,0.9); font-size: 15px;">
              ✓ <strong>Export your code</strong> — download your generated UI
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: rgba(255,255,255,0.9); font-size: 15px;">
              ✓ <strong>No subscription required</strong> — pay once, use your credits
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: rgba(255,255,255,0.9); font-size: 15px;">
              ✓ Credits never expire
            </td>
          </tr>
        </table>
      </div>
      
      <p style="color: rgba(255,255,255,0.75); font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
        It's perfect if you want to export your work and keep building without committing to a monthly plan.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center;">
        <a href="https://replay.build" style="display: inline-block; background: linear-gradient(135deg, #FF6E3C 0%, #FF8F5C 100%); color: #fff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Check it out →
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="margin-top: 36px; text-align: center;">
      <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0 0 8px 0;">
        Thanks for being an early user! 🙏
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

async function sendTestEmail() {
  const env = loadEnv();
  const apiKey = process.argv[2] || env.RESEND_API_KEY || process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error("❌ Missing Resend API key");
    console.log("   Make sure RESEND_API_KEY is set in .env.local");
    console.log("   Or pass it as argument: node scripts/send-test-mailing.js YOUR_API_KEY");
    process.exit(1);
  }
  
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log(`🔑 Using API key: ${apiKey.substring(0, 8)}...`);
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: 'Bartosz from Replay <bartosz@replay.build>',
        to: testEmail,
        subject: "I saw you created a generation — here's something for you ✨",
        html: getStarterEmailHtml()
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log("✅ Test email sent successfully!");
      console.log("   Email ID:", data.id);
    } else {
      console.error("❌ Failed to send email:");
      console.error("   Status:", response.status);
      console.error("   Response:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

sendTestEmail();
