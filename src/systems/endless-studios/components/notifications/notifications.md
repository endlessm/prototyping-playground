---
title: Notifications
description: The Recent Notifications panel, with a link to the account settings above the notifications list.
source: The app's own components/Notifications/index.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/Notifications/index.vue
---

## When to use

Show it where someone opens their notifications, such as the panel behind the top bar's bell. It titles the [notifications list](../notifications-list/notifications-list.md) and links to the account settings, where people choose what they're notified about. Opening a notification or the settings asks the panel to close.

## Empty and filled

The list inside reads the `NOTIFICATIONS_LIST` query. With notifications it shows them, unread ones with a dot; with none it says there are no notifications yet. In the Lab, the **Empty** toggle switches between the two.

## In Vue screens

Import the copied file and answer the list's query with sample data:

```vue
<script lang="ts">
const notifications = { getUserNotifications: [{ id: 1, seen: false, created_at: '2026-11-24T12:00:00.000Z', notification: { id: 1, object_id: 3101, object_type_id: 'task', notification_type_id: 'taskapproved', title: 'Task approved', message: 'Your task was approved.', redirect_url: '/tasks/3101', image_url: null } }] }
export const system = { sample: { queries: { NOTIFICATIONS_LIST: notifications } } }
</script>
```
