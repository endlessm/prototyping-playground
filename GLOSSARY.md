# Endless Prototyping Playground

The Endless team's language for building and reviewing product prototypes.

## Language

**Endless Prototyping Playground**:
The team's shared environment for exploring and reviewing product experiences with agents.
_Avoid_: Endless Studios (the product being prototyped).

**Endless Studios**:
Endless Access's learning platform, whose real screens and components inform the team's prototypes.
_Avoid_: the Studio, Workshop (until the product is renamed).

**Prototype**:
A contributor's exploration of a product experience, with its views and supporting artifacts.

**Artifact**:
An addressable piece of a prototype, such as a view, named state, document, diagram or canvas.

**View**:
An interactive screen or flow within a prototype, using its assigned system's components.
_Avoid_: VueScreen, Screen (as a separate artifact kind).

**System options**:
The locale, signed-in user, sample and app shell that describe the app around a view, with each named state able to override individual options.
_Avoid_: screen props (props belong to the view).

**Named state**:
A titled variation of a view with its own permanent link, such as a signed-out or empty experience.

**System**:
The product's components, visual language and context available to an assigned prototype.
_Avoid_: Vue project, Nuxt system.

**Copied app source**:
Product code preserved from the real app so prototypes can use its actual components and screens.

**Stand-in**:
A local substitute for an app service that lets the product experience run without its backend.
_Avoid_: mock, shim.

**Sample**:
The example store state, handlers and query responses a stand-in uses for one demonstrated experience. A sample supplies data; system options choose the app shell around the view.

**Preview document**:
The isolated presentation of a view or system example within the studio.
_Avoid_: Vue mount.

**App shell**:
The product's sidebar, top bar and footer surrounding its content.

**Admin**:
A contributor authorized to manage the shared studio and its roles.

**System maintainer**:
A contributor authorized to maintain a particular system's code and guidance.

**Comment**:
A note a contributor pins to an artifact, or to a place in it, for colleagues and agents; a thread with replies, open or resolved.
_Avoid_: annotation (the canvas README's word for text drawn on a board).
