---
title: Systems and preview boundaries
description: Systems and preview boundaries guidance for the Endless team.
---

Read registered systems through tooling/systems/registry.ts and their system.ts declarations. Never hardcode a system key. A system declares its app factory, stylesheet, copied source, aliases and stand-ins. Its own AGENTS.md and README explain component imports and options.

System examples and views render in a same-origin preview document. The validated preview channel carries configuration, lifecycle, navigation and shortcuts. The system owns its theme; studio styles and Nuxt composables stay outside its document. Copied source receives the system's stand-ins. Read the assigned system before adding dependencies or refreshing copied source.
