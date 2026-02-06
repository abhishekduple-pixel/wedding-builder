import { useEditor, useNode } from "@craftjs/core";

export const useCanvasDrag = (top: number, left: number, actions: any) => {
    const { id, parent } = useNode((node) => ({
        parent: node.data.parent,
    }));

    const { parentLayoutMode } = useEditor((state) => {
        return {
            parentLayoutMode: parent ? state.nodes[parent].data.props.layoutMode : "flex"
        }
    });

    const isCanvas = parentLayoutMode === "canvas";

    const dragProps = isCanvas ? {
        drag: true,
        dragMomentum: false,
        onDragEnd: (e: any, info: any) => {
            const newTop = (top || 0) + info.offset.y;
            const newLeft = (left || 0) + info.offset.x;
            actions.setProp((props: any) => {
                props.top = newTop;
                props.left = newLeft;
            });
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
