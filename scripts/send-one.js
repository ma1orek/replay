const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        env[key.trim()] = value;
      }
    }
  });
  return env;
}

const env = loadEnv();
const email = 'sorriso7@o2.pl';

const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background-color:#0a0a0a;"><div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0a0a0a;color:#fff;"><div style="text-align:center;margin-bottom:40px;"><img src="https://auth.replay.build/storage/v1/object/public/f/logostan.png" alt="Replay" width="140" height="40"/></div><div style="background:linear-gradient(135deg,rgba(255,110,60,0.1) 0%,rgba(255,143,92,0.05) 100%);border:1px solid rgba(255,110,60,0.2);border-radius:16px;padding:32px;"><h1 style="color:#fff;font-size:24px;margin:0 0 20px;text-align:center;">Hey! 👋</h1><p style="color:rgba(255,255,255,0.85);font-size:16px;line-height:1.7;margin:0 0 20px;">I noticed you've already created a generation with Replay — that's awesome!</p><p style="color:rgba(255,255,255,0.85);font-size:16px;line-height:1.7;margin:0 0 28px;">I wanted to personally let you know about our new <strong style="color:#FF6E3C;">Starter</strong> plan:</p><div style="background:rgba(255,110,60,0.12);border-radius:12px;padding:24px;margin:0 0 28px;border:1px solid rgba(255,110,60,0.25);"><h2 style="color:#FF6E3C;font-size:24px;margin:0;font-weight:700;">Starter</h2><p style="color:rgba(255,255,255,0.55);font-size:14px;margin:6px 0 20px;">One-time purchase, no subscription</p><p style="color:rgba(255,255,255,0.9);font-size:15px;padding:8px 0;">✓ <strong>300 credits</strong> to use whenever you want</p><p style="color:rgba(255,255,255,0.9);font-size:15px;padding:8px 0;">✓ <strong>Export your code</strong> — download your generated UI</p><p style="color:rgba(255,255,255,0.9);font-size:15px;padding:8px 0;">✓ <strong>No subscription required</strong></p><p style="color:rgba(255,255,255,0.9);font-size:15px;padding:8px 0;">✓ Credits never expire</p></div><div style="text-align:center;"><a href="https://replay.build" style="display:inline-block;background:linear-gradient(135deg,#FF6E3C 0%,#FF8F5C 100%);color:#fff;text-decoration:none;padding:14px 36px;border-radius:8px;font-weight:600;font-size:16px;">Check it out →</a></div></div><div style="margin-top:36px;text-align:center;"><p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 8px;">Thanks for being an early user! 🙏</p><p style="color:rgba(255,255,255,0.6);font-size:15px;margin:0;font-weight:500;">— Bartosz, Founder of Replay</p></div></div></body></html>`;

fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + env.RESEND_API_KEY
  },
  body: JSON.stringify({
    from: 'Bartosz from Replay <bartosz@replay.build>',
    to: email,
    subject: "I saw you created a generation — here's something for you ✨",
    html: html
  })
}).then(r => r.json()).then(d => console.log('✅ Sent to', email, '- ID:', d.id || d));
