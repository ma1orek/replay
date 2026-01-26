"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { DitheringShader } from "@/components/ui/dithering-shader";
import { useAuth } from "@/lib/auth/context";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type AuthMode = "select" | "email-otp" | "email-password" | "otp-verify" | "otp-verify-register" | "register";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planFromUrl = searchParams.get("plan"); // pro, agency
  const { user, signInWithGoogle, signInWithGitHub, signInWithEmail, signInWithPassword, signUpWithPassword, verifyOtp } = useAuth();
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
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ 
        width: window.innerWidth * 2, 
        height: window.innerHeight * 2 
      });
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // If user is already logged in and there's a plan in URL, redirect to checkout
  useEffect(() => {
    if (user && planFromUrl) {
      // User is logged in, redirect to checkout
      redirectToCheckout(planFromUrl);
    } else if (user && !planFromUrl) {
      // User is logged in but no plan, just go to tool
      router.push("/tool");
    }
  }, [user, planFromUrl, router]);

  // Store plan in localStorage for after login redirect
  useEffect(() => {
    if (planFromUrl) {
      localStorage.setItem("replay_pending_plan", planFromUrl);
    }
  }, [planFromUrl]);

  const redirectToCheckout = async (plan: string) => {
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: "subscription", 
          plan: plan, 
          interval: "monthly" 
        }),
      });
      
      const data = await response.json();
      
      if (data.url) {
        localStorage.removeItem("replay_pending_plan");
        window.location.href = data.url;
      } else {
        console.error("Checkout error:", data.error);
        router.push("/tool");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      router.push("/tool");
    }
  };

  const handleAuthSuccess = async () => {
    // Check if there's a pending plan to checkout
    const pendingPlan = localStorage.getItem("replay_pending_plan") || planFromUrl;
    
    if (pendingPlan && (pendingPlan === "pro" || pendingPlan === "agency")) {
      // Redirect to Stripe checkout
      await redirectToCheckout(pendingPlan);
    } else {
      router.push("/tool");
    }
  };

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
      handleAuthSuccess();
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
    
    const result = await signUpWithPassword(email.trim(), password.trim());
    
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      setLoadingProvider(null);
      return;
    }
    
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), action: "send" }),
      });
      
      if (res.ok) {
        setAuthMode("otp-verify-register");
        setOtpCode(["", "", "", "", "", ""]);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
        setSuccessMessage(null);
      } else {
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
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    
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
    
    if (authMode === "otp-verify-register") {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), code, action: "verify" }),
        });
        
        const data = await res.json();
        
        if (res.ok && data.verified) {
          const signInResult = await signInWithPassword(email.trim(), password);
          if (signInResult.error) {
            setError(signInResult.error);
          } else {
            handleAuthSuccess();
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
      const result = await verifyOtp(email.trim(), code);
      
      if (result.error) {
        setError(result.error);
        setOtpCode(["", "", "", "", "", ""]);
        otpRefs.current[0]?.focus();
      } else {
        handleAuthSuccess();
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

  return (
    <div className="min-h-screen bg-[#111111] flex items-center justify-center relative overflow-hidden">
      {/* Dithering Shader Background - same as hero but dark colors */}
      <div className="absolute inset-0 z-0">
        <DitheringShader
          width={dimensions.width}
          height={dimensions.height}
          shape="wave"
          type="8x8"
          colorBack="#111111"
          colorFront="#141414"
          pxSize={4}
          speed={0.3}
          className="w-full h-full"
          style={{ width: "100%", height: "100%" }}
        />
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/80 via-[#111111]/60 to-[#111111]/80" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md px-4"
      >
        {/* Card */}
        <div className="bg-[#141414] border border-zinc-800/50 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
          {/* Close/Back to home */}
          <Link 
            href="/"
            className="absolute right-4 top-4 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Link>

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo />
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
            <p className="text-sm text-zinc-500">Sign in to continue to Replay</p>
          </div>

          {/* OTP Verification */}
          {(authMode === "otp-verify" || authMode === "otp-verify-register") && (
            <div className="text-center">
              <button
                onClick={handleBack}
                className="absolute left-4 top-4 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {authMode === "otp-verify-register" ? "Verify your email" : "Enter verification code"}
              </h3>
              <p className="text-sm text-zinc-500 mb-6">
                We sent a 6-digit code to <span className="text-white">{email}</span>
              </p>
              
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
                    className="w-11 h-14 text-center text-2xl font-bold rounded-xl bg-zinc-800/80 border border-zinc-700 text-white focus:outline-none focus:border-orange-500 transition-colors disabled:opacity-50"
                  />
                ))}
              </div>
              
              {loadingProvider === "verify" && (
                <div className="flex items-center justify-center gap-2 text-zinc-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Verifying...</span>
                </div>
              )}
              
              {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
              
              <button
                onClick={authMode === "otp-verify-register" ? handleResendRegistrationCode : handleEmailSignIn}
                disabled={isLoading}
                className="mt-4 text-sm text-orange-500 hover:text-orange-400 transition-colors disabled:opacity-50"
              >
                Resend code
              </button>
            </div>
          )}

          {/* Email/Password Login */}
          {authMode === "email-password" && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="absolute left-4 top-4 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {successMessage && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center">
                  {successMessage}
                </div>
              )}

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                autoFocus
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePasswordSignIn()}
                  placeholder="Password"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-800/80 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={handlePasswordSignIn}
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                {loadingProvider === "password" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Sign in"
                )}
              </button>

              <p className="text-center text-sm text-zinc-500">
                Don't have an account?{" "}
                <button 
                  onClick={() => { setAuthMode("register"); setError(null); setSuccessMessage(null); }}
                  className="text-orange-500 hover:text-orange-400"
                >
                  Create one
                </button>
              </p>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            </div>
          )}

          {/* Register */}
          {authMode === "register" && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="absolute left-4 top-4 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-medium text-white text-center mb-4">Create account</h3>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                autoFocus
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                  placeholder="Password (min 6 characters)"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-zinc-800/80 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <button
                onClick={handleRegister}
                disabled={isLoading || !email.trim() || !password.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors disabled:opacity-50"
              >
                {loadingProvider === "register" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Create account"
                )}
              </button>

              <p className="text-center text-sm text-zinc-500">
                Already have an account?{" "}
                <button 
                  onClick={() => { setAuthMode("email-password"); setError(null); }}
                  className="text-orange-500 hover:text-orange-400"
                >
                  Sign in
                </button>
              </p>

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            </div>
          )}

          {/* Main selection */}
          {authMode === "select" && (
            <div className="space-y-3">
              {/* Google Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-white text-black font-medium hover:bg-zinc-100 transition-colors disabled:opacity-50"
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
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-full bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors disabled:opacity-50"
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
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#141414] text-zinc-500">or</span>
                </div>
              </div>

              {/* Email/Password Button */}
              <button
                onClick={() => setAuthMode("email-password")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Lock className="w-5 h-5" />
                Sign in with email & password
              </button>

              {/* Magic Link Button */}
              <button
                onClick={() => setAuthMode("email-otp")}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Sign in with magic link
              </button>

              {error && <p className="text-sm text-red-400 text-center mt-4">{error}</p>}
            </div>
          )}

          {/* Email OTP (Magic Link) */}
          {authMode === "email-otp" && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="absolute left-4 top-4 p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailSignIn()}
                placeholder="Enter your email"
                className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
                autoFocus
              />
              <button
                onClick={handleEmailSignIn}
                disabled={isLoading || !email.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors disabled:opacity-50"
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

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}
            </div>
          )}

          {/* Footer */}
          <p className="mt-8 text-xs text-zinc-600 text-center">
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-zinc-500 hover:text-zinc-400">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-zinc-500 hover:text-zinc-400">Privacy Policy</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
