import { Check, X, Sparkles } from "lucide-react";
import Link from "next/link";

const DEMO_PROJECT_URL = "https://www.replay.build/tool?project=flow_1769444036799_r8hrcxyx2";

const tiers = [
  {
    name: "Free",
    id: "free",
    price: "$0",
    period: "",
    description: "Try it free",
    features: [
      { text: "300 credits (2 generations)", included: true },
      { text: "Preview & Flow Map", included: true },
      { text: "30s max video", included: true },
      { text: "Upgrade for Code, Editor, Library", included: true },
    ],
    cta: "Try For Free",
    href: "/login",
    highlighted: false,
    badge: null,
  },
  {
    name: "Pro",
    id: "pro",
    price: "$149",
    period: "/mo",
    description: "For freelancers",
    features: [
      { text: "15,000 credits/month (~100 gens)", included: true },
      { text: "Unlimited projects", included: true },
      { text: "React + Tailwind export", included: true },
      { text: "Flow Map & Design System", included: true },
      { text: "AI editing (~10 credits/edit)", included: true },
    ],
    cta: "Get Started",
    href: "/login?plan=pro",
    highlighted: true,
    badge: "Popular",
  },
  {
    name: "Agency",
    id: "agency",
    price: "$499",
    period: "/mo",
    description: "For teams",
    features: [
      { text: "60,000 credits/month (~400 gens)", included: true },
      { text: "Unlimited projects", included: true },
      { text: "5 team members", included: true },
      { text: "Shared Design System", included: true },
      { text: "Priority GPU + API access", included: true },
    ],
    cta: "Get Started",
    href: "/login?plan=agency",
    highlighted: false,
    badge: null,
  },
  {
    name: "Enterprise",
    id: "enterprise",
    price: "Custom",
    period: "",
    description: "For banks & enterprise",
    features: [
      { text: "Custom credits", included: true },
      { text: "On-premise / Private Cloud", included: true },
      { text: "SSO / SAML integration", included: true },
      { text: "SLA & Security audit", included: true },
      { text: "Dedicated support", included: true },
    ],
    cta: "Book a Demo",
    href: "/contact",
    highlighted: false,
    badge: null,
  },
];

export function Pricing() {
  return (
    <section className="bg-white py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Explore the demo free. Pay when you're ready to build.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative rounded-3xl p-8 xl:p-10 ${
                tier.highlighted
                  ? "ring-2 ring-orange-500 bg-orange-50/50"
                  : "ring-1 ring-gray-200"
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white">
                    <Sparkles className="h-3 w-3" />
                    {tier.badge}
                  </span>
                </div>
              )}

              <h3
                className={`text-lg font-semibold leading-8 ${
                  tier.highlighted ? "text-orange-600" : "text-gray-900"
                }`}
              >
                {tier.name}
              </h3>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  {tier.price}
                </span>
                {tier.period && (
                  <span className="text-sm font-semibold leading-6 text-gray-600">
                    {tier.period}
                  </span>
                )}
              </p>

              <Link
                href={tier.href}
                className={`mt-6 block rounded-lg py-2.5 px-3 text-center text-sm font-semibold leading-6 transition-colors ${
                  tier.highlighted
                    ? "bg-orange-500 text-white shadow-sm hover:bg-orange-600"
                    : tier.id === "free"
                    ? "text-gray-700 ring-1 ring-inset ring-gray-300 hover:ring-gray-400 hover:bg-gray-50"
                    : tier.id === "enterprise"
                    ? "text-gray-700 ring-1 ring-inset ring-gray-300 hover:ring-gray-400 hover:bg-gray-50"
                    : "bg-gray-900 text-white shadow-sm hover:bg-gray-800"
                }`}
              >
                {tier.cta}
              </Link>

              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-x-3">
                    {feature.included ? (
                      <Check
                        className={`h-6 w-5 flex-none ${
                          tier.highlighted ? "text-orange-500" : "text-gray-900"
                        }`}
                        aria-hidden="true"
                      />
                    ) : (
                      <X className="h-6 w-5 flex-none text-gray-300" aria-hidden="true" />
                    )}
                    <span className={feature.included ? "" : "text-gray-400"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
