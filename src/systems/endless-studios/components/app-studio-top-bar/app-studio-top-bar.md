---
title: Studio top bar
description: The app's header on screens narrower than 1024 px, with the menu button and logo, then notifications and the profile menu, or Log in and Sign up when signed out.
source: The app's own components/App/StudioTopBar.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/App/StudioTopBar.vue
---

## When to use

It's part of the app's frame on narrow screens, where the sidebar becomes a slide-over menu that its menu button opens. From 1024 px up it hides, and the sidebar holds notifications and the profile.

## In Vue screens

Don't rebuild it. A view gets it, with the sidebar and footer, by asking for the app's frame, and answers the unread count with a `NOTIFICATIONS_COUNT` sample:

```vue
<script lang="ts">
const count = { getUnreadNotificationsCount: { unread_notifications_count: 3 } }
export const system = { shell: true, sample: { queries: { NOTIFICATIONS_COUNT: count } } }
</script>
```
