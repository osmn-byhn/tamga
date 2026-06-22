const fs = require('fs');
const path = require('path');

const authPath = path.join(__dirname, 'src', 'context', 'AuthContext.jsx');
let content = fs.readFileSync(authPath, 'utf8');

// 1. Add states
content = content.replace(
    /const \[isLocked, setIsLocked\] = useState\(false\);/,
    `const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [isLocked, setIsLocked] = useState(false);`
);

// 2. Add functions
content = content.replace(
    /\/\/ Auth Actions/,
    `// Session Actions
    const selectSession = (sessionId) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setActiveSession(session);
            const salt = localStorage.getItem(\`\${sessionId}-tamga-salt\`);
            const validator = localStorage.getItem(\`\${sessionId}-tamga-validator\`);
            if (salt && validator) {
                setHasPassword(true);
                setIsLocked(true);
            } else {
                setHasPassword(false);
                setIsLocked(false);
            }
        }
    };

    const createSession = (name, photo) => {
        const newSession = { id: Date.now().toString(), name, photo };
        const updated = [...sessions, newSession];
        setSessions(updated);
        localStorage.setItem("tamga-sessions", JSON.stringify(updated));
        selectSession(newSession.id);
    };

    // Auth Actions`
);

// 3. Update useEffect
const newUseEffect = `    useEffect(() => {
        // Migration to Sessions
        const loadedSessionsStr = localStorage.getItem("tamga-sessions");
        let loadedSessions = [];
        
        if (loadedSessionsStr) {
            loadedSessions = JSON.parse(loadedSessionsStr);
        } else {
            const oldSalt = localStorage.getItem("tamga-salt");
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
                        localStorage.setItem(\`default-\${k}\`, val);
                        localStorage.removeItem(k);
                    }
                });
            }
        }
        
        setSessions(loadedSessions);
        // We don't auto-select a session, wait for user to select.
    }, []);`;

content = content.replace(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/, newUseEffect);

