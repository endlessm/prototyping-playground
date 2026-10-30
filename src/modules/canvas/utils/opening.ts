// Opening a canvas is a presentation boundary, independent of saving and
// preview freshness: one quiet surface hides the scene being set up, and the
// scene reveals once.
export const OPENING_WAIT_MS = 2000
export const OPENING_STATUS_DELAY_MS = 200
/** Hidden tabs may not run animation frames; a timer backs them up. */
export const OPENING_FRAME_FALLBACK_MS = 120

/**
 * Whether the scene can reveal: every live preview visible in the first view
 * has settled, or the bounded wait is over.
 */
export function openingReady(
  expected: readonly string[],
  settled: ReadonlySet<string>,
  elapsed: number,
) {
  return elapsed >= OPENING_WAIT_MS || expected.every((id) => settled.has(id))
}

/**
 * The embeds whose previews committed or failed, read from the readiness
 * markers embedded previews set (views, diagrams). Unsupported or unresponsive previews fall
 * through to the bounded wait.
 */
export function settledEmbeds(container: HTMLElement) {
  const settled = new Set<string>()
  for (const embed of container.querySelectorAll<HTMLElement>(
    '[data-canvas-embed-id]',
  ))
    if (
      embed.querySelector(
        '[data-preview-state="ready"], [data-preview-state="error"], [data-artifact-phase="ready"], [data-artifact-phase="error"], [data-diagram-state="ready"], [data-diagram-state="error"], [role="alert"]',
      )
    )
      settled.add(embed.dataset.canvasEmbedId!)
  return settled
}
