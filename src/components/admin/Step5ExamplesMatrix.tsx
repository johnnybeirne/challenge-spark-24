import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Day1StepExampleRow,
  saveStepExampleRow,
  useStepExamples,
} from "@/lib/day1StepExamples";

// Stable key for a single row.
const rowKey = (r: Pick<Day1StepExampleRow, "audience_type" | "audience_role">) =>
  `${r.audience_type}::${r.audience_role}`;

const examplesToText = (lines: string[]) => lines.join("\n");
const textToExamples = (text: string) =>
  text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const keywordsToText = (kws: string[]) => kws.join(", ");
const textToKeywords = (text: string) =>
  text
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

interface DraftRow extends Day1StepExampleRow {
  _dirty?: boolean;
}

/**
 * Per-(audience type × audience role) matrix editor for the Step 5
 * contextual example hints. Saves are debounced and upsert per row
 * so an edit to one cell never clobbers another in flight.
 */
const Step5ExamplesMatrix = () => {
  const remoteRows = useStepExamples("step-5");
  const [drafts, setDrafts] = useState<DraftRow[]>(remoteRows);

  // When upstream rows arrive (initial load / realtime), merge them in
  // without overwriting any locally-dirty rows the admin is mid-typing.
  useEffect(() => {
    setDrafts((prev) => {
      const dirtyMap = new Map(prev.filter((r) => r._dirty).map((r) => [rowKey(r), r]));
      return remoteRows.map((r) => dirtyMap.get(rowKey(r)) ?? r);
    });
  }, [remoteRows]);

  const grouped = useMemo(() => {
    const b2b = drafts.filter((r) => r.audience_type === "b2b").sort((a, b) => a.sort_order - b.sort_order);
    const b2c = drafts.filter((r) => r.audience_type === "b2c").sort((a, b) => a.sort_order - b.sort_order);
    return { b2b, b2c };
  }, [drafts]);

  // Debounced per-row save: at most one pending timer per row.
  const timers = useRef<Map<string, number>>(new Map());

  const scheduleSave = (row: DraftRow) => {
    const key = rowKey(row);
    const existing = timers.current.get(key);
    if (existing) window.clearTimeout(existing);
    const handle = window.setTimeout(async () => {
      timers.current.delete(key);
      const { error } = await saveStepExampleRow(row);
      if (error) {
        toast.error(`Couldn't sync ${row.label}`);
        return;
      }
      // Mark clean once persisted.
      setDrafts((prev) =>
        prev.map((r) => (rowKey(r) === key ? { ...r, _dirty: false } : r)),
      );
    }, 700);
    timers.current.set(key, handle);
  };

  useEffect(() => {
    return () => {
      timers.current.forEach((h) => window.clearTimeout(h));
      timers.current.clear();
    };
  }, []);

  const patchRow = (key: string, patch: Partial<Day1StepExampleRow>) => {
    setDrafts((prev) => {
      const next = prev.map((r) =>
        rowKey(r) === key ? { ...r, ...patch, _dirty: true } : r,
      );
      const target = next.find((r) => rowKey(r) === key);
      if (target) scheduleSave(target);
      return next;
    });
  };

  const renderGroup = (title: string, rows: DraftRow[]) => (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <div className="space-y-3">
        {rows.map((row) => {
          const key = rowKey(row);
          const isDefault = row.audience_role === "default";
          return (
            <div
              key={key}
              className={`rounded-lg border p-3 space-y-2.5 ${
                isDefault
                  ? "border-primary/30 bg-primary/[0.04]"
                  : "border-border bg-background"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {row.label}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    role · {row.audience_role}
                    {row._dirty && (
                      <span className="ml-2 text-amber-600">unsaved…</span>
                    )}
                  </p>
                </div>
              </div>

              {!isDefault && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Match keywords (comma-separated)
                  </Label>
                  <Input
                    value={keywordsToText(row.match_keywords)}
                    onChange={(e) =>
                      patchRow(key, { match_keywords: textToKeywords(e.target.value) })
                    }
                    placeholder="e.g. coach, coaching"
                    className="h-8 text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Matched against the user's audience text and chosen expert types.
                  </p>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Bulleted hints (one per line · shown beneath the input)
                </Label>
                <Textarea
                  rows={4}
                  value={examplesToText(row.examples)}
                  onChange={(e) =>
                    patchRow(key, { examples: textToExamples(e.target.value) })
                  }
                  placeholder={"Can't get first paying clients\nStruggling with pricing\nDon't know how to sell their offer"}
                  className="text-xs leading-snug resize-y"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (drafts.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Loading example hints…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-foreground">
          Contextual example hints
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          These bulleted hints appear beneath the Step 5 input. The live flow
          picks the row matching the user's B2B / B2C choice and audience
          keywords, falling back to the default row for that audience type.
        </p>
      </div>
      {renderGroup("B2B — Businesses & professionals", grouped.b2b)}
      {renderGroup("B2C — Individuals & consumers", grouped.b2c)}
    </div>
  );
};

export default Step5ExamplesMatrix;
