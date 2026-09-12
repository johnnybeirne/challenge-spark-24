/**
 * Client-side "unverified report preview" state for the results page.
 *
 * When someone asks for their report by email we send them a 6-digit code and
 * immediately show the results page in a logged-in-looking preview. This is NOT
 * a session: nothing here is trusted, nothing reads auth.uid(). It only holds
 * what the person typed so the page survives a refresh until they verify.
 */
import { useEffect, useState } from "react";

const KEY = "leadio_report_preview";
const EVENT = "leadio_report_preview_change";

export type ReportPreview = {
  name: string;
  email: string;
  submitted: true;
  submittedAt: number;
};

export function getReportPreview(): ReportPreview | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.submitted) return null;
    return parsed as ReportPreview;
  } catch {
    return null;
  }
}

export function setReportPreview(name: string, email: string) {
  const value: ReportPreview = { name, email, submitted: true, submittedAt: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function clearReportPreview() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useReportPreview(): ReportPreview | null {
  const [preview, setPreview] = useState<ReportPreview | null>(() => getReportPreview());

  useEffect(() => {
    const sync = () => setPreview(getReportPreview());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return preview;
}
