---
title: Help
description: Find the next step when something is unclear or not working.
order: 8
toc: true
---

## The studio won't open. What should I do?

Open your studio folder in your agent and ask it to start the studio and show it to you. If a `localhost` page stops loading, the dev server has probably stopped; the agent checks with `yarn studio dev status` and restarts it with `yarn studio dev restart`. Give the agent any error message you see.

For setting up or coming back, see [Working environment](environment.md).

## Where is my work?

Your studio is a folder on your computer, and your prototypes are in your own folder inside `src/prototypes/`. A browser address doesn't tell your agent which folder to edit: ask it to show you the folder it is working in.

Press **Ctrl+K** (**⌘K** on a Mac) to search for prototypes, views, systems and Manual chapters. **Ctrl+;** (**⌘;**) shows or hides the navigation panel. Right-click a file to copy its link or path, show it in Explorer (Finder on a Mac), or open it in your code editor.

## Why is a tool or artifact missing?

Its module may be off. Check **Settings**, or ask your agent. Turning a module off keeps its files; they show greyed out in the file tree. An archived prototype stays in your copy but is left out of the deployed studio.

The deployed studio has no creating, editing, source or settings. See [Modules & settings](customize.md#what-are-modules).

## Why are my changes not appearing?

Check that the file is saved and that your agent is editing the folder this studio runs from. Check that you are looking at the right view and state. A preview marked **Out of date** is still catching up.

A deployed studio needs another build. Changing the default system doesn't move existing prototypes. A copy marked **Rebuild needed** still needs its agent migration.

## Why does my prototype look different than expected?

Check its system, shown under its title, and the view's options: language, who is signed in, sample data and whether the app's shell shows. A view in lo-fi uses grayscale and handwritten type.

Give the agent the view, what you expected and any references. Ask it to check the system's components and stand-ins. See [Prototypes & systems](prototypes.md).

## How do I edit source?

Locally, right-click a file and choose **Edit source**, or press **Ctrl+'** (**⌘'** on a Mac) to switch between the page and its source. **Ctrl+S** (**⌘S**) saves; **Done** returns to the page. If the file changed on disk while you were editing, the studio asks whether to load the new version or keep yours. Leaving with unsaved changes asks first. Canvases save on their own.

**Open in editor** uses the code editor installed on your computer; without one, the file is shown in Explorer (Finder on a Mac). You can also ask the agent to make the change.

## Why can't I edit something?

The deployed studio is for viewing. Locally, who you are, your permissions and whether something is archived decide what you can change: your own prototypes, the systems you maintain, and for Admins everything else. Other people's canvases are read-only.

If the studio doesn't recognise you, your Git email may not match your profile. Ask your agent to run `yarn studio whoami` rather than changing who owns what. See [Working as a team](team.md#who-can-change-what).

## A diagram, view or link is broken. What should I give the agent?

- The link to the page or artifact, and the error message (**Copy error** copies it).
- What you were doing when it broke.
- What you expected, and whether it happens again.
- A screenshot or annotation when it helps.

Diagram errors usually come from Mermaid syntax. Links may need repair after a file was deleted, or moved while the studio wasn't running. Ask the agent to investigate and keep your work.

## Published work is missing or out of date. What should I check?

Check that the latest changes were built and published where you expect. Check whether the prototype or system is archived, or its module is off. Use the deployed address, not `localhost`.

If Home opens but a direct link fails, ask the agent to check how the host serves the site's pages. See [Publishing & Home](share.md).

## Can I get an earlier version back?

Deleted files go to your computer's trash (the Recycle Bin on Windows): restore them from there. For earlier versions of a file, ask the agent to look in Git's history before trying anything else. Saving doesn't keep a copy of the version before.

For deeper investigation, the agent can read **Context & Skills**.
