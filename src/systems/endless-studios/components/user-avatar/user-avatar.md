---
title: User avatar
description: A person's round profile picture, falling back to the app's default picture when they have none, so every avatar in the app looks the same.
source: The app's own components/Generic/UserAvatar.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452. Built on Nuxt UI's UAvatar.
docs: https://ui.nuxt.com/docs/components/avatar
---

## When to use

Use it wherever a screen shows a person by their picture: a member list, a post's author, a user's admin page. It takes the person's `metadata.image_url` as `src` and their name as `alt`.

Use plain `UAvatar` for things that aren't people, such as an icon or a program's logo, where the default profile picture would be wrong.

## No picture

Without `src` (or with `null`) it shows the app's grey default profile picture, the same one `resolveProfilePic` gives posts. A youth without parental consent has no picture, so their avatar is always the default. A picture that fails to load falls back to the person's initials, from `alt`.
