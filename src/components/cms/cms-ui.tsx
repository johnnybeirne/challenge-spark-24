/**
 * Shared "WYSIWYG-feel" editor primitives for the Admin CMS.
 *
 * Goals:
 *  - Each editable item shows a clear human-readable name + a helper sentence
 *    explaining where it appears on the live page, with the input directly underneath.
 *  - Group fields into preview-style section cards with clear headings.
 *  - Hide technical concepts (field keys, value types, IDs) by default — keep
 *    them tucked into an opt-in "Advanced field settings" disclosure.
 *  - Sticky save bar with a transient "Saved" confirmation.
 *
 * IMPORTANT: These components do not change any data shape, keys, save handlers,
 * routing, or page logic. They are presentation only.
 */
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Check, ChevronDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ──────────────────────────────────────────────────────────────────────────
 * Page header — friendly, not "admin-y"
 * ────────────────────────────────────────────────────────────────────────── */
export function CmsPageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Section card — groups related editable fields like a live page section
 * ────────────────────────────────────────────────────────────────────────── */
export function EditorCard({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <header className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action}
      </header>
      <div className="px-5 pb-5 space-y-5">{children}</div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * EditableField — name + helper + input, all stacked
 * ────────────────────────────────────────────────────────────────────────── */
type BaseProps = {
  label: string;
  helper?: string;
  className?: string;
};

export function EditableField({
  label,
  helper,
  value,
  onChange,
  multiline,
  rows = 3,
  type = "text",
  placeholder,
  className,
}: BaseProps & {
  value: string | number;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  type?: "text" | "number" | "url" | "email" | "password";
  placeholder?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <FieldLabel label={label} helper={helper} />
      {multiline ? (
        <Textarea
          value={value as string}
          rows={rows}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="text-base leading-relaxed"
        />
      ) : (
        <Input
          type={type}
          value={value as any}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 text-base"
        />
      )}
    </div>
  );
}

export function ToggleField({
  label,
  helper,
  checked,
  onChange,
}: BaseProps & { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border bg-background/40 px-3 py-2.5">
      <div className="space-y-0.5 min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function FieldLabel({ label, helper }: { label: string; helper?: string }) {
  return (
    <div className="space-y-0.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Repeatable list — for cards/items the user can add/remove
 * Renames "Add field" → "Add content block" by default
 * ────────────────────────────────────────────────────────────────────────── */
export function RepeatableList<T>({
  label,
  helper,
  items,
  renderItem,
  onAdd,
  onRemove,
  addLabel = "Add content block",
  itemLabel,
  emptyText = "No items yet.",
}: {
  label?: string;
  helper?: string;
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  addLabel?: string;
  /** Called per-item to produce a heading like "Item 1" */
  itemLabel?: (index: number) => string;
  emptyText?: string;
}) {
  return (
    <div className="space-y-3">
      {(label || helper) && <FieldLabel label={label ?? ""} helper={helper} />}
      {items.length === 0 && (
        <p className="text-xs italic text-muted-foreground">{emptyText}</p>
      )}
      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-lg border bg-background/40 p-3 space-y-3 relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {itemLabel ? itemLabel(i) : `Item ${i + 1}`}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(i)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
            </Button>
          </div>
          {renderItem(item, i)}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-1" /> {addLabel}
      </Button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * AdvancedDetails — collapsed disclosure for technical bits
 * ────────────────────────────────────────────────────────────────────────── */
export function AdvancedDetails({
  children,
  summary = "Advanced field settings",
}: {
  children: React.ReactNode;
  summary?: string;
}) {
  return (
    <details className="group rounded-md border border-dashed bg-muted/20">
      <summary className="cursor-pointer list-none flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground select-none">
        <ChevronDown className="h-3.5 w-3.5 transition-transform group-open:rotate-180" />
        {summary}
      </summary>
      <div className="px-3 pb-3 pt-1 space-y-3">{children}</div>
    </details>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Sticky save bar with transient "Saved" confirmation
 * Place at the bottom of a CMS pane.
 * ────────────────────────────────────────────────────────────────────────── */
export function StickyActionBar({
  onSave,
  saveLabel = "Save changes",
  saving = false,
  rightExtra,
}: {
  onSave: () => void | Promise<void>;
  saveLabel?: string;
  saving?: boolean;
  rightExtra?: React.ReactNode;
}) {
  const [justSaved, setJustSaved] = React.useState(false);
  const handleClick = async () => {
    await onSave();
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 1800);
  };

  return (
    <div className="sticky bottom-0 -mx-6 mt-6 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-between gap-3 px-6 py-3">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          {justSaved ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Saved</span>
            </>
          ) : (
            <span>Edits apply after you save.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rightExtra}
          <Button onClick={handleClick} disabled={saving} className="h-10 px-5">
            {saving ? "Saving…" : saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
