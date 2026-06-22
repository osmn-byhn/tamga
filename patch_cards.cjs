const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const cards = [
  { file: 'PasswordCard.jsx', storeKey: 'tamga-passwords' },
  { file: 'OtpCard.jsx', storeKey: 'tamga-otp-uris' },
  { file: 'PasskeyCard.jsx', storeKey: 'tamga-passkeys' },
  { file: 'EnvCard.jsx', storeKey: 'tamga-envs' },
  { file: 'RecoveryCodeCard.jsx', storeKey: 'tamga-recovery-codes' }
];

cards.forEach(card => {
  const p = path.join(srcDir, 'components', card.file);
  let code = fs.readFileSync(p, 'utf8');
  
  // Add import
  if (!code.includes('TransferSessionDialog')) {
      code = code.replace(
        "import { toast } from \"sonner\";",
        "import { toast } from \"sonner\";\nimport TransferSessionDialog from \"./TransferSessionDialog\";\nimport { Send } from \"lucide-react\";"
      );
  }

  // Add transfer button before delete button
  const transferButton = `
          {onDelete && (
            <TransferSessionDialog item={item} storeKey="${card.storeKey}" onDelete={onDelete}>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-purple-600/70 hover:text-purple-600 hover:bg-purple-600/10"
                title="Transfer to Session"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TransferSessionDialog>
          )}
          `;

  code = code.replace(
    /          \{onDelete && \(\n            <DeleteConfirmDialog/g,
    `${transferButton}\n          {onDelete && (\n            <DeleteConfirmDialog`
  );

  fs.writeFileSync(p, code);
});

// Now patch GroupCard.jsx
const groupCardPath = path.join(srcDir, 'components', 'GroupCard.jsx');
let groupCode = fs.readFileSync(groupCardPath, 'utf8');
if (!groupCode.includes('TransferSessionDialog')) {
    groupCode = groupCode.replace(
        "import { toast } from \"sonner\";",
        "import { toast } from \"sonner\";\nimport TransferSessionDialog from \"./TransferSessionDialog\";\nimport { Send } from \"lucide-react\";"
    );
    // Add storeKey to GroupCard props
    groupCode = groupCode.replace(
        "const GroupCard = ({ group, children, onDelete, onRename, onUngroup, dragHandleProps, isGroupingTarget }) => {",
        "const GroupCard = ({ group, children, onDelete, onRename, onUngroup, dragHandleProps, isGroupingTarget, storeKey }) => {"
    );

    const groupTransferBtn = `
          {onDelete && storeKey && (
            <TransferSessionDialog item={group} storeKey={storeKey} onDelete={onDelete}>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-purple-600/70 hover:text-purple-600 hover:bg-purple-600/10"
                title="Transfer Group to Session"
              >
                <Send className="h-4 w-4" />
              </Button>
            </TransferSessionDialog>
          )}
          `;

    groupCode = groupCode.replace(
        /          \{onDelete && \(\n            <DeleteConfirmDialog/g,
        `${groupTransferBtn}\n          {onDelete && (\n            <DeleteConfirmDialog`
    );
    fs.writeFileSync(groupCardPath, groupCode);
}

// Now patch pages to pass storeKey to GroupCard
const pages = [
  { file: 'Passwords.jsx', storeKey: 'tamga-passwords' },
  { file: 'Otps.jsx', storeKey: 'tamga-otp-uris' },
  { file: 'Env.jsx', storeKey: 'tamga-envs' },
  { file: 'Passkeys.jsx', storeKey: 'tamga-passkeys' },
  { file: 'Recovery.jsx', storeKey: 'tamga-recovery-codes' }
];

pages.forEach(page => {
  const p = path.join(srcDir, 'pages', page.file);
  if (fs.existsSync(p)) {
      let code = fs.readFileSync(p, 'utf8');
      if (code.includes('GroupCard') && !code.includes(`storeKey="${page.storeKey}"`)) {
          code = code.replace(
              /<GroupCard \n                              group=\{item\}/g,
              `<GroupCard \n                              group={item}\n                              storeKey="${page.storeKey}"`
          );
          // Just in case it's one line
          code = code.replace(
              /<GroupCard group=\{item\}/g,
              `<GroupCard group={item} storeKey="${page.storeKey}"`
          );
          fs.writeFileSync(p, code);
      }
  }
});

console.log("Cards and pages patched for transfer support");
