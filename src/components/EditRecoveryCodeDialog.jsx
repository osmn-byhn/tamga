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
import { Edit2, Upload } from "lucide-react";

const EditRecoveryCodeDialog = ({ recovery, onUpdate, children }) => {
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState(recovery.label || "");
    const [codes, setCodes] = useState(recovery.codes || "");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!label.trim() || !codes.trim()) {
            toast.error("Please fill in both fields");
            return;
        }

        onUpdate(recovery.id, {
            ...recovery,
            label: label.trim(),
            codes: codes.trim(),
        });

        setOpen(false);
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
                    <DialogTitle>Edit Recovery Codes</DialogTitle>
                    <DialogDescription>
                        Update your account recovery codes or platform name.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-rc-label">Service / Platform</Label>
                        <Input
                            id="edit-rc-label"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="edit-rc-codes">Recovery Codes</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="edit-upload-rc"
                                    className="hidden"
                                    accept=".txt, .text, *"
                                    onChange={handleFileUpload}
                                />
                                <Label htmlFor="edit-upload-rc" className="cursor-pointer text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1">
                                    <Upload className="h-3 w-3" />
                                    Upload File
                                </Label>
                            </div>
                        </div>
                        <Textarea
                            id="edit-rc-codes"
                            value={codes}
                            onChange={(e) => setCodes(e.target.value)}
                            className="min-h-[150px] font-mono text-xs leading-relaxed"
                        />
                    </div>
                    <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700">
                        Update Recovery Codes
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditRecoveryCodeDialog;
