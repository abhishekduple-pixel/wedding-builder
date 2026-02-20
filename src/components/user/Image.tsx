"use client";
"use no memo";

import { useNode, useEditor } from "@craftjs/core";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { AnimationSection, getAnimationVariants } from "./AnimationSection";
import { motion } from "framer-motion";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing, cn } from "@/lib/utils";
import { useCanvasDrag } from "./hooks/useCanvasDrag";
import { useAppContext } from "../editor/AppContext";

export const ImageSettings = () => {
    const { actions: { setProp }, src, width, height, background, borderRadius, minHeight, animationType, animationDuration, animationDelay, align } = useNode((node) => ({
        src: node.data.props.src,
        width: node.data.props.width,
        height: node.data.props.height,
        background: node.data.props.background,
        borderRadius: node.data.props.borderRadius,
        minHeight: node.data.props.minHeight,
        animationType: node.data.props.animationType,
        animationDuration: node.data.props.animationDuration,
        animationDelay: node.data.props.animationDelay,
        align: node.data.props.align,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Image URL</Label>
                {(() => {
                    const isUpload =
                        typeof src === "string" &&
                        (src.startsWith("blob:") || src.startsWith("data:"));

                    return (
                        <>
                            <Input
                                value={isUpload ? "" : (src || "")}
                                placeholder="https://..."
                                onChange={(e) =>
                                    setProp((props: any) => {
                                        props.src = e.target.value;
                                    })
                                }
                            />
                            {isUpload && (
                                <p className="text-[10px] text-gray-400">
                                    Using uploaded image. Enter a URL to replace it.
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
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        // Revoke previous blob URL to prevent memory leak
                        if (typeof src === "string" && src.startsWith("blob:")) {
                            URL.revokeObjectURL(src);
                        }
                        const objectUrl = URL.createObjectURL(file);
                        setProp((props: any) => {
                            props.src = objectUrl;
                        });
                    }}
                />
            </div>

            <div className="space-y-2">
                <Label>Alignment</Label>
                <ToggleGroup type="single" value={align || "center"} onValueChange={(val) => val && setProp((props: any) => props.align = val)}>
                    <ToggleGroupItem value="left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
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

            <StylesPanel />
            <AnimationSection />
        </div>
    );
};

export const UserImage = ({ src, width, height, padding, margin, background, borderRadius, minHeight, animationType, animationDuration, animationDelay, align, top, left, grayscale }: any): React.JSX.Element => {
    const { connectors: { connect, drag }, selected, actions: { setProp } } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled
    }));

    const { device } = useAppContext();

    const { itemStyle } = useCanvasDrag(top, left);

    // Adjust width for mobile - ensure it doesn't exceed container (mirror Video)
    const responsiveWidth = device === "mobile" && width && typeof width === "string" && width.includes("px")
        ? "100%"
        : (typeof width === 'number' ? `${width}px` : (width || "100%"));

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    const isImageUrl = !!src && (
        typeof src === "string" &&
        (src.startsWith("http") || src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/"))
    );

    const getJustifyContent = () => {
        switch (align) {
            case "left": return "flex-start";
            case "right": return "flex-end";
            case "center":
            default: return "center";
        }
    };

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            style={{
                width: responsiveWidth,
                maxWidth: device === "mobile" ? "100%" : undefined,
                height: typeof height === 'number' ? `${height}px` : (height || "auto"),
                minHeight: typeof minHeight === 'number' ? `${minHeight}px` : (minHeight || "auto"),
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                backgroundColor: background,
                borderRadius: `${borderRadius}px`,
                display: "flex",
                justifyContent: getJustifyContent(),
                alignSelf: getJustifyContent(),
                zIndex: selected ? 100 : 0, // 0 when not selected so text (z-index 1) always stacks on top, matching Video + text
                ...(device === "mobile" ? { position: "relative", top: 0, left: 0 } : itemStyle),
            }}
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <div style={{
                width: "100%",
                height: "100%",
                maxWidth: device === "mobile" ? "100%" : (responsiveWidth === "100%" ? "100%" : responsiveWidth),
                overflow: "hidden",
                borderRadius: `${borderRadius}px`,
            }}>
                {isImageUrl ? (
                    <img
                        src={src}
                        alt="User Image"
                        className={cn("w-full h-full object-contain", enabled && "pointer-events-none")}
                        style={{
                            borderRadius: `${borderRadius}px`,
                            filter: grayscale ? "grayscale(100%)" : "none",
                            objectFit: device === "mobile" ? "cover" : "contain",
                        }}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 min-h-[200px] rounded-md">
                        Enter an Image URL or upload an image
                    </div>
                )}
            </div>
        </motion.div>
    );
};

UserImage.craft = {
    displayName: "Image",
    props: {
        src: "",
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
        align: "center",
        top: 0,
        left: 0,
        grayscale: false,
    },
    related: {
        settings: ImageSettings,
    },
};
