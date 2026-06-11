import { createContext, useContext, useState, ReactNode } from "react";

type FocusModeCtx = {
  focusMode: boolean;
  toggleFocusMode: () => void;
  setFocusMode: (v: boolean) => void;
};

const Ctx = createContext<FocusModeCtx>({
  focusMode: false,
  toggleFocusMode: () => {},
  setFocusMode: () => {},
});

export const FocusModeProvider = ({ children }: { children: ReactNode }) => {
  const [focusMode, setFocusMode] = useState(false);
  return (
    <Ctx.Provider
      value={{
        focusMode,
        setFocusMode,
        toggleFocusMode: () => setFocusMode((v) => !v),
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useFocusMode = () => useContext(Ctx);
