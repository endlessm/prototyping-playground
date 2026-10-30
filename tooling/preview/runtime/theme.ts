// A Theme page's tokens, drawn inside the system's preview document by the
// system's own app, so every sample uses the system's stylesheet, fonts,
// colour mode and the colours Nuxt UI sets at runtime. Each value is
// measured here, on the document's root, and measured again when the colour
// mode or a stylesheet changes. The studio sends the tokens and the words;
// this file draws with inline styles only, as the system's stylesheet knows
// nothing of the studio's classes.
import {
  defineComponent,
  h,
  reactive,
  type App,
  type Component,
  type VNode,
} from 'vue'
import { previewShortcut } from '../../../app/utils/shortcuts.ts'
import {
  isThemeHostMessage,
  THEME_CHANNEL,
  THEME_VERSION,
  type SpecimenGroup,
  type SpecimenLabels,
  type SpecimenToken,
  type ThemeDocumentMessage,
} from '../theme.ts'

type Create = (options: {
  component: Component
  props?: Record<string, unknown>
  system: Record<string, unknown>
}) => App

const state = reactive<{
  page: SpecimenGroup | null
  tokens: SpecimenToken[]
  labels: SpecimenLabels | null
  /** Each token's value in the document right now. */
  values: Record<string, string>
}>({ page: null, tokens: [], labels: null, values: {} })

function measure() {
  const style = getComputedStyle(document.documentElement)
  const values: Record<string, string> = {}
  for (const { name } of state.tokens)
    values[name] = style.getPropertyValue(name).trim()
  state.values = values
}

// A token as a style value, with its declared value for one the browser
// doesn't hold (a Tailwind theme value no class uses).
const NAME = /^--[\w\\%-]+$/
const ref = ({ name, value }: SpecimenToken) =>
  NAME.test(name) ? (value ? `var(${name}, ${value})` : `var(${name})`) : ''

const MUTED = { opacity: '0.7' }
const LINE = 'color-mix(in srgb, currentColor 14%, transparent)'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

const shown = (token: SpecimenToken) =>
  state.values[token.name] || token.value || state.labels!.notSet

function heading(text: string) {
  return h(
    'h3',
    {
      style: {
        margin: '0 0 8px',
        fontSize: '13px',
        fontWeight: '600',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        ...MUTED,
      },
    },
    text,
  )
}

function section(title: string | null, children: (VNode | null)[]) {
  return h('section', { style: { marginBottom: '32px' } }, [
    title ? heading(title) : null,
    ...children,
  ])
}

function valueCell(token: SpecimenToken) {
  const value = shown(token)
  return h(
    'code',
    {
      'data-token': token.name,
      'data-value': state.values[token.name] ?? '',
      title: value,
      style: {
        fontFamily: MONO,
        fontSize: '12px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'right',
        ...MUTED,
      },
    },
    value,
  )
}

function nameCell(token: SpecimenToken) {
  return h(
    'code',
    {
      title: token.utility ?? token.name,
      style: {
        fontFamily: MONO,
        fontSize: '13px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textDecoration: token.utility ? 'underline dotted' : undefined,
        textUnderlineOffset: '4px',
      },
    },
    token.name,
  )
}

// A token's name, an optional sample of it, and its value.
function line(token: SpecimenToken, sample: VNode | null = null) {
  return h(
    'div',
    {
      'data-token-row': token.name,
      style: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 14rem) minmax(0, 1fr) minmax(0, 14rem)',
        alignItems: 'center',
        gap: '16px',
        padding: '10px 0',
        borderBottom: `1px solid ${LINE}`,
      },
    },
    [
      nameCell(token),
      h('div', { style: { minWidth: '0' } }, [sample]),
      valueCell(token),
    ],
  )
}

function colorRow(token: SpecimenToken) {
  return h(
    'div',
    {
      'data-token-row': token.name,
      style: {
        display: 'grid',
        gridTemplateColumns:
          '2.5rem minmax(0, 16rem) minmax(0, 1fr) minmax(0, 12rem)',
        alignItems: 'center',
        gap: '16px',
        padding: '8px 0',
        borderBottom: `1px solid ${LINE}`,
      },
    },
    [
      h('div', {
        'data-swatch': token.name,
        style: {
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '8px',
          border: `1px solid ${LINE}`,
          background: ref(token),
        },
      }),
      nameCell(token),
      h('span', { style: { fontSize: '13px', ...MUTED } }, token.role ?? ''),
      valueCell(token),
    ],
  )
}

const SECTION_ORDER = ['text', 'surfaces', 'borders', 'actions']

function colors(labels: SpecimenLabels) {
  const groups = new Map<string, SpecimenToken[]>()
  for (const token of state.tokens) {
    const key = token.heading ?? ''
    groups.set(key, [...(groups.get(key) ?? []), token])
  }
  const rank = (key: string) =>
    SECTION_ORDER.includes(key)
      ? SECTION_ORDER.indexOf(key)
      : key === ''
        ? 99
        : 50
  return [...groups]
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([key, tokens]) =>
      section(
        labels.sections[key] ?? (key || labels.otherColors),
        tokens.map(colorRow),
      ),
    )
}

const note = (text: string) =>
  h('p', { style: { margin: '8px 0', fontSize: '13px', ...MUTED } }, text)

