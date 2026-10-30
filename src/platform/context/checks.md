---
title: Verification
description: Verification guidance for the Endless team.
---

Inspect package.json for current lint, format:check, typecheck, test, test:e2e, test:full, build and build:inspect commands. Unit and integration tests cover logic and real commands; e2e files drive Playwright against development and static output. CI runs the full suite and production build.

For a bug, write a failing behavioral test, implement the fix, then refactor with tests green. Test observable files, output, addresses and accessible UI rather than private implementation. Preserve meaningful checks; diagnose failures instead of suppressing them. Prototype checks include permanent identities, named states and import scope. Pending rebuilds follow the assigned system's rules.

Run yarn studio sync --check to detect guidance drift. Check implementations, hooks, CI and import boundaries belong to tooling and their tests, not to this document. Save verbose check output to a log and report exit status and unresolved warnings.
