"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  title = "Sign in to generate",
  description = "Your credits and projects are saved to your account.",
}: AuthModalProps) {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Failed to sign in with Google");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    const result = await signInWithEmail(email.trim());
    
    if (result.error) {
      setError(result.error);
    } else {
      setEmailSent(true);
    }
    
    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail("");
    setShowEmailInput(false);
    setEmailSent(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
          />
          
          {/* Modal - Centered and responsive */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-3 top-3 md:right-4 md:top-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>

              {/* Replay Logo */}
              <div className="flex justify-center mb-6">
                <Logo />

              {/* Content */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
                <p className="text-sm text-white/50">{description}</p>
              </div>

              {emailSent ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-[#FF6E3C]/20 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-[#FF6E3C]" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Check your email</h3>
                  <p className="text-sm text-white/50">
                    We sent a magic link to <span className="text-white">{email}</span>
                  </p>
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail("");
                    }}
                    className="mt-4 text-sm text-[#FF6E3C] hover:text-[#FF8F5C] transition-colors"
                  >
                    Use a different email
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Google Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                    )}
                    Continue with Google
                  </button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-[#0a0a0a] text-white/30">or</span>
                    </div>
                  </div>

                  {/* Email Input */}
                  {showEmailInput ? (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 transition-colors"
                        autoFocus
                      />
                      <button
                        onClick={handleEmailSignIn}
                        disabled={isLoading || !email.trim()}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-5 h-5" />
                            Send magic link
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowEmailInput(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <Mail className="w-5 h-5" />
                      Continue with email
                    </button>
                  )}

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                </div>
              )}

              {/* Footer */}
              <p className="mt-6 text-[10px] md:text-xs text-white/30 text-center">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

