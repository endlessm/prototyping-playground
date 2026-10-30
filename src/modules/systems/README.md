# Systems

The Systems area: each design system's Overview, Libraries, Context and Skills, with the Theme, Assets and Components its navigation lists. The studio always has it (required), with a rail button (shapes icon) and a Home block. Systems themselves live in `src/systems/<key>/`, registered in `studio.config.json` (`tooling/systems/registry.ts`); there is no built-in "Studio" system: the studio's own interface is plain Nuxt UI.

- `module.ts` declares the module, its pages and its build data.
- `pages/index.vue` is `/systems`, the collection.
- `pages/system.vue` is `/systems/<system-id>`, the frame: the system's navigation (`components/SystemNav.vue`) in the section panel, kept on screen while its child pages change, each starting at the top. Its children are `overview.vue` (the address itself), `libraries.vue`, `context.vue` and `skills.vue` (the sections), `context-document.vue` and `skill-document.vue`, `theme.vue` (`/colors`, `/typography`, `/radius`, `/shadows`, `/spacing`, `/motion`, `/effects`, `/tokens`) and `missing.vue` (anything else: "Page not found", with the navigation kept).
- `components/SystemsHome.vue` is the Home block: up to three active systems, the default first, and a link to the collection.
- `composables/useSystemCatalog.ts` loads the build data; `utils/pages.ts` holds the addresses and source files of a system's pages.

Addresses use the system's permanent `studioId`, so they survive renames: `/systems/<id>`, `/libraries`, `/context/<path>` (the file without `.md`), `/skills/<skill>/SKILL` and a skill's other documents (`/skills/<skill>/references/steps`) and text files, with their extension (`/skills/<skill>/scripts/check.mjs`), the theme pages, `/fonts`, `/icons`, `/images` and `/components/<folder>`. Tab titles read "<page> — <system> — Systems — <studio name>".

## Build data

The catalog (`tooling/systems/catalog.ts`) is computed on Node from each system's folder, refreshed in development when a file in the systems folder changes:

