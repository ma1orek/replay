"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Clock, Calendar, Tag, Share2, Copy, Check, 
  BookOpen, ArrowUp, Twitter, Linkedin, ExternalLink,
  Lightbulb, AlertTriangle, FileText, CheckCircle, XCircle
} from "lucide-react";
import Logo from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description: string;
  target_keyword: string;
  status: string;
  read_time_minutes: number;
  seo_score: number;
  created_at: string;
  published_at: string | null;
}

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

// Generate table of contents from markdown
function generateTOC(content: string): TOCItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const toc: TOCItem[] = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/\*\*/g, '').trim();
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    toc.push({ id, text, level });
  }
  
  return toc;
}

// Custom code block component
function CodeBlock({ className, children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";
  const code = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6">
      {/* Language badge */}
      <div className="absolute top-0 left-4 -translate-y-1/2 px-3 py-1 bg-[#FF6E3C] text-white text-xs font-mono rounded-full z-10">
        {language}
      </div>
      
      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>

      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        className="!bg-[#0d0d0d] !border !border-white/10 !rounded-xl !pt-8 !pb-4 !px-4 !my-0 !text-sm"
        customStyle={{
          margin: 0,
          background: '#0d0d0d',
        }}
        {...props}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// Inline code component
function InlineCode({ children }: any) {
  return (
    <code className="px-1.5 py-0.5 bg-[#FF6E3C]/10 text-[#FF6E3C] rounded font-mono text-sm">
      {children}
    </code>
  );
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Generate TOC from content
  const toc = useMemo(() => {
    if (!post?.content) return [];
    return generateTOC(post.content);
  }, [post?.content]);

  useEffect(() => {
    const fetchPost = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!error && data) {
        setPost(data);
      }
      setLoading(false);
    };

    if (slug) {
      fetchPost();
    }
  }, [slug]);

  // Scroll tracking for TOC and scroll-to-top
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
      
      // Find active section
      const sections = toc.map(item => document.getElementById(item.id));
      const scrollPos = window.scrollY + 150;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(toc[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [toc]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#FF6E3C] border-t-transparent" />
          <p className="text-white/40 text-sm">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center">
        <div className="text-6xl mb-4">📄</div>
        <h1 className="text-2xl font-bold text-white mb-2">Article not found</h1>
        <p className="text-white/40 mb-6">This article may have been moved or deleted.</p>
        <Link href="/blog" className="text-[#FF6E3C] hover:underline flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back to blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/blog" className="text-white/40 hover:text-white/60 text-sm transition-colors">
              Blog
            </Link>
            <Link
              href="/tool"
              className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white hover:opacity-90 transition-opacity"
            >
              Try Replay
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-12">
          {/* Main Content */}
          <article>
            {/* Back link */}
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 text-sm mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Blog
            </Link>

            {/* Meta */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-3 text-sm text-white/40 mb-6"
            >
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.read_time_minutes} min read
              </span>
              {post.target_keyword && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FF6E3C]/10 text-[#FF6E3C] rounded-full text-xs font-medium">
                    <Tag className="w-3 h-3" />
                    {post.target_keyword}
                  </span>
                </>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-8 leading-[1.15] tracking-tight"
            >
              {post.title}
            </motion.h1>

            {/* Author & Share */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex items-center justify-between py-6 border-y border-white/5 mb-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6E3C] to-[#FF8F5C] flex items-center justify-center text-white font-bold">
                  R
                </div>
                <div>
                  <div className="text-white font-medium text-sm">Replay Team</div>
                  <div className="text-white/40 text-xs">Developer Advocates</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                  title="Share on Twitter"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                  title="Share on LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <button
                  onClick={handleCopyLink}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"
                  title="Copy link"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="prose prose-invert prose-lg max-w-none article-content"
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom heading with IDs for TOC
                  h2: ({ children }) => {
                    const text = String(children).replace(/\*\*/g, '');
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h2 id={id} className="text-2xl md:text-3xl font-bold text-white mt-14 mb-5 scroll-mt-24 flex items-center gap-3 group">
                        {children}
                        <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-[#FF6E3C] transition-opacity">
                          #
                        </a>
                      </h2>
                    );
                  },
                  h3: ({ children }) => {
                    const text = String(children).replace(/\*\*/g, '');
                    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    return (
                      <h3 id={id} className="text-xl md:text-2xl font-semibold text-white mt-10 mb-4 scroll-mt-24 flex items-center gap-3 group">
                        {children}
                        <a href={`#${id}`} className="opacity-0 group-hover:opacity-100 text-[#FF6E3C] transition-opacity text-lg">
                          #
                        </a>
                      </h3>
                    );
                  },
                  // Code blocks with syntax highlighting
                  code: ({ inline, className, children, ...props }: any) => {
                    if (inline) {
                      return <InlineCode>{children}</InlineCode>;
                    }
                    return <CodeBlock className={className} {...props}>{children}</CodeBlock>;
                  },
                  // Enhanced blockquotes (for TL;DR, tips, warnings)
                  blockquote: ({ children }) => {
                    const text = String(children);
                    let icon = null;
                    let borderColor = "border-[#FF6E3C]";
                    let bgColor = "bg-[#FF6E3C]/5";
                    
                    if (text.includes("💡") || text.includes("Pro Tip")) {
                      icon = <Lightbulb className="w-5 h-5 text-amber-400" />;
                      borderColor = "border-amber-400/50";
                      bgColor = "bg-amber-400/5";
                    } else if (text.includes("⚠️") || text.includes("Warning")) {
                      icon = <AlertTriangle className="w-5 h-5 text-red-400" />;
                      borderColor = "border-red-400/50";
                      bgColor = "bg-red-400/5";
                    } else if (text.includes("📝") || text.includes("Note")) {
                      icon = <FileText className="w-5 h-5 text-blue-400" />;
                      borderColor = "border-blue-400/50";
                      bgColor = "bg-blue-400/5";
                    } else if (text.includes("TL;DR") || text.includes("TLDR")) {
                      icon = <BookOpen className="w-5 h-5 text-[#FF6E3C]" />;
                    }
                    
                    return (
                      <blockquote className={`my-6 p-5 border-l-4 ${borderColor} ${bgColor} rounded-r-xl not-prose`}>
                        <div className="flex items-start gap-3">
                          {icon && <div className="flex-shrink-0 mt-0.5">{icon}</div>}
                          <div className="text-white/80 text-base leading-relaxed [&>p]:m-0 [&>strong]:text-white">
                            {children}
                          </div>
                        </div>
                      </blockquote>
                    );
                  },
                  // Enhanced tables
                  table: ({ children }) => (
                    <div className="my-8 overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full text-sm not-prose">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-[#FF6E3C]/10 border-b border-white/10">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-4 py-3 text-left text-white font-semibold text-sm">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => {
                    const text = String(children);
                    // Handle emoji indicators
                    if (text === "✅") return <td className="px-4 py-3 text-emerald-400">{children}</td>;
                    if (text === "❌") return <td className="px-4 py-3 text-red-400">{children}</td>;
                    if (text === "Partial" || text === "⚠️") return <td className="px-4 py-3 text-amber-400">{children}</td>;
                    return <td className="px-4 py-3 text-white/70 border-t border-white/5">{children}</td>;
                  },
                  // Paragraphs
                  p: ({ children }) => (
                    <p className="text-white/70 leading-relaxed mb-5 text-[17px]">
                      {children}
                    </p>
                  ),
                  // Lists
                  ul: ({ children }) => (
                    <ul className="my-5 space-y-2 text-white/70">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="my-5 space-y-2 text-white/70 list-decimal list-inside">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="flex items-start gap-3 text-[17px]">
                      <span className="text-[#FF6E3C] mt-2">•</span>
                      <span className="flex-1">{children}</span>
                    </li>
                  ),
                  // Links
                  a: ({ href, children }) => (
                    <a 
                      href={href} 
                      target={href?.startsWith('http') ? '_blank' : undefined}
                      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="text-[#FF6E3C] hover:text-[#FF8F5C] underline underline-offset-2 transition-colors inline-flex items-center gap-1"
                    >
                      {children}
                      {href?.startsWith('http') && <ExternalLink className="w-3 h-3" />}
                    </a>
                  ),
                  // Strong text
                  strong: ({ children }) => (
                    <strong className="text-white font-semibold">{children}</strong>
                  ),
                  // Horizontal rule
                  hr: () => (
                    <hr className="my-10 border-white/10" />
                  ),
                  // Images - hide placeholder images from AI
                  img: () => null,
                }}
              >
                {post.content}
              </ReactMarkdown>
            </motion.div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16 p-8 md:p-10 bg-gradient-to-br from-[#FF6E3C]/10 via-transparent to-[#FF8F5C]/5 border border-[#FF6E3C]/20 rounded-2xl"
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Ready to try Replay?
                  </h3>
                  <p className="text-white/60">
                    Transform any video recording into working code with AI-powered behavior reconstruction.
                  </p>
                </div>
                <Link
                  href="/tool"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white hover:opacity-90 transition-opacity whitespace-nowrap"
                >
                  Launch Replay Free
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          </article>

          {/* Sidebar - Table of Contents */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              {toc.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl"
                >
                  <div className="flex items-center gap-2 text-white font-medium mb-4 pb-3 border-b border-white/5">
                    <BookOpen className="w-4 h-4 text-[#FF6E3C]" />
                    Table of Contents
                  </div>
                  <nav className="space-y-1">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block py-1.5 text-sm transition-colors ${
                          item.level === 3 ? "pl-4" : ""
                        } ${
                          activeSection === item.id
                            ? "text-[#FF6E3C] font-medium"
                            : "text-white/40 hover:text-white/70"
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </motion.div>
              )}


              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl"
              >
                <div className="text-white/40 text-xs uppercase tracking-wider mb-3">Share Article</div>
                <div className="flex gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-3 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Twitter className="w-4 h-4" />
                    Tweet
                  </a>
                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 p-3 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 text-[#0A66C2] transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Linkedin className="w-4 h-4" />
                    Share
                  </a>
                </div>
              </motion.div>
            </div>
          </aside>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-[#FF6E3C] text-white shadow-lg hover:bg-[#FF8F5C] transition-colors z-40"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <Link href="/blog" className="hover:text-white/50 transition-colors">Blog</Link>
            <Link href="/docs" className="hover:text-white/50 transition-colors">Docs</Link>
            <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          </div>
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Replay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
