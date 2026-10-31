# __LABEL__

A design system for Endless Design Studio's prototypes. It starts empty; its Overview in the studio has a setup panel with a prompt for your agent (bring another Vue app in, or start from Nuxt UI).

- `system.ts` declares it: its name, status, colour modes, libraries, permanent ID and its Vue app.
- `app.ts` creates every Vue app the preview document mounts a view in; add the system's plugins there.
- `styles/theme.css` holds its tokens, on the `.__ID__-theme` scope.
- `components/` holds documented components, one folder each with a Markdown page.
- `context/` holds documents agents read before working with the system; `skills/` holds its task procedures, one folder each with a `SKILL.md`.
- `package.json` is its own dependency workspace.

Rename, archive, restore or delete it from its menu in the Systems area, or with `yarn studio rename-system|archive-system|restore-system|delete-system __ID__`.
