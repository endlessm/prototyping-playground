---
title: Table
description: Rows of records compared across the same columns. Nuxt UI's UTable as the Endless Studios leader dashboards use it.
source: Nuxt UI 4.8 UTable, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/table
---

## When to use

Use a table when people compare records on the same measures: cohorts by quiz score, learners by performance. The leader dashboards are where the platform uses it, always inside a bordered card with a heading and a line saying what the table shows, and a pagination under it when there's more than one page.

For a handful of items, or items people browse rather than compare (games, projects, posts), use cards or a list.

- Define columns with `accessorKey` and `header`. For a cell that isn't plain text (a score bar, a performance chip, a button), give the column an `id` and fill the `#<id>-cell` slot; `row.original` is the row's object.
- Always set `empty` ("No cohorts yet"), so an empty table says why.
- End each row with an outline icon button that opens the record, with an `aria-label` that names it.

## Accessibility

Headers are real `<th>` cells, so screen readers announce each value with its column. Don't put information only in colour: a performance band says its name, and a score bar has its number beside it.

## In Vue screens

Screens written as `.vue` files use `<UTable :data="…" :columns="…">` directly.
