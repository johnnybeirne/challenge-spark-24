import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => ({ toast: vi.fn() }));

import { checkAndTriggerUnlocks, defaultState, type AppState, type UnlockEntry } from "./AppContext";
import { toast } from "sonner";

function withDirect(n: number, base: AppState = defaultState): AppState {
  return { ...base, network: { ...base.network, direct: n } };
}

describe("checkAndTriggerUnlocks — early unlocks", () => {
  beforeEach(() => {
    (toast as unknown as ReturnType<typeof vi.fn>).mockClear();
  });

  it("fires faster_start exactly once at direct >= 1", () => {
    const s1 = checkAndTriggerUnlocks(withDirect(1));
    const ids1 = s1.unlocks.map((u) => u.id);
    expect(ids1).toContain("faster_start");
    expect(ids1.filter((id) => id === "faster_start")).toHaveLength(1);

    // Re-run with same state — should NOT add a duplicate
    const s2 = checkAndTriggerUnlocks(s1);
    expect(s2.unlocks.filter((u) => u.id === "faster_start")).toHaveLength(1);
  });

  it("fires ai_accelerator at direct >= 2 and only once across re-runs", () => {
    let s = checkAndTriggerUnlocks(withDirect(2));
    expect(s.unlocks.some((u) => u.id === "ai_accelerator")).toBe(true);

    for (let i = 0; i < 5; i++) s = checkAndTriggerUnlocks(s);
    expect(s.unlocks.filter((u) => u.id === "ai_accelerator")).toHaveLength(1);
  });

  it("fires momentum_boost at direct >= 3 and auto-completes day1_create_structure", () => {
    const s = checkAndTriggerUnlocks(withDirect(3));
    expect(s.unlocks.some((u) => u.id === "momentum_boost")).toBe(true);
    expect(s.challenge.tasks["day1_create_structure"]).toBe(true);
  });

  it("does NOT fire early unlocks when invite count is below threshold", () => {
    const s = checkAndTriggerUnlocks(withDirect(0));
    const ids = s.unlocks.map((u) => u.id);
    expect(ids).not.toContain("faster_start");
    expect(ids).not.toContain("ai_accelerator");
    expect(ids).not.toContain("momentum_boost");
  });

  it("fires all three early unlocks together when jumping from 0 → 3 invites", () => {
    const s = checkAndTriggerUnlocks(withDirect(3));
    const earlyIds = s.unlocks
      .map((u) => u.id)
      .filter((id) => ["faster_start", "ai_accelerator", "momentum_boost"].includes(id));
    expect(earlyIds.sort()).toEqual(["ai_accelerator", "faster_start", "momentum_boost"]);
  });

  it("does not re-fire after a simulated reload (state hydrated with existing unlocks)", () => {
    // First session: user hits 3 invites
    const session1 = checkAndTriggerUnlocks(withDirect(3));
    const session1Ids = session1.unlocks.map((u) => u.id).sort();

    // Simulate reload: hydrate fresh state from "storage" with the previously persisted unlocks
    const hydrated: AppState = {
      ...defaultState,
      network: { ...defaultState.network, direct: 3 },
      unlocks: session1.unlocks.map((u) => ({ ...u })),
      challenge: { ...defaultState.challenge, tasks: { day1_create_structure: true } },
    };

    const session2 = checkAndTriggerUnlocks(hydrated);
    const session2Ids = session2.unlocks.map((u) => u.id).sort();

    expect(session2Ids).toEqual(session1Ids);
    // Each early unlock appears exactly once
    for (const id of ["faster_start", "ai_accelerator", "momentum_boost"]) {
      expect(session2.unlocks.filter((u) => u.id === id)).toHaveLength(1);
    }
  });

  it("dedupes pre-existing duplicate entries in state.unlocks (runtime guard)", () => {
    const dup: UnlockEntry = {
      id: "faster_start",
      name: "Faster Start Mode",
      value: 29,
      reason: "Invited first builder",
      timestamp: new Date().toISOString(),
    };
    const corrupted: AppState = {
      ...defaultState,
      network: { ...defaultState.network, direct: 1 },
      unlocks: [dup, { ...dup, timestamp: new Date().toISOString() }],
    };

    const cleaned = checkAndTriggerUnlocks(corrupted);
    expect(cleaned.unlocks.filter((u) => u.id === "faster_start")).toHaveLength(1);
  });

  it("emits toast only on first fire, not on subsequent re-runs", () => {
    const toastMock = toast as unknown as ReturnType<typeof vi.fn>;
    const s1 = checkAndTriggerUnlocks(withDirect(1));
    const callsAfterFirst = toastMock.mock.calls.length;
    expect(callsAfterFirst).toBeGreaterThan(0);

    checkAndTriggerUnlocks(s1);
    checkAndTriggerUnlocks(s1);
    expect(toastMock.mock.calls.length).toBe(callsAfterFirst);
  });
});
