import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Replay: Rebuild UI from Video. Instantly.",
  description: "Turn any video into a clean, production-ready UI. Code, structure, interactions and style — rebuilt directly from what's on screen.",
  keywords: ["video to code", "ui rebuild", "screen recording to code", "ai code generation", "tailwind css", "react", "frontend automation"],
  icons: {
    icon: "/favi.png",
  },
  openGraph: {
    title: "Replay: Rebuild UI from Video. Instantly.",
    description: "Turn any video into a clean, production-ready UI. Code, structure, interactions and style — rebuilt directly from what's on screen.",
    type: "website",
    siteName: "Replay",
  },
  twitter: {
    card: "summary_large_image",
    title: "Replay: Rebuild UI from Video. Instantly.",
    description: "Turn any video into a clean, production-ready UI. Code, structure, interactions and style.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
