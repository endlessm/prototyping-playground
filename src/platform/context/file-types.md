---
title: Artifacts and file types
description: Artifacts and file types guidance for the Endless team.
---

A prototype contains artifacts supplied by enabled modules. Views are .vue single-file components; documents, diagrams, canvases and text follow their module declarations. Inspect tooling/modules/contract.ts for ModuleFileType: extensions, page, identity adapter, optional check and fidelity adapter.

A type declares where it embeds rather than inheriting that from an extension; embedIn names where its embed preview shows (document, canvas; both when left out), and embedPending what shows while it loads. A type's page may offer an artifact surface (app/utils/artifactSurface.ts) so tools such as comments can point into it; [Modules](modules.md) covers artifactTool and the surface, and the type's module README describes its own. Identity readers interpret comments or metadata without evaluating executable content. Read the type's module README before changing formats, embeds or reference handling. Disabled types retain files on disk and show an unavailable state rather than deleting content.
