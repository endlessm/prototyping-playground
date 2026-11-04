# Diagrams

A `.mermaid` or `.mmd` file in a prototype is a diagram: one plain Mermaid diagram, without Markdown fences, drawn filling its page. The module is optional and on by default. Turned off, diagram files stay listed as unavailable ("Diagram files can’t open here: the Diagrams module is turned off.") and their source still opens locally. Mermaid fences in documents belong to the shared Markdown reader, so they keep rendering when this module is off.

- `module.ts` declares the module, its skill and the diagram file type: `.mermaid` and `.mmd`, the identity adapter, the template, the page, the preview in documents and the icon (`i-lucide-workflow`). With `text: true`, the build ships each diagram's text beside the manifest.
- `types/diagram/identity.ts` reads and writes the permanent identity, a leading `%% @studio-id <id>` comment (only the blank lines and `%%` comments before the diagram count). A new file gets it as its first line, keeping a byte order mark and the file's line endings; an existing one is never replaced.
- `types/diagram/template.ts` is a new diagram ("New Diagram" in the file tree): a small flowchart whose `accTitle` is its name, with an `accDescr`.
- `components/DiagramPage.vue` is the page; `components/DiagramEmbed.vue` the compact preview embedded in documents (`![Sign-in flow](./sign-in-flow.mermaid)` on its own line) and on canvases. Both read the file with `useArtifactText` (the dev server's file service locally, the shipped text on the deployed site) and draw it with the shared `app/components/MermaidDiagram.vue`.
- `types/diagram/diagramSurface.ts` is the page's [artifact surface](../../../app/utils/artifactSurface.ts), and `types/diagram/anchors.ts` the rules it names and finds targets by (see [The surface](#the-surface)).
- `skills/create-diagram/` tells agents how to write diagrams, and when a fence in a document fits better.

## How a diagram draws

The shared renderer (`app/utils/mermaid.ts`, `app/components/MermaidDiagram.vue`) draws Mermaid with its `strict` security level (labels can't hold working HTML, and `click` links to scripts do nothing), its `base` theme and colours read from the studio's Nuxt UI variables and accent palette (`app/utils/contentPalette.ts`) for the current colour mode, in the studio's font. Mermaid's configuration is global, so renders take turns. A diagram draws again when the colour mode changes and, locally, when a stylesheet changes.

| State                                                                          | When                                                                                 |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Rendering diagram…                                                             | Before the first drawing.                                                            |
| Updating diagram…                                                              | Over the previous drawing, while newer text is on its way or being drawn.            |
| Unable to render Mermaid diagram. (with Mermaid's message)                     | The text isn't valid Mermaid. The file's actions still open its source to repair it. |
| Diagram rendering took too long. Repair the source or reload this view.        | A render that hasn't finished after 15 seconds; the next render waits no longer.     |
| Loading diagram… / This diagram could not load. Open it to inspect its source. | A preview in a document whose text is on its way, or couldn't be read.               |

Saving the file draws the new diagram in place, without reloading the page, and the previous drawing stays until the new one is ready. The figure carries `data-diagram-state` (`loading`, `ready`, `error`) and `data-diagram-freshness` (`current`, `stale`) for agents and browser tools.

In a document, a preview sits in the shared embed frame: as wide as the text, between 220 and 440 px tall, the whole diagram scaled to fit, with a header naming it that opens its page ("Open <name>"). On a canvas the same preview fills the item below its header (the Canvases README, "Items").

A diagram names no other files, so it has no reference adapter. A document that embeds or links it is updated when the diagram is renamed or moved (the Documents module's `references.ts`; the prototypes README, "References follow renames and moves").

## The surface

The page offers tools drawn over it (such as comments) an [artifact surface](../../../app/utils/artifactSurface.ts) through `useArtifactSurfaceProvider`. It knows nothing about comments and works on the SVG Mermaid drew in the studio's own DOM (`diagramSurface.ts`).

- **Targets.** A point is over a step (`g.node`), an arrow (its line, within 4 px, or its label) or a group (a subgraph, `g.cluster`). Its anchor records `kind` (`step`, `arrow`, `group`), `label` (`Step "Under 18?"`, `Arrow "Sign in" → "Home"`, `Group "Team area"`) and `mermaid`, the ID in the source: the step's or subgraph's ID, or `<from> --> <to>` for an arrow (with ` (2)` and on for a second arrow between the same steps). Mermaid numbers drawn elements in drawing order, so the ID is read out of the element's own ID without that number (`anchors.ts`). Anywhere else on the drawing is an empty spot, `{ kind: 'spot', label: 'Empty spot' }`, its `at` a point as fractions of the drawing's own area (its view box), so it keeps its place in the drawing whatever the page's size.
- **Finding a target again** after every redraw (`anchors.ts`, unit-tested): by its Mermaid ID among elements of its kind, then by its label, so reordered or restyled steps keep their comments, and a renamed ID with the same label does too. A spot is there while the diagram draws.
- **Where things are.** Positions are in the window's coordinates, sampled each animation frame while a tool listens (`sampledChanges` in `app/utils/domSurface.ts`), so pins follow resizes and redraws. The drawing fits its page, so revealing a target does nothing.
- **Taking the pointer** (`interceptElement`): capture listeners on the page's element and a crosshair cursor, removed when the tool lets go. A diagram has no text to select.
