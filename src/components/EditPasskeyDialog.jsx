import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, ExternalLink } from "lucide-react";
import LinkSelector from "./LinkSelector";

const EditPasskeyDialog = ({ passkey, onUpdate, children }) => {
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState(passkey.label || "");
    const [secret, setSecret] = useState(passkey.secret || "");
    const [url, setUrl] = useState(passkey.url || "");
    const [links, setLinks] = useState(passkey.links || []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!label.trim() || !secret.trim()) {
            toast.error("Please fill in both fields");
            return;
        }

        onUpdate(passkey.id, {
            label: label.trim(),
            secret: secret.trim(),
            url: url.trim(),
            links: links
        });

        setOpen(false);
        toast.success("Passkey updated successfully");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setSecret(event.target.result);
            toast.success("File content loaded");
        };
        reader.readAsText(file);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Passkey</DialogTitle>
                    <DialogDescription>
                        Update your recovery codes or backup keys securely.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-pk-label">Label</Label>
                        <Input
                            id="edit-pk-label"
                            placeholder="e.g. GitHub Recovery Codes"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-pk-url">URL / Domain (Optional)</Label>
                        <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="edit-pk-url"
                                placeholder="https://github.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="edit-pk-secret">Secret / Code</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="edit-upload-pk"
                                    className="hidden"
                                    accept=".txt, .text, *"
                                    onChange={handleFileUpload}
                                />
                                <Label htmlFor="edit-upload-pk" className="cursor-pointer text-xs text-purple-500 hover:text-purple-600 flex items-center gap-1">
                                    <Upload className="h-3 w-3" />
                                    Upload File
                                </Label>
                            </div>
                        </div>
                        <Textarea
                            id="edit-pk-secret"
                            placeholder="Paste your codes here..."
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            className="min-h-[100px] font-mono text-sm leading-relaxed"
                        />
                    </div>

                    <LinkSelector currentLinks={links} onLinksChange={setLinks} />

                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        Update Passkey
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditPasskeyDialog;
