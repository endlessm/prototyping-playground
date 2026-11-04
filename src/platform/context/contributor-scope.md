---
title: Contributor scope
description: Contributor scope guidance for the Endless team.
---

Resolve identity with yarn studio whoami. Inspect a prototype with yarn studio context before editing; use its owner, assignment, pending rebuild and canEdit result.

| Role              | Editable scope                            |
| ----------------- | ----------------------------------------- |
| Contributor       | Own profile and own prototypes            |
| System maintainer | Assigned system, plus contributor scope   |
| Admin             | Shared studio settings, roles and content |

A module's hidden prototype folder (prototypeFolder, such as comments in .comments) is inside every registered contributor's scope, in anyone's prototype, so reviewing a colleague's work never needs an Admin; every other file of their prototype stays outside. The scope check reads the declarations from the before revision, turned-off modules included, so a proposal cannot declare its own folder into scope.

Review the before-side owner for moves, copies and deletion. Explicit task authorization still applies, but it cannot bypass server scope validation. Preserve other contributors' work. Use --as only for your own registered profile after an email change. Copying or duplicating content allocates fresh identities; moving preserves them. A module being installed does not mean it is enabled.
