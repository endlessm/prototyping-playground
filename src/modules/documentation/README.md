# Manual

The Documentation module owns the Manual at `/documentation/manual`: chapters about using the studio, written for the Endless team. Its rail button and command palette group are labelled **Manual**. The module is optional and on by default. Its palette group follows Systems and Prototypes (palette order 30); the current chapter is disabled.

Beside it, the studio owns **Context & Skills** at `/documentation/context/<owner>`, which shows the Platform's and enabled modules' own guidance files. It stays when this module is off. `/documentation` opens the Manual, or Context & Skills while the Manual is off. Systems' guidance lives in the Systems area.

## Chapters

Chapters are the Markdown files in `pages/` (the folder only; subfolders aren't read). Each needs frontmatter with a `title` and a numeric `order`. Optional fields:

- `description`: the summary under the title.
- `section`: the sidebar heading a run of chapters sits under, in order.
- `toc: true`: "On this page", when the chapter has two headings or more.
- `module: <id>`: the chapter shows (reading, sidebar, palette) only while that module is on. Off, the chapter is hidden, not broken.

The file name is the chapter's address (lowercase letters, numbers and dashes): `pages/<slug>.md` opens at `/documentation/manual/<slug>`, and `index.md` at `/documentation/manual`. The tab title is "<chapter> â€” Manual â€” <studio>". There is no previous/next sequence: the Manual is a reference, in its set order.

Link between chapters by file (`[Help](questions.md#where-is-my-work)`); the reader opens the chapter at its heading. Links to guidance files (`../../prototypes/README.md`) open in Context & Skills.

`manual.ts` reads the chapters with Node built-ins, because the `studio` command loads `module.ts`. A chapter whose metadata can't be read (no title, no numeric order, an address that isn't a slug, a `module` that isn't a module ID) is skipped with a warning naming the file and the fix. The strict build stops on it (the `manual` build data refuses to load, and `check.ts` reports it to `studio check`). Locally it still opens in source mode at its address, so it can be repaired.

## Build data and palette

The `manual` build data holds the chapters, their text and the module's folder; locally also the skipped chapters' problems and every chapter file. It refreshes while the dev server runs whenever a chapter file changes, so open chapters update in place. The deployed site ships it as JSON.

The command palette's **Manual** group lists the chapters by title (`palette` in `module.ts`, read when the dev server starts). Search matches titles, not the text.

## Context & Skills

The studio's own build data (`studio/guidance` and `studio/guidance-documents`, from `tooling/guidance/`) lists each owner: the **Platform** (`src/platform/`, or `STUDIO_PLATFORM`) and each enabled module (local-only modules only locally). An owner's documents are its `README.md` (at the owner's address), `context/**/*.md` (`context/<path>`), each `skills/<name>/SKILL.md` (`skills/<name>`) and, for modules, other top-level Markdown files such as contracts (`reference/<file>`). Context documents take their title from their frontmatter or first heading; skills from their folder name.

The navigation (`app/components/documentation/GuidanceNav.vue`) has a Platform section and a Modules section with one folding branch per module. Entries show a type icon, and "Document", "Context" or "Skill" on hover and keyboard focus. Branches stay as left while the studio is open and open for the current document. **Search** filters owners, titles, kinds and file paths (not the text); matching branches open while it lasts; Escape clears, then closes; "No matching resources" when nothing matches. The navigation stays mounted, with its scroll, search and branches, while documents and source mode change.

An owner without a README lists its Context and Skills ("No context added." when empty). Each document ends with **About this context**: its file, what it is for, and the documents that link to it.

## Source and file actions

Right-click a chapter or guidance entry for **Edit source**, **Open in editor**, **Show in Explorer** (**Reveal in Finder**, **Show in folder**), **Copy link** and **Copy path**. There is no create, drag, rename or delete here. The deployed site keeps Copy link and Copy path.

Source mode (`?mode=source`, âŒ˜' / Ctrl+') uses the shared source editor under a banner: "Shared platform documentation. Changes affect the studio for everyone on the team." A skill's source has a picker for its supporting files. The dev-only file route `_studio/files/guidance-source` (`tooling/files/guidance-source.ts`) reads any listed guidance file, a skill's files and every chapter file while the Manual is on, and saves over the version read; only an Admin saves, since these are the studio's own files. It also shows a file in the file browser or a code editor.

## Files

- `module.ts`, `manual.ts`, `check.ts`: the declaration, chapter discovery and the content check.
- `components/ManualFrame.vue`, `components/ManualChapterPage.vue`: the Manual's navigation and chapter page.
- `pages/*.md`: the chapters.
- `skills/write-manual/`: the agent skill for writing chapters.
- Shared with Context & Skills, in `app/`: `pages/documentation/`, `components/documentation/` (header tabs, navigation entry, reader page, source), `composables/useGuidance.ts`, `composables/useGuidanceFiles.ts` and `utils/documentationLinks.ts`.
