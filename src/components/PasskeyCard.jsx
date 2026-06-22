import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Trash2, KeyRound, Pencil, ExternalLink, GripVertical, Globe } from "lucide-react";
import EditPasskeyDialog from "./EditPasskeyDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";
import TransferSessionDialog from "./TransferSessionDialog";
import { Send } from "lucide-react";
import { cn, getFaviconUrl, copyToClipboard } from "@/lib/utils";
import CensoredText from "./CensoredText";

const PasskeyCard = ({ passkey, onDelete, onUpdate, dragHandleProps, isGroupingTarget }) => {
    const { hideSensitiveData, maskStyle } = useSettings();
    const [isVisible, setIsVisible] = useState(false);

    return (
        <Card className={cn(
            "relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500 bg-card border-border",
            isGroupingTarget && "ring-4 ring-purple-500 shadow-2xl scale-[1.02] z-20 brightness-110"
        )}>
            <CardContent className="p-5">
                <div 
                    {...dragHandleProps} 
                    className="absolute top-2 right-2 p-1 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 rounded-full bg-purple-500/10 text-purple-500 overflow-hidden">
                                {passkey.url ? (
                                    <img src={getFaviconUrl(passkey.url)} alt="" className="h-4 w-4 object-contain" />
                                ) : (
                                    <KeyRound className="h-4 w-4" />
                                )}
                            </div>
                            <h3 className="text-lg font-bold truncate text-foreground" title={typeof passkey.label === 'object' ? passkey.label.label : passkey.label}>
                                {typeof passkey.label === 'object' ? passkey.label.label : passkey.label}
                            </h3>
                        </div>

                        <div className="relative mt-3 p-3 bg-muted rounded-md font-mono text-sm break-all group-hover:bg-muted/80 transition-colors">
                            <CensoredText value={passkey.secret} isVisible={isVisible} />
                            {(hideSensitiveData && !isVisible && maskStyle === 'blur') && (
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
                        {passkey.links?.length > 0 && (
                            <Link to={`/details/passkey/${passkey.id}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    title="View Details & Links"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        {passkey.url && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(passkey.url, '_blank')}
                                title="Open Website"
                            >
                                <Globe size={14} />
                            </Button>
                        )}
                        <EditPasskeyDialog passkey={passkey} onUpdate={onUpdate}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="Edit"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </EditPasskeyDialog>
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
                            onClick={() => {
                                copyToClipboard(passkey.secret);
                                toast.success("Passkey secret copied");
                            }}
                            title="Copy"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        {onDelete && (
                            <DeleteConfirmDialog onConfirm={() => onDelete(passkey.id)}>
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

export default PasskeyCard;
