// The studio's accent palette for code, documents and diagrams: Flexoki
// (https://stephango.com/flexoki, MIT, by Steph Ango), its 600 shades in
// light mode and its 400 shades in dark mode. Neutrals come from the
// studio's Nuxt UI theme; a prototype's system never sees these colours.
// Keywords green, imports red, strings cyan, numbers purple, constants and
// types yellow, functions orange, variables and attributes blue, tags
// magenta; comments and punctuation quiet.
export const contentPalette = {
  light: {
    red: '#AF3029',
    orange: '#BC5215',
    yellow: '#AD8301',
    green: '#66800B',
    cyan: '#24837B',
    blue: '#205EA6',
    purple: '#5E409D',
    magenta: '#A02F6F',
    comment: '#878580',
  },
  dark: {
    red: '#D14D41',
    orange: '#DA702C',
    yellow: '#D0A215',
    green: '#879A39',
    cyan: '#3AA99F',
    blue: '#4385BE',
    purple: '#8B7EC8',
    magenta: '#CE5D97',
    comment: '#878580',
  },
} as const

export type ContentMode = keyof typeof contentPalette

/**
 * The palette as Shiki's theme for code in documents. TextMate scopes differ
 * from the source editor's tags but share the colour roles. Backgrounds
 * come from the studio's prose styles.
 */
export function documentCodeTheme(mode: ContentMode) {
  const p = contentPalette[mode]
  return {
    name: `studio-${mode}`,
    type: mode,
    colors: {
      'editor.background': mode === 'dark' ? '#171717' : '#FFFFFF',
      'editor.foreground': mode === 'dark' ? '#FAFAFA' : '#171717',
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
