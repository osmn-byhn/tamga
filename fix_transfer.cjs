const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

// Fix GroupCard.jsx
const groupCardPath = path.join(srcDir, 'components', 'GroupCard.jsx');
let groupCode = fs.readFileSync(groupCardPath, 'utf8');

if (!groupCode.includes('TransferSessionDialog')) {
    // We need to inject the import
    groupCode = groupCode.replace(
        "import DeleteConfirmDialog from \"./DeleteConfirmDialog\";",
        "import DeleteConfirmDialog from \"./DeleteConfirmDialog\";\nimport TransferSessionDialog from \"./TransferSessionDialog\";\nimport { Send } from \"lucide-react\";"
    );

    // Add storeKey to props
    groupCode = groupCode.replace(
        "    isGroupingTarget \n}) => {",
        "    isGroupingTarget,\n    storeKey \n}) => {"
    );

    // Add Transfer button
    const groupTransferBtn = `
                            {onDelete && storeKey && (
                                <TransferSessionDialog item={group} storeKey={storeKey} onDelete={onDelete}>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-purple-500 hover:bg-purple-500/10"
                                        title="Transfer Group to Session"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </TransferSessionDialog>
                            )}
`;

    groupCode = groupCode.replace(
        /                            <DeleteConfirmDialog/g,
        `${groupTransferBtn}                            <DeleteConfirmDialog`
    );

    fs.writeFileSync(groupCardPath, groupCode);
    console.log("Patched GroupCard.jsx");
}

// Enhance AuthContext.jsx transferItemToSession with better error handling and targetDataArray initialization
const authContextPath = path.join(srcDir, 'context', 'AuthContext.jsx');
let authCode = fs.readFileSync(authContextPath, 'utf8');

const updatedTransferLogic = `
    const transferItemToSession = async (item, targetSessionId, targetPassword, storeKey) => {
        try {
            const saltJson = localStorage.getItem(\`\${targetSessionId}-tamga-salt\`);
            const encryptedValidator = localStorage.getItem(\`\${targetSessionId}-tamga-validator\`);
            
            let targetKey = null;
            if (saltJson && encryptedValidator) {
                const salt = new Uint8Array(JSON.parse(saltJson));
                targetKey = await deriveKey(targetPassword, salt);
                
                const validation = await decryptData(encryptedValidator, targetKey);
                if (validation !== "tamga-valid-token" && validation !== "sphinx-valid-token") {
                    return { success: false, error: "Incorrect target password" };
                }
            }

            const encryptedTargetData = localStorage.getItem(\`\${targetSessionId}-\${storeKey}\`);
            let targetDataArray = [];
            if (encryptedTargetData) {
                 if (targetKey) {
                     const decrypted = await decryptData(encryptedTargetData, targetKey);
                     targetDataArray = decrypted || [];
                 } else {
                     try {
                         targetDataArray = JSON.parse(encryptedTargetData);
                     } catch(e) {
                         targetDataArray = [];
                     }
                 }
            }
            
            if (!Array.isArray(targetDataArray)) {
                targetDataArray = [];
            }

            targetDataArray.push(item);
            
            if (targetKey) {
                 const newEncrypted = await encryptData(targetDataArray, targetKey);
                 localStorage.setItem(\`\${targetSessionId}-\${storeKey}\`, newEncrypted);
            } else {
                 localStorage.setItem(\`\${targetSessionId}-\${storeKey}\`, JSON.stringify(targetDataArray));
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
console.log("Patched AuthContext.jsx with safer transfer");
