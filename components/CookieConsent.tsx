"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import Link from "next/link";

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      // Small delay to not show immediately on page load
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "accepted");
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem("cookie_consent", "declined");
    localStorage.setItem("cookie_consent_date", new Date().toISOString());
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        >
          <div className="max-w-4xl mx-auto bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 shadow-2xl shadow-black/50">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Icon & Text */}
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-[#FF6E3C]/10 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-5 h-5 text-[#FF6E3C]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/80 leading-relaxed">
                    We use cookies to enhance your experience and analyze site usage.{" "}
                    <Link href="/privacy" className="text-[#FF6E3C] hover:underline">
                      Privacy Policy
                    </Link>
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <button
                  onClick={declineCookies}
                  className="flex-1 md:flex-none px-4 py-2 text-sm text-white/50 hover:text-white/80 transition-colors"
                >
                  Decline
                </button>
                <button
                  onClick={acceptCookies}
                  className="flex-1 md:flex-none px-5 py-2 text-sm font-medium bg-[#FF6E3C] hover:bg-[#FF8F5C] text-white rounded-lg transition-colors"
                >
                  Accept
                </button>
              </div>

              {/* Close button (mobile) */}
              <button
                onClick={declineCookies}
                className="absolute top-3 right-3 md:hidden p-1 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


