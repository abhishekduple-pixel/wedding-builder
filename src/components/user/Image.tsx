"use client";
"use no memo";

import { useNode, useEditor, Element } from "@craftjs/core";
import React, { useRef } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { AnimationSection, getAnimationVariants } from "./AnimationSection";
import { motion } from "framer-motion";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing } from "@/lib/utils";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { Switch } from "../ui/switch";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { UserContainer } from "./Container";
import { useCanvasDrag } from "./hooks/useCanvasDrag";

export const ImageSettings = () => {
    const { actions: { setProp }, src, width, borderRadius, positionType, grayscale, sourceType, fileName } = useNode((node) => ({
        src: node.data.props.src,
        width: node.data.props.width,
        borderRadius: node.data.props.borderRadius,
        positionType: node.data.props.positionType,
        grayscale: node.data.props.grayscale,
        sourceType: node.data.props.sourceType,
        fileName: node.data.props.fileName,
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const objectUrl = URL.createObjectURL(file);
        setProp((props: any) => {
            props.src = objectUrl;
            props.sourceType = "upload";
            props.fileName = file.name;
        });
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Image URL</Label>
                {(() => {
                    const isUpload =
                        sourceType === "upload" ||
                        (typeof src === "string" &&
                            (src.startsWith("blob:") || src.startsWith("data:")));

                    return (
                        <>
                            <Input
                                value={isUpload ? "" : (src || "")}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setProp((props: any) => {
                                        props.src = value;
                                        props.sourceType = "url";
                                        props.fileName = "";
                                    });
                                }}
                                placeholder="https://..."
                            />
                            {isUpload && (
                                <p className="text-[10px] text-gray-400">
                                    Using uploaded image{fileName ? ` (${fileName})` : ""}. Enter a URL to replace it.
                                </p>
                            )}
                        </>
                    );
                })()}
            </div>

            <div className="space-y-2">
                <Label>Upload Image</Label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            <div className="space-y-4 pt-4 border-t">
                <Label>Movement Mode</Label>
                <ToggleGroup type="single" value={positionType || "relative"} onValueChange={(val) => val && setProp((props: any) => props.positionType = val)}>
                    <ToggleGroupItem value="relative" className="text-xs px-2">Auto-Layout</ToggleGroupItem>
                    <ToggleGroupItem value="absolute" className="text-xs px-2">Free Movement</ToggleGroupItem>
                </ToggleGroup>
                <p className="text-[10px] text-gray-400">
                    {positionType === "absolute"
                        ? "Drag the image anywhere on the screen."
                        : "Image follows the list order."}
                </p>
            </div>

            {/* Removed individual controls in favor of StylesPanel */}

            <div className="space-y-4 pt-4 border-t">
                <Label>Alignment (Block)</Label>
                <ToggleGroup type="single" value={useNode((node) => node.data.props.align).align || "left"} onValueChange={(val) => val && setProp((props: any) => props.align = val)}>
                    <ToggleGroupItem value="left" aria-label="Align Left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="center" aria-label="Align Center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="right" aria-label="Align Right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
            </div>

            <StylesPanel />
        </div>
    );
};

export const UserImage = ({ src, width, height, borderRadius, padding, margin, background, minHeight, align, top, left, animationType, animationDuration, animationDelay, positionType, children, layoutMode, grayscale }: any) => {
    const { connectors: { connect, drag }, selected, actions: { setProp } } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const { isDragging } = useEditor((state) => ({
        isDragging: !!state.events.dragged
    }));

    // Access parent node to check if it's a "canvas" container
    const { isCanvas, dragProps, itemStyle } = useCanvasDrag(top, left, { setProp });

    // Enable free movement if parent is Canvas OR user explicitly selected "Free Movement" (absolute)
    const isFree = isCanvas || positionType === "absolute";

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    return (
        <motion.div
            ref={(ref: any) => {
                if (isFree) {
                    connect(ref);
                } else {
                    connect(drag(ref));
                }
            }}
            {...dragProps}
            style={{
                width: typeof width === 'number' ? `${width}px` : (width || "100%"),
                height: typeof height === 'number' ? `${height}px` : (height || "auto"),
                minHeight: typeof minHeight === 'number' ? `${minHeight}px` : (minHeight || "auto"),
                position: isFree ? "absolute" : "relative",
                ...itemStyle,
                zIndex: selected ? 100 : 1,
                display: "flex",
                alignSelf: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                backgroundColor: background,
                borderRadius: `${borderRadius}px`,
            }}
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <img
                src={src}
                style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: `${borderRadius}px`,
                    filter: grayscale ? "grayscale(100%)" : "none",
                }}
                alt="User Image"
            />

            {/* Overlay Container for Drop Zone */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: isDragging ? "auto" : "none"
            }}>
                <Element
                    id="image_overlay"
                    is={UserContainer}
                    canvas
                    layoutMode="canvas"
                    padding={20}
                    background="transparent"
                    width="100%"
                    minHeight="100%"
                    disableVisuals
                />
            </div>
        </motion.div>
    );
};

UserImage.craft = {
    displayName: "Image",
    props: {
        src: "https://placehold.co/600x400",
        sourceType: "url",
        fileName: "",
        width: "100%",
        height: "auto",
        padding: 0,
        margin: 0,
        background: "transparent",
        minHeight: "auto",
        borderRadius: 0,
        animationType: "none",
        animationDuration: 0.5,
        animationDelay: 0,
        align: "left",
        top: 0,
        left: 0,
        positionType: "relative", // Default to relative (flow)
    },
    related: {
        settings: ImageSettings,
    },
};
