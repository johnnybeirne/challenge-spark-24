import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Entry = {
  label: string;
  description?: string;
  path: string;
  keywords?: string;
  group: string;
};

// User-facing destinations only. Do NOT include admin / owner console
// surfaces or the internal knowledge base / resource library.
const ENTRIES: Entry[] = [
  { group: "Challenge", label: "Dashboard", path: "/challenger-dashboard", description: "Your home base", keywords: "home momentum" },
  { group: "Challenge", label: "Day 1", path: "/challenge/day-1", description: "Define your challenge", keywords: "assessment foundation" },
  { group: "Challenge", label: "Day 2", path: "/challenge/day/2", description: "Build and refine" },
  { group: "Challenge", label: "Day 3", path: "/challenge/day/3", description: "Launch and share" },
  { group: "Challenge", label: "Unlocks", path: "/unlocks", description: "Rewards you've earned" },
  { group: "Challenge", label: "Referrals", path: "/referrals", description: "Invite builders" },
  { group: "Challenge", label: "Leaderboard", path: "/leaderboard" },
  { group: "Challenge", label: "Community", path: "/community" },
  { group: "Tools", label: "AI Mentor", path: "/mentor", keywords: "coach chat" },
  { group: "Tools", label: "Prompt Library", path: "/prompt-library", keywords: "prompts" },
  { group: "Tools", label: "Calendar", path: "/calendar" },
  { group: "Tools", label: "Bonus Vault", path: "/bonus-vault", keywords: "rewards" },
  { group: "Account", label: "Profile", path: "/challenger-dashboard", keywords: "settings" },
  { group: "Account", label: "Upgrade to Premium", path: "/premium" },
];

export const GlobalSearch = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const groups = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of ENTRIES) {
      if (!map.has(e.group)) map.set(e.group, []);
      map.get(e.group)!.push(e);
    }
    return Array.from(map.entries());
  }, []);

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search pages and tools…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((item) => (
              <CommandItem
                key={`${group}-${item.label}-${item.path}`}
                value={`${item.label} ${item.description ?? ""} ${item.keywords ?? ""}`}
                onSelect={() => go(item.path)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{item.label}</span>
                  {item.description && (
                    <span className="text-xs text-muted-foreground">{item.description}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};

export default GlobalSearch;
