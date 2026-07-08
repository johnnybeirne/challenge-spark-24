// Generate a client-facing DOCX proposal and a technical Requirements.md
// from a list of selected LeadTree features + variant toggles.
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "npm:docx@8.5.0";
import { encodeBase64 } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Phase =
  | "Pre-Challenge"
  | "Challenge"
  | "Post-Challenge"
  | "Admin / Advanced";

type Feature = {
  name: string;
  description: string;
  category: "essential" | "advanced";
  phase: Phase;
  connects: string[];
  /** Only included when this variant toggle is on */
  requiresVariant?: "leadMagnetQuiz" | "internalDiagnostic";
};

// Source of truth — derived from generated Essential.md / Advanced.md
const FEATURES: Feature[] = [
  // Pre-Challenge
  { name: "Signup & Authentication Flow", description: "Email + Google OAuth signup, session persistence, password reset, role-aware redirects.", category: "essential", phase: "Pre-Challenge", connects: ["Personalised Onboarding Memory", "Challenger Dashboard"] },
  { name: "Personalised Onboarding Memory", description: "Captures audience, promise and topic during signup; persisted to AppContext and reused across the journey.", category: "essential", phase: "Pre-Challenge", connects: ["Day 1 Challenge Definition Setup", "AI Coach Chat Copilot"] },
  { name: "9-Question Lead Gen Diagnostic Quiz", description: "Public lead-magnet quiz with scoring doughnut, archetype result and email capture.", category: "essential", phase: "Pre-Challenge", connects: ["AI-Powered Quiz Result Insights", "Signup & Authentication Flow"], requiresVariant: "leadMagnetQuiz" },
  { name: "AI-Powered Quiz Result Insights", description: "Lovable AI generates a tailored insight + next-step nudge from quiz answers.", category: "essential", phase: "Pre-Challenge", connects: ["9-Question Lead Gen Diagnostic Quiz", "Dashboard"], requiresVariant: "leadMagnetQuiz" },

  // Challenge
  { name: "Day 1 Challenge Definition Setup", description: "Guided steps to define audience, promise, topic and challenge title with AI polish.", category: "essential", phase: "Challenge", connects: ["Personalised Onboarding Memory", "AI Coach Chat Copilot"] },
  { name: "Internal Challenge Diagnostic", description: "Inline diagnostic prompts during Day 1 that score readiness and tailor the challenge.", category: "essential", phase: "Challenge", connects: ["Day 1 Challenge Definition Setup", "Dashboard"], requiresVariant: "internalDiagnostic" },
  { name: "AI Coach Chat Copilot", description: "Conversational assistant grounded in user memory; helps complete each day's work.", category: "essential", phase: "Challenge", connects: ["Day 1", "Day 2", "Day 3"] },
  { name: "Voice Dictation Input", description: "Browser speech-to-text on any long-form input so users can talk through answers.", category: "essential", phase: "Challenge", connects: ["AI Coach Chat Copilot", "Day 1", "Day 2"] },
  { name: "Day 2 Quiz Builder", description: "Generate and edit a playable quiz from the user's challenge topic; shareable preview.", category: "essential", phase: "Challenge", connects: ["Day 1 Challenge Definition Setup", "Referral & Invite System"] },
  { name: "Day 3 Challenge Experience Design", description: "Design the live challenge experience, hooks and call-to-action for launch day.", category: "essential", phase: "Challenge", connects: ["Day 2 Quiz Builder", "Challenge Completion & Launch"] },
  { name: "72-Hour Challenge Countdown", description: "Persistent countdown timer that drives urgency across the 3-day flow.", category: "essential", phase: "Challenge", connects: ["Dashboard", "Notifications"] },
  { name: "Challenger Dashboard & Progress Hub", description: "Single home with score doughnut, day cards, unlocks and primary CTA by role.", category: "essential", phase: "Challenge", connects: ["All day pages", "Points & Unlocks"] },
  { name: "Add to Calendar Integration", description: "One-click .ics download to block out the 3-day challenge window.", category: "essential", phase: "Challenge", connects: ["Dashboard", "72-Hour Countdown"] },
  { name: "Training Video Hub", description: "Curated short videos per day, gated by progress, with completion tracking.", category: "essential", phase: "Challenge", connects: ["Dashboard", "Day 1/2/3"] },
  { name: "Challenge Completion & Launch", description: "Marks the challenge live, captures launch URL and triggers community unlock.", category: "essential", phase: "Challenge", connects: ["Builder Circle Community", "Points & Unlocks"] },

  // Post-Challenge
  { name: "Referral & Invite System", description: "Unique invite links, share copy, attribution capture and direct-referral counter.", category: "essential", phase: "Post-Challenge", connects: ["Points & Unlocks", "Builder Circle Community"] },
  { name: "Points & Unlocks Progression", description: "Earn points for milestones; unlock rewards, community and bonus vault.", category: "essential", phase: "Post-Challenge", connects: ["Referral & Invite System", "Redeem Points"] },
  { name: "Builder Circle Community", description: "Gated peer community unlocked at challenge launch + 3 direct referrals.", category: "essential", phase: "Post-Challenge", connects: ["Challenge Completion", "Referral & Invite System"] },
  { name: "Leaderboard & Social Proof", description: "Visibility-tiered leaderboard with activity feed and milestone celebrations.", category: "essential", phase: "Post-Challenge", connects: ["Points & Unlocks", "Referral & Invite System"] },

  // Admin / Advanced
  { name: "Owner Console Admin Panel", description: "Centralized admin shell with sidebar, role guard and live preview for all CMS tools.", category: "advanced", phase: "Admin / Advanced", connects: ["All CMS editors", "User roles"] },
  { name: "CMS Editor (Quiz LP, Powered-By, Day 1/2 copy)", description: "Edit landing, button labels and day step copy live with preview pane.", category: "advanced", phase: "Admin / Advanced", connects: ["Owner Console", "Public landing"] },
  { name: "User Admin & Roles", description: "Six-role system via has_role() RPC, with View-as-User and test accounts.", category: "advanced", phase: "Admin / Advanced", connects: ["Owner Console", "Auth"] },
  { name: "JV Partner System", description: "Partner application, approval, dashboard, sales tracking and payouts.", category: "advanced", phase: "Admin / Advanced", connects: ["Attribution Tracking", "Stripe"] },
  { name: "Attribution Tracking", description: "First-touch + last-touch capture across signup, quiz and partner links.", category: "advanced", phase: "Admin / Advanced", connects: ["JV Partner System", "Analytics"] },
  { name: "Cross-Promo Slots", description: "Configurable promo cards and spotlight slots across post-action moments.", category: "advanced", phase: "Admin / Advanced", connects: ["Dashboard", "Owner Console"] },
  { name: "QA Tools (Personas + Simulated Date)", description: "Switch personas and time-travel the challenge window for end-to-end QA.", category: "advanced", phase: "Admin / Advanced", connects: ["AppContext", "Owner Console"] },
  { name: "Analytics Dashboard", description: "35-event analytics surface with funnel, retention and cohort views.", category: "advanced", phase: "Admin / Advanced", connects: ["All user actions", "Owner Console"] },
  { name: "Stripe Embedded Checkout", description: "Embedded Stripe checkout + webhook for premium and partner products.", category: "advanced", phase: "Admin / Advanced", connects: ["Premium Course", "JV Partner System"] },
  { name: "Premium Course / Blueprint", description: "Paid post-challenge course with lessons, insights and dashboard.", category: "advanced", phase: "Admin / Advanced", connects: ["Stripe Embedded Checkout", "Auth"] },
  { name: "Founding Partner Program", description: "Special tier with private dashboard, perks and partner ops.", category: "advanced", phase: "Admin / Advanced", connects: ["JV Partner System", "Stripe"] },
];

