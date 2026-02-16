"use client";

import { useNode, useEditor } from "@craftjs/core";
import React from "react";
import { Slider } from "../ui/slider";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { AlignLeft, AlignCenter, AlignRight, LayoutTemplate, Rows, Columns } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimationSection, getAnimationVariants } from "./AnimationSection";
import { motion } from "framer-motion";
import { SpacingControl } from "../editor/properties/SpacingControl";
import { useCanvasDrag } from "./hooks/useCanvasDrag";

export const ContainerSettings = () => {
  const { actions: { setProp }, id, background, padding, margin, flexDirection, alignItems, justifyContent, flexWrap, gap, borderRadius, backgroundImage, height, minHeight, width, layoutMode, gridColumns, dom } = useNode((node) => ({
    id: node.id,
    background: node.data.props.background,
    padding: node.data.props.padding,
    margin: node.data.props.margin,
    flexDirection: node.data.props.flexDirection,
    alignItems: node.data.props.alignItems,
    justifyContent: node.data.props.justifyContent,
    flexWrap: node.data.props.flexWrap,
    gap: node.data.props.gap,
    borderRadius: node.data.props.borderRadius,
    backgroundImage: node.data.props.backgroundImage,
    height: node.data.props.height,
    minHeight: node.data.props.minHeight,
    width: node.data.props.width,
    layoutMode: node.data.props.layoutMode,
    gridColumns: node.data.props.gridColumns,
    dom: node.dom
  }));

  const { query, actions: editorActions } = useEditor();

  const handleLayoutChange = (val: string) => {
    if (!val) return;

    // If switching TO canvas, snapshot child positions to prevent them from jumping to (0,0)
    if (val === "canvas" && layoutMode !== "canvas" && dom) {
      const containerRect = dom.getBoundingClientRect();
      const childNodes = query.node(id).get().data.nodes;

      childNodes.forEach((childId: string) => {
        const childNode = query.node(childId).get();
        const childDom = childNode.dom;

        if (childDom) {
          const childRect = childDom.getBoundingClientRect();
          
          // Calculate relative position
          const relativeTop = childRect.top - containerRect.top;
          const relativeLeft = childRect.left - containerRect.left;

          editorActions.setProp(childId, (props: any) => {
            props.top = Math.round(relativeTop);
            props.left = Math.round(relativeLeft);
            props.width = Math.round(childRect.width);
            props.height = Math.round(childRect.height);
            props.positionType = "absolute";
          });
        }
      });
    }

    // If switching AWAY from canvas, reset auto-absolute children back to flow layout
    if (layoutMode === "canvas" && val !== "canvas") {
      const childNodes = query.node(id).get().data.nodes;

      childNodes.forEach((childId: string) => {
        editorActions.setProp(childId, (props: any) => {
          // Only reset children that are absolutely positioned by canvas mode
          if (props.positionType === "absolute") {
            props.positionType = "relative";
            props.top = 0;
            props.left = 0;
          }
        });
      });
    }

    setProp((props: any) => props.layoutMode = val);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Background Color</Label>
        <div className="flex gap-2">
          <Input
            type="color"
            value={background || "#transparent"}
            className="w-10 h-10 p-1"
            onChange={(e) => setProp((props: any) => props.background = e.target.value)}
          />
          <Input
            value={background}
            onChange={(e) => setProp((props: any) => props.background = e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <SpacingControl
          label="Padding"
          value={padding}
          onChange={(val) => setProp((props: any) => props.padding = val)}
        />
        <SpacingControl
          label="Margin"
          value={margin}
          onChange={(val) => setProp((props: any) => props.margin = val)}
        />
      </div>

      <div className="space-y-2">
        <Label>Background Image URL</Label>
        <Input
          value={backgroundImage || ""}
          placeholder="https://..."
          onChange={(e) => setProp((props: any) => props.backgroundImage = e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Upload Background Image</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              if (reader.result) {
                setProp((props: any) => props.backgroundImage = reader.result);
              }
            };
            reader.readAsDataURL(file);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label>Border Radius: {borderRadius}px</Label>
        <Slider
          defaultValue={[borderRadius || 0]}
          max={50}
          step={1}
          onValueChange={(val) => setProp((props: any) => props.borderRadius = val[0])}
        />
      </div>

      <div className="space-y-2">
        <Label>Gap: {gap}px</Label>
        <Slider
          defaultValue={[gap || 0]}
          max={50}
          step={1}
          onValueChange={(val) => setProp((props: any) => props.gap = val[0])}
        />
      </div>

      <div className="space-y-2">
        <Label>Layout Mode</Label>
        <ToggleGroup type="single" value={layoutMode || "flex"} onValueChange={handleLayoutChange}>
          <ToggleGroupItem value="flex">Flex (Stack)</ToggleGroupItem>
          <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
          <ToggleGroupItem value="canvas">Canvas (Free)</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {layoutMode === "grid" && (
        <div className="space-y-4 pt-2 border-t mt-4">
          <div className="space-y-2">
            <Label>Grid Columns: {gridColumns || 1}</Label>
            <Slider
              defaultValue={[gridColumns || 1]}
              max={12}
              step={1}
              onValueChange={(val) => setProp((props: any) => props.gridColumns = val[0])}
            />
          </div>
          <div className="space-y-2">
            <Label>Grid Gap: {gap}px</Label>
            <Slider
              defaultValue={[gap || 0]}
              max={50}
              step={1}
              onValueChange={(val) => setProp((props: any) => props.gap = val[0])}
            />
          </div>
          <div className="space-y-2">
            <Label>Align Items</Label>
            <ToggleGroup type="single" value={alignItems || "stretch"} onValueChange={(val) => val && setProp((props: any) => props.alignItems = val)}>
              <ToggleGroupItem value="start"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="end"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="stretch"><LayoutTemplate className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}

      {layoutMode !== "canvas" && (
        <div className="space-y-4 pt-2 border-t mt-4">
          <div className="space-y-2">
            <Label>Direction</Label>
            <ToggleGroup type="single" value={flexDirection || "column"} onValueChange={(val) => val && setProp((props: any) => props.flexDirection = val)}>
              <ToggleGroupItem value="row"><Columns className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="column"><Rows className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label>Wrap Content</Label>
            <ToggleGroup type="single" value={flexWrap || "nowrap"} onValueChange={(val) => val && setProp((props: any) => props.flexWrap = val)}>
              <ToggleGroupItem value="nowrap">No Wrap</ToggleGroupItem>
              <ToggleGroupItem value="wrap">Wrap</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label>Align Items</Label>
            <ToggleGroup type="single" value={alignItems || "flex-start"} onValueChange={(val) => val && setProp((props: any) => props.alignItems = val)}>
              <ToggleGroupItem value="flex-start"><AlignLeft className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="center"><AlignCenter className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="flex-end"><AlignRight className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label>Justify Content</Label>
            <ToggleGroup type="single" value={justifyContent || "flex-start"} onValueChange={(val) => val && setProp((props: any) => props.justifyContent = val)}>
              <ToggleGroupItem value="flex-start"><LayoutTemplate className="h-4 w-4 rotate-180" /></ToggleGroupItem>
              <ToggleGroupItem value="center"><LayoutTemplate className="h-4 w-4" /></ToggleGroupItem>
              <ToggleGroupItem value="flex-end"><LayoutTemplate className="h-4 w-4" /></ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
      )}

      {/* Dimensions apply to both modes */}
      <div className="space-y-4 pt-4 border-t">
        <Label>Dimensions</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Width</Label>
            <Input
              value={width || ""}
              placeholder="e.g. 100%"
              onChange={(e) => setProp((props: any) => props.width = e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Height</Label>
            <Input
              value={height || ""}
              placeholder="e.g. 200px or auto"
              onChange={(e) => setProp((props: any) => props.height = e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-400">Min Height</Label>
            <Input
              value={minHeight || ""}
              placeholder="e.g. 100px or 100%"
              onChange={(e) => setProp((props: any) => props.minHeight = e.target.value)}
            />
          </div>
        </div>
      </div>

      <AnimationSection />
    </div>
  );
};

export const UserContainer = ({ children, background, padding, margin, flexDirection, alignItems, justifyContent, flexWrap, gap, borderRadius, backgroundImage, height, minHeight, width, layoutMode, gridColumns, animationType, animationDuration, animationDelay, disableVisuals }: any) => {
  const { connectors: { connect, drag }, selected, node, actions: { setProp }, top, left, childNodes, dom } = useNode((state) => ({
    selected: state.events.selected,
    node: state,
    top: state.data.props.top,
    left: state.data.props.left,
    childNodes: state.data.nodes,
    dom: state.dom
  }));

  const { enabled, query, actions: editorActions } = useEditor((state) => ({
    enabled: state.options.enabled,
  }));

  React.useEffect(() => {
    if (disableVisuals && selected && node?.data?.parent) {
      editorActions.selectNode(node.data.parent);
    }
  }, [disableVisuals, selected, node?.data?.parent, editorActions]);

  const prevChildNodesRef = React.useRef(childNodes);

  React.useEffect(() => {
    // Detect added node
    if (layoutMode === "canvas" && childNodes.length > prevChildNodesRef.current.length) {
      // A node was added!
      const addedNodeId = childNodes.find((id: string) => !prevChildNodesRef.current.includes(id));

      if (addedNodeId) {
        const dropPos = (window as any).__craft_drop_pos;

        if (dropPos && dropPos.containerId === node.id && dom) {
          const containerRect = dom.getBoundingClientRect();
          
          editorActions.setProp(addedNodeId, (props: any) => {
            // Get initial dimensions if possible, or default
            const initialWidth = props.width || 100;
            const initialHeight = props.height || 50;

            // Constrain drop position within container boundaries
            const constrainedX = Math.max(0, Math.min(dropPos.x, containerRect.width - initialWidth));
            const constrainedY = Math.max(0, Math.min(dropPos.y, containerRect.height - initialHeight));

            props.top = Math.round(constrainedY);
            props.left = Math.round(constrainedX);
            props.positionType = "absolute";
          });
          (window as any).__craft_drop_pos = null;
        }
      }
    }
    prevChildNodesRef.current = childNodes;
  }, [childNodes, layoutMode, node.id, editorActions, dom]);

  React.useEffect(() => {
    if (!dom || layoutMode !== "canvas") return;

    const updateHeight = () => {
      const containerRect = dom.getBoundingClientRect();
      let maxBottom = 0;

      const nodeData = query.node(node.id).get();
      nodeData.data.nodes.forEach((childId: string) => {
        const childNode = query.node(childId).get();
        const childDom = childNode.dom;
        if (!childDom) return;
        const childRect = childDom.getBoundingClientRect();
        const bottom = childRect.bottom - containerRect.top;
        if (bottom > maxBottom) {
          maxBottom = bottom;
        }
      });

      const targetMinHeight = Math.max(800, maxBottom || 400);

      setProp((props: any) => {
        if (props.layoutMode === "canvas") {
          props.minHeight = targetMinHeight;
        }
      });
    };

    updateHeight();
    window.addEventListener("craftjs-element-drag", updateHeight);
    return () => {
      window.removeEventListener("craftjs-element-drag", updateHeight);
    };
  }, [dom, layoutMode, query, node.id, setProp]);

  const { isCanvas, dragProps, itemStyle } = useCanvasDrag(top, left, { setProp });

  const variants = getAnimationVariants(animationType, animationDuration, animationDelay);

  // Helper to get spacing string or valid object values
  const getSpacing = (space: any) => {
    if (typeof space === "number") return `${space}px`;
    if (!space) return "0px";
    return `${space.top}px ${space.right}px ${space.bottom}px ${space.left}px`;
  };

  // Check if container is empty (no children)
  const hasChildren = React.Children.count(children) > 0 || (node?.data?.nodes && node.data.nodes.length > 0);

  // Determine if we should show visual indicators (only when empty, transparent, and editor is enabled)
  const isTransparent = !background || background === "transparent" || background === "";
  const showVisualIndicators = enabled && isTransparent && !backgroundImage && !hasChildren && !disableVisuals;

  // Create a subtle background pattern for visual indication
  const backgroundPattern = showVisualIndicators
    ? `linear-gradient(45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(59, 130, 246, 0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(59, 130, 246, 0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(59, 130, 246, 0.05) 75%)`
    : undefined;
  const backgroundPatternSize = showVisualIndicators ? "20px 20px" : undefined;
  const backgroundPatternPosition = showVisualIndicators ? "0 0, 0 0, 10px 10px, 10px 10px" : undefined;

  const isSelfCanvas = layoutMode === "canvas";

  return (
    <motion.div
      ref={(ref: any) => {
        // If we are IN a canvas (isCanvas=true), we use framer motion drag.
        // If we are NOT in a canvas, checking if we are draggable by Craft?
        // Craft default drag handle usually on the component itself if not canvas?
        // Actually, for nested layouts, typically the USER has to select the parent to drag it.
        // But here, if isCanvas=true, we want to allow dragging THIS container.
        // IsCanvas refers to "Am I inside a canvas?".
        if (isCanvas) {
          connect(ref);
        } else {
          connect(drag(ref));
        }
      }}
      onDragOver={(e) => {
        if (isSelfCanvas) {
          e.preventDefault(); // Allow drop
          e.stopPropagation();
          const container = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - container.left;
          const y = e.clientY - container.top;
          // Store local coordinates in a ref or temporary state
          // Since we can't use a Ref inside the render directly for logic that needs persistence across potential re-renders during drag? 
          // actually ref is perfect.
          (window as any).__craft_drop_pos = { x, y, containerId: node.id };
        }
      }}
      // remove onDrop entirely to let Craft handle the structure update naturally
      style={{
        backgroundColor: background || (showVisualIndicators ? "rgba(249, 250, 251, 0.5)" : undefined),
        backgroundImage: backgroundImage
          ? `url(${backgroundImage})`
          : backgroundPattern,
        // Use 'cover' so the background fills the full width of the section
        // without leaving empty space on the sides.
        backgroundSize: backgroundImage ? "cover" : backgroundPatternSize,
        backgroundPosition: backgroundImage ? "center center" : backgroundPatternPosition,
        backgroundRepeat: backgroundImage ? "no-repeat" : undefined,
        padding: isSelfCanvas ? 0 : getSpacing(padding),
        margin: getSpacing(margin),
        overflow: isSelfCanvas ? "hidden" : "visible", // Strictly clip to page boundary

        // Layout Config
        display: isSelfCanvas ? "block" : (layoutMode === "grid" ? "grid" : "flex"),
        // Always relative so absolute children (Free Movement) anchor to this container
        // UNLESS we are inside a canvas, then we are absolute ourselves?
        // Wait, itemStyle sets position:absolute if isCanvas is true.
        // We need to merge them.
        position: isCanvas ? "absolute" : "relative",

        // Grid Props
        gridTemplateColumns: layoutMode === "grid" ? `repeat(${gridColumns || 1}, 1fr)` : undefined,

        // Flex Props (Only apply if NOT canvas AND NOT grid)
        flexDirection: (isSelfCanvas || layoutMode === "grid") ? undefined : flexDirection,
        alignItems: (isSelfCanvas) ? undefined : alignItems, // Grid uses alignItems too
        justifyContent: (isSelfCanvas || layoutMode === "grid") ? undefined : justifyContent,
        flexWrap: (isSelfCanvas || layoutMode === "grid") ? undefined : flexWrap,
        gap: isSelfCanvas ? undefined : `${gap}px`,

        minHeight: typeof minHeight === 'number' ? `${minHeight}px` : minHeight,
        width: typeof width === 'number' ? `${width}px` : width,
        borderRadius: `${borderRadius}px`,
        ...itemStyle, // This overwrites position/top/left if isCanvas is true
      }}
      className={cn(
        "min-h-[50] transition-all cursor-move",
        selected
          ? "border-2 border-blue-500 border-dashed shadow-sm"
          : showVisualIndicators
            ? "border border-blue-200 border-dashed hover:border-blue-400 hover:shadow-sm"
            : "border border-transparent hover:border-gray-300 hover:border-dashed"
      )}
      initial="initial"
      animate="animate"
      variants={variants as any}
      {...dragProps}
    >
      {children}
    </motion.div>
  );
};


UserContainer.craft = {
  displayName: "Container",
  props: {
    background: "transparent",
    padding: 20,
    margin: 0,
    backgroundImage: "",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    flexWrap: "nowrap",
    gap: 10,
    gridColumns: 1,
    borderRadius: 0,
    animationType: "none",
    animationDuration: 0.5,
    animationDelay: 0,
    height: "auto",
    minHeight: "50px",
    width: "100%",
    layoutMode: "flex",
    top: 0,
    left: 0,
    positionType: "relative",
  },
  related: {
    settings: ContainerSettings,
  },
};
