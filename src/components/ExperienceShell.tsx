import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  getExperienceFromPath,
  getExperienceConfig,
  getNavigationForExperience,
  type ExperienceType,
  type ExperienceConfig,
  type NavItem,
} from "@/lib/experienceShell";

type ExperienceShellContextValue = {
  experience: ExperienceType;
  config: ExperienceConfig;
  navigation: NavItem[];
  pathname: string;
};

const ExperienceShellContext = createContext<ExperienceShellContextValue | null>(null);

export const useExperienceShell = (): ExperienceShellContextValue => {
  const ctx = useContext(ExperienceShellContext);
  if (ctx) return ctx;
  // Safe fallback so components used outside the provider don't crash.
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
  const experience = getExperienceFromPath(pathname);
  return {
    experience,
    config: getExperienceConfig(experience),
    navigation: getNavigationForExperience(experience),
    pathname,
  };
};

const ExperienceShell = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const value = useMemo<ExperienceShellContextValue>(() => {
    const experience = getExperienceFromPath(pathname);
    return {
      experience,
      config: getExperienceConfig(experience),
      navigation: getNavigationForExperience(experience),
      pathname,
    };
  }, [pathname]);

  return (
    <ExperienceShellContext.Provider value={value}>
      {children}
    </ExperienceShellContext.Provider>
  );
};

export default ExperienceShell;
