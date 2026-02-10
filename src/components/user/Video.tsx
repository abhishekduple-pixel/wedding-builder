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

export const VideoSettings = () => {
    const { actions: { setProp }, url, align } = useNode((node) => ({
        url: node.data.props.url,
        align: node.data.props.align,
    }));

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Video URL</Label>
                <Input
                    value={url}
                    onChange={(e) => setProp((props: any) => props.url = e.target.value)}
                    placeholder="YouTube, Vimeo, or MP4 link"
                />
                <p className="text-xs text-gray-500">Supports YouTube, Vimeo, MP4</p>
            </div>

            <div className="space-y-2">
                <Label>Alignment</Label>
                <ToggleGroup type="single" value={align || "center"} onValueChange={(val) => val && setProp((props: any) => props.align = val)}>
                    <ToggleGroupItem value="left" aria-label="Align Left"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="center" aria-label="Align Center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
                    <ToggleGroupItem value="right" aria-label="Align Right"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <Label>Autoplay (MP4 only)</Label>
                    <Switch
                        checked={useNode((node) => node.data.props.autoplay).autoplay}
                        onCheckedChange={(checked) => setProp((props: any) => props.autoplay = checked)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label>Loop (MP4 only)</Label>
                    <Switch
                        checked={useNode((node) => node.data.props.loop).loop}
                        onCheckedChange={(checked) => setProp((props: any) => props.loop = checked)}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <Label>Show Controls</Label>
                    <Switch
                        checked={useNode((node) => node.data.props.controls).controls}
                        onCheckedChange={(checked) => setProp((props: any) => props.controls = checked)}
                    />
                </div>
            </div>

            <StylesPanel />
        </div>
    );
};

export const UserVideo = ({ url, width, padding, margin, background, borderRadius, minHeight, autoplay, loop, controls, animationType, animationDuration, animationDelay, align }: any): React.JSX.Element => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const { enabled } = useEditor((state) => ({
        enabled: state.options.enabled
    }));

    const getEmbedUrl = (url: string) => {
        if (!url) return "";
        
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

    const isVideoFile = url?.toLowerCase().endsWith(".mp4") || url?.toLowerCase().endsWith(".webm");

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
            className={selected ? "ring-2 ring-blue-400" : ""}
            style={{
                width: width || "100%",
                minHeight: minHeight || "auto",
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                backgroundColor: background,
                borderRadius: `${borderRadius}px`,
                display: "flex",
                justifyContent: getJustifyContent(),
                alignSelf: getJustifyContent(),
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
    },
    related: {
        settings: VideoSettings,
    },
};
