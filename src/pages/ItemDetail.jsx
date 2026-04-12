import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { ArrowLeft, Link as LinkIcon, Shield, Key, Terminal, Smartphone, Trash2, ExternalLink, ShieldAlert, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Component Imports
import OtpCard from "@/components/OtpCard";
import EnvCard from "@/components/EnvCard";
import PasskeyCard from "@/components/PasskeyCard";
import PasswordCard from "@/components/PasswordCard";
import RecoveryCodeCard from "@/components/RecoveryCodeCard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import LinkSelector from "@/components/LinkSelector";

const ItemDetail = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const { getData, toggleLink, updateData } = useAuth();
    
    const [item, setItem] = useState(null);
    const [linkedItems, setLinkedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);
    const [dataRefresh, setDataRefresh] = useState(0);

    const getStorageKey = (t) => {
        switch (t) {
            case 'password': return 'tamga-passwords';
            case 'otp': return 'tamga-otp-uris';
            case 'env': return 'tamga-envs';
            case 'passkey': return 'tamga-passkeys';
            case 'recovery': return 'tamga-recovery-codes';
            default: return null;
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        const storageKey = getStorageKey(type);
        if (!storageKey) {
            toast.error("Invalid item type");
            navigate(-1);
            return;
        }

        const allItems = await getData(storageKey);
        const found = allItems?.find(i => String(i.id) === String(id));

        if (!found) {
            toast.error("Item not found");
            navigate(-1);
            return;
        }

        setItem(found);

        // Load linked items
        if (found.links && found.links.length > 0) {
            const resolved = [];
            for (const link of found.links) {
                const sKey = getStorageKey(link.type);
                const items = await getData(sKey);
                const lItem = items?.find(i => String(i.id) === String(link.id));
                if (lItem) {
                    resolved.push({ ...lItem, type: link.type });
                }
            }
            setLinkedItems(resolved);
        } else {
            setLinkedItems([]);
        }
        setLoading(false);
    }, [type, id, getData, navigate]);

    useEffect(() => {
        loadData();
    }, [loadData, dataRefresh]);

    const handleUpdate = async (idToUpdate, updatedData) => {
        const sKey = getStorageKey(type);
        const allItems = await getData(sKey);
        const updated = allItems.map(i => String(i.id) === String(idToUpdate) ? { ...i, ...updatedData } : i);
        await updateData(sKey, updated);
        setDataRefresh(prev => prev + 1);
        toast.success("Item updated");
    };

    const handleUnlink = async (linkedType, linkedId) => {
        await toggleLink({ type, id }, { type: linkedType, id: linkedId });
        setDataRefresh(prev => prev + 1);
        toast.success("Connection removed");
    };

    if (loading && !item) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <div className="p-4 rounded-full bg-primary/10 animate-pulse">
                <Zap className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground font-medium">Synchronizing Security Hub...</p>
        </div>
    );

    const renderCard = (targetItem, targetType, isMain = false) => {
        const commonProps = {
            onUpdate: (id, data) => handleUpdate(id, data),
            // When in hub, "Delete" on linked items means "Unlink"
            onDelete: !isMain ? (id) => handleUnlink(targetType, id) : null,
            showDetailLink: !isMain // Don't show detail link for the main item itself
        };

        switch (targetType) {
            case 'password': return <PasswordCard item={targetItem} {...commonProps} />;
            case 'otp': return <OtpCard otpItem={targetItem} {...commonProps} />;
            case 'env': return <EnvCard envItem={targetItem} {...commonProps} />;
            case 'passkey': return <PasskeyCard passkey={targetItem} {...commonProps} />;
            case 'recovery': return <RecoveryCodeCard recovery={targetItem} {...commonProps} />;
            default: return null;
        }
    };

    const categories = [
        { id: 'password', name: 'Passwords', icon: Shield, color: 'text-blue-500' },
        { id: 'otp', name: 'Authenticator (OTP)', icon: Smartphone, color: 'text-purple-500' },
        { id: 'passkey', name: 'Passkeys', icon: Key, color: 'text-orange-500' },
        { id: 'recovery', name: 'Recovery Codes', icon: ShieldAlert, color: 'text-rose-500' },
        { id: 'env', name: 'Env Files', icon: Terminal, color: 'text-green-500' },
    ];

    const linkedByCategory = categories.map(cat => ({
        ...cat,
        items: linkedItems.filter(l => l.type === cat.id)
    })).filter(cat => cat.items.length > 0);

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 gap-2 hover:bg-muted -ml-2 text-muted-foreground hover:text-foreground transition-all">
                <ArrowLeft className="h-4 w-4" /> Back to Vault
            </Button>

            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <Zap className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Security Hub</h2>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                        Vault Access
                    </h1>
                    <p className="text-muted-foreground font-medium">All related security credentials in one consolidated view.</p>
                </div>

                <Dialog open={isLinkSelectorOpen} onOpenChange={setIsLinkSelectorOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="gap-2 shadow-xl shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform">
                            <LinkIcon className="h-4 w-4" />
                            Manage Connections
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Connect Insights</DialogTitle>
                            <DialogDescription>
                                Build your security graph by linking related items.
                            </DialogDescription>
                        </DialogHeader>
                        <LinkSelector 
                            rootItem={{ type, id }}
                            currentLinks={item?.links || []} 
                            onLinksChange={() => loadData()}
                        />
                        <Button onClick={() => setIsLinkSelectorOpen(false)} className="w-full mt-4">Close Settings</Button>
                    </DialogContent>
                </Dialog>
            </header>

            <div className="space-y-16">
                {/* Primary Item Section */}
                <section className="space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="h-8 w-1 bg-primary rounded-full" />
                        <h3 className="text-xl font-bold tracking-tight">Access Point</h3>
                    </div>
                    {item && renderCard(item, type, true)}
                </section>

                {/* Linked Items Hub */}
                <section className="space-y-8">
                    <div className="flex items-center gap-4">
                        <span className="h-8 w-1 bg-muted-foreground/30 rounded-full" />
                        <h3 className="text-xl font-bold tracking-tight">Connected Security Layers</h3>
                    </div>

                    {linkedByCategory.length === 0 ? (
                        <Card className="border-dashed bg-muted/5">
                            <CardContent className="py-20 text-center flex flex-col items-center gap-4">
                                <div className="p-4 rounded-full bg-muted/10">
                                    <LinkIcon className="h-10 w-10 text-muted-foreground/20" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xl font-bold text-muted-foreground/80">Isolated Asset</p>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">This item currently has no security connections. Link OTPs, Passkeys or Envs to create a hub.</p>
                                </div>
                                <Button variant="outline" onClick={() => setIsLinkSelectorOpen(true)} className="mt-2">
                                    Create First Connection
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="flex flex-col gap-12">
                            {linkedByCategory.map(cat => (
                                <div key={`hub-cat-${cat.id}`} className="space-y-6">
                                    <div className="flex items-center gap-3 opacity-70">
                                        <cat.icon className={cn("h-4 w-4", cat.color)} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">{cat.name}</span>
                                        <div className="h-px bg-gradient-to-r from-border to-transparent flex-1" />
                                    </div>
                                    <div className="flex flex-col gap-4 pl-4 border-l border-border/50">
                                        {cat.items.map(linked => (
                                            <div key={`${linked.type}-${linked.id}`} className="relative group">
                                                {renderCard(linked, linked.type)}
                                                <div className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 transition-all">
                                                    <DeleteConfirmDialog 
                                                        onConfirm={() => handleUnlink(linked.type, linked.id)}
                                                        title="Unlink Component?"
                                                        description="Remove this component from the Security Hub. The item will still exist in your vault."
                                                        confirmText="Unlink"
                                                    >
                                                        <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-destructive hover:bg-destructive/10 gap-2">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Unlink
                                                        </Button>
                                                    </DeleteConfirmDialog>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ItemDetail;

