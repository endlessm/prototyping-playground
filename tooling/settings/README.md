# Settings and configuration

`service.ts` owns the validation shared by the local Settings page and `yarn studio configure`. `settingsSnapshot(root, options)` reads fresh configuration, profiles, roles, installed modules and system declarations. It exposes an exact-source SHA256 revision. `planSettings(snapshot, changes)` validates without writing; `saveSettings(snapshot, changes, revision, recovery)` refuses non-Admins and conflicting revisions before changing the file. The optional recovery flag is for explicitly authorised CLI repository recovery only. The browser never accepts it.

Role arrays hold permanent contributor IDs, not folder keys. `admins` must contain at least one registered contributor. `systemMaintainers` patches should retain all other systems' entries. Required modules cannot be disabled. Default-system changes never change prototype metadata: existing prototypes already have explicit assignments.

`config-file.ts` parses strict JSON, rejecting comments and repeated keys with the filename, and edits changed source ranges while preserving unrelated text and key order. `studio.config.schema.json` provides editor completion; runtime checks also verify references to registered profiles, systems and installed modules.

The dev-only Vite endpoint `<base>_studio/settings` accepts same-origin GET and POST. GET returns configuration, revision, role, system/module choices and a server-instance token, without contributor profiles. POST accepts `{ revision, changes }`, returns 403 for role refusals, 409 for conflicts and 400 for invalid input. No settings endpoint exists in the static build.

The Nuxt module debounces configuration and `system.ts` file changes, sends `studio:restarting` before restarting the Nuxt child, and leaves the parent server and port intact. The client covers the page, polls for a changed instance, reloads, then uncovers after mount. An inline head script recreates the cover if the browser reloads during restart. The fallback appears at 15 seconds, with a longer-wait message at 30 seconds. Reduced motion stops the spinner and fade.
