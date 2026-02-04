"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { 
  Library, ExternalLink, Code, ArrowLeft, ChevronDown, ChevronRight,
  Palette, Type, Ruler, Grid3X3, Box, Layers, Puzzle, Rocket, Copy, Check, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LibraryData {
  components?: any[];
  docs?: any[];
  tokens?: {
    colors?: Record<string, string>;
    typography?: any;
    spacing?: Record<string, string>;
  };
  foundations?: {
    colors?: Record<string, string>;
    typography?: any;
    spacing?: Record<string, string>;
    icons?: string[];
  };
  overview?: {
    colorStats?: any;
  };
}

type SidebarSection = "colors" | "typography" | "spacing" | "icons" | "primitives" | "components" | "patterns" | "product";

export default function PublicLibraryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [project, setProject] = useState<{ title: string; code: string; library_data: LibraryData | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SidebarSection>("colors");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    foundations: true, primitives: true, components: true, patterns: true, product: true
  });
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError("Missing project slug");
      setLoading(false);
      return;
    }

    async function load() {
      const supabase = createClient();
      const { data, error: fetchError } = await supabase
        .from("published_projects")
        .select("title, code, library_data")
        .eq("slug", slug)
        .single();

      if (fetchError || !data) {
        setError("Project not found");
        setLoading(false);
        return;
      }

      setProject({ 
        title: data.title || "Untitled", 
        code: data.code || "",
        library_data: data.library_data as LibraryData | null
      });
      setLoading(false);
    }

    load();
  }, [slug]);

  const copyToClipboard = (text: string, token: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Loading library...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-semibold text-white mb-2">Project not found</h1>
          <p className="text-zinc-400 text-sm mb-6">{error}</p>
          <Link
            href="https://www.replay.build"
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Replay
          </Link>
        </div>
      </div>
    );
  }

  const lib = project.library_data;
  const colors = lib?.foundations?.colors || lib?.tokens?.colors || {};
  const typography = lib?.foundations?.typography || lib?.tokens?.typography || {};
  const spacing = lib?.foundations?.spacing || lib?.tokens?.spacing || {};
  const icons = lib?.foundations?.icons || [];
  
  // Group components by layer
  const allComponents = lib?.components || [];
  const primitives = allComponents.filter((c: any) => c.layer === 'primitives' || c.category === 'primitives');
  const components = allComponents.filter((c: any) => c.layer === 'components' || c.category === 'components');
  const patterns = allComponents.filter((c: any) => c.layer === 'patterns' || c.category === 'patterns');
  const product = allComponents.filter((c: any) => c.layer === 'product' || c.category === 'product' || c.category === 'section');

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Generate CSS custom properties
  const generateCSSTokens = () => {
    const lines = [':root {'];
    Object.entries(colors).forEach(([name, value]) => {
      lines.push(`  --color-${name.toLowerCase().replace(/\s+/g, '-')}: ${value};`);
    });
    Object.entries(spacing).forEach(([name, value]) => {
      lines.push(`  --spacing-${name.toLowerCase().replace(/\s+/g, '-')}: ${value};`);
    });
    lines.push('}');
    return lines.join('\n');
  };

  const renderSidebar = () => (
    <aside className="w-64 border-r border-zinc-800 bg-[#0d0d0d] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <Link href={`/p/${slug}`} className="text-zinc-400 hover:text-white text-xs flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3 h-3" /> View project
        </Link>
        <h1 className="font-semibold text-white flex items-center gap-2 text-sm">
          <Library className="w-4 h-4 text-zinc-500" />
          {project.title}
        </h1>
        <p className="text-[10px] text-zinc-500 mt-1">Design System Library</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-auto p-2">
        {/* Foundations */}
        <div className="mb-2">
          <button 
            onClick={() => toggleSection('foundations')}
            className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300"
          >
            Foundations
            {expandedSections.foundations ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {expandedSections.foundations && (
            <div className="mt-1 space-y-0.5">
              <button 
                onClick={() => setActiveSection("colors")}
                className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-md", activeSection === "colors" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50")}
              >
                <Palette className="w-3.5 h-3.5" /> Colors
                <span className="ml-auto text-[10px] text-zinc-600">{Object.keys(colors).length}</span>
              </button>
              <button 
                onClick={() => setActiveSection("typography")}
                className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-md", activeSection === "typography" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50")}
              >
                <Type className="w-3.5 h-3.5" /> Typography
              </button>
              <button 
                onClick={() => setActiveSection("spacing")}
                className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-md", activeSection === "spacing" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50")}
              >
                <Ruler className="w-3.5 h-3.5" /> Spacing
                <span className="ml-auto text-[10px] text-zinc-600">{Object.keys(spacing).length}</span>
              </button>
              {icons.length > 0 && (
                <button 
                  onClick={() => setActiveSection("icons")}
                  className={cn("w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-md", activeSection === "icons" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:bg-zinc-800/50")}
                >
                  <Grid3X3 className="w-3.5 h-3.5" /> Icons
                  <span className="ml-auto text-[10px] text-zinc-600">{icons.length}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Primitives */}
        {primitives.length > 0 && (
          <div className="mb-2">
            <button 
              onClick={() => toggleSection('primitives')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300"
            >
              Primitives
              {expandedSections.primitives ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.primitives && (
              <div className="mt-1 space-y-0.5">
                {primitives.map((comp: any) => (
                  <button 
                    key={comp.id}
                    onClick={() => setActiveSection("primitives")}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-md"
                  >
                    <Box className="w-3.5 h-3.5" /> {comp.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Components */}
        {components.length > 0 && (
          <div className="mb-2">
            <button 
              onClick={() => toggleSection('components')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300"
            >
              Components
              {expandedSections.components ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.components && (
              <div className="mt-1 space-y-0.5">
                {components.map((comp: any) => (
                  <button 
                    key={comp.id}
                    onClick={() => setActiveSection("components")}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-md"
                  >
                    <Layers className="w-3.5 h-3.5" /> {comp.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Patterns */}
        {patterns.length > 0 && (
          <div className="mb-2">
            <button 
              onClick={() => toggleSection('patterns')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300"
            >
              Patterns
              {expandedSections.patterns ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.patterns && (
              <div className="mt-1 space-y-0.5">
                {patterns.map((comp: any) => (
                  <button 
                    key={comp.id}
                    onClick={() => setActiveSection("patterns")}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-md"
                  >
                    <Puzzle className="w-3.5 h-3.5" /> {comp.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Product */}
        {product.length > 0 && (
          <div className="mb-2">
            <button 
              onClick={() => toggleSection('product')}
              className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider hover:text-zinc-300"
            >
              Product
              {expandedSections.product ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {expandedSections.product && (
              <div className="mt-1 space-y-0.5">
                {product.map((comp: any) => (
                  <button 
                    key={comp.id}
                    onClick={() => setActiveSection("product")}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800/50 rounded-md"
                  >
                    <Rocket className="w-3.5 h-3.5" /> {comp.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <a
          href={`/p/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-xs"
        >
          <ExternalLink className="w-3 h-3" /> Open Project
        </a>
      </div>
    </aside>
  );

  const renderContent = () => {
    // Colors Section
    if (activeSection === "colors") {
      const colorEntries = Object.entries(colors);
      return (
        <div className="p-8 max-w-5xl">
          <h1 className="text-3xl font-bold text-white mb-2">Color System</h1>
          <p className="text-zinc-400 mb-8">Color tokens extracted from your design system.</p>

          {colorEntries.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Palette className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No color tokens found.</p>
              <p className="text-sm mt-1">Generate Library in Replay to extract colors.</p>
            </div>
          ) : (
            <>
              {/* Color Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-12">
                {colorEntries.map(([name, value]) => (
                  <div 
                    key={name}
                    className="group cursor-pointer"
                    onClick={() => copyToClipboard(value as string, name)}
                  >
                    <div 
                      className="aspect-square rounded-xl shadow-lg border border-zinc-800 mb-2 relative overflow-hidden"
                      style={{ backgroundColor: value as string }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity">
                        {copiedToken === name ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-zinc-200 truncate">{name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{value as string}</p>
                  </div>
                ))}
              </div>

              {/* CSS Tokens */}
              <div className="border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-zinc-800">
                  <span className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                    <Code className="w-4 h-4" /> CSS Custom Properties
                  </span>
                  <button 
                    onClick={() => copyToClipboard(generateCSSTokens(), 'css')}
                    className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md flex items-center gap-1"
                  >
                    {copiedToken === 'css' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    Copy All
                  </button>
                </div>
                <pre className="p-4 text-xs text-zinc-400 font-mono overflow-auto max-h-64 bg-[#0a0a0a]">
                  {generateCSSTokens()}
                </pre>
              </div>
            </>
          )}
        </div>
      );
    }

    // Typography Section
    if (activeSection === "typography") {
      const fontFamily = typography?.fontFamily || {};
      const fontSize = typography?.fontSize || typography?.scale || {};
      const fontWeight = typography?.fontWeight || typography?.weights || {};
      
      return (
        <div className="p-8 max-w-5xl">
          <h1 className="text-3xl font-bold text-white mb-2">Typography</h1>
          <p className="text-zinc-400 mb-8">Type scale and font usage guidelines.</p>

          {/* Font Families */}
          {Object.keys(fontFamily).length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Type className="w-5 h-5 text-zinc-400" /> Font Families
              </h2>
              <div className="grid gap-4">
                {Object.entries(fontFamily).map(([name, value]) => (
                  <div key={name} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <p className="text-sm text-zinc-400 mb-1">{name}</p>
                    <p className="text-xl text-white" style={{ fontFamily: value as string }}>{value as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Font Sizes */}
          {Object.keys(fontSize).length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-white mb-4">Type Scale</h2>
              <div className="space-y-3">
                {Object.entries(fontSize).map(([name, value]) => (
                  <div key={name} className="flex items-baseline gap-4 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                    <span className="text-xs font-mono text-zinc-500 w-20">{name}</span>
                    <span className="text-white" style={{ fontSize: value as string }}>{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Font Weights */}
          {Object.keys(fontWeight).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Font Weights</h2>
              <div className="flex flex-wrap gap-2">
                {Object.entries(fontWeight).map(([name, value]) => (
                  <span 
                    key={name}
                    className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-mono"
                    style={{ fontWeight: value as number }}
                  >
                    {name}: {String(value)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {Object.keys(fontFamily).length === 0 && Object.keys(fontSize).length === 0 && (
            <div className="text-center py-16 text-zinc-500">
              <Type className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No typography tokens found.</p>
            </div>
          )}
        </div>
      );
    }

    // Spacing Section
    if (activeSection === "spacing") {
      const spacingEntries = Object.entries(spacing);
      return (
        <div className="p-8 max-w-5xl">
          <h1 className="text-3xl font-bold text-white mb-2">Spacing</h1>
          <p className="text-zinc-400 mb-8">Spacing scale and layout tokens.</p>

          {spacingEntries.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Ruler className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No spacing tokens found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {spacingEntries.map(([name, value]) => (
                <div key={name} className="flex items-center gap-4 p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50">
                  <span className="text-xs font-mono text-zinc-500 w-20">{name}</span>
                  <div className="flex-1 flex items-center gap-3">
                    <div 
                      className="h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded"
                      style={{ width: value as string }}
                    />
                    <span className="text-sm text-zinc-300 font-mono">{value as string}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Icons Section
    if (activeSection === "icons") {
      return (
        <div className="p-8 max-w-5xl">
          <h1 className="text-3xl font-bold text-white mb-2">Icons</h1>
          <p className="text-zinc-400 mb-8">Icons used in your design system.</p>

          {icons.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Grid3X3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No icons found.</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {icons.map((icon: string) => (
                <span key={icon} className="px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-mono">
                  {icon}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Components Sections (primitives, components, patterns, product)
    const sectionComponents = 
      activeSection === "primitives" ? primitives :
      activeSection === "components" ? components :
      activeSection === "patterns" ? patterns :
      activeSection === "product" ? product : [];

    const sectionTitle = 
      activeSection === "primitives" ? "Primitives" :
      activeSection === "components" ? "Components" :
      activeSection === "patterns" ? "Patterns" :
      activeSection === "product" ? "Product" : "";

    if (["primitives", "components", "patterns", "product"].includes(activeSection)) {
      return (
        <div className="p-8 max-w-5xl">
          <h1 className="text-3xl font-bold text-white mb-2">{sectionTitle}</h1>
          <p className="text-zinc-400 mb-8">{sectionComponents.length} component{sectionComponents.length !== 1 ? 's' : ''} in this layer.</p>

          {sectionComponents.length === 0 ? (
            <div className="text-center py-16 text-zinc-500">
              <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No components in this layer.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sectionComponents.map((comp: any) => (
                <div key={comp.id} className="border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-800 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{comp.name}</h3>
                      {comp.description && <p className="text-xs text-zinc-500 mt-0.5">{comp.description}</p>}
                    </div>
                    <button
                      onClick={() => copyToClipboard(comp.code || '', comp.id)}
                      className="px-3 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-md flex items-center gap-1"
                    >
                      {copiedToken === comp.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 text-xs text-zinc-400 font-mono overflow-auto max-h-64 bg-[#0a0a0a]">
                    {comp.code || 'No code available'}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  // No library data
  if (!lib) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Library className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Library Not Generated</h1>
          <p className="text-zinc-400 text-sm mb-6">
            This project doesn't have a design system library yet. The project owner needs to generate and publish the library from Replay.
          </p>
          <Link
            href={`/p/${slug}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> View Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] text-zinc-100 flex">
      {renderSidebar()}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
