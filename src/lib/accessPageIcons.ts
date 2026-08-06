import * as Icons from "lucide-react";
import { Sparkles } from "lucide-react";

/** Icons offered to the owner for text items on access pages. */
export const ACCESS_ICON_OPTIONS = [
  "Sparkles",
  "GraduationCap",
  "Users",
  "Heart",
  "CalendarDays",
  "Video",
  "Rocket",
  "Trophy",
  "Target",
  "Lightbulb",
  "MessageCircle",
  "Compass",
  "Star",
  "CheckCircle",
  "Clock",
  "Handshake",
] as const;

export function getAccessIcon(name: string) {
  const Icon = (Icons as unknown as Record<string, any>)[name];
  return typeof Icon === "function" || typeof Icon === "object" ? Icon : Sparkles;
}
