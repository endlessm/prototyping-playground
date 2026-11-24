---
title: The Lab
description: Try a system's components, make your own version of an app component and hand the change over.
order: 4.5
module: lab
toc: true
---

## What is the Lab for?

The Lab is a bench for one component at a time. Open it from the flask button on the rail. The system's components are listed on the left; the open one has four tabs:

- **Overview**: what the component is for, its source and its props.
- **Variants**: every example of it, side by side, each with **Show code** and **Copy code**.
- **Playground**: the component alone on a stage, with a dial for each prop. Changed values go into the address, so a link keeps them. **Reset** brings back the starting values.
- **Versions**: everyone's versions of an app component (see below).

With **Inspect** on, clicking the stage selects an element instead of using it: you see its size, its spacing and the dials that change it. Press **Escape** to clear the selection.

## Which components does it list?

**App components** comes first: every component file in the system's copy of the real app, grouped by its folder in the app (Hero under Dashboard, User card under Generic). Hover a name to see it in full ("Dashboard / Hero"). Nobody keeps that list by hand: a file added to the copy shows up on its own. **Components** follows, with the components the system documents (for Endless Studios, its Nuxt UI components).

An app component without a page in Systems still opens. Its Overview says so, and the Playground shows the app's file on the stage on its own.

## How do I change an app component?

In the Playground, an app component's code sits beside the stage. It is the app's original, read-only: "This is the app’s original. Make a new version to change it."

1. Click **New version** above the code. The studio copies the original into a prototype of your own, named after the component ("Studio sidebar versions"), as a view called `Version 1`, then `Version 2` and so on.
2. Edit the code. The stage shows your version in the original's place, with the same sample data and layout, and follows each change. A prop you add gets its own dial.
3. Click **Save** (**Ctrl+S**, **⌘S** on a Mac) to write the file, or **Discard** to drop your unsaved changes.

With an element selected, the **Selected element** panel offers dials for its spacing, corners and size, which rewrite your version's classes. **Show original** goes back to the app's file. New version needs the studio running on your computer and you on the team (see [Working as a team](team.md#how-does-a-teammate-join)).

## How do I see everyone's versions?

The **Versions** tab lists every version of the component, from everyone on the team. Each card has a preview, its author ("By you" for yours), when it last changed, and **Read-only** on one you can't change. Click the preview to open the version.

- **Open in Playground** opens it on the stage, with its code.
- **Save as my version** copies someone else's version into your own prototype, so you can carry on from it without changing theirs. It's also above the code when you open their version.
- On your own versions, the menu has **Rename**, **Duplicate** and **Delete**. Delete moves the file to your computer's trash (the Recycle Bin on Windows).
- **Open in Prototypes** shows the version where it lives, like any other view.

## How do I hand a change to engineers?

**Changes**, on each card and above the code of an open version, shows what the version changed in the app's file, line by line, and names the file and the app revision it compares with.

- **Copy changes** copies them as a patch the app's repository takes from its root (`git apply`).
- **Download file** saves the whole file under the original's name, ready to replace it.

Neither carries the studio's own lines at the top of a version. If you have unsaved changes in the Playground, Changes includes them and says so.

**Made from an older original** means the studio's copy of the app has moved on since you made the version. Its changes still compare with today's original, so they also undo what changed in the app meanwhile: start a new version, or check the changes with an engineer first.

## What works on the deployed studio?

Everything you can look at: the list, Overview, Variants, the Playground's dials and Inspect, every version and its Changes, with Copy changes and Download file. It's read-only: there is no New version, no editing and no Save as my version, and the original says "Run the studio locally to make a new version."

## Why does a component show nothing?

- "Nothing shows with these values yet" means the component rendered empty. It may need content only code can give, such as a slot or a list of items.
- "Playground can’t start" names a required prop only code can set, such as a `user` or a `program`. Those components need sample data in the system first; ask your agent.
- "This component couldn’t render" comes with the error. If you just made the version, open it again from the **Versions** tab. Otherwise, the error points at the line to fix.
