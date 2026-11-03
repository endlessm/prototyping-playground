---
title: Pagination
description: Moves between pages of a long list or table. Nuxt UI's UPagination as the Endless Studios leader dashboards use it.
source: Nuxt UI 4.8 UPagination, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/pagination
---

## When to use

Use pagination under a table whose rows come a page at a time from the server: the leader dashboards' cohort and learner tables. It sits under the table, aligned right, and shows only when there's more than one page (`v-if="total > pageSize"`).

Give it the `total`, the `items-per-page` and the `page`, bound with `v-model:page` or with `:page` and `@update:page` when changing page loads data. For feeds that people scroll through, such as notifications and posts, the platform loads more as people scroll instead.

The current page is the primary solid button; the others are neutral outline.

## Accessibility

Every button has a label ("Page 3", "Next page"). After the page changes, keep focus near the table so keyboard users don't lose their place.

## In Vue screens

Screens written as `.vue` files use `<UPagination v-model:page="…" :total="…" :items-per-page="…">` directly.
