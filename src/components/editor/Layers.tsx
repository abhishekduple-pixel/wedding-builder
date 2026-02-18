"use client";
"use no memo";

import { useEditor } from "@craftjs/core";
import React from "react";
import { ChevronRight, ChevronDown, Box, Type, Image as ImageIcon, Video, Layers as LayersIcon } from "lucide-react";

export const Layers = () => {
    const { nodes, actions, selected } = useEditor((state) => ({
        nodes: state.nodes,
        selected: state.events.selected,
    }));

    const handleSelect = (id: string) => {
        actions.selectNode(id);
    };

    const getIcon = (displayName: string) => {
        switch (displayName) {
            case "Text": return <Type className="h-4 w-4" />;
            case "Image": return <ImageIcon className="h-4 w-4" />;
            case "Video": return <Video className="h-4 w-4" />;
            case "Container": return <Box className="h-4 w-4" />;
            default: return <LayersIcon className="h-4 w-4" />;
        }
    };

    const LayerItem = ({ id, depth = 0 }: { id: string, depth?: number }) => {
        const node = nodes[id];
        if (!node) return null;

        const isRoot = id === "ROOT";
        const isSelected = selected.has(id);
        const hasChildren = node.data.nodes && node.data.nodes.length > 0;
        // Simple state for expansion, default expanded
        const [expanded, setExpanded] = React.useState(true);

        return (
            <div className="select-none">
                <div
                    className={`
            flex items-center gap-2 py-2 px-2 cursor-pointer text-sm
            ${isSelected ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}
          `}
                    style={{ paddingLeft: `${depth * 12 + 12}px` }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(id);
                    }}
                >
                    {hasChildren ? (
                        <div
                            className="p-0.5 rounded-sm hover:bg-gray-200 cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                        >
                            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                        </div>
                    ) : (
                        <div className="w-4" /> // Spacer
                    )}

                    <span className="text-gray-500">
                        {getIcon(node.data.displayName)}
                    </span>

                    <span>
                        {node.data.custom.displayName || node.data.displayName}
                    </span>
                </div>

                {hasChildren && expanded && (
                    <div>
                        {node.data.nodes.map((childId) => (
                            <LayerItem key={childId} id={childId} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            <LayerItem id="ROOT" />
        </div>
    );
};
