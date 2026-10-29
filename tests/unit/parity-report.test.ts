import { describe, expect, test } from 'vitest'
import {
  renderParityReport,
  type StepRecord,
} from '../../tooling/parity/report'

const scenario = '[PR-21] opening a <prototype> view'
const records: StepRecord[] = [
  {
    scenario,
    side: 'vue',
    index: 1,
    step: 'Home',
    image: 'open/01-home.vue.png',
  },
  {
    scenario,
    side: 'react',
    index: 1,
    step: 'Home',
    image: 'open/01-home.react.png',
  },
  {
    scenario,
    side: 'vue',
    index: 2,
    step: 'The view',
    image: 'open/02-the-view.vue.png',
  },
  { scenario, side: 'react', error: 'Timed out waiting for the heading' },
]

describe('parity report', () => {
  const html = renderParityReport({
    started: '2026-10-28T21:00:00.000Z',
    sides: {
      vue: 'New studio (Vue) http://127.0.0.1:3001/',
      react: 'React studio (main, 34b9bef8) http://localhost:5174/',
    },
    records,
  })

  test('shows each step’s screenshots side by side, new studio first', () => {
    const home = html.slice(html.indexOf('<tr data-step="1">'))
    expect(home.indexOf('open/01-home.vue.png')).toBeGreaterThan(0)
    expect(home.indexOf('open/01-home.react.png')).toBeGreaterThan(
      home.indexOf('open/01-home.vue.png'),
    )
    expect(home.indexOf('open/01-home.react.png')).toBeLessThan(
      home.indexOf('</tr>'),
    )
  })

  test('marks a step one side never reached, and names the failure', () => {
    const view = html.slice(html.indexOf('<tr data-step="2">'))
    expect(view.slice(0, view.indexOf('</tr>'))).toContain('No screenshot')
    expect(html).toContain('Timed out waiting for the heading')
  })

  test('names both studios and escapes scenario text', () => {
    expect(html).toContain('React studio (main, 34b9bef8)')
    expect(html).toContain('opening a &lt;prototype&gt; view')
    expect(html).not.toContain('<prototype>')
  })
})
