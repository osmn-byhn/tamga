import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Terminal, Code2 } from "lucide-react";
import EnvCard from "@/components/EnvCard";
import AddEnvDialog from "@/components/AddEnvDialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";

const Envs = () => {
  const { getData, updateData } = useAuth();
  const [envItems, setEnvItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEnvs = async () => {
      setLoading(true);
      const data = await getData("sphinx-envs");
      if (data) {
        setEnvItems(data);
      }
      setLoading(false);
    };
    loadEnvs();
  }, [getData]);

  const saveEnvs = async (newItems) => {
    setEnvItems(newItems);
    await updateData("sphinx-envs", newItems);
  };

  const handleAddEnv = async ({ projectName, content }) => {
    const newItem = {
      id: Date.now(),
      projectName,
      content,
      createdAt: new Date().toISOString()
    };
    const updated = [newItem, ...envItems];
    await saveEnvs(updated);
    toast.success("Env file added successfully");
  };

  const handleDeleteEnv = async (id) => {
    const updated = envItems.filter(item => item.id !== id);
    await saveEnvs(updated);
    toast.success("Env file removed");
  };

  return (
    <div className="min-h-screen p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Terminal className="h-8 w-8 text-green-500" />
              Environment Variables
            </h1>
            <p className="text-muted-foreground mt-1">Manage project configurations and .env files.</p>
          </div>
          <AddEnvDialog onAdd={handleAddEnv}>
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-5 w-5" />
              Add Env File
            </Button>
          </AddEnvDialog>
        </header>

        {envItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Code2 className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No configs found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Store your local .env configurations for easy access.
            </p>
            <AddEnvDialog onAdd={handleAddEnv}>
              <Button variant="outline" className="border-gray-700 cursor-pointer text-black dark:border-gray-300 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800">Add project config</Button>
            </AddEnvDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {envItems.map((item) => (
              <EnvCard key={item.id} envItem={item} onDelete={handleDeleteEnv} />
            ))}
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default Envs;
