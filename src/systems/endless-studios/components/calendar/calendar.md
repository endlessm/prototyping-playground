---
title: Calendar
description: A month grid for picking a date or a date range. Nuxt UI's UCalendar as the Endless Studios platform uses it.
source: Nuxt UI 4.8 UCalendar, as the frontend uses it (Endless-Game-Making-Studio/studio 11517cbee); app.config doesn't change it.
docs: https://ui.nuxt.com/docs/components/calendar
---

## When to use

Use a calendar when people pick dates and seeing the month helps: the analytics date range picker, which opens a `range` calendar in a popover from an outline button showing the chosen dates. For a date people already know and would rather type, such as a birthday, an input is quicker.

- Put it in a popover (`UPopover`) under a button, as the app does, with `class="p-3"`.
- With `range`, the value is `{ start, end }`; the first press sets the start and the second the end.
- Limit what can be picked with `min-value` and `max-value`, such as no dates after today for a report.

## Values

Dates are `CalendarDate` objects from `@internationalized/date`, which Nuxt UI uses underneath. This system doesn't list that package as a dependency yet, so these examples start empty: pick dates in them. A screen that needs a preset date or limits needs the package added to the system first.

## Accessibility

Arrow keys move between days, Page Up and Page Down between months, and Enter picks a day. The button that opens it says the chosen dates in words.

## In Vue screens

Screens written as `.vue` files use `<UCalendar v-model="…">` directly, usually inside a `UPopover`.
