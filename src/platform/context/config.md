---
title: Studio configuration
description: Studio configuration guidance for the Endless team.
---

studio.config.json declares studio presentation, modules, registered systems, defaultSystem, admins and systemMaintainers. Contributor profiles live in contributors/. Inspect tooling/modules/registry.ts and tooling/contributors/ for implemented fields and validation.

Use yarn studio status and whoami before changes. Admins manage shared settings; maintainers manage their assigned systems; contributors edit their own profiles and prototypes. Prefer the configure command or Settings when available; preview changes before applying. Consult the contributors module README for registration and Admin recovery. Recovery must preserve existing profiles and content. Keep explicit defaults in scaffolds.
