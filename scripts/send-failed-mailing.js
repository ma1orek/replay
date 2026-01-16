/**
 * Send mailing to failed emails from the first batch
 */

const fs = require('fs');
const path = require('path');

const failedEmails = [
  "bgmi4644646@gmail.com",
  "patrick.blanks82@gmail.com",
  "shekharmanisha862@gmail.com",
  "izabelakrol.design@gmail.com",
  "idzik321@gmail.com",
  "renato.maceira@gmail.com",
  "iuse428@gmail.com",
  "mubeenkhan645@gmail.com",
  "idzikanet@gmail.com",
  "monu250305@gmail.com",
  "officialtarunkumar85@gmail.com",
  "k.pelcer@useme.com",
  "bpith1vqco@illubd.com",
  "solutionsdirex@gmail.com",
  "luxianbvc@outlook.com",
  "bartosz.idzik@tasteray.com",
  "jasnoch.emilia@gmail.com",
  "marek.codex@gmail.com",
  "testmailing2024@gmail.com",
  "nwnfdel4ad@mrotzis.com",
  "isallopesbel@gmail.com",
  "shyan12@gmail.com",
  "antonia@theresanaiforthat.com",
  "tupragu@gmail.com",
  "autopompa1@gmail.com",
  "mike@wavesdesign.io",
  "mr.chaosu@gmail.com",
  "polbaragh2014@gmail.com",
  "thugbhai86@gmail.com",
  "m.gastol@telemedi.com",
  "sorriso7@o2.pl",
  "chadrickert1@gmail.com",
  "zelkaziom@gmail.com",
  "swetaispat@gmail.com",
  "bieniekdamian97@gmail.com",
  "iszakrol2001@gmail.com",
  "maciej.wojda@tasteray.com",
  "maxduchesne30@gmail.com",
  "projecthub.help@gmail.com",
  "peanutsquaredev@gmail.com",
  "subhajitnandy845@gmail.com",
  "monu250303@gmail.com",
  "vladiulian1970@gmail.com",
  "shortaction69@gmail.com",
  "paulus88@duck.com"
];

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendFailedMailing() {
  const env = loadEnv();
  const resendApiKey = env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.error("❌ Missing RESEND_API_KEY in .env.local");
    process.exit(1);
  }
  
  console.log(`📤 Sending to ${failedEmails.length} previously failed emails...\n`);
  
  const results = { success: 0, failed: 0, errors: [] };
  
  for (let i = 0; i < failedEmails.length; i++) {
    const email = failedEmails[i];
    
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'Bartosz from Replay <bartosz@replay.build>',
          to: email,
          subject: "I saw you created a generation — here's something for you ✨",
          html: getStarterEmailHtml()
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        results.success++;
        console.log(`   ✅ ${i + 1}/${failedEmails.length} - ${email}`);
      } else {
        results.failed++;
        results.errors.push({ email, error: data });
        console.log(`   ❌ ${i + 1}/${failedEmails.length} - ${email}: ${data.message || 'Unknown error'}`);
      }
      
      // Rate limiting - wait 600ms between emails (Resend allows 2 req/sec)
      await sleep(600);
      
    } catch (error) {
      results.failed++;
      results.errors.push({ email, error: error.message });
      console.log(`   ❌ ${i + 1}/${failedEmails.length} - ${email}: ${error.message}`);
    }
  }
  
  console.log("\n" + "=".repeat(50));
  console.log(`📊 RESULTS:`);
  console.log(`   ✅ Sent: ${results.success}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  console.log("=".repeat(50));
  
  if (results.errors.length > 0) {
    console.log("\n❌ Errors:");
    results.errors.forEach(e => console.log(`   - ${e.email}: ${JSON.stringify(e.error)}`));
  }
}

sendFailedMailing().catch(console.error);
