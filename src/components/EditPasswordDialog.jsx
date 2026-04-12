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
import { Globe, User, Shield } from "lucide-react";

const EditPasswordDialog = ({ passwordItem, onUpdate, children }) => {
    const [open, setOpen] = useState(false);
    const [platform, setPlatform] = useState(passwordItem.platform || "");
    const [username, setUsername] = useState(passwordItem.username || "");
    const [value, setValue] = useState(passwordItem.value || "");
    const [links, setLinks] = useState(passwordItem.links || []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) {
            toast.error("Password cannot be empty");
            return;
        }

        onUpdate(passwordItem.id, {
            platform: platform.trim(),
            username: username.trim(),
            value: value.trim(),
            links: links
        });

        setOpen(false);
        toast.success("Password updated successfully");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Password</DialogTitle>
                    <DialogDescription>
                        Update your credential details and link related items.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="edit-pass-platform">Platform</Label>
                        <div className="relative">
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="edit-pass-platform"
                                value={platform}
                                onChange={(e) => setPlatform(e.target.value)}
                                placeholder="e.g. Google"
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-pass-username">Username</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="edit-pass-username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Username"
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-pass-value">Password</Label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="edit-pass-value"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="Password"
                                className="pl-10 font-mono"
                            />
                        </div>
                    </div>

                    <LinkSelector currentLinks={links} onLinksChange={setLinks} />

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                        Update Password
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default EditPasswordDialog;
