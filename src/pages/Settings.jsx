import React, { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Moon, Sun, Monitor, Lock, Unlock, Shield, Download, Upload, Database, KeyRound, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { hasPassword, setMasterPassword, removeMasterPassword, unlock, exportData, importData } = useAuth();

  // Password Management State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""); // For changing/removing

  const [mode, setMode] = useState("set"); // 'set', 'change'

  // Import State
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importPassword, setImportPassword] = useState("");
  const [manualSalt, setManualSalt] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLegacyBackup, setIsLegacyBackup] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      toast.error("Password must be at least 4 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    await setMasterPassword(newPassword);
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Master password set successfully");
  };

  const handleRemovePassword = async (e) => {
    e.preventDefault();
    const isValid = await unlock(currentPassword); // Verify current password first
    if (!isValid) {
      toast.error("Incorrect current password");
      return;
    }

    await removeMasterPassword();
    setCurrentPassword("");
    toast.success("Master password removed");
  };

  const handleExport = async () => {
    const encryptedBlob = await exportData();
    if (!encryptedBlob) return;

    const blob = new Blob([encryptedBlob], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tamga-backup-${new Date().toISOString().slice(0, 10)}.enc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Backup downloaded successfully");
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Detect legacy backup proactively
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const legacy = !json.salt;
        setIsLegacyBackup(legacy);
        if (legacy) setShowAdvanced(true);
      } catch (err) {
        setIsLegacyBackup(false);
      }
    };
    reader.readAsText(file);

    setSelectedFile(file);
    setShowImportDialog(true);
    e.target.value = null; // Reset input
  };

  const confirmImport = async () => {
    if (!selectedFile || isImporting) return;

    setIsImporting(true);
    const toastId = toast.loading(!hasPassword ? "Restoring vault..." : "Importing data...");

    try {
      const content = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(new Error("File read failed"));
        reader.readAsText(selectedFile);
      });

      let parsedSalt = null;
      if (manualSalt.trim()) {
        try {
          // If user pastes "[1, 2, 3]", parse it. If just "1, 2, 3", also try to handle.
          const cleaned = manualSalt.trim().startsWith('[') ? manualSalt.trim() : `[${manualSalt.trim()}]`;
          parsedSalt = JSON.parse(cleaned);
          if (!Array.isArray(parsedSalt)) throw new Error("Salt must be an array");
        } catch (e) {
          toast.error("Invalid salt format. Should be like: [12, 34, ...]");
          setIsImporting(false);
          toast.dismiss(toastId);
          return;
        }
      }

      const success = await importData(content, importPassword, parsedSalt);
      if (success) {
        setShowImportDialog(false);
        setImportPassword("");
        setManualSalt("");
        setShowAdvanced(false);
        setIsLegacyBackup(false);
        setSelectedFile(null);
        toast.dismiss(toastId);
      } else {
        toast.dismiss(toastId);
      }
    } catch (e) {
      console.error("Import process error", e);
      toast.error("Process failed: " + e.message, { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="min-h-screen p-6 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="pb-6 border-b border-border">
          <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage appearance and security preferences.</p>
        </header>

        {/* Appearance Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Monitor className="h-5 w-5" /> Appearance
          </h2>
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
              <CardDescription>
                Select the color theme for the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={theme} onValueChange={setTheme} className="w-full max-w-md">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="light" className="flex items-center gap-2">
                    <Sun className="h-4 w-4" /> Light
                  </TabsTrigger>
                  <TabsTrigger value="dark" className="flex items-center gap-2">
                    <Moon className="h-4 w-4" /> Dark
                  </TabsTrigger>
                  <TabsTrigger value="system" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> System
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </section>



        {/* Data Management Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" /> Data Management
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Export & Import</CardTitle>
              <CardDescription>
                Backup your encrypted data or restore from a backup file.
                <br />
                <span className="text-amber-500 font-medium text-xs">
                  Note: Backup files (.enc) are encrypted with your Master Password. You can only restore them if you have the same Master Password set.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasPassword ? (
                <div className="p-6 border-2 border-dashed border-purple-200 dark:border-purple-900/50 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-3 bg-white dark:bg-gray-950 rounded-full shadow-sm">
                      <Database className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Existing User?</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      If you have a backup file from another device, you can restore your entire vault here.
                    </p>
                  </div>
                  <Button
                    onClick={() => document.getElementById('import-file').click()}
                    className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 px-8"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Restore Vault from Backup
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={handleExport} disabled={!hasPassword} className="h-20 flex flex-col items-center justify-center gap-2">
                    <Download className="h-6 w-6" />
                    <span>Export Backup</span>
                  </Button>

                  <div className="relative">
                    <input
                      type="file"
                      id="import-file-secondary"
                      className="hidden"
                      accept=".enc"
                      onChange={handleImport}
                    />
                    <Button
                      variant="outline"
                      className="h-20 w-full flex flex-col items-center justify-center gap-2"
                      onClick={() => document.getElementById('import-file-secondary').click()}
                    >
                      <Upload className="h-6 w-6" />
                      <span>Import Backup</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Common hidden input for both trigger paths */}
              <input
                type="file"
                id="import-file"
                className="hidden"
                accept=".enc"
                onChange={handleImport}
              />
            </CardContent>
          </Card>
        </section>

        {/* Security Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" /> Security
          </h2>
          <Card className="border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <CardHeader>
              <CardTitle>App Lock</CardTitle>
              <CardDescription>
                Secure the application with a master password required on startup.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!hasPassword ? (
                <form onSubmit={handleSetPassword} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="new-pass">New Master Password</Label>
                    <Input
                      id="new-pass"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-pass">Confirm Password</Label>
                    <Input
                      id="confirm-pass"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                    <Lock className="h-4 w-4 mr-2" />
                    Set Master Password
                  </Button>

                  <div className="pt-2 text-center">
                    <label
                      htmlFor="import-file"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                    >
                      <Database className="h-3.5 w-3.5" />
                      Already a user? Restore from backup
                    </label>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 max-w-md">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md flex items-center gap-3 text-green-600 dark:text-green-400">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">App Lock is Active</span>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                    <h4 className="text-sm font-medium mb-3 text-destructive">Danger Zone</h4>
                    <form onSubmit={handleRemovePassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-pass">Enter Current Password to Remove</Label>
                        <Input
                          id="current-pass"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Current Password"
                        />
                      </div>
                      <Button variant="destructive" type="submit" className="w-full">
                        <Unlock className="h-4 w-4 mr-2" />
                        Remove Master Password
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Import/Restore Password Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-6 w-6 text-purple-600" />
                {!hasPassword ? "Recover Your Vault" : (isLegacyBackup ? "Legacy Data Rescue" : "Portable Data Merge")}
              </DialogTitle>
              <DialogDescription className="pt-2">
                {!hasPassword
                  ? "Enter the Master Password of this backup to initialize your new vault."
                  : (isLegacyBackup
                    ? "Rescue data from an old device. Manual salt is required."
                    : "Merging data from another device. Enter that device's Master Password.")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {isLegacyBackup && !hasPassword && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/50 rounded-lg space-y-2 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                    <Shield className="h-4 w-4" />
                    Legacy (Offline) Backup Detected
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This backup is from an old version. To open it on this device, you <strong>must</strong> provide the manual "salt" from your old device.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="import-password">
                  {!hasPassword ? "Current Backup's Password" : "Backup Password (optional)"}
                </Label>
                <Input
                  id="import-password"
                  type="password"
                  value={importPassword}
                  onChange={(e) => setImportPassword(e.target.value)}
                  placeholder="Enter master password used for this backup"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && confirmImport()}
                />
              </div>

              {!hasPassword && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-xs p-0 h-auto ${isLegacyBackup ? 'text-amber-600 font-bold' : 'text-muted-foreground'}`}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                  >
                    {showAdvanced ? "Hide Advanced Options" : "Advanced: Manual Salt (Required for legacy backups)"}
                  </Button>

                  {showAdvanced && (
                    <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1">
                      <Label htmlFor="manual-salt" className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        Manual Encryption Salt
                      </Label>
                      <Input
                        id="manual-salt"
                        value={manualSalt}
                        onChange={(e) => setManualSalt(e.target.value)}
                        placeholder="e.g. [12, 45, 122, ...]"
                        className="font-mono text-xs border-amber-500/50 focus-visible:ring-amber-500"
                      />
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        Paste the 16-byte array from your old device's <code className="bg-muted px-1 rounded">tamga-salt</code> localStorage item.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setShowImportDialog(false)} disabled={isImporting}>Cancel</Button>
              <Button
                onClick={confirmImport}
                disabled={isImporting || (!hasPassword && !importPassword)}
                className="bg-purple-600 hover:bg-purple-700 text-white min-w-[120px]"
              >
                {isImporting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  !hasPassword ? "Initialize & Restore" : "Decrypt & Merge Data"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

    </div>
  );
};

export default Settings;
