const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const authContextPath = path.join(srcDir, 'context', 'AuthContext.jsx');
let authCode = fs.readFileSync(authContextPath, 'utf8');

const updatedTransferLogic = `
    const transferItemToSession = async (item, targetSessionId, targetPassword, storeKey) => {
        try {
            console.log("[Transfer] START", { targetSessionId, storeKey, itemType: item.type, itemId: item.id });
            const saltJson = localStorage.getItem(\`\${targetSessionId}-tamga-salt\`);
            const encryptedValidator = localStorage.getItem(\`\${targetSessionId}-tamga-validator\`);
            
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

            const targetStorageKey = \`\${targetSessionId}-\${storeKey}\`;
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
`;

authCode = authCode.replace(
    /    const transferItemToSession = async \([\s\S]*?    \};\n/m,
    updatedTransferLogic
);

fs.writeFileSync(authContextPath, authCode);
console.log("Patched AuthContext.jsx with extensive debug logging");
