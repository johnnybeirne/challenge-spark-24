import LeadTreeLogoAnimation from "@/components/LeadTreeLogoAnimation";
import leadtreeLogo from "@/assets/leadtree-logo.png.asset.json";

const LogoAnimationPreview = () => {
  const sizes = [48, 96, 160, 240];

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="mx-auto max-w-4xl space-y-12">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">LeadTree Logo Animation</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Preview of the sapling draw-on animation used in the quiz generation screen.
          </p>
        </header>

        {/* Isolated animation, multiple sizes */}
        <section className="rounded-xl border bg-card p-8">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Isolated · size variations
          </h2>
          <div className="flex flex-wrap items-end justify-around gap-8">
            {sizes.map((size) => (
              <div key={size} className="flex flex-col items-center gap-3">
                <LeadTreeLogoAnimation size={size} />
                <span className="text-xs text-muted-foreground">{size}px</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quiz generation header context */}
        <section className="rounded-xl border bg-card p-8">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            In context · quiz generation header
          </h2>
          <div className="flex min-h-[420px] items-center justify-center rounded-lg bg-background">
            <div className="flex w-full max-w-md flex-col items-center px-6 text-center">
              <div className="mb-10 flex flex-col items-center">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Powered by
                </p>
                <img
                  src={leadtreeLogo.url}
                  alt="LeadTree"
                  width={120}
                  className="h-auto w-[120px]"
                />
              </div>

              <div className="mb-8 flex items-center justify-center">
                <LeadTreeLogoAnimation size={96} />
              </div>

              <div className="flex h-6 items-center justify-center">
                <p className="text-[20px] text-muted-foreground">
                  Crafting your quiz<span className="ml-0.5 animate-pulse">|</span>
                </p>
              </div>
              <p className="mt-3 text-xs text-muted-foreground/70">Step 1 of 5</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LogoAnimationPreview;
