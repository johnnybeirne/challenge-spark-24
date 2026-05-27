import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface SpeechRecognitionAlternativeLike {
  transcript?: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike | undefined;
}

interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export function useDictation() {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onUpdateRef = useRef<((text: string, isFinal: boolean) => void) | null>(null);
  const finalRef = useRef<string>("");
  const manualStopRef = useRef<boolean>(false);
  const shouldRunRef = useRef<boolean>(false);
  const restartTimerRef = useRef<number | null>(null);
  const startingRef = useRef<boolean>(false);

  const isSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    shouldRunRef.current = false;
    startingRef.current = false;
    if (restartTimerRef.current) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      void 0;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(
    (onUpdate: (text: string, isFinal: boolean) => void) => {
      if (!isSupported) {
        toast.error("Voice dictation isn't supported in this browser. Try Chrome or Safari.");
        return;
      }
      if (shouldRunRef.current) {
        stop();
        return;
      }

      const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!Ctor) return;

      onUpdateRef.current = onUpdate;
      finalRef.current = "";
      manualStopRef.current = false;
      shouldRunRef.current = true;

      const startRecognizer = (rec: SpeechRecognitionLike) => {
        if (!shouldRunRef.current || startingRef.current) return;
        startingRef.current = true;
        try {
          rec.start();
          setIsListening(true);
        } catch (err: unknown) {
          if (shouldRunRef.current) {
            restartTimerRef.current = window.setTimeout(() => {
              restartTimerRef.current = null;
              const next = buildRecognizer();
              recognitionRef.current = next;
              startingRef.current = false;
              startRecognizer(next);
            }, 350);
            return;
          }
          toast.error(err instanceof Error ? err.message : "Couldn't start dictation.");
          setIsListening(false);
        } finally {
          startingRef.current = false;
        }
      };

      const buildRecognizer = () => {
        const rec = new Ctor();
        rec.lang = "en-US";
        rec.interimResults = true;
        rec.continuous = true;
        rec.maxAlternatives = 1;

        rec.onresult = (e) => {
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
        rec.onerror = (e) => {
          if (e.error === "not-allowed" || e.error === "service-not-allowed") {
            toast.error(
              "Microphone access was blocked. Click the mic icon in your browser's address bar and allow microphone, then try again."
            );
            shouldRunRef.current = false;
            setIsListening(false);
          } else if (e.error === "audio-capture") {
            toast.error("No microphone found. Connect a mic and try again.");
            shouldRunRef.current = false;
            setIsListening(false);
          } else if (e.error === "no-speech" || e.error === "aborted" || e.error === "network") {
            // Benign — onend will auto-restart if we're still meant to be running.
          } else {
            // Some browsers emit transient speech-service errors mid-session.
            // Keep the session alive and let onend rebuild the recognizer.
            if (!shouldRunRef.current) return;
          }
        };
        rec.onend = () => {
          // Chrome ends the session after silence even with continuous=true.
          // Restart transparently unless the user pressed Stop.
          if (shouldRunRef.current && !manualStopRef.current) {
            restartTimerRef.current = window.setTimeout(() => {
              restartTimerRef.current = null;
              const next = buildRecognizer();
              recognitionRef.current = next;
              startRecognizer(next);
            }, 250);
            return;
          }
          setIsListening(false);
        };
        return rec;
      };

      const rec = buildRecognizer();
      recognitionRef.current = rec;

      // Critical: starting SpeechRecognition alone often fails silently in
      // sandboxed/iframed contexts (e.g. preview iframes) because no mic
      // permission has been granted. Explicitly request the mic first — this
      // call MUST stay inside the user-gesture click handler.
      const begin = () => {
        startRecognizer(rec);
      };

      if (navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            stream.getTracks().forEach((t) => t.stop());
            begin();
          })
          .catch((err) => {
            shouldRunRef.current = false;
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
    [isSupported, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { isListening, isSupported, toggle: start, stop };
}
