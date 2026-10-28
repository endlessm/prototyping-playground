# Endless Studios frontend sources

Copied unchanged from `Endless-Game-Making-Studio/studio` at `11517cbee`, under `frontend/app/`, keeping that folder layout so `~/` imports resolve here. The app's locale files, `frontend/i18n/locales/en.json` and `es.json`, are copied unchanged at the same revision to `../i18n/locales/`, mirroring `frontend/i18n/` beside `frontend/app/`. Every image under `assets/images/` is copied unchanged, except `bg-threadbare.png` (2.1 MB) and `banner-img.png` (1.1 MB), which are over the studio's 750 KB asset limit and used only by `Dashboard/LauncherBanner*.vue`.

Adapted: `assets/css/main.css` drops the floating-vue stylesheet, scans only this system's sources (the studio's preview build adds the prototypes' views), and names the Fontsource variable fonts. `nuxt-shims.ts` is not an app file: it re-exports the stand-ins below for auto-import.

Stood in (implemented in `../runtime/`, installed by `createStudiosApp`, never copied):

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
