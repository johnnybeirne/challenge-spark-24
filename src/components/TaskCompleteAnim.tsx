import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

const TaskCompleteAnim = ({ show }: { show: boolean }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1200);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[90] flex items-center justify-center">
      <div className="animate-scale-in">
        <div className="bg-primary/10 rounded-full p-4 animate-pulse">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
      </div>
    </div>
  );
};

export default TaskCompleteAnim;
