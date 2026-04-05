import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionPath }: EmptyStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed">{description}</p>
      {actionLabel && actionPath && (
        <Button className="mt-5 min-h-[44px]" onClick={() => navigate(actionPath)}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
