"use no memo";
import { useEditor, useNode } from "@craftjs/core";

export const useCanvasDrag = (top: number, left: number, actions: any) => {
    const { parent, positionType } = useNode((node) => ({
        parent: node.data.parent,
        positionType: node.data.props.positionType,
    }));

    const { parentLayoutMode } = useEditor((state) => {
        const parentNode = parent && state.nodes[parent] ? state.nodes[parent] : null;
        return {
            parentLayoutMode: parentNode ? parentNode.data.props.layoutMode : "flex",
        }
    });

    const isFree = parentLayoutMode === "canvas" || (positionType === "absolute" && parentLayoutMode === "canvas");

    const dragProps = {};

    const itemStyle: React.CSSProperties = isFree ? {
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
    } : {
        position: "relative",
    };

    return {
        isCanvas: isFree,
        dragProps,
        itemStyle
    };
};
