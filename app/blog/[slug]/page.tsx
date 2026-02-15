import { createServerSupabaseClient } from "@/lib/supabase/server";
import BlogPostContent from "./BlogPostContent";
import { notFound } from "next/navigation";
import { Metadata } from "next";

// Force dynamic because we are fetching from DB
export const dynamic = "force-dynamic";

const SITE_URL = "https://www.replay.build";

/** Extract FAQ Q&A pairs from markdown content for FAQPage schema */
function extractFAQs(content: string): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  // Match H3 questions inside FAQ section
  const faqSectionMatch = content.match(/##\s*(?:Frequently Asked Questions|FAQ)[\s\S]*$/im);
  if (!faqSectionMatch) return faqs;

  const faqSection = faqSectionMatch[0];
  const questionBlocks = faqSection.split(/###\s+/).slice(1); // Split by H3, skip preamble

  for (const block of questionBlocks) {
    const lines = block.trim().split("\n");
    const question = lines[0]?.replace(/\*\*/g, "").replace(/\??\s*$/, "?").trim();
    const answer = lines
      .slice(1)
      .map(l => l.replace(/[#*`>]/g, "").trim())
      .filter(l => l.length > 0)
      .join(" ")
      .slice(0, 500);
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }
  return faqs.slice(0, 10); // Max 10 FAQs
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
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.meta_description,
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
  const faqs = extractFAQs(post.content || "");

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description,
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

  const faqSchema = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
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
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <BlogPostContent post={post} />
    </>
  );
}
