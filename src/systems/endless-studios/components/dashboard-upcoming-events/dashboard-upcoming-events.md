---
title: Upcoming events
description: The dashboard card listing the next live events, each with its date, or a short note when nothing is scheduled.
source: The app's own components/Dashboard/UpcomingEvents.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/Dashboard/UpcomingEvents.vue
---

## When to use

Show it on the dashboard, beside the other cards, to point people to the next live events. Each event links to its live event page.

## Empty and filled

The card reads the `UpcomingEventInstances` query. With events it lists up to `limit` of them; with none it says there are no upcoming events. In the Lab, the **Empty** toggle switches between the two.

## In Vue screens

Import the copied file and answer its query with sample data:

```vue
<script lang="ts">
const events = { upcomingEventInstances: [{ id: '9701-2026-11-13', title: 'Studio Live', start: '2026-11-13T00:00:00.000Z', event: { id: 9701 } }] }
export const system = { sample: { queries: { UpcomingEventInstances: events } } }
</script>
```
