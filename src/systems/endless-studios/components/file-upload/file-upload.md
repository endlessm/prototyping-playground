---
title: File upload
description: Lets people drop or choose a file, such as a profile cover or avatar. Nuxt UI's UFileUpload as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UFileUpload, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/file-upload
---

## When to use

Use a file upload when people send the platform a file of their own. The platform uses it for images: a profile cover and an avatar.

- **Area**, the default, is a drop zone with a label and a description. The cover uploader uses it at `min-h-48`, hides the chosen file (`:ui="{ files: 'hidden' }"`) and changes the label and description as the upload moves from idle to uploading to done.
- **Custom trigger**: the avatar editor puts its own button in the default slot, which receives `open`, and turns off `preview`.

Always say what the upload accepts in the description ("SVG, PNG, JPG (max 2MB)"), and set `accept` to match, so the file picker only offers those.

## Accessibility

The drop zone is also a button that opens the file picker, so people who can't drag still can upload. Its label says what to upload, not just "Upload".

## In Vue screens

Screens written as `.vue` files use `<UFileUpload v-model="…">` directly, with the same props.
