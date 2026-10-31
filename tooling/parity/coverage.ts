// Checklist coverage: which checklist rows a test names (`[PR-21]` in its
// name) and which have a recorded visual check from a parity review.
// `yarn parity:coverage` writes the report; ticket 34 uses it to prove the
// checklist.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ChecklistRow {
  id: string
  fate: string
  behavior: string
}

export interface NamedTest {
  file: string
  name: string
}

/** A side-by-side review of a parity screenshot pair, kept in `tests/parity/visual-checks.json`. */
export interface VisualCheck {
  row: string
  scenario: string
  step: string
  /** `same`, or `accepted` for an intended difference; `differs` does not count. */
  verdict: 'same' | 'accepted' | 'differs'
  reviewed: string
  note?: string
}

export interface CoverageReport {
  rows: (ChecklistRow & { tests: NamedTest[]; visual: VisualCheck[] })[]
  tested: string[]
  visual: string[]
  neither: string[]
  /** Row IDs named by tests that the checklist does not have. */
  unknown: { id: string; file: string }[]
}

const ROW = /^\|\s*([A-Z]{2}-\d+)\s*\|/
const ROW_ID = /\[([A-Z]{2}-\d+)\]/g

export function checklistRows(markdown: string): ChecklistRow[] {
  return markdown.split(/\r?\n/).flatMap((line) => {
    if (!ROW.test(line)) return []
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim())
    return [{ id: cells[0]!, behavior: cells[1] ?? '', fate: cells[4] ?? '' }]
  })
}

// The first string argument of test(), it(), describe() (with any modifier,
// such as `.skip`, or a conditional one such as `.runIf(cond)`) and the
// parity harness's scenario().
const CALL =
  /\b(?:test|it|describe|scenario)(?:\.\w+(?:\((?:[^()]|\([^()]*\))*\))?)*\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g

export function testNames(source: string) {
  return [...source.matchAll(CALL)].map((match) => match[2]!)
}

const rowIds = (name: string) => [...name.matchAll(ROW_ID)].map((m) => m[1]!)

export function coverageReport({
  checklist,
  tests,
  visualChecks,
}: {
  checklist: string
  tests: NamedTest[]
  visualChecks: VisualCheck[]
}): CoverageReport {
  const rows = checklistRows(checklist).map((row) => ({
    ...row,
    tests: tests.filter(({ name }) => rowIds(name).includes(row.id)),
    visual: visualChecks.filter(
      (check) => check.row === row.id && check.verdict !== 'differs',
    ),
  }))
  const known = new Set(rows.map(({ id }) => id))
  return {
    rows,
    tested: rows.filter((row) => row.tests.length).map(({ id }) => id),
    visual: rows
      .filter((row) => !row.tests.length && row.visual.length)
      .map(({ id }) => id),
    neither: rows
      .filter((row) => !row.tests.length && !row.visual.length)
      .map(({ id }) => id),
    unknown: tests.flatMap(({ file, name }) =>
      rowIds(name)
        .filter((id) => !known.has(id))
        .map((id) => ({ id, file })),
    ),
  }
}

export function renderCoverage(report: CoverageReport) {
  const byId = new Map(report.rows.map((row) => [row.id, row]))
  const lines = [
    '# Checklist coverage',
    '',
    `${report.rows.length} rows: ${report.tested.length} covered by tests, ${report.visual.length} with a recorded visual check, ${report.neither.length} with neither.`,
    '',
    '## Covered by tests',
    '',
  ]
  for (const id of report.tested) {
    lines.push(`- ${id} (${byId.get(id)!.fate})`)
    for (const { file, name } of byId.get(id)!.tests)
      lines.push(`  - ${file} › ${name}`)
  }
  lines.push('', '## Recorded visual checks', '')
  for (const id of report.visual) {
    lines.push(`- ${id} (${byId.get(id)!.fate})`)
    for (const check of byId.get(id)!.visual)
      lines.push(
        `  - ${check.scenario} › ${check.step}: ${check.verdict} (${check.reviewed})${check.note ? `. ${check.note}` : ''}`,
      )
  }
  lines.push('', '## Neither', '')
  for (const id of report.neither)
    lines.push(`- ${id} (${byId.get(id)!.fate}): ${byId.get(id)!.behavior}`)
  if (report.unknown.length) {
    lines.push('', '## Row IDs not in the checklist', '')
    for (const { id, file } of report.unknown) lines.push(`- ${id} in ${file}`)
  }
  return `${lines.join('\n')}\n`
}

function testFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory())
      return entry.name === 'fixtures' ? [] : testFiles(full)
    return entry.name.endsWith('.test.ts') ? [full] : []
  })
}

/** Every named test under `tests/`, with repository-relative paths. */
export function collectTests(root = process.cwd()): NamedTest[] {
  return testFiles(path.join(root, 'tests')).flatMap((file) =>
    testNames(readFileSync(file, 'utf8')).map((name) => ({
      file: path.relative(root, file).split(path.sep).join('/'),
      name,
    })),
  )
}

export const VISUAL_CHECKS = 'tests/parity/visual-checks.json'
export const DEFAULT_CHECKLIST = '.scratch/vue-rewrite/checklist.md'
export const COVERAGE_OUT = '.scratch/parity/coverage.md'

// `yarn parity:coverage [--checklist <file>] [--out <file>] [--json]`
async function main(args: string[]) {
  const option = (name: string) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : undefined
  }
  const checklistFile =
    option('--checklist') ?? process.env.STUDIO_CHECKLIST ?? DEFAULT_CHECKLIST
  if (!existsSync(checklistFile)) {
    console.error(
      `No checklist at ${checklistFile}. Pass --checklist <file> or set STUDIO_CHECKLIST.`,
    )
    process.exit(1)
  }
  const report = coverageReport({
    checklist: readFileSync(checklistFile, 'utf8'),
    tests: collectTests(),
    visualChecks: existsSync(VISUAL_CHECKS)
      ? JSON.parse(readFileSync(VISUAL_CHECKS, 'utf8'))
      : [],
  })
  if (args.includes('--json')) {
    console.log(JSON.stringify(report, null, 2))
    return
  }
  const out = option('--out') ?? COVERAGE_OUT
  mkdirSync(path.dirname(out), { recursive: true })
  writeFileSync(out, renderCoverage(report))
  console.log(renderCoverage(report).split('\n')[2])
  console.log(`Report: ${path.resolve(out)}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  await main(process.argv.slice(2))
