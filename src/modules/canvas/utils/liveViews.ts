// Which previews on a canvas stay live. A preview goes live when it comes
// near the view; past MAX_LIVE the ones seen longest ago are unloaded, so
// memory stays bounded however large the canvas is. An unloaded preview
// keeps its sized frame, so nothing moves.

export const MAX_LIVE = 30
/** Never unload a preview seen this recently: panning back and forth doesn't thrash. */
const EVICT_GRACE_MS = 5000
/** How often the canvas looks for previews to unload. */
export const SWEEP_INTERVAL_MS = 3000
/** New previews go live at most this often: several at once freeze panning. */
export const MOUNT_INTERVAL_MS = 150

/** `admit(now)`: true for at most one new preview per interval. */
export function createMountGate(intervalMs = MOUNT_INTERVAL_MS) {
  let last = -Infinity
  return (now: number) => {
    if (now - last < intervalMs) return false
    last = now
    return true
  }
}

/**
 * The previews to unload: those no longer on the canvas, and the least
 * recently seen beyond MAX_LIVE. `lastSeen` maps each live preview to when
 * it was last visible.
 */
export function pickEvictions({
  lastSeen,
  visible,
  onCanvas,
  now,
}: {
  lastSeen: Map<string, number>
  visible: Set<string>
  onCanvas: Set<string>
  now: number
}): string[] {
  const gone = [...lastSeen.keys()].filter((id) => !onCanvas.has(id))
  const excess = lastSeen.size - gone.length - MAX_LIVE
  if (excess <= 0) return gone
  const oldest = [...lastSeen.entries()]
    .filter(
      ([id, seen]) =>
        onCanvas.has(id) && !visible.has(id) && now - seen >= EVICT_GRACE_MS,
    )
    .sort((a, b) => a[1] - b[1])
    .slice(0, excess)
    .map(([id]) => id)
  return [...gone, ...oldest]
}