function typography(labels: SpecimenLabels) {
  const all = state.tokens
  const weights = all.filter(({ name }) => name.startsWith('--font-weight-'))
  const families = all.filter(
    ({ name }) =>
      name.startsWith('--font-') &&
      !name.startsWith('--font-weight-') &&
      !name.startsWith('--font-size') &&
      !name.includes('--', 2),
  )
  // A size's line height is `--text-xs--line-height`: a size has one `--`.
  const sizes = all.filter(
    ({ name }) => /^--text-/.test(name) && !name.includes('--', 2),
  )
  const rest = all.filter(
    (token) =>
      !weights.includes(token) &&
      !families.includes(token) &&
      !sizes.includes(token),
  )
  return [
    families.length
      ? section(
          labels.families,
          families.map((token) =>
            h(
              'div',
              {
                'data-token-row': token.name,
                style: { padding: '12px 0', borderBottom: `1px solid ${LINE}` },
              },
              [
                h(
                  'p',
                  {
                    style: {
                      margin: '0 0 4px',
                      fontSize: '24px',
                      fontFamily: ref(token),
                    },
                  },
                  labels.pangram,
                ),
                h(
                  'p',
                  { style: { margin: '0', display: 'flex', gap: '8px' } },
                  [nameCell(token), valueCell(token)],
                ),
              ],
            ),
          ),
        )
      : null,
    section(labels.sizes, [
      ...sizes.map((token) =>
        line(
          token,
          h(
            'span',
            {
              style: {
                fontSize: ref(token),
                lineHeight: `var(${token.name}--line-height, normal)`,
                whiteSpace: 'nowrap',
              },
            },
            labels.sample,
          ),
        ),
      ),
      sizes.length ? null : note(labels.noSizes),
    ]),
    section(labels.weights, [
      ...weights.map((token) =>
        line(
          token,
          h('span', { style: { fontWeight: ref(token) } }, labels.sample),
        ),
      ),
      weights.length ? null : note(labels.noWeights),
    ]),
    rest.length
      ? section(
          labels.other,
          rest.map((token) => line(token)),
        )
      : null,
  ]
}

const box = (style: Record<string, string>) =>
  h('div', {
    style: {
      width: '4rem',
      height: '2.5rem',
      border: `1px solid ${LINE}`,
      background: 'color-mix(in srgb, currentColor 6%, transparent)',
      ...style,
    },
  })

function shadow(token: SpecimenToken) {
  if (token.name.startsWith('--text-shadow'))
    return h(
      'span',
      { style: { textShadow: ref(token), fontSize: '18px' } },
      state.labels!.sample,
    )
  return box(
    token.name.startsWith('--drop-shadow')
      ? { filter: `drop-shadow(${ref(token)})`, border: '0' }
      : { boxShadow: ref(token), border: '0' },
  )
}

function spacing(labels: SpecimenLabels) {
  const widths = state.tokens.filter(({ name }) =>
    /^--(container|ui-container)(-|$)/.test(name),
  )
  const steps = state.tokens.filter((token) => !widths.includes(token))
  return [
    steps.length
      ? section(
          labels.spacing,
          steps.map((token) =>
            line(
              token,
              h('div', {
                style: {
                  width: ref(token),
                  maxWidth: '100%',
                  height: '0.75rem',
                  borderRadius: '2px',
                  background: 'currentColor',
                  opacity: '0.35',
                },
              }),
            ),
          ),
        )
      : null,
    widths.length
      ? section(labels.containers, [
          note(labels.containersNote),
          ...widths.map((token) => line(token)),
        ])
      : null,
  ]
}

function content(): (VNode | null)[] {
  const labels = state.labels
  if (!labels) return []
  switch (state.page) {
    case 'colors':
      return colors(labels)
    case 'typography':
      return typography(labels)
    case 'radius':
      return [
        section(
          null,
          state.tokens.map((token) =>
            line(token, box({ borderRadius: ref(token) })),
          ),
        ),
      ]
    case 'shadows':
      return [
        section(
          null,
          state.tokens.map((token) => line(token, shadow(token))),
        ),
      ]
    case 'spacing':
      return spacing(labels)
    default:
      return [
        section(
          null,
          state.tokens.map((token) => line(token)),
        ),
      ]
  }
}

const Specimen = defineComponent({
  name: 'ThemeSpecimen',
  setup() {
    return () =>
      h(
        'div',
        {
          'data-theme-specimen': state.page ?? '',
          style: { padding: '8px 4px 24px' },
        },
        content(),
      )
  },
})

/** Shows the document's Theme page, as the studio around it asks. */
export function mountTheme(create: Create, session: string | null) {
  const host = document.getElementById('app')!
  const post = (
    message: Omit<ThemeDocumentMessage, 'channel' | 'version' | 'session'>,
  ) => {
    if (!session || window.parent === window) return
    window.parent.postMessage(
      { channel: THEME_CHANNEL, version: THEME_VERSION, session, ...message },
      location.origin,
    )
  }
  window.addEventListener('message', (event) => {
    if (event.source !== window.parent || event.origin !== location.origin)
      return
    if (!session || !isThemeHostMessage(event.data, session)) return
    const { page, tokens, labels } = event.data
    Object.assign(state, { page, tokens, labels })
    measure()
    document.documentElement.dataset.themeState = 'ready'
  })
  // The colour mode and the stylesheets (a hot update rewrites a <style>).
  new MutationObserver(measure).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'style'],
  })
  new MutationObserver(measure).observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  })
  window.addEventListener('keydown', (event) => {
    const action = previewShortcut(event)
    if (action !== 'source') return
    event.preventDefault()
    post({ kind: 'shortcut', action })
  })
  const app = create({ component: Specimen, system: {} })
  app.mount(host)
  // The specimen's own height: the system's stylesheet may stretch the
  // document's root to the frame.
  const specimen =
    host.querySelector<HTMLElement>('[data-theme-specimen]') ?? host
  new ResizeObserver(() => {
    const { bottom } = specimen.getBoundingClientRect()
    post({ kind: 'size', height: Math.ceil(bottom + scrollY) })
  }).observe(specimen)
  post({ kind: 'ready' })
}
