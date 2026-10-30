---
title: Contributor preferences
description: Contributor preferences guidance for the Endless team.
---

Each module may declare preferences.defaults with text, numeric, boolean or null values. Profiles store the module section under preferences. Registration writes explicit defaults from enabled modules.

Admins use yarn studio preferences --plan <file>, inspect the saved plan, then --apply <file> to initialize missing sections. Preserve existing values and refuse unknown keys or values that disagree with the declared default's type. The CLI and module registry are authoritative; inspect their help and types before changing a schema.
