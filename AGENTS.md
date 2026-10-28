# Endless Design Studio

A prototyping sandbox for the Endless team, rewritten in Nuxt and Vue (ADR 0003, `docs/adr/0003-rewrite-in-vue-as-an-independent-studio.md`). This branch holds the rewrite. The React studio it replaces stays on `main`, and its code, platform context and skills are the reference for what each part must do.

## Layout

- `app/`: the Nuxt 4 app (client-rendered). `nuxt.config.ts` and `app/app.config.ts` configure it; interface strings live in `i18n/locales/en.json`.
- `tooling/`: Node scripts in TypeScript, run directly by Node 22.18+ (type stripping): build inspection, the static server behind `yarn preview`, the Node version check, deployment settings.
- `tests/unit`, `tests/integration`, `tests/e2e`: the Vitest projects. E2E scenarios drive Chromium through Playwright against the dev server and against the static build.
- Content stays apart from the app: `src/prototypes/`, `src/systems/` (each system is a yarn workspace package), `contributors/` and `studio.config.json`.

## Commands

Use yarn 4 through corepack and Node 22 (`mise.toml`). `yarn install` installs the Git hooks and prepares Nuxt.

- `yarn dev`: the studio in development.
- `yarn lint`, `yarn format:check` (or `yarn format`), `yarn typecheck`.
- `yarn test` (unit and integration), `yarn test:e2e`, `yarn test:full` (everything, as CI runs it).
- `yarn build`: the static site in `.output/public`. `STUDIO_BASE_PATH` sets the sub-path it is served under and `STUDIO_PUBLIC_URL` its public address. `yarn preview` serves it the way a static host does, and `yarn build:inspect` reports its startup weight and checks every file reference.

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
