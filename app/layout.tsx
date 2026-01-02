import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import CookieConsent from "@/components/CookieConsent";

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
      <head>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-QK0TMPEF63"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-QK0TMPEF63');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
