import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext({
  hideSensitiveData: false,
  setHideSensitiveData: () => null,
  maskStyle: "blur",
  setMaskStyle: () => null,
});

export function SettingsProvider({ children }) {
  const [hideSensitiveData, setHideSensitiveData] = useState(() => {
    return localStorage.getItem("tamga-hide-sensitive") === "true";
  });

  const [maskStyle, setMaskStyle] = useState(() => {
    return localStorage.getItem("tamga-mask-style") || "blur";
  });

  useEffect(() => {
    localStorage.setItem("tamga-hide-sensitive", hideSensitiveData);
  }, [hideSensitiveData]);

  useEffect(() => {
    localStorage.setItem("tamga-mask-style", maskStyle);
  }, [maskStyle]);

  return (
    <SettingsContext.Provider value={{ hideSensitiveData, setHideSensitiveData, maskStyle, setMaskStyle }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};
