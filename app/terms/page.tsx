"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-white/40 mb-12">Last updated: December 29, 2025</p>

        <div className="prose prose-invert prose-lg max-w-none">
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            By using Replay (replay.build), you agree to these Terms of Service. Please read them carefully.
          </p>

          {/* Service Provider */}
          <section className="mb-10 p-6 rounded-xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold mb-4 text-white">Service Provider</h2>
            <div className="text-white/60 space-y-1">
              <p><strong className="text-white/80">Operator:</strong> Bartosz Idzik</p>
              <p><strong className="text-white/80">Email:</strong> <a href="mailto:support@replay.build" className="text-[#FF6E3C] hover:underline">support@replay.build</a></p>
              <p><strong className="text-white/80">Website:</strong> replay.build</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Service Description</h2>
            <p className="text-white/60">
              Replay is a tool that reconstructs UI, structure, code, and flows based on video input provided by the user. Results are generated automatically using AI and may require human review before production use. The service is currently in Early Access, which means some features may be experimental or subject to change.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">2. Account Registration</h2>
            <p className="text-white/60 mb-4">To use Replay, you must:</p>
            <ul className="space-y-2 text-white/60 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Be at least 18 years old or have parental consent</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Provide accurate and complete registration information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Keep your account credentials secure</span>
              </li>
            </ul>
            <p className="text-white/60">
              You are responsible for all activities that occur under your account.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">3. User Content & Intellectual Property</h2>
            <p className="text-white/60 mb-4">You retain full ownership of:</p>
            <ul className="space-y-2 text-white/60 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Videos and content you upload</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Generated UI, code, and design outputs created from your content</span>
              </li>
            </ul>
            <div className="p-4 rounded-xl bg-[#FF6E3C]/10 border border-[#FF6E3C]/20">
              <p className="text-white/80">
                You are responsible for ensuring you have the right to upload and process the content you provide. Do not upload content that infringes on third-party intellectual property rights.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">4. Acceptable Use</h2>
            <p className="text-white/60 mb-4">You agree not to:</p>
            <ul className="space-y-2 text-white/60 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">✕</span>
                <span>Upload illegal, malicious, harmful, or infringing content</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">✕</span>
                <span>Attempt to reverse engineer, exploit, or overload the system</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">✕</span>
                <span>Use Replay for unlawful activities or to harm others</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">✕</span>
                <span>Share your account credentials with others</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">✕</span>
                <span>Use automated systems to access the service without permission</span>
              </li>
            </ul>
            <p className="text-white/60">
              We reserve the right to suspend or terminate accounts violating these terms without prior notice.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">5. Credits & Billing</h2>
            <p className="text-white/60 mb-4">Replay operates on a credit-based system:</p>
            <ul className="space-y-2 text-white/60 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Credits are consumed per generation (75 credits) or AI edit (10 credits)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Free accounts receive 150 one-time credits</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Paid plans receive monthly credits that may roll over according to plan terms</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Subscription fees are billed monthly or annually via Stripe</span>
              </li>
            </ul>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/80"><strong>Refund Policy:</strong> All payments are non-refundable unless required by applicable law. You may cancel your subscription at any time, and access will continue until the end of the billing period.</p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">6. Service Availability & Limitations</h2>
            <p className="text-white/60 mb-4">Replay is provided "as is" and "as available". We do not guarantee:</p>
            <ul className="space-y-2 text-white/60 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Perfect accuracy of generated UI or code</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Continuous, uninterrupted availability</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Compatibility with all video formats or content types</span>
              </li>
            </ul>
            <p className="text-white/60">
              You are responsible for reviewing and validating all outputs before production use. AI-generated content may contain errors or inaccuracies.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">7. Termination</h2>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>You may cancel your subscription at any time via your account settings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>We may terminate or suspend access if these Terms are violated</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#FF6E3C] mt-1">•</span>
                <span>Upon termination, your right to use the service ceases immediately</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">8. Limitation of Liability</h2>
            <p className="text-white/60 mb-4">To the maximum extent permitted by applicable law:</p>
            <ul className="space-y-2 text-white/60">
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Replay and its operator shall not be liable for any indirect, incidental, special, consequential, or punitive damages</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>Our total liability is limited to the amount paid by you in the 12 months preceding the claim</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-white/40 mt-1">•</span>
                <span>We are not liable for any loss of data, profits, or business opportunities</span>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">9. Governing Law</h2>
            <p className="text-white/60">
              These Terms are governed by the laws of Poland. Any disputes shall be resolved in the courts of Poland, without regard to conflict of law principles. If you are a consumer in the European Union, you may also have additional rights under EU consumer protection laws.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">10. Changes to Terms</h2>
            <p className="text-white/60">
              We may update these Terms from time to time. We will notify you of material changes via email or through the service. Continued use of Replay after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-white">11. Contact</h2>
            <p className="text-white/60">
              For questions about these Terms, please contact us:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-white/80">Email: <a href="mailto:support@replay.build" className="text-[#FF6E3C] hover:underline">support@replay.build</a></p>
            </div>
          </section>
        </div>

        {/* Footer link */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <Link href="/privacy" className="text-[#FF6E3C] hover:underline">
            View Privacy Policy →
          </Link>
        </div>
      </main>
    </div>
  );
}
