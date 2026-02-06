"use client";

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
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { UserContainer } from "./Container";
import { useCanvasDrag } from "./hooks/useCanvasDrag";

export const ImageSettings = () => {
    const { actions: { setProp }, src, width, height, borderRadius, positionType } = useNode((node) => ({
        src: node.data.props.src,
        width: node.data.props.width,
        height: node.data.props.height,
        borderRadius: node.data.props.borderRadius,
        positionType: node.data.props.positionType,
    }));

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (reader.result) {
                    setProp((props: any) => props.src = reader.result);
                }
            }
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Image URL</Label>
                <Input
                    value={src}
                    onChange={(e) => setProp((props: any) => props.src = e.target.value)}
                    placeholder="https://..."
                />
            </div>

            <div className="space-y-2">
                <Label>Upload Image</Label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>

            <div className="space-y-2">
                <Label>Height</Label>
                <Input
                    value={height || ""}
                    onChange={(e) => setProp((props: any) => {
                        props.height = e.target.value;
                        props.minHeight = e.target.value;
                    })}
                    placeholder="e.g. 300px"
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

            {/* Position Settings (Canvas Mode) */}
            <div className="space-y-4 pt-4 border-t">
                <Label>Position (Canvas Mode)</Label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Top</Label>
                        <Input
                            value={useNode((node) => node.data.props.top).top || 0}
                            type="number"
                            onChange={(e) => setProp((props: any) => props.top = parseInt(e.target.value))}
                            disabled={positionType === "relative"}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-400">Left</Label>
                        <Input
                            value={useNode((node) => node.data.props.left).left || 0}
                            type="number"
                            onChange={(e) => setProp((props: any) => props.left = parseInt(e.target.value))}
                            disabled={positionType === "relative"}
                        />
                    </div>
                </div>
            </div>

            <StylesPanel />
        </div>
    );
};

export const UserImage = ({ src, width, height, borderRadius, padding, margin, background, minHeight, align, top, left, animationType, animationDuration, animationDelay, positionType, children, layoutMode }: any) => {
    const { connectors: { connect, drag }, selected, isActive, parent, node, childNodes } = useNode((state) => ({
        selected: state.events.selected,
        isActive: state.events.selected,
        parent: state.data.parent,
        node: state,
        childNodes: state.data.nodes,
    }));

    const { actions: editorActions, isDragging } = useEditor((state) => ({
        isDragging: !!state.events.dragged
    }));

    const [isResizing, setIsResizing] = React.useState(false);

    // Reset resizing when selection is lost
    React.useEffect(() => {
        if (!selected) {
            setIsResizing(false);
        }
    }, [selected]);

    // Access parent node to check if it's a "canvas" container
    const { actions: { setProp } } = useNode();
    const { isCanvas, dragProps, itemStyle } = useCanvasDrag(top, left, { setProp });

    // Enable free movement if parent is Canvas OR user explicitly selected "Free Movement" (absolute)
    const isFree = isCanvas || positionType === "absolute";

    const containerRef = useRef<HTMLDivElement | null>(null);

    const startResize = (corner: "top-left" | "top-right" | "bottom-left" | "bottom-right") => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const container = containerRef.current;
        if (!container) return;

        const parent = container.parentElement;
        const startRect = container.getBoundingClientRect();
        const parentRect = parent?.getBoundingClientRect();
        const parentWidth = parentRect?.width || startRect.width;

        const startX = e.clientX;
        const startY = e.clientY;

        const onMove = (ev: MouseEvent) => {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;

            let newWidth = startRect.width;
            let newHeight = startRect.height;

            if (corner === "top-left") {
                newWidth = startRect.width - dx;
                newHeight = startRect.height - dy;
            } else if (corner === "top-right") {
                newWidth = startRect.width + dx;
                newHeight = startRect.height - dy;
            } else if (corner === "bottom-left") {
                newWidth = startRect.width - dx;
                newHeight = startRect.height + dy;
            } else if (corner === "bottom-right") {
                newWidth = startRect.width + dx;
                newHeight = startRect.height + dy;
            }

            newWidth = Math.max(60, newWidth);
            newHeight = Math.max(60, newHeight);

            const widthPercent = Math.min(100, Math.max(5, (newWidth / parentWidth) * 100));

            setProp((props: any) => {
                props.width = `${widthPercent}%`;
                props.height = `${newHeight}px`;
                props.minHeight = `${newHeight}px`;
            });
        };

        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    return (
        <motion.div
            onDoubleClick={(e) => {
                e.stopPropagation();
                setIsResizing(true);
            }}
            ref={(ref: any) => {
                containerRef.current = ref;
                // If isFree (Canvas or Free Movement mode), handled by Framer Motion drag
                // Otherwise, standard Craft.js dnd
                if (isFree) {
                    connect(ref);
                } else {
                    connect(drag(ref));
                }
            }}

            {...dragProps}


            className={selected ? "ring-2 ring-blue-400" : ""}
            style={{
                width: width || "100%",
                height: height || "auto",
                minHeight: minHeight || "auto",
                position: isFree ? "absolute" : "relative",
                ...itemStyle,
                zIndex: selected ? 100 : 1,

                display: "flex",
                // Use alignSelf to position the image component itself within the parent flex container
                alignSelf: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",

                padding: getSpacing(padding),
                margin: getSpacing(margin),
                backgroundColor: background,
                borderRadius: `${borderRadius}px`,
                // Note: If standard flow, width might need to be less than 100% for alignment to be visible?
                // Actually, if we use 'alignItems' on the flex container, the child (img) will align.
                // But the 'width' prop here is applied to the wrapper <motion.div>.
                // So if the wrapper is 100% width, it fills the row. Content (img) inside it will align.
                // overflow: "hidden" // Removed overflow hidden to allow handles to be visible? No, handles are inside.
                // But overlay might need it. Let's keep it but careful with absolute children.
            }}
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <img
                src={src}
                style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                    borderRadius: `${borderRadius}px`
                }}
                alt="User Image"
            />

            {/* Resize handles */}
            {/* Resize handles */}
            {selected && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ borderRadius: `${borderRadius}px` }}
                >
                    <div
                        onMouseDown={startResize("top-left")}
                        className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-sm bg-white border border-blue-500 cursor-nwse-resize pointer-events-auto"
                    />
                    <div
                        onMouseDown={startResize("top-right")}
                        className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-sm bg-white border border-blue-500 cursor-nesw-resize pointer-events-auto"
                    />
                    <div
                        onMouseDown={startResize("bottom-left")}
                        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 rounded-sm bg-white border border-blue-500 cursor-nesw-resize pointer-events-auto"
                    />
                    <div
                        onMouseDown={startResize("bottom-right")}
                        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-sm bg-white border border-blue-500 cursor-nwse-resize pointer-events-auto"
                    />
                </div>
            )}

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
