import Link from "next/link";
import Logo from "@/components/Logo";

export function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.05] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo />
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-xs text-white/30 hover:text-white/50 transition-colors">
              Terms of Service
            </Link>
            <p className="text-xs text-white/30">
              © 2025 Replay
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}


