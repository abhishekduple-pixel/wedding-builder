"use client";

import { useNode } from "@craftjs/core";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAnimationVariants } from "./AnimationSection";
import { useCanvasDrag } from "./hooks/useCanvasDrag";

export const SwitchSettings = () => {
    const { actions: { setProp }, label, checked } = useNode((node) => ({
        label: node.data.props.label,
        checked: node.data.props.checked,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Side Label</Label>
                <Input
                    value={label}
                    onChange={(e) => setProp((props: any) => props.label = e.target.value)}
                />
            </div>
            <div className="flex items-center justify-between">
                <Label>Default Checked</Label>
                <Switch
                    checked={checked}
                    onCheckedChange={(val) => setProp((props: any) => props.checked = val)}
                />
            </div>
            <StylesPanel />
        </div>
    );
};

export const UserSwitch = ({ label, checked, padding, margin, width, background, borderRadius, animationType, animationDuration, animationDelay }: any) => {
    const { connectors: { connect, drag }, selected, actions: { setProp }, top, left } = useNode((state) => ({
        selected: state.events.selected,
        top: state.data.props.top || 0,
        left: state.data.props.left || 0,
    }));

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);
    const { isCanvas, dragProps, itemStyle } = useCanvasDrag(top, left, { setProp });

    return (
        <motion.div
            ref={(ref: any) => {
                if (isCanvas) {
                    connect(ref);
                } else {
                    connect(drag(ref));
                }
            }}
            style={{
                width: width === "100%" ? "auto" : width,
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                backgroundColor: background,
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                ...itemStyle,
            }}
            className={`flex items-center gap-2 ${selected ? "ring-2 ring-blue-400 ring-offset-2 rounded" : ""}`}
            initial="initial"
            animate="animate"
            variants={variants as any}
            {...dragProps}
        >
            <Switch checked={checked} />
            {label && <Label>{label}</Label>}
        </motion.div>
    );
};

UserSwitch.craft = {
    displayName: "Switch",
    props: {
        label: "Toggle me",
        checked: false,
        padding: 0,
        margin: 0,
        width: "auto",
        background: "transparent",
        borderRadius: 0,
        animationType: "none",
        animationDuration: 0.5,
        animationDelay: 0,
    },
    related: {
        settings: SwitchSettings,
    },
};
