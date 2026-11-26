---
title: Studio footer
description: The dark footer at the bottom of every Endless Studios page. The logo, the Community, Play and Learn links, help, the Endless brands, the code of conduct and terms, and the English and Español switch.
source: The app's own components/App/StudioFooter.vue, copied unchanged from Endless-Game-Making-Studio/studio 4a5087452. Built from Nuxt UI's UContainer and USeparator.
---

## When to use

It's part of the app's frame: show it at the end of any screen that sits inside the platform, the way the home page and every signed-in page do. It's the same for every visitor.

Leave it out of screens that stand alone in the app: sign-up and log-in, onboarding steps, and full-screen editors.

## In Vue screens

Don't rebuild it. A view gets the real footer, with the sidebar and top bar, by asking for the app's frame, and chooses its language with `locale`:

```vue
<script lang="ts">
export const system = { shell: true, locale: 'es' }
</script>
```

To place only the footer under a layout of your own, import the copied file: `import StudioFooter from '~/components/App/StudioFooter.vue'`.

## Language switch

English and Español at the bottom right light the current language in orange. Choosing the other saves it as the person's preferred language through the store's `setPreferredLanguage`. In a preview the store's own actions don't run, so the language stays as the screen chose it; the Code of Conduct link follows it.
