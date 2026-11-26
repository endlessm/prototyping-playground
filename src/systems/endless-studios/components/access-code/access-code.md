---
title: Access code
description: A small card that lets someone who has an enrollment code join its program or game, beside the programs on the home page.
source: The app's own components/shared/AccessCode.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
---

## When to use

Use it where people may arrive with a code from a teacher or program: the home page puts it at the top of its right column, above upcoming events, with `$t('access_code')`, `$t('access_code_if_you_are_part_of_a_program')` and `$t('i_have_a_code')`.

It only asks for the code. Pressing the button emits `open`, and the screen opens its own enrollment-code modal. Signed out, the button asks the visitor to log in first and `open` isn't emitted.

To join a program from its own page, use the program's join button instead.
