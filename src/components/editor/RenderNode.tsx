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

    const isCanvas = true; // Hybrid mode: everything is free-movable by default
    const currentRef = useRef<HTMLDivElement>(null);
    const dragStartPos = useRef({ top: 0, left: 0, width: 0, height: 0 });

    // Sync width/height/top/left when DOM changes or is active
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 });

    useEffect(() => {
        if (!dom) return;

        const update = () => {
            const container = document.querySelector(".craftjs-renderer") as HTMLElement | null;
            if (!container) return;

            const containerRect = container.getBoundingClientRect();
            const rect = dom.getBoundingClientRect();

            setDimensions({
                width: rect.width,
                height: rect.height,
                top: rect.top - containerRect.top,
                left: rect.left - containerRect.left,
            });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(dom);

        return () => observer.disconnect();
    }, [dom, isActive, isHovered, props.top, props.left, props.width, props.height]);

    // Unified Drag Handler for both Toolbar and Direct Component Drag
    const handleStartDrag = (e: React.PointerEvent | PointerEvent) => {
        if (!moveable || !isActive) return;

        // We only want to block interaction if we are actually dragging.
        // For the toolbar, we always drag.
        // For the component, we need to be careful not to block text selection if the user just clicks.
        // But since we are implementing "Free Move", usually left-click-drag IS move.
        // We will stop propagation to prevent other interactions during drag.

        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;

        // If we are currently "relative", we need to "snap" to absolute to start floating
        // We do this by calculating our current DOM offset relative to the parent
        let startLeft = props.left || 0;
        let startTop = props.top || 0;

        if (dom && parent) {
            const parentNode = query.node(parent).get();
            const parentDom = parentNode.dom;
            if (parentDom) {
                const parentRect = parentDom.getBoundingClientRect();
                const childRect = dom.getBoundingClientRect();

                // Ensure we have current visual coordinates as the starting point
                // This works even if we were 'relative' before
                startTop = childRect.top - parentRect.top;
                startLeft = childRect.left - parentRect.left;

                // Commit this snapshot immediately so we "lift" off the stack
                actions.setProp(id, (p: any) => {
                    p.positionType = "absolute";
                    p.top = startTop;
                    p.left = startLeft;
                    // Also capture dimensions to prevent collapsing if 'auto'
                    p.width = childRect.width;
                    p.height = childRect.height;
                });
            }
        }

        const parentNode = query.node(parent!).get();
        const parentDom = parentNode.dom;
        if (!parentDom) return;

        const parentWidth = parentDom.clientWidth;
        const parentHeight = parentDom.clientHeight;
        const domWidth = dom ? dom.offsetWidth : 0;
        const domHeight = dom ? dom.offsetHeight : 0;

        // We need to keep track of the initial position LOCALLY for the drag duration
        const initialTop = startTop;
        const initialLeft = startLeft;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            // Calculate new position based on the SNAPSHOT start position + delta
            let newTop = initialTop + deltaY;
            let newLeft = initialLeft + deltaX;

            const snap = (val: number) => Math.round(val / SNAP_GRID) * SNAP_GRID;

            // Constrain
            newTop = Math.max(0, Math.min(newTop, parentHeight - domHeight));
            newLeft = Math.max(0, Math.min(newLeft, parentWidth - domWidth));

            // Apply directly to state
            actions.setProp(id, (p: any) => {
                p.top = snap(newTop);
                p.left = snap(newLeft);
                p.positionType = "absolute";
            });

            // Force update visual elements immediately if possible (optimization)
            if (dom) {
                dom.style.top = `${newTop}px`;
                dom.style.left = `${newLeft}px`;
                dom.style.position = "absolute";
            }

            window.dispatchEvent(new CustomEvent("craftjs-element-drag"));
        };

        const onPointerUp = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
        };

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
    };

    // Attach handler to DOM for direct dragging
    useEffect(() => {
        if (dom && isActive && moveable) {
            // We use 'mousedown' or 'pointerdown'
            // We need to bind the extraction function
            // Note: We cast to any because TS might complain about Event vs PointerEvent types matching exactly
            dom.addEventListener("pointerdown", handleStartDrag as any);
            return () => {
                dom.removeEventListener("pointerdown", handleStartDrag as any);
            }
        }
    }, [dom, isActive, moveable, props.left, props.top]); // Dependencies need to include props to ensure closure captures fresh state? 
    // Actually, handleStartDrag reads props.left/top from closure.
    // If we define handleStartDrag INSIDE the component (which we are), 
    // then we need to re-bind it when props change, OR use refs for props.
    // Ideally, we should use refs for mutable values inside the event handler to avoid re-binding constantly.
    // BUT re-binding on prop change is acceptable for now.


    // Resizing Logic using standard Pointer Events (fixes double-movement issue)
    const handleResizeStart = (e: React.PointerEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dom || !parent) return;

        const parentNode = query.node(parent).get();
        const parentDom = parentNode.dom;
        if (!parentDom) return;

        const startX = e.clientX;
        const startY = e.clientY;

        const startWidth = dom.offsetWidth;
        const startHeight = dom.offsetHeight;
        const startLeft = props.left || 0;
        const startTop = props.top || 0;

        const parentWidth = parentDom.clientWidth;
        const parentHeight = parentDom.clientHeight;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            actions.setProp(id, (p: any) => {
                const snap = (val: number) => Math.round(val / SNAP_GRID) * SNAP_GRID;

                if (direction.includes("right")) {
                    const maxWidth = parentWidth - startLeft;
                    p.width = snap(Math.min(maxWidth, Math.max(20, startWidth + deltaX)));
                }
                if (direction.includes("bottom")) {
                    const maxHeight = parentHeight - startTop;
                    p.height = snap(Math.min(maxHeight, Math.max(20, startHeight + deltaY)));
                }
                if (direction.includes("left")) {
                    let newLeft = startLeft + deltaX;
                    let newWidth = startWidth - deltaX;

                    if (newLeft < 0) {
                        newWidth += newLeft;
                        newLeft = 0;
                    }

                    if (newWidth >= 20) {
                        p.width = snap(newWidth);
                        p.left = snap(newLeft);
                    }
                }
                if (direction.includes("top")) {
                    const deltaY = moveEvent.clientY - startY;
                    let newTop = startTop + deltaY;
                    let newHeight = startHeight - deltaY;

                    if (newTop < 0) {
                        newHeight += newTop;
                        newTop = 0;
                    }

                    if (newHeight >= 20) {
                        p.height = snap(newHeight);
                        p.top = snap(newTop);
                    }
                }
            });
        };

        const onPointerUp = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
            document.body.style.cursor = "default";
        };

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
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

        const container = document.querySelector(".craftjs-renderer") as HTMLElement | null;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const rect = dom.getBoundingClientRect();

        currentDOM.style.top = `${rect.top - containerRect.top}px`;
        currentDOM.style.left = `${rect.left - containerRect.left}px`;
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
                        className="absolute z-9999 pointer-events-none"
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
                                        <div
                                            className="cursor-move hover:bg-blue-600 p-0.5 rounded transition-colors"
                                            onPointerDown={handleStartDrag}
                                        >
                                            <Move size={12} />
                                        </div>
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
                                <div
                                    className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize pointer-events-auto"
                                    onPointerDown={(e) => handleResizeStart(e, "top-left")}
                                />
                                <div
                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize pointer-events-auto"
                                    onPointerDown={(e) => handleResizeStart(e, "top-right")}
                                />
                                <div
                                    className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full cursor-nesw-resize pointer-events-auto"
                                    onPointerDown={(e) => handleResizeStart(e, "bottom-left")}
                                />
                                <div
                                    className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border-2 border-blue-500 rounded-full cursor-nwse-resize pointer-events-auto"
                                    onPointerDown={(e) => handleResizeStart(e, "bottom-right")}
                                />

                                {/* Sides */}
                                <div
                                    className="absolute top-1/2 -right-1 -translate-y-1/2 w-1.5 h-4 bg-white border border-blue-500 rounded-sm cursor-ew-resize pointer-events-auto"
                                    onPointerDown={(e) => handleResizeStart(e, "right")}
                                />
                                <div
                                    className="absolute top-1/2 -left-1 -translate-y-1/2 w-1.5 h-4 bg-white border border-blue-500 rounded-sm cursor-ew-resize pointer-events-auto"
                                    onPointerDown={(e) => handleResizeStart(e, "left")}
                                />
                                <div
                                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white border border-blue-500 rounded-sm cursor-ns-resize pointer-events-auto"
                                    onPointerDown={(e) => handleResizeStart(e, "bottom")}
                                />
                                <div
                                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-white border border-blue-500 rounded-sm cursor-ns-resize pointer-events-auto"
                                    onPointerDown={(e) => handleResizeStart(e, "top")}
                                />
                            </>
                        )}
                    </div>,
                    (document.querySelector(".craftjs-renderer") as HTMLElement | null) || document.body
                )
                : null}
            {render}
        </>
    );
};
