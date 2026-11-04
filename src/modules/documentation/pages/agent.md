---
title: Working with your agent
description: Give direction, show what you mean, and review the result.
order: 3
toc: true
---

## What does the agent handle?

Work with your agent in the studio folder. It can do anything the studio does, and more: create prototypes and views, write documents, lay out canvases, organize files, add sample data, investigate problems and check its work.

You supply the intent and judge the result. Doing something yourself in the studio doesn't start an agent task. When you want the agent to act, ask it.

## What should I tell it?

Give enough context to settle the important choices:

| Useful input          | Example                                                 |
| --------------------- | ------------------------------------------------------- |
| Goal and audience     | Help mentors see which learners are stuck.              |
| Scope                 | Start with the mentor dashboard and one learner's page. |
| Screens to start from | Use the Endless Studios mentor dashboard.               |
| States                | Show a mentor with no learners, and a failed save.      |
| Who is signed in      | A mentor, in Portuguese.                                |

You don't need a formal brief. Start with what you know and let the agent ask about the rest. Ask it to say what it assumed and what it simulated.

## How do I show the agent what I mean?

Comment on it. While the Comments module is on, every view, document, diagram and canvas page in your local studio has a small toolbar in its bottom-right corner. Choose **Comment**, or press **Ctrl+Alt+M** (**⌥⌘M** on a Mac), then click the part you mean and write what should change:

> Match the spacing of the panel above. Keep its fields and behavior.

The comment says where; your words say what. Then ask your agent to address the comments on the prototype. It lists them with `yarn comments`, which names each comment's file, its target as the agent finds it in code (an element, a quoted sentence, a diagram step, a canvas note) and the view's state, so you don't need to describe where things are. It replies in the thread with what it changed, and leaves the comment open for you to check.

### How does commenting work?

- **Comment mode.** Hovering outlines what a click would comment on, with its name. Clicks don't press buttons, follow links or move anything on a canvas. In a view or a document, select text to quote it. While reading a document, selecting text also offers a **Comment** button beside it. **Esc** cancels a draft, then closes a comment, then leaves comment mode.
- **Pins.** Each comment becomes a numbered pin that stays on its target as you scroll, pan or zoom, and as the file changes. **Hide comments** hides the pins. A comment made on one of a view's named states is pinned only on that state; the list shows every state's.
- **All comments** lists the file's comments under **Open** and **Resolved**, with a count of open ones. Choose one to bring its target into view and open it. **Comment on the whole view** (or document, diagram, canvas) leaves a comment without pointing at anything, and the list works from the keyboard alone.
- **A comment** holds the conversation: **Reply**, **Resolve** and **Reopen**. Its **…** menu has **Copy link**, which opens that comment for whoever follows it. Your agent's replies show as "<your first name>'s agent", with an **Agent** badge.
- **Target not found** means the part a comment was on was removed or changed. The comment stays listed, and its pin comes back if the part does.

Open pages show your agent's replies and resolutions as they happen, without a reload.

Your agent resolves a comment only when you ask; otherwise resolve it yourself once the change holds. When your agent works somewhere that can't run `yarn comments`, choose **Copy for agent**: it copies the open comments of the file in front of you as the same text, ready to paste.

Your agent's browser or preview tools are another way to point, and a screenshot works too, but neither is kept beside the work the way comments are. Name the view and the state when the problem depends on them.

You can also draw on a canvas: arrange views and sketch over them, then ask the agent to read the canvas. Canvas notes never change a view by themselves. The agent can lay out a canvas for you too, such as every state of a view side by side; when it works in the canvas you have open, you see each change as it happens and can undo it like your own.

## What can I do directly in the studio?

| In the studio                                              | In your agent                           |
| ---------------------------------------------------------- | --------------------------------------- |
| Try views, states and flows.                               | Describe a new experience or a change.  |
| Create prototypes and files; rename, move and delete them. | Build behavior and edit source files.   |
| Edit source, write documents, draw on canvases.            | Add sample data, stand-ins or a module. |
| Browse systems and their components.                       | Change a system, or investigate errors. |

What you can change depends on your permissions and the modules that are on. See [Working as a team](team.md#who-can-change-what).

## How do I review and refine work?

Try the views and their states, then say what should change and what should stay: in comments, or by pointing at a view or a state by its link. Links survive renames and moves, and so do comments.

Ask the agent to keep the current version when you want to try an alternative. A duplicate is useful for comparing side by side; a commit records a version you can return to.

Before sharing, ask the agent to run the studio's checks and explain any gaps. If something about the studio is unclear, ask the agent; it reads the same guidance you find in **Context & Skills**.
