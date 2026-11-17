import type { KnobFamily } from '../../../../tooling/preview/knobs'

// Each knob family's icon in the inspector. Kept in the studio's own code,
// where the icon bundle's scan finds them.
export const KNOB_ICONS: Record<KnobFamily, string> = {
  corners: 'i-lucide-square-round-corner',
  padding: 'i-lucide-scan',
  paddingX: 'i-lucide-unfold-horizontal',
  paddingY: 'i-lucide-unfold-vertical',
  gap: 'i-lucide-between-vertical-start',
  textSize: 'i-lucide-a-large-small',
  weight: 'i-lucide-bold',
  fill: 'i-lucide-paint-bucket',
  textColor: 'i-lucide-baseline',
  ring: 'i-lucide-circle-dashed',
  size: 'i-lucide-scaling',
}
