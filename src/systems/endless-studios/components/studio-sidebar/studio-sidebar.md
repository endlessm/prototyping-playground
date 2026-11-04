---
title: Studio sidebar
description: The platform's main navigation, down the left of every page in Endless Studios, the same one the home page shows. Home, Play and Learning, Admin for staff, then notifications and the profile menu.
source: The app's own components/App/StudioSidebar.vue, copied unchanged from Endless-Game-Making-Studio/studio 11517cbee and still the same on dev (44f2225). Built from Nuxt UI's USidebar and UNavigationMenu.
docs: https://ui.nuxt.com/docs/components/sidebar
---

## When to use

Show the sidebar on any screen that sits inside the platform, the way the home page and every signed-in page do. It tells people where they are, and it's how they get between Home, the games and their learning.

Leave it out of screens that stand alone in the app: sign-up and log-in, onboarding steps, and full-screen editors.

## In Vue screens

Don't rebuild it. A view gets the real sidebar, with the top bar and footer, by asking for the app's frame:

```vue
<script lang="ts">
export const system = { shell: true, user: 'admin' }
</script>
```

To place only the sidebar beside a layout of your own, import the copied file: `import StudioSidebar from '~/components/App/StudioSidebar.vue'`.

## What changes with the visitor

- **Learner and mentor**: Home, Play (Explore Games, My Games) and Learning (My Programs, Resources), then Notifications and the profile menu (Profile, Settings, Support, About us, Log out).
- **Admin and other staff roles**: the same, plus an **Admin** group, open by default, listing the leader pages their roles allow (Games, Programs, Dashboard, Resources, Feed Console, Users, Institutions, Events, Analytics).
- **Signed out**: the same links, with **Log in** and **Sign up** in place of Notifications and the profile.

## Active link

The sidebar lights the link whose address matches the page: Home in orange, Play's links in purple, Learning's in blue. Screens here don't change address, so the preview shows the home page's state.

## Narrow screens

Below 1024 px the sidebar becomes a slide-over menu with a close button, and Notifications and the profile move to the app's mobile header.
