# Endless Studios

A design system for prototypes assigned to `endless-studios`: the Endless Studios frontend's own Vue code, with Nuxt UI 4, the app's `app.config` customization and its stylesheet.

- `AGENTS.md` selects relevant context and skills.
- `context/` holds shared product and design knowledge. [User types](context/user-types.md) describes who uses Endless Access: eight types, their jobs to be done, and the evidence behind each point.
- `skills/` holds task procedures when this system needs them.
- `components/` holds the component pages of the Nuxt UI components the system documents (Button, Card, Badge, Alert, Container, Navigation menu, Breadcrumb, Carousel, and the form controls: Input, Select, Textarea, Switch, Radio group, Form field, Form, File upload, Select menu, Input menu; and the overlays: Modal, Tooltip, Dropdown menu, Popover, Slideover; and data and display: Table, Pagination, Separator, Avatar, Progress, Chip, Tabs, Link, Calendar; and the rich text editor: Editor, Editor toolbar, Editor mention menu): each a `<name>.vue` wrapper whose `defineProps` gives the props table, a `<name>.md` page and a `<name>.examples.vue` of live examples written with the Nuxt UI tags (`<UButton>`, `<UCard>`…) as screens write them (see the Systems README, Component pages, and `yarn component-docs`).
- `studios/` is a copy of the app's `frontend/app/` folder; see [its README](studios/README.md) for the revision and adaptations.
- `package.json` owns the system's dependencies, a workspace of its own.
- `system.ts` declares the system and its Vue app.

## The preview document

Views of prototypes assigned to this system render in its preview document: a same-origin iframe the studio builds for this system alone, beside its own app. The document holds only this system's Vue app, so the studio's neutral Nuxt UI theme and this app's theme never meet, and the app's pop-ups stay inside it. It has one light theme; the studio's dark mode does not reach it. `app` in `system.ts` tells the studio what to build:

- `factory`: `createStudiosApp` in `libraries/vue-app.ts`, the single entry point to the Vue runtime. The preview document and the system's tests create every app through it.
- `stylesheet`: `styles/studios.css`, the app's stylesheet and fonts. The studio compiles it with Tailwind for the preview document, adding the prototypes' views as sources.
- `nuxtUi`: Nuxt UI in its Vue mode with the app's `app.config` (`nuxt-ui.config.ts`) and theme colours.
- `standIns`: `studios/nuxt-shims.ts`; every name it exports is auto-imported into views and system code, as Nuxt auto-imports them in the app. They are never the studio's own Nuxt composables.
- `source`: `studios`, which `~/` (and, for template URLs such as `src="~/assets/images/logo.svg"`, `assets/`) points at, so copied components keep the app's import paths and images.
- `aliases`: module paths and packages answered by stand-ins, matched whole.

The Systems area reads this system from the same files, with nothing kept by hand beside them. Its Theme pages list the tokens `styles/studios.css` and what it imports set (the copied `main.css`, Tailwind's theme and Nuxt UI's roles, plus the eight theme colours and palettes Nuxt UI adds at runtime), drawn and measured in this system's preview document. Its Images and Icons pages list the copied app images in `studios/assets/images/` (the `Icons` folders on Icons), and `icons` in `system.ts` is the Icons page's Lucide sample. The Inter and Figtree families come from the Fontsource packages the stylesheet imports.

A stand-in is one file in `runtime/` plus its registration: an export line in `studios/nuxt-shims.ts`, or an `aliases` entry. `studios/README.md` lists them and describes how to refresh the copied source.

`createStudiosApp({ component, props, system })` installs:

- with `system.shell`, the app's page frame around the screen (`runtime/AppShell.vue`): the copied `StudioSidebar`, `StudioTopBar` and `StudioFooter` as `StudioLayout` arranges them, without the app's global modals and onboarding;

