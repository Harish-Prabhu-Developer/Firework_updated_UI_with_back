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

// Brand keywords that must appear on every page to dominate "crackers kingdom" searches
const BRAND_KEYWORDS =
  "crackers kingdom, crackerskingdom, crackers kingdom sivakasi, crackerskingdom.in, crackers kingdom .in, crackers kingdom india";

const toAbsoluteUrl = (url: string) => {
  if (!url) return SITE_URL;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// ── Organization Schema — tells Google WHO owns this domain ──────────────────
const organizationSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Crackers Kingdom",
  alternateName: [
    "CrackersKingdom",
    "Crackers Kingdom Sivakasi",
    "crackerskingdom.in",
  ],
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.ico`,
  description:
    "Crackers Kingdom (crackerskingdom.in) is a premium Sivakasi fireworks shop offering authentic crackers with legal parcel dispatch across India.",
  foundingDate: "2025",
  foundingLocation: {
    "@type": "Place",
    name: "Sivakasi, Tamil Nadu, India",
  },
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+91-81442-71571",
      contactType: "customer support",
      areaServed: "IN",
      availableLanguage: ["English", "Tamil", "Hindi"],
    },
    {
      "@type": "ContactPoint",
      telephone: "+91-950-021-1527",
      contactType: "sales",
      areaServed: "IN",
      availableLanguage: ["English", "Tamil"],
    },
  ],
  address: {
    "@type": "PostalAddress",
    streetAddress: "M/S NANDHINI TRADERS, Survey No: 299/13A1C, 299/15A2, Bharathi Nagar - II, Viswanatham",
    addressLocality: "Sivakasi",
    addressRegion: "Tamil Nadu",
    postalCode: "626189",
    addressCountry: "IN",
  },
  email: "crackerskingdom26@gmail.com",
  // Add your social profiles here once created — this is critical for Google Knowledge Panel
  sameAs: [
    // "https://www.facebook.com/crackerskingdom",
    // "https://www.instagram.com/crackerskingdom",
    // "https://twitter.com/CrackersKingdom",
  ],
};

// ── WebSite Schema with SearchAction — enables sitelinks searchbox in SERPs ──
const websiteSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Crackers Kingdom",
  alternateName: "crackerskingdom.in",
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
  inLanguage: "en-IN",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

// ── Local Business Schema — strengthens local SEO vs competitors ─────────────
const localBusinessSchema: Record<string, unknown> = {
  "@context": "https://schema.org",
  "@type": "Store",
  "@id": `${SITE_URL}/#store`,
  name: SHOP_NAME,
  image: `${SITE_URL}/favicon.ico`,
  description:
    "Crackers Kingdom is a premium Sivakasi fireworks store offering authentic crackers, sparklers, rockets, and festive gift boxes with legal parcel dispatch across India.",
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS_STREET,
    addressLocality: ADDRESS_LOCALITY,
    addressRegion: ADDRESS_REGION,
    postalCode: "626189",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: "9.4533",
    longitude: "77.8024",
  },
  url: SITE_URL,
  telephone: "+91 81442 71571",
  email: "crackerskingdom26@gmail.com",
  priceRange: "₹₹",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: "09:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Sunday",
      opens: "10:00",
      closes: "18:00",
    },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Sivakasi Fireworks Collection",
    itemListElement: [
      {
        "@type": "OfferCatalog",
        name: "Sparklers & Flower Pots",
      },
      {
        "@type": "OfferCatalog",
        name: "Rockets & Aerial Shots",
      },
      {
        "@type": "OfferCatalog",
        name: "Ground Chakkars",
      },
      {
        "@type": "OfferCatalog",
        name: "Gift Boxes & Bundles",
      },
    ],
  },
};

/** Build BreadcrumbList schema for the given path */
const buildBreadcrumbs = (pathname: string): Record<string, unknown> => {
  const crumbs: Array<{ name: string; url: string }> = [
    { name: "Home", url: SITE_URL },
  ];

  const pathMap: Record<string, string> = {
    "/products": "Fireworks Estimate",
    "/about": "About Us",
    "/contact": "Contact Us",
    "/safety": "Safety Tips",
    "/checkout": "Checkout",
  };

  if (pathname !== "/" && pathMap[pathname]) {
    crumbs.push({
      name: pathMap[pathname],
      url: `${SITE_URL}${pathname}`,
    });
  }

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
};

const SEO = ({
  title = "Premium Sivakasi Fireworks Estimate Online",
  description = "Crackers Kingdom (crackerskingdom.in) is your trusted destination for premium Sivakasi fireworks, safe festival crackers, and legal parcel dispatch across India.",
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

  // Merge brand keywords with page-specific keywords
  const mergedKeywords = keywords
    ? `${BRAND_KEYWORDS}, ${keywords}`
    : BRAND_KEYWORDS;

  const resolvedCanonical = canonical
    ? toAbsoluteUrl(canonical)
    : typeof window !== "undefined"
      ? toAbsoluteUrl(window.location.pathname)
      : SITE_URL;

  const currentPath =
    typeof window !== "undefined" ? window.location.pathname : "/";

  const resolvedOgImage = toAbsoluteUrl(ogImage);
  const robotsContent = noIndex ? "noindex, nofollow" : "index, follow";
  const googleBotContent = noIndex
    ? "noindex, nofollow"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  const breadcrumbSchema = buildBreadcrumbs(currentPath);

  // Build all schema entries — global schemas + page-specific
  const schemaEntries = [
    organizationSchema,
    websiteSchema,
    localBusinessSchema,
    breadcrumbSchema,
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
      <meta name="keywords" content={mergedKeywords} />
      <meta name="language" content="en-IN" />
      <meta name="geo.region" content="IN-TN" />
      <meta name="geo.placename" content="Sivakasi, Tamil Nadu" />
      <meta name="geo.position" content="9.4533;77.8024" />
      <meta name="ICBM" content="9.4533, 77.8024" />
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
