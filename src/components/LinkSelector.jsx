import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Smartphone, Terminal, Key, Search, Link2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const LinkSelector = ({ currentLinks = [], onLinksChange, rootItem = null }) => {
    const { getData, toggleLink: apiToggleLink } = useAuth();
    const [search, setSearch] = useState("");
    const [allItems, setAllItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAll = async () => {
            setLoading(true);
            const passwords = (await getData("tamga-passwords") || []).map(i => ({ ...i, type: 'password' }));
            const otps = (await getData("tamga-otp-uris") || []).map(i => ({ ...i, type: 'otp' }));
            const envs = (await getData("tamga-envs") || []).map(i => ({ ...i, type: 'env' }));
            const passkeys = (await getData("tamga-passkeys") || []).map(i => ({ ...i, type: 'passkey' }));
            
            setAllItems([...passwords, ...otps, ...envs, ...passkeys]);
            setLoading(false);
        };
        loadAll();
    }, [getData]);

    const getItemLabel = (item) => {
        if (!item) return "Unknown";
        let label = "Unknown";
        switch (item.type) {
            case 'password': 
                label = item.platform || "Untitled Password";
                break;
            case 'env': 
                label = typeof item.projectName === 'object' 
                    ? (item.projectName.projectName || item.projectName.id || "Unknown Project") 
                    : (item.projectName || "Untitled Project");
                break;
            case 'passkey': 
                label = item.label || "Untitled Passkey";
                break;
            case 'otp': 
                try {
                    const uriPart = item.uri.split('?')[0].split('/').pop();
                    label = decodeURIComponent(uriPart.includes(':') ? uriPart.split(':')[1] : uriPart) || "OTP Account";
                } catch(e) { label = "OTP Account"; }
                break;
            default: label = "Unknown";
        }
        return String(label);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'password': return <Shield className="h-4 w-4 text-blue-500" />;
            case 'otp': return <Smartphone className="h-4 w-4 text-purple-500" />;
            case 'env': return <Terminal className="h-4 w-4 text-green-500" />;
            case 'passkey': return <Key className="h-4 w-4 text-orange-500" />;
            default: return null;
        }
    };

    const isLinked = (item) => {
        return currentLinks.some(l => l.type === item.type && String(l.id) === String(item.id));
    };

    const toggleLink = async (item) => {
        if (rootItem) {
            await apiToggleLink(rootItem, item);
            if (onLinksChange) onLinksChange();
        } else {
            if (isLinked(item)) {
                onLinksChange(currentLinks.filter(l => !(l.type === item.type && String(l.id) === String(item.id))));
            } else {
                onLinksChange([...currentLinks, { type: item.type, id: item.id }]);
            }
        }
    };

    const filteredItems = allItems.filter(item => {
        const label = getItemLabel(item).toLowerCase();
        return label.includes(search.toLowerCase());
    }).slice(0, 20); // Limit results for performance

    const categories = [
        { id: 'password', name: 'Passwords', icon: Shield },
        { id: 'otp', name: 'Authenticator (OTP)', icon: Smartphone },
        { id: 'passkey', name: 'Passkeys', icon: Key },
        { id: 'env', name: 'Environment Variables', icon: Terminal },
    ];

    const filteredItemsByCategory = categories.map(cat => ({
        ...cat,
        items: allItems.filter(item => {
            if (item.type !== cat.id) return false;
            const label = getItemLabel(item).toLowerCase();
            return label.includes(search.toLowerCase());
        }).slice(0, 10)
    })).filter(cat => cat.items.length > 0);

    const linkedByCategory = categories.map(cat => ({
        ...cat,
        links: currentLinks.filter(l => l.type === cat.id)
    })).filter(cat => cat.links.length > 0);

    return (
        <div className="space-y-4 py-4 border-t border-border mt-4">
            <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Linked Items</h4>
            </div>

            {/* Current Links Grouped */}
            <div className="space-y-3">
                {linkedByCategory.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No accounts linked yet.</p>
                ) : (
                    linkedByCategory.map(cat => (
                        <div key={`linked-${cat.id}`} className="space-y-1.5">
                            <div className="flex items-center gap-1.5 px-1">
                                <cat.icon className="h-3 w-3 text-muted-foreground/60" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">{cat.name}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {cat.links.map(link => {
                                    const found = allItems.find(i => i.type === link.type && String(i.id) === String(link.id));
                                    if (!found) return null;
                                    return (
                                        <div key={`${link.type}-${link.id}`} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium border border-border">
                                            {getItemLabel(found)}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-4 w-4 rounded-full p-0 hover:bg-destructive/20 hover:text-destructive"
                                                onClick={() => toggleLink(found)}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Find items to link..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="h-[200px] w-full rounded-md border p-2 overflow-y-auto bg-muted/5 custom-scrollbar">
                {loading ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">Loading vault...</div>
                ) : filteredItemsByCategory.length === 0 ? (
                    <div className="text-center py-4 text-sm text-muted-foreground">No items found.</div>
                ) : (
                    <div className="space-y-4">
                        {filteredItemsByCategory.map(cat => (
                            <div key={`search-cat-${cat.id}`} className="space-y-1">
                                <div className="flex items-center gap-1.5 px-2 py-1 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border/10 mb-1">
                                    <cat.icon className="h-3 w-3 text-muted-foreground/60" />
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">{cat.name}</span>
                                </div>
                                <div className="grid gap-0.5">
                                    {cat.items.map(item => (
                                        <Button
                                            key={`${item.type}-${item.id}`}
                                            variant="ghost"
                                            size="sm"
                                            className={cn(
                                                "justify-start gap-2 w-full h-8 text-xs",
                                                isLinked(item) && "bg-primary/10 text-primary hover:bg-primary/20"
                                            )}
                                            onClick={() => toggleLink(item)}
                                        >
                                            <span className="flex-1 text-left truncate">{getItemLabel(item)}</span>
                                            {isLinked(item) && <Link2 className="h-3 w-3" />}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkSelector;
