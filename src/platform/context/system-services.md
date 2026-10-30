---
title: Systems and preview boundaries
description: Systems and preview boundaries guidance for the Endless team.
---

Read registered systems through tooling/systems/registry.ts and their system.ts declarations. Never hardcode a system key. A system declares its app factory, stylesheet, copied source, aliases and stand-ins. Its own AGENTS.md and README explain component imports and options.

Read tooling/systems/contract.ts before changing an app declaration. The stand-ins module's exports supply its auto-imported names; register a new name in that module. Follow the system's own refresh procedure when updating copied source.

System examples and views render in a same-origin preview document. The validated preview channel carries configuration, lifecycle, navigation and shortcuts. The system owns its theme; studio styles and Nuxt composables stay outside its document. Copied source receives the system's stand-ins. Read the assigned system before adding dependencies or refreshing copied source.
