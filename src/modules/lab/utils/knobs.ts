import { pieceOf } from '../../../../tooling/preview/protocol'
import {
  knobDisplay,
  knobPixels,
  knobsOf,
  knobValues,
  type Knob,
  type KnobFamily,
  type KnobTheme,
} from '../../../../tooling/preview/knobs'
import type { BreakdownNode } from '../../../../tooling/systems/breakdown'

/**
 * A piece's knobs, as the inspector and the dial panel offer them: one for
 * each thing the classes of its own theme slots set (the one a slot's card
 * names, or those its slot cards name), kept on the Nuxt UI piece the slot
 * belongs to (`owner`). None for a piece whose tag lives in another file
 * (`elsewhere`), since Save writes only into the Breakdown's own file, nor
 * before the preview reports its classes.
 */
export function pieceKnobs(
  node: Pick<BreakdownNode, 'id' | 'slot' | 'children'>,
  classes: Record<string, Record<string, string> | undefined>,
  theme: KnobTheme,
  elsewhere: string | null,
): { owner: string; knobs: Knob[] } {
  const owner = pieceOf(node.id)
  const slots = classes[owner]
  if (elsewhere || !slots) return { owner, knobs: [] }
  const theirs = node.slot
    ? [node.slot]
    : node.children.flatMap(({ kind, slot }) =>
        kind === 'slot' && slot ? [slot] : [],
      )
  // Only the piece's own theme slots: a Nuxt UI piece may render others
  // inside it (a modal's close button) that aren't pieces of the tree.
  const own = theirs.length
    ? Object.fromEntries(theirs.map((slot) => [slot, slots[slot] ?? '']))
    : slots
  return { owner, knobs: knobsOf(own, theme) }
}

/**
 * The values a knob offers as named choices, for a select: the theme's
 * scale or colours, each named by its class value and, for sizes, its
 * pixels (`md · 6 px`, `1.5` reads `6 px`). A value off the theme's list
 * (`p-13`, an arbitrary colour) comes first, so the select can show it.
 */
export function knobChoices(
  knob: Pick<Knob, 'family'>,
  current: string,
  theme: KnobTheme,
  pixels: (value: string) => string,
): { value: string; label: string }[] {
  const values = knobValues(knob.family, theme)
  const all = values.includes(current) ? values : [current, ...values]
  return all.map((value) => {
    const px = knobPixels(knob.family, value, theme)
    const shown = knobDisplay(knob.family, value, theme)
    if (!/^\d/.test(shown)) return { value, label: value }
    if (px === null) return { value, label: `${value} · ${shown}` }
    // Spacing names its step (`1.5`), which the pixels already say.
    const named = knob.family === 'corners' || knob.family === 'textSize'
    return {
      value,
      label: named ? `${value} · ${pixels(shown)}` : pixels(shown),
    }
  })
}

// Each knob family's icon and colours in the inspector, from the studio's
// theme (`--color-knob-*` in the studio's stylesheet). Kept in the studio's
// own code, where the icon bundle's and Tailwind's scans find them.
export const KNOB_LOOKS: Record<KnobFamily, { icon: string; class: string }> = {
  corners: {
    icon: 'i-lucide-square-round-corner',
    class: 'text-knob-corners bg-knob-corners/12',
  },
  padding: {
    icon: 'i-lucide-scan',
    class: 'text-knob-padding bg-knob-padding/12',
  },
  paddingX: {
    icon: 'i-lucide-unfold-horizontal',
    class: 'text-knob-padding-x bg-knob-padding-x/12',
  },
  paddingY: {
    icon: 'i-lucide-unfold-vertical',
    class: 'text-knob-padding-y bg-knob-padding-y/12',
  },
  gap: {
    icon: 'i-lucide-between-vertical-start',
    class: 'text-knob-gap bg-knob-gap/12',
  },
  textSize: {
    icon: 'i-lucide-a-large-small',
    class: 'text-knob-text-size bg-knob-text-size/12',
  },
  weight: {
    icon: 'i-lucide-bold',
    class: 'text-knob-weight bg-knob-weight/12',
  },
  fill: {
    icon: 'i-lucide-paint-bucket',
    class: 'text-knob-fill bg-knob-fill/12',
  },
  textColor: {
    icon: 'i-lucide-baseline',
    class: 'text-knob-text-color bg-knob-text-color/12',
  },
  ring: {
    icon: 'i-lucide-circle-dashed',
    class: 'text-knob-ring bg-knob-ring/12',
  },
  size: {
    icon: 'i-lucide-scaling',
    class: 'text-knob-size bg-knob-size/12',
  },
}
