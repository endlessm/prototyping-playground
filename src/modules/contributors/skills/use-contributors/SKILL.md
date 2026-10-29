---
name: use-contributors
description: Register someone, link a new Git email, change a profile, or review who may change what in Endless Design Studio.
---

Read this module's [README](../../README.md) first.

1. Run `yarn studio whoami --json` to see who the local Git identity resolves to. A `candidate` means the email isn't linked to that profile yet.
2. To register, run `yarn studio join` and show the person the proposed profile. Correct values with `--key`, `--name`, `--email` or `--github`, then apply with `--yes`. Warnings about a missing GitHub account or a personal email need the person's decision.
3. After a Git email change, `join` proposes linking the email to the one matching profile; with several matches, ask which one and pass `--link <key>`. Never link to a profile that matches neither the name nor the GitHub account.
4. To change a profile, preview `yarn studio profile` with the requested flags, then apply with `--yes`. Use `--as <key>` only for the person's own unlinked profile.
5. Before editing a prototype, run `yarn studio context src/prototypes/<key>/<id> --json` and respect `canEdit` and `refusal`.
6. Roles live in `studio.config.json` by studio ID. Only an Admin applies shared changes; for anyone else, propose the change in a pull request. Keep at least one Admin.
7. When a module with preferences is turned on for older profiles, an Admin runs `yarn studio preferences --plan <file>`, reviews it with the person, then `--apply <file>`.

Report what changed and which files were written. Profiles never hold roles; don't add them there.
