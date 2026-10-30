---
title: Technology stack
description: Technology stack guidance for the Endless team.
---

The studio is one client-rendered Nuxt 4 app using Vue 3, Nuxt UI 4, Tailwind 4, VueUse and TypeScript. yarn 4 uses the node-modules linker. Node 22.18 or later in the pinned major runs strip-only TypeScript tooling directly. ESLint and Prettier are the code checks; Vitest projects cover unit, integration and Playwright e2e tests.

Use script setup with TypeScript, explicit local component imports, feature composables and provide/inject, computed values before watchers, routes for navigation, useOverlay for UModal and UForm for forms. Tailwind utilities and app.config define appearance. English interface strings live in i18n/locales/en.json.

Views are Vue single-file components. Each system's app factory renders inside its own same-origin preview iframe with its stylesheet and stand-ins. The studio runtime and styles stay outside. Excalidraw is the one lazy-loaded React island, owned by the canvas module.
