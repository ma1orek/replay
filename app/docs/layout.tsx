"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import {
  Search,
  Book,
  Zap,
  Video,
  Edit3,
  GitBranch,
  Palette,
  Code,
  Globe,
  Database,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Clock,
  BookOpen,
  LayoutGrid,
} from "lucide-react";

// Navigation structure
const navigation = [
  {
    title: "Getting Started",
    items: [
      { title: "Introduction", href: "/docs", icon: Book },
      { title: "Quickstart", href: "/docs/quickstart", icon: Zap },
    ],
  },
  {
    title: "Features",
    items: [
      { title: "Video to UI", href: "/docs/features/video-to-ui", icon: Video },
      { title: "Component Library", href: "/docs/features/library", icon: BookOpen },
      { title: "Blueprints Editor", href: "/docs/features/blueprints", icon: LayoutGrid },
      { title: "Flow Map", href: "/docs/features/flow-map", icon: GitBranch },
      { title: "Edit with AI", href: "/docs/features/edit-with-ai", icon: Edit3 },
      { title: "Design System", href: "/docs/features/design-system", icon: Palette },
      { title: "Code View", href: "/docs/features/code-view", icon: Code },
      { title: "Publish", href: "/docs/features/publish", icon: Globe },
    ],
  },
  {
    title: "Integrations",
    items: [
      { title: "Supabase", href: "/docs/integrations/supabase", icon: Database },
      { title: "Project Settings", href: "/docs/integrations/project-settings", icon: Settings },
    ],
  },
  {
    title: "Guides",
    items: [
      { title: "First Project", href: "/docs/guides/first-project", icon: Sparkles },
      { title: "Style Injection", href: "/docs/guides/style-injection", icon: Palette },
      { title: "Database Integration", href: "/docs/guides/database-integration", icon: Database },
    ],
  },
  {
    title: "Resources",
    items: [
      { title: "Changelog", href: "/docs/changelog", icon: Clock },
      { title: "Pricing & Credits", href: "/docs/pricing", icon: CreditCard },
      { title: "FAQ", href: "/docs/faq", icon: HelpCircle },
    ],
  },
];

// Search modal component
function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const allItems = navigation.flatMap(section => section.items);
  const filtered = query
    ? allItems.filter(item => 
        item.title.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-xl mx-4 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-700">
          <Search className="w-5 h-5 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-white placeholder:text-zinc-500 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs text-zinc-400 bg-zinc-800 rounded border border-zinc-700">ESC</kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <item.icon className="w-4 h-4 text-zinc-400" />
                <span className="text-sm text-white">{item.title}</span>
              </Link>
            ))
          ) : (
            <div className="px-3 py-8 text-center text-zinc-500 text-sm">
              No results found for "{query}"
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Sidebar component
function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Getting Started": true,
    "Features": true,
    "Integrations": true,
    "Guides": true,
    "Resources": true,
  });

  return (
    <div className="h-full overflow-y-auto py-6 px-4">
      {navigation.map((section) => (
        <div key={section.title} className="mb-6">
          <button
            onClick={() => setExpanded(prev => ({ ...prev, [section.title]: !prev[section.title] }))}
            className="flex items-center gap-2 w-full text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 hover:text-zinc-400 transition-colors"
          >
            {expanded[section.title] ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            {section.title}
          </button>
          {expanded[section.title] && (
            <div className="space-y-1 ml-2">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-zinc-800 text-white font-medium"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-[#0a0a0b]/95 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <Link href="/landing" className="flex items-center gap-2">
              <Logo />
            </Link>
            <span className="text-zinc-700">|</span>
            <Link href="/docs" className="text-zinc-400 font-medium hover:text-white transition-colors">Docs</Link>
          </div>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors w-64"
          >
            <Search className="w-4 h-4 text-zinc-500" />
            <span className="text-sm text-zinc-500 flex-1 text-left">Search...</span>
            <kbd className="px-2 py-0.5 text-xs text-zinc-500 bg-zinc-800 rounded border border-zinc-700">⌘K</kbd>
          </button>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="hidden md:flex px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Open App →
            </Link>
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-zinc-800"
            >
              <Menu className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 border-r border-zinc-800 sticky top-16 h-[calc(100vh-4rem)] overflow-hidden bg-[#0a0a0b]">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 bg-[#0a0a0b]">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {children}
          </div>
        </main>

        {/* Table of contents - right sidebar */}
        <aside className="hidden xl:block w-64 border-l border-zinc-800 sticky top-16 h-[calc(100vh-4rem)] bg-[#0a0a0b]">
          <div className="p-6">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
              On this page
            </h4>
          </div>
        </aside>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0b] border-r border-zinc-800 md:hidden"
            >
              <div className="flex items-center justify-between p-4 border-b border-zinc-800">
                <span className="font-semibold text-white">Navigation</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-zinc-800"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
              <Sidebar onClose={() => setMobileMenuOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Search modal */}
      <AnimatePresence>
        {searchOpen && <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
