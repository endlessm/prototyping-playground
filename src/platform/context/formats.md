---
title: Stored formats
description: Stored formats guidance for the Endless team.
---

Stored prototype and canvas formats belong to their declaring modules. Preserve permanent IDs, unknown data and explicit version fields. Read the owning README and format parser before editing serialized content.

A format change needs a deliberate migration with representative old files, validation failures and round-trip coverage. Preview destructive changes, preserve the original, and document recovery. A build validates stored content; it does not silently migrate files or allocate new identities.
