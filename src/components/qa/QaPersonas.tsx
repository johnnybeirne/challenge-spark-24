import { updateQaState } from "@/lib/qaPreview";
import { PERSONAS, CHARACTERS, type PersonaId } from "@/lib/personas";
import { useQaPreview } from "@/hooks/useQaPreview";

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
    {children}
  </div>
);

const QaPersonas = () => {
  const qa = useQaPreview();
  const activePersona = qa.persona ?? "";
  const activeCharacter = qa.character ?? "";

  const selectPersona = (id: PersonaId | "") => {
    if (!id) {
      updateQaState({ persona: null });
      return;
    }
    // Setting a persona activates QA and clears the manual date picker
    // so the persona's own backdated startedAt is what the app uses.
    updateQaState({ active: true, persona: id, simulatedJoinedAt: null });
  };

  const selectCharacter = (id: string) => {
    if (!id) {
      updateQaState({ character: null });
      return;
    }
    updateQaState({ active: true, character: id });
  };

  const currentPersona = PERSONAS.find((p) => p.id === qa.persona);
  const currentCharacter = CHARACTERS.find((c) => c.id === qa.character);

  return (
    <div className="space-y-1.5 rounded-md border border-primary/40 bg-primary/5 p-2">
      <SectionLabel>Persona Preset</SectionLabel>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Who</div>
          <select
            value={activeCharacter}
            onChange={(e) => selectCharacter(e.target.value)}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
          >
            <option value="">No character</option>
            {CHARACTERS.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Stage</div>
          <select
            value={activePersona}
            onChange={(e) => selectPersona(e.target.value as PersonaId | "")}
            className="w-full rounded border border-border bg-background px-2 py-1.5 text-xs text-foreground"
          >
            <option value="">Select stage</option>
            {PERSONAS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>
      {currentPersona ? (
        <p className="text-[10px] leading-snug text-foreground">{currentPersona.description}</p>
      ) : (
        <p className="text-[10px] leading-snug text-muted-foreground">
          Overlays tasks, AI outputs, points, referrals and dates. Nothing is saved to the database.
        </p>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => { selectPersona(""); selectCharacter(""); }}
          disabled={!currentPersona && !currentCharacter}
          className="rounded border border-border bg-background px-2 py-1 text-[11px] font-bold uppercase hover:bg-muted disabled:opacity-50"
        >
          Clear
        </button>
        <button
          onClick={() => { window.location.href = "/challenger-dashboard"; }}
          disabled={!currentPersona && !currentCharacter}
          className="rounded border border-primary bg-primary px-2 py-1 text-[11px] font-bold uppercase text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Go to dashboard
        </button>
      </div>
      {(currentPersona || currentCharacter) && (
        <p className="text-[10px] leading-snug text-muted-foreground">
          Persona only changes challenge/task/points state. Open the dashboard or a day page to see it.
        </p>
      )}
    </div>
  );
};

export default QaPersonas;
