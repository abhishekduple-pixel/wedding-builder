"use no memo";
import { useEditor, useNode } from "@craftjs/core";

export const useCanvasDrag = (top: number, left: number) => {
    const { parent } = useNode((node) => ({
        parent: node.data.parent,
    }));

    const { parentLayoutMode } = useEditor((state) => {
        const parentNode = parent && state.nodes[parent] ? state.nodes[parent] : null;
        return {
            parentLayoutMode: parentNode ? parentNode.data.props.layoutMode : "flex",
        }
    });

    const isFree = parentLayoutMode === "canvas";

    const itemStyle: React.CSSProperties = isFree ? {
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
    } : {
        position: "relative",
    };

    return {
        isCanvas: isFree,
        itemStyle
    };
};
