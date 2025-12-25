# Replay

**Rebuild UI from Video. Instantly.**

Turn any video into a clean, production-ready UI — code, structure, interactions and style included.

---

## 🚀 Deploy to Vercel (Recommended)

### Step 1: Fork/Clone Repository

```bash
git clone https://github.com/yourusername/replay.git
cd replay
```

### Step 2: Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   - Copy contents of `supabase/migrations/001_initial_schema.sql`
   - Paste and run in SQL Editor

3. Enable Google OAuth:
   - Go to **Authentication** → **Providers** → **Google**
   - Add your Google OAuth credentials from [Google Cloud Console](https://console.cloud.google.com)

4. Get your keys from **Settings** → **API**

### Step 3: Setup Stripe

1. Create products in [Stripe Dashboard](https://dashboard.stripe.com/products):

| Product | Price | Type |
|---------|-------|------|
| Pro Monthly | $35/month | Subscription |
| Pro Yearly | $315/year | Subscription |
| Agency Monthly | $99/month | Subscription |
| Agency Yearly | $891/year | Subscription |
| Top-up 2000 | $20 | One-time |
| Top-up 5500 | $50 | One-time |
| Top-up 12000 | $100 | One-time |

2. Note all **Price IDs** (start with `price_`)

### Step 4: Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/replay)

Or manually:

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Add environment variables (see below)
5. Deploy!

### Step 5: Add Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID_MONTHLY=price_...
STRIPE_PRO_PRICE_ID_YEARLY=price_...
STRIPE_AGENCY_PRICE_ID_MONTHLY=price_...
STRIPE_AGENCY_PRICE_ID_YEARLY=price_...
STRIPE_TOPUP_20_PRICE_ID=price_...
STRIPE_TOPUP_50_PRICE_ID=price_...
STRIPE_TOPUP_100_PRICE_ID=price_...

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# App URL (your Vercel domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Step 6: Configure Stripe Webhook

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Create endpoint: `https://your-app.vercel.app/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. Copy **Signing secret** to `STRIPE_WEBHOOK_SECRET`

### Step 7: Configure Supabase Auth

1. Go to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**: `https://your-app.vercel.app/auth/callback`
4. Update Google OAuth redirect URI in Google Cloud Console

---

## 🛠 Local Development

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) account
- [Stripe](https://stripe.com) account
- [Google AI Studio](https://aistudio.google.com) API key

### Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp env.example .env.local
```

3. Fill in your values in `.env.local`

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### For Stripe webhooks locally:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 🌐 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/replay)

### Manual Deploy

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy!

### Post-Deploy

1. Update Stripe webhook URL to your Vercel domain
2. Update Supabase Auth redirect URLs:
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/auth/callback`
3. Update Google OAuth redirect URI

## 📁 Project Structure

```
replay/
├── app/
│   ├── api/
│   │   ├── credits/
│   │   └── stripe/
│   ├── auth/
│   ├── landing/
│   ├── settings/
│   ├── layout.tsx
│   ├── page.tsx          # Tool
│   └── providers.tsx
├── components/
│   ├── modals/
│   └── ...
├── lib/
│   ├── auth/
│   ├── credits/
│   ├── supabase/
│   ├── stripe.ts
│   └── utils.ts
├── actions/
│   └── transmute.ts      # AI generation
├── supabase/
│   └── migrations/
└── public/
```

## 💰 Pricing Model

| Plan | Price | Credits/Month | Rollover |
|------|-------|---------------|----------|
| Free | $0 | 150 | — |
| Pro | $35/mo | 3,000 | 600 |
| Agency | $99/mo | 10,000 | 2,000 |

**Credit Costs:**
- Generate from video: 75 credits
- AI edit/refine: 10 credits

**Top-ups:**
- $20 → 2,000 credits
- $50 → 5,500 credits (Best value)
- $100 → 12,000 credits

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Server-side credit spending with atomic transactions
- Webhook signature verification for Stripe
- Service role key only used server-side

## 📝 License

MIT License - see [LICENSE](LICENSE)

---

Built with ❤️ using Next.js, Supabase, Stripe, and Gemini AI.
