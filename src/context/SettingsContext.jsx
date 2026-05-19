import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext({
  hideSensitiveData: false,
  setHideSensitiveData: () => null,
  maskStyle: "blur",
  setMaskStyle: () => null,
  maxFailedAttempts: 0,
  setMaxFailedAttempts: () => null,
  failedAction: "wipe",
  setFailedAction: () => null,
  backupPath: "",
  setBackupPath: () => null,
});

export function SettingsProvider({ children }) {
  const [hideSensitiveData, setHideSensitiveData] = useState(() => {
    return localStorage.getItem("tamga-hide-sensitive") === "true";
  });

  const [maskStyle, setMaskStyle] = useState(() => {
    return localStorage.getItem("tamga-mask-style") || "blur";
  });

  const [maxFailedAttempts, setMaxFailedAttempts] = useState(() => {
    const saved = localStorage.getItem("tamga-max-failed-attempts");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [failedAction, setFailedAction] = useState(() => {
    return localStorage.getItem("tamga-failed-action") || "wipe";
  });

  const [backupPath, setBackupPath] = useState(() => {
    return localStorage.getItem("tamga-backup-path") || "";
  });

  useEffect(() => {
    localStorage.setItem("tamga-hide-sensitive", hideSensitiveData);
  }, [hideSensitiveData]);

  useEffect(() => {
    localStorage.setItem("tamga-mask-style", maskStyle);
  }, [maskStyle]);

  useEffect(() => {
    localStorage.setItem("tamga-max-failed-attempts", maxFailedAttempts);
  }, [maxFailedAttempts]);

  useEffect(() => {
    localStorage.setItem("tamga-failed-action", failedAction);
  }, [failedAction]);

  useEffect(() => {
    localStorage.setItem("tamga-backup-path", backupPath);
  }, [backupPath]);

  return (
    <SettingsContext.Provider value={{ 
      hideSensitiveData, setHideSensitiveData, 
      maskStyle, setMaskStyle,
      maxFailedAttempts, setMaxFailedAttempts,
      failedAction, setFailedAction,
      backupPath, setBackupPath
    }}>
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
