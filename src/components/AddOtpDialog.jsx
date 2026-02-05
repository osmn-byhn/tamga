import React, { useState, useRef, useEffect } from "react";
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

    // Screen Scanning Logic
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [snapshot, setSnapshot] = useState(null);
    const [selection, setSelection] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const startScreenScan = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "never" }
            });
            setStream(mediaStream);

            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();

                // Wait for video to load then take snapshot
                videoRef.current.onloadedmetadata = () => {
                    setTimeout(() => takeSnapshot(mediaStream), 500); // Small delay to ensure frame availability
                };
            }
        } catch (err) {
            console.error("Error starting screen capture", err);
            toast.error("Could not start screen capture: " + err.message);
        }
    };

    const takeSnapshot = (mediaStream) => {
        if (!videoRef.current) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        setSnapshot(canvas.toDataURL());

        // Stop stream immediately after snapshot to save resources
        mediaStream.getTracks().forEach(track => track.stop());
        setStream(null);
    };

    const handleMouseDown = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPos({ x, y });
        setSelection({ x, y, width: 0, height: 0 });
        setIsSelecting(true);
    };

    const handleMouseMove = (e) => {
        if (!isSelecting || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        setSelection({
            x: Math.min(startPos.x, currentX),
            y: Math.min(startPos.y, currentY),
            width: Math.abs(currentX - startPos.x),
            height: Math.abs(currentY - startPos.y)
        });
    };

    const handleMouseUp = () => {
        setIsSelecting(false);
        if (selection && selection.width > 5 && selection.height > 5) {
            scanSelection();
        }
    };

    const scanSelection = () => {
        if (!canvasRef.current || !selection || !snapshot) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        // To get the correct image data, we need to draw the original snapshot
        // onto a temporary canvas at its full resolution, then get the selected part.
        const originalImage = new Image();
        originalImage.src = snapshot;
        originalImage.onload = () => {
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = originalImage.width;
            tempCanvas.height = originalImage.height;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(originalImage, 0, 0);

            // Calculate scaling factor from displayed canvas size to original image size
            const scaleX = originalImage.width / canvas.clientWidth;
            const scaleY = originalImage.height / canvas.clientHeight;

            const trueX = selection.x * scaleX;
            const trueY = selection.y * scaleY;
            const trueW = selection.width * scaleX;
            const trueH = selection.height * scaleY;

            try {
                const imageData = tempCtx.getImageData(trueX, trueY, trueW, trueH);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    try {
                        OTPAuth.URI.parse(code.data);
                        onAdd(code.data);
                        resetScan();
                        setOpen(false);
                        toast.success("QR Code scanned successfully");
                    } catch (e) {
                        toast.error("Invalid OTP QR Code");
                    }
                } else {
                    toast.error("No QR code found in selection. Try a clearer area.");
                }
            } catch (error) {
                console.error("Error getting image data for selection:", error);
                toast.error("Error processing selection. Please try again.");
            }
        };
    };

    const resetScan = () => {
        setSnapshot(null);
        setSelection(null);
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsSelecting(false);
        setStartPos({ x: 0, y: 0 });
    };

    // Draw selection box
    useEffect(() => {
        if (!canvasRef.current || !snapshot) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.onload = () => {
            // Set canvas dimensions to match the image's intrinsic size for accurate drawing
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Draw overlay if selection exists
            if (selection) {
                // Semi-transparent overlay
                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Clear the selection area (so it looks highlighted)
                // We need to draw the original image portion back into the cleared area
                ctx.drawImage(img, selection.x, selection.y, selection.width, selection.height, selection.x, selection.y, selection.width, selection.height);

                // Border
                ctx.strokeStyle = "#00ff00";
                ctx.lineWidth = 2;
                ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);
            }
        };
        img.src = snapshot;

    }, [snapshot, selection]);

    const stopScanning = () => {
        resetScan();
    };

    // Stop scanning when dialog closes or tab changes
    useEffect(() => {
        if (!open || activeTab !== "scan") {
            stopScanning();
        }
    }, [open, activeTab]);


    // Image Upload Logic
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);

                if (code) {
                    try {
                        OTPAuth.URI.parse(code.data);
                        onAdd(code.data);
                        setOpen(false);
                        toast.success("QR Code loaded successfully");
                    } catch (e) {
                        toast.error("Found QR code but it's not a valid OTP URI");
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
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add OTP Account</DialogTitle>
                    <DialogDescription>
                        Add a new Two-Factor Authentication account.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="manual">Manual</TabsTrigger>
                        <TabsTrigger value="scan">Screen Scan</TabsTrigger>
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

                    <TabsContent value="scan" className="space-y-4 py-4">
                        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px]">
                            <video ref={videoRef} className="hidden" muted playsInline />

                            {!snapshot ? (
                                <div className="text-center space-y-4">
                                    <div className="p-4 bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto">
                                        <span className="text-4xl">🖥️</span>
                                    </div>
                                    <h3 className="text-lg font-medium">Scan from Screen</h3>
                                    <p className="text-sm text-muted-foreground max-w-[300px] mx-auto">
                                        1. Click "Start Capture" below.<br />
                                        2. Select the screen/window with the QR Code.<br />
                                        3. Draw a box around the QR code to scan.
                                    </p>
                                    <Button onClick={startScreenScan} size="lg" className="w-full" disabled={!!stream}>
                                        {stream ? "Accessing Screen..." : "Start Capture"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center w-full space-y-4">
                                    <div className="relative border border-border rounded-md overflow-hidden max-w-full max-h-[50vh] bg-black">
                                        {/* Canvas acts as the display and selection area */}
                                        <canvas
                                            ref={canvasRef}
                                            onMouseDown={handleMouseDown}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={handleMouseUp}
                                            onMouseLeave={() => setIsSelecting(false)}
                                            style={{ cursor: "crosshair", maxWidth: "100%", height: "auto", display: "block" }}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Drag to select the QR code area</p>
                                    <Button variant="outline" onClick={resetScan}>
                                        Retake Snapshot
                                    </Button>
                                </div>
                            )}
                        </div>
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
