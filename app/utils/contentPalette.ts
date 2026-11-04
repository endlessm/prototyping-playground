// The studio's accent palette for code, documents and diagrams: the 600
// shades of Flexoki (https://stephango.com/flexoki, MIT, by Steph Ango).
// The studio is light only (ADR 0005). Neutrals come from the studio's
// Nuxt UI theme; a prototype's system never sees these colours.
// Keywords green, imports red, strings cyan, numbers purple, constants and
// types yellow, functions orange, variables and attributes blue, tags
// magenta; comments and punctuation quiet.
export const contentPalette = {
  red: '#AF3029',
  orange: '#BC5215',
  yellow: '#AD8301',
  green: '#66800B',
  cyan: '#24837B',
  blue: '#205EA6',
  purple: '#5E409D',
  magenta: '#A02F6F',
  comment: '#878580',
} as const

/**
 * The palette as Shiki's theme for code in documents. TextMate scopes differ
 * from the source editor's tags but share the colour roles. Backgrounds
 * come from the studio's prose styles.
 */
export function documentCodeTheme() {
  const p = contentPalette
  return {
    name: 'studio-light',
    type: 'light',
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#171717',
    },
    tokenColors: [
      { scope: ['keyword', 'storage'], settings: { foreground: p.green } },
      {
        scope: [
          'keyword.control.import',
          'keyword.control.export',
          'keyword.control.from',
        ],
        settings: { foreground: p.red },
      },
      { scope: ['string'], settings: { foreground: p.cyan } },
      { scope: ['constant.numeric'], settings: { foreground: p.purple } },
      {
        scope: [
          'constant.language',
          'support.type',
          'entity.name.type',
          'entity.name.class',
        ],
        settings: { foreground: p.yellow },
      },
      {
        scope: ['variable', 'entity.other.attribute-name', 'support.variable'],
        settings: { foreground: p.blue },
      },
      {
        scope: ['entity.name.function', 'support.function'],
        settings: { foreground: p.orange },
      },
      {
        scope: [
          'entity.name.tag',
          'constant.character.escape',
          'string.regexp',
        ],
        settings: { foreground: p.magenta },
      },
      {
        scope: ['punctuation', 'keyword.operator'],
        settings: { foreground: p.comment },
      },
      {
        scope: ['comment'],
        settings: { foreground: p.comment, fontStyle: 'italic' },
      },
      {
        scope: ['markup.heading'],
        settings: { foreground: p.orange, fontStyle: 'bold' },
      },
      { scope: ['markup.underline.link'], settings: { foreground: p.blue } },
    ],
  }
}
