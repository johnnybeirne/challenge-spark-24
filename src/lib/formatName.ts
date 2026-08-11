/**
 * Shared display-name helper: first name plus surname initial ("Michael K.").
 * Accepts either split fields or a single full name string.
 */
export function formatFirstNameSurnameInitial(
  input: { firstName?: string | null; surname?: string | null; name?: string | null } | string | null | undefined
): string {
  if (!input) return "";

  let first = "";
  let last = "";

  if (typeof input === "string") {
    const parts = input.trim().split(/\s+/).filter(Boolean);
    first = parts[0] ?? "";
    last = parts.length > 1 ? parts[parts.length - 1] : "";
  } else {
    first = (input.firstName ?? "").trim();
    last = (input.surname ?? "").trim();
    if (!first || !last) {
      const parts = (input.name ?? "").trim().split(/\s+/).filter(Boolean);
      if (!first) first = parts[0] ?? "";
      if (!last && parts.length > 1) last = parts[parts.length - 1];
    }
  }

  if (!first) return "";
  return last ? `${first} ${last.charAt(0).toUpperCase()}.` : first;
}

/** Initials for avatar circles, max two characters. */
export function getInitials(
  input: { firstName?: string | null; surname?: string | null; name?: string | null } | string | null | undefined
): string {
  const display = formatFirstNameSurnameInitial(input);
  if (!display) return "?";
  const parts = display.replace(/\./g, "").split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export default formatFirstNameSurnameInitial;
