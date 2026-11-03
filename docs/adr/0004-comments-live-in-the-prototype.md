# Comments live in the prototype

Date: 2026-11-03. Status: accepted.

## Context

People review prototypes in the studio but have nowhere there to say what should change. Feedback ends up in chat, detached from the screen, the state and the file it is about, and agents asked to "address the feedback" have no list to work through or answer in. The Endless harness uses Agentation on plain pages, which keeps notes in each browser's storage and understands only HTML. The studio needs the same gesture on views, documents, diagrams and canvases, with comments that colleagues and agents see alike.

## Decision

- **Comments are files in the prototype.** Each thread is one JSON file named by its permanent ID, in a hidden `.comments` folder at the root of its prototype, written exactly as Prettier writes JSON. Threads name artifacts and authors by permanent ID only, so renames and moves inside the prototype never touch them. They travel with the prototype through Git, so colleagues see them after a pull.
- **The comments folder has an open scope.** Anyone registered may comment on anyone's prototype. A file under `.comments` is inside every registered contributor's scope; every other file of the prototype stays its owner's.
- **Commenting is local only.** The tool and the handler that writes exist only while the studio runs locally. The deployed site is static and read-only: it gets no tool and no thread.
- **One service holds the rules.** The dev server's handler (the page) and `yarn comments` (agents) go through the same Node module, which re-reads a thread just before writing and replaces it atomically.
- **A platform seam, the artifact surface.** A small, comment-agnostic interface that an artifact page offers to tools drawn over it: what is under a point, where an anchor is now, bringing one into view, a change notice, and taking the pointer. Each file type implements it in its own module; tools draw in the studio's overlay and never inside the page's content.

## Alternatives considered

- **The Agentation package itself.** It is React (the studio keeps React to the canvas island), it understands only HTML, and it keeps notes in browser storage rather than shared files.
- **Comments in each artifact's file.** Commenting would rewrite the owner's files, every comment would be a change to work under review, and colleagues could not comment without editing someone else's prototype.
- **A comments database or service.** The studio has no backend beyond the local dev server; files keep comments reviewable, mergeable and readable by agents with no browser.
- **Pins drawn inside the preview document.** Simpler to place, but the studio's styles and listeners would reach the view, which must render exactly as it does without the tool.

## Consequences

- Comments show up in prototype diffs and pull requests, as small JSON files.
- The scope check, renames, duplicating, archiving and deleting must honour the comments folder (later tickets).
- Each file type that wants pins implements the artifact surface. A page without one still gets comments on the whole artifact.
- Nothing is commented on the deployed site.
