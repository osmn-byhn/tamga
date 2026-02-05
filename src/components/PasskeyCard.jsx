import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Trash2, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PasskeyCard = ({ passkey, onDelete }) => {
    const [isVisible, setIsVisible] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(passkey.secret);
        toast.success("Passkey copied to clipboard");
    };

    return (
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-card border-border">
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-full bg-purple-500/10 text-purple-500">
                                <KeyRound className="h-4 w-4" />
                            </div>
                            <h3 className="text-lg font-bold truncate text-foreground" title={passkey.label}>
                                {passkey.label}
                            </h3>
                        </div>

                        <div className="relative mt-3 p-3 bg-muted rounded-md font-mono text-sm break-all group-hover:bg-muted/80 transition-colors">
                            <div className={cn("transition-all duration-300", isVisible ? "blur-0" : "blur-[6px] select-none text-muted-foreground")}>
                                {passkey.secret}
                            </div>
                            {!isVisible && (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs font-sans pointer-events-none">
                                    Tap eye to reveal
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Added on {new Date(passkey.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setIsVisible(!isVisible)}
                            title={isVisible ? "Hide" : "Show"}
                        >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={copyToClipboard}
                            title="Copy"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                onClick={() => onDelete(passkey.id)}
                                title="Delete"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PasskeyCard;
