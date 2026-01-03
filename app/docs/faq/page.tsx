import Link from "next/link";
import { HelpCircle, ChevronRight, Video, Code, Database, CreditCard, Globe, Shield } from "lucide-react";

const faqs = [
  {
    category: "Getting Started",
    icon: Video,
    questions: [
      {
        q: "What video formats does Replay support?",
        a: "Replay supports MP4, WebM, and MOV video formats. For best results, use 1080p or higher resolution recordings."
      },
      {
        q: "How long can my video be?",
        a: "We recommend videos between 5-60 seconds. Longer videos (up to 2 minutes) are supported but may take longer to process and use more credits."
      },
      {
        q: "What makes a good recording?",
        a: "Record in high resolution, move slowly through the UI, show all navigation states, and hover over interactive elements. Avoid fast scrolling or quick movements."
      },
      {
        q: "Can I record mobile UIs?",
        a: "Yes! Record your phone screen or use a device emulator. The AI will detect and replicate responsive designs."
      },
    ]
  },
  {
    category: "AI & Code Generation",
    icon: Code,
    questions: [
      {
        q: "What technology does the generated code use?",
        a: "Generated code uses HTML5, Tailwind CSS, and Alpine.js. It's production-ready and works as a single HTML file with CDN dependencies."
      },
      {
        q: "Is the generated code pixel-perfect?",
        a: "The AI interprets your video to create functional UI - it's not a pixel-perfect copy. Use Edit with AI to refine any differences."
      },
      {
        q: "Can I use React/Vue/other frameworks?",
        a: "Currently, Replay generates vanilla HTML/Tailwind/Alpine.js code. You can easily convert this to component-based frameworks."
      },
      {
        q: "Does the AI hallucinate content?",
        a: "The AI faithfully reconstructs what it sees in your video. If you connect Supabase, it uses real table names and data structure."
      },
    ]
  },
  {
    category: "Database Integration",
    icon: Database,
    questions: [
      {
        q: "Which databases are supported?",
        a: "Currently, we support Supabase. More database integrations (Firebase, PlanetScale) are coming soon."
      },
      {
        q: "Can Replay modify my database?",
        a: "No. Replay only reads your database schema and sample data. It never writes, modifies, or deletes anything."
      },
      {
        q: "Are my database credentials safe?",
        a: "Yes. Your Supabase URL and anon key are stored in your browser's localStorage - never sent to our servers."
      },
      {
        q: "Why do my tables show 0 rows?",
        a: "This usually means Row Level Security (RLS) is blocking access. Create a SELECT policy for the anon role on tables you want to expose."
      },
    ]
  },
  {
    category: "Pricing & Credits",
    icon: CreditCard,
    questions: [
      {
        q: "What costs credits?",
        a: "Video generation costs 1 credit, Edit with AI costs 0.25 credits, and Style Injection costs 0.5 credits."
      },
      {
        q: "Do my credits roll over?",
        a: "Monthly subscription credits reset each billing cycle. Top-up credits never expire and stack with subscription credits."
      },
      {
        q: "What happens if I run out of credits?",
        a: "You can purchase top-up packs anytime or upgrade your subscription. Your existing projects remain accessible."
      },
      {
        q: "Can I get a refund?",
        a: "We offer refunds within 7 days if you haven't used your credits. Contact support@replay.build for assistance."
      },
    ]
  },
  {
    category: "Publishing & Export",
    icon: Globe,
    questions: [
      {
        q: "Where are published sites hosted?",
        a: "Published sites are hosted on our infrastructure at [your-id].replay.build. They include HTTPS by default."
      },
      {
        q: "Can I use my own domain?",
        a: "Custom domains are available on the Agency plan. Contact us for setup instructions."
      },
      {
        q: "Can I export and host elsewhere?",
        a: "Yes! Download the HTML file and host it on any static hosting service like Vercel, Netlify, or GitHub Pages."
      },
      {
        q: "Are there usage limits on published sites?",
        a: "Published sites have generous bandwidth limits. High-traffic sites may need custom arrangements."
      },
    ]
  },
  {
    category: "Privacy & Security",
    icon: Shield,
    questions: [
      {
        q: "Do you store my videos?",
        a: "Videos are processed in memory and not permanently stored. Generated code is stored in your browser's localStorage."
      },
      {
        q: "Is my data used to train AI?",
        a: "No. Your videos and generated code are never used to train our AI models."
      },
      {
        q: "Who can see my published sites?",
        a: "Published sites are public by default. For private sharing, use the code download feature instead."
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings → Account and click 'Delete Account'. All your data will be permanently removed within 30 days."
      },
    ]
  },
];

export default function FAQPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white">FAQ</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <HelpCircle className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-white">Frequently Asked Questions</h1>
        </div>
        <p className="text-xl text-white/60">
          Find answers to common questions about Replay.
        </p>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {faqs.map((section) => (
          <a
            key={section.category}
            href={`#${section.category.toLowerCase().replace(/\s+/g, '-')}`}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70 hover:text-white hover:border-white/20 transition-colors"
          >
            {section.category}
          </a>
        ))}
      </div>

      {/* FAQ sections */}
      <div className="space-y-10">
        {faqs.map((section) => (
          <div key={section.category} id={section.category.toLowerCase().replace(/\s+/g, '-')}>
            <div className="flex items-center gap-2 mb-4">
              <section.icon className="w-5 h-5 text-[#FF6E3C]" />
              <h2 className="text-xl font-semibold text-white">{section.category}</h2>
            </div>
            <div className="space-y-3">
              {section.questions.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors list-none">
                    <span className="font-medium text-white pr-4">{faq.q}</span>
                    <ChevronRight className="w-4 h-4 text-white/40 group-open:rotate-90 transition-transform" />
                  </summary>
                  <div className="px-4 py-3 text-sm text-white/70">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Still need help */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF3C6E]/20 border border-[#FF6E3C]/30 text-center">
        <h3 className="text-lg font-semibold text-white mb-2">Still have questions?</h3>
        <p className="text-white/60 mb-4">We're here to help. Reach out to our support team.</p>
        <a
          href="mailto:support@replay.build"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6E3C] text-white text-sm font-medium rounded-lg hover:bg-[#FF6E3C]/90 transition-colors"
        >
          Contact Support
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

