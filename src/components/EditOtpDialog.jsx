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
import { toast } from "sonner";
import LinkSelector from "./LinkSelector";
import * as OTPAuth from "otpauth";

const EditOtpDialog = ({ otpItem, onUpdate, children }) => {
    const [open, setOpen] = useState(false);
    const [uri, setUri] = useState(otpItem.uri || "");
    const [links, setLinks] = useState(otpItem.links || []);

    const handleSubmit = (e) => {
        e.preventDefault();
        try {
            OTPAuth.URI.parse(uri.trim());
        } catch (err) {
            toast.error("Invalid OTP URI format");
            return;
        }

        onUpdate(otpItem.id, {
            uri: uri.trim(),
            links: links
        });

        setOpen(false);
        toast.success("OTP account updated successfully");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit OTP Account</DialogTitle>
                    <DialogDescription>
                        Update the authentication URI for this account.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-otp-uri">OTP URI</Label>
                        <Input
                            id="edit-otp-uri"
                            placeholder="otpauth://totp/..."
                            value={uri}
                            onChange={(e) => setUri(e.target.value)}
                        />
                    </div>

                    <LinkSelector currentLinks={links} onLinksChange={setLinks} />

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                        Update Account
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditOtpDialog;
