import { useEffect, useState } from "react";
import { getQaState, QA_PREVIEW_EVENT, type QaPreviewState } from "@/lib/qaPreview";

export const useQaPreview = (): QaPreviewState => {
  const [s, setS] = useState<QaPreviewState>(() => getQaState());
  useEffect(() => {
    const update = () => setS(getQaState());
    window.addEventListener(QA_PREVIEW_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(QA_PREVIEW_EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return s;
};
