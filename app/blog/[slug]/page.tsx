import { createServerSupabaseClient } from "@/lib/supabase/server";
import BlogPostContent from "./BlogPostContent";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// Force dynamic because we are fetching from DB
export const dynamic = "force-dynamic";

const SITE_URL = "https://www.replay.build";

/** Extract step-by-step instructions for HowTo schema */
function extractHowToSteps(content: string): Array<{ name: string; text: string }> | null {
  // Look for "Step-by-Step" or "Implementation Guide" section with numbered/ordered steps
  const guideMatch = content.match(/##\s*(?:.*(?:step.by.step|implementation guide|how to|getting started|tutorial))[\s\S]*?(?=\n##\s|\n$)/im);
  if (!guideMatch) return null;

  const section = guideMatch[0];
  const steps: Array<{ name: string; text: string }> = [];

  // Match H3 subsections or numbered list items as steps
  const h3Steps = section.split(/###\s+/).slice(1);
  if (h3Steps.length >= 2) {
    for (const step of h3Steps) {
      const lines = step.trim().split("\n");
      const name = lines[0]?.replace(/\*\*/g, "").replace(/^\d+[.)]\s*/, "").trim();
      const text = lines.slice(1).map(l => l.replace(/[#*`>]/g, "").trim()).filter(l => l).join(" ").slice(0, 500);
      if (name && text) steps.push({ name, text });
    }
  } else {
    // Fallback: numbered list items
    const numbered = section.match(/^\d+[.)]\s+.+/gm);
    if (numbered && numbered.length >= 2) {
      for (const item of numbered) {
        const name = item.replace(/^\d+[.)]\s+/, "").replace(/\*\*/g, "").trim();
        if (name) steps.push({ name, text: name });
      }
    }
  }

  return steps.length >= 2 ? steps.slice(0, 10) : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = await createServerSupabaseClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("title, meta_description, target_keyword, published_at, created_at")
    .eq("slug", params.slug)
    .single();

  if (!post) {
    return {
      title: "Article Not Found | Replay",
    };
  }

  const canonicalUrl = `${SITE_URL}/blog/${params.slug}`;
  const publishDate = post.published_at || post.created_at;

  return {
    title: `${post.title} | Replay Blog`,
    description: post.meta_description,
    keywords: post.target_keyword,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: post.title,
      description: post.meta_description,
      type: "article",
      url: canonicalUrl,
      siteName: "Replay",
      publishedTime: publishDate,
      authors: ["Replay Team"],
      images: [{ url: `${SITE_URL}/og-blog.png`, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
      images: [`${SITE_URL}/og-blog.png`],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const supabase = await createServerSupabaseClient();
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", params.slug)
    .single();

  if (error || !post) {
    notFound();
  }

  // Build JSON-LD structured data
  const canonicalUrl = `${SITE_URL}/blog/${params.slug}`;
  const publishDate = post.published_at || post.created_at;
  const wordCount = post.content?.split(/\s+/).length || 0;
  const howToSteps = extractHowToSteps(post.content || "");

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description,
    image: `${SITE_URL}/og-blog.png`,
    url: canonicalUrl,
    datePublished: publishDate,
    dateModified: publishDate,
    wordCount,
    author: {
      "@type": "Organization",
      name: "Replay",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/replay-logo.png`,
      },
    },
    publisher: {
      "@type": "Organization",
      name: "Replay",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/replay-logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
    keywords: post.target_keyword,
    inLanguage: "en-US",
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".article-summary"],
    },
  };

  // SoftwareApplication schema — helps LLMs understand Replay as a product
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Replay",
    url: "https://www.replay.build",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: "AI-powered platform that converts video recordings of any UI into production React code, Design Systems, and Component Libraries.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier available",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
    ],
  };

  const howToSchema = howToSteps ? {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: post.title,
    description: post.meta_description,
    step: howToSteps.map((step, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      {howToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
        />
      )}
      <BlogPostContent post={post} />
    </>
  );
}
