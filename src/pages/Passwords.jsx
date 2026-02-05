import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Copy, RefreshCw, Check, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
// Assuming useAuth is in AuthContext

export default function Passwords() {
  const { getData, updateData } = useAuth();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadPasswords = async () => {
      setLoading(true);
      const data = await getData("sphinx-passwords");
      if (data) {
        setPasswords(data);
      }
      setLoading(false);
    };
    loadPasswords();
  }, [getData]);

  const savePasswords = async (newPasswords) => {
    setPasswords(newPasswords);
    await updateData("sphinx-passwords", newPasswords);
  };

  const savePasswordToHistory = async (pwd) => {
    const newEntry = {
      id: Date.now(),
      value: pwd,
      createdAt: new Date().toISOString()
    };
    const updated = [newEntry, ...passwords];
    await savePasswords(updated);
    toast.success("Password saved to history");
  };

  const deletePassword = async (id) => {
    const updated = passwords.filter(p => p.id !== id);
    await savePasswords(updated);
    toast.success("Password removed");
  };

  // Strength calculation
  const getPasswordStrength = () => {
    if (!password) return { text: "", color: "" };
    let strength = 0;
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (includeUppercase && includeLowercase) strength++;
    if (includeNumbers) strength++;
    if (includeSymbols) strength++;

    if (strength <= 2) return { text: "Weak", color: "text-red-500" };
    if (strength <= 4) return { text: "Medium", color: "text-yellow-500" };
    return { text: "Strong", color: "text-green-500" };
  };

  const strength = getPasswordStrength();

  const generatePassword = () => {
    let charset = "";
    let newPassword = "";

    if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz";
    if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (includeNumbers) charset += "0123456789";
    if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?";

    if (charset === "") {
      // Fallback or just don't generate
      return;
    }

    for (let i = 0; i < length; i++) {
      newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    setPassword(newPassword);
    setCopied(false);
  };

  useEffect(() => {
    generatePassword();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const copyToClipboard = () => {
    if (password) {
      navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="pb-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-3xl font-extrabold tracking-tight">Password Generator</h1>
          <p className="text-muted-foreground mt-1">Create strong, secure passwords instantly.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Display & Controls */}
          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Generated Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <div className="bg-muted p-6 rounded-lg font-mono text-2xl text-center break-all select-all min-h-[5rem] flex items-center justify-center pr-24">
                    {password}
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => savePasswordToHistory(password)}
                      disabled={!password}
                      title="Save to History"
                    >
                      <Save className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={copyToClipboard}
                      title="Copy Password"
                    >
                      {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                    </Button>
                  </div>
                </div>

                {password && (
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm text-muted-foreground">Strength</span>
                    <span className={`text-sm font-bold ${strength.color}`}>{strength.text}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Length</span>
                    <span className="text-2xl font-bold">{length}</span>
                  </div>
                  <Slider
                    value={[length]}
                    onValueChange={(val) => setLength(val[0])}
                    min={6}
                    max={64}
                    step={1}
                    className="py-4"
                  />
                </div>

                <Button
                  size="lg"
                  className="w-full gap-2 text-lg h-12"
                  onClick={generatePassword}
                >
                  <RefreshCw className="h-5 w-5" />
                  Regenerate
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Settings */}
          <div className="space-y-6">
            <Card className="border-border bg-card h-full">
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { label: "Uppercase Letters (A-Z)", state: includeUppercase, setter: setIncludeUppercase },
                    { label: "Lowercase Letters (a-z)", state: includeLowercase, setter: setIncludeLowercase },
                    { label: "Numbers (0-9)", state: includeNumbers, setter: setIncludeNumbers },
                    { label: "Symbols (!@#$)", state: includeSymbols, setter: setIncludeSymbols },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/80 transition-colors cursor-pointer" onClick={() => item.setter(!item.state)}>
                      <label htmlFor={`opt-${idx}`} className="cursor-pointer font-medium flex-1">
                        {item.label}
                      </label>
                      <Checkbox
                        id={`opt-${idx}`}
                        checked={item.state}
                        onCheckedChange={item.setter}
                      />
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
                  <p>Tip: Use a mix of all character types for maximum security.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* History Section */}
        <div className="grid grid-cols-1 gap-8 mt-8">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Password History</CardTitle>
            </CardHeader>
            <CardContent>
              {passwords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No passwords saved yet.</p>
              ) : (
                <div className="space-y-4">
                  {passwords.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30">
                      <div className="font-mono break-all mr-4">{item.value}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            navigator.clipboard.writeText(item.value);
                            toast.success("Copied to clipboard");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-red-500"
                          onClick={() => deletePassword(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
