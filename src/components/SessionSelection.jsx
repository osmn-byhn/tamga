import React, { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, User, Camera } from "lucide-react";

const SessionSelection = () => {
    const { sessions, selectSession, createSession } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState("");
    const [newPhoto, setNewPhoto] = useState(null);
    const fileInputRef = useRef(null);

    const handleCreate = (e) => {
        e.preventDefault();
        if (newName.trim()) {
            createSession(newName.trim(), newPhoto);
            setIsCreating(false);
            setNewName("");
            setNewPhoto(null);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    if (isCreating) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background transition-all duration-500">
                <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-xl shadow-2xl border border-border animate-in fade-in zoom-in duration-300">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="p-4 rounded-full bg-blue-500/20 text-blue-500">
                            <User className="h-10 w-10" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Session</h2>
                        <p className="text-muted-foreground text-center">Add a new profile to your vault.</p>
                    </div>

                    <form onSubmit={handleCreate} className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div 
                                className="relative w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center cursor-pointer overflow-hidden group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {newPhoto ? (
                                    <img src={newPhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="h-8 w-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="h-6 w-6 text-white" />
                                </div>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handlePhotoChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                            
                            <Input
                                type="text"
                                placeholder="Session Name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="text-center text-lg h-12"
                                autoFocus
                            />
                        </div>

                        <div className="flex space-x-4">
                            <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="w-full h-12">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!newName.trim()} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white">
                                Create
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background p-4">
            <div className="text-center mb-12 space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">Select Session</h1>
                <p className="text-muted-foreground">Choose a profile to continue</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-4xl w-full px-4">
                {sessions.map(session => (
                    <div 
                        key={session.id} 
                        onClick={() => selectSession(session.id)}
                        className="flex flex-col items-center p-6 space-y-4 rounded-2xl border border-border bg-card hover:bg-accent/50 cursor-pointer transition-all hover:scale-105 shadow-sm hover:shadow-md"
                    >
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center shadow-inner">
                            {session.photo ? (
                                <img src={session.photo} alt={session.name} className="w-full h-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-muted-foreground" />
                            )}
                        </div>
                        <h3 className="font-medium text-lg truncate w-full text-center">{session.name}</h3>
                    </div>
                ))}

                <div 
                    onClick={() => setIsCreating(true)}
                    className="flex flex-col items-center justify-center p-6 space-y-4 rounded-2xl border-2 border-dashed border-muted hover:border-primary/50 bg-transparent hover:bg-accent/20 cursor-pointer transition-all hover:scale-105"
                >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="font-medium text-lg text-primary">New Session</h3>
                </div>
            </div>
        </div>
    );
};

export default SessionSelection;
