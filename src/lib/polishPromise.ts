// Calls the `polish-promise` edge function to rewrite the assembled
// Day 1 Challenge Promise in clean English. Results are cached so we
// never re-call for the same inputs in a session.
import { supabase } from "@/integrations/supabase/client";

export interface PromiseFragments {
  who: string;
  pain: string;
  result: string;
  method: string;
}

const STORAGE_PREFIX = "polish-promise:v1:";
const memCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const keyFor = (f: PromiseFragments) =>
  `${f.who}::${f.pain}::${f.result}::${f.method}`;

const fallback = (f: PromiseFragments) =>
  `Help ${f.who} move from ${f.pain} to ${f.result} through ${f.method}.`;

const readStored = (k: string): string | null => {
  try { return sessionStorage.getItem(STORAGE_PREFIX + k); } catch { return null; }
};
const writeStored = (k: string, v: string) => {
  try { sessionStorage.setItem(STORAGE_PREFIX + k, v); } catch { /* ignore */ }
};

export const getPolishedSync = (f: PromiseFragments): string | null => {
  const k = keyFor(f);
  if (memCache.has(k)) return memCache.get(k)!;
  const stored = readStored(k);
  if (stored) {
    memCache.set(k, stored);
    return stored;
  }
  return null;
};

export const polishPromise = async (f: PromiseFragments): Promise<string> => {
  if (!f.who || !f.pain || !f.result || !f.method) return fallback(f);
  const k = keyFor(f);
  const cached = getPolishedSync(f);
  if (cached) return cached;
  if (inflight.has(k)) return inflight.get(k)!;

  const p = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("polish-promise", {
        body: f,
      });
      if (error) throw error;
      const text = (data?.text || fallback(f)).toString();
      memCache.set(k, text);
      writeStored(k, text);
      return text;
    } catch (e) {
      console.warn("polishPromise failed, using fallback", e);
      const fb = fallback(f);
      memCache.set(k, fb);
      return fb;
    } finally {
      inflight.delete(k);
    }
  })();

  inflight.set(k, p);
  return p;
};
