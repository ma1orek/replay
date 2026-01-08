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
    images: [
      {
        url: "https://www.replay.build/og-image.png",
        width: 1200,
        height: 630,
        alt: "Replay - Rebuild UI from Video",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Replay: Rebuild UI from Video. Instantly.",
    description: "Turn any video into a clean, production-ready UI. Code, structure, interactions and style.",
    images: ["https://www.replay.build/og-image.png"],
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
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
