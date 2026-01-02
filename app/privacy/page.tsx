"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/60" />
            </Link>
            <Logo />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/40 mb-12">Last updated: December 29, 2025</p>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            This Privacy Policy explains how Replay ("we", "our", "us") collects, uses, and protects your information when you use replay.build.
          </p>

          {/* Data Controller */}
          <section className="mb-10 p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-white">Data Controller</h2>
            <div className="text-white/60 space-y-1">
              <p><strong className="text-white/80">Administrator:</strong> Bartosz Idzik</p>
              <p><strong className="text-white/80">Email:</strong> <a href="mailto:support@replay.build" className="text-[#FF6E3C] hover:underline">support@replay.build</a></p>
              <p><strong className="text-white/80">Website:</strong> replay.build</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Information We Collect</h2>
            <p className="text-white/60 mb-4">We collect only what is necessary to operate the service:</p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Account information</strong> (email address, user ID)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Billing information</strong> (handled securely by Stripe — we never store credit card details)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Usage data</strong> (credits usage, generated projects, timestamps)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Uploaded content</strong> (videos, context input, generated UI and code)</span>
              </li>
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-[#FF6E3C]/10 border border-[#FF6E3C]/20">
              <p className="text-white/80 font-medium">Uploaded videos and generated outputs belong to you.</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Cookies & Tracking</h2>
            <p className="text-white/60 mb-4">We use cookies and similar technologies for:</p>
            <ul className="space-y-2 text-white/60 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Essential cookies</strong> — Required for authentication and basic functionality</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Analytics cookies</strong> — Google Analytics to understand how visitors use our site (anonymized)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Preference cookies</strong> — To remember your settings and consent choices</span>
              </li>
            </ul>
            <p className="text-white/60">
              You can manage cookie preferences through your browser settings. Declining non-essential cookies may affect some features.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">3. How We Use Your Data</h2>
            <p className="text-white/60 mb-4">We use your data only to:</p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Provide and operate the Replay service</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Process subscriptions and payments</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Allocate and manage credits</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Improve product quality and reliability</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Communicate important service updates</span>
              </li>
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/80"><strong>We do not sell your data.</strong></p>
              <p className="text-white/60 mt-1">We do not use your private projects for marketing.</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Legal Basis for Processing (GDPR)</h2>
            <p className="text-white/60 mb-4">We process your personal data based on:</p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Contract performance</strong> — To provide the services you've requested</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Legitimate interest</strong> — To improve our services and prevent fraud</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Consent</strong> — For analytics cookies and marketing communications (where applicable)</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Third-Party Services</h2>
            <p className="text-white/60 mb-4">We use the following third-party services:</p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Stripe</strong> — Payment processing (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FF6E3C] hover:underline">Privacy Policy</a>)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Supabase</strong> — Database and authentication (<a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FF6E3C] hover:underline">Privacy Policy</a>)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Google Analytics</strong> — Site analytics (<a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FF6E3C] hover:underline">Privacy Policy</a>)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Vercel</strong> — Hosting (<a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#FF6E3C] hover:underline">Privacy Policy</a>)</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Data Storage & Security</h2>
            <p className="text-white/60">
              We apply reasonable technical and organizational measures to protect your data, including encryption in transit and at rest. Data is stored on secure servers in the European Union and United States.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Data Retention</h2>
            <p className="text-white/60">
              We retain your data for as long as your account is active. You may delete your account at any time. Upon deletion, your projects and associated data are removed within 30 days unless required by law.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Your Rights</h2>
            <p className="text-white/60 mb-4">Under GDPR and applicable laws, you have the right to:</p>
            <ul className="space-y-2 text-white/60 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Access</strong> — Request a copy of your personal data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Rectification</strong> — Correct inaccurate data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Erasure</strong> — Request deletion of your data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Portability</strong> — Export your data in a machine-readable format</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Object</strong> — Object to certain processing activities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span><strong className="text-white/80">Withdraw consent</strong> — Where processing is based on consent</span>
              </li>
            </ul>
            <p className="text-white/60">
              To exercise these rights, contact us at: <a href="mailto:support@replay.build" className="text-[#FF6E3C] hover:underline">support@replay.build</a>
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">9. Changes to This Policy</h2>
            <p className="text-white/60">
              We may update this policy occasionally. We will notify you of significant changes via email or through our service. Continued use of Replay after changes means acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">10. Contact</h2>
            <p className="text-white/60">
              For any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/80">Email: <a href="mailto:support@replay.build" className="text-[#FF6E3C] hover:underline">support@replay.build</a></p>
            </div>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <Link href="/terms" className="text-[#FF6E3C] hover:underline">
            View Terms of Service →
          </Link>
        </div>
      </main>
    </div>
  );
}
