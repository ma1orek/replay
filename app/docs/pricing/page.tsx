import Link from "next/link";
import { CreditCard, Check, Zap, Building, Star } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white">Pricing</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#FF6E3C]/20">
            <CreditCard className="w-6 h-6 text-[#FF6E3C]" />
          </div>
          <h1 className="text-4xl font-bold text-white">Pricing & Credits</h1>
        </div>
        <p className="text-xl text-white/60">
          Start for free. Upgrade as you go. Pay only for what you generate.
        </p>
      </div>

      {/* How credits work */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How Credits Work</h2>
        <p className="text-white/70 leading-relaxed">
          Credits are consumed per reconstruction — not per prompt. One generation includes 
          flow + structure + code + design system.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-3xl font-bold text-[#FF6E3C] mb-1">75</div>
            <p className="text-sm text-white/70">Video to UI Generation</p>
            <p className="text-xs text-white/40 mt-1">Full UI reconstruction</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-3xl font-bold text-[#FF6E3C] mb-1">3</div>
            <p className="text-sm text-white/70">Edit with AI</p>
            <p className="text-xs text-white/40 mt-1">Refine, add, modify</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Plans</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {/* Free */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Free</h3>
              <p className="text-sm text-white/50">For getting started</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-white/50">/mo</span>
            </div>
            <p className="text-xs text-white/40 mb-4">~1 generation</p>
            <ul className="space-y-2 text-sm text-white/70 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>100 credits / month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Preview only</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Public projects only</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Community support</span>
              </li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
              Get Started
            </button>
          </div>

          {/* Starter */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Starter</h3>
              <p className="text-sm text-white/50">One-time purchase</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$9</span>
              <span className="text-white/50"> one-time</span>
            </div>
            <p className="text-xs text-white/40 mb-4">~4 generations • Perfect for testing</p>
            <ul className="space-y-2 text-sm text-white/70 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>300 credits (~4 gens)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Full Access & Export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Publish to web</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Credits never expire</span>
              </li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
              Buy Starter
            </button>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-[#FF6E3C]/20 to-[#FF3C6E]/20 border border-[#FF6E3C]/50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-[#FF6E3C] text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Best Value
              </span>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FF6E3C]" />
                Pro
              </h3>
              <p className="text-sm text-white/50">For creators</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$25</span>
              <span className="text-white/50">/mo</span>
            </div>
            <p className="text-xs text-white/40 mb-4">~20 generations / month</p>
            <ul className="space-y-2 text-sm text-white/70 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF6E3C]" />
                <span className="text-[#FF6E3C]">Everything in Starter, plus:</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF6E3C]" />
                <span>1,500 credits / month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF6E3C]" />
                <span>Private projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF6E3C]" />
                <span>Credits roll over</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-[#FF6E3C]" />
                <span>Priority support</span>
              </li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-[#FF6E3C] text-white text-sm font-medium hover:bg-[#FF6E3C]/90 transition-colors">
              Subscribe
            </button>
          </div>

          {/* Enterprise */}
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-white/60" />
                Enterprise
              </h3>
              <p className="text-sm text-white/50">For teams & orgs</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            <p className="text-xs text-white/40 mb-4">Unlimited potential</p>
            <ul className="space-y-2 text-sm text-white/70 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Everything in Pro, plus:</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Custom credit allocation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Team seats & SSO</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-white/40" />
                <span>Dedicated support & SLA</span>
              </li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* Top-ups */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Buy Credits Anytime</h2>
        <p className="text-white/70 leading-relaxed">
          Need more credits? Purchase additional packs. Top-up credits never expire.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-bold text-white mb-1">2,000</div>
            <p className="text-sm text-white/50 mb-2">credits</p>
            <p className="text-[#FF6E3C] font-medium">$20</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-bold text-white mb-1">5,500</div>
            <p className="text-sm text-white/50 mb-2">credits</p>
            <p className="text-[#FF6E3C] font-medium">$50</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <div className="text-2xl font-bold text-white mb-1">12,000</div>
            <p className="text-sm text-white/50 mb-2">credits</p>
            <p className="text-[#FF6E3C] font-medium">$100</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Common Questions</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">Do credits expire?</h4>
            <p className="text-sm text-white/60">Monthly subscription credits reset each billing cycle. Unused monthly credits can roll over up to 600 on Pro. Top-up credits never expire.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-white/60">Yes. Cancel anytime from Settings → Plans → Manage. You'll keep access until the end of your billing period.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">What's the difference between plans?</h4>
            <p className="text-sm text-white/60">Free: 100 credits/month (~1 gen), preview only. Starter: $9 one-time, 300 credits (~4 gens), full access, never expire. Pro: $25/mo, 1,500 credits (~20 gens), private projects, credits roll over, priority support.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <h4 className="font-medium text-white mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-white/60">We accept all major credit cards via Stripe.</p>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
        <p className="text-xs text-white/40">
          By subscribing, you agree to our <Link href="/terms" className="text-[#FF6E3C] hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-[#FF6E3C] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
