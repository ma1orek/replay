"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Loader2,
  Check,
  Mail,
  Building2,
  MessageSquare,
  HelpCircle,
  Bug,
  Briefcase,
  ChevronDown,
  Home,
} from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";

const TOPICS = [
  { id: "enterprise", label: "Enterprise Inquiry", icon: Building2 },
  { id: "support", label: "Technical Support", icon: HelpCircle },
  { id: "bug", label: "Bug Report", icon: Bug },
  { id: "partnership", label: "Partnership", icon: Briefcase },
  { id: "other", label: "Other", icon: MessageSquare },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    topic: "enterprise",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact/enterprise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          company: formData.company,
          role: TOPICS.find(t => t.id === formData.topic)?.label || formData.topic,
          useCase: formData.message,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      setSubmitted(true);
    } catch (err) {
      setError("Something went wrong. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTopic = TOPICS.find(t => t.id === formData.topic);

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-900 relative overflow-hidden">
      {/* Animated background - light version */}
      <div className="absolute inset-0">
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,237,213,0.4) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)",
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <nav className="mx-auto max-w-4xl px-6 py-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-200/60 shadow-sm">
          <div className="flex items-center justify-between">
            <Link href="/landing" className="flex items-center gap-2">
              <Logo dark />
            </Link>
            <Link 
              href="/landing" 
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative pt-32 pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {submitted ? (
              /* Thank You State */
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", damping: 15 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 text-emerald-600" />
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-4xl font-bold mb-4 text-zinc-900"
                >
                  Message Sent!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-zinc-500 text-lg mb-8 max-w-md mx-auto"
                >
                  Thanks for reaching out, {formData.firstName}! We'll get back to you within 48 hours.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Link
                    href="/landing"
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors"
                  >
                    <Home className="w-5 h-5" />
                    Back to Home
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              /* Form State */
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Title */}
                <div className="text-center mb-12">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 text-zinc-900">Contact Us</h1>
                  <p className="text-zinc-500 text-lg">
                    Have a question or want to learn more about Enterprise?
                  </p>
                </div>

                {/* Direct Email Option */}
                <div className="mb-8 p-4 rounded-2xl bg-white border border-zinc-200/60 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-zinc-500">Prefer email? Write to us directly:</p>
                      <a
                        href="mailto:support@replay.build"
                        className="text-orange-600 hover:text-orange-500 font-medium transition-colors"
                      >
                        support@replay.build
                      </a>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-zinc-500 mb-2">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-zinc-500 mb-2">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all"
                      placeholder="john@company.com"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">Company *</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all"
                      placeholder="Acme Inc."
                    />
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">Topic *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                        className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 flex items-center justify-between focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {selectedTopic && <selectedTopic.icon className="w-4 h-4 text-zinc-500" />}
                          <span>{selectedTopic?.label}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-zinc-400 transition-transform", showTopicDropdown && "rotate-180")} />
                      </button>
                      
                      {showTopicDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 rounded-xl overflow-hidden z-10 shadow-lg">
                          {TOPICS.map((topic) => (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, topic: topic.id });
                                setShowTopicDropdown(false);
                              }}
                              className={cn(
                                "w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-50 transition-colors text-left",
                                formData.topic === topic.id && "bg-orange-50 text-orange-600"
                              )}
                            >
                              <topic.icon className="w-4 h-4" />
                              {topic.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm text-zinc-500 mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all resize-none"
                      placeholder="Tell us about your project or question..."
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-zinc-900 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 shadow-lg shadow-zinc-900/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
