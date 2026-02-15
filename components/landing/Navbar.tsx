"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo, { LogoIcon } from "@/components/Logo";
import { useAuth } from "@/lib/auth/context";
import Avatar from "@/components/Avatar";
import { useProfile } from "@/lib/profile/context";

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "Solution", href: "#solution" },
  { name: "Security", href: "#security" },
  { name: "Pricing", href: "/pricing" },
  { name: "Docs", href: "/docs" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  const { profile } = useProfile();
  
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        setMobileMenuOpen(false);
      }
    }
  };

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.nav 
          className={cn(
            "flex items-center justify-between px-6 py-2 rounded-full transition-all duration-300 w-full",
            isScrolled 
              ? "bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 shadow-lg shadow-black/20 max-w-5xl" 
              : "bg-transparent max-w-7xl"
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {/* Simple logo swap without complex layout animation to avoid weirdness */}
            <div className={cn("transition-opacity duration-300", isScrolled ? "opacity-100" : "opacity-100")}>
               <Logo dark={false} />
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => scrollToSection(e, item.href)}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-3">
            {authLoading ? (
              <div className="w-8 h-8 rounded-full animate-pulse bg-zinc-800" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link 
                  href="/tool" 
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all bg-white text-zinc-950 hover:bg-zinc-200"
                >
                  Go to App
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/settings">
                  <Avatar 
                    src={profile?.avatar_url} 
                    fallback={displayName[0]?.toUpperCase() || 'U'} 
                    size={32}
                    className="border-2 border-zinc-800"
                  />
                </Link>
              </div>
            ) : (
              <>
                <Link 
                  href="/login"
                  className="px-4 py-2 text-sm font-medium transition-colors text-zinc-400 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-full text-sm font-medium transition-all bg-[#F97316] text-white hover:bg-[#EA580C]"
                >
                  Try For Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full transition-colors text-white hover:bg-white/10"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </motion.nav>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-4 top-20 z-40 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 md:hidden"
          >
            <div className="flex flex-col gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={(e) => scrollToSection(e, item.href)}
                  className="px-4 py-3 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <div className="h-px bg-zinc-800 my-2" />
              {user ? (
                <Link 
                  href="/tool" 
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white text-zinc-950 font-medium"
                >
                  Go to App
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-3 text-sm font-medium text-center text-zinc-400 hover:bg-zinc-800 rounded-xl">
                    Sign in
                  </Link>
                  <Link href="/login" className="px-4 py-3 text-sm font-medium text-center bg-[#F97316] text-white rounded-xl">
                    Try For Free
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
