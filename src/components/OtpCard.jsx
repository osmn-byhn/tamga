import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Eye, EyeOff, Share2, ExternalLink, Pencil, GripVertical, Globe } from "lucide-react";
import ExportOtpDialog from "./ExportOtpDialog";
import EditOtpDialog from "./EditOtpDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import { cn, getFaviconUrl } from "@/lib/utils";
import CensoredText from "./CensoredText";
import { toast } from "sonner";
import * as OTPAuth from "otpauth";

const OtpCard = ({ otpItem, onDelete, onUpdate, dragHandleProps, isGroupingTarget }) => {
    const otpUri = otpItem.uri;
    const { hideSensitiveData } = useSettings();
    const [totp, setTotp] = useState(null);
    const [code, setCode] = useState("");
    const [period, setPeriod] = useState(30);
    const [timeLeft, setTimeLeft] = useState(30);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        try {
            const parsedTotp = OTPAuth.URI.parse(otpUri);
            setTotp(parsedTotp);
            setPeriod(parsedTotp.period);
        } catch (e) {
            console.error("Invalid OTP URI", e);
        }
    }, [otpUri]);

    useEffect(() => {
        if (!totp) return;

        const update = () => {
            const newCode = totp.generate();
            setCode(newCode);

            // Calculate time remaining in the current period
            const epoch = Math.floor(Date.now() / 1000);
            const remaining = totp.period - (epoch % totp.period);
            setTimeLeft(remaining);
        };

        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [totp]);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(code);
        toast.success("Code copied to clipboard");
    };

    if (!totp) return null;

    const progress = (timeLeft / period) * 100;

    // Color changes based on time left
    const progressColor = timeLeft < 5 ? "text-red-500" : "text-primary";

    return (
        <Card className={cn(
            "relative overflow-hidden group hover:shadow-md transition-all duration-300 border-l-4 border-l-primary/50 bg-card border-border",
            isGroupingTarget && "ring-4 ring-primary shadow-2xl scale-[1.02] z-20 brightness-110"
        )}>
            <CardContent className="p-4 flex items-center justify-between">
                <div 
                    {...dragHandleProps} 
                    className="absolute top-2 right-2 p-1 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        {otpItem.url && (
                            <img src={getFaviconUrl(otpItem.url)} alt="" className="h-4 w-4 object-contain rounded-sm" />
                        )}
                        <p className="text-sm font-medium text-muted-foreground truncate" title={totp.issuer}>
                            {totp.issuer || "Unknown Issuer"}
                        </p>
                    </div>
                    <h3 className="text-lg font-bold truncate text-foreground" title={totp.label}>
                        {totp.label.includes(":") ? totp.label.split(":")[1].trim() : totp.label}
                    </h3>
                    <div
                        className="text-3xl font-mono font-bold tracking-widest text-foreground cursor-pointer hover:text-primary transition-all duration-300 mt-1"
                        onClick={copyToClipboard}
                    >
                        <CensoredText value={`${code.slice(0, 3)} ${code.slice(3)}`} isVisible={isVisible} />
                    </div>
                </div>

                <div className="flex flex-col items-center gap-3 ml-4">
                    <div className="relative h-12 w-12 flex items-center justify-center">
                        <svg className="h-full w-full -rotate-90 text-muted" viewBox="0 0 36 36">
                            {/* Background Circle */}
                            <path
                                className="stroke-current"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                strokeWidth="3"
                            />
                            {/* Progress Circle */}
                            <path
                                className={`stroke-current transition-all duration-1000 ease-linear ${progressColor}`}
                                strokeDasharray={`${progress}, 100`}
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                strokeWidth="3"
                            />
                        </svg>
                        <span className="absolute text-xs font-semibold text-foreground">{timeLeft}s</span>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {otpItem.links?.length > 0 && (
                            <Link to={`/details/otp/${otpItem.id}`}>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="View Details & Links">
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        {otpItem.url && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(otpItem.url, '_blank')}
                                title="Open Website"
                            >
                                <Globe size={14} />
                            </Button>
                        )}
                        <EditOtpDialog otpItem={otpItem} onUpdate={onUpdate}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="EditAccount">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </EditOtpDialog>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setIsVisible(!isVisible)}
                            title={isVisible ? "Hide" : "Show"}
                        >
                            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4" />
                        </Button>
                        <ExportOtpDialog otpUri={otpUri}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" title="Export Account">
                                <Share2 className="h-4 w-4" />
                            </Button>
                        </ExportOtpDialog>
                        {onDelete && (
                            <DeleteConfirmDialog onConfirm={() => onDelete(otpItem.id)}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                                    title="Delete"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </DeleteConfirmDialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default OtpCard;
