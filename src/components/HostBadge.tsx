import hostImage from "@/assets/johnny-beirne.png";

interface HostBadgeProps {
  /** Replace easily later by passing a different src. */
  src?: string;
  name?: string;
  label?: string;
  className?: string;
  align?: "start" | "center";
  size?: "sm" | "lg";
}

const HostBadge = ({
  src = hostImage,
  name = "Johnny Beirne",
  label = "Hosted by",
  className = "",
  align = "start",
  size = "sm",
}: HostBadgeProps) => {
  const justify = align === "center" ? "justify-center" : "justify-start";

  if (size === "lg") {
    const itemsAlign = align === "center" ? "items-center text-center" : "items-start text-left";
    return (
      <div className={`flex flex-col gap-4 ${itemsAlign} ${className}`}>
        <div className="relative">
          <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-md" />
          <img
            src={src}
            alt={name}
            loading="lazy"
            className="relative h-32 w-32 rounded-[1.75rem] object-cover shadow-xl ring-1 ring-border sm:h-36 sm:w-36 md:h-40 md:w-40"
          />
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p className="text-base font-semibold text-foreground">{name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${justify} ${className}`}>
      <img
        src={src}
        alt={name}
        loading="lazy"
        className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
      />
      <div className="text-left leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold text-foreground">{name}</p>
      </div>
    </div>
  );
};

export default HostBadge;
