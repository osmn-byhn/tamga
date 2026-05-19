import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, Shield, Smartphone, Key, Terminal, ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import EditPasswordDialog from "./EditPasswordDialog";
import EditOtpDialog from "./EditOtpDialog";
import EditEnvDialog from "./EditEnvDialog";
import EditPasskeyDialog from "./EditPasskeyDialog";
import EditRecoveryCodeDialog from "./EditRecoveryCodeDialog";

export default function GlobalSearch({ open, onOpenChange }) {
    const { getAllVaultItems, getData, updateData } = useAuth();
    const [query, setQuery] = useState("");
    const [items, setItems] = useState([]);

    // Load all items when modal opens
    const loadItems = useCallback(async () => {
        if (!open) return;
        const all = await getAllVaultItems();
        // Flatten groups in passwords
        const flattened = [];
        all.forEach(item => {
            if (item.type === 'password' && item.items && Array.isArray(item.items)) {
                // It's a group, extract nested items
                item.items.forEach(nested => {
                    flattened.push({ ...nested, type: 'password', _groupId: item.id });
                });
            } else {
                flattened.push(item);
            }
        });
        setItems(flattened);
    }, [open, getAllVaultItems]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadItems();
        if (open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setQuery("");
        }
    }, [open, loadItems]);

    const filteredItems = useMemo(() => {
        if (!query.trim()) return [];
        const lowerQuery = query.toLowerCase();
        return items.filter(item => {
            // Convert the entire object to string to search every detail
            return JSON.stringify(item).toLowerCase().includes(lowerQuery);
        });
    }, [query, items]);

    // Unified update handler
    const handleUpdate = async (idToUpdate, updatedData, itemType, groupId) => {
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
        const sKey = getStorageKey(itemType);
        if (!sKey) return;

        const allItems = await getData(sKey);

        let updated;
        if (itemType === 'password' && groupId) {
            updated = allItems.map(g => {
                if (g.id === groupId && g.items) {
                    return {
                        ...g,
                        items: g.items.map(nested => String(nested.id) === String(idToUpdate) ? { ...nested, ...updatedData } : nested)
                    };
                }
                return g;
            });
        } else {
            updated = allItems.map(i => String(i.id) === String(idToUpdate) ? { ...i, ...updatedData } : i);
        }

        await updateData(sKey, updated);
        loadItems(); // reload items in search
    };

    const getItemIcon = (type) => {
        switch (type) {
            case 'password': return <Shield className="h-4 w-4 text-blue-500" />;
            case 'otp': return <Smartphone className="h-4 w-4 text-purple-500" />;
            case 'env': return <Terminal className="h-4 w-4 text-green-500" />;
            case 'passkey': return <Key className="h-4 w-4 text-orange-500" />;
            case 'recovery': return <ShieldAlert className="h-4 w-4 text-rose-500" />;
            default: return <Search className="h-4 w-4" />;
        }
    };

    const getItemTitle = (item) => {
        switch (item.type) {
            case 'password': return item.platform || item.username || 'Unnamed Password';
            case 'otp':
                try {
                    return new URL(item.uri).pathname.slice(1) || 'OTP Account';
                } catch {
                    return 'OTP Account';
                }
            case 'env': return item.projectName?.projectName || item.projectName || 'Unnamed Env';
            case 'passkey': return item.label || 'Unnamed Passkey';
            case 'recovery': return item.label || 'Unnamed Recovery';
            default: return 'Unknown Item';
        }
    };

    const getItemSubtitle = (item) => {
        switch (item.type) {
            case 'password': return item.username || 'No username';
            case 'otp':
                try {
                    return new URL(item.uri).searchParams.get('issuer') || 'No issuer';
                } catch {
                    return 'Invalid URI';
                }
            case 'env': return 'Environment Variables';
            case 'passkey': return 'Passkey/Secret';
            case 'recovery': return 'Recovery Codes';
            default: return '';
        }
    };

    const renderResultWithDialog = (item) => {
        const resultUI = (
            <div className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                <div className="p-2 rounded-full bg-muted flex-shrink-0 shadow-sm">
                    {getItemIcon(item.type)}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold truncate text-foreground/90">{getItemTitle(item)}</span>
                    <span className="text-xs text-muted-foreground truncate">{getItemSubtitle(item)}</span>
                </div>
            </div>
        );

        switch (item.type) {
            case 'password':
                return (
                    <EditPasswordDialog key={item.id} passwordItem={item} onUpdate={(id, data) => handleUpdate(id, data, 'password', item._groupId)}>
                        {resultUI}
                    </EditPasswordDialog>
                );
            case 'otp':
                return (
                    <EditOtpDialog key={item.id} otpItem={item} onUpdate={(id, data) => handleUpdate(id, data, 'otp')}>
                        {resultUI}
                    </EditOtpDialog>
                );
            case 'env':
                return (
                    <EditEnvDialog key={item.id} envItem={item} onUpdate={(id, data) => handleUpdate(id, data, 'env')}>
                        {resultUI}
                    </EditEnvDialog>
                );
            case 'passkey':
                return (
                    <EditPasskeyDialog key={item.id} passkey={item} onUpdate={(id, data) => handleUpdate(id, data, 'passkey')}>
                        {resultUI}
                    </EditPasskeyDialog>
                );
            case 'recovery':
                return (
                    <EditRecoveryCodeDialog key={item.id} recovery={item} onUpdate={(id, data) => handleUpdate(id, data, 'recovery')}>
                        {resultUI}
                    </EditRecoveryCodeDialog>
                );
            default:
                return <div key={item.id}>{resultUI}</div>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0 bg-background/95 backdrop-blur-2xl border-border/50 shadow-2xl">
                <DialogTitle className="sr-only">Global Search</DialogTitle>
                <DialogDescription className="sr-only">Search your vault for passwords, OTPs, passkeys, env files, and recovery codes.</DialogDescription>

                <div className="flex items-center border-b border-border/50 px-4 py-2">
                    <Search className="mr-3 h-5 w-5 shrink-0 text-muted-foreground/70" />
                    <input
                        className="flex h-12 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search everywhere..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />

                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query.trim() === "" ? (
                        <div className="py-14 text-center text-sm text-muted-foreground">
                            <p className="font-medium text-foreground/80">Search your vault</p>
                            <p className="text-xs mt-1 opacity-70">Find passwords, OTPs, env files, passkeys, and more.</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="py-14 text-center text-sm text-muted-foreground">
                            <p className="font-medium text-foreground/80">No results found</p>
                            <p className="text-xs mt-1 opacity-70">Could not find any items matching "{query}".</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {filteredItems.map(item => renderResultWithDialog(item))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
