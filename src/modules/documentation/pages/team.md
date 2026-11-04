---
title: Working as a team
description: Who can change what, how to join, and how changes reach everyone.
order: 5
toc: true
---

## How does the team share one studio?

The Endless Design Studio is one studio for the whole team. Each person works in their own copy of its repository and shares changes through GitHub. Contributor permissions decide who can change what.

There is no live co-editing: the studio doesn't sync between people while they work.

## Who can change what?

| Role              | Can change                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Contributor       | Their own prototypes.                                                                                                   |
| System maintainer | Their prototypes, plus the context, skills and components of the systems they maintain, while those systems are active. |
| Admin             | Everything: settings, modules, every prototype, systems, the Manual and shared guidance, and who has which role.        |

Maintaining is assigned per system. Open **Contributors** to see who is registered and what each person can do; Admins grant and remove roles there.

Admins can duplicate a colleague's prototype to start from it. Everyone else can read other people's work but not change it, apart from commenting on it. Archived systems must be restored before anyone edits them.

### Who can comment?

Anyone registered can comment on any prototype, a colleague's included, and reply to, resolve and reopen its comments. You can edit or delete your own messages. Your agent's replies stay as it wrote them. A whole comment, with its replies, is deleted by whoever started it or by an Admin. The first message is the comment itself, so it goes with the comment rather than on its own.

Comments on an archived prototype are read-only until it is restored. Someone who isn't registered yet can read comments; **Comment** shows **Read-only** with the reason and a link to [How do I join the team?](environment.md#how-do-i-join-the-team).

These permissions guide the studio and its checks. They don't sign anyone in, grant GitHub access or control who can see a deployed studio.

## How does a teammate join?

Give them access to `endlessm/design-studio` on GitHub. Their agent clones it and registers them with `yarn studio join`, with their name, the email their Git commits use and their GitHub account. The studio recognises them whenever their Git email matches. See [Working environment](environment.md#how-do-i-join-the-team).

If someone's Git email changes, they add the new one to their profile with `yarn studio profile`, or edit it on their **Contributors** page.

## How do teammates work without getting in each other's way?

Each contributor has a folder of their own for prototypes. The agent finds out who you are and keeps your prototype work inside your folder. Prototypes are separate explorations: changing one never changes another's files.

The studio checks ownership when you save. Checks also refuse a prototype that imports another contributor's code, or code it isn't allowed to reach.

Comments are files kept inside their prototype, in a hidden `.comments` folder, so they travel with it: renaming, moving, archiving and restoring the prototype keep them, and a duplicate starts without them. Because that folder is open to everyone registered, committing your comments on a colleague's prototype passes the ownership checks without an Admin, while the rest of their prototype stays theirs. Shared systems, modules and the studio itself need a broader review, because everyone's work depends on them.

## How do changes reach the team?

The team protects **main**, the shared branch, and takes changes through pull requests. Your agent can do the Git work:

1. **Work on a branch.** It keeps your changes apart from main while you work.
2. **Open a pull request.** Ask the agent to summarize the changes and run the checks.
3. **Merge when it's ready.** Routine prototype changes can merge as soon as the checks pass. Ask for a review when you want discussion.
4. **Everyone updates.** Teammates pull main into their copies to see the work.

```mermaid
flowchart LR
  accTitle: Team changes move through a branch and pull request
  accDescr: Work stays on a branch while a pull request is checked and reviewed. Merging brings it into main, and teammates pull main to see it.
  branch[Your branch] --> pr[Pull request]
  pr -->|Merge| main[main]
  main -->|Pull| copies[Teammates' copies]
```

Saving changes only your files. A commit records a version; pushing shares it through GitHub.

## Should prototype work wait until it's finished?

No. Merge small changes to your own prototypes often; merging records progress, not a final design.

| Change                                  | Approach                                                                      |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| Inside your own prototype               | Short branches, merged when the checks pass.                                  |
| A shared system, a module or the studio | Ask the people responsible for a review, and check the prototypes it affects. |

## How do I involve reviewers and engineers?

Teammates who run the studio can review a prototype where the work is, with comments; see [Working with your agent](agent.md#how-does-commenting-work). Their comments reach you like any other change: once they are merged into main and you pull.

For people who only look, share a link: see [Publishing & Home](share.md#how-do-i-share-with-reviewers-and-engineers). Engineers can also pull the repository and read a prototype's source and documents directly.
