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
import { ExternalLink } from "lucide-react";

const EditOtpDialog = ({ otpItem, onUpdate, children }) => {
    const [open, setOpen] = useState(false);
    const [uri, setUri] = useState(otpItem.uri || "");
    const [url, setUrl] = useState(otpItem.url || "");
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
            url: url.trim(),
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
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
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

                    <div className="space-y-2">
                        <Label htmlFor="edit-otp-url">URL / Domain (Optional)</Label>
                        <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="edit-otp-url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://google.com"
                                className="pl-10"
                            />
                        </div>
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
