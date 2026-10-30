# Start from Nuxt UI

A new product system built on Nuxt UI 4 in its Vue mode, as the studio itself and Endless Studios use it.

1. Add `@nuxt/ui` (the studio's version) and an icon collection such as `@iconify-json/lucide` to the system's workspace, and list them in `libraries`.
2. In the factory, install Nuxt UI's Vue plugin and wrap views in `UApp`, as `src/systems/endless-studios/libraries/vue-app.ts` does. Put the theme's `ui` configuration in a file of its own and declare it with its colour names in `app.nuxtUi`.
3. In `styles/theme.css`, import Tailwind and Nuxt UI, then set the theme: colours on the system's `themeClass` scope (and `.dark` when the system supports dark mode), fonts and radius. If the person gave a DESIGN.md, take colours, type and spacing from it and say where you departed from it.
4. Show the theme on the system's Theme pages and the fonts, icons and images on its Assets pages for the person's review before adding components.
5. Add the components the person named, or the smallest set the goal needs, each documented with document-component.