- Nuxt UI with the app's configuration, inside `UApp`, with a `Suspense` boundary for components that `await` in setup;
- the Lucide icon collection;
- navigation stand-ins: `useRouter`, `useRoute`, `navigateTo` and a `<NuxtLink>` that stay on the screen and log the destination to the console;
- `$t`, `$te`, `$tm` and `useI18n()`, reading the app's locale files in `i18n/locales/` with the app's message syntax (`{name}` and `{0}` placeholders, `{'literal'}` text, `a | b` plurals, keys with dots in them). English is the default and fallback; a missing key renders as the key, and it and an unknown locale are reported once in the console;
- `$auth` and `useNuxtApp().$auth` with a sample user and the app's role checks (admin, leader, editor, program admin and manager, institution admin, cohort admin, adult or minor); sign-in, sign-up and sign-out requests are logged and the chosen user stays;
- `$store`, `useStore()` and the `vuex` module: the app's initial state merged with sample state; the sample's own getters, mutations and actions run, and an unknown commit or dispatch is reported once and ignored;
- `useGraphQLQuery`, `QueryAuth`, `$graphqlRequest` and the `graphql-request` module, answering from sample responses by operation name and keeping the query's `auth`, `skip`, `default()`, `flattenData` and `transform`. An unmocked query is reported once and resolves to its `default()` or an empty list; subscriptions emit nothing and `GraphQLClient` resolves empty, each reported once;
- `useStreamingGraphQLQuery`: one page of sample items, no further pages, empty when signed out;
- `useNuxtApp()`, with `$dayjs` for the app's date formats and relative time in the screen's locale, `$i18n` and `$config`; `useState`, shared within one screen; `useNotificationsCount` (a `NOTIFICATIONS_COUNT` sample, 0 by default); `useBackendError`, whose error toast is logged; the mixin's `resolveProfilePic`; `InfiniteScroll`, which renders the given items and the empty slot; the app constants `DASHBOARD_PATH` and `SET_NOTIFICATION_SEEN`.

`studios/README.md` lists each stand-in beside the app API it replaces. Gaps fail softly: each one is reported once per page with the `[Endless Studios]` prefix, and the screen renders empty instead of crashing.

## Choosing a screen's locale, user and samples

A view declares the options in `export const system`, in its regular `<script>` beside `<script setup>`; a named state's `system` overrides them option by option (the [prototypes README](../../modules/prototypes/README.md#system-options) has the rules):

| Option   | Default     | Meaning                                                                                                     |
| -------- | ----------- | ----------------------------------------------------------------------------------------------------------- |
| `locale` | `'en'`      | A locale code from `i18n/locales/` (`en`, `es`).                                                           |
| `user`   | `'learner'` | `'learner'` (Ana), `'mentor'` (Marco), `'admin'` (Alex), a user object shaped like the app's `User`, or `null` for signed out. |
| `shell`  | `false`     | `true` shows the screen inside the app's sidebar, top bar and footer. Signed out, the top bar shows Log in and Sign up. |
| `sample` | `{}`        | `{ state, getters, mutations, actions, queries }`: store state merged over the app's initial state, store handlers by name, and GraphQL `data` objects (or functions of the variables) keyed by operation name. |

```vue
<script lang="ts">
const events = { upcomingEventInstances: [{ id: 1, title: 'Game jam kickoff', start: '2026-11-04T15:00:00Z', event: { id: 9 } }] }

export const system = { user: 'admin', shell: true, sample: { queries: { UpcomingEventInstances: events } } }

export const states = [
  { title: 'Spanish learner', system: { locale: 'es', user: 'learner' } },
  { title: 'No events', system: { sample: {} } },
]
</script>
```

An app is created for each screen with its own runtime, so screens never share a user, store or `useState`. A changed option creates the app again; changed props reach the same app.

`tests/integration/endless-studios-app.test.ts` renders copied components and test screens (`tests/fixtures/endless-studios/`) with Vue's server renderer through the factory, loaded by this system's own preview pipeline: `yarn vitest run tests/integration/endless-studios-app.test.ts`.

Add context and skills only when needed.
