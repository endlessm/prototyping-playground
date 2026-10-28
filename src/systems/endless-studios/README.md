# Endless Studios

A design system for prototypes assigned to `endless-studios`: the Endless Studios frontend's own Vue code, with Nuxt UI 4, the app's `app.config` customization and its stylesheet.

- `AGENTS.md` selects relevant context and skills.
- `context/` holds shared product and design knowledge. [User types](context/user-types.md) describes who uses Endless Access: eight types, their jobs to be done, and the evidence behind each point.
- `skills/` holds task procedures when this system needs them.
- `components/` holds the documentation of the Nuxt UI components the system documents.
- `studios/` is a copy of the app's `frontend/app/` folder; see [its README](studios/README.md) for the revision and adaptations.
- `package.json` owns the system's dependencies, a workspace of its own.
- `system.ts` declares the system and its Vue app.

## The preview document

Views of prototypes assigned to this system render in its preview document: a same-origin iframe the studio builds for this system alone, beside its own app. The document holds only this system's Vue app, so the studio's neutral Nuxt UI theme and this app's theme never meet, and the app's pop-ups stay inside it. It has one light theme; the studio's dark mode does not reach it. `app` in `system.ts` tells the studio what to build:

- `factory`: `createStudiosApp` in `libraries/vue-app.ts`, the single entry point to the Vue runtime. The preview document and the system's tests create every app through it.
- `stylesheet`: `styles/studios.css`, the app's stylesheet and fonts. The studio compiles it with Tailwind for the preview document, adding the prototypes' views as sources.
- `nuxtUi`: Nuxt UI in its Vue mode with the app's `app.config` (`nuxt-ui.config.ts`) and theme colours.
- `standIns`: the names auto-imported into views and system code, as Nuxt auto-imports them in the app (`studios/nuxt-shims.ts`). They are never the studio's own Nuxt composables.
- `source`: `studios`, which `~/` points at, so copied components keep the app's import paths.
- `aliases`: bare modules answered by stand-ins.

`createStudiosApp({ component, props, locale })` installs:

- Nuxt UI with the app's configuration, inside `UApp`, with a `Suspense` boundary for components that `await` in setup;
- the Lucide icon collection;
- navigation stand-ins: `useRouter`, `useRoute`, `navigateTo` and a `<NuxtLink>` that log instead of navigating;
- `$t`, `$te`, `$tm` and `useI18n()`, reading the app's locale files in `i18n/locales/`. English is the default and fallback; a missing key renders as the key and is reported once in the console;
- `useNuxtApp()`, with `$i18n`, `$dayjs` for the date formats the app uses, and `$config`;
- `useState`.

The other stand-ins in `runtime/` (sample users, the store, GraphQL samples and the app shell) are not installed yet; they return with the Endless Studios screens.

Add context and skills only when needed.
