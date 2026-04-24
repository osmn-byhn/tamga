import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Folder, ChevronRight, ChevronDown, GripVertical, Pencil, Trash2, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import DeleteConfirmDialog from "./DeleteConfirmDialog";

const GroupCard = ({ 
    group, 
    onDelete, 
    onRename, 
    onUngroup,
    children, 
    dragHandleProps,
    isGroupingTarget 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const groupColor = group.color || "#3b82f6";

    return (
        <div className="w-full space-y-4">
            <Card className={cn(
                "relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 bg-card border-border",
                isExpanded && "shadow-md",
                isGroupingTarget && "ring-4 ring-primary shadow-2xl scale-[1.02] z-20 brightness-110"
            )} style={{ 
                borderLeftColor: groupColor,
                boxShadow: isExpanded ? `0 4px 12px ${groupColor}20` : undefined,
                ringColor: isExpanded ? `${groupColor}33` : undefined
            }}>
                <CardContent className="p-5">
                    <div 
                        {...dragHandleProps} 
                        className="absolute top-2 right-2 p-1 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing z-10"
                        title="Drag to reorder group"
                    >
                        <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <div 
                            className="flex-1 flex items-center gap-4 cursor-pointer"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: `${groupColor}1a`, color: groupColor }}>
                                {isExpanded ? <FolderOpen className="h-6 w-6" /> : <Folder className="h-6 w-6" />}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-lg truncate flex items-center gap-2">
                                    {group.name}
                                    <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                        {group.items?.length || 0} items
                                    </span>
                                </h3>
                                <p className="text-sm text-muted-foreground truncate">
                                    Group folder
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => onRename(group.id, group.name, groupColor)}
                                title="Rename Group"
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <DeleteConfirmDialog 
                                onConfirm={() => onDelete(group.id)}
                                title="Delete Group?"
                                description="Are you sure you want to delete this group and all its contents? This action cannot be undone."
                            >
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                                    title="Delete Group & Contents"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </DeleteConfirmDialog>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? <ChevronDown className="h-5 w-5" style={{ color: groupColor }} /> : <ChevronRight className="h-5 w-5" style={{ color: groupColor }} />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>


            {isExpanded && (
                <div className="pl-6 space-y-4 border-l-2 border-dashed border-border ml-6 pb-2 animate-in slide-in-from-top-2 duration-300">
                    {children}
                    {(!group.items || group.items.length === 0) && (
                        <p className="text-sm text-muted-foreground italic">No items in this group</p>
                    )}
                    <div className="flex justify-end">
                        <Button 
                            variant="link" 
                            size="sm" 
                            className="text-muted-foreground hover:text-red-500"
                            onClick={() => onUngroup(group.id)}
                        >
                            Ungroup all items
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GroupCard;
