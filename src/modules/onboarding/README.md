# Welcome

A short welcome for the Endless team, shown over Home on a contributor's first local visit. Optional and local-only: the deployed site has none of it. It has no page, rail button or palette entry; the Manual keeps the same ideas for later.

## Behavior

The welcome is a dialog of a few steps, one idea each: what the studio is, Endless Studios screens (only while the `endless-studios` system is registered), the canvas (only while Canvases is on), how to ask the agent, and where to start. Each step has a drawing, ported from the React studio's welcome illustrations and drawn in the theme's colours, so it follows dark mode. The Endless Studios step has three tabs, Theme & components, Context and Skills, each with its own drawing and line. A dot progress indicator, announced as "Introduction progress" with the step's title, marks the current step. The first button is "Show me around", then Back and Next, and the last is "Explore my studio". "Skip introduction", Escape and a click outside also finish it. While the Manual is on, the agent step links to its "Working with your agent" chapter, which finishes the welcome.

It opens once per contributor per studio, even across browsers and restarts:

- Home's block (`components/WelcomeHome.vue`, first locally) waits until `/_studio/me` has answered. A slow identity never claims the welcome, so it can't use up someone's first visit.
- It then posts `{ "action": "claim" }` to `<base>_studio/modules/onboarding/claim` (`server/claim.ts`, `claim.ts`). The dev server resolves who is asking and records `preferences.onboarding.welcomeDismissed: true` on their own profile, `contributors/<key>.json`, keeping every other field. The answer is `{ "show": true }` the first time and `false` after. Nobody can claim it for anyone else.
- Setting the flag back to `false` shows it again on the next visit to Home.
- Before registration the server answers `{ "show": null }`, and the browser remembers instead (local storage, per studio base path and contributor). The browser also remembers when the request fails. Its memory is lost with a new browser or origin.
- A profile whose flag is missing or not true/false gets 422, and the welcome stays closed: it's a problem to fix, never a first visit. `yarn studio join` writes `false` for new profiles; an Admin adds a missing section to existing ones with `yarn studio preferences --module onboarding --plan <file>`, then `--apply <file>`. A successful answer without a valid `show` shows an error toast.

Its only profile change is that flag. It creates no work, installs nothing and registers nobody. Turning the module off removes the welcome and leaves the flags in the profiles.

## Ownership

- `module.ts` declares the module, its `welcomeDismissed` preference, the `claim` handler and the skill.
- `components/WelcomeHome.vue` claims the welcome from Home; `components/WelcomeModal.vue` is the dialog, opened through `useOverlay`; `components/WelcomeSketch.vue` draws its illustrations. Its text is under `welcome` in `i18n/locales/en.json`.
- `utils/progress.ts` decides in the browser, with the fallback; `claim.ts` and `server/claim.ts` record it on the profile.
- [get-started](skills/get-started/SKILL.md) helps an agent guide a newcomer to a first prototype on Endless Studios screens.

The welcome's copy is written for the Endless team: what the studio is, Endless Studios screens, the canvas and how to ask the agent. Keep it short and about the next useful step; detailed explanations belong in the Manual.
