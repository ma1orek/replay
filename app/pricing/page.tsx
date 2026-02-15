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
import { Navbar } from "@/components/landing/Navbar";

// ═══════════════════════════════════════════════════════════════
// TECH GRID BACKGROUND
// ═══════════════════════════════════════════════════════════════

const TechGrid = () => (
  <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
    <div 
      className="absolute inset-0 opacity-[0.02]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #808080 1px, transparent 1px),
          linear-gradient(to bottom, #808080 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
      }}
    />
    <div 
      className="absolute inset-0 opacity-[0.015]" 
      style={{
        backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}
    />
  </div>
);

// ═══════════════════════════════════════════════════════════════
// PRICING PAGE - DARK MODE TECHNICAL
// ═══════════════════════════════════════════════════════════════

export default function PricingPage() {
  const DEMO_PROJECT_URL = "https://www.replay.build/tool?project=flow_1769991250167_jr2x4utrt";
  const { user } = useAuth();
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);
  
  const handlePlanClick = async (plan: string, href: string) => {
    if (plan === "Free") {
      window.location.href = href;
      return;
    }
    
    if (plan === "Enterprise") {
      window.location.href = href;
      return;
    }
    
    if (!user) {
      window.location.href = href;
      return;
    }
    
    setLoadingPlan(plan);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "subscription", 
          plan: plan.toLowerCase(), 
          interval: "monthly" 
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
        alert("Error creating checkout session. Please try again.");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Error creating checkout session. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };
  
  const plans = [
    {
      name: "Free",
      subtitle: "Try it free",
      price: "$0",
      period: "",
      description: "300 credits (2 generations). Preview & Flow Map included. Upgrade to unlock code, editor, and library.",
      features: [
        { name: "300 credits (2 generations)", included: true },
        { name: "Preview & Flow Map", included: true },
        { name: "30 second max video", included: true },
        { name: "Upgrade for Code, Editor, Library", included: true },
      ],
      cta: "Try For Free",
      href: "/login",
      popular: false
    },
    {
      name: "Pro",
      subtitle: "For freelancers",
      price: "$149",
      period: "/month",
      description: "15,000 credits/month. Unlimited projects. ~100 video generations or 1,500 AI edits.",
      features: [
        { name: "15,000 credits/month (~100 gens)", included: true },
        { name: "Unlimited projects", included: true },
        { name: "React + Tailwind export", included: true },
        { name: "Flow Map & Design System", included: true },
        { name: "AI editing (~10 credits)", included: true },
      ],
      cta: "Get Started",
      href: "/login?plan=pro",
      popular: true
    },
    {
      name: "Agency",
      subtitle: "For teams",
      price: "$499",
      period: "/month",
      description: "60,000 credits/month. 5 team members. Built for agencies handling multiple clients.",
      features: [
        { name: "60,000 credits/month (~400 gens)", included: true },
        { name: "Unlimited projects", included: true },
        { name: "5 team members", included: true },
        { name: "Shared Design System", included: true },
        { name: "Priority GPU + API", included: true },
      ],
      cta: "Get Started",
      href: "/login?plan=agency",
      popular: false
    },
    {
      name: "Enterprise",
      subtitle: "For banks & enterprise",
      price: "Custom",
      period: "",
      description: "Custom credits. On-premise deployment. Full security compliance.",
      features: [
        { name: "Custom credits", included: true },
        { name: "On-premise / Private Cloud", included: true },
        { name: "SSO / SAML integration", included: true },
        { name: "SLA & Security audit", included: true },
        { name: "Dedicated support", included: true },
      ],
      cta: "Book a Demo",
      href: "/contact",
      popular: false
    }
  ];

  const comparisonFeatures = [
    { name: "Monthly Credits", sandbox: "300", pro: "15,000", agency: "60,000", enterprise: "Custom" },
    { name: "Video Generation", sandbox: "~150 credits", pro: "~150 credits", agency: "~150 credits", enterprise: "~150 credits" },
    { name: "AI Edit", sandbox: false, pro: "~10 credits", agency: "~10 credits", enterprise: "~10 credits" },
    { name: "Projects", sandbox: "1", pro: "Unlimited", agency: "Unlimited", enterprise: "Unlimited" },
    { name: "Team Members", sandbox: "1", pro: "1", agency: "5", enterprise: "Unlimited" },
    { name: "Code Export", sandbox: false, pro: true, agency: true, enterprise: true },
    { name: "Design System", sandbox: "View only", pro: true, agency: "Shared", enterprise: "Custom" },
    { name: "Support", sandbox: "—", pro: "Email", agency: "Priority", enterprise: "Dedicated + SLA" },
    { name: "Priority GPU", sandbox: false, pro: false, agency: true, enterprise: true },
    { name: "API Access", sandbox: false, pro: false, agency: true, enterprise: true },
    { name: "On-premise", sandbox: false, pro: false, agency: false, enterprise: true },
    { name: "SSO / SAML", sandbox: false, pro: false, agency: false, enterprise: true },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative">
      <TechGrid />
      <Navbar />
      
      <main className="pt-32 pb-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              Simple, transparent{" "}
              <span className="italic text-zinc-500">pricing</span>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              Explore the demo free. Pay when you're ready to build.
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-24">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={cn(
                  "relative p-6 border transition-all duration-300 hover:-translate-y-1",
                  plan.popular 
                    ? "bg-zinc-900 border-orange-500/50 shadow-xl shadow-orange-500/10" 
                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                )}
              >
                {/* Corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-700 opacity-50" />
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-700 opacity-50" />
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-700 opacity-50" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-700 opacity-50" />

                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-orange-500 text-white text-[10px] font-mono uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-zinc-500 font-mono mb-4">{plan.subtitle}</p>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-4xl text-white">{plan.price}</span>
                    <span className="text-sm text-zinc-500">{plan.period}</span>
                  </div>
                  <p className="mt-4 text-xs text-zinc-500 leading-relaxed">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-center gap-3">
                      {feature.included ? (
                        <Check className={cn(
                          "w-4 h-4 flex-shrink-0",
                          plan.popular ? "text-orange-500" : "text-zinc-500"
                        )} />
                      ) : (
                        <Minus className="w-4 h-4 flex-shrink-0 text-zinc-700" />
                      )}
                      <span className={cn(
                        "text-xs",
                        feature.included ? "text-zinc-300" : "text-zinc-600"
                      )}>{feature.name}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={cn(
                    "w-full font-mono text-xs tracking-wider",
                    plan.popular 
                      ? "bg-orange-500 hover:bg-orange-600 text-white border-0" 
                      : "bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  )}
                  size="lg"
                  onClick={() => handlePlanClick(plan.name, plan.href)}
                  disabled={loadingPlan === plan.name}
                >
                  {loadingPlan === plan.name ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {plan.cta}
                      {plan.name !== "Enterprise" && plan.name !== "Free" && <ArrowRight className="ml-2 w-4 h-4" />}
                      {plan.name === "Enterprise" && <PhoneCall className="ml-2 w-4 h-4" />}
                    </>
                  )}
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
            <h2 className="font-serif text-3xl text-white text-center mb-8">Compare all features</h2>
            
            <div className="overflow-x-auto border border-zinc-800">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="text-left py-4 px-4 font-mono text-xs text-zinc-500 uppercase tracking-wider">Features</th>
                    <th className="text-center py-4 px-4 font-mono text-xs text-zinc-400 uppercase tracking-wider">Free</th>
                    <th className="text-center py-4 px-4 font-mono text-xs text-orange-500 uppercase tracking-wider bg-orange-500/5">Pro</th>
                    <th className="text-center py-4 px-4 font-mono text-xs text-zinc-400 uppercase tracking-wider">Agency</th>
                    <th className="text-center py-4 px-4 font-mono text-xs text-zinc-400 uppercase tracking-wider">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature) => (
                    <tr key={feature.name} className="border-b border-zinc-900 hover:bg-zinc-900/30 transition-colors">
                      <td className="py-4 px-4 text-sm text-zinc-400">{feature.name}</td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.sandbox === "boolean" ? (
                          feature.sandbox ? (
                            <Check className="w-4 h-4 text-zinc-500 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-zinc-700 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-zinc-500 font-mono">{feature.sandbox}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center bg-orange-500/5">
                        {typeof feature.pro === "boolean" ? (
                          feature.pro ? (
                            <Check className="w-4 h-4 text-orange-500 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-zinc-700 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-zinc-300 font-mono">{feature.pro}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.agency === "boolean" ? (
                          feature.agency ? (
                            <Check className="w-4 h-4 text-zinc-500 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-zinc-700 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-zinc-400 font-mono">{feature.agency}</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof feature.enterprise === "boolean" ? (
                          feature.enterprise ? (
                            <Check className="w-4 h-4 text-zinc-500 mx-auto" />
                          ) : (
                            <Minus className="w-4 h-4 text-zinc-700 mx-auto" />
                          )
                        ) : (
                          <span className="text-xs text-zinc-400 font-mono">{feature.enterprise}</span>
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
            <p className="text-zinc-500 text-sm mb-4">Have questions about which plan is right for you?</p>
            <Button size="lg" asChild className="bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 font-mono text-xs tracking-wider">
              <Link href="/contact">
                Talk to Sales
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 bg-zinc-950 border-t border-zinc-900 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Logo />
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-600">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/docs" className="hover:text-white transition-colors">Documentation</Link>
              <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
            </div>
            
            <p className="text-sm text-zinc-700">
              © 2026 Replay. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
