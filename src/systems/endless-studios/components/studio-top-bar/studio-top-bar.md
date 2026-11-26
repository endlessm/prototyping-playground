---
title: Studio top bar
description: The bar across the top of every Endless Studios page on phones and tablets. The menu button and logo on the left, then notifications and the profile menu, or Log in and Sign up for visitors.
source: The app's own components/App/StudioTopBar.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452. Built from Nuxt UI's UNavigationMenu, UButton and UChip.
docs: https://ui.nuxt.com/docs/components/navigation-menu
---

## When to use

It's part of the app's frame, so every screen that sits inside the platform has it below 1024 px, where the sidebar turns into a slide-over menu that its menu button opens. From 1024 px up the app hides it: the sidebar carries notifications and the profile instead. This page shows it at every width.

Leave it out of screens that stand alone in the app: sign-up and log-in, onboarding steps, and full-screen editors.

## In Vue screens

Don't rebuild it. A view gets the real top bar, with the sidebar and footer, by asking for the app's frame:

```vue
<script lang="ts">
export const system = {
  shell: true,
  user: 'learner',
  sample: { queries: { NOTIFICATIONS_COUNT: { getUnreadNotificationsCount: { unread_notifications_count: 3 } } } },
}
</script>
```

To place only the top bar above a layout of your own, import the copied file: `import StudioTopBar from '~/components/App/StudioTopBar.vue'`.

## What changes with the visitor

- **Signed in**: the bell opens Recent notifications, with an orange dot while any are unread; the avatar opens Profile, Settings, Support, About us and Log out.
- **Signed out**: **Log in** and **Sign up** in their place.
