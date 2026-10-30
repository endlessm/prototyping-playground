---
title: Working in the studio
description: Working in the studio guidance for the Endless team.
---

Preserve existing work and the person's explicit decisions. Read [Contributor scope](contributor-scope.md) before shared changes or content edits.

Before creating content, run `yarn studio whoami --json`. Before editing a prototype, run `yarn studio context src/prototypes/<key>/<folder> --json`; respect canEdit, read its assigned system's AGENTS.md and relevant context. Explicit systemId: null means no system. Missing assignments are invalid. For a pending rebuild read both systems, work in the rebuild copy and preserve the original.

Use yarn and the Node version in mise.toml. Inspect package.json for check commands. Run applicable tests and the production build before committing finished changes. Save verbose output to a temporary log, inspect its exit status and warnings, and report the path. Review rendered UI when changing an interface.

Before starting a server, run `yarn studio dev status`. Use the recorded server when possible. Restart and stop through `yarn studio dev restart` and `yarn studio dev stop` only for a server you are authorized to manage. Never stop another session's server by port or process name.

Update affected owner READMEs, context, skills and Manual chapters with behavior changes. Run `yarn studio sync` after skill or module changes. Commit completed work; push and publish only when requested.
