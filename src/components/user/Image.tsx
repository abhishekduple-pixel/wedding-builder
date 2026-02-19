"use client";
"use no memo";

import { useNode, useEditor, Element } from "@craftjs/core";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { AnimationSection, getAnimationVariants } from "./AnimationSection";
import { motion } from "framer-motion";
import { getSpacing, getResponsiveSpacing } from "@/lib/utils";
import { UserContainer } from "./Container";
import { useCanvasDrag } from "./hooks/useCanvasDrag";
import { useAppContext } from "../editor/AppContext";

export const ImageSettings = () => {
    const { actions: { setProp }, src, sourceType, fileName, background } = useNode((node) => ({
        src: node.data.props.src,
        sourceType: node.data.props.sourceType,
        fileName: node.data.props.fileName,
        background: node.data.props.background,
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Revoke previous blob URL to prevent memory leak
        if (typeof src === "string" && src.startsWith("blob:")) {
            URL.revokeObjectURL(src);
        }
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

            <div className="space-y-2 pt-4 border-t">
                <Label>Background Color</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={background && background !== "transparent" ? background : "#ffffff"}
                        className="w-8 h-8 p-1 border-none"
                        onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
                    />
                    <Input
                        value={background || ""}
                        placeholder="transparent or #hex"
                        onChange={(e) => setProp((props: any) => (props.background = e.target.value))}
                        className="h-8 flex-1"
                    />
                </div>
            </div>
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

    const { device } = useAppContext();
    const isMobile = device === "mobile";

    // Access parent node to check if it's a "canvas" container
    const { isCanvas, itemStyle } = useCanvasDrag(top, left);

    // Enable free movement if parent is Canvas OR user explicitly selected "Free Movement" (absolute)
    const isFree = isCanvas || positionType === "absolute";

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    // On mobile, force 100% width and constrain properly
    const responsiveWidth = device === "mobile" 
        ? "100%" 
        : (typeof width === 'number' ? `${width}px` : (width || "100%"));

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            style={{
                width: responsiveWidth,
                maxWidth: device === "mobile" ? "100%" : undefined,
                height: typeof height === 'number' ? `${height}px` : (height || "auto"),
                minHeight: typeof minHeight === 'number' ? `${minHeight}px` : (minHeight || "auto"),
                position: device === "mobile" ? "relative" : (isFree ? "absolute" : "relative"),
                ...(device === "mobile" ? { top: 0, left: 0 } : itemStyle),
                zIndex: selected ? 100 : 1,
                display: "flex",
                alignSelf: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
                padding: getSpacing(device === "mobile" ? getResponsiveSpacing(padding, device) : padding),
                margin: getSpacing(device === "mobile" ? getResponsiveSpacing(margin, device) : margin),
                backgroundColor: background,
                borderRadius: `${borderRadius}px`,
                overflow: "hidden", // Prevent image overflow
            }}
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <img
                src={src}
                style={{
                    width: "100%",
                    maxWidth: "100%",
                    height: "auto",
                    display: "block",
                    borderRadius: `${borderRadius}px`,
                    filter: grayscale ? "grayscale(100%)" : "none",
                    objectFit: device === "mobile" ? "cover" : "contain", // Use cover on mobile for better display
                }}
                alt="User Image"
            />

            {/* Overlay Container for Drop Zone - Hidden on mobile to prevent white lines */}
            {!isMobile && (
                <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "auto"
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
            )}
        </motion.div>
    );
};

UserImage.craft = {
    displayName: "Image",
    props: {
        src: "https://placehold.co/600x400",
        sourceType: "url",
        fileName: "",
        width: "400px",
        height: "300px",
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
