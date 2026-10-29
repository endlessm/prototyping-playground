# Endless Design Studio

A prototyping sandbox for the Endless team, rewritten in Nuxt and Vue (ADR 0003, `docs/adr/0003-rewrite-in-vue-as-an-independent-studio.md`). This branch holds the rewrite. The React studio it replaces stays on `main`, and its code, platform context and skills are the reference for what each part must do.

## Layout

- `app/`: the Nuxt 4 app (client-rendered). `nuxt.config.ts` and `app/app.config.ts` configure it; interface strings live in `i18n/locales/en.json`. The frame is Nuxt UI's dashboard (`app/layouts/default.vue`): the rail (`AppRail.vue`), then the page. A section page puts its navigation first with `AppSectionNav.vue`, which owns hiding (⌘;), resizing and remembering. Shared pieces: `AppNotFound`, `AppFileBoundary` (a crash in one file's page), `HomeBlock`, `useStudioToast`, `shortcutLabel` (⌘ on Apple computers, Ctrl elsewhere), `menuGroups` and `afterMenuCloses` for menus, `requestJson` for the dev server. Preferences this browser remembers use keys starting with `design-studio:`.
- `tooling/`: Node scripts in TypeScript, run directly by Node 22.18+ (type stripping): the `studio` command (`tooling/studio/`), the module registry and the Nuxt module that builds modules into the app (`tooling/modules/`), the system registry (`tooling/systems/`), the manifest of prototypes and artifacts (`tooling/manifest/`), the preview documents views render in (`tooling/preview/`), contributors, identity and roles (`tooling/contributors/`), permanent IDs of prototypes and artifacts: the audit, `identify` and the dev server's assignment (`tooling/identity/`), the dev-server registry (`tooling/dev-server/`), build inspection, the static server behind `yarn preview`, the Node version check, deployment settings, and the parity harness (`tooling/parity/`).
- `src/modules/<id>/`: studio modules, all in one folder. `module.ts` declares the module (`tooling/modules/contract.ts` lists the fields): label, rail button (top, bottom or none), Vue pages under `/<id>`, a Home block, `localOnly` (left out of the deployed site), command palette entries, agent skills, a content folder, file types (such as views) and named build data. `studio.config.json` turns each one on or off; the dev server reads both when it starts, so a switch takes a restart.
- `tests/unit`, `tests/integration`, `tests/e2e`: the Vitest projects. E2E scenarios drive Chromium through Playwright against the dev server and against the static build.
- `tests/parity/`: parity scenarios, run by `yarn parity` (its own Vitest config, `vitest.parity.config.ts`, outside `test:full`) against this studio and the React studio on `main`, each with the fixtures in `tests/fixtures/parity/`. They find elements by accessible role and name only, so one script drives both studios.
- Content stays apart from the app: `src/prototypes/`, `src/systems/` (each system is a yarn workspace package that declares its Vue app in `system.ts`), `contributors/` and `studio.config.json`.
- Views render in their system's preview document, a same-origin iframe built by a Vite pipeline of its own beside the Nuxt app, so it holds only the system's app and never the studio's styles or Nuxt runtime. Prototype and system code is never compiled by the studio's Nuxt build.

## Commands

Use yarn 4 through corepack and Node 22 (`mise.toml`). `yarn install` installs the Git hooks and prepares Nuxt.

- `yarn dev`: the studio in development. `yarn dev --host` also serves it at the computer's network address, to open it from a phone or tablet over plain http.
- `yarn studio`: lists the studio commands. Commands that change files print a preview and change nothing until rerun with `--yes`; `enable` and `disable` apply right away. Shared changes (modules, configuration) need an Admin; restart the dev server after them.
  - Inspect: `status`, `whoami` (the contributor your Git identity resolves to), `context src/prototypes/<key>/<id> --json` (owner, system, pending rebuild, `role`, `canEdit`), `list`.
  - Contributors: `join`, `profile`, `preferences` (see `src/modules/contributors/README.md`). `--as <key>` runs one command as your own profile after a Git email change.
  - Permanent IDs: `identify src/prototypes/<key>/<id> [--yes] [--json]` (after writing files directly; previews first, works in your own prototypes, never replaces an ID) and `identity-audit [--json]` (counts resources, reports missing, malformed and duplicate IDs; exits 1 on any).
  - Modules: `enable`, `disable`, `remove`, `create-module`.
  - Dev server: `dev status`, `dev restart`, `dev stop`. The running server records itself in `.studio/runtime/`, and a second one is refused unless `STUDIO_DEV_FORCE=1`. Restart or stop the studio's server only through these commands, never by port or process name.
- `yarn lint`, `yarn format:check` (or `yarn format`), `yarn typecheck`.
- `yarn test` (unit and integration), `yarn test:e2e`, `yarn test:full` (everything, as CI runs it).
- `yarn parity [file filter]`: runs the parity scenarios against both studios and writes screenshot pairs side by side to `.scratch/parity/runs/<time>/index.html`. The React side is a copy of `main` in `~/.cache/studio-parity` (`STUDIO_PARITY_CACHE`), installed once per commit with the Node and pnpm its `mise.toml` names (mise must be on PATH), started with its own `pnpm dev` and stopped with its own `pnpm studio dev stop`. `STUDIO_PARITY_REF` picks another commit; `STUDIO_PARITY_SIDES=vue` runs one side.
- `yarn parity:coverage [--checklist <file>]`: lists the checklist rows named by tests, those with a recorded visual check (`tests/parity/visual-checks.json`) and those with neither, in `.scratch/parity/coverage.md`.
- `yarn build`: the static site in `.output/public`. It stops when any resource is missing its permanent ID or shares one, naming the file. `STUDIO_BASE_PATH` sets the sub-path it is served under and `STUDIO_PUBLIC_URL` its public address. `yarn preview` serves it the way a static host does, and `yarn build:inspect` reports its startup weight and checks every file reference.

Before creating content, run `yarn studio whoami`; before editing a prototype, run `yarn studio context` on it and respect `canEdit`.

Save verbose check output to a log, read the exit status, and report results concisely.

## Code conventions

Follow the Endless Studios frontend: `<script setup lang="ts">`, explicit imports of the studio's own components (component auto-import is off; Nuxt UI components are global), `[Context][Presentation].vue` names, state in the feature through composables and provide/inject, computed over watchers, routes over in-page switches, `UModal` through `useOverlay`, `UForm` for forms, Tailwind utilities instead of `<style>` blocks, theming through `app.config.ts`, and no hardcoded interface text. Comments explain why, not what.

Tests drive the studio the way a person or agent does and name the checklist rows they cover, such as `[CL-111]`.

## Agent skills

### Issue tracker

Issues and specs are local markdown files under `.scratch/<feature>/`, which is gitignored and stays on this machine. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage roles, recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
