import { Navbar } from "@/components/v2/Navbar";
import { Hero } from "@/components/v2/Hero";
import { SubHero } from "@/components/v2/SubHero";
import { ValueProp } from "@/components/v2/ValueProp";
import { UseCases } from "@/components/v2/UseCases";
import { Personas } from "@/components/v2/Personas";
import { VisualProof } from "@/components/v2/VisualProof";
import { Pricing } from "@/components/v2/Pricing";
import { Footer } from "@/components/v2/Footer";

export default function PageV2() {
  return (
    <div className="relative min-h-screen w-full bg-white font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-700">
      {/* Overlay to ensure light mode persists over global dark mode */}
      <div className="absolute inset-0 bg-white -z-10" />
      
      <Navbar />
      <main className="relative z-0 bg-white">
        <Hero />
        <SubHero />
        <ValueProp />
        <UseCases />
        <Personas />
        <VisualProof />
        <Pricing />
      </main>
      <Footer />
    </div>
  );
}
