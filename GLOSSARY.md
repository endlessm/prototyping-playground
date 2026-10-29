# Glossary

This studio's domain language. The Design Studio platform documents its own terms in `src/platform/context/`; don't repeat them here.

**Endless Studios**: Endless Access's learning platform, whose real screens prototypes use. It is being renamed Workshop, and this glossary will follow the rename. _Avoid_: the Studio, studio ("Studio" is the Design Studio's own interface).

**Vue system**: a team system whose screens are Vue code from a real app, rendered inside the studio. Endless Studios is the only one today. _Avoid_: Vue project (the app outside the studio), Nuxt system.

**Vue declaration**: the part of a system's declaration that says it renders Vue and how: where its copied app source lives, its Nuxt UI configuration and colours, its stand-ins and its stylesheet. The platform finds Vue systems through it.

**Copied app source**: the app's own files, copied unchanged into a Vue system so prototypes use the real code. Refreshing them from the app stays mechanical because they are never edited in the studio.

**Stand-in**: studio code that replaces something the real app gets from Nuxt or its backend (`$t`, `$auth`, the store, GraphQL, navigation) so copied app source runs without a server. _Avoid_: mock, shim.

**Sample**: the per-screen data a stand-in answers with: store state and handlers, query responses. With the signed-in user and the locale, it is one of a screen's system options.

**System options**: what a view tells its system's app factory about the app around the screen, in `export const system`; a named state overrides them option by option. For Endless Studios: the locale, the signed-in user and the sample. _Avoid_: screen props (props are the view's own).

**App factory**: the one function a Vue system uses to create its Vue app with every stand-in installed. Screens, inline components and tests all use it.

**Vue mount**: the platform's browser-side piece that renders a Vue screen or component inside a React view, isolated in a shadow root with its system's styles.

**Screen**: a `.vue` file in a prototype that a view renders through the Vue mount. The view stays a `.tsx` artifact; the screen is its content.

**App shell**: the app's own sidebar, top bar and footer, rendered around a screen on request.
