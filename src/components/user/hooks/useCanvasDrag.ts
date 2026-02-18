"use no memo";
import { useEditor, useNode } from "@craftjs/core";
import { useAppContext } from "../../editor/AppContext";

export const useCanvasDrag = (top: number, left: number) => {
    const { parent } = useNode((node) => ({
        parent: node.data.parent,
    }));

    const { device } = useAppContext();
    const isMobile = device === "mobile";

    const { parentLayoutMode } = useEditor((state) => {
        const parentNode = parent && state.nodes[parent] ? state.nodes[parent] : null;
        return {
            parentLayoutMode: parentNode ? parentNode.data.props.layoutMode : "flex",
        }
    });

    const isFree = parentLayoutMode === "canvas";

    // On mobile, convert absolute positioning to relative to prevent off-screen elements
    const itemStyle: React.CSSProperties = isFree && !isMobile ? {
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
    } : {
        position: "relative",
        top: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
    };

    return {
        isCanvas: isFree && !isMobile, // Don't treat as canvas on mobile
        itemStyle
    };
};
