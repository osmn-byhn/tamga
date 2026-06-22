import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const AuthContext = createContext({
    sessions: [],
    activeSession: null,
    selectSession: () => {},
    createSession: () => {},
    isLocked: false,
    hasPassword: false,
    unlock: (password) => Promise.resolve(false),
    setMasterPassword: (password) => Promise.resolve(),
    removeMasterPassword: () => Promise.resolve(),
    lock: () => { },
    getData: (key) => Promise.resolve(null),
    updateData: (key, value) => Promise.resolve(),
    exportData: () => Promise.resolve(null),
    importData: (jsonData) => Promise.resolve(false),
});

export function AuthProvider({ children }) {
    const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [encryptionKey, setEncryptionKey] = useState(null);

    useEffect(() => {
        // Migration to Sessions
        const loadedSessionsStr = localStorage.getItem("tamga-sessions");
        let loadedSessions = [];
        
        if (loadedSessionsStr) {
            loadedSessions = JSON.parse(loadedSessionsStr);
        } else {
            const oldSalt = localStorage.getItem(`${activeSession?.id}-tamga-salt`);
            if (oldSalt) {
                const defaultSession = { id: "default", name: "Main Profile", photo: null };
                loadedSessions = [defaultSession];
                localStorage.setItem("tamga-sessions", JSON.stringify(loadedSessions));
                
                const keysToMigrate = [
                    "tamga-salt", "tamga-validator", "tamga-otp-uris", 
                    "tamga-passwords", "tamga-passkeys", "tamga-envs", "tamga-recovery-codes",
                    "tamga-hide-sensitive", "tamga-mask-style", "tamga-max-failed-attempts",
                    "tamga-failed-action", "tamga-backup-path", "tamga-auto-lock-timeout",
                    "tamga-failed-attempts-count"
                ];
                keysToMigrate.forEach(k => {
                    const val = localStorage.getItem(k);
                    if (val !== null) {
                        localStorage.setItem(`default-${k}`, val);
                        localStorage.removeItem(k);
                    }
                });
            }
        }
        
        setSessions(loadedSessions);
    }, []);

    // Crypto Utilities
    const deriveKey = async (password, salt) => {
        console.log("[deriveKey] Start", { passwordLen: password?.length, saltLen: salt?.byteLength });
        try {
            const enc = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                "raw",
                enc.encode(password),
                { name: "PBKDF2" },
                false,
                ["deriveKey"]
            );
            console.log("[deriveKey] Material imported");

            const key = await crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: salt,
                    iterations: 100000,
                    hash: "SHA-256",
                },
                keyMaterial,
                { name: "AES-GCM", length: 256 },
                false,
                ["encrypt", "decrypt"]
            );
            console.log("[deriveKey] Key derivation complete");
            return key;
        } catch (e) {
            console.error("[deriveKey] FATAL ERROR", e);
            throw e;
        }
    };

    const encryptData = async (data, key) => {
        const enc = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encoded = enc.encode(JSON.stringify(data));

        const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            encoded
        );

        const ivArray = Array.from(iv);
        const ciphertextArray = Array.from(new Uint8Array(ciphertext));

        return JSON.stringify({
            iv: ivArray,
            data: ciphertextArray
        });
    };

    const decryptData = async (encryptedJson, key) => {
        console.log("[decryptData] Start", { inputLen: encryptedJson?.length });
        try {
            const parsed = JSON.parse(encryptedJson);
            const { iv, data } = parsed;

            if (!iv || !data) {
                console.error("[decryptData] Missing iv or data in parsed object", Object.keys(parsed));
                return null;
            }

            const ivArray = new Uint8Array(iv);
            const dataArray = new Uint8Array(data);

            // AES-GCM tag is usually 16 bytes. If data is smaller, decryption will fail anyway.
            if (dataArray.length < 16) {
                console.error("[decryptData] Data too short");
                return null;
            }

            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivArray },
                key,
                dataArray
            );

            const dec = new TextDecoder();
            const decodedResult = dec.decode(decrypted);
            console.log("[decryptData] Decryption/Decode success");
            return JSON.parse(decodedResult);
        } catch (e) {
            console.error("[decryptData] FAILED", e);
            return null;
        }
    };

    // Session Actions
    const selectSession = (sessionId) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setActiveSession(session);
            const salt = localStorage.getItem(`${sessionId}-tamga-salt`);
            const validator = localStorage.getItem(`${sessionId}-tamga-validator`);
            if (salt && validator) {
                setHasPassword(true);
                setIsLocked(true);
            } else {
                setHasPassword(false);
                setIsLocked(false);
            }
        }
    };

    const logoutSession = () => {
        setActiveSession(null);
        setEncryptionKey(null);
        setHasPassword(false);
        setIsLocked(false);
    };

    const createSession = (name, photo) => {
        const newSession = { id: Date.now().toString(), name, photo };
        const updated = [...sessions, newSession];
        setSessions(updated);
        localStorage.setItem("tamga-sessions", JSON.stringify(updated));
        selectSession(newSession.id);
    };

    // Auth Actions
    const setMasterPassword = async (password) => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveKey(password, salt);

        // Create validator token
        const validatorToken = "tamga-valid-token";
        const encryptedValidator = await encryptData(validatorToken, key);

        // Save auth data
        localStorage.setItem(`${activeSession.id}-tamga-salt`, JSON.stringify(Array.from(salt)));
        localStorage.setItem(`${activeSession.id}-tamga-validator`, encryptedValidator);

        setEncryptionKey(key);
        setHasPassword(true);
        setIsLocked(false);
    };

    const unlock = async (password) => {
        try {
            const saltJson = localStorage.getItem(`${activeSession?.id}-tamga-salt`);
            const encryptedValidator = localStorage.getItem(`${activeSession?.id}-tamga-validator`);

            if (!saltJson || !encryptedValidator) return true; // Should ideally be handled

            const salt = new Uint8Array(JSON.parse(saltJson));
            const key = await deriveKey(password, salt);

            const validation = await decryptData(encryptedValidator, key);

            if (validation === "tamga-valid-token" || validation === "sphinx-valid-token") {
                setEncryptionKey(key);
                setIsLocked(false);
                return true;
            }
            return false;
        } catch (e) {
            console.error("Unlock error", e);
            return false;
        }
    };

    const removeMasterPassword = async () => {
        // Clear only active session data
        if(activeSession) {
            const keysToRemove = [`${activeSession.id}-tamga-otp-uris`, `${activeSession.id}-tamga-passwords`, `${activeSession.id}-tamga-passkeys`, `${activeSession.id}-tamga-envs`, `${activeSession.id}-tamga-recovery-codes`, `${activeSession.id}-tamga-salt`, `${activeSession.id}-tamga-validator`];
            keysToRemove.forEach(k => localStorage.removeItem(k));
        }
        setHasPassword(false);
        setIsLocked(false);
        setEncryptionKey(null);
    };

    const emergencyWipe = async (withBackup = false, backupPath = "") => {
        if (withBackup) {
            const keysToExport = [`${activeSession.id}-tamga-otp-uris`, `${activeSession.id}-tamga-passwords`, `${activeSession.id}-tamga-passkeys`, `${activeSession.id}-tamga-envs`, `${activeSession.id}-tamga-recovery-codes`, `${activeSession.id}-tamga-salt`, `${activeSession.id}-tamga-validator`];
            const rawData = {};
            keysToExport.forEach(k => {
                const val = localStorage.getItem(k);
                if (val) rawData[k] = val;
            });
            
            if (Object.keys(rawData).length > 0) {
                const backupObj = {
                    version: 2,
                    isRawBackup: true,
                    timestamp: Date.now(),
                    data: rawData
                };
                
                try {
                    const filename = `tamga-emergency-backup-${new Date().toISOString().slice(0, 10)}.json`;
                    
                    if (window.ipcRenderer) {
                        if (backupPath) {
                            // Automatically save to the selected directory
                            const separator = backupPath.includes('\\') ? '\\' : '/';
                            const fullPath = backupPath.endsWith(separator) ? `${backupPath}${filename}` : `${backupPath}${separator}${filename}`;
                            
                            await window.ipcRenderer.invoke('write-file-direct', {
                                content: JSON.stringify(backupObj),
                                filePath: fullPath
                            });
                        } else {
                            // Prompt user
                            await window.ipcRenderer.invoke('save-file', {
                                content: JSON.stringify(backupObj),
                                defaultPath: filename
                            });
                        }
                    } else {
                        const blob = new Blob([JSON.stringify(backupObj)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = defaultPath;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        // Wait briefly to ensure download triggers
                        await new Promise(r => setTimeout(r, 1000));
                    }
                } catch (e) {
                    console.error("Failed to download emergency backup", e);
                }
            }
        }
        await removeMasterPassword();
    };

    const lock = () => {
        if (hasPassword) {
            setIsLocked(true);
            setEncryptionKey(null); // Clear key from memory on lock
        }
    };

    // Data Access Actions
    const updateData = useCallback(async (storageKey, value) => {
        if (!encryptionKey) {
            toast.error("App is locked or no key available");
            return;
        }
        try {
            const actualKey = (activeSession && !storageKey.startsWith(`${activeSession.id}-`)) 
                              ? `${activeSession.id}-${storageKey}` 
                              : storageKey;
            const encrypted = await encryptData(value, encryptionKey);
            localStorage.setItem(actualKey, encrypted);
        } catch (e) {
            console.error("Encryption save failed", e);
            toast.error("Failed to save encrypted data");
        }
    }, [encryptionKey, activeSession]);

    const getData = useCallback(async (storageKey) => {
        if (!encryptionKey) return null;
        
        const actualKey = (activeSession && !storageKey.startsWith(`${activeSession.id}-`)) 
                          ? `${activeSession.id}-${storageKey}` 
                          : storageKey;
        
        let stored = localStorage.getItem(actualKey);
        
        // Auto-migrate from global unprefixed key if actualKey is empty
        if (!stored && activeSession && !storageKey.startsWith(`${activeSession.id}-`)) {
            const globalStored = localStorage.getItem(storageKey);
            if (globalStored) {
                try {
                    // Test if we can decrypt the global data with current session key
                    const testDecrypt = await decryptData(globalStored, encryptionKey);
                    if (testDecrypt) {
                        // It belongs to us! Migrate it.
                        localStorage.setItem(actualKey, globalStored);
                        localStorage.removeItem(storageKey);
                        stored = globalStored;
                        console.log(`Migrated ${storageKey} to ${actualKey}`);
                    }
                } catch(e) {
                    console.log(`Global ${storageKey} does not belong to current session.`);
                }
            }
        }

        if (!stored) return null;
        return await decryptData(stored, encryptionKey);
    }, [encryptionKey, decryptData, activeSession]);

    const getAllVaultItems = useCallback(async () => {
        const keys = [
            { key: `${activeSession.id}-tamga-passwords`, type: 'password' },
            { key: `${activeSession.id}-tamga-otp-uris`, type: 'otp' },
            { key: `${activeSession.id}-tamga-envs`, type: 'env' },
            { key: `${activeSession.id}-tamga-passkeys`, type: 'passkey' },
            { key: `${activeSession.id}-tamga-recovery-codes`, type: 'recovery' }
        ];
        
        const results = [];
        for (const k of keys) {
            const items = await getData(k.key) || [];
            results.push(...items.map(i => ({ ...i, type: k.type })));
        }
        return results;
    }, [getData]);

    const toggleLink = useCallback(async (from, to) => {
        if (!from || !to) return;
        
        const getSKey = (t) => {
            switch(t) {
                case 'password': return `${activeSession.id}-tamga-passwords`;
                case 'otp': return `${activeSession.id}-tamga-otp-uris`;
                case 'env': return `${activeSession.id}-tamga-envs`;
                case 'passkey': return `${activeSession.id}-tamga-passkeys`;
                case 'recovery': return `${activeSession.id}-tamga-recovery-codes`;
                default: return null;
            }
        };

        const fromKey = getSKey(from.type);
        const toKey = getSKey(to.type);
        if (!fromKey || !toKey) return;

        const fromItems = await getData(fromKey) || [];
        const toItems = (fromKey === toKey) ? fromItems : (await getData(toKey) || []);

        const updateItemInList = (list, targetId, linkToAdd) => {
            return list.map(item => {
                if (String(item.id) === String(targetId)) {
                    const links = item.links || [];
                    const exists = links.find(l => l.type === linkToAdd.type && String(l.id) === String(linkToAdd.id));
                    if (exists) {
                        return { ...item, links: links.filter(l => !(l.type === linkToAdd.type && String(l.id) === String(linkToAdd.id))) };
                    } else {
                        return { ...item, links: [...links, linkToAdd] };
                    }
                }
                return item;
            });
        };

        const newFromItems = updateItemInList(fromItems, from.id, { type: to.type, id: to.id });
        await updateData(fromKey, newFromItems);

        if (fromKey !== toKey || from.id !== to.id) {
            const currentToItems = (fromKey === toKey) ? newFromItems : toItems;
            const newToItems = updateItemInList(currentToItems, to.id, { type: from.type, id: from.id });
            await updateData(toKey, newToItems);
        }
        
        toast.success("Links updated");
    }, [getData, updateData]);

    const removeGlobalLink = useCallback(async (type, id) => {
        const keys = [`${activeSession.id}-tamga-passwords`, `${activeSession.id}-tamga-otp-uris`, `${activeSession.id}-tamga-envs`, `${activeSession.id}-tamga-passkeys`, `${activeSession.id}-tamga-recovery-codes`];
        for (const key of keys) {
            const items = await getData(key) || [];
            let changed = false;
            const updated = items.map(item => {
                if (item.links?.some(l => l.type === type && String(l.id) === String(id))) {
                    changed = true;
                    return { ...item, links: item.links.filter(l => !(l.type === type && String(l.id) === String(id))) };
                }
                return item;
            });
            if (changed) {
                await updateData(key, updated);
            }
        }
    }, [getData, updateData]);

    // Export & Import
    const exportData = async () => {
        if (!encryptionKey) return null;

        const saltJson = localStorage.getItem(`${activeSession?.id}-tamga-salt`);
        if (!saltJson) return null;

        const keysToExport = [`${activeSession.id}-tamga-otp-uris`, `${activeSession.id}-tamga-passwords`, `${activeSession.id}-tamga-passkeys`, `${activeSession.id}-tamga-envs`, `${activeSession.id}-tamga-recovery-codes`];
        const exportObj = {
            version: 2, // Increment version
            timestamp: Date.now(),
            data: {}
        };

        for (const key of keysToExport) {
            const decrypted = await getData(key);
            if (decrypted) {
                exportObj.data[key] = decrypted;
            }
        }

        // Return as a JSON containing the encrypted data AND the salt
        const encrypted = await encryptData(exportObj, encryptionKey);
        return JSON.stringify({
            encrypted,
            salt: JSON.parse(saltJson)
        });
    };

    const importData = async (backupJsonString, password = null, manualSalt = null) => {
        console.log("[Import] Starting process...");
        try {
            const backup = JSON.parse(backupJsonString);
            const isLegacy = !backup.salt && !manualSalt;
            console.log("[Import] Backup parsed", {
                version: backup.version,
                hasSalt: !!backup.salt,
                hasManualSalt: !!manualSalt,
                hasPassword: !!password
            });

            // Special Case: "Already a User" - Fresh install restoration
            if (!hasPassword) {
                console.log("[Import] Fresh install restoration mode");

                if (!password) {
                    console.error("[Import] Error: Password required but missing");
                    toast.error("Master password is required to restore your vault.");
                    return false;
                }

                // Determine salt source
                let saltArray = null;
                if (backup.salt) {
                    saltArray = new Uint8Array(backup.salt);
                } else if (manualSalt) {
                    console.log("[Import] Using provided manual salt");
                    saltArray = new Uint8Array(manualSalt);
                } else {
                    console.error("[Import] Error: Salt missing. This is a legacy backup.");
                    toast.error("Legacy Backup Detected", {
                        description: "This backup is not portable. You must provide a manual salt to restore it on this device.",
                        duration: 6000
                    });
                    return false;
                }

                console.log("[Import] Deriving key from old password...");
                const derivedKey = await deriveKey(password, saltArray);

                const encryptedContent = backup.encrypted ?
                    (typeof backup.encrypted === 'string' ? backup.encrypted : JSON.stringify(backup.encrypted))
                    : backupJsonString;

                console.log("[Import] Attempting decryption...");
                const decryptedObj = await decryptData(encryptedContent, derivedKey);

                if (!decryptedObj || !decryptedObj.data) {
                    console.error("[Import] Decryption verify failed. Likely wrong password or invalid salt.");
                    toast.error("Restoration failed. Incorrect password, invalid salt, or corrupted backup file.");
                    return false;
                }

                console.log("[Import] RESTORING DATA TO LOCAL STORAGE...");
                // Restore items FIRST
                for (const [key, value] of Object.entries(decryptedObj.data)) {
                    const reEncrypted = await encryptData(value, derivedKey);
                    localStorage.setItem(key, reEncrypted);
                    console.log(`[Import] Saved ${key}`);
                }

                // Initialize auth state LAST
                console.log("[Import] Initializing vault state...");
                const validatorToken = "tamga-valid-token";
                const encryptedValidator = await encryptData(validatorToken, derivedKey);

                localStorage.setItem(`${activeSession.id}-tamga-salt`, JSON.stringify(Array.from(saltArray)));
                localStorage.setItem(`${activeSession.id}-tamga-validator`, encryptedValidator);

                setEncryptionKey(derivedKey);
                setHasPassword(true);
                setIsLocked(false);

                console.log("[Import] RESTORATION COMPLETE");
                toast.success("Vault restored successfully from backup");
                return true;
            }

            // Normal Case: App is already initialized (merge mode)
            console.log("[Import] Normal import mode (vault already exists)");
            let decryptionKey = encryptionKey;

            const effectiveSalt = backup.salt || manualSalt;
            if (password && effectiveSalt) {
                console.log("[Import] Using provided password/salt for cross-device decryption...");
                const saltArray = new Uint8Array(effectiveSalt);
                decryptionKey = await deriveKey(password, saltArray);
            }

            if (!decryptionKey) {
                toast.error("Unlock the app or provide the backup password");
                return false;
            }

            const encryptedContent = backup.encrypted ?
                (typeof backup.encrypted === 'string' ? backup.encrypted : JSON.stringify(backup.encrypted))
                : backupJsonString;

            const decryptedObj = await decryptData(encryptedContent, decryptionKey);

            if (!decryptedObj || !decryptedObj.data) {
                toast.error("Invalid backup file or incorrect password/salt");
                return false;
            }

            const mergeStats = { added: 0, skipped: 0 };
            for (const [key, incomingValue] of Object.entries(decryptedObj.data)) {
                // If the data is not an array, just overwrite (e.g. system settings)
                if (!Array.isArray(incomingValue)) {
                    await updateData(key, incomingValue);
                    continue;
                }

                const localValue = await getData(key) || [];
                const merged = [...localValue];

                for (const item of incomingValue) {
                    let isDuplicate = false;

                    if (key.includes("tamga-otp-uris")) {
                        isDuplicate = localValue.includes(item);
                    } else if (key.includes("tamga-passwords")) {
                        isDuplicate = localValue.some(p =>
                            p.platform === item.platform &&
                            p.username === item.username &&
                            p.value === item.value
                        );
                    } else if (key.includes("tamga-envs")) {
                        isDuplicate = localValue.some(e =>
                            e.projectName === item.projectName &&
                            e.content === item.content
                        );
                    } else if (key.includes("tamga-passkeys")) {
                        isDuplicate = localValue.some(pk =>
                            pk.label === item.label &&
                            pk.secret === item.secret
                        );
                    } else if (key.includes("tamga-recovery-codes")) {
                        isDuplicate = localValue.some(rc =>
                            rc.label === item.label &&
                            rc.codes === item.codes
                        );
                    }

                    if (isDuplicate) {
                        mergeStats.skipped++;
                    } else {
                        // Ensure unique ID for the local machine to avoid collisions
                        const newItem = (typeof item === 'object' && item !== null)
                            ? { ...item, id: Date.now() + Math.random() }
                            : item;
                        merged.push(newItem);
                        mergeStats.added++;
                    }
                }
                await updateData(key, merged);
            }

            if (mergeStats.added > 0 || mergeStats.skipped > 0) {
                toast.success(`Import complete`, {
                    description: `${mergeStats.added} new items added, ${mergeStats.skipped} duplicates skipped.`
                });
            } else {
                toast.success("Data imported successfully");
            }
            return true;
        } catch (e) {
            console.error("[Import] GLOBAL ERROR", e);
            toast.error("Import failed: Malformed file or internal error.");
            return false;
        }
    };



    const transferItemToSession = async (item, targetSessionId, targetPassword, storeKey) => {
        try {
            console.log("[Transfer] START", { targetSessionId, storeKey, itemType: item.type, itemId: item.id });
            const saltJson = localStorage.getItem(`${targetSessionId}-tamga-salt`);
            const encryptedValidator = localStorage.getItem(`${targetSessionId}-tamga-validator`);
            
            let targetKey = null;
            if (saltJson && encryptedValidator) {
                console.log("[Transfer] Target is protected. Validating password...");
                const salt = new Uint8Array(JSON.parse(saltJson));
                targetKey = await deriveKey(targetPassword, salt);
                
                const validation = await decryptData(encryptedValidator, targetKey);
                if (validation !== "tamga-valid-token" && validation !== "sphinx-valid-token") {
                    console.error("[Transfer] Incorrect target password");
                    return { success: false, error: "Incorrect target password" };
                }
                console.log("[Transfer] Target password valid");
            } else {
                console.log("[Transfer] Target is NOT protected.");
            }

            const targetStorageKey = `${targetSessionId}-${storeKey}`;
            const encryptedTargetData = localStorage.getItem(targetStorageKey);
            let targetDataArray = [];
            
            console.log("[Transfer] Reading existing target data:", { exists: !!encryptedTargetData, length: encryptedTargetData?.length });
            
            if (encryptedTargetData) {
                 if (targetKey) {
                     const decrypted = await decryptData(encryptedTargetData, targetKey);
                     targetDataArray = decrypted || [];
                     console.log("[Transfer] Decrypted existing data. Array length:", targetDataArray.length);
                 } else {
                     try {
                         targetDataArray = JSON.parse(encryptedTargetData);
                         console.log("[Transfer] Parsed plain existing data. Array length:", targetDataArray.length);
                     } catch(e) {
                         console.error("[Transfer] Failed to parse plain data", e);
                         targetDataArray = [];
                     }
                 }
            }
            
            if (!Array.isArray(targetDataArray)) {
                console.warn("[Transfer] Existing data was not an array. Resetting.");
                targetDataArray = [];
            }

            // CHECK FOR DUPLICATES
            const isDuplicate = targetDataArray.some(existing => existing.id === item.id);
            if (isDuplicate) {
                console.warn("[Transfer] Item with this ID already exists in target session! We will still push it, but React might complain.");
            }

            targetDataArray.push(item);
            
            if (targetKey) {
                 const newEncrypted = await encryptData(targetDataArray, targetKey);
                 localStorage.setItem(targetStorageKey, newEncrypted);
                 console.log("[Transfer] Saved encrypted data to", targetStorageKey);
            } else {
                 localStorage.setItem(targetStorageKey, JSON.stringify(targetDataArray));
                 console.log("[Transfer] Saved plain data to", targetStorageKey);
            }

            return { success: true };
        } catch (e) {
            console.error("Transfer error", e);
            return { success: false, error: e.message || String(e) };
        }
    };

    return (
        <AuthContext.Provider value={{
            sessions,
            activeSession,
            selectSession,
            createSession,
            logoutSession,
            isLocked,
            hasPassword,
            unlock,
            setMasterPassword,
            removeMasterPassword,
            emergencyWipe,
            lock,
            getData,
            updateData,
            exportData,
            importData,
            transferItemToSession,
            getAllVaultItems,
            toggleLink,
            removeGlobalLink
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
