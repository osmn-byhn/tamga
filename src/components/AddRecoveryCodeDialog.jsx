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
import { Plus, Upload } from "lucide-react";

const AddRecoveryCodeDialog = ({ onAdd, children }) => {
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState("");
    const [codes, setCodes] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!label.trim() || !codes.trim()) {
            toast.error("Please fill in both fields");
            return;
        }

        onAdd({
            label: label.trim(),
            codes: codes.trim(),
        });

        setOpen(false);
        setLabel("");
        setCodes("");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setCodes(event.target.result);
            toast.success("File content loaded");
        };
        reader.readAsText(file);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Recovery Codes</DialogTitle>
                    <DialogDescription>
                        Store your account recovery codes or emergency backup keys.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="rc-label">Service / Platform</Label>
                        <Input
                            id="rc-label"
                            placeholder="e.g. Google, Discord, GitHub"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="rc-codes">Recovery Codes</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="upload-rc"
                                    className="hidden"
                                    accept=".txt, .text, *"
                                    onChange={handleFileUpload}
                                />
                                <Label htmlFor="upload-rc" className="cursor-pointer text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1">
                                    <Upload className="h-3 w-3" />
                                    Upload File
                                </Label>
                            </div>
                        </div>
                        <Textarea
                            id="rc-codes"
                            placeholder="Paste your backup codes here..."
                            value={codes}
                            onChange={(e) => setCodes(e.target.value)}
                            className="min-h-[150px] font-mono text-xs leading-relaxed"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700">
                        Store Recovery Codes
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddRecoveryCodeDialog;
