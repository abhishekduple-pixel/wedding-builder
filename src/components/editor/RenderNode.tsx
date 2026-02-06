"use client";

import { useNode, useEditor } from "@craftjs/core";
import { ROOT_NODE } from "@craftjs/utils";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Move, ArrowUp, Trash2 } from "lucide-react";

export const RenderNode = ({ render }: { render: React.ReactNode }) => {
    const { id } = useNode();
    const { actions, query, isActive } = useEditor((_, query) => ({
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
    } = useNode((node) => ({
        isHovered: node.events.hovered,
        dom: node.dom,
        name: node.data.custom.displayName || node.data.displayName,
        moveable: query.node(node.id).isDraggable(),
        deletable: query.node(node.id).isDeletable(),
        parent: node.data.parent,
    }));

    const currentRef = useRef<HTMLDivElement>(null);

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
        const { top, left } = getPos(dom);
        currentDOM.style.top = `${top}px`;
        currentDOM.style.left = `${left}px`;
    };

    useEffect(() => {
        document.querySelector(".craftjs-renderer")?.addEventListener("scroll", scroll);

        return () => {
            document.querySelector(".craftjs-renderer")?.removeEventListener("scroll", scroll);
        };
    }, [dom]);

    return (
        <>
            {isHovered || isActive
                ? createPortal(
                    <div
                        ref={currentRef}
                        className="px-2 py-2 text-white bg-blue-500 fixed flex items-center gap-2 rounded-t-lg z-[9999] text-xs shadow-md transform -translate-y-full ml-[-1px] mt-[-1px] pointer-events-none"
                        style={{
                            left: getPos(dom!).left,
                            top: getPos(dom!).top,
                        }}
                    >
                        <h2 className="flex-1 mr-2 font-medium">{name}</h2>
                        {isActive && (
                            <>
                                {moveable ? (
                                    <div
                                        className="cursor-move mr-1 pointer-events-auto hover:text-gray-200"
                                        ref={(ref: any) => drag(ref)}
                                    >
                                        <Move size={14} />
                                    </div>
                                ) : null}
                                {id !== ROOT_NODE && (
                                    <div
                                        className="cursor-pointer mr-1 pointer-events-auto hover:text-gray-200"
                                        onClick={() => {
                                            actions.selectNode(parent!);
                                        }}
                                    >
                                        <ArrowUp size={14} />
                                    </div>
                                )}
                                {deletable ? (
                                    <div
                                        className="cursor-pointer pointer-events-auto hover:text-red-200"
                                        onMouseDown={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            actions.delete(id);
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </div>
                                ) : null}
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
