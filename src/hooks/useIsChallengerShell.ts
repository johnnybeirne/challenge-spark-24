// Canonical gate for the Challenger UI shell (left sidebar, top nav,
// right rail, center dashboard, mobile bottom nav).
//
// Returns true when ANY of the following is true:
//   1. The user's real role is "challenger".
//   2. The user is admin AND is on a challenger-owned route
//      (/challenger-dashboard, /challenge/*, /unlocks, /referrals,
//       /bonus-vault, /rewards) — so admin can audit the experience.
//   3. The admin "view-as-user" session flag is set (DEMO_USER_KEY === "1"),
//      which means admin clicked /let-me-in to preview as a real challenger.
//
// Use this hook in AppShell, TopBar, ChallengeSidebar, RightRail and
// the Dashboard so the gate is consistent everywhere.

import { useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { DEMO_USER_KEY } from "@/pages/AdminViewAsUser";

const CHALLENGER_ROUTE_PREFIXES = [
  "/challenger-dashboard",
  "/challenge/",
  "/challenge",
  "/day/",
  "/unlocks",
  "/referrals",
  "/bonus-vault",
  "/rewards",
];

const isChallengerRoute = (pathname: string) =>
  CHALLENGER_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`) || (p.endsWith("/") && pathname.startsWith(p))
  );

const hasDemoFlag = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(DEMO_USER_KEY) === "1";
  } catch {
    return false;
  }
};

export function useIsChallengerShell(): boolean {
  const { role } = useUserRole();
  const { pathname } = useLocation();

  if (role === "challenger") return true;
  if (hasDemoFlag()) return true;
  if (role === "admin" && isChallengerRoute(pathname)) return true;
  return false;
}
