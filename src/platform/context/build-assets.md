---
title: Module build data
description: Module build data guidance for the Endless team.
---

A module declares named JSON loaders in module.ts data. Each loader has load and repository-relative watch patterns. See tooling/modules/contract.ts and tooling/modules/build-data.ts for the authoritative types and cache behavior.

Development computes a value on demand and caches it until a watched file changes. Same-origin GET requests expose it under _studio/data/<module>/<name>. The static build emits hashed JSON addressed by virtual:studio-module-data. Keep expensive computations inside load and include every source dependency in watch. A disabled module contributes no build data.
