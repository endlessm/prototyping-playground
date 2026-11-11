# __LABEL__

A module for Endless Prototyping Playground. It adds a page at `/__ID__` and a button for it on the rail.

- `module.ts` declares what it is and what it adds: its label, rail button, pages, command palette entries and agent skills. It can also add a block to Home (`home`, built with `app/components/HomeBlock.vue`) and keep itself off the deployed site (`localOnly: true`). A page with its own navigation puts `app/components/AppSectionNav.vue` before its `UDashboardPanel`. `tooling/modules/contract.ts` lists everything a module can declare.
- `pages/index.vue` is the page.
- [Use __LABEL__](skills/use-__ID__/SKILL.md) is its task procedure. `AGENTS.md` routes agents to it while the module is on.

Turn it off with `yarn studio disable __ID__`, or delete it with `yarn studio remove __ID__`. Restart the dev server after either.
