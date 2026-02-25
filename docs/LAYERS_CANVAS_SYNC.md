# Two-Way Sync: Layers Panel ↔ Canvas

Your editor already has **two-way synchronized** drag-and-drop between the Layers panel and the canvas because both use the **same Craft.js Editor state** (the node tree).

## How it works

### Single source of truth

- **Editor state** = one tree of nodes (parent/child, order within parent).
- **Layers panel** (`@craftjs/layers`) reads this tree and renders the list.
- **Canvas** (Frame + your components) renders the same tree.
- Any change to the tree (add, remove, **move**) is done via **`actions.move()`** or add/delete. Both the Layers panel and the canvas subscribe to the same state, so they stay in sync.

---

### 1. Layers panel → Canvas (reorder in Layers)

When you **drag and reorder a layer** in the Layers panel:

1. `@craftjs/layers` uses the **`useLayer`** hook and attaches a **drag** connector to each row.
2. On **drop**, the package calls **`actions.move(nodeId, parentId, index)`** with the new parent and index.
3. The **Editor’s node tree** updates (the node’s position in its parent’s `nodes` array changes).
4. The **canvas** re-renders from the same tree, so the element appears in the new position/order.

So: **reordering in the Layers panel updates the tree → canvas reflects it.**

---

### 2. Canvas → Layers panel (drag/drop on canvas)

When you **drag and drop an element** on the canvas (e.g. onto another container or between siblings):

1. Your user components use **`connect(drag(ref))`** from `useNode()`, so Craft.js makes the node **draggable**.
2. The **Frame** (and Canvas nodes) act as drop targets. When you drop, Craft’s internal handlers run and call **`actions.move(draggedId, newParentId, index)`**.
3. The **node tree** updates (same as above).
4. The **Layers panel** reads from the same tree, so the list re-renders with the new order.

So: **reordering on the canvas updates the tree → Layers panel reflects it.**

---

## What you must not break

For this two-way sync to keep working:

1. **Layers panel** must change order only via **`actions.move(nodeId, parentId, index)`** (and optionally add/delete).  
   ✅ **`@craftjs/layers`** does this when you reorder in the panel.

2. **Canvas** reorder (changing parent or sibling index) must also go through **`actions.move()`**.  
   ✅ Craft.js **Frame** and **drop targets** do this when you drop a dragged node. Your components only need **`connect(drag(ref))`** so the node is draggable.

3. **Do not** replace or bypass the Editor’s node tree for structural changes.  
   - Your **RenderNode** “free move” (updating `top` / `left` with **`setProp`**) only changes **position within the same parent**; it does **not** change the node’s order in the tree. That’s correct: free move = same layer order, different x/y; reorder = change layer order via **`actions.move()`**.

---

## Summary

| Action | Who updates the tree? | Result |
|--------|------------------------|--------|
| Reorder in **Layers panel** | `@craftjs/layers` → `actions.move()` | Canvas order updates |
| Drag/drop on **canvas** (reorder) | Craft.js Frame/drop handlers → `actions.move()` | Layers panel order updates |
| Free move on canvas (x/y only) | Your `RenderNode` → `setProp(top, left)` | No change to layer order (by design) |

So the two-way synchronized drag-and-drop you want is already implemented: both the Layers panel and the canvas drive and read from the same Editor state, and structural changes go through **`actions.move()`**.
