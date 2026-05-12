import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Play, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Prompt {
  category: string;
  title: string;
  description: string;
  prompt: string;
}

const PROMPTS: Prompt[] = [
  { category: "Challenge Ideas", title: "Choose a challenge idea", description: "Surface a list of high-leverage ideas based on your expertise.", prompt: "Help me choose a challenge idea based on my expertise and audience." },
  { category: "Challenge Ideas", title: "Turn expertise into a challenge", description: "Convert what you already know into a participant outcome.", prompt: "Turn my expertise into a 3-day challenge with a clear outcome." },
  { category: "Naming", title: "Generate challenge names", description: "Get 10 punchy, outcome-led name options.", prompt: "Give me 10 challenge name ideas that are outcome-driven and easy to share." },
  { category: "Naming", title: "Refine a name", description: "Tighten an existing name for clarity and pull.", prompt: "Refine this challenge name to be clearer and more compelling: [paste name]" },
  { category: "Engagement", title: "Daily engagement prompts", description: "Keep participants posting and interacting daily.", prompt: "Create 5 daily engagement prompts to keep participants active in my challenge." },
  { category: "Engagement", title: "Hook the first 24 hours", description: "Maximise day-one excitement and momentum.", prompt: "What should I do in the first 24 hours of a challenge to hook participants?" },
  { category: "Accountability", title: "Accountability framework", description: "Build a simple system that drives completion.", prompt: "Design an accountability framework for a 3-day challenge that increases completion rates." },
  { category: "Accountability", title: "Reminder messages", description: "Write reminder messages that feel personal, not pushy.", prompt: "Write 3 reminder messages I can send to participants who haven't shown up yet today." },
  { category: "Launch", title: "Launch checklist", description: "Everything you need ready before opening doors.", prompt: "Create a complete launch checklist for my first 3-day challenge." },
  { category: "Launch", title: "Launch announcement post", description: "A sharp social post that drives signups.", prompt: "Write a launch announcement post for my challenge that drives signups." },
  { category: "Retention", title: "Avoid common mistakes", description: "The top mistakes new challenge runners make.", prompt: "What common mistakes should I avoid when running my first challenge?" },
  { category: "Retention", title: "Re-engage drop-offs", description: "Win back participants who went quiet.", prompt: "Write a message to re-engage participants who dropped off mid-challenge." },
  { category: "Monetization", title: "Pitch the next step", description: "A non-pushy offer at the end of the challenge.", prompt: "Help me design a soft pitch at the end of my challenge that converts without feeling salesy." },
  { category: "Monetization", title: "Offer ladder", description: "Map a path from free challenge to paid product.", prompt: "Map an offer ladder from my free challenge to a paid program." },
];

const CATEGORIES = ["All", "Challenge Ideas", "Naming", "Engagement", "Accountability", "Launch", "Retention", "Monetization"];

const PromptLibrary = () => {
  const navigate = useNavigate();
  const [active, setActive] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = PROMPTS.filter((p) => {
    const inCat = active === "All" || p.category === active;
    const q = query.trim().toLowerCase();
    const inQuery = !q || p.title.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q);
    return inCat && inQuery;
  });

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Prompt copied");
  };

  const run = (text: string) => {
    navigate(`/mentor?prompt=${encodeURIComponent(text)}`);
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 lg:py-10">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Prompt Library
        </div>
        <h1 className="mt-3 text-3xl font-black text-foreground sm:text-4xl">Ready-to-use challenge prompts</h1>
        <p className="mt-2 text-sm text-muted-foreground">Copy a prompt or run it directly with the Johnny AI.</p>
      </header>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts…" className="pl-9" />
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setActive(c)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              active === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {filtered.map((p) => (
          <article key={p.title} className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
            <p className="text-[10px] font-black uppercase tracking-wider text-primary">{p.category}</p>
            <h3 className="mt-1 text-base font-black text-foreground">{p.title}</h3>
            <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.description}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => copy(p.prompt)}>
                <Copy className="h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => run(p.prompt)}>
                <Play className="h-3.5 w-3.5" /> Run with Mentor
              </Button>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No prompts match your search.</p>
        )}
      </div>
    </main>
  );
};

export default PromptLibrary;
