import { useSiteContent } from "@/hooks/useSiteContent";
import { POWERED_BY_PAGE, POWERED_BY_DEFAULTS } from "@/lib/poweredByContent";

/**
 * Footer shown on every page: "Powered by LeadTree" with a link to the brand site.
 * Copy and link are owner-editable at /owner-console/powered-by.
 */
const PoweredByFooter = () => {
  const { t } = useSiteContent(POWERED_BY_PAGE);
  const d = (k: string) => t(k, POWERED_BY_DEFAULTS[k] ?? "");

  return (
    <footer className="py-6 text-center text-sm text-muted-foreground">
      <span>© {new Date().getFullYear()} {d("footer.rights_text")} </span>
      <span className="inline-flex items-center gap-1">
        {d("footer.powered_prefix")}
        <a
          href={d("footer.brand_url")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground underline decoration-2 underline-offset-4 decoration-primary hover:text-primary transition-colors"
        >
          {d("footer.brand_label")}
        </a>
      </span>
    </footer>
  );
};

export default PoweredByFooter;
