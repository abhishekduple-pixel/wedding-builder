"use client";

import { useNode, useEditor } from "@craftjs/core";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { AnimationSection, getAnimationVariants } from "./AnimationSection";
import { motion } from "framer-motion";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing, cn } from "@/lib/utils";
import { useCanvasDrag } from "./hooks/useCanvasDrag";

export const VideoSettings = () => {
    const { actions: { setProp }, url, width, height, padding, margin, background, borderRadius, minHeight, autoplay, loop, controls, animationType, animationDuration, animationDelay, align, top, left } = useNode((node) => ({
        url: node.data.props.url,
        width: node.data.props.width,
        height: node.data.props.height,
        padding: node.data.props.padding,
        margin: node.data.props.margin,
        background: node.data.props.background,
        borderRadius: node.data.props.borderRadius,
        minHeight: node.data.props.minHeight,
        autoplay: node.data.props.autoplay,
        loop: node.data.props.loop,
        controls: node.data.props.controls,
        animationType: node.data.props.animationType,
        animationDuration: node.data.props.animationDuration,
        animationDelay: node.data.props.animationDelay,
        align: node.data.props.align,
        top: node.data.props.top,
        left: node.data.props.left,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Video URL (YouTube, Vimeo, or Direct .mp4)</Label>
                <Input
                    value={url || ""}
                    placeholder="https://..."
                    onChange={(e) => setProp((props: any) => props.url = e.target.value)}
                />
            </div>

            <div className="space-y-2">
                <Label>Upload Video</Label>
                <Input
                    type="file"
                    accept="video/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                            if (reader.result) {
                                setProp((props: any) => props.url = reader.result);
                            }
                        };
                        reader.readAsDataURL(file);
                    }}
                />
            </div>

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

            <div className="space-y-2">
                <Label>Alignment</Label>
                <ToggleGroup type="single" value={align || "center"} onValueChange={(val) => val && setProp((props: any) => props.align = val)}>
                    <ToggleGroupItem value="left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className="flex items-center justify-between">
                <Label>Autoplay</Label>
                <Switch
                    checked={autoplay}
                    onCheckedChange={(val) => setProp((props: any) => props.autoplay = val)}
                />
            </div>

            <div className="flex items-center justify-between">
                <Label>Loop</Label>
                <Switch
                    checked={loop}
                    onCheckedChange={(val) => setProp((props: any) => props.loop = val)}
                />
            </div>

            <div className="flex items-center justify-between">
                <Label>Controls</Label>
                <Switch
                    checked={controls}
                    onCheckedChange={(val) => setProp((props: any) => props.controls = val)}
                />
            </div>

            <StylesPanel />
            <AnimationSection />
        </div>
    );
};

export const UserVideo = ({ url, width, height, padding, margin, background, borderRadius, minHeight, autoplay, loop, controls, animationType, animationDuration, animationDelay, align, top, left }: any): React.JSX.Element => {
    const { connectors: { connect, drag }, selected, actions: { setProp } } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled
    }));

    const { isCanvas, dragProps, itemStyle } = useCanvasDrag(top, left, { setProp });

    const getEmbedUrl = (url: string) => {
        if (!url) return "";

        // If this is an inline data: video URL from an upload,
        // we want to use the <video> tag instead of an iframe.
        if (url.startsWith("data:video")) {
            return "";
        }
        
        // Robust YouTube Parser
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
        if (ytMatch && ytMatch[1]) {
            return `https://www.youtube.com/embed/${ytMatch[1]}`;
        }

        // Robust Vimeo Parser (Handles channels, groups, and standard links)
        // Extracts the numeric ID safely
        const vimeoMatch = url.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
        if (vimeoMatch && vimeoMatch[1]) {
            return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
        }
        
        return url;
    }

    const embedUrl = getEmbedUrl(url);
    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

    const isVideoFile =
        !!url &&
        (
            url.toLowerCase().endsWith(".mp4") ||
            url.toLowerCase().endsWith(".webm") ||
            url.startsWith("data:video")
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
            ref={(ref: any) => {
                if (isCanvas) {
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
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                backgroundColor: background,
                borderRadius: `${borderRadius}px`,
                display: "flex",
                justifyContent: getJustifyContent(),
                alignSelf: getJustifyContent(),
                ...itemStyle,
            }}
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <div style={{ width: "100%", height: "100%", aspectRatio: "16/9", maxWidth: width === "100%" ? "100%" : width }}>
                {isVideoFile ? (
                    <video
                        src={url}
                        className={cn("w-full h-full object-cover", enabled && "pointer-events-none")}
                        autoPlay={autoplay}
                        loop={loop}
                        controls={controls}
                        muted={autoplay} // Autoplay usually requires muted
                        style={{ borderRadius: `${borderRadius}px` }}
                    />
                ) : embedUrl ? (
                    <iframe
                        src={embedUrl}
                        className={cn("w-full h-full", enabled && "pointer-events-none")}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ borderRadius: `${borderRadius}px` }}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 aspect-video rounded-md">
                        Enter a Video URL (YouTube, Vimeo, or .mp4)
                    </div>
                )}
            </div>
        </motion.div>
    );
};

UserVideo.craft = {
    displayName: "Video",
    props: {
        url: "",
        width: "100%",
        height: "auto",
        padding: 0,
        margin: 0,
        background: "transparent",
        minHeight: "auto",
        borderRadius: 0,
        autoplay: false,
        loop: false,
        controls: true,
        animationType: "none",
        animationDuration: 0.5,
        animationDelay: 0,
        align: "center",
        top: 0,
        left: 0,
    },
    related: {
        settings: VideoSettings,
    },
};
