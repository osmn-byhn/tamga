import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ShieldAlert, Key, Terminal } from "lucide-react";
import RecoveryCodeCard from "@/components/RecoveryCodeCard";
import AddRecoveryCodeDialog from "@/components/AddRecoveryCodeDialog";
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

const RecoveryCodes = () => {
  const { getData, updateData } = useAuth();
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await getData("tamga-recovery-codes");
      if (data) {
        setRecoveryCodes(data);
      }
      setLoading(false);
    };
    loadData();
  }, [getData]);

  const saveRecoveryCodes = async (newItems) => {
    setRecoveryCodes(newItems);
    await updateData("tamga-recovery-codes", newItems);
  };

  const handleAdd = async ({ label, codes }) => {
    const newItem = {
      id: Date.now(),
      label,
      codes,
      createdAt: new Date().toISOString(),
      links: []
    };
    const updated = [newItem, ...recoveryCodes];
    await saveRecoveryCodes(updated);
    toast.success("Recovery codes added");
  };

  const handleDelete = async (id) => {
    const updated = recoveryCodes.filter(i => i.id !== id);
    await saveRecoveryCodes(updated);
    toast.success("Item removed");
  };

  const handleUpdate = async (id, updatedData) => {
    const updated = recoveryCodes.map(i =>
      i.id === id ? { ...i, ...updatedData } : i
    );
    await saveRecoveryCodes(updated);
    toast.success("Item updated");
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
      if (active.id !== over.id) {
        setRecoveryCodes((items) => {
          const oldIndex = items.findIndex((i) => String(i.id) === String(active.id));
          const newIndex = items.findIndex((i) => String(i.id) === String(over.id));

          if (oldIndex !== -1 && newIndex !== -1) {
            return arrayMove(items, oldIndex, newIndex);
          }
          return items;
        });
      }
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over, collisions } = event;
    setActiveId(null);
    setCombineTargetId(null);

    if (over && active.id !== over.id) {
       const isCombine = collisions && collisions.length > 0 && collisions[0].data?.value > 0.5; 
       
       if (isCombine) {
           let items = [...recoveryCodes];
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
           if (!activeItem || !overItem) return;

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
             setRenameGroupData({ id: newGroupId, name: "New Group" });
           }
           await saveRecoveryCodes(updated);
       } else {
         await saveRecoveryCodes(recoveryCodes);
       }
    } else {
      await saveRecoveryCodes(recoveryCodes);
    }
  };

  const onRenameGroup = async (id, newName) => {
    const updated = recoveryCodes.map(i => {
      if (i.id === id) return { ...i, name: newName };
      return i;
    });
    await saveRecoveryCodes(updated);
  };

  const onDeleteGroup = async (id) => {
    const updated = recoveryCodes.filter(i => i.id !== id);
    await saveRecoveryCodes(updated);
    toast.success("Group removed");
  };

  const onUngroup = async (id) => {
    const group = recoveryCodes.find(i => i.id === id);
    if (!group) return;
    const contents = group.items || [];
    const updated = recoveryCodes.filter(i => i.id !== id);
    updated.push(...contents);
    await saveRecoveryCodes(updated);
    toast.success("Items ungrouped");
  };

  const handleUpdateNested = async (groupId, itemId, updatedData) => {
    const updated = recoveryCodes.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.map(item => item.id === itemId ? { ...item, ...updatedData } : item)
            };
        }
        return g;
    });
    await saveRecoveryCodes(updated);
  };

  const handleDeleteNested = async (groupId, itemId) => {
    const updated = recoveryCodes.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.filter(item => item.id !== itemId)
            };
        }
        return g;
    });
    await saveRecoveryCodes(updated);
  };

  return (
    <div className="min-h-screen p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-8 w-8 text-rose-500" />
              Recovery Codes
            </h1>
            <p className="text-muted-foreground mt-1">Safe haven for your one-time backup and recovery keys.</p>
          </div>
          <AddRecoveryCodeDialog onAdd={handleAdd}>
            <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-all bg-rose-600 hover:bg-rose-700">
              <Plus className="h-5 w-5" />
              Add Backup Keys
            </Button>
          </AddRecoveryCodeDialog>
        </header>

        {loading ? (
            <div className="flex justify-center py-20">Loading...</div>
        ) : recoveryCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-950/20 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="h-10 w-10 text-rose-300" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No recovery codes</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Keep your account recovery keys safe. Never get locked out again.
            </p>
            <AddRecoveryCodeDialog onAdd={handleAdd}>
              <Button variant="outline" className="border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30">Store codes now</Button>
            </AddRecoveryCodeDialog>
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
                items={recoveryCodes.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                {recoveryCodes.map((item) => (
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
                                    <RecoveryCodeCard 
                                        key={nestedItem.id} 
                                        recovery={nestedItem} 
                                        onDelete={(id) => handleDeleteNested(item.id, id)}
                                        onUpdate={(id, data) => handleUpdateNested(item.id, id, data)}
                                        isGroupingTarget={combineTargetId === nestedItem.id}
                                    />
                                ))}
                            </div>
                        </GroupCard>
                    ) : (
                        <RecoveryCodeCard
                          recovery={item}
                          onDelete={handleDelete}
                          onUpdate={handleUpdate}
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
      
      {renameGroupData && (
        <RenameGroupDialog 
          isOpen={!!renameGroupData}
          onClose={() => setRenameGroupData(null)}
          initialName={renameGroupData.name}
          onConfirm={(newName) => onRenameGroup(renameGroupData.id, newName)}
        />
      )}
    </div>
  );
};

export default RecoveryCodes;
