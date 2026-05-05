import { CheckCircle2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  eyebrow: string;
  videoTitle: string;
  subtitle: string;
  placeholderLabel: string;
  lesson: string;
  watched: boolean;
  watchedLabel?: string;
  ctaLabel: string;
  onMarkWatched: () => void;
  primaryCta?: { label: string; onClick: () => void };
  secondaryCta?: { label: string; onClick: () => void };
}

const TrainingVideoCard = ({
  eyebrow,
  videoTitle,
  subtitle,
  placeholderLabel,
  lesson,
  watched,
  watchedLabel = "Training complete",
  ctaLabel,
  onMarkWatched,
  primaryCta,
  secondaryCta,
}: Props) => {
  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">{eyebrow}</p>
          {watched && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
              <CheckCircle2 className="h-3 w-3" /> {watchedLabel}
            </span>
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground sm:text-2xl">{videoTitle}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-4 flex aspect-video items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 via-muted/40 to-muted/60 border border-border">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <PlayCircle className="h-12 w-12 text-primary" />
            <span className="text-sm font-medium">{placeholderLabel}</span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground/80">{lesson}</p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          {primaryCta && (
            <Button onClick={primaryCta.onClick} className="sm:flex-1">
              {primaryCta.label}
            </Button>
          )}
          {secondaryCta && (
            <Button variant="outline" onClick={secondaryCta.onClick} className="sm:flex-1">
              {secondaryCta.label}
            </Button>
          )}
          <Button
            variant={watched ? "secondary" : "ghost"}
            size="sm"
            onClick={onMarkWatched}
            className="sm:ml-auto"
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {watched ? "Marked watched" : ctaLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingVideoCard;
