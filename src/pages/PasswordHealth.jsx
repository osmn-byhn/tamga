import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ShieldAlert, ShieldCheck, Shield, AlertTriangle, RefreshCw, KeyRound, Globe, User } from "lucide-react";
import { toast } from "sonner";

async function isPasswordLeaked(password) {
  if (!password) return { leaked: false, count: 0 };
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  const prefix = hashHex.slice(0, 5);
  const suffix = hashHex.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) throw new Error('API isteği başarısız oldu.');
    
    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) {
        return { leaked: true, count: parseInt(count, 10) };
      }
    }
  } catch (error) {
    console.error("Sızıntı kontrolü yapılırken hata oluştu:", error);
  }

  return { leaked: false, count: 0 };
}

function calculateStrength(password) {
  if (!password) return "Weak";
  let strength = 0;
  if (password.length >= 12) strength++;
  if (password.length >= 16) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return "Weak";
  if (strength <= 4) return "Medium";
  return "Strong";
}

export default function PasswordHealth() {
  const { getData } = useAuth();
  const [flatPasswords, setFlatPasswords] = useState([]);
  const [results, setResults] = useState({});
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCount, setScannedCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const loadPasswords = async () => {
      const data = await getData("tamga-passwords") || [];
      const extracted = [];
      
      const flatten = (items) => {
        items.forEach(item => {
          if (item.type === 'group' && item.items) {
            flatten(item.items);
          } else if (item.value) {
            extracted.push(item);
          }
        });
      };
      
      flatten(data);
      setFlatPasswords(extracted);
      
      // Initialize local results (Strength, Reused)
      const initialResults = {};
      const valueCounts = {};
      
      extracted.forEach(p => {
        valueCounts[p.value] = (valueCounts[p.value] || 0) + 1;
      });
      
      extracted.forEach(p => {
        initialResults[p.id] = {
          item: p,
          strength: calculateStrength(p.value),
          isReused: valueCounts[p.value] > 1,
          leakStatus: 'idle', // idle, loading, safe, leaked
          leakCount: 0
        };
      });
      
      setResults(initialResults);
    };
    
    loadPasswords();
  }, [getData]);

  // Auto-start scan when passwords are loaded
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (flatPasswords.length > 0 && !hasStarted && !isScanning) {
      startScan();
    }
  }, [flatPasswords, hasStarted]);

  const startScan = async () => {
    if (isScanning || flatPasswords.length === 0) return;
    
    setIsScanning(true);
    setHasStarted(true);
    setScannedCount(0);
    
    const leakCache = {};
    const newResults = { ...results };

    // Reset status to loading
    Object.keys(newResults).forEach(key => {
      newResults[key].leakStatus = 'loading';
    });
    setResults({ ...newResults });

    for (let i = 0; i < flatPasswords.length; i++) {
      const p = flatPasswords[i];
      let leakData;
      
      if (leakCache[p.value]) {
        leakData = leakCache[p.value];
        // Artificial small delay for UI smoothness if cached
        await new Promise(r => setTimeout(r, 100));
      } else {
        leakData = await isPasswordLeaked(p.value);
        leakCache[p.value] = leakData;
        // Wait a little bit to not hammer the API too hard
        await new Promise(r => setTimeout(r, 200));
      }

      setResults(prev => ({
        ...prev,
        [p.id]: {
          ...prev[p.id],
          leakStatus: leakData.leaked ? 'leaked' : 'safe',
          leakCount: leakData.count
        }
      }));
      
      setScannedCount(prev => prev + 1);
    }

    setIsScanning(false);
    toast.success("Security scan complete!");
  };

  const resultsList = Object.values(results);
  const totalCount = flatPasswords.length;
  const weakCount = resultsList.filter(r => r.strength === 'Weak').length;
  const reusedCount = resultsList.filter(r => r.isReused).length;
  const leakedCount = resultsList.filter(r => r.leakStatus === 'leaked').length;
  
  const progressPercent = totalCount === 0 ? 0 : Math.round((scannedCount / totalCount) * 100);

  return (
    <div className="min-h-screen p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="pb-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Password Health</h1>
            <p className="text-muted-foreground mt-1">Audit your vault for weak, reused, and compromised passwords.</p>
          </div>
          <Button 
            onClick={startScan} 
            disabled={isScanning || totalCount === 0}
            variant={isScanning ? "outline" : "default"}
            className={!isScanning ? "bg-purple-600 hover:bg-purple-700 text-white" : ""}
          >
            {isScanning ? (
              <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Scanning...</>
            ) : (
              <><ShieldAlert className="mr-2 h-4 w-4" /> Rescan Vault</>
            )}
          </Button>
        </header>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Passwords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Weak Passwords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${weakCount > 0 ? 'text-orange-500' : 'text-green-500'}`}>
                {weakCount}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reused Passwords</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${reusedCount > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                {reusedCount}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-l-4 border-l-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Compromised (Leaked)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${leakedCount > 0 ? 'text-destructive animate-pulse' : 'text-green-500'}`}>
                {leakedCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        {(isScanning || scannedCount > 0) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Security Scan Progress</span>
              <span>{scannedCount} / {totalCount}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Detailed List */}
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold tracking-tight">Detailed Report</h2>
          {resultsList.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No passwords found in your vault.</p>
          ) : (
            <div className="grid gap-3">
              {resultsList.sort((a, b) => {
                // Sort by priority: Leaked > Weak > Reused > Safe
                if (a.leakStatus === 'leaked' && b.leakStatus !== 'leaked') return -1;
                if (b.leakStatus === 'leaked' && a.leakStatus !== 'leaked') return 1;
                if (a.strength === 'Weak' && b.strength !== 'Weak') return -1;
                if (b.strength === 'Weak' && a.strength !== 'Weak') return 1;
                if (a.isReused && !b.isReused) return -1;
                if (b.isReused && !a.isReused) return 1;
                return 0;
              }).map(({ item, strength, isReused, leakStatus, leakCount }) => (
                <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-all gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-xl bg-muted text-muted-foreground">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {item.platform || "Unnamed Platform"}
                        </span>
                        {item.url && <Globe className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      {item.username && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{item.username}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                    {/* Strength Badge */}
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      strength === 'Weak' ? 'bg-orange-500/10 text-orange-500' :
                      strength === 'Medium' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                      'bg-green-500/10 text-green-500'
                    }`}>
                      {strength}
                    </span>

                    {/* Reused Badge */}
                    {isReused && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" /> Reused
                      </span>
                    )}

                    {/* Leak Status Badge */}
                    {leakStatus === 'loading' && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-500/10 text-blue-500 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Checking...
                      </span>
                    )}
                    {leakStatus === 'safe' && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-green-500/10 text-green-500 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Safe
                      </span>
                    )}
                    {leakStatus === 'leaked' && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-destructive/10 text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Pwned ({leakCount} times)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
