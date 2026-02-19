"use client";
"use no memo";

import { useNode, useEditor } from "@craftjs/core";
import React from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing, getResponsiveSpacing, getResponsiveFontSize } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAnimationVariants } from "./AnimationSection";
import { useCanvasDrag } from "./hooks/useCanvasDrag";
import { useAppContext } from "../editor/AppContext";

export const ButtonSettings = () => {
    const { actions: { setProp }, text, url, variant, size, color, borderColor, align, fontSize } = useNode((node) => ({
        text: node.data.props.text,
        url: node.data.props.url,
        variant: node.data.props.variant,
        size: node.data.props.size,
        color: node.data.props.color,
        borderColor: node.data.props.borderColor,
        align: node.data.props.align,
        fontSize: node.data.props.fontSize,
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
                <Label>Destination URL</Label>
                <Input
                    value={url || ""}
                    placeholder="https://..."
                    onChange={(e) => setProp((props: any) => props.url = e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Font Size: {fontSize || 14}px</Label>
                <Slider
                    defaultValue={[fontSize || 14]}
                    max={100}
                    step={1}
                    onValueChange={(val) => setProp((props: any) => props.fontSize = val[0])}
                />
            </div>

            <div className="space-y-2">
                <Label>Alignment</Label>
                <ToggleGroup type="single" value={align || ""} onValueChange={(val) => setProp((props: any) => props.align = val)}>
                    <ToggleGroupItem value="left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={color || "#000000"}
                        className="w-10 h-10 p-1"
                        onChange={(e) => setProp((props: any) => props.color = e.target.value)}
                    />
                    <Input
                        type="text"
                        value={color || ""}
                        placeholder="#000000"
                        onChange={(e) => setProp((props: any) => props.color = e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Border Color</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={borderColor || "#000000"}
                        className="w-10 h-10 p-1"
                        onChange={(e) => setProp((props: any) => props.borderColor = e.target.value)}
                    />
                    <Input
                        type="text"
                        value={borderColor || ""}
                        placeholder="#000000"
                        onChange={(e) => setProp((props: any) => props.borderColor = e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Variant</Label>
                <div className="flex flex-wrap gap-2">
                    {['default', 'destructive', 'outline', 'secondary', 'ghost', 'link', 'pill'].map((v) => (
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

export const UserButton = ({ text, url, variant, size, padding, margin, width, height, background, borderRadius, color, borderColor, align, animationType, animationDuration, animationDelay, fontSize }: any) => {
    const { connectors: { connect, drag }, selected, actions: { setProp }, top, left } = useNode((node) => ({
        selected: node.events.selected,
        top: node.data.props.top,
        left: node.data.props.left,
    }));

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled,
    }));

    const { device } = useAppContext();

    const { itemStyle } = useCanvasDrag(top, left);

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    // Responsive adjustments for mobile
    const responsiveWidth = device === "mobile" && width && typeof width === "string" && width.includes("px")
        ? "100%"
        : width;
    const responsiveFontSize = getResponsiveFontSize(fontSize || 16, device);

    const handleClick = () => {
        if (enabled) return;
        if (url) {
            window.location.href = url;
        }
    };

    // On mobile, buttons should be full width unless explicitly set otherwise; support numeric width/height from corner resize
    const wrapperWidth = typeof width === "number" ? `${width}px` : (device === "mobile" || align ? "100%" : "auto");
    const wrapperHeight = typeof height === "number" ? `${height}px` : undefined;
    const buttonWidth = device === "mobile"
        ? (align ? "100%" : (typeof width === "number" ? `${width}px` : width || "100%"))
        : (typeof width === "number" ? `${width}px` : responsiveWidth);

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            className={device === "mobile" || align ? "flex w-full" : "inline-block"}
            style={{
                width: wrapperWidth,
                height: wrapperHeight,
                margin: getSpacing(device === "mobile" ? getResponsiveSpacing(margin, device) : margin),
                justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
                ...(device === "mobile" ? { position: "relative", top: 0, left: 0 } : itemStyle),
                zIndex: selected ? 100 : 1,
                maxWidth: device === "mobile" ? "100%" : undefined,
            }}
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <Button
                variant={variant} 
                size={size} 
                className={selected ? "ring-2 ring-blue-400 ring-offset-2" : ""}
                onClick={handleClick}
                style={{
                    width: buttonWidth,
                    maxWidth: device === "mobile" ? "100%" : undefined,
                    backgroundColor: background === "transparent" ? undefined : background,
                    borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                    color: color || undefined,
                    borderColor: borderColor || undefined,
                    padding: padding ? getSpacing(device === "mobile" ? getResponsiveSpacing(padding, device) : padding) : undefined,
                    height: "auto", // Allow height to adjust with padding
                    fontSize: responsiveFontSize ? `${responsiveFontSize}px` : undefined,
                }}
            >
                {text}
            </Button>
        </motion.div>
    );
};

UserButton.craft = {
    displayName: "Button",
    props: {
        text: "Click Me",
        url: "",
        variant: "default",
        size: "default",
        padding: 0,
        margin: 0,
        width: "auto",
        align: null,
        background: "#000000",
        color: "#ffffff",
        borderColor: "transparent",
        borderRadius: 0,
        animationType: "none",
        animationDuration: 0.5,
        animationDelay: 0,
        top: 0,
        left: 0,
        height: undefined,
        fontSize: 14,
    },
    related: {
        settings: ButtonSettings,
    },
};
