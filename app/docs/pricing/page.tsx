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

      {/* How it works */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">How Active Projects Work</h2>
        <p className="text-zinc-400 leading-relaxed">
          Each plan has a limit on <strong className="text-white">active projects</strong>. You can iterate 
          unlimited times within each project. When you finish a project, archive it to free up a slot for a new one.
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-3xl font-bold text-white mb-1">1</div>
            <p className="text-sm text-zinc-400">Pro Plan</p>
            <p className="text-xs text-zinc-500 mt-1">1 active project</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-3xl font-bold text-white mb-1">10</div>
            <p className="text-sm text-zinc-400">Agency Plan</p>
            <p className="text-xs text-zinc-500 mt-1">10 active projects</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700 text-center">
            <div className="text-3xl font-bold text-white mb-1">∞</div>
            <p className="text-sm text-zinc-400">Enterprise</p>
            <p className="text-xs text-zinc-500 mt-1">Unlimited projects</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Plans</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sandbox */}
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Sandbox</h3>
              <p className="text-sm text-zinc-500">Explore the demo</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$0</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Interactive demo only</p>
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
            <Link href="#demo" className="block w-full py-2 rounded-lg bg-zinc-700 text-white text-sm text-center hover:bg-zinc-600 transition-colors">
              Explore Demo
            </Link>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-xl bg-zinc-800 border border-orange-500/50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Popular
              </span>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                Pro
              </h3>
              <p className="text-sm text-zinc-500">For solo freelancers</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$149</span>
              <span className="text-zinc-500">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">1 active project</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-500" />
                <span>1 active project</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-500" />
                <span>Unlimited iterations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-500" />
                <span>React + Tailwind export</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-500" />
                <span>Design System generation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-orange-500" />
                <span>Email support</span>
              </li>
            </ul>
            <Link href="/login?plan=pro" className="block w-full py-2 rounded-lg bg-orange-500 text-white text-sm font-medium text-center hover:bg-orange-600 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Agency */}
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white">Agency</h3>
              <p className="text-sm text-zinc-500">For software houses</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$499</span>
              <span className="text-zinc-500">/mo</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">10 active projects</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>10 active projects</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>5 team members</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Shared Design System</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Priority GPU queue</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Priority support</span>
              </li>
            </ul>
            <Link href="/login?plan=agency" className="block w-full py-2 rounded-lg bg-zinc-700 text-white text-sm text-center hover:bg-zinc-600 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-6 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-zinc-500" />
                Enterprise
              </h3>
              <p className="text-sm text-zinc-500">For banks & enterprise</p>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">Custom</span>
            </div>
            <p className="text-xs text-zinc-500 mb-4">Unlimited projects</p>
            <ul className="space-y-2 text-sm text-zinc-400 mb-6">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-zinc-500" />
                <span>Unlimited projects</span>
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
                <span>Dedicated account manager</span>
              </li>
            </ul>
            <Link href="/contact" className="block w-full py-2 rounded-lg bg-zinc-700 text-white text-sm text-center hover:bg-zinc-600 transition-colors">
              Book a Demo
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Common Questions</h2>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">What happens when I reach my project limit?</h4>
            <p className="text-sm text-zinc-400">Archive a completed project to free up a slot for a new one. Archived projects remain accessible but don't count towards your limit.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-zinc-400">Yes. Cancel anytime from Settings → Plans → Manage. You'll keep access until the end of your billing period.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">What's the difference between plans?</h4>
            <p className="text-sm text-zinc-400">Sandbox: Demo only, no upload. Pro ($149/mo): 1 active project, unlimited iterations. Agency ($499/mo): 10 projects, 5 team members. Enterprise: Custom pricing, unlimited projects, on-premise option.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">What payment methods do you accept?</h4>
            <p className="text-sm text-zinc-400">We accept all major credit cards via Stripe.</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
            <h4 className="font-medium text-white mb-1">Do I need Enterprise for my team?</h4>
            <p className="text-sm text-zinc-400">Agency plan supports up to 5 team members. Enterprise is for organizations that need on-premise deployment, SSO/SAML, or dedicated support with SLA.</p>
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
