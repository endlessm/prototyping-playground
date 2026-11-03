---
title: Breadcrumb
description: Shows where a page sits in the hierarchy, with links back up. Nuxt UI's UBreadcrumb with the Endless Studios neutral colours, the same trail the admin pages use.
source: Nuxt UI 4.8 UBreadcrumb with the frontend's app.config breadcrumb settings (Endless-Game-Making-Studio/studio 11517cbee).
docs: https://ui.nuxt.com/docs/components/breadcrumb
---

## When to use

Use a breadcrumb at the top of a page that is several levels deep, so people can see where they are and step back up: Users › Ana Souza › Projects. The platform uses it in the admin page header (`AdminPageHeader`), above the page title, with `color="neutral"`.

Skip it on top-level pages and on learner screens, where the sidebar already says where you are. The last item is the current page: give it a label and no `to`.

## Studios variants

- **Neutral**: earlier links are toned text, the current page is dimmed and medium weight, and the separators are the highlighted text colour.

## In Vue screens

Screens written as `.vue` files use `<UBreadcrumb>` directly, with `:items`.
