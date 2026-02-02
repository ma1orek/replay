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
          Explore the demo free. Pay when you're ready to build.
        </p>
      </div>

      {/* How Credits Work */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How Credits Work</h2>
        <p className="text-zinc-400 leading-relaxed">
          Replay uses a <strong className="text-white">credit-based system</strong>. Each action costs credits. 
          Your monthly credits reset each billing cycle, and unused credits roll over to the next month.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="text-3xl font-bold text-white mb-1">~150</div>
            <p className="text-sm text-zinc-400">credits per generation</p>
            <p className="text-xs text-zinc-500 mt-1">Video to UI conversion</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="text-3xl font-bold text-white mb-1">~10</div>
            <p className="text-sm text-zinc-400">credits per AI edit</p>
            <p className="text-xs text-zinc-500 mt-1">Refine and iterate</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Plans</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sandbox */}
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Sandbox</h3>
              <p className="text-sm text-zinc-500">Explore the demo</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$0</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">0 credits - demo only</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Demo project (read-only)</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Flow Map & Library preview</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Code preview</span>
              </li>
            </ul>
            <Link href="https://www.replay.build/tool?project=flow_1769991250167_jr2x4utrt" className="block w-full py-2 rounded-lg bg-zinc-700 text-white text-sm text-center hover:bg-zinc-600 transition-colors">
              Explore Demo
            </Link>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-xl bg-zinc-800 border border-zinc-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-white text-black text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Popular
              </span>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-zinc-400" />
                Pro
              </h3>
              <p className="text-sm text-zinc-500">For developers</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$149</span>
              <span className="text-zinc-500">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">3,000 credits/month (~20 generations)</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-300" />
                <span>Scalable credit tiers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-300" />
                <span>Unlimited projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-300" />
                <span>React + Tailwind export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-300" />
                <span>Publish to web</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-300" />
                <span>Credits roll over</span>
              </li>
            </ul>
            <Link href="/pricing" className="block w-full py-2 rounded-lg bg-white text-black text-sm font-medium text-center hover:bg-zinc-200 transition-colors">
              View Plans
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-zinc-500" />
                Enterprise
              </h3>
              <p className="text-sm text-zinc-500">For teams & enterprise</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Custom credits & features</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Everything in Pro</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>On-premise / Private Cloud</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>SSO / SAML integration</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>SLA & Security audit</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Dedicated support</span>
              </li>
            </ul>
            <Link href="/contact" className="block w-full py-2 rounded-lg bg-zinc-700 text-white text-sm text-center hover:bg-zinc-600 transition-colors">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>

      {/* Credit Top-ups */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Credit Top-ups</h2>
        <p className="text-zinc-400">Need more credits? Buy one-time packs anytime.</p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-2xl font-bold text-white mb-1">$20</div>
            <p className="text-sm text-zinc-400">900 credits</p>
            <p className="text-xs text-zinc-500 mt-1">~6 generations</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-2xl font-bold text-white mb-1">$50</div>
            <p className="text-sm text-zinc-400">2,400 credits</p>
            <p className="text-xs text-zinc-500 mt-1">~16 generations</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-2xl font-bold text-white mb-1">$100</div>
            <p className="text-sm text-zinc-400">5,250 credits</p>
            <p className="text-xs text-zinc-500 mt-1">~35 generations</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Common Questions</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">What happens when I run out of credits?</h4>
            <p className="text-sm text-zinc-400">You can buy a top-up pack or wait for your monthly credits to reset. Unused credits roll over to the next month.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-zinc-400">Yes. Cancel anytime from Settings → Plans → Manage. You'll keep access until the end of your billing period.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">How many generations can I do?</h4>
            <p className="text-sm text-zinc-400">Each video-to-UI generation costs ~150 credits. Pro plan ($149/mo, 3,000 credits) gives you ~20 generations. Agency plan ($499/mo, 15,000 credits) gives you ~100 generations.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-zinc-400">We accept all major credit cards via Stripe.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">Do AI edits cost credits?</h4>
            <p className="text-sm text-zinc-400">Yes, each AI edit/refine costs ~10 credits. This is much cheaper than generations so you can iterate freely.</p>
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
