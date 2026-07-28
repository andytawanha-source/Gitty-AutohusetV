import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useBrand } from "@/app/BrandProvider";

interface SeoProps {
  title?: string;
  description?: string;
  /** Sæt false for sider der ikke må indekseres (admin, kladder, tak-sider) */
  index?: boolean;
  image?: string;
  jsonLd?: object | object[];
}

export function Seo({ title, description, index = true, image, jsonLd }: SeoProps) {
  const brand = useBrand();
  const location = useLocation();

  const fullTitle = title ? brand.seo.titleTemplate.replace("%s", title) : brand.seo.defaultTitle;
  const desc = description ?? brand.seo.defaultDescription;
  const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  const canonical = siteUrl ? `${siteUrl}${location.pathname}` : undefined;
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {!index && <meta name="robots" content="noindex,nofollow" />}
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={brand.name} />
      {canonical && <meta property="og:url" content={canonical} />}
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {jsonLdArray.map((obj, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(obj)}
        </script>
      ))}
    </Helmet>
  );
}
