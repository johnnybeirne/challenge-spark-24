// Lightly grammar-cleans short user fragments via the `tidy-phrase` edge
// function so echoed answers read naturally inside Johnny's sentences.
// Results are cached in-memory and in sessionStorage so we never re-call
// for the same fragment twice in a session.
import { supabase } from "@/integrations/supabase/client";

const memCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();
const STORAGE_PREFIX = "tidy-phrase:v1:";

const keyFor = (text: string, context?: string) =>
  `${context ?? ""}::${text}`;

const readStored = (key: string): string | null => {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + key);
  } catch {
    return null;
  }
};

const writeStored = (key: string, value: string) => {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, value);
  } catch {
    // ignore quota / privacy mode
  }
};

export const getTidiedSync = (text: string, context?: string): string | null => {
  const raw = (text || "").trim();
  if (!raw) return "";
  const k = keyFor(raw, context);
  if (memCache.has(k)) return memCache.get(k)!;
  const stored = readStored(k);
  if (stored !== null) {
    memCache.set(k, stored);
    return stored;
  }
  return null;
};

export const tidyPhrase = async (text: string, context?: string): Promise<string> => {
  const raw = (text || "").trim();
  if (!raw) return "";
  const k = keyFor(raw, context);
  const cached = getTidiedSync(raw, context);
  if (cached !== null) return cached;
  if (inflight.has(k)) return inflight.get(k)!;

  const p = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("tidy-phrase", {
        body: { text: raw, context },
      });
      if (error) throw error;
      const cleaned = (data?.text || raw).toString();
      memCache.set(k, cleaned);
      writeStored(k, cleaned);
      return cleaned;
    } catch (e) {
      console.warn("tidyPhrase failed, using raw", e);
      memCache.set(k, raw);
      return raw;
    } finally {
      inflight.delete(k);
    }
  })();

  inflight.set(k, p);
  return p;
};
