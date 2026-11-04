# Comments

Notes a contributor pins to an artifact, or to a place in it, for colleagues and agents. A comment is a thread with replies, open or resolved. Optional and on by default. Commenting happens only in the studio running locally; the deployed site has no tool and no thread. [ADR 0004](../../../docs/adr/0004-comments-live-in-the-prototype.md) records why comments live in the prototype.

This README is the contract for the thread format, the tool's behaviour and the agent text. Views are the first surface; the other surfaces follow.

## Behavior

Every artifact page whose type offers an [artifact surface](../../../app/utils/artifactSurface.ts) gets a toolbar in its bottom-right corner, 16 px from the edges. Pages without one (documents, diagrams and canvases, for now) get no tool, so it never covers their own controls:

- **Comment** turns comment mode on and off. The shortcut is ⌥⌘M on Apple computers and Ctrl+Alt+M elsewhere (`commentShortcut` in `app/utils/shortcuts.ts`). It works while a view has focus, because the preview document passes it on as the `comment` shortcut. It is ignored while a text field outside the tool has focus.
- **Hide comments** hides every pin, and **Show comments** shows them again. Comment mode shows them while it lasts.
- **All comments** opens the list, and shows how many threads are open (its name says so too: "All comments, 2 open").
- **Copy for agent** copies the open comments of the open file (a view's with all its named states') as [agent text](#agent-text), with "Target not found" for each target the page can't find right now, and says so: "Copied 3 open comments for your agent". It rests while nothing is open.

In comment mode a hint at the top says how to comment and how to stop. Hovering outlines what a click would comment on, labelled the way an agent reads it (`Button "Invite students"`). A click opens a composer beside that spot, focused, with "Enter to post" (Shift+Enter for a new line). No click reaches the page. Selecting text in a page whose surface offers `selection()` (views) opens the composer with the text quoted: the anchor is the element that holds the whole selection, with the selected text as its `quote` and the pin at the selection's end. The quote shows in the composer, the thread and the list.

A posted comment becomes a numbered pin in Nuxt UI's `info` colour on its target, at the spot that was clicked. Each pin is a button named with its number, author and first eight words ("Comment 1 by Ada Lovelace: Make this the main action."). Hovering a pin previews its author and first message; clicking it opens the thread, with its messages, a Reply field and Resolve. A resolved thread's pin is grey with a check, and shows only on the list's Resolved tab or while its thread is open.

### The thread

- Each message shows its author's name, picture (from the contributor profile: their own image, their GitHub photo or their initials) and time, and "Edited" once changed. An agent's messages show as "<first name>'s agent" with an "Agent" badge.
- **Resolve** closes the thread with the toast "Comment resolved", whose **Undo** reopens it. A resolved thread says "Resolved by <name>", with **Reopen**; reopening moves the list to the Open tab.
- The **…** menu holds **Copy link** (the address with `?comment=<id>`, on the thread's own named state; toast "Link copied") and, for the thread's author or an Admin, **Delete comment**, which asks first and deletes the thread with its replies (toast "Comment deleted").
- Your own messages have **Message actions**: **Edit** (in place; Enter saves, Esc puts it back) and **Delete**. The first message is the comment itself, so it is edited, or goes with Delete comment.

The page offers only what the service will allow, using the service's own rules (`mayChangeMessage` and `mayDeleteThread` in `threads.ts`), and asks the service (`access`) whether the person may write on the prototype at all. Where it may not (someone unregistered, an archived prototype), threads and the list can still be read, and the service's sentence replaces the Reply field, the list's "Comment on the whole …" and, in the toolbar, Comment, which becomes **Read-only** with the reason; for someone unregistered it links to the Manual's "How do I join the team?". The comment shortcut does nothing there.

### The list

**All comments** opens a 340 px panel over the right of the page. It never resizes the page; pins under it are hidden, popovers stay clear of it and the toolbar moves left of it.

- **Open** and **Resolved** tabs, each with its count.
- Each row shows the thread's number, its target's label, the quote, the first message, the author's name and picture, the time and the number of replies. A thread whose target the page can't find says "Target not found" and stays listed.
- A view's list holds the threads of the view and of every named state; a row on another state names that state. Pins show only the state on screen.
- Choosing a row asks the surface to `reveal` its target (scrolling it into view) and opens the thread. A row on another state goes to that state first, as a step the person can go back from.
- **Comment on the whole view** (document, diagram or canvas, by the artifact's type) opens the composer for a comment on the whole file, `{ "kind": "artifact" }`. It is listed only and has no pin; its thread opens above the toolbar.

### The address

The open thread is the address's `comment` parameter (`…/artifacts/<id>?comment=<thread id>`). Opening and closing a thread replaces the address rather than adding to the history, and a reload or a shared link opens that thread, going to its named state when it is on another one and bringing its target into view.

### Keyboard, screen readers and comfort

- The composer and a thread take focus when they open (the comment or Reply field) and give it back to what opened them: the pin, the row or the button. When that is gone, such as the row of a thread just resolved, focus goes to the list's current tab, or to the toolbar.
- Everything in the list works from the keyboard: the tabs, every row, "Comment on the whole view", then replying and resolving in the thread.
- With reduced motion, pins, their previews and the list appear without animation (transitions only under `motion-safe`); revealing a target jumps instead of scrolling smoothly.
- The tool uses the studio's colours, light or dark, while the view keeps its own. Popovers sit beside their pin and flip to stay inside the page.

Esc backs out one step at a time: it cancels a draft, then closes an open thread, then leaves comment mode. It counts when pressed in the tool, in the page, or with nothing in particular focused, and not while another studio dialog or menu is open.

A thread's number is its place among the artifact's threads in creation order, resolved ones included, computed on display and never stored. For a view, "the artifact's threads" are the view's and all its named states' together, so the list, which shows every state, never repeats a number. Pins show only for the state on screen.

Open pages update at once when a thread file changes, whoever changed it: the page, `yarn comments` or a Git pull.

## Agent text

What Copy for agent copies and `yarn comments` prints, from one formatter (`agentText.ts`), so the two never differ. For each file it gives a heading with the count, the file's kind and title, then `File:` and `Address:` (the view's, for its states too); then each thread, in number order:

- `### <number>. <target label> · <thread ID>`, "The whole view" (document…) for a whole-file comment;
- the locator lines the anchor has: `State:` (the named state it is on), `Path:`, `Quote:`. `Target not found: it was removed or changed since.` replaces the path when the page couldn't find the target; the command can't render a page, so it always prints the stored anchor;
- each message, `- <name>: <text>`, an agent's as "<first name>'s agent", and "Resolved by <name>." for a resolved thread.

It ends with the commands to reply and resolve (or reopen, for resolved threads). Comments on a file removed since are listed under their stored `artifactTitle` with `File removed` in place of the file and address. The command heads each prototype with `# Prototype "<title>"` and its folder. It is a format for agents, so its words are in the formatter, in English, not in the locale.

## The command

`yarn comments` is the agents' side, run from the studio's root. The `address-comments` skill tells agents how to use it.

- `yarn comments [prototype folder | address] [--resolved] [--json]` lists the open comments as agent text: of a prototype, of one file (an address `/prototypes/<id>/artifacts/<id>`, or a whole URL; a named state's address names its view), of a whole prototype (`/prototypes/<id>`), or, with no argument, of the prototypes you own. `--resolved` lists the resolved ones instead; `--json` gives the stored threads, each with its `number`, `file` (null when removed) and `address` (its own state's).
- `yarn comments show <id>` prints one thread, resolved or not.
- `yarn comments reply <id> "<text>"` replies.
- `yarn comments resolve <id> [--reply "<text>"]` resolves, with an optional last reply.
- `yarn comments reopen <id>` opens a resolved comment again.

It writes as the agent of the contributor your Git identity resolves to (`agent: true`). Refusals go to standard error with exit status 1, in the same sentence the page shows. Reading needs no registration. Editing and deleting are the page's only: agents never change people's messages.

## Where comments are kept

Each thread is one file, `<prototype>/.comments/<id>.json`, named by its permanent ID. Dot folders are hidden from the manifest, the file tree and identity tooling; thread files are not artifacts.

`module.ts` declares the folder as `prototypeFolder: { name: '.comments', one: 'comment', other: 'comments' }`, written out because the scope check reads it from Git (a unit test keeps it equal to `COMMENTS_FOLDER`). The platform then handles it with the module on or off: renaming, moving, archiving and restoring the prototype carry the threads; duplicating leaves them behind; deleting says how many go ("It holds 2 comments, …", "That includes 2 comments."); and anyone registered may commit to it in anyone's prototype, while the rest of that prototype stays outside their scope. Threads refer to artifacts by permanent ID, so a renamed or moved file keeps its comments. Turned off, the files stay on disk and nothing renders them.

The file is exactly what Prettier writes for JSON (`JSON.stringify(thread, null, 2)` and a newline, fields in the order below), so formatting never rewrites it.

```ts
interface CommentThread {
  formatVersion: 1
  id: string // permanent resource ID, also the file name
  artifact: string // the artifact's permanent ID, or the named state's
  artifactTitle: string // as when commented, for a file removed since
  anchor: Anchor // { kind: 'artifact' } for the whole file
  status: 'open' | 'resolved'
  resolvedBy?: Author
  resolvedAt?: string // ISO time
  messages: {
    id: string // permanent resource ID
    author: Author
    body: string // plain text
    createdAt: string
    editedAt?: string
  }[]
}
type Author = { contributor: string /* studio ID */; agent?: true }
```

`artifact` is the named state's permanent ID when a state was on screen, otherwise the view's. Thread and message IDs come from the studio's permanent-ID generator.

## The anchor

Recorded by the page when the comment is made, so the command never renders a page. Every anchor has:

- `kind`: what the target is (`button`, `heading`, `paragraph`, `artifact`…);
- `label`: the readable name shown on hover and in agent text, such as `Button "Invite students"`;
- `at`: where on the target the pin sits, as fractions `{ x, y }` of its box;
- `quote`, when text was selected.

A **view element** adds:

- `selector`: Agentation's identifying attributes first (`data-testid`, `data-test`, `data-qa`, `data-cy`, `data-component`), then `id`, each only when unique in the document; otherwise a short tag-and-class path (`main > button:nth-of-type(2)`), as long as it needs to be to be unique;
- `tag`: the element's tag, for finding it again by kind;
- `path`: a readable path of up to five steps, such as `main > .card > button`;
- `text`: the element's own text, trimmed (or what names it: `aria-label`, `alt`, `placeholder`, `title`);
- `box`: its box in the document when commented (`left`, `top`, `width`, `height`), with the preview's viewport width (`viewport`).

A view re-finds a target on every render: by the selector, then by the same tag with the same text. A path selector is only a position, so an element found there with other text is not the target (the next button after the commented one was removed, say). An identifying attribute or an id is trusted whatever the text. "Target not found" is worked out each time and never stored, so a target that comes back gets its pin back. The open thread says "Target not found. It was removed or changed." while its target is gone.

## Rules

One Node module, `service.ts`, holds every rule and every write; the dev-server handler (`server/threads.ts`) and the command use it. Each write re-reads the thread file just before writing, applies itself to the current content and replaces the file atomically (a temporary file renamed over it), so a reply from the page and a resolve from an agent can't overwrite each other.

Operations: create, reply, resolve, reopen, edit a message, delete a message, delete a thread, and `access` (what the asker may do on a prototype, for the page). The rules:

- anyone may read;
- a registered contributor may create (on a target or on the whole file), reply, resolve and reopen on any prototype that isn't archived, other people's included;
- only a message's author edits or deletes it. A person's agent's messages are theirs too, while an agent (the command) changes only agents' messages. The first message can't be deleted on its own: it goes with its thread;
- a thread is deleted by the author of its first message or an Admin (`admins` in `studio.config.json`, through `tooling/contributors/roles.ts`);
- an archived prototype's comments are read-only;
- someone whose Git identity matches no profile is told to join (`yarn studio join`).

Each refusal is a sentence saying what to do, and the page (as an error toast, or in place of a field) and the command (on standard error) show the same one. The page never writes files and never names an author: the handler resolves who is asking.

## Hard parts

1. **Blocking clicks in a view.** Chosen: capture-phase listeners on the preview document's window, attached when comment mode starts and removed when it ends (`viewSurface.ts`, `intercept`). `pointerdown`, `pointerup`, `mousedown`, `mouseup`, `click`, `dblclick`, `auxclick` and `submit` stop there, so no button action, navigation or menu opening on pointerdown reaches the view. A press keeps focus where it is: `mousedown` is cancelled on anything focusable, or whenever something in the view has focus; on plain text with nothing focused it goes on, so text selection keeps working for quoting. A transparent studio overlay over the iframe would block clicks too, but it kills text selection and wheel scrolling in the view. The only other thing comment mode adds is one `<style>` for the crosshair cursor, removed with the listeners.
2. **Pins following the view's scroll while comment mode is off.** Chosen: sampling, with no listener at all. While pins are on screen, the surface's change notice fires once an animation frame from the studio side, and the tool asks where each anchor is (`getBoundingClientRect` on the same-origin document); it re-renders only when something moved. This also catches scrolling inside the view's own scroll containers, resizes and re-renders. Interpretation recorded: with comment mode off the preview document has no nodes, styles or listeners from the tool; reading its layout from the studio side is allowed.
3. **Hot updates.** No render notice is needed: sampling notices a re-rendered element, because the tool keeps each anchor's element only while it is connected and re-finds it by its selector, then its tag and text, when it is not. A removed element shows "Target not found" and its pin comes back when the element does.
4. **The shortcut.** ⌥⌘M and Ctrl+Alt+M are kept. Google Docs uses the same pair for "Insert comment" in Chrome, Safari and Firefox on both systems, which shows the browsers pass it to the page. On macOS ⌥⌘M is "Minimize All" only in apps that list it in their Window menu; the browsers deliver it to a page that handles it. On European layouts Windows reports AltGr as Ctrl+Alt, so AltGr+M (µ on a German layout) matches: the key is matched by position (`KeyM`), the shortcut is ignored in text fields outside the tool, and inside the tool's own fields only a plain M counts, so typing µ in a comment never toggles the mode. Checked here: Chrome (Chromium) on Windows, through the browser tests. Not checked: Safari and macOS, Firefox, and a real AltGr layout.
5. **Pin numbers across named states.** Numbered across the whole view: the view's threads and all its states' together, in creation order. The list, which shows every state, never repeats a number.

## Ownership

- `module.ts` declares the module: its tool, its handler and its build data (every prototype's threads in development, nothing for the build).
- `threads.ts` is the format, shared by the browser and Node; `service.ts` the rules and writes; `server/threads.ts` the page's writes; `agentText.ts` the agent text, for the page and the command; `cli.ts` the command (`yarn comments`); `skills/address-comments/` the agents' skill, routed from `AGENTS.md` by `yarn studio sync`.
- `components/CommentTool.vue` is the tool over the page (`CommentToolbar`, `CommentPin`, `CommentComposer`, `CommentThreadPopover`, `CommentList`, `CommentReadOnly`, `CommentDeleteModal`); `composables/` read threads, authors and what the person may do, and give focus back. Its text is under `comments` in `i18n/locales/en.json`.
- The view surface is the prototypes module's (`src/modules/prototypes/types/view/viewSurface.ts`). The look and copy follow the Comments prototype (`src/prototypes/bernardo/comments`).

The deployed site gets no tool, no handler and no thread: the build data is empty and the tool list is empty in the build. The tool's interface strings sit in the shared locale file with every module's, so they ship; threads never do.

Turning the module off removes the tool and the command's place in the studio; thread files stay on disk.
