import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";

export default function AutoLock() {
  const { lock, isLocked, hasPassword } = useAuth();
  const { autoLockTimeout } = useSettings();
  const timeoutRef = useRef(null);

  useEffect(() => {
    // If not configured, locked, or no password, don't run timers
    if (!autoLockTimeout || autoLockTimeout <= 0 || isLocked || !hasPassword) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const lockApp = () => {
      lock();
    };

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(lockApp, autoLockTimeout * 60 * 1000);
    };

    // Initialize timer
    resetTimer();

    // Listen to user activity
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll", "wheel"];
    
    // Throttle the reset to avoid running clearTimeout/setTimeout on every single pixel of mouse movement
    let throttleTimeout = null;
    const handleActivity = () => {
      if (throttleTimeout) return;
      throttleTimeout = setTimeout(() => {
        resetTimer();
        throttleTimeout = null;
      }, 1000); // Only reset the actual timer at most once per second
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (throttleTimeout) clearTimeout(throttleTimeout);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [autoLockTimeout, lock, isLocked, hasPassword]);

  return null; // Invisible component
}
