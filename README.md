# 🎬 Replay

<div align="center">

![Replay Logo](public/og-image.png)

### **Video to Design System. Instantly.**

Turn any screen recording into a complete design system with components, documentation, and interactive blueprints.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-replay.build-FF6E3C?style=for-the-badge)](https://replay.build)
[![Documentation](https://img.shields.io/badge/Docs-replay.build%2Fdocs-blue?style=for-the-badge)](https://replay.build/docs)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)

</div>

---

## ✨ What is Replay?

Replay is an AI-powered design system generator. Upload a screen recording of any app or website, and Replay will:

1. **Extract Components** — Detect UI patterns and generate a component library
2. **Create Documentation** — Auto-generate Storybook-style docs with props, variants, and usage examples
3. **Build Blueprints** — Visual canvas to arrange and edit components with AI
4. **Generate Flow Maps** — Visualize page navigation and user flows
5. **One-Click Publish** — Deploy your design system to the web instantly

---

## 🎯 Core Features

### 📚 Component Library
A Storybook-like interface for your extracted components:
- **Controls** — Edit props in real-time (colors, text, sizes)
- **Actions** — See interactive behaviors  
- **Visual Tests** — Compare component states
- **Accessibility** — WCAG compliance checks
- **Usage** — Copy-paste code snippets

### 🎨 Blueprints
Visual canvas for component composition:
- Drag & drop components on canvas
- Resize and position freely
- AI-powered editing: "Make it red", "Add icon", "Add shadow"
- Real-time preview in iframe
- Save to library when satisfied

### 🗺️ Flow Map
Interactive visualization of app structure:
- Detected pages and navigation paths
- Click nodes to preview pages
- See relationships between screens
- Export as documentation

### 🔗 Database Integration
Connect Supabase and generate real data-fetching code:
- AI reads your table schemas
- Generates actual queries (not mock data)
- Supports authentication patterns

### 🚀 One-Click Publish
Deploy instantly to `replay.build/p/your-project`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Styling** | Tailwind CSS |
| **AI** | Google Gemini 2.0 Flash |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (Google OAuth) |
| **Payments** | Stripe |
| **Hosting** | Vercel |
| **Icons** | Lucide React |
| **Color Picker** | @uiw/react-color |

---

## 💰 Pricing

| Plan | Price | Credits/Month | Best For |
|------|-------|---------------|----------|
| **Free** | $0 | 75 (one-time) | Try it out |
| **Pro** | $25/mo | 1,500 | Creators & designers |
| **Enterprise** | Custom | Unlimited | Teams & agencies |

**Credit Costs:**
- 🎬 Video generation: **75 credits**
- ✨ AI component edit: **3 credits**
- 📚 Library extraction: **10 credits**

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
│   ├── api/
│   │   ├── generate/        # AI generation endpoints
│   │   │   ├── library/     # Component extraction
│   │   │   ├── blueprints/  # Blueprint AI editing
│   │   │   └── stream/      # Streaming generation
│   │   ├── credits/         # Credit management
│   │   ├── publish/         # Deployment endpoint
│   │   └── stripe/          # Payment webhooks
│   ├── docs/                # Documentation pages
│   ├── page.tsx             # Main tool interface
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Shadcn-style UI components
│   │   ├── color-picker.tsx # Advanced color picker
│   │   ├── popover.tsx
│   │   └── ...
│   └── modals/              # Auth, credits modals
├── lib/
│   ├── supabase/            # Database clients
│   ├── prompts/             # AI system prompts
│   └── utils.ts             # Helpers
└── public/
    └── og-image.png         # Social preview
```

---

## 🔒 Security

- ✅ Row Level Security (RLS) on all Supabase tables
- ✅ Server-side credit transactions (atomic)
- ✅ Stripe webhook signature verification
- ✅ Service role keys only on server
- ✅ Sandboxed iframe previews

---

## 🗺️ Roadmap

- [x] Video to UI generation
- [x] Component Library with Controls
- [x] Blueprints visual editor
- [x] Flow Map visualization
- [x] AI editing with chat interface
- [x] Color picker with contrast ratio
- [x] One-click publish
- [x] Supabase integration
- [x] Version history
- [ ] Figma plugin export
- [ ] Team collaboration
- [ ] API access
- [ ] Component marketplace

---

## 📖 Documentation

Full documentation at **[replay.build/docs](https://replay.build/docs)**

- [Quickstart Guide](https://replay.build/docs/quickstart)
- [Component Library](https://replay.build/docs/features/library)
- [Blueprints Editor](https://replay.build/docs/features/blueprints)
- [Flow Map](https://replay.build/docs/features/flow-map)
- [AI Editing](https://replay.build/docs/features/edit-with-ai)
- [Publishing](https://replay.build/docs/features/publish)

---

## 🤝 Contributing

Contributions welcome!

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

- [Next.js](https://nextjs.org) — React framework
- [Supabase](https://supabase.com) — Database & Auth
- [Google Gemini](https://ai.google.dev) — AI generation
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Lucide](https://lucide.dev) — Icons
- [Vercel](https://vercel.com) — Hosting

---

<div align="center">

**Built with ❤️ by Replay Team**

[Live Demo](https://replay.build) · [Documentation](https://replay.build/docs) · [Report Bug](https://github.com/ma1orek/replay/issues)

</div>
