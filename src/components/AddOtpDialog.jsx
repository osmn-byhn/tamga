import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import jsQR from "jsqr";
import * as OTPAuth from "otpauth";

const AddOtpDialog = ({ onAdd, children }) => {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("manual");

    // Manual Entry State
    const [manualIssuer, setManualIssuer] = useState("");
    const [manualLabel, setManualLabel] = useState("");
    const [manualSecret, setManualSecret] = useState("");

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualSecret) {
            toast.error("Secret is required");
            return;
        }

        // Validate secret (basic check)
        try {
            // Create a dummy TOTP to validate the secret
            new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(manualSecret) });
        } catch (error) {
            toast.error("Invalid Secret format (Base32)");
            return;
        }

        const uri = new OTPAuth.TOTP({
            issuer: manualIssuer,
            label: manualLabel || "Account",
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: OTPAuth.Secret.fromBase32(manualSecret),
        }).toString();

        onAdd(uri);
        setOpen(false);
        resetForm();
        toast.success("OTP added successfully");
    };

    const resetForm = () => {
        setManualIssuer("");
        setManualLabel("");
        setManualSecret("");
    };

    // Image Upload Logic
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const img = new Image();
            img.onload = async () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    const qrData = code.data.trim();
                    console.log("QR Data detected:", qrData);

                    try {
                        if (qrData.startsWith("otpauth-migration://")) {
                            const { decodeMigrationUri } = await import("../lib/otpMigration");
                            const uris = decodeMigrationUri(qrData);

                            if (uris.length === 0) {
                                throw new Error("No accounts found in migration data");
                            }

                            uris.forEach(uri => onAdd(uri));
                            setOpen(false);
                            toast.success(`Imported ${uris.length} accounts from Google Authenticator`);
                            return;
                        }

                        // Validate if it's a valid URI for OTPAuth
                        let finalUri = qrData;
                        if (!finalUri.startsWith("otpauth://")) {
                            if (finalUri.startsWith("web+otpauth://")) {
                                finalUri = finalUri.replace("web+otpauth://", "otpauth://");
                            } else {
                                throw new Error("Not an otpauth URI");
                            }
                        }

                        OTPAuth.URI.parse(finalUri);
                        onAdd(finalUri);
                        setOpen(false);
                        toast.success("QR Code loaded successfully");
                    } catch (e) {
                        console.error("OTP Parsing error:", e, "Data:", qrData);
                        toast.error(`Invalid OTP QR Data: ${qrData.substring(0, 20)}...`);
                    }
                } else {
                    toast.error("No QR code found in image");
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };


    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add OTP Account</DialogTitle>
                    <DialogDescription>
                        Add a new Two-Factor Authentication account.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                        <TabsTrigger value="upload">Upload QR</TabsTrigger>
                    </TabsList>

                    <TabsContent value="manual" className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="manual-issuer">Issuer</Label>
                            <Input
                                id="manual-issuer"
                                placeholder="Google"
                                value={manualIssuer}
                                onChange={(e) => setManualIssuer(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-label">Account Name</Label>
                            <Input
                                id="manual-label"
                                placeholder="alice@example.com"
                                value={manualLabel}
                                onChange={(e) => setManualLabel(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="manual-secret">Secret Key</Label>
                            <Input
                                id="manual-secret"
                                placeholder="JBSWY3DPEHPK3PXP"
                                value={manualSecret}
                                onChange={(e) => setManualSecret(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleManualSubmit} className="w-full">
                            Add Account
                        </Button>
                    </TabsContent>

                    <TabsContent value="upload" className="space-y-4 py-4">
                        <div className="flex flex-col items-center justify-center space-y-4 p-8 border-2 border-dashed border-border rounded-md hover:bg-muted/50 transition-colors">
                            <Label htmlFor="qr-file" className="cursor-pointer flex flex-col items-center gap-2">
                                <span className="text-4xl">📁</span>
                                <span className="text-sm font-medium text-foreground">Click to upload QR Image</span>
                            </Label>
                            <Input
                                id="qr-file"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default AddOtpDialog;
