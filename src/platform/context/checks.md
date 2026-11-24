---
title: Verification
description: Verification guidance for the Endless team.
---

Inspect package.json for current lint, format:check, typecheck, test, test:e2e, test:full, build and build:inspect commands. Unit and integration tests cover logic and real commands; e2e files drive Playwright against development and static output. CI runs lint, types, unit and integration tests and the production build on every push; the e2e files run there only on demand (Run workflow, or the `run-browser-tests` label on a pull request), so run `yarn test:e2e` locally before pushing.

For a bug, write a failing behavioral test, implement the fix, then refactor with tests green. Test observable files, output, addresses and accessible UI rather than private implementation. Preserve meaningful checks; diagnose failures instead of suppressing them. Prototype checks include permanent identities, named states and import scope. Pending rebuilds follow the assigned system's rules.

Run yarn studio sync --check to detect guidance drift. Pre-commit warns about your Git identity and out-of-scope changes, blocks oversized assets and failing studio checks, then lints and formats staged files. Pre-push prints a scope summary. CI checks scope and assets on the pushed range, then lint, format, types, studio checks, sync, the build and the unit and integration tests; guidance-only changes skip types, the build and the tests, and the browser tests run only on demand. tooling/checks/README.md owns their implementations and remedies. Save verbose check output to a log and report exit status and unresolved warnings.
