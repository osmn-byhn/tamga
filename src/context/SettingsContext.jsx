import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext({
  hideSensitiveData: false,
  setHideSensitiveData: () => null,
});

export function SettingsProvider({ children }) {
  const [hideSensitiveData, setHideSensitiveData] = useState(() => {
    return localStorage.getItem("tamga-hide-sensitive") === "true";
  });

  useEffect(() => {
    localStorage.setItem("tamga-hide-sensitive", hideSensitiveData);
  }, [hideSensitiveData]);

  return (
    <SettingsContext.Provider value={{ hideSensitiveData, setHideSensitiveData }}>
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
