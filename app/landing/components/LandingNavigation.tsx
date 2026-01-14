"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Settings, LogOut, ChevronRight, History } from "lucide-react";
import Logo from "@/components/Logo";
import AuthModal from "@/components/modals/AuthModal";
import { useAuth } from "@/lib/auth/context";
import { useCredits } from "@/lib/credits/context";
import { useProfile } from "@/lib/profile/context";

const NAV_ITEMS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
  { label: "Docs", href: "/docs" },
];

export default function LandingNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 100], ["rgba(3,3,3,0)", "rgba(3,3,3,0.9)"]);
  const headerBorder = useTransform(scrollY, [0, 100], ["rgba(255,255,255,0)", "rgba(255,255,255,0.05)"]);
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { totalCredits, membership } = useCredits();
  const { profile } = useProfile();
  
  // User display name and plan
  const meta = user?.user_metadata;
  const displayName = profile?.full_name || meta?.full_name || meta?.name || user?.email?.split('@')[0] || 'User';
  const plan = membership?.plan || "free";
  const isPaidPlan = plan === "pro" || plan === "agency" || plan === "enterprise";
  
  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  const scrollToSection = (href: string) => {
    setIsOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <motion.header
        style={{ backgroundColor: headerBg, borderBottomColor: headerBorder }}
        className="fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl"
      >
        <div className="mx-auto max-w-7xl px-6 w-full py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              item.href.startsWith('/') ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.href}
                  onClick={() => scrollToSection(item.href)}
                  className="text-sm text-white/50 hover:text-white transition-colors"
                >
                  {item.label}
                </button>
              )
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {/* Auth Section */}
            {user ? (
              <>
                {/* Desktop: Name + Badge + Profile Dropdown */}
                <div className="relative hidden sm:block" ref={profileMenuRef}>
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm font-medium text-white/80 max-w-[120px] truncate">{displayName}</span>
                    {isPaidPlan ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white uppercase">
                        {plan === "agency" ? "Agency" : plan === "enterprise" ? "Enterprise" : "Pro"}
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/10 text-white/50 uppercase">
                        Free
                      </span>
                    )}
                  </button>
                  
                  {/* Profile Dropdown */}
                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                      >
                        {/* Credits section */}
                        {(() => {
                          const maxCredits = plan === "agency" ? 10000 : plan === "pro" ? 3000 : 100;
                          const percentage = Math.min(100, (totalCredits / maxCredits) * 100);
                          return (
                            <Link 
                              href="/settings?tab=plans"
                              onClick={() => setShowProfileMenu(false)}
                              className="block p-4 hover:bg-white/5 transition-colors border-b border-white/5"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-white">{totalCredits} credits</span>
                                  {isPaidPlan ? (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white uppercase">
                                      {plan === "agency" ? "Agency" : plan === "enterprise" ? "Enterprise" : "Pro"}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/10 text-white/50 uppercase">
                                      Free
                                    </span>
                                  )}
                                </div>
                                <ChevronRight className="w-4 h-4 text-white/40" />
                              </div>
                              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              {isPaidPlan ? (
                                <div className="mt-2">
                                  <span className="text-xs text-white/40">Add credits →</span>
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <span className="text-xs text-[#FF6E3C] font-medium">Upgrade →</span>
                                </div>
                              )}
                            </Link>
                          );
                        })()}
                        
                        <Link 
                          href="/tool"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                          <History className="w-4 h-4 opacity-50" />
                          Your Projects
                        </Link>
                        <Link 
                          href="/settings"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                        >
                          <Settings className="w-4 h-4 opacity-50" />
                          Settings
                        </Link>
                        <div className="border-t border-white/5">
                          <button 
                            onClick={() => { setShowProfileMenu(false); signOut(); }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/5 transition-colors"
                          >
                            <LogOut className="w-4 h-4 opacity-50" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Desktop: Launch App button */}
                <Link
                  href="/tool"
                  className="hidden sm:flex px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white hover:opacity-90 transition-opacity"
                >
                  Launch App
                </Link>
                
                {/* Mobile: Only Launch App + Menu (no name/badge) */}
                <div className="flex items-center gap-2 sm:hidden">
                  <Link
                    href="/tool"
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-[#FF6E3C] text-white"
                  >
                    Launch App
                  </Link>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Desktop: Sign in + Try Free */}
                <button
                  onClick={() => setShowAuthModal(true)}
                  disabled={authLoading}
                  className="hidden sm:flex px-4 py-2 rounded-xl text-sm text-white/70 border border-white/10 hover:border-white/20 hover:text-white transition-colors"
                >
                  Sign in
                </button>
                <Link
                  href="/tool"
                  className="hidden sm:flex px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white hover:opacity-90 transition-opacity"
                >
                  Try Replay Free
                </Link>
                
                {/* Mobile CTA + Menu */}
                <div className="flex items-center gap-2 sm:hidden">
                  <Link
                    href="/tool"
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-[#FF6E3C] text-white"
                  >
                    Try Free
                  </Link>
                  <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 bg-[#030303]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-4 space-y-2">
                {NAV_ITEMS.map((item) => (
                  item.href.startsWith('/') ? (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block w-full text-left py-3 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <button
                      key={item.href}
                      onClick={() => scrollToSection(item.href)}
                      className="block w-full text-left py-3 text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {item.label}
                    </button>
                  )
                ))}
                
                {/* Mobile Auth - same as tool */}
                {user ? (
                  <>
                    <div className="pt-2 border-t border-white/5 mt-2">
                      {/* Credits section */}
                      {(() => {
                        const maxCredits = plan === "agency" ? 10000 : plan === "pro" ? 3000 : 100;
                        const percentage = Math.min(100, (totalCredits / maxCredits) * 100);
                        return (
                          <Link 
                            href="/settings?tab=plans"
                            onClick={() => setIsOpen(false)}
                            className="block py-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-white">{totalCredits} credits</span>
                                {isPaidPlan ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white uppercase">
                                    {plan === "agency" ? "Agency" : plan === "enterprise" ? "Enterprise" : "Pro"}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-white/10 text-white/50 uppercase">
                                    Free
                                  </span>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-white/40" />
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            {isPaidPlan ? (
                              <div className="mt-2">
                                <span className="text-xs text-white/40">Add credits →</span>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <span className="text-xs text-[#FF6E3C] font-medium">Upgrade →</span>
                              </div>
                            )}
                          </Link>
                        );
                      })()}
                      
                      <Link
                        href="/tool"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 py-3 text-sm text-white/80 hover:text-white transition-colors"
                      >
                        <History className="w-4 h-4 opacity-50" />
                        Your Projects
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 py-3 text-sm text-white/80 hover:text-white transition-colors"
                      >
                        <Settings className="w-4 h-4 opacity-50" />
                        Settings
                      </Link>
                      <button
                        onClick={() => { setIsOpen(false); signOut(); }}
                        className="flex items-center gap-3 py-3 text-sm text-white/60 hover:text-white transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4 opacity-50" />
                        Sign out
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => { setIsOpen(false); setShowAuthModal(true); }}
                    disabled={authLoading}
                    className="block w-full text-left py-3 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    Sign in
                  </button>
                )}
                
                <Link
                  href="/tool"
                  className="block w-full text-center py-3 mt-4 rounded-xl text-sm font-medium bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white"
                >
                  Start Building
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
      
      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}
