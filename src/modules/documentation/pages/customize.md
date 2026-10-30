---
title: Modules & settings
description: Change settings, switch modules, add capabilities and guide your agent.
order: 7
toc: true
---

## Where should I start?

Choose the smallest scope that covers the change:

| You want to change…                     | Change…            | Affects…                      |
| --------------------------------------- | ------------------ | ----------------------------- |
| One exploration                         | Its prototype.     | That prototype.               |
| Components, styles or product knowledge | A system.          | Every prototype that uses it. |
| Name, default system or modules         | Settings.          | The whole studio.             |
| A distinct tool or section              | A module.          | The studio, while it's on.    |
| How the studio itself works             | The studio's code. | Everyone.                     |

Ask your agent to explain what a change touches before it makes a shared one.

## How do I change settings?

Open **Settings** from the rail. Everyone registered can read them; Admins change them.

Settings hold the studio's name and tagline, the default system for new prototypes, and which modules are on. Before you save, Settings shows what each change affects. Saving writes `studio.config.json` and restarts the dev server; the studio shows a restart screen until it is back. Changing the default system keeps existing prototypes on their systems.

Agents change the same settings from the command line with `yarn studio configure`, which also recovers Admin access if every Admin is lost.

Saving changes only your copy. See [Working as a team](team.md#how-do-changes-reach-the-team) to share it.

## What are modules?

Modules add capabilities: Documents, Diagrams, Text files, Canvases, the Manual and Contributors, among others. Prototypes and Systems are always on. Admins switch the others in **Settings**, or agents with `yarn studio enable` and `yarn studio disable`; the dev server restarts to apply the change.

Turning a module off keeps its files and content but removes its pages, rail button, search entries and Home block. Its files stay listed, greyed out, and their source still opens. Turning it back on brings everything back.

The Manual is a module too. Turned off, its chapters and rail button go; **Context & Skills** stays at **Documentation**.

Removing a module (`yarn studio remove`) deletes its code; ask the agent what happens to its content first.

## Can my agent add a feature?

Yes. Describe what you need and ask whether it fits as a module. A module keeps its code in its own folder under `src/modules/` and declares what it adds: pages, a rail button, search entries, a Home block, file types and agent skills. `yarn studio create-module` starts one.

For example, you might ask for a review tool or a new kind of artifact. Ask for a proposal that explains the interface, what it changes and how it will be checked. Modules run inside the studio, not in a sandbox: a broken module can break the studio, and the checks are there to catch it.

## How do I edit the Manual and the guidance?

Every chapter of this Manual, and every document in **Context & Skills**, has its source a right-click away. Choose **Edit source**, or press **Ctrl+'** (**⌘'** on a Mac) on the page. A banner reminds you that these are shared documents: changes affect the studio for everyone on the team, so only Admins save them.

Right-click a chapter or document for **Open in editor**, **Show in Explorer** (**Reveal in Finder** on a Mac), **Copy link** and **Copy path**. Chapters update as they are saved. A chapter whose metadata the Manual can't read is left out of the Manual with a warning, and still opens at its address in source mode so you can fix it.

## Where does guidance for the agent go?

`AGENTS.md`, at the top of the repository, is what every agent reads first. It is edited by hand, apart from a block between markers that lists the skills of the modules that are on; `yarn studio sync` rewrites that block after modules change. Shared knowledge lives in the platform's context and skills, each module's README and skills, and each system's own context. Browse all of it in **Context & Skills**.

Guidance that applies to one system belongs in that system's context. Product knowledge for one exploration belongs in its prototype.
