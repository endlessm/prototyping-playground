---
name: manage-modules
description: Create, enable, disable or remove modules, or manage registered systems.
---

1. Run `yarn studio status` and `yarn studio list`. Read [Modules](../../context/modules.md), the affected README and CLI help. Shared changes require an Admin.
2. Use create-module, enable, disable or remove. Preview before --yes where supported; enable and disable apply immediately. Keep content unless deletion was requested. Required modules remain installed and enabled. Treat installed code as trusted executable code; inspect its source before adopting it.
3. For system creation, rename, archive, restore or deletion, consult the enabled systems module README and use its implemented commands. Preserve prototypes and pending rebuild originals. Dependency changes use yarn; edit canonical declarations rather than generated adapters or lockfiles.
4. Run sync, restart the recorded dev server when availability changes, and verify the affected routes and surviving content. Report changes and any unavailable command instead of inventing an alternative distribution workflow.
