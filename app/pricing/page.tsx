"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Minus, ArrowRight, PhoneCall, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";
import { useAuth } from "@/lib/auth/context";
import { useProfile } from "@/lib/profile/context";
import Avatar from "@/components/Avatar";

// ═══════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════

const menuItems = [
  { name: "Features", href: "/landing#features" },
  { name: "Solution", href: "/landing#solution" },
  { name: "Security", href: "/landing#security" },
  { name: "Pricing", href: "/pricing" },
  { name: "Docs", href: "/docs" },
];

function Header() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { profile } = useProfile();
  
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <nav className="mx-auto max-w-6xl rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-200 shadow-lg">
        <div className="px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo dark />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "text-sm transition-colors",
                  item.href === "/pricing" ? "text-orange-600 font-medium" : "text-zinc-600 hover:text-zinc-900"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full bg-zinc-200 animate-pulse" />
            ) : user ? (
              <>
                <Link 
                  href="/tool" 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
                >
                  Go to App
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/settings" className="flex items-center gap-2">
                  <Avatar 
                    src={profile?.avatar_url} 
                    fallback={displayName[0]?.toUpperCase() || 'U'} 
                    size={32}
                    className="border border-zinc-200"
                  />
                </Link>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button variant="orange" size="sm" asChild>
                  <Link href="/contact">Book a Demo</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-zinc-200 px-6 py-4">
            <div className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-zinc-600 hover:text-zinc-900 transition-colors py-2"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4 border-t border-zinc-200">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 py-2">
                      <Avatar 
                        src={profile?.avatar_url} 
                        fallback={displayName[0]?.toUpperCase() || 'U'} 
                        size={32}
                        className="border border-zinc-200"
                      />
                      <span className="text-sm font-medium text-zinc-700">{displayName}</span>
                    </div>
                    <Button variant="orange" asChild className="w-full">
                      <Link href="/tool">Go to App</Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button variant="orange" asChild className="w-full">
                      <Link href="/contact">Book a Demo</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════
// PRICING PAGE
// ═══════════════════════════════════════════════════════════════

// Placeholder - user will provide the actual demo project URL
const DEMO_PROJECT_URL = "#demo";

export default function PricingPage() {
  const plans = [
    {
      name: "Sandbox",
      subtitle: "Explore the demo",
      price: "$0",
      period: "",
      description: "See how Replay works with our interactive demo project. No signup required.",
      features: [
        { name: "Interactive demo (read-only)", included: true },
        { name: "Flow Map & Library preview", included: true },
        { name: "Code preview", included: true },
        { name: "Upload your own video", included: false },
        { name: "Export code", included: false },
      ],
      cta: "Explore Demo",
      href: DEMO_PROJECT_URL,
      variant: "outline" as const,
      popular: false
    },
    {
      name: "Pro",
      subtitle: "For solo freelancers",
      price: "$149",
      period: "/month",
      description: "1 active project. Unlimited iterations. Perfect for individual modernization projects.",
      features: [
        { name: "1 active project", included: true },
        { name: "Unlimited iterations", included: true },
        { name: "React + Tailwind export", included: true },
        { name: "Design System generation", included: true },
        { name: "Email support", included: true },
      ],
      cta: "Get Started",
      href: "/login?plan=pro",
      variant: "orange" as const,
      popular: true
    },
    {
      name: "Agency",
      subtitle: "For software houses",
      price: "$499",
      period: "/month",
      description: "10 active projects. 5 team members. Built for agencies handling multiple clients.",
      features: [
        { name: "10 active projects", included: true },
        { name: "5 team members", included: true },
        { name: "Shared Design System", included: true },
        { name: "Priority GPU queue", included: true },
        { name: "Priority support", included: true },
      ],
      cta: "Get Started",
      href: "/login?plan=agency",
      variant: "outline" as const,
      popular: false
    },
    {
      name: "Enterprise",
      subtitle: "For banks & enterprise",
      price: "Custom",
      period: "",
      description: "Unlimited projects. On-premise deployment. Full security compliance.",
      features: [
        { name: "Unlimited projects", included: true },
        { name: "On-premise / Private Cloud", included: true },
        { name: "SSO / SAML integration", included: true },
        { name: "SLA & Security audit", included: true },
        { name: "Dedicated account manager", included: true },
      ],
      cta: "Book a Demo",
      href: "/contact",
      variant: "dark-outline" as const,
      popular: false
    }
  ];

  // Comparison table data
  const comparisonFeatures = [
    { name: "Active Projects", sandbox: "Demo only", pro: "1", agency: "10", enterprise: "Unlimited" },
    { name: "Team Members", sandbox: "1", pro: "1", agency: "5", enterprise: "Unlimited" },
    { name: "Iterations", sandbox: "-", pro: "Unlimited", agency: "Unlimited", enterprise: "Unlimited" },
    { name: "Code Export", sandbox: false, pro: true, agency: true, enterprise: true },
    { name: "Design System", sandbox: "Preview", pro: true, agency: "Shared", enterprise: "Custom" },
    { name: "Support", sandbox: "-", pro: "Email", agency: "Priority", enterprise: "Dedicated + SLA" },
    { name: "Priority GPU", sandbox: false, pro: false, agency: true, enterprise: true },
    { name: "On-premise Deployment", sandbox: false, pro: false, agency: false, enterprise: true },
    { name: "SSO / SAML", sandbox: false, pro: false, agency: false, enterprise: true },
    { name: "Security Audit", sandbox: false, pro: false, agency: false, enterprise: true },
  ];

  return (
    <div className="min-h-screen bg-[#fffbf7]">
      <Header />
      
      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-zinc-900 mb-6">
              Simple, transparent{" "}
              <span className="italic text-orange-600">pricing</span>
            </h1>
            <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
              Explore the demo free. Pay when you're ready to build.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-24">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1",
                  plan.popular 
                    ? "bg-zinc-900 text-white border-orange-500 shadow-xl shadow-orange-500/20 hover:shadow-2xl hover:shadow-orange-500/30" 
                    : "bg-white border-zinc-200 hover:shadow-lg hover:shadow-zinc-200/50"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-orange-500 text-white text-xs font-medium rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className={cn(
                    "text-2xl font-semibold mb-1",
                    plan.popular ? "text-white" : "text-zinc-900"
                  )}>{plan.name}</h3>
                  <p className={cn(
                    "text-sm mb-4",
                    plan.popular ? "text-zinc-400" : "text-zinc-500"
                  )}>{plan.subtitle}</p>
                  
                  <div className="flex items-baseline gap-1">
                    <span className={cn(
                      "font-serif text-5xl",
                      plan.popular ? "text-white" : "text-zinc-900"
                    )}>{plan.price}</span>
                    <span className={cn(
                      "text-sm",
                      plan.popular ? "text-zinc-400" : "text-zinc-500"
                    )}>{plan.period}</span>
                  </div>
                  <p className={cn(
                    "mt-4 text-sm leading-relaxed",
                    plan.popular ? "text-zinc-400" : "text-zinc-500"
                  )}>{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className={cn(
                          "w-5 h-5 flex-shrink-0",
                          plan.popular ? "text-orange-400" : "text-orange-500"
                        )} />
                      ) : (
                        <Minus className="w-5 h-5 flex-shrink-0 text-zinc-400" />
                      )}
                      <span className={cn(
                        "text-sm",
                        feature.included 
                          ? plan.popular ? "text-white" : "text-zinc-700"
                          : "text-zinc-400"
                      )}>{feature.name}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant={plan.variant} 
                  className={cn(
                    "w-full",
                    plan.popular && "bg-orange-500 hover:bg-orange-600 text-white"
                  )}
                  size="lg"
                  asChild
                >
                  <Link href={plan.href}>
                    {plan.cta}
                    {plan.name !== "Enterprise" && plan.name !== "Sandbox" && <ArrowRight className="ml-2 w-4 h-4" />}
                    {plan.name === "Enterprise" && <PhoneCall className="ml-2 w-4 h-4" />}
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-5xl mx-auto"
          >
            <h2 className="font-serif text-3xl text-zinc-900 text-center mb-8">Compare all features</h2>
            
            <div className="overflow-x-auto bg-white rounded-2xl border border-zinc-200 shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left py-5 px-4 font-medium text-zinc-500 text-sm">Features</th>
                    <th className="text-center py-5 px-4 font-semibold text-zinc-600">Sandbox</th>
                    <th className="text-center py-5 px-4 font-semibold text-orange-600 bg-orange-50">Pro</th>
                    <th className="text-center py-5 px-4 font-semibold text-zinc-900">Agency</th>
                    <th className="text-center py-5 px-4 font-semibold text-zinc-900">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature) => (
                    <tr key={feature.name} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                      <td className="py-4 px-4 text-sm text-zinc-700">{feature.name}</td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.sandbox === "boolean" ? (
                          feature.sandbox ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <Minus className="w-5 h-5 text-zinc-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-zinc-500">{feature.sandbox}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center bg-orange-50/50">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? (
                            <Check className="w-5 h-5 text-orange-500 mx-auto" />
                          ) : (
                            <Minus className="w-5 h-5 text-zinc-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-zinc-600">{feature.pro}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.agency === "boolean" ? (
                          feature.agency ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <Minus className="w-5 h-5 text-zinc-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-zinc-600">{feature.agency}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.enterprise === "boolean" ? (
                          feature.enterprise ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : (
                            <Minus className="w-5 h-5 text-zinc-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-sm text-zinc-600">{feature.enterprise}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* FAQ CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center mt-16"
          >
            <p className="text-zinc-600 mb-4">Have questions about which plan is right for you?</p>
            <Button variant="orange" size="lg" asChild>
              <Link href="/contact">
                Talk to Sales
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-zinc-900 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            </div>
            
            <p className="text-sm text-zinc-600">
              © 2026 Replay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
