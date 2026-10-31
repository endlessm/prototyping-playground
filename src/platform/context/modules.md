---
title: Modules
description: Modules guidance for the Endless team.
---

All modules live in src/modules/<id>/. module.ts declares label, pages, rail, Home, palette data, file types, build data, preferences and agent skill routes. tooling/modules/contract.ts is authoritative. studio.config.json determines activation; required modules remain enabled.

Use yarn studio list, enable, disable, remove and create-module. Commands that preview require --yes to apply; enable and disable apply immediately. Removal keeps content unless explicitly requested. Restart the recorded dev server after changing availability. Installed module code is trusted executable code.

Skills use module-relative paths and when triggers. Run yarn studio sync after changes. Disabling removes routes, adapters and application contributions without deleting files. Keep public prototype imports within the module's library (the library field, imported as @module/<id>); consult tooling/modules/contract.ts and the checks owner before exposing a new entry point.

Modules declare references adapters for file moves and renames; the registry retains them while a module is disabled so saved content can still be repaired. An adapter's optional copy rewrites a duplicated prototype's permanent IDs in a way its kind of source records (a canvas element's new version); without one they are replaced as text. Palette entries take hidden search keywords; paletteSource lists the manifest's prototypes or systems, and paletteOrder places the module's group in the command palette. A module adds items to a prototype's menu with prototypeActions: a browser file, relative to the module, whose default export returns { label, icon?, onSelect } items for a prototype; they show only to whoever may change it. A file type names the surfaces its embed preview shows on with embedIn (document, canvas; both when left out) and shows as a card elsewhere; embedPending names a small .vue component, bundled with the studio and importing nothing heavy, shown while that preview loads. Follow tooling/modules/contract.ts and the owning module README when adding a file type.
