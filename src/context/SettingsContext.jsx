import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

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
  autoLockTimeout: 5,
  setAutoLockTimeout: () => null,
});

export function SettingsProvider({ children }) {
  const { activeSession } = useAuth();
  const prefix = activeSession ? `${activeSession.id}-tamga` : 'tamga';
  const [hideSensitiveData, setHideSensitiveData] = useState(() => {
    return localStorage.getItem(`${prefix}-hide-sensitive`) === "true";
  });

  const [maskStyle, setMaskStyle] = useState(() => {
    return localStorage.getItem(`${prefix}-mask-style`) || "blur";
  });

  const [maxFailedAttempts, setMaxFailedAttempts] = useState(() => {
    const saved = localStorage.getItem(`${prefix}-max-failed-attempts`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [failedAction, setFailedAction] = useState(() => {
    return localStorage.getItem(`${prefix}-failed-action`) || "wipe";
  });

  const [backupPath, setBackupPath] = useState(() => {
    return localStorage.getItem(`${prefix}-backup-path`) || "";
  });

  const [autoLockTimeout, setAutoLockTimeout] = useState(() => {
    const saved = localStorage.getItem(`${prefix}-auto-lock-timeout`);
    return saved ? parseInt(saved, 10) : 5;
  });

  useEffect(() => {
    localStorage.setItem(`${prefix}-hide-sensitive`, hideSensitiveData);
  }, [hideSensitiveData]);

  useEffect(() => {
    localStorage.setItem(`${prefix}-mask-style`, maskStyle);
  }, [maskStyle]);

  useEffect(() => {
    localStorage.setItem(`${prefix}-max-failed-attempts`, maxFailedAttempts);
  }, [maxFailedAttempts]);

  useEffect(() => {
    localStorage.setItem(`${prefix}-failed-action`, failedAction);
  }, [failedAction]);

  useEffect(() => {
    localStorage.setItem(`${prefix}-backup-path`, backupPath);
  }, [backupPath]);

  useEffect(() => {
    localStorage.setItem(`${prefix}-auto-lock-timeout`, autoLockTimeout);
  }, [autoLockTimeout]);

  return (
    <SettingsContext.Provider value={{ 
      hideSensitiveData, setHideSensitiveData, 
      maskStyle, setMaskStyle,
      maxFailedAttempts, setMaxFailedAttempts,
      failedAction, setFailedAction,
      backupPath, setBackupPath,
      autoLockTimeout, setAutoLockTimeout
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
