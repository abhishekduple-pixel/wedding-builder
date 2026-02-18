"use client";
"use no memo";

import { Element, useNode, useEditor } from "@craftjs/core";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { UserContainer } from "./Container";
import { UserText } from "./Text";

export const PopupSettings = () => {
    const { actions: { setProp }, triggerText, isOpen, openOnLoad, hideTrigger, width, mode, title, message, position } = useNode((node) => ({
        triggerText: node.data.props.triggerText,
        isOpen: node.data.props.isOpen,
        openOnLoad: node.data.props.openOnLoad,
        hideTrigger: node.data.props.hideTrigger,
        width: node.data.props.width,
        mode: node.data.props.mode,
        title: node.data.props.title,
        message: node.data.props.message,
        position: node.data.props.position,
    }));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label>Simple Mode (Text Only)</Label>
                <Switch
                    checked={mode === "simple"}
                    onCheckedChange={(checked) => setProp((props: any) => props.mode = checked ? "simple" : "custom")}
                />
            </div>

            {mode === "simple" && (
                <>
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setProp((props: any) => props.title = e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Message</Label>
                        <textarea
                            className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            value={message}
                            onChange={(e) => setProp((props: any) => props.message = e.target.value)}
                        />
                    </div>
                </>
            )}

            <div className="space-y-2">
                <Label>Trigger Text</Label>
                <Input
                    value={triggerText}
                    onChange={(e) => setProp((props: any) => props.triggerText = e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Popup Width (px)</Label>
                <Input
                    type="number"
                    value={parseInt(width) || 500}
                    onChange={(e) => setProp((props: any) => props.width = `${e.target.value}px`)}
                />
            </div>

            <div className="space-y-2">
                <Label>Position</Label>
                <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={position || "center"}
                    onChange={(e) => setProp((props: any) => props.position = e.target.value)}
                >
                    <option value="center">Center</option>
                    <option value="top-left">Top Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                </select>
            </div>

            <div className="flex items-center justify-between">
                <Label>Force Open (Editor)</Label>
                <Switch
                    checked={isOpen}
                    onCheckedChange={(checked) => setProp((props: any) => props.isOpen = checked)}
                />
            </div>

            <div className="flex items-center justify-between">
                <Label>Open on Load</Label>
                <Switch
                    checked={openOnLoad}
                    onCheckedChange={(checked) => setProp((props: any) => props.openOnLoad = checked)}
                />
            </div>

            <div className="flex items-center justify-between">
                <Label>Hide Trigger Button</Label>
                <Switch
                    checked={hideTrigger}
                    onCheckedChange={(checked) => setProp((props: any) => props.hideTrigger = checked)}
                />
            </div>
        </div>
    );
};

export const UserPopup = ({ triggerText, isOpen, openOnLoad, hideTrigger, width = "500px", mode = "custom", title, message, position = "center", children }: any) => {
    const { connectors: { connect, drag }, selected, actions: { setProp } } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }));

    // In editor, we rely on the 'isOpen' prop controlled by settings
    // In preview/live, we rely on internal state (uncontrolled)
    const [internalOpen, setInternalOpen] = useState(false);

    // Auto-open on load (only in preview/live mode)
    React.useEffect(() => {
        if (!enabled && openOnLoad) {
            // Small delay to ensure smooth entrance
            const timer = setTimeout(() => setInternalOpen(true), 500);
            return () => clearTimeout(timer);
        }
    }, [enabled, openOnLoad]);

    // If enabled (editor mode), use the prop directly. 
    // If disabled (preview mode), use internal state.
    const openState = enabled ? isOpen : internalOpen;

    const getPositionStyles = () => {
        switch (position) {
            case "top-left": return { top: "20px", left: "20px", transform: "none" };
            case "top-right": return { top: "20px", left: "auto", right: "20px", transform: "none" };
            case "bottom-left": return { top: "auto", bottom: "20px", left: "20px", transform: "none" };
            case "bottom-right": return { top: "auto", bottom: "20px", left: "auto", right: "20px", transform: "none" };
            case "center":
            default: return { top: "70%", left: "70%", transform: "translate(-50%, -50%)" };
        }
    };

    return (
        <div ref={(ref: any) => connect(drag(ref))} className="inline-block">
            <Dialog
                open={openState}
                modal={!enabled}
                onOpenChange={(val) => {
                    if (enabled) {
                        setProp((props: any) => props.isOpen = val);
                    } else {
                        setInternalOpen(val);
                    }
                }}
            >
                {(!hideTrigger || enabled) && (
                    <DialogTrigger asChild>
                        <Button 
                            variant="outline" 
                            className={hideTrigger && enabled ? "opacity-50 border-dashed border-red-400" : ""}
                        >
                            {triggerText}
                        </Button>
                    </DialogTrigger>
                )}
                
                <DialogContent 
                    portal={!enabled}
                    onInteractOutside={(e) => {
                        if (enabled) e.preventDefault();
                    }}
                    className="p-0 border-none shadow-none bg-transparent sm:max-w-none z-9999"
                    style={{  
                        width: width, 
                        maxWidth: "90vw",
                        ...getPositionStyles()
                    }}
                >
                    <DialogTitle className="sr-only">{title || "Popup Notification"}</DialogTitle>
                    {mode === "simple" ? (
                        <div className="bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
                            {title && <h2 className="text-2xl font-serif text-gray-800">{title}</h2>}
                            {message && <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{message}</p>}
                            <Button onClick={() => enabled ? setProp((props: any) => props.isOpen = false) : setInternalOpen(false)}>Continue</Button>
                        </div>
                    ) : (
                        <Element id="popup_content" is={UserContainer} width="100%" background="#ffffff" borderRadius={12} padding={40} canvas>
                             <UserText 
                                text="Popup Content" 
                                fontSize={20} 
                                textAlign="center" 
                                color="#333333"
                             />
                             <UserText 
                                text="Drag and drop components here..." 
                                fontSize={14} 
                                textAlign="center" 
                                color="#999999"
                             />
                        </Element>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

UserPopup.craft = {
    displayName: "Popup",
    props: {
        triggerText: "Open Popup",
        isOpen: false, // Default closed
        openOnLoad: false,
        hideTrigger: false,
        width: "500px",
        mode: "custom",
        title: "Message From Couple",
        message: "Welcome - We're so glad you're here!!\n\nTake a browse through the pages on our wedding website and please complete your RSVP by March 1, 2026. We cannot wait to celebrate with you!\n\nWith love, Rahul and Ashna",
        position: "center",
    },
    related: {
        settings: PopupSettings,
    },
};
