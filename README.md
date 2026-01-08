# 🎬 Replay

<div align="center">

![Replay Logo](public/og-image.png)

### **Rebuild UI from Video. Instantly.**

Turn any screen recording into production-ready UI code.  
Code, structure, interactions, and style — rebuilt from what actually happens on screen.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-replay.build-FF6E3C?style=for-the-badge)](https://replay.build)
[![Documentation](https://img.shields.io/badge/Docs-replay.build%2Fdocs-blue?style=for-the-badge)](https://replay.build/docs)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)

</div>

---

## ✨ The Problem

Designers create beautiful prototypes. Developers spend **hours** recreating them in code.  
Reference videos exist. But translating them to actual UI is manual, slow, and error-prone.

**What if you could just show the AI what you want?**

## 🚀 The Solution

**Replay watches your video and writes the code.**

1. **Record or upload** any UI video — product demos, competitor apps, Figma prototypes
2. **AI analyzes** the visual timeline: layouts, interactions, hover states, navigation
3. **Get clean code** — HTML/CSS/JS with proper structure, responsive design, and animations
4. **Edit with AI** — refine the output naturally: "make the header sticky" or "add dark mode"
5. **Deploy instantly** — one-click publish to the web

---

## 🎯 Key Features

### 🎥 Video to UI Generation
Drop any screen recording and get a complete, working UI. Replay understands:
- **Layout structure** — headers, sidebars, grids, cards
- **Interactions** — hover states, clicks, modals, dropdowns
- **Navigation flows** — multi-page apps with proper routing
- **Visual design** — colors, typography, spacing, shadows

### ✨ Edit with AI
Natural language editing that actually works:
```
"Add a contact form to the About page"
"Make this mobile responsive"  
"Change the color scheme to dark mode"
"Connect this to my Supabase database"
"@Pricing Create a pricing page with 3 tiers"
```

After each edit, AI explains what changes it made in the chat — no need to diff code manually.

### 🎨 30+ Style Presets
Transform any UI into different aesthetics instantly:
- **Spatial Glass** — Apple Vision Pro inspired
- **Kinetic Brutalism** — Bold, aggressive typography
- **Neo-Retro OS** — Windows 95 meets cyberpunk
- **Dark Cosmos** — Premium glassmorphism
- Or upload a **reference image** — "Make it look like this"

### 🗺️ Flow Map
Visual map of all pages and navigation paths. Click any node to:
- Preview that page
- View/edit the code
- Generate new connected pages

### 🔗 Supabase Integration
Connect your database and AI generates **real data-fetching code**:
1. Add your Supabase credentials in Project Settings
2. AI sees your table schemas
3. Generated code uses actual table/column names
4. No mock data — real queries from the start

### 📊 Analytics Dashboard
Track your usage per project:
- Generations count
- AI edits made
- Code exports
- Token consumption

### 🚀 One-Click Publish
Deploy your UI to the web instantly. Share the link with anyone.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **AI** | Google Gemini 2.5 Flash / Gemini 3 Pro |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Google OAuth) |
| **Payments** | Stripe (Subscriptions + One-time) |
| **Hosting** | Vercel |
| **Animations** | Framer Motion |

---

## 💰 Pricing

| Plan | Price | Credits/Month | Best For |
|------|-------|---------------|----------|
| **Free** | $0 | 150 | Getting started |
| **Pro** | $35/mo | 3,000 | Creators & indie hackers |
| **Enterprise** | Custom | Unlimited | Teams & agencies |

**Credit Costs:**
- 🎬 Video generation: **75 credits**
- ✨ AI edit/refine: **3 credits**

**Top-ups available:**
- $20 → 2,000 credits
- $50 → 5,500 credits *(Best value)*
- $100 → 12,000 credits

---

## 🚀 Quick Start

### Option 1: Use the Live App
👉 **[replay.build](https://replay.build)**

### Option 2: Self-Host

#### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account  
- Google AI Studio API key (Gemini)

#### 1. Clone & Install

```bash
git clone https://github.com/ma1orek/replay.git
cd replay
npm install
```

#### 2. Setup Environment

```bash
cp env.example .env.local
```

Fill in your `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID_MONTHLY=price_...
STRIPE_PRO_PRICE_ID_YEARLY=price_...
STRIPE_TOPUP_20_PRICE_ID=price_...
STRIPE_TOPUP_50_PRICE_ID=price_...
STRIPE_TOPUP_100_PRICE_ID=price_...

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 3. Setup Supabase

Run the migration in Supabase SQL Editor:
```sql
-- See supabase/migrations/001_initial_schema.sql
```

Enable Google OAuth in Authentication → Providers.

#### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
replay/
├── app/
│   ├── api/              # API routes
│   │   ├── credits/      # Credit management
│   │   ├── publish/      # Deployment endpoint
│   │   ├── stripe/       # Payment webhooks
│   │   └── transmute/    # AI generation
│   ├── auth/             # Auth callbacks
│   ├── docs/             # Documentation pages
│   ├── landing/          # Marketing page
│   ├── settings/         # User settings
│   ├── terms/            # Legal pages
│   ├── page.tsx          # Main tool (6000+ lines)
│   └── layout.tsx        # Root layout
├── actions/
│   └── transmute.ts      # Core AI logic (Gemini prompts)
├── components/
│   ├── modals/           # Auth, credits modals
│   ├── Avatar.tsx
│   ├── Logo.tsx
│   ├── ProjectSettingsModal.tsx
│   └── StyleInjector.tsx # 30+ style presets
├── lib/
│   ├── auth/             # Auth context
│   ├── credits/          # Credits context  
│   ├── profile/          # Profile context
│   ├── supabase/         # Supabase clients + schema fetching
│   └── utils.ts          # Helpers
├── public/
│   ├── og-image.png      # Social preview
│   └── ShowcaseReplay.mp4
└── supabase/
    └── migrations/       # Database schema
```

---

## 🔒 Security

- ✅ Row Level Security (RLS) on all Supabase tables
- ✅ Server-side credit transactions (atomic)
- ✅ Stripe webhook signature verification
- ✅ Service role keys only on server
- ✅ Supabase credentials stored per-project in localStorage

---

## 🗺️ Roadmap

- [x] Video to UI generation
- [x] 30+ style presets
- [x] Edit with AI
- [x] Flow Map visualization
- [x] Supabase integration
- [x] One-click publish
- [x] Project settings & analytics
- [x] Version history with restore
- [x] AI chat interface with image support
- [x] Style reference mode (copy from image)
- [x] Delete confirmation modals
- [x] Extended history (500 projects)
- [ ] Figma plugin
- [ ] Component library export
- [ ] Team collaboration
- [ ] API access
- [ ] Mobile app recording

---

## 📖 Documentation

Full documentation available at **[replay.build/docs](https://replay.build/docs)**

- [Quickstart Guide](https://replay.build/docs/quickstart)
- [Video to UI](https://replay.build/docs/features/video-to-ui)
- [Edit with AI](https://replay.build/docs/features/edit-with-ai)
- [Style Injection](https://replay.build/docs/guides/style-injection)
- [Supabase Integration](https://replay.build/docs/integrations/supabase)
- [Pricing & Credits](https://replay.build/docs/pricing)
- [Changelog](https://replay.build/docs/changelog)

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) — The React framework
- [Supabase](https://supabase.com) — Open source Firebase alternative
- [Stripe](https://stripe.com) — Payment infrastructure
- [Google Gemini](https://ai.google.dev) — AI that powers generation
- [Vercel](https://vercel.com) — Deployment platform
- [Tailwind CSS](https://tailwindcss.com) — Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) — Animation library
- [Lucide](https://lucide.dev) — Beautiful icons

---

<div align="center">

**Built with ❤️ for the AI Hackathon**

[Live Demo](https://replay.build) · [Documentation](https://replay.build/docs) · [Report Bug](https://github.com/ma1orek/replay/issues)

</div>
