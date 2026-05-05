import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type SR = any;

declare global {
  interface Window {
    SpeechRecognition?: SR;
    webkitSpeechRecognition?: SR;
  }
}

export function useDictation() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const onUpdateRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);
  const finalRef = useRef<string>("");

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsListening(false);
  }, []);

  const start = useCallback(
    (onUpdate: (text: string, isFinal: boolean) => void) => {
      if (!isSupported) {
        toast.error("Voice dictation isn't supported in this browser. Try Chrome or Safari.");
        return;
      }
      if (isListening) {
        stop();
        return;
      }
      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = true;
      rec.continuous = true;
      rec.maxAlternatives = 1;

      onUpdateRef.current = onUpdate;
      finalRef.current = "";

      rec.onresult = (e: any) => {
        let interim = "";
        let newFinal = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const txt = res[0]?.transcript || "";
          if (res.isFinal) newFinal += txt;
          else interim += txt;
        }
        if (newFinal) {
          finalRef.current = (finalRef.current + " " + newFinal).trim();
          onUpdateRef.current?.(finalRef.current, true);
        }
        const combined = (finalRef.current + " " + interim).trim();
        if (combined) onUpdateRef.current?.(combined, false);
      };
      rec.onerror = (e: any) => {
        if (e.error !== "aborted" && e.error !== "no-speech") {
          toast.error("Couldn't capture audio. Please try again.");
        }
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
      try {
        rec.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    },
    [isListening, isSupported, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { isListening, isSupported, toggle: start, stop };
}
