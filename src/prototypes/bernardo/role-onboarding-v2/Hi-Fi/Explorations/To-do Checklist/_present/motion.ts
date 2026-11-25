export const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

// The same spring as the celebrated checklist: damping ratio 0.5, kicked from 0 towards 1, sampled into linear().
export function spring(kick: number): string {
  const k = 0.5 / Math.sqrt(0.75)
  const end = Math.atan2(k + kick, k * kick - 1) + 2 * Math.PI
  const points = Array.from({ length: 49 }, (_, n) => {
    const angle = (n / 48) * end
    return n === 48 ? 1 : 1 + Math.exp(-k * angle) * (kick * Math.sin(angle) - Math.cos(angle))
  })
  return `linear(${points.map((point) => point.toFixed(4)).join(', ')})`
}

export const POP = spring(10.0239)
export const BOUNCE = spring(2.9043)

export const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
