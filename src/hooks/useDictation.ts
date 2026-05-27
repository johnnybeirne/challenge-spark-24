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
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          toast.error(
            "Microphone access was blocked. Click the mic icon in your browser's address bar and allow microphone, then try again."
          );
        } else if (e.error === "audio-capture") {
          toast.error("No microphone found. Connect a mic and try again.");
        } else if (e.error !== "aborted" && e.error !== "no-speech") {
          toast.error(`Couldn't capture audio (${e.error}). Please try again.`);
        }
        setIsListening(false);
      };
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;

      // Critical: starting SpeechRecognition alone often fails silently in
      // sandboxed/iframed contexts (e.g. preview iframes) because no mic
      // permission has been granted. Explicitly request the mic first — this
      // call MUST stay inside the user-gesture click handler.
      const begin = () => {
        try {
          rec.start();
          setIsListening(true);
        } catch (err: any) {
          setIsListening(false);
          toast.error(err?.message || "Couldn't start dictation.");
        }
      };

      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            // We only needed permission — release the stream immediately so
            // SpeechRecognition can own the mic.
            stream.getTracks().forEach((t) => t.stop());
            begin();
          })
          .catch((err) => {
            if (err?.name === "NotAllowedError") {
              toast.error(
                "Microphone permission denied. Allow microphone access for this site and try again."
              );
            } else if (err?.name === "NotFoundError") {
              toast.error("No microphone found.");
            } else if (err?.name === "NotReadableError") {
              toast.error("Microphone is in use by another app.");
            } else {
              toast.error(err?.message || "Couldn't access microphone.");
            }
            setIsListening(false);
          });
      } else {
        begin();
      }
    },
    [isListening, isSupported, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { isListening, isSupported, toggle: start, stop };
}