- `systems/catalog`: per system, its label, status, folder and colour modes; the Overview's `summary`, `guidance` and `code` (from `system.ts`'s `overview`); its libraries with the installed version (`null` when the package isn't installed); its theme tokens (custom properties in `app.stylesheet` and the local files it imports, each name once, by page: colours, typography, radius, shadows, spacing, motion, effects, other); documented components (a folder in `components/` with a Markdown page, titled by its `title`); local assets in `assets/` (fonts by extension, `icons/` as icons, other images as images); Context documents in file-tree order with their folders; and one entry per skill, with its files, `SKILL.md` first.
- `systems/documents`: the Markdown text of Context and Skills, and the text of skills' other files (a script), by repository path, loaded when a document first opens. Binary files (`tooling/systems/text-files.ts`: pictures, fonts, archives and the like by extension, or content with NUL bytes or invalid UTF-8) are left out.

The deployed site gets active systems only: archived ones, with their documents, stay out of the build. The dev server and the build warn about a system's Context and Skills (`systemContentProblems`): Context holds Markdown documents; each skill is a folder with a `SKILL.md` whose frontmatter names it as its folder (lowercase words and single hyphens, at most 64 characters) and describes it (at most 1024 characters).

## The collection

"Systems", with "Components, styles, assets, and guidance for your prototypes." Each system is a card (name, summary or a generic line, "Used by N prototypes") or a list row, by the shared cards/list preference (`useCollectionView`, remembered in this browser as `design-studio:collection-view`, shared with other collections). The default system comes first with a **Default** badge, then the others alphabetically; archived systems sit in a muted **Archived** section below. The search ("Search systems", kept in `?q=`) matches the ID, folder, name, description and the word "Default"; no match shows "No matching systems" with **View all systems**.

Each card, row and navigation header has the system's "…" menu ("Actions for <Name>"): **Copy link**, and locally, for a registered contributor, **Copy path**. Archived systems have no menu until the lifecycle actions arrive (ticket 27: New system, rename, archive, restore, delete, default).

## A system

The navigation shows the system's name, its "…" menu and, for the configured default, "Default system". Its **Resources** toolbar has **Search** and **Expand all / Collapse all** (off while searching). Entries, in order: Overview, Libraries, Context, Skills, Theme, Assets, Components. Branches start open, fold with their chevrons, and stay as left for the session in this page (a reload opens them again); the branch holding the current page opens. Context keeps its folders; Skills shows one entry per skill. Theme lists only the pages its tokens fill ("No tokens yet" without any); Assets always lists Fonts, Icons and Images; Components lists documented components ("Empty folder" without any). Hovering a branch shows its folder, an item its file. Search ("Search system") filters by names and file paths, and Libraries by its libraries' names and descriptions, opening what matches; Escape clears it, a second Escape closes it; "No matching items." when nothing matches. Right-click a page for **Edit source** (locally, with its shortcut), **Copy link** and, locally, **Copy path**; pages are never renamed or deleted here.

- **Overview**: the name and summary (or "The guidance and code included in <Name>."), then three blocks. **Instructions**: Context documents and Skills, with the authored guidance or "No system instructions have been added yet.". **Toolkit**: Components, Theme tokens and Local assets, the authored code sentence and the colour modes. **Where it’s used**: active prototypes, the three newest (title and owner) and "View prototypes using this system" (`/prototypes?system=<id>`), or "No active prototypes use this system yet…". An archived system says so.
- **Libraries**: "The sources and tools behind <Name>.", each library as an entry with its anchor (`#<id>`), version ("v1.2.3", or "Not installed" with "Ask your agent to install this dependency."), description, links to the pages it supplies (Typography for fonts, Fonts, Icons, Images, and the components a package documents) and **Docs** in a new tab. A library declares those pages with `assets: ['fonts' | 'icons' | 'images']` and `components`.
- **Context** and **Skills**: the section itself says what it is for, "Select a file in navigation…" or "No files yet. Ask your agent to add useful material.", and that being listed doesn't load a file into a conversation. Documents read in the studio's own style (`components/SystemDocument.vue`): GitHub Markdown, the frontmatter's title when the document has no first heading, raw HTML shown as text, and relative links to the system's other documents, and to a skill's text files, opening in the studio. A skill's other text file (a script in its folder) opens read-only as its text under its path (`app/components/TextFileReader.vue`): locally in the source editor, highlighted; on the deployed site as plain monospace text. Binary files have no page ("Page not found"). Prototype documents get the shared renderer of ticket 16, which should replace this one.
- **Theme**: a page per token kind, listing the token names (ticket 25 adds live values, Assets and their pages; ticket 26 adds component pages). Until then those addresses are "Page not found" inside the system.

## Source mode

Locally, ⌘' / Ctrl+' (or `?mode=source`) switches a page to its source and back; ⌘S / Ctrl+S saves; **Done** returns; leaving with unsaved changes asks first. The Overview and Icons open `system.ts`, theme pages the stylesheet, documents themselves. A skill's source has a file picker ("Skill source file") for its supporting files; files that aren't text say "This supporting file cannot be edited as text in Studio.". Switching files with unsaved changes asks first. Source mode never renders the page, so a broken file can still be fixed. "Loading editor…" shows while the editor loads.

The dev server's file service reads and saves through `GET|PUT <base>_studio/files/system-source` (`tooling/files/system-source.ts`), addressed by the system's permanent ID and a path inside its folder. Only `system.ts`, the stylesheet, files inside documented component folders, Context documents and skills' files are reachable. Saving needs an Admin or one of the system's maintainers (`systemMaintainers`), an active system, and the version that was read (a change on disk since is a conflict). Others read, and the editor says why. The deployed site has no source mode, no file actions and no Copy path.

## Not yet here

New system and the lifecycle actions (27), Theme values, Fonts, Icons and Images pages (25), component pages and their editor (26), creating, renaming, moving and deleting Context and Skills files, the New skill dialog, Open in editor and Reveal (11), and the system's own overview content rendered in its theme (26's preview examples).

## Command palette

The Systems group lists registered systems as "<Name> system", in both the local studio and the deployed site (active systems only there). Choosing one opens its overview. The current system stays disabled on all its pages. The module declares paletteSource and paletteOrder; the studio builds the entries from the manifest.
