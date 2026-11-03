# Comments

Notes a contributor pins to an artifact, or to a place in it, for colleagues and agents. A comment is a thread with replies, open or resolved. Optional and on by default. Commenting happens only in the studio running locally; the deployed site has no tool and no thread. [ADR 0004](../../../docs/adr/0004-comments-live-in-the-prototype.md) records why comments live in the prototype.

This README is the contract for the thread format and the tool's behaviour. Views are the first surface; the list, the whole thread lifecycle, agent text and the other surfaces follow.

## Behavior

Every artifact page whose type offers an [artifact surface](../../../app/utils/artifactSurface.ts) gets a toolbar in its bottom-right corner, 16 px from the edges. Pages without one (documents, diagrams and canvases, for now) get no tool, so it never covers their own controls:

- **Comment** turns comment mode on and off. The shortcut is ⌥⌘M on Apple computers and Ctrl+Alt+M elsewhere (`commentShortcut` in `app/utils/shortcuts.ts`). It works while a view has focus, because the preview document passes it on as the `comment` shortcut. It is ignored while a text field outside the tool has focus.
- **Hide comments** hides the pins, and shows them again.
- **All comments** and **Copy for agent** are placeholders, disabled until the list and the agent text arrive.

In comment mode a hint at the top says how to comment and how to stop. Hovering outlines what a click would comment on, labelled the way an agent reads it (`Button "Invite students"`). A click opens a composer beside that spot, focused, with "Enter to post" (Shift+Enter for a new line). No click reaches the page.

A posted comment becomes a numbered pin in Nuxt UI's `info` colour on its target, at the spot that was clicked. Hovering a pin previews its author and first message; clicking it opens the thread, with its messages, a Reply field and Resolve. A resolved thread's pin leaves the page. An agent's messages show as "<first name>'s agent" with an "Agent" badge.

Esc backs out one step at a time: it cancels a draft, then closes an open thread, then leaves comment mode. It counts when pressed in the tool, in the page, or with nothing in particular focused, and not while another studio dialog or menu is open.

A thread's number is its place among the artifact's threads in creation order, resolved ones included, computed on display and never stored. For a view, "the artifact's threads" are the view's and all its named states' together, so the list, which shows every state, never repeats a number. Pins show only for the state on screen.

Open pages update at once when a thread file changes, whoever changed it: the page, `yarn comments` or a Git pull.

## The command

`yarn comments` is the agents' side, run from the studio's root:

- `yarn comments [prototype folder]` lists the open comments of a prototype, or of the prototypes you own, as plain text: number, target label, artifact title, IDs, path and text, and each message.
- `yarn comments show <id>` prints one thread.
- `yarn comments reply <id> "<text>"` replies.
- `yarn comments resolve <id> [--reply "<text>"]` resolves, with an optional last reply.

It writes as the agent of the contributor your Git identity resolves to (`agent: true`). Refusals go to standard error with exit status 1. Reading needs no registration.

## Where comments are kept

Each thread is one file, `<prototype>/.comments/<id>.json`, named by its permanent ID. Dot folders are hidden from the manifest, the file tree and identity tooling; thread files are not artifacts.

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

For now:

- anyone may read;
- a registered contributor may create, reply and resolve, on any prototype that isn't archived;
- someone whose Git identity matches no profile is refused with a sentence telling them to join (`yarn studio join`).

The page never writes files and never names an author: the handler resolves who is asking.

## Hard parts

1. **Blocking clicks in a view.** Chosen: capture-phase listeners on the preview document's window, attached when comment mode starts and removed when it ends (`viewSurface.ts`, `intercept`). `pointerdown`, `pointerup`, `mousedown`, `mouseup`, `click`, `dblclick`, `auxclick` and `submit` stop there, so no button action, navigation or menu opening on pointerdown reaches the view. A press keeps focus where it is: `mousedown` is cancelled on anything focusable, or whenever something in the view has focus; on plain text with nothing focused it goes on, so text selection keeps working for quoting. A transparent studio overlay over the iframe would block clicks too, but it kills text selection and wheel scrolling in the view. The only other thing comment mode adds is one `<style>` for the crosshair cursor, removed with the listeners.
2. **Pins following the view's scroll while comment mode is off.** Chosen: sampling, with no listener at all. While pins are on screen, the surface's change notice fires once an animation frame from the studio side, and the tool asks where each anchor is (`getBoundingClientRect` on the same-origin document); it re-renders only when something moved. This also catches scrolling inside the view's own scroll containers, resizes and re-renders. Interpretation recorded: with comment mode off the preview document has no nodes, styles or listeners from the tool; reading its layout from the studio side is allowed.
3. **Hot updates.** No render notice is needed: sampling notices a re-rendered element, because the tool keeps each anchor's element only while it is connected and re-finds it by its selector, then its tag and text, when it is not. A removed element shows "Target not found" and its pin comes back when the element does.
4. **The shortcut.** ⌥⌘M and Ctrl+Alt+M are kept. Google Docs uses the same pair for "Insert comment" in Chrome, Safari and Firefox on both systems, which shows the browsers pass it to the page. On macOS ⌥⌘M is "Minimize All" only in apps that list it in their Window menu; the browsers deliver it to a page that handles it. On European layouts Windows reports AltGr as Ctrl+Alt, so AltGr+M (µ on a German layout) matches: the key is matched by position (`KeyM`), the shortcut is ignored in text fields outside the tool, and inside the tool's own fields only a plain M counts, so typing µ in a comment never toggles the mode. Checked here: Chrome (Chromium) on Windows, through the browser tests. Not checked: Safari and macOS, Firefox, and a real AltGr layout.
5. **Pin numbers across named states.** Numbered across the whole view: the view's threads and all its states' together, in creation order. The list, which shows every state, never repeats a number.

## Ownership

- `module.ts` declares the module: its tool, its handler and its build data (every prototype's threads in development, nothing for the build).
- `threads.ts` is the format, shared by the browser and Node; `service.ts` the rules and writes; `server/threads.ts` the page's writes; `cli.ts` the command (`yarn comments`).
- `components/CommentTool.vue` is the tool over the page (`CommentToolbar`, `CommentPin`, `CommentComposer`, `CommentThreadPopover`); `composables/` read threads and authors. Its text is under `comments` in `i18n/locales/en.json`.
- The view surface is the prototypes module's (`src/modules/prototypes/types/view/viewSurface.ts`). The look and copy follow the Comments prototype (`src/prototypes/bernardo/comments`).

The deployed site gets no tool, no handler and no thread: the build data is empty and the tool list is empty in the build. The tool's interface strings sit in the shared locale file with every module's, so they ship; threads never do.

Turning the module off removes the tool and the command's place in the studio; thread files stay on disk.
