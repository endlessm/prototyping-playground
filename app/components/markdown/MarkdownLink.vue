<script setup lang="ts">
// A link in a Markdown reader. A relative link to a file of the document's
// prototype (with or without its extension) opens the artifact at its
// permanent address, so it survives renaming the prototype's folder. `/…`
// addresses navigate inside the studio, `#anchors` stay on the page and
// other sites open in a new tab.
const props = defineProps<{ href?: string }>()
const { origin, resolve } = useMarkdownOrigin()

const EXTERNAL = /^([a-z][a-z0-9+.-]*:|\/\/)/i

const target = computed(() => {
  const href = props.href ?? ''
  if (!href || href.startsWith('#') || href.startsWith('?')) return { href }
  if (EXTERNAL.test(href)) return { href, external: true }
  if (href.startsWith('/')) return { href }
  const resolution = resolve(href, 'optional')
  if (resolution?.state === 'resolved' && origin.value) {
    const hash = /#.*$/.exec(href)?.[0] ?? ''
    return {
      href: `/prototypes/${origin.value.prototype.id}/artifacts/${resolution.artifact.id}${hash}`,
    }
  }
  return { href }
})
</script>

<template>
  <ProseA
    :href="target.href"
    :target="target.external ? '_blank' : undefined"
    :rel="target.external ? 'noopener noreferrer' : undefined"
  >
    <slot />
  </ProseA>
</template>
