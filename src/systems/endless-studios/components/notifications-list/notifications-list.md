---
title: Notifications list
description: The list of someone's notifications, newest first, each with its type, time and an unread dot, or a short note when there are none.
source: The app's own components/Notifications/List.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/Notifications/List.vue
---

## When to use

Show it where someone reviews their notifications. Each one opens its task or page, and hovering it marks it as seen.

## Empty and filled

The list reads the `NOTIFICATIONS_LIST` query. With notifications it shows them, unread ones with a dot; with none it says there are no notifications yet. In the Lab, the **Empty** toggle switches between the two.

## In Vue screens

Import the copied file and answer its query with sample data:

```vue
<script lang="ts">
const notifications = { getUserNotifications: [{ id: 1, seen: false, created_at: '2026-11-24T12:00:00.000Z', notification: { id: 1, object_id: 3101, object_type_id: 'task', notification_type_id: 'taskapproved', title: 'Task approved', message: 'Your task was approved.', redirect_url: '/tasks/3101', image_url: null } }] }
export const system = { sample: { queries: { NOTIFICATIONS_LIST: notifications } } }
</script>
```
