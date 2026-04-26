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
import { Plus, Upload, ExternalLink } from "lucide-react";

const AddPasskeyDialog = ({ onAdd, children }) => {
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState("");
    const [secret, setSecret] = useState("");
    const [url, setUrl] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!label.trim() || !secret.trim()) {
            toast.error("Please fill in both fields");
            return;
        }

        onAdd({
            label: label.trim(),
            secret: secret.trim(),
            url: url.trim(),
        });

        setOpen(false);
        setLabel("");
        setSecret("");
        setUrl("");
        toast.success("Passkey added successfully");
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
                    <DialogTitle>Add New Passkey</DialogTitle>
                    <DialogDescription>
                        Store your recovery codes or backup keys securely.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="pk-label">Label</Label>
                        <Input
                            id="pk-label"
                            placeholder="e.g. GitHub Recovery Codes"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pk-url">URL / Domain (Optional)</Label>
                        <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="pk-url"
                                placeholder="https://github.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="pk-secret">Secret / Code</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="upload-pk"
                                    className="hidden"
                                    accept=".txt, .text, *"
                                    onChange={handleFileUpload}
                                />
                                <Label htmlFor="upload-pk" className="cursor-pointer text-xs text-purple-500 hover:text-purple-600 flex items-center gap-1">
                                    <Upload className="h-3 w-3" />
                                    Upload File
                                </Label>
                            </div>
                        </div>
                        <Textarea
                            id="pk-secret"
                            placeholder="Paste your codes here..."
                            value={secret}
                            onChange={(e) => setSecret(e.target.value)}
                            className="min-h-[100px] font-mono text-sm leading-relaxed"
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Save Passkey
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddPasskeyDialog;
