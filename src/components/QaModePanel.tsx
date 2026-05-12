import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Beaker, X, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppState } from "@/context/AppContext";
import { useQaPreview } from "@/hooks/useQaPreview";
import {
  clearQaState,
  defaultQaState,
  setQaState,
  updateQaFlags,
  updateQaState,
  type QaAuth,
  type QaEntry,
  type QaTier,
} from "@/lib/qaPreview";
import { setEntryIntent } from "@/lib/entryIntent";

const TIERS: { id: QaTier; label: string }[] = [
  { id: "free", label: "Free" },
  { id: "trial", label: "Trial" },
  { id: "paid", label: "Paid" },
  { id: "admin", label: "Admin" },
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
  const { state, setState } = useAppState();
  const qa = useQaPreview();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

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

  // Allow non-authed admin override via ?qaAdmin=1 (dev convenience) — opt-in.
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

  const setTier = (tier: QaTier) => {
    updateQaState({ active: true, tier });
  };
  const setEntry = (entry: QaEntry) => {
    updateQaState({ active: true, entry });
    try { setEntryIntent(entry as any); } catch {}
  };
  const setAuth = (auth: QaAuth) => {
    updateQaState({ active: true, auth });
    if (auth === "logged_out") navigate("/", { replace: true });
  };

  const enable = () => {
    if (!qa.active) updateQaState({ active: true });
  };

  const exit = () => {
    clearQaState();
    setOpen(false);
  };

  // Progress simulators – modify in-memory state only (Supabase sync hook will
  // persist; admins should run these on test accounts).
  const resetProgress = () => {
    setState((s) => ({
      ...s,
      challenge: { ...s.challenge, currentDay: 1, completed: false, tasks: {}, launchUrl: "" },
      assessment: null,
      community: { ...s.community, unlocked: false },
    }));
  };
  const simulateNew = () => {
    resetProgress();
    navigate("/");
  };
  const simulateReturning = () => {
    setState((s) => ({ ...s, challenge: { ...s.challenge, currentDay: 2 } }));
    navigate("/user-dashboard");
  };
  const simulateAssessmentDone = () => {
    setState((s) => ({
      ...s,
      assessment: s.assessment || { score: 70, tier: "med", answers: {}, completedAt: new Date().toISOString() },
    }));
    navigate("/results");
  };

  const banner = qa.active && (
    <div className="fixed left-0 right-0 top-0 z-[90] border-b border-amber-500/40 bg-amber-500 text-amber-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-1.5 text-xs font-bold">
        <div className="flex items-center gap-2 truncate">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate uppercase tracking-wider">
            QA Preview Active: {qa.tier} · {qa.entry.replace(/_/g, " ")} · {qa.auth.replace("_", " ")}
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
        <div className="fixed bottom-16 left-4 z-[95] w-[340px] max-h-[80vh] overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider">
              <Beaker className="h-4 w-4" />
              QA / Preview Panel
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 hover:bg-muted">
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
              <SectionLabel>Auth State</SectionLabel>
              <div className="flex gap-1.5">
                <Pill active={qa.active && qa.auth === "logged_in"} onClick={() => setAuth("logged_in")}>Logged In</Pill>
                <Pill active={qa.active && qa.auth === "logged_out"} onClick={() => setAuth("logged_out")}>Logged Out</Pill>
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Module Access</SectionLabel>
              <div className="grid gap-1.5">
                <Toggle label="Unlock Module 4" checked={qa.flags.module4Unlocked} onChange={(v) => updateQaFlags({ module4Unlocked: v })} />
                <Toggle label="Unlock Module 5" checked={qa.flags.module5Unlocked} onChange={(v) => updateQaFlags({ module5Unlocked: v })} />
                <Toggle label="Unlock Premium" checked={qa.flags.premiumModulesEnabled} onChange={(v) => updateQaFlags({ premiumModulesEnabled: v })} />
                <button
                  onClick={() => { updateQaFlags({ premiumModulesEnabled: false }); updateQaState({ active: true, tier: "free" }); }}
                  className="rounded border border-border px-2 py-1 text-[11px] font-bold uppercase hover:bg-muted"
                >
                  Lock Premium
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>Feature Flags</SectionLabel>
              <div className="grid gap-1.5">
                <Toggle label="AI enabled" checked={qa.flags.aiEnabled} onChange={(v) => updateQaFlags({ aiEnabled: v })} />
                <Toggle label="Referral system" checked={qa.flags.referralEnabled} onChange={(v) => updateQaFlags({ referralEnabled: v })} />
                <Toggle label="Assessment completed" checked={qa.flags.assessmentCompleted} onChange={(v) => updateQaFlags({ assessmentCompleted: v })} />
                <Toggle label="Community unlocked" checked={qa.flags.communityUnlocked} onChange={(v) => updateQaFlags({ communityUnlocked: v })} />
                <Toggle label="Builder Circle" checked={qa.flags.builderCircleUnlocked} onChange={(v) => updateQaFlags({ builderCircleUnlocked: v })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <SectionLabel>User Progress</SectionLabel>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={resetProgress} className="rounded border border-border px-2 py-1 text-[11px] font-bold uppercase hover:bg-muted">Reset</button>
                <button onClick={simulateNew} className="rounded border border-border px-2 py-1 text-[11px] font-bold uppercase hover:bg-muted">New User</button>
                <button onClick={simulateReturning} className="rounded border border-border px-2 py-1 text-[11px] font-bold uppercase hover:bg-muted">Returning</button>
                <button onClick={simulateAssessmentDone} className="rounded border border-border px-2 py-1 text-[11px] font-bold uppercase hover:bg-muted">Assessment Done</button>
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
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QaModePanel;
