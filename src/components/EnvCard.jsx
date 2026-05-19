import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Eye, EyeOff, Terminal, Trash2, FileJson, Pencil, ExternalLink, GripVertical, Globe } from "lucide-react";
import EditEnvDialog from "./EditEnvDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { toast } from "sonner";
import { cn, getFaviconUrl, copyToClipboard } from "@/lib/utils";
import CensoredText from "./CensoredText";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const EnvCard = ({ envItem, onDelete, onUpdate, dragHandleProps, isGroupingTarget }) => {
    const { hideSensitiveData } = useSettings();
    const [showFull, setShowFull] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const handleCopy = () => {
        copyToClipboard(envItem.content);
        toast.success("Env content copied to clipboard");
    };

    // Preview first 3 lines
    const content = typeof envItem.content === 'string' ? envItem.content : "";
    const lines = content.split("\n");
    const previewContent = lines.slice(0, 3).join("\n") + (lines.length > 3 ? "\n..." : "");
    const projectName = typeof envItem.projectName === 'object' ? (envItem.projectName.projectName || "Unknown") : (envItem.projectName || "Untitled Project");

    return (
        <>
            <Card className={cn(
                "relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-card border-border",
                isGroupingTarget && "ring-4 ring-green-500 shadow-2xl scale-[1.02] z-20 brightness-110"
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
                                <div className="p-2 rounded-full bg-green-500/10 text-green-500 overflow-hidden">
                                    {envItem.url ? (
                                        <img src={getFaviconUrl(envItem.url)} alt="" className="h-4 w-4 object-contain" />
                                    ) : (
                                        <Terminal className="h-4 w-4" />
                                    )}
                                </div>
                                <h3 className="text-lg font-bold truncate text-foreground" title={projectName}>
                                    {projectName}
                                </h3>
                            </div>

                            <div
                                className="mt-3 p-3 bg-muted rounded-md font-mono text-xs text-muted-foreground overflow-hidden cursor-pointer hover:bg-muted/80 transition-all duration-300 border border-border"
                                onClick={() => setShowFull(true)}
                            >
                                <pre className="whitespace-pre-wrap break-all transition-all duration-300">
                                    <CensoredText value={previewContent} isVisible={isVisible} />
                                </pre>
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                                Added on {new Date(envItem.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex flex-col gap-1">
                            {envItem.links?.length > 0 && (
                                <Link to={`/details/env/${envItem.id}`}>
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
                            {envItem.url && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    onClick={() => window.open(envItem.url, '_blank')}
                                    title="Open Website"
                                >
                                    <Globe size={14} />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setIsVisible(!isVisible)}
                                title={isVisible ? "Hide" : "Show"}
                            >
                                {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <EditEnvDialog envItem={envItem} onUpdate={onUpdate}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                    title="Edit"
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </EditEnvDialog>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={handleCopy}
                                title="Copy Content"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            {onDelete && (
                                <DeleteConfirmDialog onConfirm={() => onDelete(envItem.id)}>
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

            <Dialog open={showFull} onOpenChange={setShowFull}>
                <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileJson className="h-5 w-5 text-green-500" />
                            {projectName} - .env content
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-muted p-4 rounded-md border border-border mt-2">
                        <pre className="font-mono text-sm text-foreground whitespace-pre-wrap transition-all duration-300">
                            <CensoredText value={content} isVisible={isVisible} />
                        </pre>
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button onClick={copyToClipboard} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                            <Copy className="h-4 w-4" />
                            Copy All
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default EnvCard;
