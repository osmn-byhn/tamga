import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Send, Lock } from 'lucide-react';

const TransferSessionDialog = ({ children, item, storeKey, onDelete }) => {
  const { sessions, activeSession, transferItemToSession } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [targetSessionId, setTargetSessionId] = useState("");
  const [targetPassword, setTargetPassword] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const availableSessions = sessions.filter(s => s.id !== activeSession?.id);

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!targetSessionId) {
      toast.error("Please select a target session");
      return;
    }

    setIsTransferring(true);
    
    // We assume the target session might require a password. 
    // If it doesn't, it will just gracefully ignore the empty password in AuthContext.
    const result = await transferItemToSession(item, targetSessionId, targetPassword, storeKey);
    
    setIsTransferring(false);

    if (result.success) {
      toast.success("Successfully transferred to the selected session!");
      setIsOpen(false);
      setTargetSessionId("");
      setTargetPassword("");
      if (onDelete) {
        onDelete(item.id);
      }
    } else {
      toast.error(result.error || "Transfer failed");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-purple-600" />
            Transfer to Another Session
          </DialogTitle>
        </DialogHeader>
        
        {availableSessions.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            No other sessions found. Create another session first.
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Target Session</Label>
              <Select value={targetSessionId} onValueChange={setTargetSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a session..." />
                </SelectTrigger>
                <SelectContent>
                  {availableSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex items-center gap-2">
                        {session.photo ? (
                          <img src={session.photo} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                            {session.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {session.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {targetSessionId && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                <Label className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Target Session Password
                </Label>
                <Input
                  type="password"
                  placeholder="Master password of the target session"
                  value={targetPassword}
                  onChange={(e) => setTargetPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Required only if the target session is protected by a password.
                </p>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!targetSessionId || isTransferring} className="bg-purple-600 hover:bg-purple-700 text-white">
                {isTransferring ? "Transferring..." : "Transfer Now"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransferSessionDialog;