function filterForRequest(
  selected: string[],
  variantLeadMagnetQuiz: boolean,
  variantInternalDiagnostic: boolean,
): Feature[] {
  const set = new Set(selected);
  return FEATURES.filter((f) => {
    if (!set.has(f.name)) return false;
    if (f.requiresVariant === "leadMagnetQuiz" && !variantLeadMagnetQuiz) return false;
    if (f.requiresVariant === "internalDiagnostic" && !variantInternalDiagnostic) return false;
    return true;
  });
}

function groupByPhase(features: Feature[]): Record<Phase, Feature[]> {
  const phases: Phase[] = ["Pre-Challenge", "Challenge", "Post-Challenge", "Admin / Advanced"];
  const out = Object.fromEntries(phases.map((p) => [p, [] as Feature[]])) as Record<Phase, Feature[]>;
  for (const f of features) out[f.phase].push(f);
  return out;
}

async function buildDocx(
  features: Feature[],
  variantLeadMagnetQuiz: boolean,
  variantInternalDiagnostic: boolean,
): Promise<Uint8Array> {
  const grouped = groupByPhase(features);
  const stamp = new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: "LeadTree Custom Build Proposal", bold: true, size: 44, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [new TextRun({ text: `Prepared ${stamp}`, italics: true, color: "666666", size: 22, font: "Arial" })],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({
          text:
            "This proposal outlines the feature set selected for your custom LeadTree build. Each feature is grouped by the phase of the user journey in which it activates, and reflects the variants chosen below.",
          size: 22,
          font: "Arial",
        }),
      ],
    }),

    // Variants
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 160 },
      children: [new TextRun({ text: "Variants Selected", bold: true, size: 30, font: "Arial" })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [
        new TextRun({ text: "Lead Magnet Quiz: ", bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: variantLeadMagnetQuiz ? "Included" : "Not included", size: 22, font: "Arial" }),
      ],
    }),
    new Paragraph({
      spacing: { after: 240 },
      children: [
        new TextRun({ text: "Internal Challenge Diagnostic: ", bold: true, size: 22, font: "Arial" }),
        new TextRun({ text: variantInternalDiagnostic ? "Included" : "Not included", size: 22, font: "Arial" }),
      ],
    }),

    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 240, after: 160 },
      children: [new TextRun({ text: "Selected Features", bold: true, size: 30, font: "Arial" })],
    }),
  );

  for (const phase of ["Pre-Challenge", "Challenge", "Post-Challenge", "Admin / Advanced"] as Phase[]) {
    const items = grouped[phase];
    if (!items.length) continue;
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: phase, bold: true, size: 26, font: "Arial", color: "1F3A8A" })],
      }),
    );
    for (const f of items) {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({ text: f.name, bold: true, size: 24, font: "Arial" }),
            new TextRun({
              text: `  ·  ${f.category === "essential" ? "Essential" : "Advanced"}`,
              size: 18,
              color: f.category === "essential" ? "047857" : "1D4ED8",
              font: "Arial",
            }),
          ],
        }),
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: f.description, size: 22, font: "Arial" })],
        }),
      );
    }
  }

  children.push(
    new Paragraph({
      spacing: { before: 480 },
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "Prepared by Johnny Beirne · LeadTree",
          italics: true,
          color: "888888",
          size: 20,
          font: "Arial",
        }),
      ],
    }),
  );

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 30, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 1 } },
      ],
    },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  const buf = await Packer.toBuffer(doc);
  return new Uint8Array(buf);
}

