import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

const AuthContext = createContext({
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
    const [isLocked, setIsLocked] = useState(false);
    const [hasPassword, setHasPassword] = useState(false);
    const [encryptionKey, setEncryptionKey] = useState(null);

    useEffect(() => {
        // 1. One-time Migration from Sphinx to Tamga
        const keysToMigrate = [
            { old: "sphinx-salt", new: "tamga-salt" },
            { old: "sphinx-validator", new: "tamga-validator" },
            { old: "otp-auth-uris", new: "tamga-otp-uris" },
            { old: "sphinx-passwords", new: "tamga-passwords" },
            { old: "sphinx-passkeys", new: "tamga-passkeys" },
            { old: "sphinx-envs", new: "tamga-envs" }
        ];

        let migrated = false;
        keysToMigrate.forEach(({ old, new: newKey }) => {
            const data = localStorage.getItem(old);
            if (data && !localStorage.getItem(newKey)) {
                localStorage.setItem(newKey, data);
                // We keep old data for safety for now, or remove it?
                // Let's remove it to avoid confusion after successful move.
                localStorage.removeItem(old);
                migrated = true;
            }
        });

        if (migrated) {
            console.log("Data migrated to Tamga successfully");
        }

        // 2. Check if secure storage is initialized
        const salt = localStorage.getItem("tamga-salt");
        const validator = localStorage.getItem("tamga-validator");

        if (salt && validator) {
            setHasPassword(true);
            setIsLocked(true);
        } else {
            // Nuke any remnants
            localStorage.removeItem("sphinx-app-lock");
            setHasPassword(false);
            setIsLocked(false);
        }
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

    // Auth Actions
    const setMasterPassword = async (password) => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveKey(password, salt);

        // Create validator token
        const validatorToken = "tamga-valid-token";
        const encryptedValidator = await encryptData(validatorToken, key);

        // Save auth data
        localStorage.setItem("tamga-salt", JSON.stringify(Array.from(salt)));
        localStorage.setItem("tamga-validator", encryptedValidator);

        setEncryptionKey(key);
        setHasPassword(true);
        setIsLocked(false);
    };

    const unlock = async (password) => {
        try {
            const saltJson = localStorage.getItem("tamga-salt");
            const encryptedValidator = localStorage.getItem("tamga-validator");

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
        localStorage.clear(); // Nuclear option for security reset
        setHasPassword(false);
        setIsLocked(false);
        setEncryptionKey(null);
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
            const encrypted = await encryptData(value, encryptionKey);
            localStorage.setItem(storageKey, encrypted);
        } catch (e) {
            console.error("Encryption save failed", e);
            toast.error("Failed to save encrypted data");
        }
    }, [encryptionKey]);

    const getData = useCallback(async (storageKey) => {
        if (!encryptionKey) return null;
        const stored = localStorage.getItem(storageKey);
        if (!stored) return null;
        return await decryptData(stored, encryptionKey);
    }, [encryptionKey]);

    // Export & Import
    const exportData = async () => {
        if (!encryptionKey) return null;

        const saltJson = localStorage.getItem("tamga-salt");
        if (!saltJson) return null;

        const keysToExport = ["tamga-otp-uris", "tamga-passwords", "tamga-passkeys", "tamga-envs"];
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

                localStorage.setItem("tamga-salt", JSON.stringify(Array.from(saltArray)));
                localStorage.setItem("tamga-validator", encryptedValidator);

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

                    if (key === "tamga-otp-uris") {
                        isDuplicate = localValue.includes(item);
                    } else if (key === "tamga-passwords") {
                        isDuplicate = localValue.some(p =>
                            p.platform === item.platform &&
                            p.username === item.username &&
                            p.value === item.value
                        );
                    } else if (key === "tamga-envs") {
                        isDuplicate = localValue.some(e =>
                            e.projectName === item.projectName &&
                            e.content === item.content
                        );
                    } else if (key === "tamga-passkeys") {
                        isDuplicate = localValue.some(pk =>
                            pk.label === item.label &&
                            pk.secret === item.secret
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

    return (
        <AuthContext.Provider value={{
            isLocked,
            hasPassword,
            unlock,
            setMasterPassword,
            removeMasterPassword,
            lock,
            getData,
            updateData,
            exportData,
            importData
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
