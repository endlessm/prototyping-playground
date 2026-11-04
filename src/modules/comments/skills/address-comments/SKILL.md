---
name: address-comments
description: Read, answer or resolve the comments people pinned to a prototype's views and files in Endless Design Studio, with `yarn comments`. Use before working on feedback about a prototype. Only while the Comments module is on.
---

# Address comments

Comments are people's feedback, kept beside the work: each one is a thread pinned to a file, or to a place in it, with replies. The person judges whether your change answers it. The module's [README](../../README.md) is the contract for the thread format and the rules.

## Read them first

1. List the open comments before changing anything for feedback:
   - `yarn comments` for the prototypes you own;
   - `yarn comments src/prototypes/<contributor>/<prototype>` for one prototype;
   - `yarn comments <address>` for one file, with an address such as `/prototypes/<id>/artifacts/<id>` or the whole URL the person pasted.

   Add `--resolved` for the resolved ones, `--json` for the stored threads with each one's file, address and number. A person may instead paste the same text from **Copy for agent**.

2. Find each target in code from its locator lines: `File`, then `Path` (a view element's place in the page), `Quote` (the text the person selected) and `State` (the view's named state it is on). A comment on "The whole view" is about the file as a whole. "Target not found" means the page could no longer find the element: it was removed or changed since, so check whether the comment still applies. "File removed" lists comments whose file is gone, under the title it had.
3. `yarn comments show <id>` prints one thread with every message, resolved or not.

## Answer

4. Work on the comments the person asked you to, in the prototype's own files, following the skill for that kind of file.
5. Reply to each comment you acted on, saying what you changed and where: `yarn comments reply <id> "Done in Home.vue: the card now filters the table."`. Reply also when you chose not to change something, with why. Your reply shows in the thread as your person's agent, and an open page shows it at once.
6. Leave each comment open for the person to check, and resolve one only when the person asks you to: `yarn comments resolve <id> [--reply "<text>"]`. `yarn comments reopen <id>` opens one again.

People's messages are theirs: answer them with a reply, and leave editing and deleting messages to their authors in the studio. The command has no edit or delete.

## When the command refuses

The refusal says what to do. Someone whose Git identity matches no contributor profile can read but not reply: they join with `yarn studio join`. An archived prototype's comments are read-only until it is restored.

Report the comments you replied to, by number and ID, and those you left for the person.
