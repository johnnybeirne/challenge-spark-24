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
  const onResultRef = useRef<((text: string) => void) | null>(null);

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
    (onResult: (text: string) => void) => {
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
      rec.interimResults = false;
      rec.continuous = false;
      rec.maxAlternatives = 1;

      onResultRef.current = onResult;

      rec.onresult = (e: any) => {
        const text = Array.from(e.results)
          .map((r: any) => r[0]?.transcript || "")
          .join(" ")
          .trim();
        if (text) onResultRef.current?.(text);
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
