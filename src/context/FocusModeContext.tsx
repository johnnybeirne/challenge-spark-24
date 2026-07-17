import { createContext, useContext, useState, ReactNode } from "react";

type FocusModeCtx = {
  focusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (v: boolean) => void;
  leftCollapsed: boolean;
  toggleLeft: () => void;
  rightCollapsed: boolean;
  toggleRight: () => void;
};

const Ctx = createContext<FocusModeCtx>({
  focusMode: false,
  toggleFocusMode: () => {},
  setFocusMode: () => {},
  leftCollapsed: false,
  toggleLeft: () => {},
  rightCollapsed: false,
  toggleRight: () => {},
});

export const FocusModeProvider = ({ children }: { children: ReactNode }) => {
  const [focusMode, setFocusMode] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  return (
    <Ctx.Provider
      value={{
        focusMode,
        setFocusMode,
        toggleFocusMode: () => setFocusMode((v) => !v),
        leftCollapsed,
        toggleLeft: () => setLeftCollapsed((v) => !v),
        rightCollapsed,
        toggleRight: () => setRightCollapsed((v) => !v),
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useFocusMode = () => useContext(Ctx);
