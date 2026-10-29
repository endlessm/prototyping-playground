import { describe, expect, test } from 'vitest'
import {
  checklistRows,
  coverageReport,
  renderCoverage,
  testNames,
} from '../../tooling/parity/coverage'

const CHECKLIST = `# Checklist

| ID | Behavior | Where | Source | Fate | Note |
|---|---|---|---|---|---|
| PR-20 | A prototype opens its first artifact. | \`/prototypes/<id>\` | router | keep | Ticket: 03. |
| PR-21 | Every artifact has a permanent address. | | | keep | Ticket: 03. |
| PR-23 | The viewer layout. | | | keep, Nuxt UI pattern | Ticket: 03. |
| SH-13 | Prototype-like sections. | | | drop | Ticket: 02. |

| Area | Rows |
|---|---|
| PR: prototypes | 166 |
`

describe('checklist coverage', () => {
  test('reads every row with its fate from the checklist tables', () => {
    expect(checklistRows(CHECKLIST)).toEqual([
      {
        id: 'PR-20',
        fate: 'keep',
        behavior: 'A prototype opens its first artifact.',
      },
      {
        id: 'PR-21',
        fate: 'keep',
        behavior: 'Every artifact has a permanent address.',
      },
      {
        id: 'PR-23',
        fate: 'keep, Nuxt UI pattern',
        behavior: 'The viewer layout.',
      },
      { id: 'SH-13', fate: 'drop', behavior: 'Prototype-like sections.' },
    ])
  })

  test('finds the names of tests, suites and parity scenarios in a test file', () => {
    // Brackets are added at run time, so the coverage report does not count
    // this file's sample as tests of these rows.
    const source = [
      "describe('«SH-13» sections', () => {",
      "  test('«PR-20» «PR-21» a prototype’s address opens it', async () => {})",
      '  it(`plain name`, () => {})',
      '  test.skip("«PR-23» the viewer", () => {})',
      '})',
      "scenario('«PR-21» opening a view', async () => {})",
    ]
      .join('\n')
      .replaceAll('«', '[')
      .replaceAll('»', ']')
    expect(testNames(source)).toEqual([
      '[SH-13] sections',
      '[PR-20] [PR-21] a prototype’s address opens it',
      'plain name',
      '[PR-23] the viewer',
      '[PR-21] opening a view',
    ])
  })

  test('maps each row to the tests that name it and to recorded visual checks', () => {
    const report = coverageReport({
      checklist: CHECKLIST,
      tests: [
        { file: 'tests/e2e/a.test.ts', name: '[PR-20] [PR-21] opens it' },
        { file: 'tests/parity/b.test.ts', name: '[PR-21] opening a view' },
        { file: 'tests/unit/c.test.ts', name: '[XX-99] not a row' },
      ],
      visualChecks: [
        {
          row: 'PR-23',
          scenario: 'opening a view',
          step: 'The view',
          verdict: 'same',
          reviewed: '2026-10-28',
        },
      ],
    })

    expect(report.tested).toEqual(['PR-20', 'PR-21'])
    expect(report.visual).toEqual(['PR-23'])
    expect(report.neither).toEqual(['SH-13'])
    expect(report.unknown).toEqual([
      { id: 'XX-99', file: 'tests/unit/c.test.ts' },
    ])
    expect(report.rows.find(({ id }) => id === 'PR-21')?.tests).toEqual([
      { file: 'tests/e2e/a.test.ts', name: '[PR-20] [PR-21] opens it' },
      { file: 'tests/parity/b.test.ts', name: '[PR-21] opening a view' },
    ])
  })

  test('renders a report listing covered rows, visual checks and rows with neither', () => {
    const text = renderCoverage(
      coverageReport({
        checklist: CHECKLIST,
        tests: [{ file: 'tests/e2e/a.test.ts', name: '[PR-20] opens it' }],
        visualChecks: [
          {
            row: 'PR-23',
            scenario: 'opening a view',
            step: 'The view',
            verdict: 'same',
            reviewed: '2026-10-28',
          },
        ],
      }),
    )
    expect(text).toContain(
      '4 rows: 1 covered by tests, 1 with a recorded visual check, 2 with neither',
    )
    expect(text).toMatch(
      /## Covered by tests[\s\S]*PR-20[\s\S]*tests\/e2e\/a\.test\.ts › \[PR-20\] opens it/,
    )
    expect(text).toMatch(
      /## Recorded visual checks[\s\S]*PR-23[\s\S]*opening a view › The view: same \(2026-10-28\)/,
    )
    expect(text).toMatch(/## Neither[\s\S]*PR-21 \(keep\)[\s\S]*SH-13 \(drop\)/)
  })
})
