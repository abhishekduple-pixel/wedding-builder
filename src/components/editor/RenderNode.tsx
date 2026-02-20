"use client";
"use no memo";

import { useNode, useEditor } from "@craftjs/core";
import { ROOT_NODE } from "@craftjs/utils";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Move, ArrowUp, Trash2 } from "lucide-react";

export const RenderNode = ({ render }: { render: React.ReactNode }) => {
    const { id } = useNode();
    const { actions, query, isActive, enabled } = useEditor((state, query) => ({
        isActive: query.getEvent("selected").contains(id),
        enabled: state.options.enabled,
    }));

    const {
        isHovered,
        dom,
        name,
        moveable,
        deletable,
        connectors: {},
        parent,
        props,
        childIds,
    } = useNode((node) => ({
        isHovered: node.events.hovered,
        dom: node.dom,
        name: node.data.custom.displayName || node.data.displayName,
        moveable: query.node(node.id).isDraggable(),
        deletable: query.node(node.id).isDeletable(),
        parent: node.data.parent,
        props: node.data.props,
        childIds: [...(node.data?.nodes || []), ...Object.values(node.data?.linkedNodes || {})],
    }));

    // Sync width/height/top/left when DOM changes or is active
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, top: 0, left: 0 });

    useEffect(() => {
        if (!dom) return;

        const update = () => {
            const container = document.querySelector(".editor-canvas-root") as HTMLElement | null;
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
        const rafId = requestAnimationFrame(update);
        const observer = new ResizeObserver(update);
        observer.observe(dom);

        return () => {
            cancelAnimationFrame(rafId);
            observer.disconnect();
        };
    }, [dom, isActive, isHovered, props.top, props.left, props.width, props.height]);

    // Single unified free-move logic: used by both toolbar Move icon and canvas (drag element).
    // Always moves by updating top/left; converts to absolute + measures from DOM when needed.
    const startFreeMove = (e: React.PointerEvent | PointerEvent) => {
        if (!moveable) return;

        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;

        let startLeft = props.left ?? 0;
        let startTop = props.top ?? 0;

        if (props.positionType !== "absolute" && dom && parent) {
            const parentNode = query.node(parent).get();
            let parentDomForRect = parentNode?.dom;
            if (!parentDomForRect && parent === ROOT_NODE) {
                parentDomForRect = document.querySelector(".editor-canvas-root") as HTMLElement | null;
            }
            if (parentDomForRect) {
                const parentRect = parentDomForRect.getBoundingClientRect();
                const childRect = dom.getBoundingClientRect();
                startTop = childRect.top - parentRect.top;
                startLeft = childRect.left - parentRect.left;
                actions.setProp(id, (p: any) => {
                    p.positionType = "absolute";
                    p.top = startTop;
                    p.left = startLeft;
                    p.width = childRect.width;
                    p.height = childRect.height;
                });
            }
        }

        if (!parent) return;
        const parentNode = query.node(parent).get();
        if (!parentNode) return;
        let parentDom = parentNode.dom;
        // When the parent is the root container, its dom may not be set in the store yet; use the canvas root as fallback so move works in the main container
        if (!parentDom && parent === ROOT_NODE) {
            parentDom = document.querySelector(".editor-canvas-root") as HTMLElement | null;
        }
        if (!parentDom) return;

        const parentWidth = parentDom.clientWidth;
        const parentHeight = parentDom.clientHeight;
        const domWidth = dom ? dom.offsetWidth : 0;
        const domHeight = dom ? dom.offsetHeight : 0;
        const initialTop = startTop;
        const initialLeft = startLeft;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;
            let newTop = initialTop + deltaY;
            let newLeft = initialLeft + deltaX;
            newTop = Math.max(0, Math.min(newTop, parentHeight - domHeight));
            newLeft = Math.max(0, Math.min(newLeft, parentWidth - domWidth));
            actions.setProp(id, (p: any) => {
                p.top = Math.round(newTop);
                p.left = Math.round(newLeft);
                p.positionType = "absolute";
            });
            window.dispatchEvent(new CustomEvent("craftjs-element-drag"));
        };

        const onPointerUp = () => {
            document.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("pointerup", onPointerUp);
        };

        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("pointerup", onPointerUp);
    };

    const startFreeMoveRef = useRef(startFreeMove);
    startFreeMoveRef.current = startFreeMove;
    const childIdsRef = useRef<string[]>(childIds);
    childIdsRef.current = childIds;

    useEffect(() => {
        if (!dom || !moveable) return;

        const onCanvasPointerDown = (event: PointerEvent) => {
            if (!dom.contains(event.target as Node)) return;
            // Don't steal selection from child nodes: if the click is inside a child node's DOM, let the child handle it.
            // Exception: children with disableVisuals (e.g. Image's drop overlay) are passthrough - treat the click as on this node so canvas move works.
            const isClickOnRealChild = childIdsRef.current.some((childId: string) => {
                const childNode = query.node(childId).get();
                if (!childNode?.dom?.contains(event.target as Node)) return false;
                const isPassthroughOverlay = childNode.data?.props?.disableVisuals === true;
                return !isPassthroughOverlay; // only "real" children steal the click
            });
            if (isClickOnRealChild) return;
            event.preventDefault();
            event.stopPropagation();
            actions.selectNode(id);
            // Clear hover so the blue dotted outline disappears on selection (avoids persistent hover on containers/siblings)
            (actions as any).setNodeEvent?.("hovered", null);
            startFreeMoveRef.current(event);
        };

        dom.addEventListener("pointerdown", onCanvasPointerDown, true);

        return () => {
            dom.removeEventListener("pointerdown", onCanvasPointerDown, true);
        };
    }, [dom, moveable, enabled]);

    // Resizing Logic using standard Pointer Events
    const handleResizeStart = (e: React.PointerEvent, direction: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dom || !parent) return;

        const parentNode = query.node(parent).get();
        if (!parentNode) return;
        let parentDom = parentNode.dom;
        if (!parentDom && parent === ROOT_NODE) {
            parentDom = document.querySelector(".editor-canvas-root") as HTMLElement | null;
        }
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
                if (direction.includes("right")) {
                    const maxWidth = parentWidth - startLeft;
                    p.width = Math.round(Math.min(maxWidth, Math.max(20, startWidth + deltaX)));
                }
                if (direction.includes("bottom")) {
                    const maxHeight = parentHeight - startTop;
                    p.height = Math.round(Math.min(maxHeight, Math.max(20, startHeight + deltaY)));
                }
                if (direction.includes("left")) {
                    let newLeft = startLeft + deltaX;
                    let newWidth = startWidth - deltaX;

                    if (newLeft < 0) {
                        newWidth += newLeft;
                        newLeft = 0;
                    }

                    if (newWidth >= 20) {
                        p.width = Math.round(newWidth);
                        p.left = Math.round(newLeft);
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
                        p.height = Math.round(newHeight);
                        p.top = Math.round(newTop);
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

    // In Preview (enabled=false), no selection overlay, toolbar, or resize handles — view only
    if (!enabled) {
        return <>{render}</>;
    }

    return (
        <>
            {isActive || isHovered
                ? createPortal(
                    <div
                        className="absolute z-10 pointer-events-none"
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
                                            onPointerDown={(e) => startFreeMove(e)}
                                        >
                                            <Move size={12} />
                                        </div>
                                    )}
                                    {id !== ROOT_NODE && (
                                        <button
                                            className="hover:bg-blue-600 p-0.5 rounded transition-colors"
                                            onClick={() => parent && actions.selectNode(parent)}
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

                        {/* Resize Handles */}
                        {isActive && (
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
                    (document.querySelector(".editor-canvas-root") as HTMLElement | null) || document.body
                )
                : null}
            {render}
        </>
    );
};
