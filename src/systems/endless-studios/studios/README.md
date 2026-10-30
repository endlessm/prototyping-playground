# Endless Studios frontend sources

Copied unchanged from `Endless-Game-Making-Studio/studio` at `11517cbee`, under `frontend/app/`, keeping that folder layout so `~/` imports resolve here. The app's locale files, `frontend/i18n/locales/en.json` and `es.json`, are copied unchanged at the same revision to `../i18n/locales/`, mirroring `frontend/i18n/` beside `frontend/app/`. Every image under `assets/images/` is copied unchanged, except `bg-threadbare.png` (2.1 MB) and `banner-img.png` (1.1 MB), which are over the studio's 750 KB asset limit and used only by `Dashboard/LauncherBanner*.vue`.

Adapted: `assets/css/main.css` drops the floating-vue stylesheet, imports Tailwind with `source(none)` and scans only this system's sources (`components/`, `../runtime/`, `../nuxt-ui.config.ts`; the studio's preview build adds the prototypes' views), and names the Fontsource variable fonts (`'Inter Variable'`, `'Figtree Variable'`) before the app's own names. `base.css` and `modals.css` are unchanged: the preview document is the screen's own page, so the app's `html` and `body` rules apply as they do in the app. `nuxt-shims.ts` is not an app file: it registers the stand-ins below for auto-import.

## Images and asset URLs

The preview build answers Nuxt's own aliases at this folder: `~/` and, for templates, `assets/`. A template's `src="~/assets/images/logo.svg"` compiles to an import of `assets/images/logo.svg`, and a script's `import logo from '~/assets/images/logo.svg'` goes through `~/`; both reach the copied file, so a newly copied component needs no list of the images it names.

## Stand-ins

Implemented in `../runtime/`, installed by `createStudiosApp`, never copied:

| App API | Stand-in |
| --- | --- |
| `useRouter`, `useRoute`, `navigateTo`, `<NuxtLink>` | `runtime/navigation.ts`: log navigation |
| `$t`, `$te`, `$tm`, `useI18n` (@nuxtjs/i18n, `i18n/i18n.config.ts`) | `runtime/i18n.ts`: the copied locale files, fallback `en` |
| `$auth`, `useNuxtApp().$auth` (`plugins/auth`) | `runtime/auth.ts`: sample users |
| `$store`, `useStore`, `vuex` (`store/index.js`, `plugins/store.js`) | `runtime/store.ts`: the store's initial state plus sample state |
| `useGraphQLQuery`, `QueryAuth` (`composables/useGraphQLQuery.ts`), `$graphqlRequest` (`plugins/graphql-request-plugin.js`), `graphql-request` | `runtime/graphql.ts`, `runtime/graphql-request.ts`: sample responses |
| `useNuxtApp`, `$dayjs` (dayjs-nuxt), `useState` | `runtime/nuxt-app.ts` |
| `useStreamingGraphQLQuery` (`composables/useStreamingGraphQLQuery.ts`) | `runtime/streaming-graphql.ts`: one page of sample items |
| `useNotificationsCount`, `useBackendError` (`composables/`) | `runtime/composables.ts`: same query and messages; the error toast is logged. The originals rely on Nuxt auto-imports inside `.ts` files, which the build gives only to `.vue` files |
| `resolveProfilePic` (`plugins/mixin.js`) | `runtime/mixin.ts` |
| `components/Generic/InfiniteScroll.vue` | `runtime/InfiniteScroll.vue`: renders the given items. The original needs `@vueuse/core`, which isn't a dependency here, and aliasing that package would also replace Nuxt UI's copy |
| `vue-i18n` | `runtime/nuxt-app.ts` (`useI18n`) |
| `utils/dashboardRoute.ts`, `graphql_schemas/notifications.js` | `runtime/app-modules.ts`: the constants copied components use. The originals import `vue-router` and `graphql-request`, which Studio's dependency check refuses in a system's .ts and .js files |
| `StudioLayout.vue` (`components/App/`) | `runtime/AppShell.vue`, used by the `shell` option: the same frame around the copied sidebar, top bar and footer, without the global modals and onboarding |

A stand-in is registered in one place:

- A name the app auto-imports (a composable or helper): its file in `../runtime/` plus one `export { … } from '../runtime/…'` line in `nuxt-shims.ts`. The preview build auto-imports every name that file exports; there is no other list.
- A module the app imports by path or package name: its file in `../runtime/` plus one entry under `app.aliases` in `../system.ts`, keyed by the exact specifier the copied file uses.

Add its row to the table above in the same change; `tests/unit/endless-studios-system.test.ts` checks that every registered stand-in is listed.

## Refreshing the copy

The app repository is private; read it with `gh api` (an account with access to `Endless-Game-Making-Studio/studio`). Pick the revision, then:

1. List what's there: `gh api "repos/Endless-Game-Making-Studio/studio/git/trees/$REV?recursive=1" --jq '.tree[] | select(.type=="blob") | .path'`, filtered to `frontend/app/` (and `frontend/i18n/locales/`).
2. Copy each file unchanged to the same path under this folder (locale files to `../i18n/locales/`): `gh api -H 'Accept: application/vnd.github.raw' "repos/Endless-Game-Making-Studio/studio/contents/frontend/app/$FILE?ref=$REV" > "$FILE"`. Copy only what screens use, plus what those files import; copy every image except files over 750 KB, and list those above.
3. Put the adaptations back into `assets/css/main.css` (the paragraph above) if it changed; never edit another copied file.
4. When a copied file needs a Nuxt composable or package the runtime doesn't answer yet, add a stand-in as described above.
5. Record the new revision in the first paragraph, then run `yarn vitest run tests/unit/endless-studios-system.test.ts tests/integration/endless-studios-app.test.ts` and open a screen that uses the new files.

To check that the copy is unchanged, fetch a file the same way and compare it ignoring line endings (`tr -d '\r' < "$FILE" | cmp - upstream`); only `main.css` should differ.
