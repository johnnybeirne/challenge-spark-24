import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

/**
 * Shared owner-console "Preview" button.
 * Opens the live, saved public-facing page in a new tab (never unsaved edits).
 * Mirrors the pattern first used on /owner-console/lead-gen-quiz.
 */
const PreviewButton = ({
  href,
  label = "Preview",
}: {
  href: string;
  label?: string;
}) => (
  <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
    <a href={href} target="_blank" rel="noreferrer">
      <ExternalLink className="h-4 w-4" />
      {label}
    </a>
  </Button>
);

export default PreviewButton;
