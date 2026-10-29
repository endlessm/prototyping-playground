// The parity report: each scenario step's screenshots, the new studio beside
// the React studio, in one HTML page next to the screenshots.
import type { Side } from './fixtures'

/** One line of a run's `steps.jsonl`: a screenshot taken, or a scenario that failed. */
export type StepRecord =
  | { scenario: string; side: Side; index: number; step: string; image: string }
  | { scenario: string; side: Side; error: string }

const SIDES: Side[] = ['vue', 'react']

const escape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!,
  )

function scenarioSection(scenario: string, records: StepRecord[]) {
  const shots = records.filter((record) => 'image' in record)
  const steps = [...new Set(shots.map((record) => record.index))].sort(
    (a, b) => a - b,
  )
  const errors = records.filter((record) => 'error' in record)
  const cell = (side: Side, index: number) => {
    const shot = shots.find((r) => r.side === side && r.index === index)
    return shot
      ? `<td><a href="${escape(shot.image)}"><img src="${escape(shot.image)}" alt="${escape(`${shot.step}, ${side}`)}"></a></td>`
      : '<td class="missing">No screenshot</td>'
  }
  const rows = steps.map((index) => {
    const name = shots.find((r) => r.index === index)!.step
    return `<tr data-step="${index}"><th scope="row">${index}. ${escape(name)}</th>${SIDES.map((side) => cell(side, index)).join('')}</tr>`
  })
  return [
    `<section><h2>${escape(scenario)}</h2>`,
    ...errors.map(
      (r) =>
        `<p class="error"><strong>${r.side === 'vue' ? 'New studio' : 'React studio'} failed:</strong> ${escape(r.error)}</p>`,
    ),
    '<table><thead><tr><th>Step</th><th>New studio</th><th>React studio</th></tr></thead>',
    `<tbody>${rows.join('')}</tbody></table></section>`,
  ].join('\n')
}

export function renderParityReport({
  started,
  sides,
  records,
}: {
  started: string
  /** How each studio ran: its version and address. */
  sides: Record<Side, string>
  records: StepRecord[]
}) {
  const scenarios = [...new Set(records.map((record) => record.scenario))]
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Parity report, ${escape(started)}</title>
<style>
body { font: 14px/1.5 system-ui, sans-serif; margin: 24px; color: #222; }
table { border-collapse: collapse; width: 100%; table-layout: fixed; }
th, td { border: 1px solid #ddd; padding: 8px; vertical-align: top; text-align: left; }
thead th:first-child, tbody th { width: 160px; }
img { width: 100%; height: auto; display: block; }
.missing { color: #a00; }
.error { color: #a00; white-space: pre-wrap; }
</style>
</head>
<body>
<h1>Parity report</h1>
<p>Run started ${escape(started)}.</p>
<ul><li>New studio: ${escape(sides.vue)}</li><li>React studio: ${escape(sides.react)}</li></ul>
${scenarios
  .map((scenario) =>
    scenarioSection(
      scenario,
      records.filter((r) => r.scenario === scenario),
    ),
  )
  .join('\n')}
</body>
</html>
`
}
