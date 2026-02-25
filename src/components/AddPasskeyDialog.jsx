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
import { Plus } from "lucide-react";

const AddPasskeyDialog = ({ onAdd, children }) => {
    const [open, setOpen] = useState(false);
    const [label, setLabel] = useState("");
    const [secret, setSecret] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!label.trim() || !secret.trim()) {
            toast.error("Please fill in both fields");
            return;
        }

        onAdd({
            label: label.trim(),
            secret: secret.trim(),
        });

        setOpen(false);
        setLabel("");
        setSecret("");
        toast.success("Passkey added successfully");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
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
                        <Label htmlFor="pk-secret">Secret / Code</Label>
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
