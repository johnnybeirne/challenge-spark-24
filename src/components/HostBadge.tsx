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
      <div className={`inline-flex items-center gap-4 ${className}`}>
        <img
          src={src}
          alt={name}
          loading="lazy"
          className="h-16 w-16 rounded-full object-cover shadow-sm ring-1 ring-border sm:h-20 sm:w-20"
        />
        <div className={`flex flex-col leading-tight ${itemsAlign}`}>
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
