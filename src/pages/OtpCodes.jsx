import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import OtpCard from "@/components/OtpCard";
import AddOtpDialog from "@/components/AddOtpDialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";

const OtpCodes = () => {
  const { getData, updateData } = useAuth();
  const [otpUris, setOtpUris] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOtps = async () => {
      setLoading(true);
      const data = await getData("otp-auth-uris");
      if (data) {
        setOtpUris(data);
      }
      setLoading(false);
    };
    loadOtps();
  }, [getData]);

  const saveOtps = async (uris) => {
    setOtpUris(uris);
    await updateData("otp-auth-uris", uris);
  };

  const handleAddOtp = async (uri) => {
    if (otpUris.includes(uri)) {
      toast.error("This OTP account already exists");
      return;
    }
    const newUris = [...otpUris, uri];
    await saveOtps(newUris);
  };

  const handleDeleteOtp = async (uriToDelete) => {
    const newUris = otpUris.filter(uri => uri !== uriToDelete);
    await saveOtps(newUris);
    toast.success("OTP removed");
  };

  return (
    <div className="min-h-screen  p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Authenticator</h1>
            <p className="text-muted-foreground mt-1">Manage your 2FA codes securely.</p>
          </div>
          <AddOtpDialog onAdd={handleAddOtp}>
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all">
              <Plus className="h-5 w-5" />
              Add Account
            </Button>
          </AddOtpDialog>
        </header>

        {otpUris.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <Plus className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No accounts yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Add your first Two-Factor Authentication account to get started.
            </p>
            <AddOtpDialog onAdd={handleAddOtp}>
              <Button variant="secondary">Add your first account</Button>
            </AddOtpDialog>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otpUris.map((uri, index) => (
              <OtpCard key={index} otpUri={uri} onDelete={handleDeleteOtp} />
            ))}
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
};

export default OtpCodes;
