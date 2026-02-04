import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

/**
 * Dynamic route to serve Storybook static files for a specific project
 * 
 * Route: /project/[projectId]/design-system/[[...path]]
 * 
 * Examples:
 * - /project/abc123/design-system -> serves index.html
 * - /project/abc123/design-system/iframe.html -> serves iframe.html
 * - /project/abc123/design-system/assets/main.js -> serves assets
 */

interface PageProps {
  params: Promise<{
    projectId: string;
    path?: string[];
  }>;
}

export default async function DesignSystemPage({ params }: PageProps) {
  const { projectId, path: segments } = await params;
  
  // Construct the file path
  const filePath = segments?.join("/") || "index.html";
  const storybookDir = path.join(
    process.cwd(),
    "public",
    "projects",
    projectId,
    "storybook"
  );
  const fullPath = path.join(storybookDir, filePath);

  // Security: Prevent path traversal
  const normalizedPath = path.normalize(fullPath);
  if (!normalizedPath.startsWith(storybookDir)) {
    notFound();
  }

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    // If no Storybook exists, show a nice error page
    if (!fs.existsSync(storybookDir)) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-zinc-800 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-zinc-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Design System Not Generated
            </h1>
            <p className="text-zinc-400 mb-6">
              This project doesn&apos;t have a Design System yet. Generate one from
              the project editor to create a shareable component library.
            </p>
            <a
              href={`/?project=${projectId}`}
              className="inline-flex items-center justify-center px-6 py-3 bg-orange-500 text-white font-medium rounded-full hover:bg-orange-600 transition-colors"
            >
              Open Project Editor
            </a>
          </div>
        </div>
      );
    }
    notFound();
  }

  // For HTML files, we need to serve them with proper content type
  // For other assets (JS, CSS), they should be served via the public folder
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".html") {
    // Read and serve HTML file
    const htmlContent = fs.readFileSync(fullPath, "utf-8");
    
    // Inject base tag to fix relative paths
    const baseUrl = `/projects/${projectId}/storybook/`;
    const modifiedHtml = htmlContent.replace(
      "<head>",
      `<head><base href="${baseUrl}">`
    );

    return (
      <html>
        <head>
          <base href={baseUrl} />
        </head>
        <body dangerouslySetInnerHTML={{ __html: modifiedHtml }} />
      </html>
    );
  }

  // For non-HTML files, redirect to the static path
  const staticUrl = `/projects/${projectId}/storybook/${filePath}`;
  return Response.redirect(new URL(staticUrl, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
}

/**
 * Generate static params for known projects (optional optimization)
 */
export async function generateStaticParams() {
  // Return empty array - we'll generate these dynamically
  return [];
}

/**
 * Metadata for the design system page
 */
export async function generateMetadata({ params }: PageProps) {
  const { projectId } = await params;
  
  return {
    title: `Design System | Project ${projectId}`,
    description: "Interactive component library and design documentation",
    robots: {
      index: false, // Don't index individual project design systems
      follow: false,
    },
  };
}
