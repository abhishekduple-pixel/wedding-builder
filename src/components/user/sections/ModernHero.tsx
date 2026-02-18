"use client";
"use no memo";

import { useNode, Element } from "@craftjs/core";
import React from "react";
import { UserContainer } from "../Container";
import { UserText } from "../Text";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { StylesPanel } from "@/components/editor/properties/StylesPanel";

export const ModernHeroSettings = () => {
    const { actions: { setProp }, imageLeft, imageCenter, imageRight, grayscaleSides, overlayOpacity } = useNode((node) => ({
        imageLeft: node.data.props.imageLeft,
        imageCenter: node.data.props.imageCenter,
        imageRight: node.data.props.imageRight,
        grayscaleSides: node.data.props.grayscaleSides,
        overlayOpacity: node.data.props.overlayOpacity,
    }));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: "imageLeft" | "imageCenter" | "imageRight") => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result) {
                setProp((props: any) => (props as any)[key] = reader.result);
            }
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Left Image URL</Label>
                <Input value={imageLeft} onChange={(e) => setProp((props: any) => props.imageLeft = e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Upload Left Image</Label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "imageLeft")}
                />
            </div>
            <div className="space-y-2">
                <Label>Center Image URL</Label>
                <Input value={imageCenter} onChange={(e) => setProp((props: any) => props.imageCenter = e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Upload Center Image</Label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "imageCenter")}
                />
            </div>
            <div className="space-y-2">
                <Label>Right Image URL</Label>
                <Input value={imageRight} onChange={(e) => setProp((props: any) => props.imageRight = e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Upload Right Image</Label>
                <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "imageRight")}
                />
            </div>
            <div className="flex items-center justify-between">
                <Label>Grayscale Sides</Label>
                <Switch checked={grayscaleSides} onCheckedChange={(c) => setProp((props: any) => props.grayscaleSides = c)} />
            </div>
            <div className="space-y-2">
                <Label>Overlay Opacity (0-1)</Label>
                <Input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="1" 
                    value={overlayOpacity} 
                    onChange={(e) => setProp((props: any) => props.overlayOpacity = parseFloat(e.target.value))} 
                />
            </div>
            <StylesPanel />
        </div>
    );
};

export const UserModernHero = ({ 
    imageLeft, 
    imageCenter, 
    imageRight, 
    grayscaleSides = true,
    overlayOpacity = 0.2,
    padding = 0,
    margin = 0
}: any) => {
    const { connectors: { connect, drag }, selected } = useNode((state) => ({
        selected: state.events.selected,
    }));

    const sideStyle = {
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: grayscaleSides ? "grayscale(100%)" : "none",
        minHeight: "600px"
    };

    const centerStyle = {
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "600px",
        position: "relative" as const
    };

    return (
        <div 
            ref={(ref: any) => connect(drag(ref))}
            className={`w-full flex flex-col md:flex-row ${selected ? "ring-2 ring-blue-500" : ""}`}
            style={{ padding: `${padding}px`, margin: `${margin}px` }}
        >
            {/* Left Column */}
            <div className="flex-1 hidden md:block" style={{ ...sideStyle, backgroundImage: `url(${imageLeft})` }} />

            {/* Center Column */}
            <div className="flex-[1.5] flex flex-col items-center justify-center text-center p-8 relative" style={{ ...centerStyle, backgroundImage: `url(${imageCenter})` }}>
                {/* Overlay */}
                <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />
                
                {/* Content */}
                <div className="relative z-10 space-y-4">
                     <Element
                        id="hero_title"
                        is={UserContainer}
                        canvas
                        background="transparent"
                        layoutMode="flex"
                        alignItems="center"
                        flexDirection="column"
                        gap={20}
                     >
                        <UserText
                            text=""
                            fontSize={14}
                            color="#ffffff"
                            fontFamily="'Montserrat', sans-serif"
                            textAlign="center"
                        />
                        <UserText
                            text=""
                            fontSize={64}
                            color="#ffffff"
                            fontFamily="'Playfair Display', serif"
                            fontWeight="bold"
                            textAlign="center"
                        />
                     </Element>
                </div>
            </div>

            {/* Right Column */}
            <div className="flex-1 hidden md:block" style={{ ...sideStyle, backgroundImage: `url(${imageRight})` }} />
        </div>
    );
};

UserModernHero.craft = {
    displayName: "Split Hero",
    props: {
        imageLeft: "https://images.unsplash.com/photo-1511285560982-1351cdeb9821?q=80&w=1974&auto=format&fit=crop",
        imageCenter: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1974&auto=format&fit=crop",
        imageRight: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2070&auto=format&fit=crop",
        grayscaleSides: true,
        overlayOpacity: 0.2,
        padding: 0,
        margin: 0
    },
    related: {
        settings: ModernHeroSettings
    }
};
