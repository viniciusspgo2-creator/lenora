import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { SettingsServerInjector } from "@/components/settings-injector";
import { getSettings } from "@/lib/settings-server";
import { VisitorsTracker } from "@/components/visitors-tracker";
import {
  organizationSchema,
  websiteSchema,
  localBusinessSchema,
  absUrl,
} from "@/lib/seo";

// Poppins — fonte display forte e moderna (substitui o Cormorant serif).
// Mantemos o nome de variável --font-cormorant para não quebrar os componentes
// legados que usam .font-serif / --font-serif — agora tudo aponta para Poppins.
const cormorant = Poppins({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const siteUrl = s.seo.siteUrl || "https://lojalenora.com.br";
  const ogImage = absUrl(s, s.seo.ogImage || "/uploads/hero-desktop.webp");
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: s.seo.title,
      template: `%s | ${s.brandName}`,
    },
    description: s.seo.description,
    keywords: s.seo.keywords ? s.seo.keywords.split(/[;,]\s*/).map((k) => k.trim()) : [],
    authors: [{ name: s.brandName }],
    creator: s.brandName,
    publisher: s.brandName,
    applicationName: s.brandName,
    category: "Shopping/Moda Feminina",
    formatDetection: { telephone: true, email: true, address: false },
    alternates: { canonical: "/" },
    openGraph: {
      title: s.seo.title,
      description: s.seo.description,
      siteName: s.brandName,
      type: "website",
      locale: "pt_BR",
      url: siteUrl,
      images: [
        {
          url: ogImage,
          width: 1600,
          height: 686,
          alt: `${s.brandName} — ${s.brandTagline}`,
          type: "image/webp",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: s.seo.twitterHandle ? `@${s.seo.twitterHandle}` : undefined,
      title: s.seo.title,
      description: s.seo.description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    // Favicon: src/app/{favicon.ico, icon.png, apple-icon.png} são
    // detectados automaticamente pelo App Router (file convention).
    other: {
      "theme-color": s.colors.accent,
      author: s.brandName,
      language: "Portuguese",
      "geo.region": "BR-GO",
      "geo.placename": s.seo.local.addressLocality,
      "geo.position": `${s.seo.local.latitude};${s.seo.local.longitude}`,
      ICBM: `${s.seo.local.latitude}, ${s.seo.local.longitude}`,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const settings = await getSettings();
  const orgSchema = organizationSchema(settings);
  const wsSchema = websiteSchema(settings);
  const lbSchema = localBusinessSchema(settings);
  const a = settings.analytics;

  return (
    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* JSON-LD: Organization + WebSite (com SearchAction) + LocalBusiness/ClothingStore */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(wsSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lbSchema) }}
        />
        {/* Google Analytics 4 (somente se configurado no admin) */}
        {a.ga4Id && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${a.ga4Id}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${a.ga4Id}',{send_page_view:true});`,
              }}
            />
          </>
        )}
        {/* Google Tag Manager (somente se configurado) */}
        {a.gtmId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${a.gtmId}');`,
            }}
          />
        )}
        {/* Meta Pixel / Facebook (somente se configurado) */}
        {a.facebookPixelId && (
          <script
            dangerouslySetInnerHTML={{
              __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${a.facebookPixelId}');fbq('track','PageView');`,
            }}
          />
        )}
      </head>
      <body className={`${cormorant.variable} antialiased`}>
        <SettingsServerInjector settings={settings} />
        {children}
        <VisitorsTracker />
        <Toaster />
        <SonnerToaster richColors position="bottom-right" />
        {/* GTM noscript fallback */}
        {a.gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${a.gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
      </body>
    </html>
  );
}
