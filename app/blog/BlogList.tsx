"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Calendar, Tag, ChevronLeft, Search, BookOpen, TrendingUp, Zap } from "lucide-react";
import Logo from "@/components/Logo";

export interface BlogPost {
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
  tone?: string;
}

const TONES = [
  { value: "all", label: "All Posts", icon: BookOpen },
  { value: "technical", label: "Technical", icon: Zap },
  { value: "tutorial", label: "Tutorials", icon: TrendingUp },
  { value: "comparison", label: "Comparisons", icon: Search },
];

export default function BlogList({ initialPosts }: { initialPosts: BlogPost[] }) {
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter posts
  const filteredPosts = initialPosts.filter(post => {
    const matchesFilter = filter === "all" || post.tone === filter;
    const matchesSearch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.meta_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.target_keyword?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Separate featured (first) and rest
  const featuredPost = filteredPosts[0];
  const restPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-[#030303]">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/docs" className="text-white/40 hover:text-white/60 text-sm transition-colors hidden md:block">
              Docs
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

      {/* Hero */}
      <section className="py-12 md:py-16 px-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-white/60 text-sm mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                Replay Blog
              </h1>
              <p className="text-lg text-white/50 max-w-xl">
                Technical insights on video-to-code AI, UI reconstruction, and building better developer tools.
              </p>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-72 pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-[#FF6E3C]/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-6 px-6 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TONES.map((tone) => {
              const Icon = tone.icon;
              return (
                <button
                  key={tone.value}
                  onClick={() => setFilter(tone.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    filter === tone.value
                      ? "bg-[#FF6E3C] text-white"
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tone.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-white/40 text-lg">
                {searchQuery ? `No articles matching "${searchQuery}"` : "No articles published yet."}
              </p>
              <p className="text-white/30 text-sm mt-2">
                {searchQuery ? "Try a different search term" : "Check back soon!"}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Featured Post */}
              {featuredPost && (
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="block bg-gradient-to-br from-[#FF6E3C]/10 via-white/[0.02] to-transparent border border-[#FF6E3C]/20 hover:border-[#FF6E3C]/30 rounded-2xl p-8 md:p-10 transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-[#FF6E3C]/20 text-[#FF6E3C] text-xs font-medium rounded-full">
                        Featured
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-white/40">
                        <Calendar className="w-3 h-3" />
                        {new Date(featuredPost.published_at || featuredPost.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-white/40">
                        <Clock className="w-3 h-3" />
                        {featuredPost.read_time_minutes} min read
                      </span>
                    </div>
                    
                    <h2 className="text-2xl md:text-3xl font-bold text-white group-hover:text-[#FF6E3C] transition-colors mb-3">
                      {featuredPost.title}
                    </h2>
                    
                    <p className="text-white/50 text-base md:text-lg mb-6 line-clamp-2">
                      {featuredPost.meta_description?.replace(/^>?\s*\*?\*?TL;?DR:?\*?\*?:?\s*/i, '')}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      {featuredPost.target_keyword && (
                        <span className="flex items-center gap-1.5 text-sm text-white/40">
                          <Tag className="w-4 h-4" />
                          {featuredPost.target_keyword}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-2 text-[#FF6E3C] font-medium group-hover:gap-3 transition-all">
                        Read article <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </Link>
                </motion.article>
              )}

              {/* Rest of Posts Grid */}
              {restPosts.length > 0 && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restPosts.map((post, i) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={`/blog/${post.slug}`}
                        className="block h-full bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all group"
                      >
                        <div className="flex items-center gap-3 text-xs text-white/40 mb-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.read_time_minutes} min
                          </span>
                        </div>
                        
                        <h2 className="text-lg font-semibold text-white group-hover:text-[#FF6E3C] transition-colors mb-3 line-clamp-2">
                          {post.title}
                        </h2>
                        
                        <p className="text-sm text-white/50 line-clamp-3 mb-4 flex-grow">
                          {post.meta_description?.replace(/^>?\s*\*?\*?TL;?DR:?\*?\*?:?\s*/i, '')}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                          {post.target_keyword && (
                            <span className="text-xs text-white/30 truncate max-w-[120px]">
                              #{post.target_keyword.replace(/\s+/g, '')}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-sm text-[#FF6E3C] group-hover:gap-2 transition-all ml-auto">
                            Read <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    </motion.article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 px-6 border-t border-white/5">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Stay updated
          </h2>
          <p className="text-white/50 mb-8">
            Get the latest articles on AI code generation, developer tools, and product updates.
          </p>
          <Link
            href="/tool"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-[#FF6E3C] to-[#FF8F5C] text-white hover:opacity-90 transition-opacity"
          >
            Try Replay for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-6 text-sm text-white/30">
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


