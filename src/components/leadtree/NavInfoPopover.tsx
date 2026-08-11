import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavInfoPopovers } from "@/hooks/useNavInfoPopovers";

/**
 * Small owner-editable "What is this?" trigger shown beside a top-bar nav item.
 * Renders nothing when the section is disabled or has no copy.
 */
const NavInfoPopover = ({ section }: { section: string }) => {
  const { bySection } = useNavInfoPopovers();
  const row = bySection(section);
  const title = (row?.title ?? "").trim();
  const body = (row?.body ?? "").trim();
  if (!row || !row.enabled || (!title && !body)) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title || `What is ${row.label}?`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 transition-colors hover:text-foreground"
        >
          <HelpCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        className="w-[280px] space-y-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
        {body && (
          <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NavInfoPopover;
