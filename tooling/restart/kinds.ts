// The restart handoff's two kinds, as data: how each screen reads, looks,
// waits and confirms. Plain data, so `handoffScript` carries it into the
// page's head script as JSON beside the module's own source.

/**
 * `restart`: any restart, "Applying changes", in every tab. `system`: a
 * system change, in the tab that asked for it, in its caller's words.
 */
export type HandoffKind = 'restart' | 'system'

/** The restart kind's words: "Applying changes". */
export interface RestartText {
  applying: string
  preparing: string
  fallback: string
  slow: string
  reload: string
}

/** The system change kind's own words; its title and description are its caller's. */
export interface SystemText {
  slow: string
  reload: string
}

export interface HandoffText {
  restart: RestartText
  system: SystemText
}

/** A kind of handoff, as data: how its screen reads, looks and waits. */
export interface HandoffKindSetup {
  /** The screen's words, unless its caller gives its own. */
  title: string
  description: string
  /** Words that replace the description after a while, with Reload studio. */
  later: { after: number; words: string }[]
  /**
   * Whether `later` counts from the handoff's start, on every page and
   * across reloads, rather than from when a page starts waiting to leave
   * the server: a page that already came from the new one says nothing
   * later.
   */
  fromStart: boolean
  /** A pending handoff older than this is forgotten. */
  expires?: number
  /**
   * The studio's custom properties its screen takes its colours from, by
   * name, as they were when the handoff started: `--handoff-<name>`.
   */
  colours?: Record<string, string>
  reload: string
  /** The screen's CSS. */
  css: string
  /** How long the screen fades when it lifts, as its CSS says, in ms. */
  fade: number
}

export type HandoffKinds = Record<HandoffKind, HandoffKindSetup>

const RESTART_CSS =
  '#studio-restart{position:fixed;inset:0;z-index:2147483647;display:grid;place-content:center;text-align:center;background:#fff;color:#171717;font:16px system-ui;transition:opacity .15s;outline:none}#studio-restart .spinner{margin:auto;width:24px;height:24px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:studio-spin 1s linear infinite}@keyframes studio-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#studio-restart{transition:none}#studio-restart .spinner{animation:none}}'

// The studio's colours, as captured when the change started, through
// `--handoff-<name>`; the system's own colours when there are none.
const SYSTEM_CSS =
  '#studio-restart{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:24px;background:var(--handoff-background,Canvas);color:var(--handoff-foreground,CanvasText);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif;transition:opacity 160ms ease;outline:none}#studio-restart,#studio-restart *{box-sizing:border-box}#studio-restart .card{width:min(100%,420px);text-align:center}#studio-restart .spinner{width:32px;height:32px;margin:0 auto 24px;border:2px solid var(--handoff-border,GrayText);border-top-color:var(--handoff-foreground,CanvasText);border-radius:50%;animation:studio-spin 1s linear infinite}#studio-restart h1{font-size:24px;line-height:1.3;font-weight:600;margin:0 0 12px;overflow-wrap:anywhere}#studio-restart p{font-size:14px;line-height:1.6;margin:0;color:var(--handoff-muted,GrayText)}#studio-restart button{margin-top:24px;padding:8px 14px;border:1px solid var(--handoff-border,GrayText);border-radius:8px;background:transparent;color:inherit;font:inherit;cursor:pointer}@keyframes studio-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#studio-restart{transition:none}#studio-restart .spinner{animation:none}}'

/** The two kinds, from their words. */
export function handoffKinds(text: HandoffText): HandoffKinds {
  return {
    restart: {
      title: text.restart.applying,
      description: text.restart.preparing,
      later: [
        { after: 15_000, words: text.restart.fallback },
        { after: 30_000, words: text.restart.slow },
      ],
      fromStart: false,
      reload: text.restart.reload,
      css: RESTART_CSS,
      fade: 150,
    },
    system: {
      title: '',
      description: '',
      later: [{ after: 30_000, words: text.system.slow }],
      fromStart: true,
      expires: 120_000,
      colours: {
        background: '--ui-bg',
        foreground: '--ui-text-highlighted',
        muted: '--ui-text-muted',
        border: '--ui-border',
      },
      reload: text.system.reload,
      css: SYSTEM_CSS,
      fade: 160,
    },
  }
}
