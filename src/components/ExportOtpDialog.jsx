import React, { useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeCanvas } from "qrcode.react";
import * as OTPAuth from "otpauth";
import { Copy, Download, Key, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ExportOtpDialog = ({ children, otpUri }) => {
    const canvasRef = useRef(null);
    let secret = "";
    let issuer = "Unknown";
    let label = "Account";

    try {
        const parsed = OTPAuth.URI.parse(otpUri);
        secret = parsed.secret.base32;
        issuer = parsed.issuer || "Unknown";
        label = parsed.label || "Account";
    } catch (e) {
        console.error("Failed to parse OTP URI for export", e);
    }

    const copySecret = () => {
        if (!secret) return;
        navigator.clipboard.writeText(secret);
        toast.success("Secret key copied to clipboard");
    };

    const downloadQr = () => {
        const canvas = document.getElementById("otp-qr-code");
        if (!canvas) return;

        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `otp-qr-${issuer.replace(/\s+/g, '-')}-${label.replace(/\s+/g, '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("QR code downloaded");
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-5 w-5 text-purple-600" />
                        Export OTP Account
                    </DialogTitle>
                    <DialogDescription>
                        Scan this QR code with another authenticator app or use the secret key below.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    <div className="p-4 bg-white rounded-xl shadow-inner border-2 border-dashed border-purple-100 dark:border-purple-900/50">
                        <QRCodeCanvas
                            id="otp-qr-code"
                            value={otpUri}
                            size={200}
                            level={"H"}
                            includeMargin={true}
                        />
                    </div>

                    <div className="w-full space-y-3">
                        <div className="text-center">
                            <h3 className="font-bold text-lg">{issuer}</h3>
                            <p className="text-sm text-muted-foreground">{label.includes(":") ? label.split(":")[1].trim() : label}</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Key className="h-3 w-3" />
                                Secret Key
                            </label>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 p-2.5 bg-muted rounded-md font-mono text-sm break-all border border-border">
                                    {secret}
                                </code>
                                <Button size="icon" variant="outline" onClick={copySecret} title="Copy Secret">
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-start">
                    <Button
                        type="button"
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                        onClick={downloadQr}
                    >
                        <Download className="h-4 w-4" />
                        Download QR Code
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ExportOtpDialog;
