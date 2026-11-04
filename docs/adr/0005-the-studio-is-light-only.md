# The studio is light only

Date: 2026-11-04. Status: accepted.

## Context

The studio offers a color mode in the rail (System, Light, Dark), remembered per browser. The choice reaches the studio's own interface, code highlighting, Mermaid diagrams, canvases, comment pins and the preview documents of systems that declare a dark mode and of prototypes with no system. The only registered system, Endless Studios, is light only, so views already render light; the dark mode mostly costs a second palette for every surface the studio draws, and a second look to check for every change.

## Decision

- **The studio has one color mode, light.** Its interface, documents, code, diagrams, canvases, comment pins and every preview document render light. The color mode control leaves the rail.
- **The computer's preference is ignored.** A computer set to dark still gets the light studio.
- **Systems keep declaring their color modes.** `colorModes` stays in a system's declaration and the Systems area keeps describing it, as a fact about the system. The studio never shows a system's dark mode; a declared dark mode has no effect on previews. The Overview still names a system's color modes, the Colors page still marks tokens that have a dark value, and setting up a system still keeps the dark colours it brings. A new system's template declares light only.
- **A deliberate difference from the React studio.** The React studio on `main` keeps its dark mode; parity no longer covers color mode.

## Alternatives considered

- **Dark only in some places** (such as the canvas). Keeps most of the double palette for little gain.
- **Removing `colorModes` from systems.** Every system would be light by contract, and a future system's dark mode would return as an option of the view rather than of the studio. Rejected to keep the declaration for a system that has a dark mode, at the cost of a fact the studio shows but does not act on.

## Consequences

- The dark palettes, themes and the preview's color-mode script go away; one palette to design and check.
- A stored `design-studio:color-mode` preference is obsolete and cleared.
- The color-mode parity scenario and the tests of dark rendering go away.
- A system's dark styles stay in its stylesheets, reachable only if a later decision lets a view show them.
