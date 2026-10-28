# Rewrite the Design Studio in Vue, as an independent studio for the Endless team

Date: 2026-10-28. Status: accepted. Supersedes [0002](0002-generic-vue-support-in-the-platform.md).

## Context

This studio is a copy of Patrick Morgan's Design Studio (`itspatmorgan/design-studio`), written in React (TanStack Router, Base UI, shadcn) and kept in step with it through the update command, the upstream/team ownership tiers and releases. Endless Studios is written in Vue, so its screens reach prototypes through a bridge: a React view mounts a Vue app in a shadow root (ADR 0002). Bernardo maintains this studio for the Endless team; the React version stays Patrick's.

## Decision

- Rewrite the studio on the Endless Studios frontend stack (Nuxt 4, Vue 3, Nuxt UI 4, Tailwind 4, VueUse, TypeScript, Vitest and Playwright, ESLint and Prettier, yarn 4, Node 22) and replace the React version in `endlessm/design-studio` with it. The last React state is tagged before the swap, and the link to Patrick's repository is removed.
- The studio is an independent project. Patrick's Design Studio is a reference, not a source of updates.
- There is one studio, for the Endless team. What exists only to distribute and update copies goes: the update command, the upstream/team ownership split, releases and upgrade rehearsals, and setting up a new studio. Day-to-day features stay: prototypes, canvases, documents, diagrams, the Manual, systems, contributors and Admins, and module switches.
- Prototypes and systems are Vue only. Importing React design systems (shadcn) is dropped.
- The interface is rebuilt with Nuxt UI in its default, neutral look rather than the Endless Studios theme, so it does not compete with the prototypes. Screens keep their places and flows; where Nuxt UI has its own pattern (sidebar, command palette, modals), its pattern wins over today's look.
- The canvas keeps Excalidraw, which exists only in React. It is the one React piece, loaded when a canvas opens, with Vue screens mounted inside its frames as pictures.
- The new studio starts with no prototypes. The Endless Studios system is rebuilt for it, and its screens keep arriving as copied app source in this repository.
- The rewrite is built on a separate branch while the React version keeps running, and swapped in one step once every item on a functionality checklist, approved by Bernardo before work starts, is verified.

## Alternatives considered

- **Keep React with the Vue bridge (ADR 0002).** Least work, but two frameworks stay, every Endless Studios screen crosses the bridge, and the studio can't be maintained with the stack its team knows.
- **Migrate piece by piece inside the React app.** The routing and the app shell are React throughout, so both frameworks would run side by side for the whole migration.
- **Move the studio into the Endless Studios repository.** Prototypes would use the app's code without copying, but every change would go through that team's review and board process. Possible later.
- **Keep today's look exactly.** Rejected so that the interface is built from the stack's own components and patterns.
- **Replace Excalidraw with a Vue canvas.** There is no Vue equivalent; rebuilding its shapes, arrows, text and library would be a project of its own.
- **Keep React prototypes next to Vue ones.** That keeps React in prototypes and systems, which is what this rewrite removes.

## Consequences

- Improvements to Patrick's Design Studio no longer arrive; bringing one over means rewriting it.
- React design systems can no longer be imported.
- Agent guidance, platform skills and the Manual are rewritten for the new stack. The glossary entries that assume a React host (Vue mount, Screen) change when the rewrite lands, because views themselves become Vue.
- Existing prototypes and canvases are not carried over.
