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
import { Moon, Sun, Monitor, Lock, Unlock, Shield, Download, Upload, Database } from "lucide-react";

const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { hasPassword, setMasterPassword, removeMasterPassword, unlock, exportData, importData } = useAuth();

  // Password Management State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState(""); // For changing/removing

  const [mode, setMode] = useState("set"); // 'set', 'change'

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

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target.result;
      const success = await importData(content);
      if (success) {
        // Optional: reload or refresh state? Context updates should trigger re-renders elsewhere
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Reset input
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
                  Note: Backup files are encrypted with your Master Password. You can only restore them if you have the same Master Password set.
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" onClick={handleExport} disabled={!hasPassword} className="h-20 flex flex-col items-center justify-center gap-2">
                  <Download className="h-6 w-6" />
                  <span>Export Backup</span>
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    id="import-file"
                    className="hidden"
                    accept=".enc,.json"
                    onChange={handleImport}
                    disabled={!hasPassword}
                  />
                  <Button variant="outline" disabled={!hasPassword} className="h-20 w-full flex flex-col items-center justify-center gap-2" asChild>
                    <label htmlFor="import-file" className="cursor-pointer">
                      <Upload className="h-6 w-6" />
                      <span>Import Backup</span>
                    </label>
                  </Button>
                </div>
              </div>
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
      </div>

    </div>
  );
};

export default Settings;
