import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck } from "lucide-react";
import PasskeyCard from "@/components/PasskeyCard";
import AddPasskeyDialog from "@/components/AddPasskeyDialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const Passkeys = () => {
  const { getData, updateData } = useAuth();
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPasskeys = async () => {
      setLoading(true);
      const data = await getData("sphinx-passkeys");
      if (data) {
        setPasskeys(data);
      }
      setLoading(false);
    };
    loadPasskeys();
  }, [getData]);

  const savePasskeys = async (newPasskeys) => {
    setPasskeys(newPasskeys);
    await updateData("sphinx-passkeys", newPasskeys);
  };

  const handleAddPasskey = async (label, secret) => {
    const newPasskey = {
      id: Date.now(),
      label,
      secret,
      createdAt: new Date().toISOString()
    };
    const updated = [newPasskey, ...passkeys];
    await savePasskeys(updated);
    toast.success("Passkey added successfully");
  };

  const handleDeletePasskey = async (id) => {
    const updated = passkeys.filter(pk => pk.id !== id);
    await savePasskeys(updated);
    toast.success("Passkey removed");
  };

  return (
    <div className="min-h-screen p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-purple-500" />
              Passkeys & Backup Codes
            </h1>
            <p className="text-muted-foreground mt-1">Securely store your recovery codes and text secrets.</p>
          </div>
          <AddPasskeyDialog onAdd={handleAdd}>
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all bg-purple-600 hover:bg-purple-700">
              <Plus className="h-5 w-5" />
              Add New Secret
            </Button>
          </AddPasskeyDialog>
        </header>

        {passkeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Key className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No secrets stored</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Keep your backup codes and recovery keys safe here.
            </p>
            <AddPasskeyDialog onAdd={handleAdd}>
              <Button variant="outline" className="border-gray-700 text-black hover:bg-gray-200">Store your first secret</Button>
            </AddPasskeyDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {passkeys.map((item) => (
              <PasskeyCard key={item.id} passkey={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default Passkeys;
