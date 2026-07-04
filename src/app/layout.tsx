import type { Metadata, Viewport } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#16a34a",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://haraj.example.com"),
  title: {
    default: "حراج - موقع الإعلانات المبوبة الأول في السعودية",
    template: "%s | حراج",
  },
  description: "موقع حراج لبيع وشراء السيارات والعقارات والأجهزة والإلكترونيات والأثاث والوظائف والحيوانات والخدمات. أضف إعلانك مجاناً وصل لملايين العملاء في السعودية.",
  keywords: [
    "حراج",
    "حراج السيارات",
    "إعلانات مبوبة",
    "سوق السعودية",
    "بيع وشراء",
    "سيارات مستعملة",
    "عقارات",
    "أجهزة",
    "أثاث",
    "وظائف",
    "حيوانات",
    "خدمات",
    "أزياء",
    "الرياض",
    "جدة",
    "مكة",
    "المدينة",
    "الدمام",
  ],
  authors: [{ name: "موقع حراج" }],
  creator: "موقع حراج",
  publisher: "موقع حراج",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192" }],
  },
  manifest: "/manifest.json",
  alternates: {
    canonical: "/",
    languages: {
      "ar-SA": "/",
      "en-US": "/en",
    },
  },
  openGraph: {
    title: "حراج - موقع الإعلانات المبوبة الأول في السعودية",
    description: "أكبر سوق للإعلانات المبوبة في السعودية - سيارات، عقارات، أجهزة، أثاث، وظائف، وأكثر",
    url: "https://haraj.example.com",
    siteName: "حراج",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "حراج - سوق الإعلانات المبوبة",
      },
    ],
    locale: "ar_SA",
    type: "website",
    countryName: "Saudi Arabia",
  },
  twitter: {
    card: "summary_large_image",
    title: "حراج - موقع الإعلانات المبوبة",
    description: "أكبر سوق للإعلانات المبوبة في السعودية",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
  category: "shopping",
};

// JSON-LD structured data for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "حراج",
  alternateName: "Haraj",
  url: "https://haraj.example.com",
  description: "موقع حراج لبيع وشراء السيارات والعقارات والأجهزة والإلكترونيات والأثاث والوظائف والحيوانات والخدمات",
  inLanguage: "ar-SA",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://haraj.example.com/?search={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
  publisher: {
    "@type": "Organization",
    name: "موقع حراج",
    logo: {
      "@type": "ImageObject",
      url: "https://haraj.example.com/logo.svg",
    },
  },
};

const organizationData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "موقع حراج",
  url: "https://haraj.example.com",
  logo: "https://haraj.example.com/logo.svg",
  description: "أكبر سوق للإعلانات المبوبة في المملكة العربية السعودية",
  address: {
    "@type": "PostalAddress",
    addressCountry: "SA",
    addressRegion: "جدة",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+966-575-015-019",
    contactType: "customer service",
    availableLanguage: ["Arabic", "English"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        {/* PWA + SEO meta tags */}
        <meta name="application-name" content="حراج" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="حراج" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />

        {/* Structured data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationData) }}
        />

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('ServiceWorker registration successful');
                    },
                    function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${cairo.variable} ${tajawal.variable} font-tajawal antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
