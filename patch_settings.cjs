const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'Settings.jsx');
let code = fs.readFileSync(targetPath, 'utf8');

// 1. Add states for Password Prompt
const statesToAdd = `  const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
  const [promptPassword, setPromptPassword] = useState("");
  const [pendingSettingCallback, setPendingSettingCallback] = useState(null);
  const [localAutoLockTimeout, setLocalAutoLockTimeout] = useState(autoLockTimeout);

  React.useEffect(() => {
    setLocalAutoLockTimeout(autoLockTimeout);
  }, [autoLockTimeout]);

  const requirePasswordForSetting = (callback) => {
    if (!hasPassword) {
      callback();
      return;
    }
    setPendingSettingCallback(() => callback);
    setPasswordPromptOpen(true);
    setPromptPassword("");
  };

  const handleConfirmSetting = async (e) => {
    if (e) e.preventDefault();
    if (!promptPassword) return;
    const isValid = await unlock(promptPassword);
    if (!isValid) {
      toast.error("Incorrect master password");
      return;
    }
    setPasswordPromptOpen(false);
    if (pendingSettingCallback) {
      pendingSettingCallback();
      setPendingSettingCallback(null);
    }
    toast.success("Setting updated successfully");
  };

  const handleCancelSetting = () => {
    setPasswordPromptOpen(false);
    setPendingSettingCallback(null);
    setLocalAutoLockTimeout(autoLockTimeout);
  };
`;

code = code.replace(
  'const [showAboutDialog, setShowAboutDialog] = useState(false);',
  `const [showAboutDialog, setShowAboutDialog] = useState(false);\n\n${statesToAdd}`
);

// 2. Replace settings setters
code = code.replace(
  /onClick=\{\(\) => setHideSensitiveData\(!hideSensitiveData\)\}/g,
  `onClick={() => requirePasswordForSetting(() => setHideSensitiveData(!hideSensitiveData))}`
);

code = code.replace(
  /onValueChange=\{setMaskStyle\}/g,
  `onValueChange={(val) => requirePasswordForSetting(() => setMaskStyle(val))}`
);

code = code.replace(
  /onClick=\{\(\) => setAutoLockTimeout\(autoLockTimeout > 0 \? 0 : 5\)\}/g,
  `onClick={() => requirePasswordForSetting(() => setAutoLockTimeout(autoLockTimeout > 0 ? 0 : 5))}`
);

code = code.replace(
  /value=\{\[autoLockTimeout\]\}/g,
  `value={[localAutoLockTimeout]}`
);

code = code.replace(
  /onValueChange=\{\(vals\) => setAutoLockTimeout\(vals\[0\]\)\}/g,
  `onValueChange={(vals) => setLocalAutoLockTimeout(vals[0])}\n                      onValueCommit={(vals) => requirePasswordForSetting(() => setAutoLockTimeout(vals[0]))}`
);

code = code.replace(
  /onChange=\{\(e\) => setMaxFailedAttempts\(parseInt\(e\.target\.value, 10\)\)\}/g,
  `onChange={(e) => { const v = parseInt(e.target.value, 10); requirePasswordForSetting(() => setMaxFailedAttempts(v)); }}`
);

code = code.replace(
  /onChange=\{\(e\) => setFailedAction\(e\.target\.value\)\}/g,
  `onChange={(e) => { const v = e.target.value; requirePasswordForSetting(() => setFailedAction(v)); }}`
);

code = code.replace(
  /setBackupPath\(result\.path\);/g,
  `requirePasswordForSetting(() => setBackupPath(result.path));`
);

// 3. Add Password Dialog Component before the final closing div
const dialogToAdd = `
        {/* Settings Password Prompt Dialog */}
        <Dialog open={passwordPromptOpen} onOpenChange={(open) => !open && handleCancelSetting()}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-600" />
                Authentication Required
              </DialogTitle>
              <DialogDescription>
                Please enter your master password to change this setting.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleConfirmSetting} className="space-y-4 py-2">
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Master Password"
                  value={promptPassword}
                  onChange={(e) => setPromptPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleCancelSetting}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                  Confirm
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
`;

code = code.replace(
  /      <\/div>\n\n    <\/div>\n  \);\n\};\n\nexport default Settings;/g,
  `      ${dialogToAdd}</div>\n\n    </div>\n  );\n};\n\nexport default Settings;`
);

fs.writeFileSync(targetPath, code);
console.log("Settings patched");
