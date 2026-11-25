<!--
  The SVG symbol: the app's own components/Generic/SvgSymbol.vue, copied unchanged.
  Screens don't use this file: they import `~/components/Generic/SvgSymbol.vue` and pass it an SVG component. This
  file gives it the Endless Loader, the one SVG the app turns into a component, so the component page and the Lab's
  Playground show it.
-->
<script setup lang="ts">
import SvgSymbol from '~/components/Generic/SvgSymbol.vue';
import EndlessLoader from '~/assets/images/loader/endless-loader.svg?component';

withDefaults(
  defineProps<{
    /** The id of the shared `<symbol>` every copy of this SVG points to. Copies with the same key share one symbol. */
    symbolKey?: string;
    /** The element wrapping the symbol: `svg` on its own, `g` inside an SVG of your own. */
    tag?: 'svg' | 'g';
  }>(),
  { symbolKey: 'endless_loader', tag: 'svg' },
);
</script>

<template>
  <!-- The symbol is built once per mount, so a new key or tag remounts it. -->
  <SvgSymbol :key="`${symbolKey}:${tag}`" :icon="EndlessLoader" :symbol-key="symbolKey" :tag="tag" class="block w-full aspect-[466/194]" />
</template>
