import { Helmet } from 'react-helmet-async';
import type { ReactNode } from 'react';

const DEFAULT_TITLE = 'Classic Watch Pro — Luxury & Classic Timepieces';
const DEFAULT_DESCRIPTION =
  'Shop luxury, classic, sport and smart timepieces. Authentic watches with verified reviews, promo codes, free insured delivery and a 2-year warranty.';
const SITE_URL = 'https://classic-watch-pro.vercel.app';
const DEFAULT_IMAGE = '';

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
  nofollow?: boolean;
  canonicalPath?: string;
  keywords?: string[];
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  children?: ReactNode;
}

const Seo = ({
  title,
  description = DEFAULT_DESCRIPTION,
  image,
  noindex = false,
  nofollow = false,
  canonicalPath,
  keywords,
  jsonLd,
  children,
}: SeoProps) => {
  const fullTitle = title ? `${title} | Classic Watch Pro` : DEFAULT_TITLE;
  const robots = [
    noindex ? 'noindex' : 'index',
    nofollow ? 'nofollow' : 'follow',
    image ? 'max-image-preview:large' : '',
  ]
    .filter(Boolean)
    .join(', ');

  const canonical =
    canonicalPath ??
    (typeof window !== 'undefined' ? window.location.pathname + window.location.search : '');

  const ogImage = image ?? DEFAULT_IMAGE;

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={`${SITE_URL}${canonical}`} />
      {keywords && keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Classic Watch Pro" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={`${SITE_URL}${canonical}`} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter */}
      <meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
      {children}
    </Helmet>
  );
};

export default Seo;
