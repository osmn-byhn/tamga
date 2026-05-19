import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, KeyRound, AlertTriangle } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

const LockScreen = () => {
    const { isLocked, hasPassword, unlock, setMasterPassword, emergencyWipe } = useAuth();
    const { maxFailedAttempts, failedAction, backupPath } = useSettings();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState(false);
    const [setupError, setSetupError] = useState("");
    const [failedCount, setFailedCount] = useState(() => {
        return parseInt(localStorage.getItem("tamga-failed-attempts-count") || "0", 10);
    });
    const [isWiping, setIsWiping] = useState(false);

    const handleUnlock = async (e) => {
        e.preventDefault();
        const isValid = await unlock(password);
        if (!isValid) {
            const newCount = failedCount + 1;
            setFailedCount(newCount);
            localStorage.setItem("tamga-failed-attempts-count", newCount.toString());
            
            if (maxFailedAttempts > 0 && newCount >= maxFailedAttempts) {
                setIsWiping(true);
                await emergencyWipe(failedAction === 'backup_wipe', backupPath);
                // State will reset automatically because app loses hasPassword state
                localStorage.removeItem("tamga-failed-attempts-count");
            } else {
                setError(true);
                setPassword("");
            }
        } else {
            setFailedCount(0);
            localStorage.removeItem("tamga-failed-attempts-count");
            setPassword(""); // Security: Clear password so it's not pre-filled next time
        }
    };

    const handleSetup = async (e) => {
        e.preventDefault();
        if (password.length < 8) {
            setSetupError("Password must be at least 8 characters");
            return;
        }
        if (password !== confirmPassword) {
            setSetupError("Passwords do not match");
            return;
        }
        await setMasterPassword(password);
        setPassword(""); // Security: Clear password so it's not pre-filled next time
        setConfirmPassword("");
    };

    if (!hasPassword) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background transition-all duration-500">
                <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-4 rounded-full bg-blue-500/20 text-blue-500">
                            <KeyRound className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome to Tamga</h2>
                        <p className="text-muted-foreground text-center">Set up your Master Password to create your secure zero-knowledge vault.</p>
                    </div>

                    <form onSubmit={handleSetup} className="space-y-6">
                        <div className="space-y-4">
                            <Input
                                type="password"
                                placeholder="Master Password (8+ chars)"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setSetupError("");
                                }}
                                className="text-center text-lg h-12"
                                autoFocus
                            />
                            <Input
                                type="password"
                                placeholder="Confirm Master Password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setSetupError("");
                                }}
                                className={`text-center text-lg h-12 ${setupError ? 'border-red-500 ring-red-500/20' : ''}`}
                            />
                            {setupError && <p className="text-sm text-red-500 text-center animate-pulse">{setupError}</p>}
                        </div>

                        <Button type="submit" disabled={!password || !confirmPassword} className="w-full h-12 text-lg font-medium bg-blue-600 hover:bg-blue-700 text-white">
                            Create Vault
                        </Button>
                    </form>
                </div>
            </div>
        );
    }

    if (!isLocked) return null;

    if (isWiping) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-500">
                <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-2xl border border-destructive animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center">
                    <AlertTriangle className="h-16 w-16 text-destructive animate-pulse" />
                    <h2 className="text-2xl font-bold tracking-tight text-destructive">Security Breach Detected</h2>
                    <p className="text-muted-foreground">Maximum failed attempts reached. Executing emergency data wipe protocol...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md transition-all duration-500">
            <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-4 rounded-full bg-purple-500/20 text-purple-500">
                        <Lock className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">App Locked</h2>
                    <p className="text-muted-foreground text-center">Enter your master password to unlock Tamga</p>
                </div>

                <form onSubmit={handleUnlock} className="space-y-6">
                    <div className="space-y-2">
                        <Input
                            type="password"
                            placeholder="Master Password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            className={`text-center text-lg h-12 ${error ? 'border-red-500 ring-red-500/20' : ''}`}
                            autoFocus
                        />
                        {error && (
                            <p className="text-sm text-red-500 text-center animate-pulse">
                                Incorrect password. 
                                {maxFailedAttempts > 0 && ` Attempt ${failedCount} of ${maxFailedAttempts}`}
                            </p>
                        )}
                    </div>

                    <Button type="submit" disabled={!password} className="w-full h-12 text-lg font-medium bg-purple-600 hover:bg-purple-700 text-white">
                        Unlock
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LockScreen;
