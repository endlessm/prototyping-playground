---
title: Program tile
description: A program as a tile, with its image, name, description, task count and, for the viewer's own programs, their status and cohort.
source: The app's own components/Program/ProgramTile.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
app: components/Program/ProgramTile.vue
---

## When to use

Use it in program lists: My Programs, the catalog and the leaders' program pages. Clicking it opens the program, on the viewer's cohort when they have one; with several cohorts, **Choose cohort** opens the one they pick. The leaders' tile (`is-leader-view`) emits `click` and has a delete button that emits `delete`.

## In Vue screens

Import the copied file and pass it the program and the viewer's cohorts:

```vue
<script setup lang="ts">
import ProgramTile from '~/components/Program/ProgramTile.vue'

const program = {
  id: 42,
  name: 'Make your first platformer',
  short_description: 'Build a small platformer over eight weeks.',
  image_url: null,
  program_kind_id: null,
  program_status_id: 'inprogress',
  tasks_count: 12,
}
const cohorts = [{ id: 301, name: 'Spring 2026 · Tuesdays' }]
</script>

<template>
  <ProgramTile test-attr-data="program-tile" :program="program" :cohorts="cohorts" is-mine />
</template>
```
