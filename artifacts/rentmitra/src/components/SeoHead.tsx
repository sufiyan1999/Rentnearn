import { Helmet } from "react-helmet-async";
import { SITE_URL, toAbsoluteUrl } from "@/lib/siteUrl";

const SITE_NAME = "RentNEarn";
const DEFAULT_TITLE = "RentNEarn – India's Rental Marketplace";
const DEFAULT_DESCRIPTION =
  "Rent tools, cameras, vehicles, baby products, medical equipment, furniture, electronics and more from trusted people near you. Save money, earn from unused items and support a sustainable future.";

interface SeoHeadProps {
  /** Page title — shown as "{title} · RentNEarn". Omit for the homepage default. */
  title?: string;
  description?: string;
  /** OG image — absolute URL or root-relative path; resolved to SITE_URL automatically. */
  image?: string;
  /** Canonical path, e.g. "/listings/42". Resolved against SITE_URL. */
  canonical?: string;
  type?: "website" | "product";
  /** Prevent indexing (admin/auth pages). */
  noIndex?: boolean;
}

export function SeoHead({
  title,
  description,
  image,
  canonical,
  type = "website",
  noIndex,
}: SeoHeadProps) {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : DEFAULT_TITLE;
  const desc = description ?? DEFAULT_DESCRIPTION;
  // Always resolve against SITE_URL — never window.location.origin
  const ogImage = toAbsoluteUrl(image ?? "/og-default.png");
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={ogImage} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
