"use client";
"use no memo";

import { useNode, useEditor } from "@craftjs/core";
import React, { useEffect, useState } from "react";
import ContentEditable from "react-contenteditable";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline, Strikethrough } from "lucide-react";
import { AnimationSection, getAnimationVariants } from "./AnimationSection";
import { motion } from "framer-motion";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing, getResponsiveFontSize, getResponsiveSpacing } from "@/lib/utils";
import { useCanvasDrag } from "./hooks/useCanvasDrag";
import { useAppContext } from "../editor/AppContext";

    export const TextSettings = () => {
    const { actions: { setProp }, fontSize, color, textAlign, fontWeight, fontStyle, textDecoration, text, fontFamily, top, left } = useNode((node) => ({
        fontSize: node.data.props.fontSize,
        color: node.data.props.color,
        textAlign: node.data.props.textAlign,
        fontWeight: node.data.props.fontWeight,
        fontStyle: node.data.props.fontStyle,
        textDecoration: node.data.props.textDecoration,
        text: node.data.props.text,
        fontFamily: node.data.props.fontFamily,
        top: node.data.props.top,
        left: node.data.props.left,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Text Content</Label>
                <textarea
                    className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={text || ""}
                    onChange={(e) => setProp((props: any) => props.text = e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Font Family</Label>
                <select
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={fontFamily || "sans-serif"}
                    onChange={(e) => setProp((props: any) => props.fontFamily = e.target.value)}
                >
                    <option value="sans-serif">Sans Serif</option>
                    <option value="serif">Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="'Playfair Display', serif">Playfair Display (Elegant)</option>
                    <option value="'Montserrat', sans-serif">Montserrat (Modern)</option>
                    <option value="'Great Vibes', cursive">Great Vibes (Script)</option>
                </select>
            </div>

            <div className="space-y-2">
                <Label>Font Size: {fontSize}px</Label>
                <Slider
                    defaultValue={[fontSize || 16]}
                    max={100}
                    step={1}
                    onValueChange={(val) => setProp((props: any) => props.fontSize = val[0])}
                />
            </div>

            <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={color || "#000000"}
                        className="w-10 h-10 p-1"
                        onChange={(e) => setProp((props: any) => props.color = e.target.value)}
                    />
                    <Input
                        type="text"
                        value={color || "#000000"}
                        onChange={(e) => setProp((props: any) => props.color = e.target.value)}
                    />
                </div>
            </div>

            {/* Position Settings - Only show if parent is canvas? Ideally we check parent props, but strict "canvas" mode check might be complex here. For now, we always show or check context if possible. But easier is just to show them if "top/left" are set or we add a "Positioning" section */}
            <div className="space-y-4 pt-4 border-t">
                <Label>Position (Canvas Mode)</Label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Top</Label>
                        <Input
                            value={top || 0}
                            type="number"
                            onChange={(e) => setProp((props: any) => props.top = parseInt(e.target.value))}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Left</Label>
                        <Input
                            value={left || 0}
                            type="number"
                            onChange={(e) => setProp((props: any) => props.left = parseInt(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
                <Label>Dimensions</Label>
                <ToggleGroup type="single" value={textAlign || "left"} onValueChange={(val) => val && setProp((props: any) => props.textAlign = val)}>
                    <ToggleGroupItem value="left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="justify"><AlignLeft className="h-4 w-4" />J</ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className="space-y-2">
                <Label>Style</Label>
                <ToggleGroup
                    type="multiple"
                    value={[
                        // Treat any non-normal weight as bold for consistency
                        fontWeight && fontWeight !== "normal" ? "bold" : "",
                        fontStyle === "italic" ? "italic" : "",
                        textDecoration && textDecoration.includes("underline") ? "underline" : "",
                        textDecoration && textDecoration.includes("line-through") ? "line-through" : "",
                        textDecoration && textDecoration.includes("overline") ? "overline" : "",
                    ].filter(Boolean)}
                    onValueChange={(vals) => {
                        setProp((props: any) => {
                            // Bold / Italic
                            props.fontWeight = vals.includes("bold") ? "bold" : "normal";
                            props.fontStyle = vals.includes("italic") ? "italic" : "normal";

                            // Text decoration: allow at most one at a time, in priority order
                            if (vals.includes("underline")) props.textDecoration = "underline";
                            else if (vals.includes("line-through")) props.textDecoration = "line-through";
                            else if (vals.includes("overline")) props.textDecoration = "overline";
                            else props.textDecoration = "none";
                        });
                    }}
                >
                    <ToggleGroupItem value="bold" aria-label="Bold"><Bold className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Italic"><Italic className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="underline" aria-label="Underline"><Underline className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="line-through" aria-label="Strikethrough"><Strikethrough className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="overline" aria-label="Overline">
                        <span
                            className="text-xs font-bold underline decoration-2 decoration-current align-top"
                            style={{ textDecorationLine: "overline" }}
                        >
                            O
                        </span>
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <StylesPanel />
        </div>
    );
};

export const UserText = ({ text, fontSize, color, textAlign, fontWeight, fontStyle, textDecoration, fontFamily, padding, margin, width, minHeight, background, borderRadius, top, left, animationType, animationDuration, animationDelay }: any) => {
    const { connectors: { connect, drag }, actions: { setProp }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const { device } = useAppContext();

    // Access parent node to check if it's a "canvas" container
    const { itemStyle } = useCanvasDrag(top, left);

    const [editable, setEditable] = useState(false);

    useEffect(() => {
        if (selected) return;
        setEditable(false);
    }, [selected]);

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    // Get responsive font size based on device
    const responsiveFontSize = getResponsiveFontSize(fontSize || 16, device);
    
    // Adjust width for mobile - ensure it doesn't exceed container
    const responsiveWidth = device === "mobile" && width && typeof width === "string" && width.includes("px") 
        ? "100%" 
        : width;

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            onDoubleClick={(e) => {
                if (selected) setEditable(true);
            }}
            initial="initial"
            animate="animate"
            variants={variants as any}

            style={{
                width: device === "mobile" ? "100%" : responsiveWidth,
                minHeight,
                padding: getSpacing(device === "mobile" ? getResponsiveSpacing(padding, device) : padding),
                margin: getSpacing(device === "mobile" ? getResponsiveSpacing(margin, device) : margin),
                backgroundColor: background,
                borderRadius: `${borderRadius}px`,
                ...(device === "mobile" 
                    ? { position: "relative", top: 0, left: 0, width: "100%" } 
                    : itemStyle),
                zIndex: selected ? 100 : (device === "mobile" ? 10 : 1),
                maxWidth: device === "mobile" ? "100%" : undefined,
                overflow: device === "mobile" ? "hidden" : undefined,
                overflowWrap: "break-word",
                wordWrap: "break-word",
                wordBreak: "break-word",

                // For fit-content width, we must align the block itself
                alignSelf: device === "mobile" 
                    ? undefined 
                    : ((responsiveWidth === "fit-content" || responsiveWidth === "auto")
                        ? (textAlign === "center" ? "center" : textAlign === "right" ? "flex-end" : "flex-start")
                        : undefined),
            }}
        >
            <ContentEditable
                html={text}
                disabled={!editable}
                onChange={(e: any) =>
                    setProp((props: any) => props.text = e.target.value)
                }
                tagName="div"
                style={{
                    fontSize: `${responsiveFontSize}px`,
                    color,
                    textAlign: textAlign, // Keep original alignment
                    fontWeight,
                    fontStyle,
                    textDecoration,
                    fontFamily,
                    minHeight: "1em", // Ensure it doesn't collapse
                    width: "100%",
                    maxWidth: "100%",
                    overflowWrap: "break-word",
                    wordWrap: "break-word",
                    wordBreak: "break-word",
                }}
                className={`outline-none focus:outline-blue-400 focus:outline-2 focus:outline-dashed ${!editable ? "cursor-move" : "cursor-text"}`}
            />
        </motion.div>
    );
};

UserText.craft = {
    displayName: "Text",
    props: {
        text: "Edit this text",
        fontSize: 16,
        color: "#000000",
        textAlign: "left",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
        fontFamily: "sans-serif",
        padding: 0,
        margin: 0,
        width: "fit-content",
        minHeight: "auto",
        background: "transparent",
        borderRadius: 0,
        animationType: "none",
        animationDuration: 0.5,
        animationDelay: 0,
        top: 0,
        left: 0,
    },
    related: {
        settings: TextSettings,
    },
};
