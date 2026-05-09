// Partner referral handling — silent. Stored locally so /upgrade
// can pick it up even if the user navigates away from /p/:partnerCode.
const KEY = "leadio_partner_code";

export function setPartnerCode(code: string) {
  try {
    if (!code) return;
    localStorage.setItem(KEY, code.trim());
  } catch {
    // ignore
  }
}

export function getPartnerCode(): string | undefined {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.length > 0 ? v : undefined;
  } catch {
    return undefined;
  }
}

export function clearPartnerCode() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
