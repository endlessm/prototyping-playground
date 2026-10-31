# Bring in a Vue app

How Endless Studios was brought in (`src/systems/endless-studios/`): the app's own components render in the system's preview document, with stand-ins for what the app gets from Nuxt or its server.

## Assess first

1. Read the source at one revision: its framework (Nuxt or plain Vue), Nuxt UI or other component library, `app.config`, stylesheets and fonts, images, i18n, store, data fetching and composables.
2. List what screens need: components to copy, packages, composables and modules to stand in for (auth, GraphQL or REST, store, router, i18n), and assets.
3. Report a plan: what to copy unchanged, the stand-ins, the theme and asset stages, and gaps (private packages, server-only code). Wait for the person's go-ahead before copying.

## Copy and adapt

- Copy the app's source folder unchanged into the system (Endless Studios keeps it in `studios/`) and point `app.source` at it, so `~/` imports and `~/assets/` URLs resolve. Record the source repository and revision in a README beside the copy. Never edit a copied file: adapt through stand-ins, aliases and the system's own stylesheet.
- Write the factory (`app.factory`): create the app, install Nuxt UI with the app's configuration (`app.nuxtUi`), icons, i18n and the stand-ins. Views pass their options through `export const system`; give each option a sensible default.
- Stand-ins live in the system (`runtime/`). An auto-imported composable is one export line in the module `app.standIns.from` names; a module path is an `app.aliases` entry. Report what a stand-in can't do, once, in the console.
- The stylesheet (`app.stylesheet`) imports the app's own CSS and fonts; the Theme pages read its tokens from there.
- Add the packages the copy needs to the system's `package.json` with `yarn workspace`.

## Check

Render a representative screen in a prototype, in each declared colour mode, and compare it with the source app. Check the console for stand-in gaps.
