# __LABEL__

A module for Endless Design Studio. It adds a page at `/__ID__` and a button for it on the rail.

- `module.ts` declares what it is and what it adds: its label, rail button, pages, command palette entries and agent skills. `tooling/modules/contract.ts` lists everything a module can declare.
- `pages/index.vue` is the page.
- [Use __LABEL__](skills/use-__ID__/SKILL.md) is its task procedure. `AGENTS.md` routes agents to it while the module is on.

Turn it off with `yarn studio disable __ID__`, or delete it with `yarn studio remove __ID__`. Restart the dev server after either.
