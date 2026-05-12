import { Helmet } from "react-helmet-async";
import {
  ADDRESS_LOCALITY,
  ADDRESS_REGION,
  ADDRESS_STREET,
  SHOP_NAME,
} from "@/lib/businessInfo";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: "website" | "article";
  ogImage?: string;
  twitterHandle?: string;
  keywords?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
}

const SITE_URL = "https://crackerskingdom.in";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og/index-og.svg?v=2`;

const toAbsoluteUrl = (url: string) => {
  if (!url) return SITE_URL;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const SEO = ({
  title = "Premium Sivakasi Fireworks Estimate Online",
  description = "Crackers Kingdom is your trusted destination for premium Sivakasi fireworks, safe festival crackers, and legal parcel dispatch across India.",
  canonical,
  ogType = "website",
  ogImage = DEFAULT_OG_IMAGE,
  twitterHandle = "@CrackersKingdom",
  keywords,
  noIndex = false,
  structuredData,
}: SEOProps) => {
  const siteName = SHOP_NAME;
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`;

  const resolvedCanonical = canonical
    ? toAbsoluteUrl(canonical)
    : typeof window !== "undefined"
      ? toAbsoluteUrl(window.location.pathname)
      : SITE_URL;

  const resolvedOgImage = toAbsoluteUrl(ogImage);
  const robotsContent = noIndex ? "noindex, nofollow" : "index, follow";
  const googleBotContent = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";
  const localBusinessSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: SHOP_NAME,
    image: `${SITE_URL}/logo.png`,
    description,
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS_STREET,
      addressLocality: ADDRESS_LOCALITY,
      addressRegion: ADDRESS_REGION,
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "9.4533",
      longitude: "77.8024",
    },
    url: SITE_URL,
    telephone: "+91 81442 71571",
  };
  const schemaEntries = [
    localBusinessSchema,
    ...(Array.isArray(structuredData)
      ? structuredData
      : structuredData
        ? [structuredData]
        : []),
  ];

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}
      <meta name="language" content="en-IN" />
      <meta name="geo.region" content="IN-TN" />
      <meta name="geo.placename" content={ADDRESS_LOCALITY} />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      <link rel="canonical" href={resolvedCanonical} />
      <link rel="alternate" hrefLang="en-IN" href={resolvedCanonical} />
      <link rel="alternate" hrefLang="x-default" href={resolvedCanonical} />

      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta name="theme-color" content="#d4a629" />
      <meta name="format-detection" content="telephone=yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-title" content={siteName} />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:url" content={resolvedCanonical} />
      <meta property="og:image" content={resolvedOgImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOgImage} />
      <meta name="twitter:image:alt" content={fullTitle} />
      <meta name="twitter:url" content={resolvedCanonical} />

      <meta name="robots" content={robotsContent} />
      <meta name="googlebot" content={googleBotContent} />

      {schemaEntries.map((schema, index) => (
        <script key={`ld-json-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEO;
