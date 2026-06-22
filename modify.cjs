const fs = require('fs');
const path = require('path');

// SettingsContext
const settingsPath = path.join(__dirname, 'src', 'context', 'SettingsContext.jsx');
let settingsContent = fs.readFileSync(settingsPath, 'utf8');

settingsContent = settingsContent.replace(
    'import { createContext, useContext, useEffect, useState } from "react";',
    'import { createContext, useContext, useEffect, useState } from "react";\nimport { useAuth } from "./AuthContext";'
);

settingsContent = settingsContent.replace(
    'export function SettingsProvider({ children }) {',
    `export function SettingsProvider({ children }) {
  const { activeSession } = useAuth();
  const prefix = activeSession ? \`\${activeSession.id}-tamga\` : 'tamga';`
);

settingsContent = settingsContent.replace(/"tamga-hide-sensitive"/g, '`${prefix}-hide-sensitive`');
settingsContent = settingsContent.replace(/"tamga-mask-style"/g, '`${prefix}-mask-style`');
settingsContent = settingsContent.replace(/"tamga-max-failed-attempts"/g, '`${prefix}-max-failed-attempts`');
settingsContent = settingsContent.replace(/"tamga-failed-action"/g, '`${prefix}-failed-action`');
settingsContent = settingsContent.replace(/"tamga-backup-path"/g, '`${prefix}-backup-path`');
settingsContent = settingsContent.replace(/"tamga-auto-lock-timeout"/g, '`${prefix}-auto-lock-timeout`');

fs.writeFileSync(settingsPath, settingsContent);

// AuthContext
const authPath = path.join(__dirname, 'src', 'context', 'AuthContext.jsx');
let authContent = fs.readFileSync(authPath, 'utf8');

authContent = authContent.replace(
    'isLocked: false,',
    `sessions: [],
    activeSession: null,
    selectSession: () => {},
    createSession: () => {},
    isLocked: false,`
);

authContent = authContent.replace(
    'const [isLocked, setIsLocked] = useState(false);',
    `const [sessions, setSessions] = useState([]);
    const [activeSession, setActiveSession] = useState(null);
    const [isLocked, setIsLocked] = useState(false);`
);

