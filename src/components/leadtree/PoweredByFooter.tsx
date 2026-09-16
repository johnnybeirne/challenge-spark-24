import { Link } from "react-router-dom";

const BRAND_URL = "https://leadtree.johnnybeirne.com";

/**
 * Footer shown on every page: "Powered by LeadTree" with a link to the brand site.
 * Used in both the LeadTree 3-column shell and the public fallback shell.
 */
const PoweredByFooter = () => {
  return (
    <footer className="py-6 text-center text-sm text-muted-foreground">
      <span>© {new Date().getFullYear()} All rights reserved. </span>
      <span className="inline-flex items-center gap-1">
        Powered by
        <a
          href={BRAND_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground underline decoration-2 underline-offset-4 decoration-primary hover:text-primary transition-colors"
        >
          LeadTree
        </a>
      </span>
    </footer>
  );
};

export default PoweredByFooter;
