---
title: Static site
description: Static site guidance for the Endless team.
---

yarn build generates .output/public as a read-only site. Set STUDIO_BASE_PATH for a sub-path and STUDIO_PUBLIC_URL for public link metadata. Use the same base path with yarn preview and yarn build:inspect.

Verify nested routes, assets and permanent links through the static server. Source editing, profile writes and other local mutations stay out of the deployed build. Inspect output for private data before sharing. Building is separate from publishing; choose hosting only when the person requests it. No hosting provider or deployment workflow is prescribed.
