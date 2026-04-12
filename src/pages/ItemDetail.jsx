import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
import { ArrowLeft, Link as LinkIcon, Shield, Key, Terminal, Smartphone, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import OtpCard from "@/components/OtpCard";
import EnvCard from "@/components/EnvCard";
import PasskeyCard from "@/components/PasskeyCard";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import LinkSelector from "@/components/LinkSelector";

const ItemDetail = () => {
    const { type, id } = useParams();
    const navigate = useNavigate();
    const { getData, toggleLink } = useAuth();
    
    const [item, setItem] = useState(null);
    const [linkedItems, setLinkedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLinkSelectorOpen, setIsLinkSelectorOpen] = useState(false);

    const getStorageKey = (t) => {
        switch (t) {
            case 'password': return 'tamga-passwords';
            case 'otp': return 'tamga-otp-uris';
            case 'env': return 'tamga-envs';
            case 'passkey': return 'tamga-passkeys';
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
    }, [loadData]);

    const handleUnlink = async (linkedType, linkedId) => {
        await toggleLink({ type, id }, { type: linkedType, id: linkedId });
        loadData();
    };

    if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading linked data...</div>;

    const getIcon = (t, className = "h-6 w-6") => {
        switch (t) {
            case 'password': return <Shield className={cn(className, "text-blue-500")} />;
            case 'otp': return <Smartphone className={cn(className, "text-purple-500")} />;
            case 'env': return <Terminal className={cn(className, "text-green-500")} />;
            case 'passkey': return <Key className={cn(className, "text-orange-500")} />;
            default: return null;
        }
    };

    const getItemLabel = (targetItem, targetType) => {
        if (!targetItem) return "Unknown";
        switch (targetType) {
            case 'password': return targetItem.platform || "Untitled Password";
            case 'env': 
                return typeof targetItem.projectName === 'object' 
                    ? (targetItem.projectName.projectName || item.projectName.id || "Unknown Project") 
                    : (targetItem.projectName || "Untitled Project");
            case 'passkey': return targetItem.label || "Untitled Passkey";
            case 'otp': 
                try {
                    const uriPart = targetItem.uri.split('?')[0].split('/').pop();
                    const label = decodeURIComponent(uriPart.includes(':') ? uriPart.split(':')[1] : uriPart);
                    return label || "OTP Account";
                } catch(e) { return "OTP Account"; }
            default: return "Unknown";
        }
    };

    const categories = [
        { id: 'password', name: 'Passwords', icon: Shield },
        { id: 'otp', name: 'Authenticator (OTP)', icon: Smartphone },
        { id: 'passkey', name: 'Passkeys', icon: Key },
        { id: 'env', name: 'Environment Variables', icon: Terminal },
    ];

    const linkedByCategory = categories.map(cat => ({
        ...cat,
        items: linkedItems.filter(l => l.type === cat.id)
    })).filter(cat => cat.items.length > 0);

    return (
        <div className="container mx-auto p-6 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 gap-2 hover:bg-transparent -ml-2 text-muted-foreground hover:text-foreground transition-colors group">
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
            </Button>

            <header className="flex items-center gap-6 mb-10">
                <div className="p-5 rounded-3xl bg-muted/30 border border-border/50 shadow-inner">
                    {getIcon(type, "h-10 w-10")}
                </div>
                <div>
                    <p className="text-xs uppercase font-extrabold tracking-[0.2em] text-primary/60 mb-1">{type}</p>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        {getItemLabel(item, type)}
                    </h1>
                </div>
            </header>

            <div className="grid gap-12">
                {/* Main Item Card */}
                <Card className="border-none bg-muted/20 shadow-none ring-1 ring-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Primary Content</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {type === 'otp' && <OtpCard otpItem={item} />}
                        {type === 'env' && <EnvCard envItem={item} />}
                        {type === 'passkey' && <PasskeyCard passkey={item} />}
                        {type === 'password' && (
                            <div className="p-6 bg-card rounded-2xl border border-border shadow-sm space-y-4">
                                <div className="space-y-1">
                                    <p className="font-bold text-xl">{item.platform}</p>
                                    <p className="text-sm text-muted-foreground font-medium">{item.username}</p>
                                </div>
                                <div className="p-3 bg-muted/50 rounded-lg border border-border/50 font-mono text-center tracking-widest text-primary/50 text-sm">
                                    ••••••••••••••••
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Linked Items Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <LinkIcon className="h-6 w-6 text-primary" />
                                Linked Accounts
                            </h2>
                            <p className="text-sm text-muted-foreground">Connected security items that share context with this account.</p>
                        </div>
                        
                        <Dialog open={isLinkSelectorOpen} onOpenChange={setIsLinkSelectorOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2 shadow-lg shadow-primary/20">
                                    <LinkIcon className="h-4 w-4" />
                                    Manage Links
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Manage Connections</DialogTitle>
                                    <DialogDescription>
                                        Link other items from your vault to build a security graph.
                                    </DialogDescription>
                                </DialogHeader>
                                <LinkSelector 
                                    rootItem={{ type, id }}
                                    currentLinks={item.links || []} 
                                    onLinksChange={() => loadData()}
                                />
                                <div className="text-center mt-4">
                                    <Button onClick={() => setIsLinkSelectorOpen(false)} variant="outline" className="w-full">Done</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {linkedByCategory.length === 0 ? (
                        <Card className="border-none bg-muted/10 ring-1 ring-border ring-dashed">
                            <CardContent className="py-16 text-center space-y-4">
                                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                                    <LinkIcon className="h-8 w-8 text-muted-foreground/30" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-lg font-semibold">No connected items</p>
                                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">Use the Manage Links button to connect secrets, passkeys, or env files.</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-8">
                            {linkedByCategory.map(cat => (
                                <div key={`detail-cat-${cat.id}`} className="space-y-4">
                                    <div className="flex items-center gap-2 px-2">
                                        <cat.icon className="h-4 w-4 text-primary" />
                                        <h3 className="text-xs uppercase font-extrabold tracking-widest text-muted-foreground">{cat.name}</h3>
                                        <div className="h-px bg-border/50 flex-1 ml-2" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {cat.items.map(linked => (
                                            <Card key={`${linked.type}-${linked.id}`} className="group hover:ring-2 hover:ring-primary/20 transition-all border-none bg-card hover:shadow-md ring-1 ring-border">
                                                <CardContent className="p-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-4 flex-1 min-w-0 pr-2">
                                                        <div className="p-2.5 rounded-xl bg-muted/50">
                                                            {getIcon(linked.type, "h-5 w-5")}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold truncate text-sm">
                                                                {getItemLabel(linked, linked.type)}
                                                            </p>
                                                            {linked.type === 'password' && linked.username && (
                                                                <p className="text-[10px] text-muted-foreground truncate">{linked.username}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <Link to={`/details/${linked.type}/${linked.id}`}>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                                                                <ExternalLink className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <DeleteConfirmDialog 
                                                            onConfirm={() => handleUnlink(linked.type, linked.id)}
                                                            title="Unlink Item?"
                                                            description="Are you sure you want to remove the connection between these items?"
                                                            confirmText="Unlink"
                                                        >
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </DeleteConfirmDialog>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;