// Replace "tamga-salt" usage
content = content.replace(/localStorage\.setItem\("tamga-salt",/g, 'localStorage.setItem(`${activeSession.id}-tamga-salt`,');
content = content.replace(/localStorage\.setItem\("tamga-validator",/g, 'localStorage.setItem(`${activeSession.id}-tamga-validator`,');
content = content.replace(/localStorage\.getItem\("tamga-salt"\)/g, 'localStorage.getItem(`${activeSession.id}-tamga-salt`)');
content = content.replace(/localStorage\.getItem\("tamga-validator"\)/g, 'localStorage.getItem(`${activeSession.id}-tamga-validator`)');

// Update Context Provider Value
content = content.replace(
    /isLocked,/,
    `sessions,
            activeSession,
            selectSession,
            createSession,
            isLocked,`
);

// Update AuthContext initial state
content = content.replace(
    /isLocked: false,/,
    `sessions: [],
    activeSession: null,
    selectSession: () => {},
    createSession: () => {},
    isLocked: false,`
);

// Array keys
content = content.replace(/key: 'tamga-passwords'/g, "key: `${activeSession.id}-tamga-passwords`");
content = content.replace(/key: 'tamga-otp-uris'/g, "key: `${activeSession.id}-tamga-otp-uris`");
content = content.replace(/key: 'tamga-envs'/g, "key: `${activeSession.id}-tamga-envs`");
content = content.replace(/key: 'tamga-passkeys'/g, "key: `${activeSession.id}-tamga-passkeys`");
content = content.replace(/key: 'tamga-recovery-codes'/g, "key: `${activeSession.id}-tamga-recovery-codes`");

// toggleLink
content = content.replace(/case 'password': return 'tamga-passwords';/, "case 'password': return `${activeSession.id}-tamga-passwords`;");
content = content.replace(/case 'otp': return 'tamga-otp-uris';/, "case 'otp': return `${activeSession.id}-tamga-otp-uris`;");
content = content.replace(/case 'env': return 'tamga-envs';/, "case 'env': return `${activeSession.id}-tamga-envs`;");
content = content.replace(/case 'passkey': return 'tamga-passkeys';/, "case 'passkey': return `${activeSession.id}-tamga-passkeys`;");
content = content.replace(/case 'recovery': return 'tamga-recovery-codes';/, "case 'recovery': return `${activeSession.id}-tamga-recovery-codes`;");

// removeGlobalLink
content = content.replace(
    /const keys = \['tamga-passwords', 'tamga-otp-uris', 'tamga-envs', 'tamga-passkeys', 'tamga-recovery-codes'\];/,
    "const keys = [`${activeSession.id}-tamga-passwords`, `${activeSession.id}-tamga-otp-uris`, `${activeSession.id}-tamga-envs`, `${activeSession.id}-tamga-passkeys`, `${activeSession.id}-tamga-recovery-codes`];"
);

// exportData
content = content.replace(
    /const keysToExport = \["tamga-otp-uris", "tamga-passwords", "tamga-passkeys", "tamga-envs", "tamga-recovery-codes"\];/,
    "const keysToExport = [`${activeSession.id}-tamga-otp-uris`, `${activeSession.id}-tamga-passwords`, `${activeSession.id}-tamga-passkeys`, `${activeSession.id}-tamga-envs`, `${activeSession.id}-tamga-recovery-codes`];"
);

// emergencyWipe
content = content.replace(
    /const keysToExport = \["tamga-otp-uris", "tamga-passwords", "tamga-passkeys", "tamga-envs", "tamga-recovery-codes", "tamga-salt", "tamga-validator"\];/,
    "const keysToExport = [`${activeSession.id}-tamga-otp-uris`, `${activeSession.id}-tamga-passwords`, `${activeSession.id}-tamga-passkeys`, `${activeSession.id}-tamga-envs`, `${activeSession.id}-tamga-recovery-codes`, `${activeSession.id}-tamga-salt`, `${activeSession.id}-tamga-validator`];"
);

// importData conditionals
content = content.replace(/if \(key === "tamga-otp-uris"\) \{/g, 'if (key.includes("tamga-otp-uris")) {');
content = content.replace(/else if \(key === "tamga-passwords"\) \{/g, 'else if (key.includes("tamga-passwords")) {');
content = content.replace(/else if \(key === "tamga-envs"\) \{/g, 'else if (key.includes("tamga-envs")) {');
content = content.replace(/else if \(key === "tamga-passkeys"\) \{/g, 'else if (key.includes("tamga-passkeys")) {');
content = content.replace(/else if \(key === "tamga-recovery-codes"\) \{/g, 'else if (key.includes("tamga-recovery-codes")) {');

// removeMasterPassword
content = content.replace(
    /localStorage\.clear\(\); \/\/ Nuclear option for security reset/,
    `// Clear only active session data
        const keysToRemove = [\`\${activeSession.id}-tamga-otp-uris\`, \`\${activeSession.id}-tamga-passwords\`, \`\${activeSession.id}-tamga-passkeys\`, \`\${activeSession.id}-tamga-envs\`, \`\${activeSession.id}-tamga-recovery-codes\`, \`\${activeSession.id}-tamga-salt\`, \`\${activeSession.id}-tamga-validator\`];
        keysToRemove.forEach(k => localStorage.removeItem(k));`
);

fs.writeFileSync(authPath, content);

// Update SettingsContext.jsx
const settingsPath = path.join(__dirname, 'src', 'context', 'SettingsContext.jsx');
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

settingsContent = settingsContent.replace(
    /import \{ createContext, useContext, useEffect, useState \} from "react";/,
    `import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";`
);

settingsContent = settingsContent.replace(
    /export function SettingsProvider\(\{ children \}\) \{/,
    `export function SettingsProvider({ children }) {
  const { activeSession } = useAuth();
  const prefix = activeSession ? \`\${activeSession.id}-tamga\` : 'tamga';`
);

settingsContent = settingsContent.replace(/localStorage\.getItem\("tamga-/g, 'localStorage.getItem(`${prefix}-');
settingsContent = settingsContent.replace(/localStorage\.setItem\("tamga-/g, 'localStorage.setItem(`${prefix}-');

fs.writeFileSync(settingsPath, settingsContent);
console.log("Done");
