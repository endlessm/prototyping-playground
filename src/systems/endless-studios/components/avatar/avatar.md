---
title: Avatar
description: A person's picture, or their initials when there's none. Nuxt UI's UAvatar as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UAvatar, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/avatar
---

## When to use

Use an avatar wherever the platform shows a person: the sidebar's account, a contributor, a notification's sender, a user card. Most screens use the app's own `UserAvatar` (`~/components/Generic/UserAvatar.vue`), which wraps UAvatar and falls back to the profile picture the app resolves for that user.

Pick the size by place: `sm` in the sidebar, `xl` in lists and notifications, `3xl` on user and profile cards. Avatars are always round.

When there's no picture, or it fails to load, the initials of `alt` show instead, or `text` if you give it. For something that isn't a person, such as a program or an organisation, give it an `icon` or a logo.

## Accessibility

Give `alt` the person's name. When the name is written right next to the avatar, the picture repeats it, so an empty `alt` keeps screen readers from reading it twice.

## In Vue screens

Screens written as `.vue` files use `<UAvatar>` directly, or import the app's `UserAvatar`.
