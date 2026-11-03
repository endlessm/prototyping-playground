---
title: Form field
description: Gives a control its label, help text and error. Nuxt UI's UFormField as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UFormField, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/form-field
---

## When to use

Wrap every form control (an input, select, textarea, select menu, file upload) in a form field. It draws the label above the control, links the two for screen readers, and shows the help line and the error under it.

- `label` names the value; `required` adds an asterisk.
- `hint` sits at the end of the label row, for "Optional" or a character count.
- `description` sits between the label and the control, for a line people should read before they type.
- `help` sits under the control; an error replaces it.

Inside a `UForm`, give the field a `name` that matches its key in the form's state, and the form's validation fills `error` for you. Outside one, set `error` yourself.

## Accessibility

The label is what screen readers announce on focus, so it must say what the value is. `required` only marks the label: the form's validation is what enforces it.

## In Vue screens

Screens written as `.vue` files use `<UFormField>` directly around one control, with the same props.
