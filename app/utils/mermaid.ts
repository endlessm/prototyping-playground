// Mermaid for the studio's diagrams (Mermaid fences in documents, and later
// standalone diagrams): one render at a time, themed from the studio's own
// colours and its accent palette. Ported from the React studio.
import { contentPalette } from './contentPalette'

// Mermaid's colour derivation needs hex colours. The studio's Nuxt UI
// variables are resolved through the browser, whatever format they use.
function studioColors() {
  const style = getComputedStyle(document.documentElement)
  const context = document.createElement('canvas').getContext('2d')!
  const hex = (variable: string) => {
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = style.getPropertyValue('--ui-bg').trim()
    context.fillRect(0, 0, 1, 1)
    context.fillStyle = style.getPropertyValue(variable).trim()
    context.fillRect(0, 0, 1, 1)
    return `#${Array.from(context.getImageData(0, 0, 1, 1).data)
      .slice(0, 3)
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')}`
  }
  return {
    background: hex('--ui-bg'),
    text: hex('--ui-text'),
    muted: hex('--ui-bg-elevated'),
    border: hex('--ui-border-accented'),
    line: hex('--ui-text-muted'),
  }
}

const channels = (color: string) =>
  [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16))
const mix = (a: string, b: string, weight: number) =>
  `#${channels(a)
    .map((value, index) =>
      Math.round(value * (1 - weight) + channels(b)[index]! * weight)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`

export function mermaidTheme(dark: boolean) {
  const n = studioColors()
  // Diagram boundaries carry meaning; divider colours are too faint for
  // them in dark mode, so strokes lean towards the text colour.
  if (dark) {
    n.border = mix(n.background, n.text, 0.45)
    n.line = mix(n.background, n.text, 0.65)
  }
  const p = contentPalette[dark ? 'dark' : 'light']
  const accents = [
    p.blue,
    p.cyan,
    p.orange,
    p.purple,
    p.green,
    p.magenta,
    p.yellow,
    p.red,
  ]
  // Pale category surfaces keep the text readable while telling groups apart.
  const tint = (color: string) => mix(n.background, color, 0.18)
  const fontFamily = getComputedStyle(document.body).fontFamily
  return {
    darkMode: dark,
    background: n.background,
    fontFamily,
    fontSize: '14px',
    primaryColor: n.muted,
    secondaryColor: n.muted,
    tertiaryColor: n.background,
    primaryTextColor: n.text,
    secondaryTextColor: n.text,
    tertiaryTextColor: n.text,
    primaryBorderColor: n.border,
    secondaryBorderColor: n.border,
    tertiaryBorderColor: n.border,
    lineColor: n.line,
    textColor: n.text,
    mainBkg: n.muted,
    nodeBorder: n.border,
    clusterBkg: n.background,
    clusterBorder: n.border,
    titleColor: n.text,
    edgeLabelBackground: n.background,
    defaultLinkColor: n.line,
    actorBkg: n.muted,
    actorBorder: n.border,
    actorTextColor: n.text,
    actorLineColor: n.line,
    signalColor: n.line,
    signalTextColor: n.text,
    labelBoxBkgColor: n.background,
    labelBoxBorderColor: n.border,
    labelTextColor: n.text,
    loopTextColor: n.text,
    activationBkgColor: n.muted,
    activationBorderColor: n.border,
    noteBkgColor: n.muted,
    noteBorderColor: n.border,
    noteTextColor: n.text,
    pieTitleTextColor: n.text,
    pieSectionTextColor: n.text,
    pieLegendTextColor: n.text,
    pieStrokeColor: n.background,
    pieOuterStrokeColor: n.border,
    ...Object.fromEntries(
      accents.map((color, index) => [`pie${index + 1}`, tint(color)]),
    ),
    ...Object.fromEntries(
      accents.map((color, index) => [`cScale${index}`, tint(color)]),
    ),
    ...Object.fromEntries(
      accents.map((_, index) => [`cScaleLabel${index}`, n.text]),
    ),
    ...Object.fromEntries(
      accents.map((color, index) => [`fillType${index}`, tint(color)]),
    ),
    ...Object.fromEntries(
      accents.slice(0, 6).map((color, index) => [`actor${index}`, color]),
    ),
    xyChart: {
      backgroundColor: n.background,
      titleColor: n.text,
      xAxisLabelColor: n.text,
      xAxisTitleColor: n.text,
      xAxisTickColor: n.line,
      xAxisLineColor: n.border,
      yAxisLabelColor: n.text,
      yAxisTitleColor: n.text,
      yAxisTickColor: n.line,
      yAxisLineColor: n.border,
      plotColorPalette: accents.join(','),
    },
  }
}

// Mermaid's configuration is global, so renders take turns: diagrams on
// one page, or in two colour modes, can't change it under each other.
let pending: Promise<unknown> = Promise.resolve()

/** The diagram's SVG; throws with Mermaid's message on invalid source. */
export function renderMermaid(source: string, id: string, dark: boolean) {
  const job = pending
    .catch(() => undefined)
    .then(async () => {
      const { default: mermaid } = await import('mermaid')
      const themeVariables = mermaidTheme(dark)
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        look: 'classic',
        themeVariables,
        fontFamily: themeVariables.fontFamily,
        suppressErrorRendering: true,
        secure: [
          'secure',
          'securityLevel',
          'startOnLoad',
          'maxTextSize',
          'maxEdges',
          'suppressErrorRendering',
          'theme',
          'themeVariables',
          'fontFamily',
        ],
      })
      return (await mermaid.render(id, source)).svg
    })
  pending = job
  return job
}
