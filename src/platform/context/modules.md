---
title: Modules
description: Modules guidance for the Endless team.
---

All modules live in src/modules/<id>/. module.ts declares label, pages, rail, Home, palette data, file types, build data, preferences and agent skill routes. tooling/modules/contract.ts is authoritative. studio.config.json determines activation; required modules remain enabled.

Use yarn studio list, enable, disable, remove and create-module. Commands that preview require --yes to apply; enable and disable apply immediately. Removal keeps content unless explicitly requested. Restart the recorded dev server after changing availability. Installed module code is trusted executable code.

Skills use module-relative paths and when triggers. Run yarn studio sync after changes. Disabling removes routes, adapters and application contributions without deleting files. There is one module folder and no module public-API partition.
