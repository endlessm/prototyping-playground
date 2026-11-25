---
title: Countdown
description: Days, hours, minutes and seconds until an event starts, ticking every second, in light text for the dark live-event banner.
source: The app's own components/Event/Countdown.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452.
---

## When to use

Use it in a banner about an event that hasn't started yet, the way `Event/LiveEventBanner.vue` shows it beside an upcoming live stream. It counts down to `targetDate`, a `Date`, and once that time passes it holds at `00D 00H 00M 00S`, so hide it when the event starts, as the banner does.

Its text is `slate-50`, made for a dark background: on a white card it can't be read. For a date further away, or on a light surface, write the date instead (`$dayjs(start).format('MMMM D, h:mma')`).

## Accessibility

It changes every second and isn't a live region, so screen readers read the time once, when they reach it. The letters D, H, M and S aren't translated, and aren't spelled out for screen readers; put the start time in words nearby.
