"use client";

import { useNode, useEditor } from "@craftjs/core";
import { ROOT_NODE } from "@craftjs/utils";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Move, ArrowUp, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SNAP_GRID = 1;

export const RenderNode = ({ render }: { render: React.ReactNode }) => {
    const { id } = useNode();
    const { actions, query, isActive } = useEditor((state, query) => ({
        isActive: query.getEvent("selected").contains(id),
    }));

    const {
        isHovered,
        dom,
        name,
        moveable,
        deletable,
        connectors: { drag },
        parent,
        props,
    } = useNode((node) => ({
        isHovered: node.events.hovered,
        dom: node.dom,
        name: node.data.custom.displayName || node.data.displayName,
        moveable: query.node(node.id).isDraggable(),
        deletable: query.node(node.id).isDeletable(),
        parent: node.data.parent,
        props: node.data.props,
    }));

    const { parentLayoutMode } = useEditor((state) => {
        return {
            parentLayoutMode: parent && state.nodes[parent] ? state.nodes[parent].data.props.layoutMode : "flex"
        }
    });

    const isCanvas = parentLayoutMode === "canvas";
    const currentRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ top: 0, left: 0, width: 0, height: 0 });

    // Sync width/height/top/left when DOM changes or is active
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 });

    useEffect(() => {
        if (!dom) return;

        const update = () => {
            const rect = dom.getBoundingClientRect();
            setDimensions({
                width: rect.width,
                height: rect.height,
                top: rect.top,
                left: rect.left,
            });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(dom);

        return () => observer.disconnect();
    }, [dom, isActive, isHovered]);

    const handleToolbarDrag = (e: any, info: any) => {
        if (!isCanvas || !dom || !parent) return;
        
        const parentNode = query.node(parent).get();
        const parentDom = parentNode.dom;
        if (!parentDom) return;

        // Use clientWidth/Height for the parent's available content area
        const parentWidth = parentDom.clientWidth;
        const parentHeight = parentDom.clientHeight;
        
        const snap = (val: number) => Math.round(val / SNAP_GRID) * SNAP_GRID;

        actions.setProp(id, (p: any) => {
            let newTop = dragStartPos.current.top + info.offset.y;
            let newLeft = dragStartPos.current.left + info.offset.x;

            // Constrain within parent boundaries using captured dimensions
            newTop = Math.max(0, Math.min(newTop, parentHeight - dragStartPos.current.height));
            newLeft = Math.max(0, Math.min(newLeft, parentWidth - dragStartPos.current.width));

            p.top = snap(newTop);
            p.left = snap(newLeft);
        });
    };

    const resize = (direction: string, e: any, info: any) => {
        if (!dom || !parent) return;
        
        const parentNode = query.node(parent).get();
        const parentDom = parentNode.dom;
        if (!parentDom) return;
        const parentWidth = parentDom.clientWidth;
        const parentHeight = parentDom.clientHeight;
        
        actions.setProp(id, (props: any) => {
            // Get current numeric values or fallback to dom
            const currentWidth = typeof props.width === 'number' ? props.width : dom.offsetWidth;
            const currentHeight = typeof props.height === 'number' ? props.height : dom.offsetHeight;
            const currentLeft = typeof props.left === 'number' ? props.left : 0;
            const currentTop = typeof props.top === 'number' ? props.top : 0;

            const snap = (val: number) => Math.round(val / SNAP_GRID) * SNAP_GRID;

            if (direction.includes("right")) {
                const maxWidth = parentWidth - currentLeft;
                props.width = snap(Math.min(maxWidth, Math.max(20, currentWidth + info.delta.x)));
            }
            if (direction.includes("bottom")) {
                const maxHeight = parentHeight - currentTop;
                props.height = snap(Math.min(maxHeight, Math.max(20, currentHeight + info.delta.y)));
            }
            if (direction.includes("left")) {
                const deltaX = info.delta.x;
                let newLeft = currentLeft + deltaX;
                let newWidth = currentWidth - deltaX;

                if (newLeft < 0) {
                    newWidth += newLeft;
                    newLeft = 0;
                }
                
                if (newWidth >= 20) {
                    props.width = snap(newWidth);
                    props.left = snap(newLeft);
                }
            }
            if (direction.includes("top")) {
                const deltaY = info.delta.y;
                let newTop = currentTop + deltaY;
                let newHeight = currentHeight - deltaY;

                if (newTop < 0) {
                    newHeight += newTop;
                    newTop = 0;
                }

                if (newHeight >= 20) {
                    props.height = snap(newHeight);
                    props.top = snap(newTop);
                }
            }
        });
    };

    useEffect(() => {
        if (dom) {
            if (isActive || isHovered) {
                dom.classList.add("component-selected");
            } else {
                dom.classList.remove("component-selected");
            }
        }
    }, [dom, isActive, isHovered]);

    const getPos = (dom: HTMLElement) => {
        const { top, left, bottom } = dom.getBoundingClientRect();
        return {
            top: top > 0 ? top : bottom,
            left: left,
        };
    };

    const scroll = () => {
        const { current: currentDOM } = currentRef;

        if (!currentDOM || !dom) return;
        const rect = dom.getBoundingClientRect();
        currentDOM.style.top = `${rect.top}px`;
        currentDOM.style.left = `${rect.left}px`;
        currentDOM.style.width = `${rect.width}px`;
        currentDOM.style.height = `${rect.height}px`;
    };

    useEffect(() => {
        const container = document.querySelector(".craftjs-renderer");
        container?.addEventListener("scroll", scroll);
        window.addEventListener("resize", scroll);
        window.addEventListener("craftjs-element-drag", scroll);

        return () => {
            container?.removeEventListener("scroll", scroll);
            window.removeEventListener("resize", scroll);
            window.removeEventListener("craftjs-element-drag", scroll);
        };
    }, [dom]);

    return (
        <>
            {isActive || isHovered
                ? createPortal(
                    <div
                        ref={currentRef}
                        className="fixed z-9999 pointer-events-none"
                        style={{
                            left: dimensions.left,
                            top: dimensions.top,
                            width: dimensions.width,
                            height: dimensions.height,
                        }}
                    >
                        {/* Selection Border */}
                        <div className={`absolute inset-0 border-2 ${isActive ? 'border-blue-500' : 'border-blue-300 border-dashed'} transition-colors`} />

                        {/* Toolbar */}
                        <div
                            className="absolute bottom-full left-0 mb-1 flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded-t-sm text-[10px] font-medium pointer-events-auto shadow-sm"
                        >
                            <span className="mr-1">{name}</span>
                            {isActive && (
                                <>
                                    {moveable && (
                                        <motion.div
                                            className="cursor-move hover:bg-blue-600 p-0.5 rounded transition-colors"
                                            drag={isCanvas}
                                            dragMomentum={false}
                                            onDragStart={() => {
                                                if (dom) {
                                                    dragStartPos.current = {
                                                        top: props.top || 0,
                                                        left: props.left || 0,
                                                        width: dom.offsetWidth,
                                                        height: dom.offsetHeight
                                                    };
                                                }
                                            }}
                                            onDrag={handleToolbarDrag}
                                            ref={(ref: any) => !isCanvas && drag(ref)}
                                        >
                                            <Move size={12} />
                                        </motion.div>
                                    )}
                                    {id !== ROOT_NODE && (
                                        <button
                                            className="hover:bg-blue-600 p-0.5 rounded transition-colors"
                                            onClick={() => actions.selectNode(parent!)}
                                        >
                                            <ArrowUp size={12} />
                                        </button>
                                    )}
                                    {deletable && (
                                        <button
                                            className="hover:bg-red-600 p-0.5 rounded transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                actions.delete(id);
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Resize Handles - Only if active and canvas mode */}
                        {isActive && isCanvas && (
                            <>
                                {/* Corners */}
                                <motion.div
                                    className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize pointer-events-auto"
                                    drag
                                    dragMomentum={false}
                                    onDrag={(e, info) => resize("top-left", e, info)}
                                />
                                <motion.div
                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize pointer-events-auto"
                                    drag
                                    dragMomentum={false}
                                    onDrag={(e, info) => resize("top-right", e, info)}
                                />
                                <motion.div
                                    className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize pointer-events-auto"
                                    drag
                                    dragMomentum={false}
                                    onDrag={(e, info) => resize("bottom-left", e, info)}
                                />
                                <motion.div
                                    className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize pointer-events-auto"
                                    drag
                                    dragMomentum={false}
                                    onDrag={(e, info) => resize("bottom-right", e, info)}
                                />

                                {/* Sides */}
                                <motion.div
                                    className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-4 bg-white border border-blue-500 rounded-sm cursor-ew-resize pointer-events-auto"
                                    drag="x"
                                    dragMomentum={false}
                                    onDrag={(e, info) => resize("right", e, info)}
                                />
                                <motion.div
                                    className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-4 bg-white border border-blue-500 rounded-sm cursor-ew-resize pointer-events-auto"
                                    drag="x"
                                    dragMomentum={false}
                                    onDrag={(e, info) => resize("left", e, info)}
                                />
                                <motion.div
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white border border-blue-500 rounded-sm cursor-ns-resize pointer-events-auto"
                                    drag="y"
                                    dragMomentum={false}
                                    onDrag={(e, info) => resize("bottom", e, info)}
                                />
                                <motion.div
                                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white border border-blue-500 rounded-sm cursor-ns-resize pointer-events-auto"
                                    drag="y"
                                    dragMomentum={false}
                                    onDrag={(e, info) => resize("top", e, info)}
                                />
                            </>
                        )}
                    </div>,
                    document.body
                )
                : null}
            {render}
        </>
    );
};
