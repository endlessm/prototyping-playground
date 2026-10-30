---
title: Artifacts and file types
description: Artifacts and file types guidance for the Endless team.
---

A prototype contains artifacts supplied by enabled modules. Views are .vue single-file components; documents, diagrams, canvases and text follow their module declarations. Inspect tooling/modules/contract.ts for ModuleFileType: extensions, page, identity adapter, optional check and fidelity adapter.

A type declares its supported surfaces rather than inheriting them from an extension; embedIn names where its embed preview shows (document, canvas; both when left out). Identity readers interpret comments or metadata without evaluating executable content. Read the type's module README before changing formats, embeds or reference handling. Disabled types retain files on disk and show an unavailable state rather than deleting content.
