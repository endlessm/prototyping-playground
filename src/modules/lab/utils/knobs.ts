import type { KnobFamily } from '../../../../tooling/preview/knobs'

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
