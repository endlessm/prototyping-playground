---
title: App detail page
description: The layout of a page about one thing, such as a person's profile, with a cover, a sidebar that overlaps it, tabs and content, inside the app's page frame.
source: The app's own components/App/AppDetailPage.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452. Built on App/AppPage.vue and Nuxt UI's UContainer and USeparator.
---

## When to use

Use it for a page that drills into one item and has a picture or summary to lead with: the profile page (`pages/profile/[username].vue`) is the app's example, with the cover, the person's card in the sidebar and Overview, Skills, Certificates and Games as tabs.

For a page that lists things or holds one form, with no cover or sidebar, use `App/AppSimplePage.vue`.

## Slots

Every slot is optional, and only the slots a page fills take space.

- **`header`**: full-width banners above the page, as in AppPage.
- **`banner`**: a notice or call to action above the cover, as wide as the content. The profile page shows its visibility banner here.
- **`cover`**: a cover image or banner.
- **`sidebar`**: a column a quarter wide, at least 240 px, left of the content. With a cover it moves up to overlap the cover's bottom edge; on narrow screens it sits above the content.
- **`navigation`**: tabs above the content, with a separator under them.
- **default**: the page's content.

Everything but `header` is held to the app's container width.
