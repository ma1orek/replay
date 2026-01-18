import { Check } from "lucide-react";

export function Pricing() {
  return (
    <section className="bg-white py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Start for free, upgrade when you need to ship.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Free */}
          <div className="rounded-3xl p-8 ring-1 ring-gray-200 xl:p-10">
            <h3 className="text-lg font-semibold leading-8 text-gray-900">Free</h3>
            <p className="mt-4 text-sm leading-6 text-gray-600">Preview the magic.</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">$0</span>
            </p>
            <a
              href="#"
              className="mt-6 block rounded-lg py-2.5 px-3 text-center text-sm font-semibold leading-6 text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Try for free
            </a>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                1 generation
              </li>
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Public projects only
              </li>
            </ul>
          </div>

          {/* Maker */}
          <div className="rounded-3xl p-8 ring-1 ring-gray-200 bg-gray-50 xl:p-10">
            <h3 className="text-lg font-semibold leading-8 text-gray-900">Maker</h3>
            <p className="mt-4 text-sm leading-6 text-gray-600">One-off export.</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">$9</span>
              <span className="text-sm font-semibold leading-6 text-gray-600">/project</span>
            </p>
            <a
              href="#"
              className="mt-6 block rounded-lg bg-indigo-600 py-2.5 px-3 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get started
            </a>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Full code export
              </li>
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                1 Project
              </li>
              <li className="flex gap-x-3 text-gray-400">
                <Check className="h-6 w-5 flex-none text-gray-400" aria-hidden="true" />
                No iteration (One-shot)
              </li>
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-3xl p-8 ring-1 ring-indigo-600 xl:p-10 bg-indigo-50/50">
            <h3 className="text-lg font-semibold leading-8 text-indigo-600">Pro</h3>
            <p className="mt-4 text-sm leading-6 text-gray-600">Iterative workflow.</p>
            <p className="mt-6 flex items-baseline gap-x-1">
              <span className="text-4xl font-bold tracking-tight text-gray-900">$25</span>
              <span className="text-sm font-semibold leading-6 text-gray-600">/mo</span>
            </p>
            <a
              href="#"
              className="mt-6 block rounded-lg bg-indigo-600 py-2.5 px-3 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Subscribe
            </a>
            <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Unlimited rebuilds
              </li>
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Private projects
              </li>
              <li className="flex gap-x-3">
                <Check className="h-6 w-5 flex-none text-indigo-600" aria-hidden="true" />
                Priority Support
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