function buildMarkdown(
  features: Feature[],
  variantLeadMagnetQuiz: boolean,
  variantInternalDiagnostic: boolean,
): string {
  const grouped = groupByPhase(features);
  const stamp = new Date().toISOString();
  const lines: string[] = [];
  lines.push("# LeadTree Custom Build — Technical Requirements");
  lines.push("");
  lines.push(`_Generated ${stamp}_`);
  lines.push("");
  lines.push("## Variants");
  lines.push(`- Lead Magnet Quiz: **${variantLeadMagnetQuiz ? "Yes" : "No"}**`);
  lines.push(`- Internal Challenge Diagnostic: **${variantInternalDiagnostic ? "Yes" : "No"}**`);
  lines.push("");
  lines.push("## Feature List (In Build Order)");
  lines.push("");
  for (const phase of ["Pre-Challenge", "Challenge", "Post-Challenge", "Admin / Advanced"] as Phase[]) {
    const items = grouped[phase];
    if (!items.length) continue;
    lines.push(`### ${phase}`);
    lines.push("");
    for (const f of items) {
      lines.push(`#### ${f.name}`);
      lines.push("");
      lines.push(`- **Category:** ${f.category === "essential" ? "Essential" : "Advanced"}`);
      lines.push(`- **Description:** ${f.description}`);
      lines.push(`- **Connects to:** ${(f.connects || []).join(", ") || "—"}`);
      lines.push("");
    }
  }
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const selected: string[] = Array.isArray(body?.selectedFeatures) ? body.selectedFeatures : [];
    const variantLeadMagnetQuiz = !!body?.variantLeadMagnetQuiz;
    const variantInternalDiagnostic = !!body?.variantInternalDiagnostic;

    if (selected.length < 1) {
      return new Response(JSON.stringify({ error: "Select at least one feature." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const features = filterForRequest(selected, variantLeadMagnetQuiz, variantInternalDiagnostic);
    const docxBytes = await buildDocx(features, variantLeadMagnetQuiz, variantInternalDiagnostic);
    const md = buildMarkdown(features, variantLeadMagnetQuiz, variantInternalDiagnostic);

    return new Response(
      JSON.stringify({
        docxBase64: encodeBase64(docxBytes),
        markdown: md,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message || "Failed to generate spec" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
