import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload } from "lucide-react";

const AddEnvDialog = ({ onAdd, children }) => {
    const [open, setOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!projectName.trim() || !content.trim()) {
            toast.error("Please fill in both fields");
            return;
        }

        onAdd({
            projectName: projectName.trim(),
            content: content.trim(),
        });

        setOpen(false);
        setProjectName("");
        setContent("");
        toast.success("Env file added successfully");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            setContent(event.target.result);
            toast.success("File content loaded");
        };
        reader.readAsText(file);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add .env File</DialogTitle>
                    <DialogDescription>
                        Store your environment variables safe and sound.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project Name</Label>
                        <Input
                            id="project-name"
                            placeholder="My Awesome Project"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="env-content">Content</Label>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="upload-env"
                                    className="hidden"
                                    accept=".env*, text/*"
                                    onChange={handleFileUpload}
                                />
                                <Label htmlFor="upload-env" className="cursor-pointer text-xs text-green-500 hover:text-green-600 flex items-center gap-1">
                                    <Upload className="h-3 w-3" />
                                    Upload File
                                </Label>
                            </div>
                        </div>
                        <Textarea
                            id="env-content"
                            placeholder="DB_HOST=localhost..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[200px] font-mono text-sm"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">
                        Save Environment Variables
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddEnvDialog;
