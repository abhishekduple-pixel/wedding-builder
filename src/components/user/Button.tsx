"use client";

import { useNode } from "@craftjs/core";
import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAnimationVariants } from "./AnimationSection";
import { useCanvasDrag } from "./hooks/useCanvasDrag";

export const ButtonSettings = () => {
    const { actions: { setProp }, text, variant, size } = useNode((node) => ({
        text: node.data.props.text,
        variant: node.data.props.variant,
        size: node.data.props.size,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Button Text</Label>
                <Input
                    value={text}
                    onChange={(e) => setProp((props: any) => props.text = e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Variant</Label>
                <div className="flex flex-wrap gap-2">
                    {['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'].map((v) => (
                        <Button
                            key={v}
                            size="sm"
                            variant={variant === v ? "default" : "outline"}
                            onClick={() => setProp((props: any) => props.variant = v)}
                            className="capitalize"
                        >
                            {v}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <Label>Size</Label>
                <ToggleGroup type="single" value={size || "default"} onValueChange={(val) => val && setProp((props: any) => props.size = val)}>
                    <ToggleGroupItem value="default">Default</ToggleGroupItem>
                    <ToggleGroupItem value="sm">Small</ToggleGroupItem>
                    <ToggleGroupItem value="lg">Large</ToggleGroupItem>
                    <ToggleGroupItem value="icon">Icon</ToggleGroupItem>
                </ToggleGroup>
            </div>

            <StylesPanel />
        </div>
    );
};

export const UserButton = ({ text, variant, size, padding, margin, width, background, borderRadius, animationType, animationDuration, animationDelay }: any) => {
    const { connectors: { connect, drag }, selected, actions: { setProp }, top, left } = useNode((node) => ({
        selected: node.events.selected,
        top: node.data.props.top,
        left: node.data.props.left,
    }));

    const { isCanvas, dragProps, itemStyle } = useCanvasDrag(top, left, { setProp });

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    return (
        <motion.div
            ref={(ref: any) => {
                if (isCanvas) {
                    connect(ref);
                } else {
                    connect(drag(ref));
                }
            }}
            className="inline-block"
            style={{
                width: width === "100%" ? "auto" : width,
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                backgroundColor: background === "transparent" ? undefined : background,
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                ...itemStyle,
                zIndex: selected ? 100 : 1,
            }}
            initial="initial"
            animate="animate"
            variants={variants as any}
            {...dragProps}
        >
            <Button variant={variant} size={size} className={selected ? "ring-2 ring-blue-400 ring-offset-2" : ""}>
                {text}
            </Button>
        </motion.div>
    );
};

UserButton.craft = {
    displayName: "Button",
    props: {
        text: "Click Me",
        variant: "default",
        size: "default",
        padding: 0,
        margin: 0,
        width: "auto",
        background: "transparent",
        borderRadius: 0,
        animationType: "none",
        animationDuration: 0.5,
        animationDelay: 0,
        top: 0,
        left: 0,
    },
    related: {
        settings: ButtonSettings,
    },
};
