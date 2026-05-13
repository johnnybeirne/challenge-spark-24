import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

const BASE_TITLE = "Leadio";
const DEFAULT_DESCRIPTION = "Get more leads with an AI-powered challenge that diagnoses your lead flow and recommends the next step.";

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
  const canonicalUrl = canonical ? `https://leadio.johnnybeirne.com${canonical}` : undefined;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl || "https://leadio.johnnybeirne.com"} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};
