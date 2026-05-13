import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Beaker, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQaPreview } from "@/hooks/useQaPreview";
import {
  clearQaState,
  defaultQaState,
  setQaState,
  updateQaFlags,
  updateQaState,
  type QaEntry,
  type QaTier,
} from "@/lib/qaPreview";
import { setEntryIntent, type EntryIntent } from "@/lib/entryIntent";

const TIERS: { id: QaTier; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
];

const ASSESSMENT_MODES: { id: EntryIntent; label: string }[] = [
  { id: "free_training", label: "Free Training" },
  { id: "premium_course", label: "Premium Course" },
  { id: "challenge", label: "3-Day Challenge" },
];

const ENTRIES: { id: QaEntry; label: string }[] = [
  { id: "free_training", label: "Free Assessment" },
  { id: "standard_assessment", label: "Standard Assessment" },
  { id: "referral_partner", label: "Referral" },
  { id: "promoter", label: "Partner" },
  { id: "direct_signup", label: "Direct Signup" },
];

const ROUTES: { label: string; path: string }[] = [
  { label: "Homepage", path: "/" },
  { label: "Free Assessment", path: "/free-assessment" },
  { label: "Assessment Q's", path: "/assess" },
  { label: "Results", path: "/results" },
  { label: "Dashboard", path: "/user-dashboard" },
  { label: "Course Home", path: "/free-training" },
  { label: "Module 1", path: "/blueprint/lesson/1" },
  { label: "Module 2", path: "/blueprint/lesson/2" },
  { label: "Module 3", path: "/blueprint/lesson/3" },
  { label: "Module 4", path: "/blueprint/lesson/4" },
  { label: "Module 5", path: "/blueprint/lesson/5" },
  { label: "Upgrade", path: "/upgrade" },
  { label: "Referrals", path: "/referrals" },
  { label: "Waitlist", path: "/waitlist" },
];

