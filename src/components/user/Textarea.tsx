"use client";

import { useNode, useEditor } from "@craftjs/core";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAnimationVariants } from "./AnimationSection";

export const TextareaSettings = () => {
    const { actions: { setProp }, placeholder, rows, value } = useNode((node) => ({
        placeholder: node.data.props.placeholder,
        rows: node.data.props.rows,
        value: node.data.props.value,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Default Value</Label>
                <Textarea
                    value={value}
                    onChange={(e) => setProp((props: any) => props.value = e.target.value)}
                    rows={3}
                />
            </div>
            <div className="space-y-2">
                <Label>Placeholder</Label>
                <Input
                    value={placeholder}
                    onChange={(e) => setProp((props: any) => props.placeholder = e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label>Rows</Label>
                <Input
                    type="number"
                    value={rows}
                    onChange={(e) => setProp((props: any) => props.rows = parseInt(e.target.value))}
                />
            </div>
            <StylesPanel />
        </div>
    );
};

export const UserTextarea = ({ placeholder, rows, value, padding, margin, width, background, borderRadius, animationType, animationDuration, animationDelay }: any) => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }));

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    const { actions: { setProp } } = useNode();

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            style={{
                width: width || "100%",
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                background,
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
            }}
            className="w-full"
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <Textarea
                placeholder={placeholder}
                value={value}
                onChange={(e) => setProp((props: any) => props.value = e.target.value)}
                rows={rows}
                className={selected ? "ring-2 ring-blue-400" : ""}
                readOnly={enabled && !selected}
            />
        </motion.div>
    );
};

UserTextarea.craft = {
    displayName: "Textarea",
    props: {
        placeholder: "Enter details...",
        value: "",
        rows: 4,
        padding: 0,
        margin: 0,
        width: "100%",
        background: "transparent",
        borderRadius: 0,
        animationType: "none",
        animationDuration: 0.5,
        animationDelay: 0,
    },
    related: {
        settings: TextareaSettings,
    },
};
