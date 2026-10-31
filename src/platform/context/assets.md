---
title: Assets
description: Assets guidance for the Endless team.
---

Keep product fonts, icons, images and logos in their assigned system; prototype-only assets stay with the prototype. Shared interface assets live in public/ or app/assets/. Reference local assets through the owning build pipeline so configured base paths work.

Prefer existing assets to duplicate copies. Inspect file size and dimensions before adding a bitmap; resize and compress for the rendered use. Run yarn build and yarn build:inspect to catch broken emitted references and startup weight. Read the assigned system's asset guidance for its own inventory.

Added or changed files over 750 KB are blocked at commit and in CI. Resize them or convert images to WebP; an unavoidable large file needs its reason in .studio/asset-allowlist.json.
