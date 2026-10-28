# Vue support is a generic platform extension; app specifics stay in the system

Date: 2026-10-22. Status: superseded by [0003](0003-rewrite-in-vue-as-an-independent-studio.md).

## Context

Endless Studios renders its own Vue code inside the studio. The build integration that makes this work was added to the platform as a local change, and it names Endless Studios directly: its default system list, its source folder, its shim file and its theme colours. The browser side (mounting Vue in a shadow root under React, adopting stylesheets, porting React slot content) lives inside the Endless Studios system, and the two halves share an undeclared global. No platform document or skill mentions Vue, so an agent asked to bring in another Vue project has no path to follow.

The studio should be ready to receive another Vue system later, without platform edits. No second Vue project is planned yet.

Team modules cannot supply Vite configuration ("Subpaths and arbitrary Vite configuration are unsupported" in the module contract), and team systems import platform code only through the public API. So build-time Vue support cannot move to a team-owned path.

## Decision

- Vue support is a deliberate local extension of the platform, kept generic: it contains no system ID, folder name, colour or composable that belongs to a particular app.
- A system says that it renders Vue, and how, in its own system declaration. The platform discovers Vue systems from the system registry instead of a hardcoded list.
- The platform owns one Vue mount for the browser (shadow root, stylesheets, component styles, colour bridge, React slot content), exposed through the public API. A system binds it to its app factory and stylesheet.
- Everything specific to one app stays in that app's team-owned system: the copied app source, the stand-ins for the app's Nuxt plugins and composables, sample data, locales, assets.
- Every upstream-path change is recorded with its reason in the studio's record of local platform changes, and the generic Vue support is shaped so it can be proposed to the Design Studio project. Proposing it is a separate decision.

## Alternatives considered

- **Leave it as it is.** No work now, but the platform keeps Endless-specific knowledge, a second Vue system would copy the mount and the configuration files, and every `pnpm studio update` keeps conflicting on system-specific code.
- **Move Vue support into a team module.** Team-owned and update-safe, but modules cannot add Vite configuration, so the build half cannot live there.
- **Keep Vue support entirely inside the Endless Studios system.** Same blocker for the build half; the platform would still have to know the system exists.
- **Split stand-ins into a generic Nuxt layer and an app layer now.** It would help a second Nuxt app, but with no second app the seam would have one adapter. Revisit when a second Vue project arrives.

## Consequences

- Adding a Vue system means adding a system folder and declaring it; no platform file changes.
- The platform's upstream diff grows by the generic Vue module and mount, but loses its Endless-specific defaults, which makes it reviewable and proposable.
- Prototypes keep importing `VueScreen` from their system, so existing views don't change.
