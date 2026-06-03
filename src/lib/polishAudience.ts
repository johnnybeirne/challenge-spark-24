// Calls the `polish-audience` edge function to clean up the user's raw
// "who I work with" answer (e.g. "speakers trainers authors coaches"
// → "speakers, trainers, authors, and coaches"). Cached per-input.
import { supabase } from "@/integrations/supabase/client";

export interface AudienceInput {
  audience: string;
  audienceType?: "b2b" | "b2c" | "";
}

const STORAGE_PREFIX = "polish-audience:v1:";
const memCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const keyFor = (i: AudienceInput) =>
  `${i.audience}::${i.audienceType ?? ""}`;

const readStored = (k: string): string | null => {
  try { return sessionStorage.getItem(STORAGE_PREFIX + k); } catch { return null; }
};
const writeStored = (k: string, v: string) => {
  try { sessionStorage.setItem(STORAGE_PREFIX + k, v); } catch { /* ignore */ }
};

export const getPolishedAudienceSync = (i: AudienceInput): string | null => {
  const k = keyFor(i);
  if (memCache.has(k)) return memCache.get(k)!;
  const stored = readStored(k);
  if (stored) {
    memCache.set(k, stored);
    return stored;
  }
  return null;
};

export const polishAudience = async (i: AudienceInput): Promise<string> => {
  const raw = (i.audience || "").trim();
  if (!raw) return "";
  const k = keyFor(i);
  const cached = getPolishedAudienceSync(i);
  if (cached !== null) return cached || raw;
  if (inflight.has(k)) return inflight.get(k)!;

  const p = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("polish-audience", {
        body: i,
      });
      if (error) throw error;
      const text = (data?.audience || raw).toString();
      memCache.set(k, text);
      writeStored(k, text);
      return text;
    } catch (e) {
      console.warn("polishAudience failed, using raw fallback", e);
      memCache.set(k, raw);
      return raw;
    } finally {
      inflight.delete(k);
    }
  })();

  inflight.set(k, p);
  return p;
};
