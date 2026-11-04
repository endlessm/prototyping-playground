---
studioId: 8nd49y9f963cvx7p
title: What the agent gets
description: How comments reach an agent, and what it reads about each one.
toc: true
---

## Two ways in

Comments are files in the prototype, so an agent working in the studio folder reads them directly. A person can also copy them to an agent that runs somewhere else.

| Way                                | Who uses it                     | What it gives                                     |
| ---------------------------------- | ------------------------------- | ------------------------------------------------- |
| `yarn comments`                    | The agent, in the studio folder | Open comments of a prototype or one file, as text |
| **Copy for agent** in the toolbar  | A person, for any agent         | The same text for the open file, on the clipboard |
| The thread, in the studio          | Everyone                        | The agent's replies, marked **Agent**             |

## What the agent reads

The same text comes out of the command and the copy button. Each comment names its target the way the agent can find it in code: a view's element with its path, a document's quoted text and heading, a diagram's step ID, a canvas element.

```md
## 3 open comments on View "1 View"

File: src/prototypes/bernardo/comments/1 View.vue
Address: /prototypes/j64q52s6xfvb7503/artifacts/m6fsmtjn97wj16ke

### 1. Button "Invite students" · c7k2m9qd4tw1xb3e
Path: main > .heading > .actions > button.btn.primary
- Ada Lovelace: Should this open the class link right away? In the interviews, teachers looked for the link before anything else.
- Bernardo Campos: Agreed. Let's try opening the link dialog first.

### 2. Card "Need help" · h3vq8n2rzk6pye0a
Path: main > section.stats > article.stat.warn
- Bernardo Campos: Make this card clickable: it should filter the table to the two students who need help.
- Bernardo's agent: Done in 1 View.vue: the card now filters the table to Leo and Tomás. Resolve this when you've checked it.

### 4. Card "Upcoming sessions" · w5tj1c0mx9gr2dfs
Target not found: it was removed or changed since.
- Bernardo Campos: Move upcoming sessions above the table.

Reply or resolve with `yarn comments reply <id> "…"` and `yarn comments resolve <id>`.
```

## What the agent does with them

```sh
yarn comments                              # open comments in your prototypes
yarn comments "src/prototypes/bernardo/comments"
yarn comments reply h3vq8n2rzk6pye0a "Done: the card filters the table."
yarn comments resolve h3vq8n2rzk6pye0a      # only when the person asks
```

An open page hears the change at once: the reply shows in the thread, and a resolved pin leaves the page.

## Where comments live

One file per comment, in a hidden `.comments` folder of the prototype. They go to Git with the prototype, so colleagues see them after a pull. Renaming, moving, archiving and deleting the prototype take them along. Duplicating it leaves them behind.

The deployed site shows no comments: it is read-only.
