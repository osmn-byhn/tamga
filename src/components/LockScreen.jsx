import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const LockScreen = () => {
    const { isLocked, unlock } = useAuth();
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isValid = await unlock(password);
        if (!isValid) {
            setError(true);
            setPassword("");
        }
    };

    if (!isLocked) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm transition-all duration-500">
            <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-300">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-4 rounded-full bg-purple-500/20 text-purple-500">
                        <Lock className="h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">App Locked</h2>
                    <p className="text-muted-foreground text-center">Enter your master password to unlock SphinxPass</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
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
                        {error && <p className="text-sm text-red-500 text-center animate-pulse">Incorrect password</p>}
                    </div>

                    <Button type="submit" className="w-full h-12 text-lg font-medium bg-purple-600 hover:bg-purple-700 text-white">
                        Unlock
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default LockScreen;
