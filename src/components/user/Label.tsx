"use client";

import { useNode } from "@craftjs/core";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAnimationVariants } from "./AnimationSection";

export const LabelSettings = () => {
    const { actions: { setProp }, text } = useNode((node) => ({
        text: node.data.props.text,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Label Text</Label>
                <Input
                    value={text}
                    onChange={(e) => setProp((props: any) => props.text = e.target.value)}
                />
            </div>
            <StylesPanel />
        </div>
    );
};

export const UserLabel = ({ text, padding, margin, width, background, borderRadius, animationType, animationDuration, animationDelay }: any) => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            style={{
                width: width === "100%" ? "auto" : width,
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                backgroundColor: background,
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
            }}
            className="inline-block"
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <Label className={selected ? "text-blue-500" : ""}>
                {text}
            </Label>
        </motion.div>
    );
};

UserLabel.craft = {
    displayName: "Label",
    props: {
        text: "Label Text",
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
        settings: LabelSettings,
    },
};
