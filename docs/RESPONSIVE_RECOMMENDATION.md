# Responsive Design: Recommendation (No CSS AST)

## Your questions

### 1. Is using a CSS AST–based styling system a good approach for fixing responsiveness?

**No.** A CSS AST (parse → manipulate nodes → stringify → inject) is the wrong tool for this problem.

- **Responsiveness** is fixed by: (1) a constrained viewport when in “mobile” mode, (2) flexible layouts (%, flex, grid, min/max-width), and (3) components that adapt when `device === "mobile"`.
- **A CSS AST** would add a lot of complexity (parsing, security, performance, debugging) without addressing why the layout breaks: some elements still use fixed widths or absolute positioning that don’t adapt when the canvas becomes narrow.
- Your layout breaks because **some nodes or wrappers don’t respect the mobile canvas width**, not because you lack the ability to rewrite CSS at the AST level.

### 2. What would be the correct architecture for building such a system?

If you still wanted a CSS AST for other reasons (e.g. theme generation, very dynamic rules), a typical architecture would be:

- Parser (e.g. postcss + postcss-value-parser) → AST
- Transform layer that edits nodes (e.g. scale widths, change media queries)
- Stringify → inject `<style>` or replace a stylesheet

Again: **not recommended for fixing desktop/mobile switching.** The right “architecture” for your case is: **one device toggle + one canvas width + components that react to `device` and CSS that targets `[data-device="mobile"]`.**

### 3. Are there better or simpler solutions?

**Yes.** You already have most of them in place:

| What you have | Purpose |
|---------------|--------|
| `AppContext.device` (`"desktop" \| "mobile"`) | Single source of truth for the toggle |
| Viewport canvas with `data-device={device}` and fixed width in mobile (375px) | Ensures the preview is actually narrow in “mobile” |
| `globals.css` rules under `.editor-canvas-root[data-device="mobile"]` | Global overrides (max-width, position, flex, etc.) |
| Component-level `device === "mobile"` (Image, Video, Button, Container, Text, …) | Per-component responsive width, spacing, position |

**Simpler fixes that will help:**

1. **Make every draggable component respect `device`**  
   Any component that sets `width`, `height`, `padding`, or `position` from props should:
   - Use `useAppContext().device` (or your existing `useResponsive`).
   - In mobile: e.g. force `maxWidth: '100%'`, use responsive spacing/font helpers, and avoid fixed pixel widths that exceed the canvas (or use `width: '100%'` where appropriate).

2. **Reduce reliance on broad `!important` in `globals.css`**  
   Selectors like `[style*="width"]` and `*` are brittle and can override things you don’t want. Prefer:
   - Component-level mobile styles (in React) as the main lever.
   - A few targeted global rules (e.g. canvas root, direct children) instead of “all elements.”

3. **Single source of truth for “canvas width”**  
   You already have `--mobile-canvas-default`, etc. Optionally set something like `--canvas-content-width` on the canvas root (375px in mobile, 100% or max 1024px in desktop) and use it in components so nothing can exceed the visible canvas.

4. **No new system**  
   You don’t need a new “styling system” or AST. You need:
   - The canvas to stay narrow in mobile (already done).
   - Every component that can break the column to adapt when `device === "mobile"` (audit and add where missing).

## Summary

- **Don’t build a CSS AST for responsiveness.** It won’t fix the root cause and will add unnecessary complexity.
- **Do:** Keep `device` + canvas width + `data-device`; make sure every relevant component branches on `device` and uses flexible sizing; and trim/simplify the global mobile overrides so they don’t fight component styles.

If you want, we can next audit 2–3 components (e.g. Slider, Table, Chart) and add minimal `device`-based overrides so they don’t break the mobile column.
