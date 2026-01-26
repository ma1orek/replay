import Link from "next/link";
import { CreditCard, Check, Zap, Building, Star } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <span>/</span>
          <span className="text-white">Pricing</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800">
            <CreditCard className="w-6 h-6 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold text-white">Pricing & Credits</h1>
        </div>
        <p className="text-xl text-zinc-400">
          Start for free. Upgrade as you go. Pay only for what you generate.
        </p>
      </div>

      {/* How credits work */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How Credits Work</h2>
        <p className="text-zinc-400 leading-relaxed">
          Credits are consumed per reconstruction — not per prompt. One generation includes 
          flow + structure + code + design system.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-3xl font-bold text-white mb-1">75</div>
            <p className="text-sm text-zinc-400">Video to UI Generation</p>
            <p className="text-xs text-zinc-500 mt-1">Full UI reconstruction</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-3xl font-bold text-white mb-1">3</div>
            <p className="text-sm text-zinc-400">Edit with AI</p>
            <p className="text-xs text-zinc-500 mt-1">Refine, add, modify</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-3xl font-bold text-white mb-1">10</div>
            <p className="text-sm text-zinc-400">Library Extraction</p>
            <p className="text-xs text-zinc-500 mt-1">Extract components</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Plans</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {/* Free */}
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Free</h3>
              <p className="text-sm text-zinc-500">For getting started</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-zinc-500">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">~1 generation</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>100 credits / month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Preview only</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Public projects only</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Community support</span>
              </li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-zinc-700 text-white text-sm hover:bg-zinc-600 transition-colors">
              Get Started
            </button>
          </div>

          {/* Maker */}
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Maker</h3>
              <p className="text-sm text-zinc-500">One-time purchase</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$9</span>
              <span className="text-zinc-500"> one-time</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">~4 generations • Perfect for testing</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>300 credits (~4 gens)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Full Access & Export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Publish to web</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Credits never expire</span>
              </li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-zinc-700 text-white text-sm hover:bg-zinc-600 transition-colors">
              Buy Maker
            </button>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-xl bg-zinc-800 border border-zinc-600 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-zinc-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Best Value
              </span>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-zinc-400" />
                Pro
              </h3>
              <p className="text-sm text-zinc-500">For creators</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$25</span>
              <span className="text-zinc-500">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">~20 generations / month</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span className="text-white">Everything in Maker, plus:</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>1,500 credits / month</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Private projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Credits roll over</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Priority support</span>
              </li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-zinc-600 text-white text-sm font-medium hover:bg-zinc-500 transition-colors">
              Subscribe
            </button>
          </div>

          {/* Enterprise */}
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-zinc-500" />
                Enterprise
              </h3>
              <p className="text-sm text-zinc-500">For teams & orgs</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Unlimited potential</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Everything in Pro, plus:</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Custom credit allocation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Team seats & SSO</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Dedicated support & SLA</span>
              </li>
            </ul>
            <button className="w-full py-2 rounded-lg bg-zinc-700 text-white text-sm hover:bg-zinc-600 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* Top-ups */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Buy Credits Anytime</h2>
        <p className="text-zinc-400 leading-relaxed">
          Need more credits? Purchase additional packs. Top-up credits never expire.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-2xl font-bold text-white mb-1">2,000</div>
            <p className="text-sm text-zinc-500 mb-2">credits</p>
            <p className="text-zinc-300 font-medium">$20</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-2xl font-bold text-white mb-1">5,500</div>
            <p className="text-sm text-zinc-500 mb-2">credits</p>
            <p className="text-zinc-300 font-medium">$50</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-2xl font-bold text-white mb-1">12,000</div>
            <p className="text-sm text-zinc-500 mb-2">credits</p>
            <p className="text-zinc-300 font-medium">$100</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Common Questions</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">Do credits expire?</h4>
            <p className="text-sm text-zinc-400">Monthly subscription credits reset each billing cycle. Unused monthly credits can roll over up to 600 on Pro. Top-up credits never expire.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-zinc-400">Yes. Cancel anytime from Settings → Plans → Manage. You'll keep access until the end of your billing period.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">What's the difference between plans?</h4>
            <p className="text-sm text-zinc-400">Free: 100 credits/month (~1 gen), preview only. Maker: $9 one-time, 300 credits (~4 gens), full access, never expire. Pro: $25/mo, 1,500 credits (~20 gens), private projects, credits roll over, priority support.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-zinc-400">We accept all major credit cards via Stripe.</p>
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
        <p className="text-xs text-zinc-500">
          By subscribing, you agree to our <Link href="/terms" className="text-zinc-400 hover:text-white">Terms of Service</Link> and <Link href="/privacy" className="text-zinc-400 hover:text-white">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
