// Lightweight client-side notifications store.
// Persisted to localStorage, pub/sub via a tiny listener set so any
// subscribed component (bell badge, popover) re-renders on change.

export interface AppNotification {
  id: string;
  title?: string;
  message: string;
  timestamp: string;
  read: boolean;
  href?: string;
}

const STORAGE_KEY = "leadio_notifications";
const MAX_NOTIFICATIONS = 50;

type Listener = (items: AppNotification[]) => void;
const listeners = new Set<Listener>();

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(items: AppNotification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
  } catch {}
  listeners.forEach((l) => l(items));
}

export function getNotifications(): AppNotification[] {
  return load();
}

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function pushNotification(input: Omit<AppNotification, "id" | "timestamp" | "read"> & { dedupeKey?: string }) {
  const items = load();
  // Dedupe: if a recent notification (<2 min) has the same dedupeKey/message, skip.
  const key = input.dedupeKey ?? input.message;
  const now = Date.now();
  const recent = items.find(
    (n) => (n.title ?? "") + "::" + n.message === ((input.title ?? "") + "::" + key)
      && now - new Date(n.timestamp).getTime() < 2 * 60 * 1000
  );
  if (recent) return;

  const next: AppNotification = {
    id: `n_${now}_${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    message: input.message,
    href: input.href,
    timestamp: new Date().toISOString(),
    read: false,
  };
  save([next, ...items]);
}

export function markAllRead() {
  const items = load().map((n) => ({ ...n, read: true }));
  save(items);
}

export function markRead(id: string) {
  const items = load().map((n) => (n.id === id ? { ...n, read: true } : n));
  save(items);
}

export function clearNotifications() {
  save([]);
}

// Cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      listeners.forEach((l) => l(load()));
    }
  });
}
