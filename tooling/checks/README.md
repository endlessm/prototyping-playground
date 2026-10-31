# Studio checks

`yarn studio check` (also `yarn check`) reports configuration, module, system, contributor, metadata and prototype import problems, exiting 1 on any. Each enabled module's `check.ts` exports `check({ root, dir, enabled })`, returning problem strings (async is allowed). The manifest warns in development and stops the static build on module check or metadata problems. The Manual module owns its page validation through this hook.

`yarn check:assets` reads added/modified blobs from Git's index. Files over 750 KiB fail with their measured size and conversion advice. `.studio/asset-allowlist.json` maps exact repository paths to nonempty reasons for unavoidable large files. CI passes `--ci <before> <after>` to inspect the committed range.

`yarn check:scope` reports inside/outside scope and removed, changed or duplicated permanent markers, without blocking locally. CI uses `--ci <before> <after>`; `--review` flags a pull request without refusing it. Profiles, Admin grants and system maintainers come from the before revision. The workflow looks up the authenticated pusher's repository role; repository Admins and maintainers bypass scope refusals, but identity errors still fail pushes. The workflow runs the checked-out implementation and reads authority from Git blobs in the previous revision, so a proposal cannot grant itself scope.

Pre-commit runs identity/scope warnings, blocking assets and studio checks, then lint-staged. Pre-push gives a scope summary, without a build.

Identity checks read document IDs from frontmatter, canvas IDs from the top-level object, and diagram IDs from leading `%% @studio-id` comments in `.mermaid` and `.mmd` files. Examples in document bodies, diagram labels and canvas element data are not resource declarations.

The preview guard runs before Vue compilation in development and production. It parses both script blocks, reexports, literal dynamic imports and TypeScript helpers. Views can use their prototype, assigned system, Vue, `#studio/prototype` and enabled modules declaring a public `library`; a system's component examples files (`<name>.examples.vue`) may also import `#studio/examples`. Computed imports, other prototypes, private tooling, undeclared packages, global CSS and public-path assets fail with a file and remedy. Use imported colocated assets, scoped styles or `.module.css`.

`yarn typecheck` uses Nuxt's generated app, Node, server and shared projects. The app, tooling, modules and tests are included. Prototype and system content stay outside the Studio runtime's Nuxt types, including prototypes awaiting rebuild with a missing system. Their preview pipeline compiles them separately.

CI also runs `yarn studio sync --check` to reject stale generated guidance and skill adapters without rewriting them.
