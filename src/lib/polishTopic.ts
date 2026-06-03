// Calls the `polish-topic` edge function to turn a raw Day 1 problem
// into a clean 2–4 word challenge topic (e.g. "Lead Generation").
// Results are cached per-input so we never re-call for the same problem.
import { supabase } from "@/integrations/supabase/client";

export interface TopicInput {
  problem: string;
  audience?: string;
  method?: string;
}

const STORAGE_PREFIX = "polish-topic:v1:";
const memCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

const keyFor = (i: TopicInput) =>
  `${i.problem}::${i.audience ?? ""}::${i.method ?? ""}`;

const readStored = (k: string): string | null => {
  try { return sessionStorage.getItem(STORAGE_PREFIX + k); } catch { return null; }
};
const writeStored = (k: string, v: string) => {
  try { sessionStorage.setItem(STORAGE_PREFIX + k, v); } catch { /* ignore */ }
};

export const getPolishedTopicSync = (i: TopicInput): string | null => {
  const k = keyFor(i);
  if (memCache.has(k)) return memCache.get(k)!;
  const stored = readStored(k);
  if (stored) {
    memCache.set(k, stored);
    return stored;
  }
  return null;
};

export const polishTopic = async (i: TopicInput): Promise<string> => {
  if (!i.problem || !i.problem.trim()) return "";
  const k = keyFor(i);
  const cached = getPolishedTopicSync(i);
  if (cached !== null) return cached;
  if (inflight.has(k)) return inflight.get(k)!;

  const p = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("polish-topic", {
        body: i,
      });
      if (error) throw error;
      const topic = (data?.topic || "").toString();
      memCache.set(k, topic);
      if (topic) writeStored(k, topic);
      return topic;
    } catch (e) {
      console.warn("polishTopic failed, using empty fallback", e);
      memCache.set(k, "");
      return "";
    } finally {
      inflight.delete(k);
    }
  })();

  inflight.set(k, p);
  return p;
};
