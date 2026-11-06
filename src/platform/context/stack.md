---
title: Technology stack
description: Technology stack guidance for the Endless team.
---

The studio is one client-rendered Nuxt 4 app using Vue 3, Nuxt UI 4, Tailwind 4, VueUse and TypeScript. yarn 4 uses the node-modules linker. Node 22.18 or later in the pinned major runs strip-only TypeScript tooling directly. ESLint and Prettier are the code checks; Vitest projects cover unit, integration and Playwright e2e tests.

Use script setup with TypeScript, explicit local component imports, feature composables and provide/inject, computed values before watchers, routes for navigation, useOverlay for UModal and UForm for forms. Tailwind utilities and app.config define appearance. English interface strings live in i18n/locales/en.json.

Views are Vue single-file components. Each system's app factory renders inside its own same-origin preview iframe with its stylesheet and stand-ins. The studio runtime and styles stay outside. Excalidraw is the one lazy-loaded React island, owned by the canvas module.

Before choosing a Nuxt UI component, prop or slot, read the system's page for it when one exists (src/systems/endless-studios/components/<name>/<name>.md), then the Nuxt UI docs through https://ui.nuxt.com/mcp or https://ui.nuxt.com/llms.txt. Those describe the latest release, so check props and slots against the installed types in node_modules/@nuxt/ui/dist/runtime/components/<Name>.vue.d.ts. A system's own conventions win over generic Nuxt UI advice: Endless Studios records them in src/systems/endless-studios/context/app-conventions.md, such as UApp already wrapping every view and page-level tabs being routes.
