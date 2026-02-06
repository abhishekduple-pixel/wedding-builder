"use client";

import { Element, useNode, useEditor } from "@craftjs/core";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { UserContainer } from "./Container";
import { UserText } from "./Text";

export const PopupSettings = () => {
    const { actions: { setProp }, triggerText, isOpen } = useNode((node) => ({
        triggerText: node.data.props.triggerText,
        isOpen: node.data.props.isOpen,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Trigger Text</Label>
                <Input
                    value={triggerText}
                    onChange={(e) => setProp((props: any) => props.triggerText = e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between">
                <Label>Force Open (Editor)</Label>
                <Switch
                    checked={isOpen}
                    onCheckedChange={(checked) => setProp((props: any) => props.isOpen = checked)}
                />
            </div>
        </div>
    );
};

export const UserPopup = ({ triggerText, isOpen, children }: any) => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }));

    // In editor, we rely on the 'isOpen' prop controlled by settings
    // In preview/live, we rely on internal state (uncontrolled)
    const [internalOpen, setInternalOpen] = useState(false);

    // If enabled (editor mode), use the prop directly. 
    // If disabled (preview mode), use internal state.
    const openState = enabled ? isOpen : internalOpen;

    return (
        <div ref={(ref: any) => connect(drag(ref))} className="inline-block">
            <Dialog
                open={openState}
                onOpenChange={(val) => {
                    if (!enabled) setInternalOpen(val);
                }}
            >
                <DialogTrigger asChild>
                    <Button variant="outline">{triggerText}</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    {/* The content area needs to be a specific Element to be editable */}
                    <div className="p-4 border rounded min-h-[100px] border-dashed border-gray-200">
                        <Element id="popup_content" is={UserContainer} padding={20} canvas>
                            <UserText text="Popup Content" fontSize={16} />
                        </Element>
                    </div>
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
    },
    related: {
        settings: PopupSettings,
    },
};
