"use client";

import { useEditor } from "@craftjs/core";
import { Button } from "../ui/button";
import { Monitor, Play, Redo, Save, Smartphone, Undo, FilePlus, FolderOpen, Trash2, Check, X } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Toggle } from "../ui/toggle";
import { useAppContext } from "./AppContext";
import { SectionSwitcher } from "./SectionSwitcher";
import { FullPreview } from "./FullPreview";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Template {
    id: string;
    name: string;
    lastSaved: number;
}

export const Topbar = () => {
    const { actions, query, canUndo, canRedo } = useEditor((state, query) => ({
        canUndo: query.history.canUndo(),
        canRedo: query.history.canRedo(),
    }));

    const { device, setDevice, preview, setPreview } = useAppContext();
    const { actions: { setOptions } } = useEditor();

    const [templates, setTemplates] = useState<Template[]>([]);
    const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [loadDialogOpen, setLoadDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState("");

    // Load templates and auto-load last state on mount
    useEffect(() => {
        const savedTemplates = JSON.parse(localStorage.getItem("wedding-templates") || "[]");
        setTemplates(savedTemplates);

        const lastId = localStorage.getItem("wedding-current-template-id");
        if (lastId) {
            loadTemplate(lastId);
        } else {
            // Attempt legacy load
            const legacyState = localStorage.getItem("wedding-site-state");
            if (legacyState) {
                try {
                    actions.deserialize(legacyState);
                    showToast("Restored unsaved draft");
                } catch (e) { console.error(e); }
            }
        }
    }, []);

    const showToast = (message: string, color: string = "#4ade80") => {
        const toast = document.createElement("div");
        toast.innerText = message;
        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.padding = "10px 20px";
        toast.style.background = color;
        toast.style.color = "white";
        toast.style.borderRadius = "5px";
        toast.style.zIndex = "1000";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    };

    const handleSave = () => {
        if (currentTemplateId) {
            // Update existing
            const template = templates.find(t => t.id === currentTemplateId);
            if (template) {
                saveToLocalStorage(template.name, currentTemplateId);
                showToast(`Saved "${template.name}"`);
            }
        } else {
            // Open Save As dialog
            setNewTemplateName("My Awesome Wedding Site");
            setSaveDialogOpen(true);
        }
    };

    const saveToLocalStorage = (name: string, id: string) => {
        const json = query.serialize();
        const updatedTemplates = templates.map(t => t.id === id ? { ...t, name, lastSaved: Date.now() } : t);
        
        // If not in list (shouldn't happen for existing, but for safety)
        if (!updatedTemplates.find(t => t.id === id)) {
            updatedTemplates.push({ id, name, lastSaved: Date.now() });
        }
        
        setTemplates(updatedTemplates);
        localStorage.setItem("wedding-templates", JSON.stringify(updatedTemplates));
        localStorage.setItem(`wedding-template-${id}`, json);
        localStorage.setItem("wedding-current-template-id", id);
    };

    const handleCreateNewTemplate = () => {
        const id = crypto.randomUUID();
        const name = newTemplateName.trim() || "Untitled Project";
        
        const newTemplate = { id, name, lastSaved: Date.now() };
        const newTemplates = [...templates, newTemplate];
        
        setTemplates(newTemplates);
        localStorage.setItem("wedding-templates", JSON.stringify(newTemplates));
        localStorage.setItem(`wedding-template-${id}`, query.serialize());
        localStorage.setItem("wedding-current-template-id", id);
        
        setCurrentTemplateId(id);
        setSaveDialogOpen(false);
        showToast(`Created "${name}"`);
    };

    const loadTemplate = (id: string) => {
        const json = localStorage.getItem(`wedding-template-${id}`);
        if (json) {
            try {
                actions.deserialize(json);
                setCurrentTemplateId(id);
                localStorage.setItem("wedding-current-template-id", id);
                setLoadDialogOpen(false);
                const template = templates.find(t => t.id === id);
                showToast(`Loaded "${template?.name || 'Template'}"`);
            } catch (e) {
                console.error(e);
                showToast("Failed to load template", "#ef4444");
            }
        }
    };

    const deleteTemplate = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newTemplates = templates.filter(t => t.id !== id);
        setTemplates(newTemplates);
        localStorage.setItem("wedding-templates", JSON.stringify(newTemplates));
        localStorage.removeItem(`wedding-template-${id}`);
        
        if (currentTemplateId === id) {
            setCurrentTemplateId(null);
            localStorage.removeItem("wedding-current-template-id");
            actions.clearEvents(); 
            // We might want to clear the editor too, but maybe user wants to keep the content as draft?
            // Let's keep content but disassociate ID.
        }
        showToast("Template deleted", "#ef4444");
    };

    const handleNewProject = () => {
        if (confirm("Are you sure? This will clear your current editor.")) {
            actions.clearEvents();
            // Need a way to clear the canvas. serialize() returns JSON, deserialize takes JSON.
            // We can deserialize an empty structure or default structure.
            // For now, let's just reload page or clear via a trick if needed, 
            // but CraftJS doesn't have a direct 'clear' method exposed easily without passing empty state.
            // We can just reset current ID and let user build from scratch or refresh.
            // A better way is to deserialize a basic empty root.
            
            // Basic empty state
            const emptyState = "{\"ROOT\":{\"type\":{\"resolvedName\":\"UserContainer\"},\"isCanvas\":true,\"props\":{\"background\":\"#ffffff\",\"padding\":10,\"minHeight\":\"800px\",\"width\":\"100%\",\"flexDirection\":\"column\",\"alignItems\":\"flex-start\"},\"displayName\":\"UserContainer\",\"custom\":{},\"hidden\":false,\"nodes\":[],\"linkedNodes\":{}}}";
             try {
                actions.deserialize(emptyState);
            } catch(e) {
                 // fallback if emptyState is invalid
                 window.location.reload(); // Simplest way to "New"
                 return;
            }

            setCurrentTemplateId(null);
            localStorage.removeItem("wedding-current-template-id");
            showToast("Started new project");
        }
    };

    const currentTemplateName = templates.find(t => t.id === currentTemplateId)?.name;

    return (
        <div className="border-b px-4 py-2 flex items-center justify-between bg-white shadow-sm">
            <div className="flex items-center gap-2">
                <span className="font-bold text-lg mr-4 bg-linear-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    Wedding Builder
                </span>
                <SectionSwitcher />
                <ToggleGroup type="single" value={device} onValueChange={(val) => val && setDevice(val as "desktop" | "mobile")}>
                    <ToggleGroupItem value="desktop" aria-label="Desktop view">
                        <Monitor className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="mobile" aria-label="Mobile view">
                        <Smartphone className="h-4 w-4" />
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className="flex items-center gap-2">
                {currentTemplateId && (
                     <Badge variant="secondary" className="mr-2">
                        {currentTemplateName}
                     </Badge>
                )}

                <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canUndo}
                    onClick={() => actions.history.undo()}
                >
                    <Undo className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={!canRedo}
                    onClick={() => actions.history.redo()}
                >
                    <Redo className="h-4 w-4" />
                </Button>

                <div className="h-6 w-px bg-gray-200 mx-1" />

                <Button variant="ghost" size="sm" onClick={handleNewProject} title="New Project">
                    <FilePlus className="h-4 w-4" />
                </Button>

                <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" title="Load Project">
                            <FolderOpen className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Load Template</DialogTitle>
                            <DialogDescription>
                                Select a previously saved template to edit.
                            </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-75 w-full rounded-md border p-4">
                            {templates.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">No saved templates found.</div>
                            ) : (
                                <div className="space-y-2">
                                    {templates.sort((a,b) => b.lastSaved - a.lastSaved).map((t) => (
                                        <div key={t.id} 
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors",
                                                currentTemplateId === t.id && "border-pink-500 bg-pink-50"
                                            )}
                                            onClick={() => loadTemplate(t.id)}
                                        >
                                            <div>
                                                <div className="font-medium">{t.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(t.lastSaved).toLocaleString()}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" onClick={(e) => deleteTemplate(t.id, e)}>
                                                <Trash2 className="h-4 w-4 text-red-400 hover:text-red-600" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                <Button variant="outline" size="sm" onClick={handleSave} className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700">
                    <Save className="h-4 w-4 mr-2" /> 
                    {currentTemplateId ? "Save" : "Save As"}
                </Button>

                 <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Save Template</DialogTitle>
                            <DialogDescription>
                                Give your wedding site template a name.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                    Name
                                </Label>
                                <Input
                                    id="name"
                                    value={newTemplateName}
                                    onChange={(e) => setNewTemplateName(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreateNewTemplate}>Save Template</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div className="h-6 w-px bg-gray-200 mx-1" />

                <Toggle
                    pressed={preview}
                    onPressedChange={(pressed) => {
                        setPreview(pressed);
                        setOptions((options) => options.enabled = !pressed);
                    }}
                    variant="outline"
                    aria-label="Toggle preview"
                    className="gap-2"
                >
                    <Play className="h-4 w-4" />
                    {preview ? "Edit" : "Preview"}
                </Toggle>
                <FullPreview />
            </div>
        </div>
    );
};
