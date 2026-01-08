"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Loader2, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
}

type AuthMode = "select" | "email-otp" | "email-password" | "otp-verify" | "otp-verify-register" | "register";

export default function AuthModal({
  isOpen,
  onClose,
  title = "Sign in to generate",
  description = "Your credits and projects are saved to your account.",
}: AuthModalProps) {
  const { signInWithGoogle, signInWithGitHub, signInWithEmail, signInWithPassword, signUpWithPassword, verifyOtp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<"google" | "github" | "email" | "password" | "register" | "verify" | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("select");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setLoadingProvider("google");
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Failed to sign in with Google");
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    setLoadingProvider("github");
    setError(null);
    try {
      await signInWithGitHub();
    } catch (err) {
      setError("Failed to sign in with GitHub");
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleEmailSignIn = async () => {
    if (!email.trim()) return;
    
    setIsLoading(true);
    setLoadingProvider("email");
    setError(null);
    
    const result = await signInWithEmail(email.trim());
    
    if (result.error) {
      setError(result.error);
    } else {
      setAuthMode("otp-verify");
      setOtpCode(["", "", "", "", "", ""]);
      // Focus first OTP input after render
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
    
    setIsLoading(false);
    setLoadingProvider(null);
  };

  const handlePasswordSignIn = async () => {
    if (!email.trim() || !password.trim()) return;
    
    setIsLoading(true);
    setLoadingProvider("password");
    setError(null);
    
    const result = await signInWithPassword(email.trim(), password.trim());
    
    if (result.error) {
      setError(result.error);
    } else {
      handleClose();
    }
    
    setIsLoading(false);
    setLoadingProvider(null);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password.trim()) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setIsLoading(true);
    setLoadingProvider("register");
    setError(null);
    
    // First register with Supabase
    const result = await signUpWithPassword(email.trim(), password.trim());
    
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      setLoadingProvider(null);
      return;
    }
    
    // Send verification code via Resend
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), action: "send" }),
      });
      
      if (res.ok) {
        // Show OTP verification screen for registration
        setAuthMode("otp-verify-register");
        setOtpCode(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        setSuccessMessage(null);
      } else {
        // Fallback message if email fails
        setSuccessMessage("Account created! Check your email to confirm your account.");
        setAuthMode("email-password");
        setPassword("");
      }
    } catch (e) {
      setSuccessMessage("Account created! Check your email to confirm your account.");
      setAuthMode("email-password");
      setPassword("");
    }
    
    setIsLoading(false);
    setLoadingProvider(null);
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all digits entered
    if (value && index === 5 && newOtp.every(d => d !== "")) {
      handleVerifyOtp(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && otpCode.every(d => d !== "")) {
      handleVerifyOtp(otpCode.join(""));
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newOtp = pasted.split("");
      setOtpCode(newOtp);
      handleVerifyOtp(pasted);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setIsLoading(true);
    setLoadingProvider("verify");
    setError(null);
    
    // Check if this is registration verification (using our API) or magic link (using Supabase)
    if (authMode === "otp-verify-register") {
      // Verify with our Resend-based API
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), code, action: "verify" }),
        });
        
        const data = await res.json();
        
        if (res.ok && data.verified) {
          // Email verified! Now sign them in
          const signInResult = await signInWithPassword(email.trim(), password);
          if (signInResult.error) {
            setError(signInResult.error);
          } else {
            handleClose();
          }
        } else {
          setError(data.error || "Invalid code");
          setOtpCode(["", "", "", "", "", ""]);
          otpRefs.current[0]?.focus();
        }
      } catch (e) {
        setError("Verification failed. Please try again.");
        setOtpCode(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      }
    } else {
      // Magic link verification via Supabase
      const result = await verifyOtp(email.trim(), code);
      
      if (result.error) {
        setError(result.error);
        setOtpCode(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        handleClose();
      }
    }
    
    setIsLoading(false);
    setLoadingProvider(null);
  };

  const handleBack = () => {
    if (authMode === "otp-verify") {
      setAuthMode("email-otp");
    } else if (authMode === "otp-verify-register") {
      setAuthMode("register");
    } else {
      setAuthMode("select");
    }
    setOtpCode(["", "", "", "", "", ""]);
    setError(null);
    setSuccessMessage(null);
  };

  const handleResendRegistrationCode = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), action: "send" }),
      });
      if (res.ok) {
        setSuccessMessage("New code sent!");
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError("Failed to resend code");
      }
    } catch (e) {
      setError("Failed to resend code");
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setAuthMode("select");
    setOtpCode(["", "", "", "", "", ""]);
    setError(null);
    setSuccessMessage(null);
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
            className="fixed inset-0 bg-black/30 backdrop-blur-md z-50"
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
              </div>

              {/* Content */}
              <div className="text-center mb-8">
                <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
                <p className="text-sm text-white/50">{description}</p>
              </div>

              {/* OTP Verification (both magic link and registration) */}
              {(authMode === "otp-verify" || authMode === "otp-verify-register") && (
                <div className="text-center py-4">
                  <button
                    onClick={handleBack}
                    className="absolute left-3 top-3 md:left-4 md:top-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white/40" />
                  </button>
                  
                  <div className="w-16 h-16 rounded-full bg-[#FF6E3C]/20 flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-[#FF6E3C]" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {authMode === "otp-verify-register" ? "Verify your email" : "Enter verification code"}
                  </h3>
                  <p className="text-sm text-white/50 mb-6">
                    We sent a 6-digit code to <span className="text-white">{email}</span>
                  </p>
                  
                  {/* OTP Input */}
                  <div className="flex justify-center gap-2 mb-4" onPaste={handleOtpPaste}>
                    {otpCode.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        disabled={isLoading}
                        className="w-11 h-14 text-center text-2xl font-bold rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#FF6E3C] transition-colors disabled:opacity-50"
                      />
                    ))}
                  </div>
                  
                  {loadingProvider === "verify" && (
                    <div className="flex items-center justify-center gap-2 text-white/50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Verifying...</span>
                    </div>
                  )}
                  
                  {error && (
                    <p className="text-sm text-red-400 mt-2">{error}</p>
                  )}
                  
                  <button
                    onClick={authMode === "otp-verify-register" ? handleResendRegistrationCode : handleEmailSignIn}
                    disabled={isLoading}
                    className="mt-4 text-sm text-[#FF6E3C] hover:text-[#FF8F5C] transition-colors disabled:opacity-50"
                  >
                    Resend code
                  </button>
                </div>
              )}

              {/* Email/Password Login */}
              {authMode === "email-password" && (
                <div className="space-y-3">
                  <button
                    onClick={handleBack}
                    className="absolute left-3 top-3 md:left-4 md:top-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white/40" />
                  </button>

                  {successMessage && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center mb-4">
                      {successMessage}
                    </div>
                  )}

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 transition-colors"
                    autoFocus
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePasswordSignIn()}
                      placeholder="Password"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    onClick={handlePasswordSignIn}
                    disabled={isLoading || !email.trim() || !password.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors disabled:opacity-50"
                  >
                    {loadingProvider === "password" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Lock className="w-5 h-5" />
                        Sign in
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-white/40">
                    Don't have an account?{" "}
                    <button 
                      onClick={() => { setAuthMode("register"); setError(null); setSuccessMessage(null); }}
                      className="text-[#FF6E3C] hover:text-[#FF8F5C]"
                    >
                      Create one
                    </button>
                  </p>

                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                </div>
              )}

              {/* Register */}
              {authMode === "register" && (
                <div className="space-y-3">
                  <button
                    onClick={handleBack}
                    className="absolute left-3 top-3 md:left-4 md:top-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white/40" />
                  </button>

                  <h3 className="text-lg font-medium text-white text-center mb-4">Create account</h3>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 transition-colors"
                    autoFocus
                  />
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                      placeholder="Password (min 6 characters)"
                      className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#FF6E3C]/50 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/50"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={isLoading || !email.trim() || !password.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#FF6E3C] text-white font-medium hover:bg-[#FF8F5C] transition-colors disabled:opacity-50"
                  >
                    {loadingProvider === "register" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Create account"
                    )}
                  </button>

                  <p className="text-center text-sm text-white/40">
                    Already have an account?{" "}
                    <button 
                      onClick={() => { setAuthMode("email-password"); setError(null); }}
                      className="text-[#FF6E3C] hover:text-[#FF8F5C]"
                    >
                      Sign in
                    </button>
                  </p>

                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                </div>
              )}

              {/* Main selection */}
              {authMode === "select" && (
                <div className="space-y-3">
                  {/* Google Button */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
                  >
                    {loadingProvider === "google" ? (
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

                  {/* GitHub Button */}
                  <button
                    onClick={handleGitHubSignIn}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-[#24292e] text-white font-medium hover:bg-[#2f363d] transition-colors disabled:opacity-50"
                  >
                    {loadingProvider === "github" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                      </svg>
                    )}
                    Continue with GitHub
                  </button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/10" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-[#111] text-white/30">or</span>
                    </div>
                  </div>

                  {/* Email/Password Button */}
                  <button
                    onClick={() => setAuthMode("email-password")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Lock className="w-5 h-5" />
                    Sign in with email & password
                  </button>

                  {/* Magic Link Button */}
                  <button
                    onClick={() => setAuthMode("email-otp")}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    Sign in with magic link
                  </button>

                  {/* Error */}
                  {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                  )}
                </div>
              )}

              {/* Email OTP (Magic Link) */}
              {authMode === "email-otp" && (
                <div className="space-y-3">
                  <button
                    onClick={handleBack}
                    className="absolute left-3 top-3 md:left-4 md:top-4 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white/40" />
                  </button>

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
                    {loadingProvider === "email" ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Send verification code
                      </>
                    )}
                  </button>

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