authContent = authContent.replace(
    '    // Auth Actions',
    `    // Session Actions
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
    }, []);`;

authContent = authContent.replace(/    useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/, newUseEffect);

// Replace generic values inside functions
const replaceInFunction = (funcName, replacements) => {
    // Basic string replacement works because we are replacing string literals
};

authContent = authContent.replace(/localStorage\.setItem\("tamga-salt",/g, 'localStorage.setItem(`${activeSession.id}-tamga-salt`,');
authContent = authContent.replace(/localStorage\.setItem\("tamga-validator",/g, 'localStorage.setItem(`${activeSession.id}-tamga-validator`,');
authContent = authContent.replace(/localStorage\.getItem\("tamga-salt"\)/g, 'localStorage.getItem(`${activeSession?.id}-tamga-salt`)');
authContent = authContent.replace(/localStorage\.getItem\("tamga-validator"\)/g, 'localStorage.getItem(`${activeSession?.id}-tamga-validator`)');

authContent = authContent.replace(/key: 'tamga-passwords'/g, 'key: `${activeSession.id}-tamga-passwords`');
authContent = authContent.replace(/key: 'tamga-otp-uris'/g, 'key: `${activeSession.id}-tamga-otp-uris`');
authContent = authContent.replace(/key: 'tamga-envs'/g, 'key: `${activeSession.id}-tamga-envs`');
authContent = authContent.replace(/key: 'tamga-passkeys'/g, 'key: `${activeSession.id}-tamga-passkeys`');
authContent = authContent.replace(/key: 'tamga-recovery-codes'/g, 'key: `${activeSession.id}-tamga-recovery-codes`');

authContent = authContent.replace(/case 'password': return 'tamga-passwords';/g, "case 'password': return `${activeSession.id}-tamga-passwords`;");
authContent = authContent.replace(/case 'otp': return 'tamga-otp-uris';/g, "case 'otp': return `${activeSession.id}-tamga-otp-uris`;");
authContent = authContent.replace(/case 'env': return 'tamga-envs';/g, "case 'env': return `${activeSession.id}-tamga-envs`;");
authContent = authContent.replace(/case 'passkey': return 'tamga-passkeys';/g, "case 'passkey': return `${activeSession.id}-tamga-passkeys`;");
authContent = authContent.replace(/case 'recovery': return 'tamga-recovery-codes';/g, "case 'recovery': return `${activeSession.id}-tamga-recovery-codes`;");

authContent = authContent.replace(
    `['tamga-passwords', 'tamga-otp-uris', 'tamga-envs', 'tamga-passkeys', 'tamga-recovery-codes']`,
    `[\`\${activeSession.id}-tamga-passwords\`, \`\${activeSession.id}-tamga-otp-uris\`, \`\${activeSession.id}-tamga-envs\`, \`\${activeSession.id}-tamga-passkeys\`, \`\${activeSession.id}-tamga-recovery-codes\`]`
);

authContent = authContent.replace(
    `["tamga-otp-uris", "tamga-passwords", "tamga-passkeys", "tamga-envs", "tamga-recovery-codes"]`,
    `[\`\${activeSession.id}-tamga-otp-uris\`, \`\${activeSession.id}-tamga-passwords\`, \`\${activeSession.id}-tamga-passkeys\`, \`\${activeSession.id}-tamga-envs\`, \`\${activeSession.id}-tamga-recovery-codes\`]`
);

authContent = authContent.replace(
    `["tamga-otp-uris", "tamga-passwords", "tamga-passkeys", "tamga-envs", "tamga-recovery-codes", "tamga-salt", "tamga-validator"]`,
    `[\`\${activeSession.id}-tamga-otp-uris\`, \`\${activeSession.id}-tamga-passwords\`, \`\${activeSession.id}-tamga-passkeys\`, \`\${activeSession.id}-tamga-envs\`, \`\${activeSession.id}-tamga-recovery-codes\`, \`\${activeSession.id}-tamga-salt\`, \`\${activeSession.id}-tamga-validator\`]`
);

authContent = authContent.replace(/if \(key === "tamga-otp-uris"\) \{/g, 'if (key.includes("tamga-otp-uris")) {');
authContent = authContent.replace(/else if \(key === "tamga-passwords"\) \{/g, 'else if (key.includes("tamga-passwords")) {');
authContent = authContent.replace(/else if \(key === "tamga-envs"\) \{/g, 'else if (key.includes("tamga-envs")) {');
authContent = authContent.replace(/else if \(key === "tamga-passkeys"\) \{/g, 'else if (key.includes("tamga-passkeys")) {');
authContent = authContent.replace(/else if \(key === "tamga-recovery-codes"\) \{/g, 'else if (key.includes("tamga-recovery-codes")) {');

authContent = authContent.replace(
    `localStorage.clear(); // Nuclear option for security reset`,
    `// Clear only active session data
        if(activeSession) {
            const keysToRemove = [\`\${activeSession.id}-tamga-otp-uris\`, \`\${activeSession.id}-tamga-passwords\`, \`\${activeSession.id}-tamga-passkeys\`, \`\${activeSession.id}-tamga-envs\`, \`\${activeSession.id}-tamga-recovery-codes\`, \`\${activeSession.id}-tamga-salt\`, \`\${activeSession.id}-tamga-validator\`];
            keysToRemove.forEach(k => localStorage.removeItem(k));
        }`
);

// Provider value export
authContent = authContent.replace(
    `        <AuthContext.Provider value={{
            isLocked,`,
    `        <AuthContext.Provider value={{
            sessions,
            activeSession,
            selectSession,
            createSession,
            isLocked,`
);

fs.writeFileSync(authPath, authContent);
console.log("Success");
