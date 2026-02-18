"use no memo";
import { useEditor, useNode } from "@craftjs/core";
import { useRef } from "react";

const SNAP_GRID = 1;

export const useCanvasDrag = (top: number, left: number, actions: any) => {
    const { parent, dom, positionType } = useNode((node) => ({
        parent: node.data.parent,
        dom: node.dom,
        positionType: node.data.props.positionType,
    }));

    const { parentLayoutMode, parentDom } = useEditor((state) => {
        const parentNode = parent && state.nodes[parent] ? state.nodes[parent] : null;
        return {
            parentLayoutMode: parentNode ? parentNode.data.props.layoutMode : "flex",
            parentDom: parentNode ? parentNode.dom : null
        }
    });

    const isFree = parentLayoutMode === "canvas" || (positionType === "absolute" && parentLayoutMode === "canvas");

    const dragStartPos = useRef({ top: 0, left: 0, width: 0, height: 0 });

    const dragProps = isFree ? {
        drag: true as const,
        dragMomentum: false,
        dragElastic: 0,
        // Critical: when we "commit" the new position into Craft props (top/left),
        // we must ensure Framer's drag transform doesn't remain applied, otherwise the
        // element ends up offset from the drop point (often double-applied).
        dragSnapToOrigin: true,
        onDragStart: () => {
            if (!dom) return;
            dragStartPos.current = {
                top: top || 0,
                left: left || 0,
                width: dom.offsetWidth,
                height: dom.offsetHeight,
            };
        },
        onDrag: () => {
            window.dispatchEvent(new CustomEvent("craftjs-element-drag"));
        },
        onDragEnd: (_e: any, info: any) => {
            if (!parentDom) return;

            const parentWidth = parentDom.clientWidth;
            const parentHeight = parentDom.clientHeight;

            let newTop = dragStartPos.current.top + info.offset.y;
            let newLeft = dragStartPos.current.left + info.offset.x;

            const snap = (val: number) => Math.round(val / SNAP_GRID) * SNAP_GRID;

            newTop = Math.max(0, Math.min(newTop, parentHeight - dragStartPos.current.height));
            newLeft = Math.max(0, Math.min(newLeft, parentWidth - dragStartPos.current.width));

            actions.setProp((props: any) => {
                props.top = snap(newTop);
                props.left = snap(newLeft);
            });

            setTimeout(() => {
                window.dispatchEvent(new CustomEvent("craftjs-element-drag"));
            }, 0);
        }
    } : {};

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
