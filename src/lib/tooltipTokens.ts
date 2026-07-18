/**
 * Shared tooltip token substitution.
 * Supports {{first_name}} in any tooltip copy (nav tips, per-day tooltips, etc.).
 * If no first name is available, collapses the token gracefully so the sentence
 * never shows a placeholder, empty gap, or stray leading comma.
 */
export function applyTooltipTokens(text: string | null | undefined, firstName?: string | null): string {
  if (!text) return "";
  const name = (firstName ?? "").trim();
  let out = text;

  if (name) {
    out = out.replace(/\{\{\s*first_name\s*\}\}/gi, name);
  } else {
    // Remove leading "{{first_name}}, " (or " - " / " : " etc.) cleanly.
    out = out.replace(/^\s*\{\{\s*first_name\s*\}\}\s*[,\-:;]?\s*/i, "");
    // Remove any remaining mid-sentence tokens, and collapse doubled spaces / stray commas.
    out = out.replace(/\{\{\s*first_name\s*\}\}/gi, "");
    out = out.replace(/\s{2,}/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
    // Capitalise the first character in case leading token was stripped.
    if (out.length > 0) out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

export function getFirstName(userName?: string | null): string {
  return (userName ?? "").trim().split(/\s+/)[0] ?? "";
}
