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
  Calendar,
  ArrowRight,
  X,
} from "lucide-react";
import Logo from "@/components/Logo";
import { cn } from "@/lib/utils";
import { DitheringShader } from "@/components/ui/dithering-shader";

const CALENDLY_URL = "https://calendly.com/bartosz-replay/30min";

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
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      {/* Background - Technical Style */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div 
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #808080 1px, transparent 1px),
              linear-gradient(to bottom, #808080 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(to bottom, transparent, black 20%, black 80%, transparent)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-transparent to-zinc-950" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
        <nav className="mx-auto max-w-4xl px-6 py-4 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 shadow-lg shadow-black/20 flex items-center justify-between">
          <Link href="/landing" className="flex items-center gap-2">
            <Logo dark={false} />
          </Link>
          <Link 
            href="/landing" 
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </Link>
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
                  className="w-20 h-20 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                >
                  <Check className="w-10 h-10 text-emerald-500" />
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl md:text-4xl font-bold mb-4 text-white"
                >
                  Message Sent!
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-zinc-400 text-lg mb-8 max-w-md mx-auto"
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
                    className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-zinc-950 font-medium hover:bg-zinc-200 transition-colors"
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
                <div className="text-center mb-10">
                  <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white font-serif">Book a Demo</h1>
                  <p className="text-zinc-400 text-lg">
                    See how Replay can modernize your legacy systems
                  </p>
                </div>

                {/* Calendly CTA - Primary */}
                <div className="mb-10">
                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-center gap-3 w-full px-8 py-5 rounded-xl bg-orange-600 text-white font-semibold text-lg shadow-lg shadow-orange-900/20 hover:bg-orange-500 transition-all border border-orange-500"
                  >
                    <Calendar className="w-6 h-6" />
                    Schedule a Call with Founder
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </a>
                  <p className="text-center text-sm text-zinc-500 mt-3 font-mono">
                    30 min call • No commitment
                  </p>
                </div>

                {/* Divider */}
                <div className="relative mb-10">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-zinc-950 text-zinc-500 font-mono">
                      OR SEND A MESSAGE
                    </span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/30 p-8 rounded-2xl border border-zinc-800">
                  {/* Name Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-zinc-500 mb-2">FIRST NAME *</label>
                      <input
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-zinc-500 mb-2">LAST NAME *</label>
                      <input
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-2">EMAIL *</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="john@company.com"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-2">COMPANY *</label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all"
                      placeholder="Acme Inc."
                    />
                  </div>

                  {/* Topic */}
                  <div>
                    <label className="block text-xs font-mono text-zinc-500 mb-2">TOPIC *</label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                        className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white flex items-center justify-between focus:outline-none focus:border-zinc-700 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {selectedTopic && <selectedTopic.icon className="w-4 h-4 text-zinc-500" />}
                          <span className="text-zinc-300">{selectedTopic?.label}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-zinc-500 transition-transform", showTopicDropdown && "rotate-180")} />
                      </button>
                      
                      {showTopicDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden z-10 shadow-xl">
                          {TOPICS.map((topic) => (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, topic: topic.id });
                                setShowTopicDropdown(false);
                              }}
                              className={cn(
                                "w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-800 transition-colors text-left",
                                formData.topic === topic.id ? "text-white bg-zinc-800" : "text-zinc-400"
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
                    <label className="block text-xs font-mono text-zinc-500 mb-2">MESSAGE *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all resize-none"
                      placeholder="Tell us about your project..."
                    />
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-4 rounded-lg bg-red-950/30 border border-red-900/50 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white text-zinc-950 font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 shadow-lg"
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
