---
title: Prototypes & systems
description: What goes in a prototype, how previews work, and how systems fit.
order: 4
toc: true
---

## What belongs in a prototype?

A prototype holds one exploration. Its files are called **artifacts**; use the ones that help explain your idea.

| Artifact | File          | Purpose                                                                |
| -------- | ------------- | ---------------------------------------------------------------------- |
| View     | `.vue`        | A working screen you can interact with, with named states.             |
| Document | `.md`         | A brief, notes, decisions or a handoff, with links and embedded views. |
| Diagram  | `.mermaid`    | A flow or relationship, written as text.                               |
| Canvas   | `.excalidraw` | Views, notes and sketches arranged together.                           |

Views are always available. Documents, diagrams and canvases need their modules on. Turning a module off keeps its files: they stay listed, greyed out, and their source still opens.

## What are named states?

A view can declare **named states**: the same screen signed out, empty, failing to save. Each state has its own title and its own link, and navigation lists the states under their view. Use states instead of copying a view to show a variation.

Endless Studios views also choose, per view and per state, the language, who is signed in (a learner, a mentor, an admin, someone else or nobody), the sample data, and whether the app's own sidebar, top bar and footer show.

## How do previews work?

Each view renders inside its system's own preview, with the system's components, fonts and theme. Nothing of the studio's look leaks in, and the view's menus and dialogs stay inside it.

When you or the agent save a view, its preview updates in place and keeps its state where it can. If the preview hasn't caught up with the saved file, it says **Out of date**. If a view fails to render, the preview shows the error to give your agent; source editing keeps working, and fixing the file brings the view back.

Previews of views inside documents and canvases are pictures of the view at 1440 pixels wide. Open the view to interact with it.

## What belongs in a system?

A system supplies the foundation for many prototypes:

| Part       | Contains                                                                            |
| ---------- | ----------------------------------------------------------------------------------- |
| Overview   | What the system is and which prototypes use it.                                     |
| Libraries  | What it is built from: packages, versions and their documentation.                  |
| Theme      | Colours, typography, spacing, radius, shadows and motion, read from its stylesheet. |
| Assets     | Fonts, icons and images.                                                            |
| Components | Each component with live examples, its source and its props.                        |
| Context    | Audience, goals, principles and standards, for people and agents.                   |
| Skills     | Procedures agents follow for recurring tasks.                                       |

Endless Studios is the default system. Its views render the app's real screens from copied source, kept up to date from the Endless Studios repository. Keep knowledge that serves every prototype in the system's **Context**; keep an exploration's brief and open questions with its prototype.

Admins can create systems from **Systems → New system**. The new system's Overview offers to set it up: bring another Vue app in, or start from Nuxt UI, and copy the prompt it builds into your agent's chat. Maintainers of a system can edit its context and skills.

A system's **…** menu has the rest. Maintainers and Admins can rename it; its link stays the same. Admins can also make it the default, archive it, restore it or delete it:

| Action         | What happens                                                                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Set as default | New prototypes start with it. Existing prototypes keep their systems.                                                                                                                |
| Archive        | Its files stay, its prototypes are archived with it, and the deployed site leaves both out. The default system can't be archived.                                                    |
| Restore        | Makes it available again, with or without the prototypes archived with it.                                                                                                           |
| Delete         | Deletes its files for good. Its prototypes keep theirs and show **Rebuild needed** until your agent rebuilds them with another system; the deployed site leaves them out until then. |

Each change restarts the studio, behind a screen that says what is happening. If a folder is open in another program, such as an editor or a terminal, the studio says so before changing anything: close it and try again.

## How do I create a prototype?

Ask your agent, saying what you want to explore. Or choose **New prototype** in Prototypes, give it a title and pick a system. It opens with an empty view for your agent to build.

The prototype's system shows under its title. Browsing another system doesn't change it. **No system** gives a prototype plain Vue with its own styles.

Changing the default system in Settings affects new prototypes only. Changes to a shared system's components or styles can affect every prototype that uses it.

## How do I organize artifacts?

Use **New** in the file tree to add views, documents, diagrams, canvases or folders. Drag files to reorder them or move them into folders. Press **F2** to rename the selected file. The first artifact is where the prototype opens.

Right-click a file for its actions: **Edit source**, **Open in editor**, **Show in Explorer** (**Reveal in Finder** on a Mac), **Copy link**, **Copy path**, **Rename** and **Delete**.

Links use permanent IDs kept in each file, so a link to a prototype, view, state, document or canvas keeps working when you rename or move it within its prototype. The tree always shows the real file names. When a file moves, the studio repairs the links, embeds and imports that point at it; moves made while the studio isn't running may need the agent's help.

## How do documents, diagrams and canvases connect?

**Documents** read in the studio's own style, with a title, "On this page" and highlighted code. Link to a view, state, diagram or canvas on its own line to embed it; a canvas shows as a picture of the whole canvas, with its views live, and its title bar opens it. Mermaid blocks in a document draw diagrams even without the Diagrams module.

**Diagrams** are standalone Mermaid files, drawn in the studio's light or dark colours. A diagram with a syntax error shows the error instead.

**Canvases** use Excalidraw's own tools: shapes, arrows, frames and **T** for text, the default for notes. The Library holds optional sticky notes, and **Mermaid to Excalidraw** under the extra tools turns a Mermaid diagram into separate shapes, not a diagram that stays in sync. Drag an artifact from the file tree onto the canvas, or paste its link, to place it next to your text, shapes and arrows. Views, states and diagrams show as live pictures that follow their source; documents and other canvases show as cards. Click an item's title bar to open it. A canvas shows only artifacts from its own prototype: a link to a deleted file, or to another prototype, shows a card that says so. A canvas holds no images; put the view itself on it. Other people's canvases and canvases on the deployed site are read-only.

A canvas saves itself a moment after you stop drawing, and when you leave it or switch tabs. The status at the bottom right says **Saved**, **Saving…**, **Unsaved changes** or **Couldn't save**, with **Retry**. When the agent edits the same canvas, its changes come in without a reload, merged with yours. If you leave while a save can't finish, the studio asks whether to keep editing or discard your changes.

## Can I try another look or another system?

Right-click a view and choose **Make lo-fi** for grayscale and handwritten type; **Make hi-fi** turns it back.

To move a prototype to another system, choose **Duplicate** and pick the target system. This makes a rebuild copy and keeps the original. Copy the rebuild instructions from the copy and give them to your agent: the copy is marked **Rebuild needed** until the agent has moved it over. Duplicating doesn't convert code by itself.

## What do archive and delete do?

Use a prototype's **…** menu, beside its title or on its card, or right-click its title. Your permissions decide which actions you see: anyone can copy its link, and in your own copy open it in your code editor or copy its path; its owner or an Admin can change it.

| Action    | What happens                                                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Rename    | Changes its title and folder; its links keep working. You can also double-click the title.                                               |
| Duplicate | Makes a copy with new links of its own, and opens it. An Admin can duplicate anyone's prototype; the copy is theirs.                     |
| Archive   | Keeps it in your copy, out of the deployed studio. Links to it show a placeholder. An archived prototype offers only Restore and Delete. |
| Restore   | Makes it active again. If its system was deleted or archived, rebuild it or restore the system first.                                    |
| Delete    | Moves its folder to your computer's trash (the Recycle Bin on Windows), where you can restore it.                                        |

Deleting a file from the file tree also moves it to the trash. Restore archived work before editing it. If something was deleted and emptied from the trash, ask your agent to look for it in Git's history.
