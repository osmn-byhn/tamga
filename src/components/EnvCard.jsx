import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Eye, Terminal, Trash2, FileJson } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const EnvCard = ({ envItem, onDelete }) => {
    const [showFull, setShowFull] = useState(false);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(envItem.content);
        toast.success("Env content copied to clipboard");
    };

    // Preview first 3 lines
    const previewContent = envItem.content.split("\n").slice(0, 3).join("\n") + (envItem.content.split("\n").length > 3 ? "\n..." : "");

    return (
        <>
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500 bg-card border-border">
                <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 rounded-full bg-green-500/10 text-green-500">
                                    <Terminal className="h-4 w-4" />
                                </div>
                                <h3 className="text-lg font-bold truncate text-foreground" title={envItem.projectName}>
                                    {envItem.projectName}
                                </h3>
                            </div>

                            <div
                                className="mt-3 p-3 bg-muted rounded-md font-mono text-xs text-muted-foreground overflow-hidden cursor-pointer hover:bg-muted/80 transition-colors border border-border"
                                onClick={() => setShowFull(true)}
                            >
                                <pre className="whitespace-pre-wrap break-all">{previewContent}</pre>
                            </div>

                            <p className="text-xs text-muted-foreground mt-2">
                                Added on {new Date(envItem.createdAt).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex flex-col gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => setShowFull(true)}
                                title="View Full Content"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={copyToClipboard}
                                title="Copy Content"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => onDelete(envItem.id)}
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
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
                            {envItem.projectName} - .env content
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto bg-muted p-4 rounded-md border border-border mt-2">
                        <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">{envItem.content}</pre>
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
