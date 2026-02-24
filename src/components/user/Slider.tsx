"use client";
"use no memo";

import { useNode } from "@craftjs/core";
import React from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
import { StylesPanel } from "../editor/properties/StylesPanel";
import { getSpacing } from "@/lib/utils";
import { motion } from "framer-motion";
import { getAnimationVariants } from "./AnimationSection";
import { useCanvasDrag } from "./hooks/useCanvasDrag";

export const SliderSettings = () => {
    const { actions: { setProp }, min, max, step, defaultValue } = useNode((node) => ({
        min: node.data.props.min,
        max: node.data.props.max,
        step: node.data.props.step,
        defaultValue: node.data.props.defaultValue,
    }));

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                    <Label>Min</Label>
                    <Input
                        type="number"
                        value={min}
                        onChange={(e) => setProp((props: any) => props.min = parseInt(e.target.value))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Max</Label>
                    <Input
                        type="number"
                        value={max}
                        onChange={(e) => setProp((props: any) => props.max = parseInt(e.target.value))}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Step</Label>
                <Input
                    type="number"
                    value={step}
                    onChange={(e) => setProp((props: any) => props.step = parseInt(e.target.value))}
                />
            </div>
            <div className="space-y-2">
                <Label>Default Value</Label>
                <Slider
                    value={[defaultValue]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={(val) => setProp((props: any) => props.defaultValue = val[0])}
                />
            </div>
            <StylesPanel hideDimensions />
        </div>
    );
};

export const UserSlider = ({ min, max, step, defaultValue, padding, margin, width, height, background, borderRadius, animationType, animationDuration, animationDelay }: any) => {
    const { connectors: { connect, drag }, selected, actions: { setProp }, top, left } = useNode((state) => ({
        selected: state.events.selected,
        top: state.data.props.top || 0,
        left: state.data.props.left || 0,
    }));

    const variants = getAnimationVariants(animationType, animationDuration, animationDelay);
    const { itemStyle } = useCanvasDrag(top, left);

    return (
        <motion.div
            ref={(ref: any) => connect(drag(ref))}
            style={{
                width: typeof width === "number" ? `${width}px` : (width || "100%"),
                height: typeof height === "number" ? `${height}px` : undefined,
                padding: getSpacing(padding),
                margin: getSpacing(margin),
                background,
                borderRadius: borderRadius ? `${borderRadius}px` : undefined,
                ...itemStyle,
            }}
            className={selected ? "ring-2 ring-blue-400 p-2 rounded" : "p-2"}
            initial="initial"
            animate="animate"
            variants={variants as any}
        >
            <div
                className="min-w-0 flex-1"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerMove={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
            >
                <Slider
                    value={[defaultValue]}
                    min={min}
                    max={max}
                    step={step}
                    onValueChange={(val) => setProp((props: any) => (props.defaultValue = val[0]))}
                />
            </div>
        </motion.div>
    );
};

UserSlider.craft = {
    displayName: "Slider",
    props: {
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 50,
        padding: 0,
        margin: 0,
        width: "100%",
        height: undefined,
        top: 0,
        left: 0,
        background: "transparent",
        borderRadius: 0,
        animationType: "none",
        animationDuration: 0.5,
        animationDelay: 0,
    },
    related: {
        settings: SliderSettings,
    },
};
