import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
}

const BASE_TITLE = "Leadio";
const DEFAULT_DESCRIPTION =
  "Get more leads with an AI-powered challenge that diagnoses your lead flow and recommends the next step.";
const SITE_ORIGIN = "https://leadio.johnnybeirne.com";

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => {
      if (k !== "content") el!.setAttribute(k, v);
    });
    document.head.appendChild(el);
  }
  el.setAttribute("content", attrs.content);
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const removeLink = (rel: string) => {
  const el = document.head.querySelector(`link[rel="${rel}"]`);
  if (el) el.remove();
};

export const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  noIndex = false,
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
  const canonicalUrl = canonical ? `${SITE_ORIGIN}${canonical}` : undefined;

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: fullTitle });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl || SITE_ORIGIN });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: fullTitle });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });

    if (canonicalUrl) upsertLink("canonical", canonicalUrl);
    else removeLink("canonical");

    if (noIndex) {
      upsertMeta('meta[name="robots"]', { name: "robots", content: "noindex, nofollow" });
    } else {
      const robots = document.head.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }
  }, [fullTitle, description, canonicalUrl, noIndex]);

  return null;
};
