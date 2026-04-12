import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ShieldCheck, Key } from "lucide-react";
import PasskeyCard from "@/components/PasskeyCard";
import AddPasskeyDialog from "@/components/AddPasskeyDialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";
import { useAuth } from "@/context/AuthContext";
import GroupCard from "@/components/GroupCard";
import RenameGroupDialog from "@/components/RenameGroupDialog";

const Passkeys = () => {
  const { getData, updateData } = useAuth();
  const [passkeys, setPasskeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [combineTargetId, setCombineTargetId] = useState(null);
  const [renameGroupData, setRenameGroupData] = useState(null);
  const isShiftPressed = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Shift') isShiftPressed.current = true; };
    const handleKeyUp = (e) => { if (e.key === 'Shift') isShiftPressed.current = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const loadPasskeys = async () => {
      setLoading(true);
      const data = await getData("tamga-passkeys");
      if (data) {
        setPasskeys(data);
      }
      setLoading(false);
    };
    loadPasskeys();
  }, [getData]);

  const savePasskeys = async (newPasskeys) => {
    setPasskeys(newPasskeys);
    await updateData("tamga-passkeys", newPasskeys);
  };

  const handleAddPasskey = async ({ label, secret }) => {
    const newPasskey = {
      id: Date.now(),
      label,
      secret,
      createdAt: new Date().toISOString(),
      links: []
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

  const handleUpdatePasskey = async (id, updatedData) => {
    const oldItem = passkeys.find(i => String(i.id) === String(id));
    const oldLinks = oldItem?.links || [];
    const newLinks = updatedData.links || [];

    // 1. Update the item itself
    const updated = passkeys.map(pk =>
      pk.id === id ? { ...pk, ...updatedData } : pk
    );
    await savePasskeys(updated);

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
          if (!links.some(l => l.type === 'passkey' && String(l.id) === String(id))) {
            return { ...i, links: [...links, { type: 'passkey', id }] };
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
          return { ...i, links: (i.links || []).filter(l => !(l.type === 'passkey' && String(l.id) === String(id))) };
        }
        return i;
      });
      await updateData(sKey, updatedItems);
    }

    toast.success("Passkey updated");
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

    const isCombineReady = isShiftPressed.current && collisions && collisions.length > 0 && collisions[0].data?.value > 0.5;
    if (isCombineReady) {
      setCombineTargetId(over.id);
    } else {
      setCombineTargetId(null);
      setPasskeys((items) => {
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
       const isCombine = isShiftPressed.current && collisions && collisions.length > 0 && collisions[0].data?.value > 0.5; 
       
       if (isCombine) {
         setPasskeys((items) => {
           let overItem = items.find(i => String(i.id) === String(over.id));
           let parentGroup = null;

           if (!overItem) {
             for (const g of items) {
               if (g.type === 'group' && g.items) {
                 const nested = g.items.find(ni => String(ni.id) === String(over.id));
                 if (nested) {
                   overItem = nested;
                   parentGroup = g;
                   break;
                 }
               }
             }
           }
           
           const activeItem = items.find(i => String(i.id) === String(active.id));
           if (!activeItem || !overItem) return items;

           let updated;
           if (parentGroup) {
             updated = items.filter(i => i.id !== active.id).map(g => {
               if (g.id === parentGroup.id) {
                 return { ...g, items: [...(g.items || []), activeItem] };
               }
               return g;
             });
           } else if (overItem.type === 'group') {
             updated = items.filter(i => i.id !== active.id).map(i => {
               if (i.id === overItem.id) {
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
               items: [overItem, activeItem]
             };
             updated = items.filter(i => i.id !== active.id && i.id !== overItem.id);
             updated.splice(items.findIndex(i => i.id === overItem.id), 0, newGroup);
             setRenameGroupData({ id: newGroupId, name: "New Group", isJustCreated: true });
           }
           savePasskeys(updated);
           return updated;
         });
       } else {
         setPasskeys(prev => { savePasskeys(prev); return prev; });
       }
    }
  };

  const onRenameGroup = (id, newName) => {
    const updated = passkeys.map(i => {
      if (i.id === id) return { ...i, name: newName };
      return i;
    });
    savePasskeys(updated);
  };

  const onDeleteGroup = (id) => {
    const updated = passkeys.filter(i => i.id !== id);
    savePasskeys(updated);
    toast.success("Group and its contents removed");
  };

  const onUngroup = (id) => {
    const group = passkeys.find(i => i.id === id);
    if (!group) return;
    const contents = group.items || [];
    const updated = passkeys.filter(i => i.id !== id);
    updated.push(...contents);
    savePasskeys(updated);
    toast.success("Items extracted from group");
  };

  const handleUpdateNestedPasskey = async (groupId, itemId, updatedData) => {
    const updated = passkeys.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.map(item => item.id === itemId ? { ...item, ...updatedData } : item)
            };
        }
        return g;
    });
    savePasskeys(updated);
  };

  const handleDeleteNestedPasskey = async (groupId, itemId) => {
    const updated = passkeys.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.filter(item => item.id !== itemId)
            };
        }
        return g;
    });
    savePasskeys(updated);
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
          <AddPasskeyDialog onAdd={handleAddPasskey}>
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
            <AddPasskeyDialog onAdd={handleAddPasskey}>
              <Button variant="outline" className="border-gray-700 cursor-pointer text-black dark:border-gray-300 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800">Store your first secret</Button>
            </AddPasskeyDialog>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col gap-4">
              <SortableContext
                items={passkeys.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                {passkeys.map((item) => (
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
                                    <PasskeyCard 
                                        key={nestedItem.id} 
                                        passkey={nestedItem} 
                                        onDelete={(id) => handleDeleteNestedPasskey(item.id, id)}
                                        onUpdate={(id, data) => handleUpdateNestedPasskey(item.id, id, data)}
                                        isGroupingTarget={combineTargetId === nestedItem.id}
                                    />
                                ))}
                            </div>
                        </GroupCard>
                    ) : (
                        <PasskeyCard
                          passkey={item}
                          onDelete={handleDeletePasskey}
                          onUpdate={handleUpdatePasskey}
                          isGroupingTarget={combineTargetId === item.id}
                        />
                    )}
                  </SortableItem>
                ))}
              </SortableContext>
            </div>
          </DndContext>
        )}
      </div>
      <Toaster />
      
      {renameGroupData && (
        <RenameGroupDialog 
          isOpen={!!renameGroupData}
          onClose={() => {
            if (renameGroupData?.isJustCreated) {
              onUngroup(renameGroupData.id);
            }
            setRenameGroupData(null);
          }}
          initialName={renameGroupData.name}
          onConfirm={(newName) => onRenameGroup(renameGroupData.id, newName)}
        />
      )}
    </div>
  );
};

export default Passkeys;
