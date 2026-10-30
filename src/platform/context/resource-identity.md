---
title: Permanent identities
description: Permanent identities guidance for the Endless team.
---

Resource IDs are permanent opaque addresses for prototypes, artifacts and named states. Keep them in leading comments or metadata, never executable state objects. Rename and move preserve IDs; duplication allocates fresh ones.

After writing files run yarn studio identify <prototype> to preview assignments, then --yes. yarn studio identity-audit reports missing, malformed and duplicate IDs. Builds validate rather than assign. View markers use HTML comments: @studio-id and @studio-state <id> <title>. State titles must match the statically declared list. Read ADR 0001 with ADR 0003's Vue adaptation and the prototypes module README.
