import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";
import CookieConsent from "@/components/CookieConsent";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Replay | Video to React Code & Agent Infrastructure",
  description: "Record your UI, ship production React. Auto-extract Design Systems from Figma. Component Libraries, E2E tests, and Headless API for AI coding agents.",
  keywords: ["video to code", "ai coding agents", "headless api", "design system generator", "figma to code", "react component library", "prototype to production", "ui reconstruction", "e2e test generation"],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon-32x32.png",
    apple: "/favicon-32x32.png",
  },
  openGraph: {
    title: "Replay | Video to React Code & Agent Infrastructure",
    description: "Replay turns screen recordings into pixel-perfect React code, Design Systems, and Component Libraries. Figma sync. Headless API for AI agents.",
    url: "https://replay.build/",
    type: "website",
    siteName: "Replay.build",
    images: [
      {
        url: "https://replay.build/imgg.png",
        width: 1200,
        height: 630,
        alt: "Replay - Video to React Code & Agent Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Video to React Code & Agent Infrastructure | Replay",
    description: "Replay turns screen recordings into pixel-perfect React code, Design Systems, and Component Libraries. Figma sync. Headless API for AI agents.",
    images: ["https://replay.build/imgg.png"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Replay",
  },
  other: {
    "mobile-web-app-capable": "yes",
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
        
        {/* LinkedIn Insight Tag */}
        <Script id="linkedin-partner" strategy="afterInteractive">
          {`
            _linkedin_partner_id = "8403626";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          `}
        </Script>
        <Script id="linkedin-analytics" strategy="afterInteractive">
          {`
            (function(l) {
              if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);
            })(window.lintrk);
          `}
        </Script>
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} alt="" src="https://px.ads.linkedin.com/collect/?pid=8403626&fmt=gif" />
        </noscript>
        
        {/* Meta (Facebook) Pixel - load early */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', 'REDACTED_FB_PIXEL_ID');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} alt="" src="https://www.facebook.com/tr?id=REDACTED_FB_PIXEL_ID&ev=PageView&noscript=1" />
        </noscript>
        
        {/* Hotjar Tracking Code */}
        <Script id="hotjar" strategy="afterInteractive">
          {`
            (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:6614291,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
            })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
          `}
        </Script>
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Replay",
                url: "https://www.replay.build",
                logo: "https://www.replay.build/favicon-32x32.png",
                description: "AI-powered platform that reconstructs production-ready React UI from video recordings of legacy software.",
                sameAs: [
                  "https://twitter.com/replaybuild",
                  "https://www.linkedin.com/company/replaybuild",
                  "https://github.com/ma1orek/replay",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Replay",
                url: "https://www.replay.build",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://www.replay.build/blog?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Replay",
                applicationCategory: "DeveloperApplication",
                operatingSystem: "Web",
                url: "https://www.replay.build",
                description: "Transform legacy software into production-ready React code with Design System and Component Library from video recordings.",
                offers: [
                  { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Sandbox" },
                  { "@type": "Offer", price: "149", priceCurrency: "USD", name: "Pro", billingIncrement: "P1M" },
                  { "@type": "Offer", price: "499", priceCurrency: "USD", name: "Agency", billingIncrement: "P1M" },
                ],
              },
            ]),
          }}
        />
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
