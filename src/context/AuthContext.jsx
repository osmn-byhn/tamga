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
        // Check if secure storage is initialized
        const salt = localStorage.getItem("sphinx-salt");
        const validator = localStorage.getItem("sphinx-validator");

        if (salt && validator) {
            setHasPassword(true);
            setIsLocked(true);
        } else {
            // Fallback check for old auth (migration could go here, but we'll prioritize new setup)
            const oldHash = localStorage.getItem("sphinx-app-lock");
            if (oldHash) {
                // Nuke old data strictly as per plan for clean slate
                localStorage.removeItem("sphinx-app-lock");
                setHasPassword(false);
                setIsLocked(false);
            }
        }
    }, []);

    // Crypto Utilities
    const deriveKey = async (password, salt) => {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return await crypto.subtle.deriveKey(
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
        try {
            const { iv, data } = JSON.parse(encryptedJson);
            const ivArray = new Uint8Array(iv);
            const dataArray = new Uint8Array(data);

            // AES-GCM tag is usually 16 bytes. If data is smaller, decryption will fail anyway.
            if (dataArray.length < 16) {
                throw new Error("Encrypted data is too small or corrupted");
            }

            const decrypted = await crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivArray },
                key,
                dataArray
            );

            const dec = new TextDecoder();
            return JSON.parse(dec.decode(decrypted));
        } catch (e) {
            console.error("Decryption failed", e);
            return null;
        }
    };

    // Auth Actions
    const setMasterPassword = async (password) => {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await deriveKey(password, salt);

        // Create validator token
        const validatorToken = "sphinx-valid-token";
        const encryptedValidator = await encryptData(validatorToken, key);

        // Save auth data
        localStorage.setItem("sphinx-salt", JSON.stringify(Array.from(salt)));
        localStorage.setItem("sphinx-validator", encryptedValidator);

        setEncryptionKey(key);
        setHasPassword(true);
        setIsLocked(false);
    };

    const unlock = async (password) => {
        try {
            const saltJson = localStorage.getItem("sphinx-salt");
            const encryptedValidator = localStorage.getItem("sphinx-validator");

            if (!saltJson || !encryptedValidator) return true; // Should ideally be handled

            const salt = new Uint8Array(JSON.parse(saltJson));
            const key = await deriveKey(password, salt);

            const validation = await decryptData(encryptedValidator, key);

            if (validation === "sphinx-valid-token") {
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

        const keysToExport = ["otp-auth-uris", "sphinx-passwords", "sphinx-passkeys", "sphinx-envs"];
        const exportObj = {
            version: 1,
            timestamp: Date.now(),
            data: {}
        };

        for (const key of keysToExport) {
            const decrypted = await getData(key);
            if (decrypted) {
                exportObj.data[key] = decrypted;
            }
        }

        // Return as encrypted blob string
        return await encryptData(exportObj, encryptionKey);
    };

    const importData = async (encryptedJsonString) => {
        if (!encryptionKey) return false;

        try {
            const decryptedObj = await decryptData(encryptedJsonString, encryptionKey);
            if (!decryptedObj || !decryptedObj.data) {
                toast.error("Invalid backup file or wrong password");
                return false;
            }

            // Restore data
            for (const [key, value] of Object.entries(decryptedObj.data)) {
                await updateData(key, value);
            }

            toast.success("Data imported successfully");
            return true;
        } catch (e) {
            console.error("Import failed", e);
            toast.error("Import failed. Integrity check error.");
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
