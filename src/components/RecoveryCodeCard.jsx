import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Trash2, ShieldAlert, Pencil, ExternalLink, GripVertical } from "lucide-react";
import EditRecoveryCodeDialog from "./EditRecoveryCodeDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RecoveryCodeCard = ({ recovery, onDelete, onUpdate, dragHandleProps, isGroupingTarget }) => {
    const { hideSensitiveData } = useSettings();
    const [isVisible, setIsVisible] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(recovery.codes);
        toast.success("Recovery codes copied to clipboard");
    };

    return (
        <Card className={cn(
            "relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-rose-500 bg-card border-border",
            isGroupingTarget && "ring-4 ring-rose-500 shadow-2xl scale-[1.02] z-20 brightness-110"
        )}>
            <CardContent className="p-5">
                <div 
                    {...dragHandleProps} 
                    className="absolute top-2 right-2 p-1 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-full bg-rose-500/10 text-rose-500">
                                <ShieldAlert className="h-4 w-4" />
                            </div>
                            <h3 className="text-lg font-bold truncate text-foreground">
                                {recovery.label}
                            </h3>
                        </div>

                        <div className="relative mt-3 p-3 bg-muted rounded-md font-mono text-[10px] leading-tight group-hover:bg-muted/80 transition-colors max-h-[120px] overflow-hidden">
                            <div className={cn("transition-all duration-300 whitespace-pre-wrap", (hideSensitiveData && !isVisible) ? "blur-[8px] select-none text-muted-foreground" : "blur-0")}>
                                {recovery.codes}
                            </div>
                            {(hideSensitiveData && !isVisible) && (
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs font-sans pointer-events-none">
                                    Tap eye to reveal
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            Saved on {new Date(recovery.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex flex-col gap-1">
                        {recovery.links?.length > 0 && (
                            <Link to={`/details/recovery/${recovery.id}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    title="Links"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        <EditRecoveryCodeDialog recovery={recovery} onUpdate={onUpdate}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="Edit"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </EditRecoveryCodeDialog>
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
                            title="Copy All"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        {onDelete && (
                            <DeleteConfirmDialog onConfirm={() => onDelete(recovery.id)}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </DeleteConfirmDialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecoveryCodeCard;
