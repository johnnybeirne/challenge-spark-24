import hostImage from "@/assets/johnny-beirne.png";

interface HostBadgeProps {
  /** Replace easily later by passing a different src. */
  src?: string;
  name?: string;
  label?: string;
  className?: string;
  align?: "start" | "center";
}

const HostBadge = ({
  src = hostImage,
  name = "Johnny Beirne",
  label = "Hosted by",
  className = "",
  align = "start",
}: HostBadgeProps) => {
  const justify = align === "center" ? "justify-center" : "justify-start";
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
