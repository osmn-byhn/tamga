import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Pencil, Copy, Trash2, ExternalLink, GripVertical, Shield, Globe } from "lucide-react";
import { Link } from "react-router-dom";
import { cn, getFaviconUrl } from "@/lib/utils";
import { toast } from "sonner";
import EditPasswordDialog from "./EditPasswordDialog";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import { useSettings } from "@/context/SettingsContext";
import CensoredText from "./CensoredText";

const PasswordCard = ({ item, onUpdate, onDelete, dragHandleProps, isGroupingTarget, showDetailLink = true }) => {
  const { hideSensitiveData } = useSettings();
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-muted/30 gap-4 transition-all duration-200">
        <div className="flex items-center gap-4 flex-1">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 shrink-0 overflow-hidden">
                {item.url ? (
                    <img src={getFaviconUrl(item.url)} alt="" className="h-5 w-5 object-contain" />
                ) : (
                    <Shield className="h-5 w-5" />
                )}
            </div>
            <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    {item.platform && (
                    <span className="text-xs font-bold px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full truncate max-w-[150px]">
                        {item.platform}
                    </span>
                    )}
                    {item.username && (
                    <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {item.username}
                    </span>
                    )}
                </div>
                <div className="font-mono break-all text-lg transition-all duration-300">
                    <CensoredText value={item.value} isVisible={isVisible} />
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          {showDetailLink && item.links?.length > 0 && (
            <Link to={`/details/password/${item.id}`}>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="View Details & Links"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {item.url && (
            <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => window.open(item.url, '_blank')}
                title="Open Website"
            >
                <Globe size={16} />
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={toggleVisibility}
            title={isVisible ? "Hide" : "Show"}
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <EditPasswordDialog passwordItem={item} onUpdate={onUpdate}>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </EditPasswordDialog>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => {
              navigator.clipboard.writeText(item.value);
              toast.success("Password copied");
            }}
            title="Copy Password"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onDelete && (
            <DeleteConfirmDialog onConfirm={() => onDelete(item.id)}>
                <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                title="Delete"
                >
                <Trash2 className="h-4 w-4" />
                </Button>
            </DeleteConfirmDialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordCard;
