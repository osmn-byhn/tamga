import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Copy, RefreshCw, Check, Save, Trash2, Globe, User, Pencil, X, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { useSettings } from "@/context/SettingsContext";
import EditPasswordDialog from "@/components/EditPasswordDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";
import { GripVertical } from "lucide-react";
import GroupCard from "@/components/GroupCard";
import RenameGroupDialog from "@/components/RenameGroupDialog";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
// Assuming useAuth is in AuthContext

export default function Passwords() {
  const { getData, updateData } = useAuth();
  const { hideSensitiveData } = useSettings();
  const [passwords, setPasswords] = useState([]);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);

  const [password, setPassword] = useState("");
  const [platform, setPlatform] = useState("");
  const [username, setUsername] = useState("");
  const [copied, setCopied] = useState(false);

  // Visibility state
  const [visibleIds, setVisibleIds] = useState(new Set());
  const [showMainPassword, setShowMainPassword] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [combineTargetId, setCombineTargetId] = useState(null);
  const [renameGroupData, setRenameGroupData] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const toggleVisibility = (id) => {
    const newVisibleIds = new Set(visibleIds);
    if (newVisibleIds.has(id)) {
      newVisibleIds.delete(id);
    } else {
      newVisibleIds.add(id);
    }
    setVisibleIds(newVisibleIds);
  };

  useEffect(() => {
    const loadPasswords = async () => {
      setLoading(true);
      const data = await getData("tamga-passwords");
      if (data) {
        setPasswords(data);
      }
      setLoading(false);
    };
    loadPasswords();
  }, [getData]);

  const savePasswords = async (newPasswords) => {
    setPasswords(newPasswords);
    await updateData("tamga-passwords", newPasswords);
  };

  const savePasswordToHistory = async (pwd) => {
    const newEntry = {
      id: Date.now(),
      value: pwd,
      platform: platform.trim(),
      username: username.trim(),
      createdAt: new Date().toISOString(),
      links: []
    };
    const updated = [newEntry, ...passwords];
    await savePasswords(updated);
    setPlatform("");
    setUsername("");
    toast.success("Password saved to history");
  };

  const deletePassword = async (id) => {
    const updated = passwords.filter(p => p.id !== id);
    await savePasswords(updated);
    toast.success("Password removed");
  };

  const updatePassword = async (id, updatedFields) => {
    const oldItem = passwords.find(i => String(i.id) === String(id));
    const oldLinks = oldItem?.links || [];
    
    // Determine new values
    const newPlatform = (updatedFields?.platform || "").trim();
    const newUsername = (updatedFields?.username || "").trim();
    const newValue = (updatedFields?.value || "").trim();
    const newLinks = updatedFields?.links || oldLinks;

    if (!newValue) {
      toast.error("Password cannot be empty");
      return;
    }

    // 1. Update the item itself
    const updated = passwords.map(p =>
      p.id === id
        ? { ...p, platform: newPlatform, username: newUsername, value: newValue, links: newLinks }
        : p
    );
    await savePasswords(updated);

    // 2. Handle Bi-directional links
    // Added links
    const added = newLinks.filter(nl => !oldLinks.some(ol => ol.type === nl.type && String(ol.id) === String(nl.id)));
    for (const link of added) {
      const sKey = link.type === 'password' ? 'tamga-passwords' : 
                   link.type === 'otp' ? 'tamga-otp-uris' :
                   link.type === 'env' ? 'tamga-envs' :
                   'tamga-passkeys';
      const items = await getData(sKey);
      const updatedItems = items.map(i => {
        if (String(i.id) === String(link.id)) {
          const links = i.links || [];
          if (!links.some(l => l.type === 'password' && String(l.id) === String(id))) {
            return { ...i, links: [...links, { type: 'password', id }] };
          }
        }
        return i;
      });
      await updateData(sKey, updatedItems);
    }

    // Removed links
    const removed = oldLinks.filter(ol => !newLinks.some(nl => nl.type === ol.type && String(nl.id) === String(ol.id)));
    for (const link of removed) {
      const sKey = link.type === 'password' ? 'tamga-passwords' : 
                   link.type === 'otp' ? 'tamga-otp-uris' :
                   link.type === 'env' ? 'tamga-envs' :
                   'tamga-passkeys';
      const items = await getData(sKey);
      const updatedItems = items.map(i => {
        if (String(i.id) === String(link.id)) {
          return { ...i, links: (i.links || []).filter(l => !(l.type === 'password' && String(l.id) === String(id))) };
        }
        return i;
      });
      await updateData(sKey, updatedItems);
    }

    toast.success("Password updated");
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over, collisions } = event;
    if (!over || active.id === over.id) {
      setCombineTargetId(null);
      return;
    }

    const isCombineReady = collisions && collisions.length > 0 && collisions[0].data?.value > 0.5;
    if (isCombineReady) {
      setCombineTargetId(over.id);
    } else {
      setCombineTargetId(null);
      setPasswords((items) => {
        const oldIndex = items.findIndex((i) => String(i.id) === String(active.id));
        const newIndex = items.findIndex((i) => String(i.id) === String(over.id));

        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over, collisions } = event;
    setActiveId(null);
    setCombineTargetId(null);

    if (over && active.id !== over.id) {
       const isCombine = collisions && collisions.length > 0 && collisions[0].data?.value > 0.5; 
       
       if (isCombine) {
         setPasswords((items) => {
           let overItem = items.find(i => String(i.id) === String(active.id)); // Wait, this variable name is confusing, let's fix
           
           // Correctly find the over item and its parent if any
           let foundOver = items.find(i => String(i.id) === String(over.id));
           let parentGroup = null;

           if (!foundOver) {
             for (const g of items) {
               if (g.type === 'group' && g.items) {
                 const nested = g.items.find(ni => String(ni.id) === String(over.id));
                 if (nested) {
                   foundOver = nested;
                   parentGroup = g;
                   break;
                 }
               }
             }
           }
           
           const activeItem = items.find(i => String(i.id) === String(active.id));
           if (!activeItem || !foundOver) return items;

           let updated;
           if (parentGroup) {
             updated = items.filter(i => i.id !== active.id).map(g => {
               if (g.id === parentGroup.id) {
                 return { ...g, items: [...(g.items || []), activeItem] };
               }
               return g;
             });
           } else if (foundOver.type === 'group') {
             updated = items.filter(i => i.id !== active.id).map(i => {
               if (i.id === foundOver.id) {
                 return { ...i, items: [...(i.items || []), activeItem] };
               }
               return i;
             });
           } else {
             const newGroupId = `group-${Date.now()}`;
             const newGroup = {
               id: newGroupId,
               type: 'group',
               name: "New Group",
               items: [foundOver, activeItem]
             };
             updated = items.filter(i => i.id !== active.id && i.id !== foundOver.id);
             updated.splice(items.findIndex(i => i.id === foundOver.id), 0, newGroup);
             setRenameGroupData({ id: newGroupId, name: "New Group" });
           }
           savePasswords(updated);
           return updated;
         });
       } else {
         savePasswords(passwords);
       }
    }
  };

  const onRenameGroup = (id, newName) => {
    const updated = passwords.map(i => {
      if (i.id === id) return { ...i, name: newName };
      return i;
    });
    savePasswords(updated);
  };

  const onDeleteGroup = (id) => {
    const updated = passwords.filter(i => i.id !== id);
    savePasswords(updated);
    toast.success("Group and its contents removed");
  };

  const onUngroup = (id) => {
    const group = passwords.find(i => i.id === id);
    if (!group) return;
    const contents = group.items || [];
    const updated = passwords.filter(i => i.id !== id);
    updated.push(...contents);
    savePasswords(updated);
    toast.success("Items extracted from group");
  };

  const handleUpdateNestedPassword = async (groupId, itemId, updatedData) => {
    const updated = passwords.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.map(item => item.id === itemId ? { ...item, ...updatedData } : item)
            };
        }
        return g;
    });
    savePasswords(updated);
  };

  const handleDeleteNestedPassword = async (groupId, itemId) => {
    const updated = passwords.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.filter(item => item.id !== itemId)
            };
        }
        return g;
    });
    savePasswords(updated);
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
                  <Input
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setCopied(false);
                    }}
                    type={(!showMainPassword && hideSensitiveData) ? "password" : "text"}
                    className={cn(
                      "bg-muted h-20 rounded-lg font-mono text-2xl text-center break-all pr-32 border-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-300",
                      (!showMainPassword && hideSensitiveData) ? "blur-md" : "blur-0"
                    )}
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground h-12 w-12"
                      onClick={() => setShowMainPassword(!showMainPassword)}
                      title={showMainPassword ? "Hide" : "Show"}
                    >
                      {showMainPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground h-12 w-12"
                      onClick={() => savePasswordToHistory(password)}
                      disabled={!password}
                      title="Save to History"
                    >
                      <Save size={28} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground h-12 w-12"
                      onClick={copyToClipboard}
                      title="Copy Password"
                    >
                      {copied ? <Check size={28} className="text-green-500" /> : <Copy size={28} />}
                    </Button>
                  </div>
                </div>

                {password && (
                  <>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="platform" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Platform</Label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="platform"
                            placeholder="e.g. Google"
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="username" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Username</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            id="username"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-2 pt-2">
                      <span className="text-sm text-muted-foreground">Strength</span>
                      <span className={`text-sm font-bold ${strength.color}`}>{strength.text}</span>
                    </div>
                  </>
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
        </div >

        {/* History Section */}
        < div className="grid grid-cols-1 gap-8 mt-8" >
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Password History</CardTitle>
            </CardHeader>
            <CardContent>
              {passwords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No passwords saved yet.</p>
              ) : (
                <div className="space-y-4">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={passwords.map((i) => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {passwords.map((item) => (
                        <SortableItem key={item.id} id={item.id}>
                          {item.type === 'group' ? (
                            <GroupCard 
                              group={item} 
                              onDelete={onDeleteGroup}
                              onRename={(id, name) => setRenameGroupData({ id, name })}
                              onUngroup={onUngroup}
                              isGroupingTarget={combineTargetId === item.id}
                            >
                              <div className="space-y-4">
                                {(item.items || []).map(nestedItem => (
                                  <PasswordHistoryItem 
                                    key={nestedItem.id}
                                    item={nestedItem}
                                    visibleIds={visibleIds}
                                    toggleVisibility={toggleVisibility}
                                    updatePassword={(id, data) => handleUpdateNestedPassword(item.id, id, data)}
                                    deletePassword={(id) => handleDeleteNestedPassword(item.id, id)}
                                    hideSensitiveData={hideSensitiveData}
                                    isGroupingTarget={combineTargetId === nestedItem.id}
                                  />
                                ))}
                              </div>
                            </GroupCard>
                          ) : (
                            <PasswordHistoryItem 
                              item={item}
                              visibleIds={visibleIds}
                              toggleVisibility={toggleVisibility}
                              updatePassword={updatePassword}
                              deletePassword={deletePassword}
                              hideSensitiveData={hideSensitiveData}
                              isGroupingTarget={combineTargetId === item.id}
                            />
                          )}
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </CardContent>
          </Card>
        </div >
      </div >
      
      {renameGroupData && (
        <RenameGroupDialog 
          isOpen={!!renameGroupData}
          onClose={() => setRenameGroupData(null)}
          initialName={renameGroupData.name}
          onConfirm={(newName) => onRenameGroup(renameGroupData.id, newName)}
        />
      )}
    </div >
  );
}

function PasswordHistoryItem({ item, visibleIds, toggleVisibility, updatePassword, deletePassword, hideSensitiveData, dragHandleProps, isGroupingTarget }) {
  return (
    <div className={cn(
      "relative group rounded-lg transition-all duration-300",
      isGroupingTarget && "ring-4 ring-primary shadow-2xl scale-[1.01] z-20 brightness-110"
    )}>
      <div 
        {...dragHandleProps} 
        className="absolute top-2 right-2 p-1 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing z-20"
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-muted/30 gap-4 transition-all duration-200">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            {item.platform && (
              <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {item.platform}
              </span>
            )}
            {item.username && (
              <span className="text-xs text-muted-foreground">
                ({item.username})
              </span>
            )}
          </div>
          <div className={cn(
            "font-mono break-all text-lg transition-all duration-300",
            (hideSensitiveData && !visibleIds.has(item.id)) ? "blur-md select-none" : "blur-0"
          )}>
            {item.value}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {item.links?.length > 0 && (
            <Link to={`/details/password/${item.id}`}>
              <Button
                size="icon"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                title="View Details & Links"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => toggleVisibility(item.id)}
            title={visibleIds.has(item.id) ? "Hide" : "Show"}
          >
            {visibleIds.has(item.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <EditPasswordDialog passwordItem={item} onUpdate={updatePassword}>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </EditPasswordDialog>
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
          <DeleteConfirmDialog onConfirm={() => deletePassword(item.id)}>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </DeleteConfirmDialog>
        </div>
      </div>
    </div>
  );
}
