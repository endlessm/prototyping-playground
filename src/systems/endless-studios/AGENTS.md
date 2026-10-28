# Endless Studios system instructions

This system renders the Endless Studios frontend's own Vue code: Nuxt UI 4 with the app's `app.config` customization and stylesheets. Follow the repository's working context.

When a screen, flow or copy is for a specific kind of user, read [User types](context/user-types.md): the type's section in Part 1 and the overlap matrix in Part 3. If a learner under 18 can see the work, also read Safeguarding in Part 2. The tags show how strong the evidence is; Team or Desk alone is a hypothesis, so label designs that rest on one as assumptions.

- A prototype view is a `.vue` file in the prototype, with its permanent identity as an HTML comment at the top: `<!-- @studio-id <id> -->`. It renders in this system's preview document, a page of its own that holds only the app.
- In `.vue` files, use Nuxt UI components (`UButton`, `UCard`, `UModal`...) without importing them, as in the app. Vue's `ref`, `computed` and similar are auto-imported too, and so are the stand-ins for the app's Nuxt composables (`useNuxtApp`, `useI18n`, `useState`, `useRouter`, `useRoute`, `navigateTo`). Icons are Lucide names such as `i-lucide-user-plus`.
- Use the app's own strings with `$t('key')`; the keys are in `i18n/locales/en.json`.
- Import copied app components with the app's own paths, such as `~/components/App/AppSimplePage.vue`. `~/` resolves to `studios/`, a copy of the app's `frontend/app/` folder; see `studios/README.md` for its revision and adaptations. Copy further components there unchanged.
- Every Vue app comes from `createStudiosApp` (`libraries/vue-app.ts`); see the README's preview document section. When a copied component needs another Nuxt composable or package, add a stand-in in `runtime/` and list it under `app.standIns` or `app.aliases` in `system.ts` and in `studios/README.md`; don't edit the copied file.
- Overlays stay inside the preview document, and the studio's colour mode does not reach it. The app has one light theme.
