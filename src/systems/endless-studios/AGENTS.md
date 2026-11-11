# Endless Studios system instructions

This system renders the Endless Studios frontend's own Vue code: Nuxt UI 4 with the app's `app.config` customization and stylesheets. Follow the repository's working context.

When a screen, flow or copy is for a specific kind of user, read [User types](context/user-types.md): the type's section in Part 1 and the overlap matrix in Part 3. If a learner under 18 can see the work, also read Safeguarding in Part 2. The tags show how strong the evidence is; Team or Desk alone is a hypothesis, so label designs that rest on one as assumptions.

When a screen, flow or copy needs a concrete person to design or write for (setting, devices, language, messaging, channels), or a feature must be prioritized, read [Personas](context/personas.md): the persona's card and its decision test. Weigh each test by the persona's confidence, and never quote a placeholder as something a user said.

When deciding between design options, or reviewing a screen, flow or copy, read [Design principles](context/design-principles.md) and answer the review questions of the principles it touches. Safe before anything wins every conflict.

When a view shows actions, controls or names that depend on a person's role, account type or age, read [Platform model](context/platform-model.md): "Choosing the person a view is for", the action's row in "Who can do what" and, for a restricted partner or digital youth account, "Gated actions".

When a view designs the proposed Organization, Team or Cohort roles (owners, managers, Org Educator, Org Reviewer, Independent Educator), who may award or strip them, or which Programs an Organization or Independent Team can run, read [Educator roles](context/educator-roles.md): "Rules for every role", the entity's table in "Roles" and "Mapping to today". Label such a view Proposed.

When building or reviewing a view's frame, layout, components or styling, read [App conventions](context/app-conventions.md): "Decide first", then the sections for what the view uses. Rules marked Draft aren't in the app yet. The workspace's artifact theme doesn't apply to views.

When a screen, flow or copy shows a program, its sessions or tasks, or how someone joins one, read [Programs](context/programs.md): the program's section in "The catalog", and "Enrolling today" or "Proposed enrollment" for the join control.

When a screen shows skills, XP, levels, badges, certificates or credentials, read [Skills and recognition](context/skills-and-recognition.md): "Choosing labels", the taxonomy tables, and the Today and Proposed parts of the section the screen shows.

When a view needs a string the app's locale files lack, or its copy is reviewed, read [Voice and tone](context/voice-and-tone.md): "Before writing a string", then Voice, Casing and Words, and Spanish when the view has an `es` state.

When a view or named state needs a particular signed-in user, store state or GraphQL responses, or the console reports an `[Endless Studios]` gap, follow [Write sample data](skills/write-sample-data/SKILL.md).

- A prototype view is a `.vue` file in the prototype, with its permanent identity as an HTML comment at the top: `<!-- @studio-id <id> -->`. It renders in this system's preview document, a page of its own that holds only the app.
- In `.vue` files, use Nuxt UI components (`UButton`, `UCard`, `UModal`...) without importing them, as in the app. Vue's `ref`, `computed` and similar are auto-imported too, and so is every stand-in `studios/nuxt-shims.ts` exports for the app's Nuxt composables (`useNuxtApp`, `useI18n`, `useGraphQLQuery`, `useStore`, `useState`, `useNotificationsCount`, `useRouter`, `useRoute`, `navigateTo`). `$auth`, `$store`, `$graphqlRequest` and `$dayjs` come from `useNuxtApp()` or the template, as in the app. Icons are Lucide names such as `i-lucide-user-plus`.
- Use the app's own strings with `$t('key')`; the keys are in `i18n/locales/en.json`.
- Choose what the app around a screen knows with `export const system = { locale, user, sample, shell }` in the view's regular `<script>`, and override it per named state with the state's own `system`. `locale` is `en` (default) or `es`; `user` is `learner` (default, Ana), `mentor` (Marco), `admin` (Alex), a user object or `null` for signed out; `sample` holds store `state`, `getters`, `mutations` and `actions`, and GraphQL `queries` keyed by operation name; `shell: true` shows the screen inside the app's real sidebar, top bar and footer (signed out, the top bar shows Log in and Sign up). The README's "Choosing a screen's locale, user and samples" has the details. Read the console: every gap (a missing key, an unknown store action, an unmocked query) is reported once with the `[Endless Studios]` prefix and renders empty; add the sample it names.
- Import copied app components with the app's own paths, such as `~/components/App/AppSimplePage.vue`. `~/` resolves to `studios/`, a copy of the app's `frontend/app/` folder from `Endless-Game-Making-Studio/studio`; `studios/README.md` records its revision and adaptations. Images resolve from both a script's `import logo from '~/assets/images/…'` and a template's `src="~/assets/images/…"`, with no list to keep.
- To bring in more of the app or refresh the copy, follow "Refreshing the copy" in `studios/README.md`: read the private repository with `gh api`, copy files unchanged at one revision, keep the `main.css` adaptations, and record the revision. Never edit a copied file.
- Every Vue app comes from `createStudiosApp` (`libraries/vue-app.ts`); see the README's preview document section. When a copied file needs another Nuxt composable or package, add a stand-in in `runtime/` and register it once: an `export` line in `studios/nuxt-shims.ts` for an auto-imported name, or an `app.aliases` entry in `system.ts` for a module path. Add its row to the stand-ins table in `studios/README.md`.
- Overlays stay inside the preview document, and the studio's colour mode does not reach it. The app has one light theme.
