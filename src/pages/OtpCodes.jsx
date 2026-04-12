import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import OtpCard from "@/components/OtpCard";
import AddOtpDialog from "@/components/AddOtpDialog";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
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
import GroupCard from "@/components/GroupCard";
import RenameGroupDialog from "@/components/RenameGroupDialog";

const OtpCodes = () => {
  const { getData, updateData } = useAuth();
  const [otpUris, setOtpUris] = useState([]);
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
    const loadOtps = async () => {
      setLoading(true);
      const data = await getData("tamga-otp-uris");
      if (data) {
        // Migration: convert strings to objects
        if (data.length > 0 && typeof data[0] === 'string') {
          console.log("Migrating older OTP strings to object format...");
          const migrated = data.map(uri => ({
            id: Date.now() + Math.random(),
            uri,
            createdAt: new Date().toISOString(),
            links: []
          }));
          await updateData("tamga-otp-uris", migrated);
          setOtpUris(migrated);
        } else {
          setOtpUris(data);
        }
      }
      setLoading(false);
    };
    loadOtps();
  }, [getData, updateData]);

  const saveOtps = async (uris) => {
    setOtpUris(uris);
    await updateData("tamga-otp-uris", uris);
  };

  const handleAddOtp = async (uri) => {
    if (otpUris.some(o => o.uri === uri)) {
      toast.error("This OTP account already exists");
      return;
    }
    const newItem = {
      id: Date.now() + Math.random(),
      uri,
      createdAt: new Date().toISOString(),
      links: []
    };
    const newUris = [...otpUris, newItem];
    await saveOtps(newUris);
    toast.success("OTP account added");
  };

  const handleDeleteOtp = async (idToDelete) => {
    const newUris = otpUris.filter(o => o.id !== idToDelete);
    await saveOtps(newUris);
    toast.success("OTP removed");
  };

  const handleUpdateOtp = async (id, updatedData) => {
    const oldItem = otpUris.find(i => String(i.id) === String(id));
    const oldLinks = oldItem?.links || [];
    const newLinks = updatedData.links || [];

    // 1. Update the item itself
    const updated = otpUris.map(o =>
      o.id === id ? { ...o, ...updatedData } : o
    );
    await saveOtps(updated);

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
          if (!links.some(l => l.type === 'otp' && String(l.id) === String(id))) {
            return { ...i, links: [...links, { type: 'otp', id }] };
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
          return { ...i, links: (i.links || []).filter(l => !(l.type === 'otp' && String(l.id) === String(id))) };
        }
        return i;
      });
      await updateData(sKey, updatedItems);
    }

    toast.success("OTP updated");
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
    
    // Detect if we should show grouping feedback
    const isCombineReady = isShiftPressed.current && collisions && collisions.length > 0 && collisions[0].data?.value > 0.5;
    if (isCombineReady) {
      setCombineTargetId(over.id);
    } else {
      setCombineTargetId(null);
      // Standard sorting logic only if not grouping
      setOtpUris((items) => {
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
       // Relaxed threshold: 0.5
       const isCombine = isShiftPressed.current && collisions && collisions.length > 0 && collisions[0].data?.value > 0.5; 
       
       if (isCombine) {
         setOtpUris((items) => {
           // Find if 'over' is a top-level item or group
           let overItem = items.find(i => String(i.id) === String(over.id));
           let parentGroup = null;

           // If not found at top level, check inside groups
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
             // Add to existing group (found via nested item)
             updated = items.filter(i => i.id !== active.id).map(g => {
               if (g.id === parentGroup.id) {
                 return { ...g, items: [...(g.items || []), activeItem] };
               }
               return g;
             });
           } else if (overItem.type === 'group') {
             // Add active to top-level group
             updated = items.filter(i => i.id !== active.id).map(i => {
               if (i.id === overItem.id) {
                 return { ...i, items: [...(i.items || []), activeItem] };
               }
               return i;
             });
           } else {
             // Merge two top-level items into a NEW group
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
           saveOtps(updated);
           return updated;
         });
       } else {
         setOtpUris(prev => { saveOtps(prev); return prev; });
       }
    }
  };

  const onRenameGroup = (id, newName) => {
    const updated = otpUris.map(i => {
      if (i.id === id) return { ...i, name: newName };
      return i;
    });
    saveOtps(updated);
  };

  const onDeleteGroup = (id) => {
    const updated = otpUris.filter(i => i.id !== id);
    saveOtps(updated);
    toast.success("Group and its contents removed");
  };

  const onUngroup = (id) => {
    const group = otpUris.find(i => i.id === id);
    if (!group) return;
    const contents = group.items || [];
    const updated = otpUris.filter(i => i.id !== id);
    updated.push(...contents);
    saveOtps(updated);
    toast.success("Items extracted from group");
  };

  const handleUpdateNestedOtp = async (groupId, itemId, updatedData) => {
    const updated = otpUris.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.map(item => item.id === itemId ? { ...item, ...updatedData } : item)
            };
        }
        return g;
    });
    saveOtps(updated);
  };

  const handleDeleteNestedOtp = async (groupId, itemId) => {
    const updated = otpUris.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.filter(item => item.id !== itemId)
            };
        }
        return g;
    });
    saveOtps(updated);
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
              <Button variant="secondary" className="border-gray-700 cursor-pointer text-black dark:border-gray-300 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-800">Add your first account</Button>
            </AddOtpDialog>
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
                items={otpUris.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                {otpUris.map((item) => (
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
                                    <OtpCard 
                                        key={nestedItem.id} 
                                        otpItem={nestedItem} 
                                        onDelete={(id) => handleDeleteNestedOtp(item.id, id)}
                                        onUpdate={(id, data) => handleUpdateNestedOtp(item.id, id, data)}
                                        isGroupingTarget={combineTargetId === nestedItem.id}
                                    />
                                ))}
                            </div>
                        </GroupCard>
                    ) : (
                        <OtpCard
                          otpItem={item}
                          onDelete={handleDeleteOtp}
                          onUpdate={handleUpdateOtp}
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

export default OtpCodes;
