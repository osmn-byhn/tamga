import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Terminal, Code2 } from "lucide-react";
import EnvCard from "@/components/EnvCard";
import AddEnvDialog from "@/components/AddEnvDialog";
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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/context/AuthContext";
import GroupCard from "@/components/GroupCard";
import RenameGroupDialog from "@/components/RenameGroupDialog";

const Envs = () => {
  const { getData, updateData } = useAuth();
  const [envItems, setEnvItems] = useState([]);
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
    const loadEnvs = async () => {
      setLoading(true);
      const data = await getData("tamga-envs");
      if (data) {
        setEnvItems(data);
      }
      setLoading(false);
    };
    loadEnvs();
  }, [getData]);

  const saveEnvs = async (newItems) => {
    setEnvItems(newItems);
    await updateData("tamga-envs", newItems);
  };

  const handleAddEnv = async ({ projectName, content }) => {
    const newItem = {
      id: Date.now(),
      projectName,
      content,
      createdAt: new Date().toISOString(),
      links: []
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

  const handleUpdateEnv = async (id, updatedData) => {
    const oldItem = envItems.find(i => String(i.id) === String(id));
    const oldLinks = oldItem?.links || [];
    const newLinks = updatedData.links || [];

    // 1. Update the item itself
    const updated = envItems.map(item =>
      item.id === id ? { ...item, ...updatedData } : item
    );
    await saveEnvs(updated);

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
          if (!links.some(l => l.type === 'env' && String(l.id) === String(id))) {
            return { ...i, links: [...links, { type: 'env', id }] };
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
          return { ...i, links: (i.links || []).filter(l => !(l.type === 'env' && String(l.id) === String(id))) };
        }
        return i;
      });
      await updateData(sKey, updatedItems);
    }

    toast.success("Env file updated");
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
      setEnvItems((items) => {
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
         setEnvItems((items) => {
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
           saveEnvs(updated);
           return updated;
         });
       } else {
         setEnvItems(prev => { saveEnvs(prev); return prev; });
       }
    }
  };

  const onRenameGroup = (id, newName) => {
    const updated = envItems.map(i => {
      if (i.id === id) return { ...i, name: newName };
      return i;
    });
    saveEnvs(updated);
  };

  const onDeleteGroup = (id) => {
    const updated = envItems.filter(i => i.id !== id);
    saveEnvs(updated);
    toast.success("Group and its contents removed");
  };

  const onUngroup = (id) => {
    const group = envItems.find(i => i.id === id);
    if (!group) return;
    const contents = group.items || [];
    const updated = envItems.filter(i => i.id !== id);
    updated.push(...contents);
    saveEnvs(updated);
    toast.success("Items extracted from group");
  };

  const handleUpdateNestedEnv = async (groupId, itemId, updatedData) => {
    const updated = envItems.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.map(item => item.id === itemId ? { ...item, ...updatedData } : item)
            };
        }
        return g;
    });
    saveEnvs(updated);
  };

  const handleDeleteNestedEnv = async (groupId, itemId) => {
    const updated = envItems.map(g => {
        if (g.id === groupId) {
            return {
                ...g,
                items: g.items.filter(item => item.id !== itemId)
            };
        }
        return g;
    });
    saveEnvs(updated);
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-col gap-4">
              <SortableContext
                items={envItems.map((i) => i.id)}
                strategy={rectSortingStrategy}
              >
                {envItems.map((item) => (
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
                                    <EnvCard 
                                        key={nestedItem.id} 
                                        envItem={nestedItem} 
                                        onDelete={(id) => handleDeleteNestedEnv(item.id, id)}
                                        onUpdate={(id, data) => handleUpdateNestedEnv(item.id, id, data)}
                                        isGroupingTarget={combineTargetId === nestedItem.id}
                                    />
                                ))}
                            </div>
                        </GroupCard>
                    ) : (
                        <EnvCard
                          envItem={item}
                          onDelete={handleDeleteEnv}
                          onUpdate={handleUpdateEnv}
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
          onClose={(isConfirmed) => {
            if (renameGroupData?.isJustCreated && !isConfirmed) {
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

export default Envs;
