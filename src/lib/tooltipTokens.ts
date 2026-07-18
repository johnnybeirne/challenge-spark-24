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
    // Remove any remaining mid-sentence tokens.
    out = out.replace(/\{\{\s*first_name\s*\}\}/gi, "");
    out = out.replace(/\s{2,}/g, " ").replace(/\s+([,.!?;:])/g, "$1").trim();
    if (out.length > 0) out = out.charAt(0).toUpperCase() + out.slice(1);
  }
  return out;
}

/**
 * Resolve the participant's first name from any available source in priority order:
 * app state user, auth user metadata (first_name / full_name / name), email prefix.
 */
export function resolveFirstName(opts: {
  stateUserName?: string | null;
  authUser?: { user_metadata?: Record<string, any> | null; email?: string | null } | null;
}): string {
  const meta = opts.authUser?.user_metadata ?? {};
  const candidates: Array<string | undefined | null> = [
    opts.stateUserName,
    meta.first_name,
    meta.firstName,
    meta.full_name,
    meta.name,
    opts.authUser?.email ? String(opts.authUser.email).split("@")[0] : null,
  ];
  for (const c of candidates) {
    const first = (c ?? "").toString().trim().split(/\s+/)[0];
    if (first) return first;
  }
  return "";
}

/** @deprecated use resolveFirstName */
export function getFirstName(userName?: string | null): string {
  return (userName ?? "").trim().split(/\s+/)[0] ?? "";
}
