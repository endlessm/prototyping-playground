---
title: Form
description: Holds a form's values, checks them, and shows each error on its field. Nuxt UI's UForm as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UForm, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/form
---

## When to use

Use a form whenever people fill in values and submit them: joining with an enrollment code, editing a profile, creating a cohort. It keeps the values in one reactive `state` object, checks them on submit and as people type, and puts each message on the form field whose `name` matches.

The app's forms check their state with a Zod `schema`. For a check a schema can't express, pass a `validate` function that returns `{ name, message }` errors, as the examples here do. `@submit` runs only once everything passes.

Forms usually sit in a modal or a side panel, with the submit button in its footer. A button outside the form submits it with `type="submit"` and `form="<the form's id>"`, which is how the app's modals do it.

## Accessibility

Show errors on the fields, in words that say how to fix them, not only in a toast. Keep the submit button enabled so people can find out what's missing.

## In Vue screens

Screens written as `.vue` files use `<UForm :state="…" :schema="…" @submit="…">` directly, with `UFormField` fields inside.
