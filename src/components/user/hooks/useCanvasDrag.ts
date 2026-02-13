import { useEditor, useNode } from "@craftjs/core";
import { useRef } from "react";

const SNAP_GRID = 5;

export const useCanvasDrag = (top: number, left: number, actions: any) => {
    const dragStartPos = useRef({ top: 0, left: 0 });
    const { id, parent, dom } = useNode((node) => ({
        parent: node.data.parent,
        dom: node.dom
    }));

    const { parentLayoutMode, parentDom } = useEditor((state) => {
        const parentNode = parent && state.nodes[parent] ? state.nodes[parent] : null;
        return {
            parentLayoutMode: parentNode ? parentNode.data.props.layoutMode : "flex",
            parentDom: parentNode ? parentNode.dom : null
        }
    });

    const isCanvas = parentLayoutMode === "canvas";

    const dragProps = isCanvas ? {
        drag: true as const,
        dragMomentum: false,
        dragConstraints: parentDom ? { current: parentDom } : undefined,
        dragElastic: 0,
        layout: true, // Enable Framer Motion layout projection
        onDrag: () => {
            // Force the selection border to follow the visual DOM element in real-time
            window.dispatchEvent(new CustomEvent("craftjs-element-drag"));
        },
        onDragEnd: (e: any, info: any) => {
            if (!dom || !parentDom) return;

            // 1. Get the current visual position of the element relative to the viewport
            const rect = dom.getBoundingClientRect();
            
            // 2. Get the parent's position relative to the viewport
            const parentRect = parentDom.getBoundingClientRect();
            
            // 3. The true relative position is simply the difference
            // This ignores all previous state, offsets, and math - it's just "where is it right now?"
            let newLeft = rect.left - parentRect.left;
            let newTop = rect.top - parentRect.top;

            const snap = (val: number) => Math.round(val / SNAP_GRID) * SNAP_GRID;

            // 4. Update the persistent state to match this exact visual location
            actions.setProp((props: any) => {
                props.top = snap(newTop);
                props.left = snap(newLeft);
            });
            
            // 5. Final sync to snap the selection border to the new state position
            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("craftjs-element-drag"));
            }, 0);
        }
    } : {};

    const itemStyle: React.CSSProperties = isCanvas ? {
        position: "absolute",
        top: `${top}px`,
        left: `${left}px`,
    } : {
        position: "relative",
    };

    return {
        isCanvas,
        dragProps,
        itemStyle
    };
};