const Pill = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition ${
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-border bg-background text-muted-foreground hover:bg-muted"
    }`}
  >
    {children}
  </button>
);

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
    {children}
  </div>
);

const Toggle = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center justify-between gap-3 rounded border border-border/60 bg-background px-2 py-1.5 text-xs">
    <span>{label}</span>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-primary"
    />
  </label>
);

const QaModePanel = () => {
  const { user } = useAuth();
  const qa = useQaPreview();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const PANEL_W = 340;
  const PANEL_H_EST = 560;
  const POS_KEY = "leadio_qa_panel_pos";
  const getDefaultPos = () => {
    if (typeof window === "undefined") return { x: 16, y: 200 };
    return { x: 16, y: Math.max(16, window.innerHeight - PANEL_H_EST - 64) };
  };
  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    if (typeof window === "undefined") return { x: 16, y: 200 };
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.x === "number" && typeof p?.y === "number") return p;
      }
    } catch {}
    return getDefaultPos();
  });
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const clamp = useCallback((x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 40;
    return {
      x: Math.min(Math.max(-PANEL_W + 80, x), maxX),
      y: Math.min(Math.max(0, y), maxY),
    };
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      const point = "touches" in e ? e.touches[0] : (e as MouseEvent);
      if (!dragRef.current || !point) return;
      const next = clamp(point.clientX - dragRef.current.dx, point.clientY - dragRef.current.dy);
      setPos(next);
    };
    const onUp = () => {
      setDragging(false);
      dragRef.current = null;
      try {
        localStorage.setItem(POS_KEY, JSON.stringify(pos));
      } catch {}
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [dragging, clamp, pos]);

  const startDrag = (clientX: number, clientY: number) => {
    dragRef.current = { dx: clientX - pos.x, dy: clientY - pos.y };
    setDragging(true);
  };

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      setIsAdmin(false);
      return;
    }
    supabase
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }) => {
        if (!cancelled) setIsAdmin(Boolean(data) && !error);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const devQaEnabled = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      if (sessionStorage.getItem("leadio_qa_admin") === "1") return true;
      const params = new URLSearchParams(window.location.search);
      if (params.get("qaAdmin") === "1") {
        sessionStorage.setItem("leadio_qa_admin", "1");
        return true;
      }
    } catch {}
    return false;
  }, []);

  if (!isAdmin && !devQaEnabled) return null;

  const setTier = (tier: QaTier) => updateQaState({ active: true, tier });
  const setEntry = (entry: QaEntry) => {
    updateQaState({ active: true, entry });
    try {
      if (entry === "free_training") setEntryIntent("free_training");
      else if (entry === "promoter") setEntryIntent("premium_course");
      else setEntryIntent("challenge");
    } catch {}
  };

  const setAssessmentMode = (assessmentMode: EntryIntent) => {
    if (assessmentMode === "premium_course") {
      updateQaState({
        active: true,
        assessmentMode,
        tier: "paid",
        flags: { premiumModulesEnabled: true } as any,
      });
    } else {
      updateQaState({
        active: true,
        assessmentMode,
        tier: "free",
        flags: { premiumModulesEnabled: false } as any,
      });
    }
    try { setEntryIntent(assessmentMode); } catch {}
  };

  type SimTarget = "free" | "paid" | "challenge";
  const SIM_CONFIG: Record<SimTarget, {
    label: string;
    tier: QaTier;
    assessmentMode: EntryIntent;
    premium: boolean;
    route: string;
  }> = {
    free:      { label: "Free user",      tier: "free", assessmentMode: "free_training",  premium: false, route: "/user-dashboard" },
    paid:      { label: "Paid user",      tier: "paid", assessmentMode: "premium_course", premium: true,  route: "/blueprint/dashboard" },
    challenge: { label: "Challenge user", tier: "free", assessmentMode: "challenge",      premium: false, route: "/user-dashboard" },
  };

  // Storage key substrings to wipe on a session simulate
  const WIPE_NEEDLES = [
    "user", "auth", "profile", "subscription", "assessment", "course",
    "onboarding", "result", "premium", "leadio", "challengeos", "blueprint",
    "sb-", "supabase",
  ];
  // Keys we must preserve across the simulated reset
  const PRESERVE_KEYS = new Set<string>([
    "leadio_qa_panel_pos",
    "leadio_qa_admin",
    "leadioPreviewState", // QA state we will rewrite below
  ]);

  const wipeStorage = (storage: Storage) => {
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (!k) continue;
        if (PRESERVE_KEYS.has(k)) continue;
        const lower = k.toLowerCase();
        if (WIPE_NEEDLES.some((n) => lower.includes(n))) toRemove.push(k);
      }
      toRemove.forEach((k) => storage.removeItem(k));
    } catch {}
  };

  const simulateSession = async (target: SimTarget) => {
    if (switching) return;
    setSwitching(true);
    const cfg = SIM_CONFIG[target];
    try {
      try { await supabase.auth.signOut({ scope: "local" } as any); } catch {}
      wipeStorage(window.localStorage);
      wipeStorage(window.sessionStorage);
      // Rewrite a clean QA state for the target
      setQaState({
        ...defaultQaState,
        active: true,
        tier: cfg.tier,
        assessmentMode: cfg.assessmentMode,
        flags: { ...defaultQaState.flags, premiumModulesEnabled: cfg.premium },
      });
      try { setEntryIntent(cfg.assessmentMode); } catch {}
      // Full reload so AppContext, auth, and feature gates rehydrate from scratch
      window.location.assign(cfg.route);
    } catch {
      setSwitching(false);
    }
  };

  const enable = () => {
    if (!qa.active) updateQaState({ active: true });
  };
  const exit = () => {
    clearQaState();
    setOpen(false);
  };

  const banner = qa.active && (
    <div className="fixed left-0 right-0 top-0 z-[90] border-b border-amber-500/40 bg-amber-500 text-amber-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-1.5 text-xs font-bold">
        <div className="flex items-center gap-2 truncate">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate uppercase tracking-wider">
            QA Preview Active: {qa.tier} · {qa.entry.replace(/_/g, " ")}
          </span>
        </div>
        <button
          onClick={exit}
          className="shrink-0 rounded-full bg-amber-950/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider hover:bg-amber-950/25"
        >
          Exit Preview
        </button>
      </div>
    </div>
  );

  return (
    <>
      {banner}
      {switching && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-3 bg-background/85 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm font-black uppercase tracking-wider text-foreground">
            Resetting session…
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 left-4 z-[95] inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-black uppercase tracking-wider shadow-lg hover:bg-muted"
        title="QA Mode"
      >
        <Beaker className="h-4 w-4" />
        QA Mode
        {qa.active && <span className="ml-1 h-2 w-2 rounded-full bg-amber-500" />}
      </button>

      {open && (
        <div
          className="fixed z-[95] w-[340px] max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-2xl"
          style={{ left: pos.x, top: pos.y }}
        >
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              startDrag(e.clientX, e.clientY);
            }}
            onTouchStart={(e) => {
              const t = e.touches[0];
              if (t) startDrag(t.clientX, t.clientY);
            }}
            className={`sticky top-0 flex items-center justify-between border-b border-border bg-card px-3 py-2 select-none ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
          >
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <Beaker className="h-4 w-4" />
              QA / Preview Panel
            </div>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={() => setOpen(false)}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 p-3">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel>Preview</SectionLabel>
              <div className="flex gap-1">
                {!qa.active ? (
                  <button onClick={enable} className="rounded border border-border px-2 py-0.5 text-[10px] font-bold uppercase hover:bg-muted">
                    Enable
                  </button>
                ) : (
                  <button onClick={exit} className="rounded border border-destructive/50 px-2 py-0.5 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10">
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setQaState({ ...defaultQaState, active: qa.active })}
                  className="rounded border border-border px-2 py-0.5 text-[10px] font-bold uppercase hover:bg-muted"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-1.5 rounded-md border border-amber-500/40 bg-amber-500/5 p-2">
              <SectionLabel>Simulate Session</SectionLabel>
              <div className="grid grid-cols-3 gap-1.5">
                {(["free","paid","challenge"] as const).map((id) => (
                  <button
                    key={id}
                    disabled={switching}
                    onClick={() => simulateSession(id)}
                    className={`rounded border border-border px-2 py-1.5 text-[11px] font-black uppercase tracking-wider transition ${
                      qa.active && qa.tier === SIM_CONFIG[id].tier && qa.assessmentMode === SIM_CONFIG[id].assessmentMode
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    } disabled:opacity-50`}
                  >
                    {SIM_CONFIG[id].label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Logs out, clears cached user/auth/profile/subscription/assessment/course state, then rehydrates the app as the selected user.
              </p>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Assessment Mode</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {ASSESSMENT_MODES.map((m) => (
                  <Pill
                    key={m.id}
                    active={qa.active && qa.assessmentMode === m.id}
                    onClick={() => setAssessmentMode(m.id)}
                  >
                    {m.label}
                  </Pill>
                ))}
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">
                Switches the unified Assessment's post-result destination. Active mode wins over the route.
              </p>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>User Type</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {TIERS.map((t) => (
                  <Pill key={t.id} active={qa.active && qa.tier === t.id} onClick={() => setTier(t.id)}>
                    {t.label}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Entry Path</SectionLabel>
              <div className="flex flex-wrap gap-1.5">
                {ENTRIES.map((e) => (
                  <Pill key={e.id} active={qa.active && qa.entry === e.id} onClick={() => setEntry(e.id)}>
                    {e.label}
                  </Pill>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Premium Access</SectionLabel>
              <div className="grid gap-1.5">
                <Toggle
                  label="Unlock Premium"
                  checked={qa.flags.premiumModulesEnabled}
                  onChange={(v) => updateQaFlags({ premiumModulesEnabled: v })}
                />
                <button
                  onClick={() => {
                    updateQaFlags({ premiumModulesEnabled: false });
                    updateQaState({ active: true, tier: "free" });
                  }}
                  className="rounded border border-border px-2 py-1 text-[11px] font-bold uppercase hover:bg-muted"
                >
                  Lock Premium
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Quick Routes</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5">
                {ROUTES.map((r) => (
                  <button
                    key={r.path}
                    onClick={() => navigate(r.path)}
                    className="truncate rounded border border-border px-2 py-1 text-left text-[11px] font-bold uppercase hover:bg-muted"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded border border-dashed border-border/60 bg-muted/40 p-2 text-[10px] leading-snug text-muted-foreground">
              Preview overrides are local-only. They do not change Supabase user records or Stripe subscriptions.
              For real logged-out testing use incognito; for real account simulation use Owner Console → View as User.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QaModePanel;
