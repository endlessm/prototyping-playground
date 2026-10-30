<script setup lang="ts">
import type { MarkdownHeading } from '../../markdown/parse'

// "On this page": the document's level 2 and 3 headings, highlighting the
// one scrolled to. Choosing one asks the reader to go there.
const props = defineProps<{
  headings: MarkdownHeading[]
  /** The element the document scrolls in. */
  scroller: HTMLElement | null
}>()
const emit = defineEmits<{ select: [id: string] }>()
const { t } = useI18n()

const active = ref(props.headings[0]?.id)
// The last heading scrolled to the top (going to a heading leaves its scroll
// margin above it), or the last one at the bottom.
function update() {
  const scroller = props.scroller
  if (!scroller) return
  const elements = props.headings
    .map(({ id }) => document.getElementById(id))
    .filter((element): element is HTMLElement => Boolean(element))
  if (!elements.length) return
  const bottom =
    scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 4
  const top = scroller.getBoundingClientRect().top + 8
  const passed = elements.filter(
    (element) =>
      element.getBoundingClientRect().top -
        parseFloat(getComputedStyle(element).scrollMarginTop) <=
      top,
  )
  active.value = (bottom ? elements.at(-1) : (passed.at(-1) ?? elements[0]))!.id
}
useEventListener(() => props.scroller, 'scroll', update, { passive: true })
watch(
  () => props.headings,
  () => nextTick(update),
)
onMounted(update)

function choose(id: string) {
  active.value = id
  emit('select', id)
}
</script>

<template>
  <nav
    :aria-label="t('markdown.onThisPage')"
    class="sticky top-0 hidden w-48 shrink-0 xl:block"
  >
    <p class="mb-2 text-xs font-semibold text-highlighted">
      {{ t('markdown.onThisPage') }}
    </p>
    <ul class="border-l border-default">
      <li v-for="heading in headings" :key="heading.id">
        <a
          :href="`#${heading.id}`"
          :aria-current="active === heading.id ? 'location' : undefined"
          class="-ml-px block truncate border-l py-1 pr-2 text-[13px] transition-colors"
          :class="[
            heading.level === 3 ? 'pl-6' : 'pl-3',
            active === heading.id
              ? 'border-inverted font-medium text-highlighted'
              : 'border-transparent text-muted hover:text-default',
          ]"
          @click.prevent="choose(heading.id)"
          >{{ heading.text }}</a
        >
      </li>
    </ul>
  </nav>
</template>
