// A version's changes against the app's original: a line-by-line diff of
// two texts, grouped in hunks with a few lines of context around each
// change, and the same hunks written as a unified patch `git apply` takes.
// Both texts come in with Unix line endings and without the studio's
// markers (`withoutStudioMarkers`), so only real changes show. Plain
// functions, run in the browser.

/** One line of a hunk: kept, removed from the original or added. */
export interface ChangeLine {
  kind: 'same' | 'removed' | 'added'
  text: string
  /** Its number in the original; null for an added line. */
  before: number | null
  /** Its number in the version; null for a removed line. */
  after: number | null
}

/** A run of changes with its context, as a patch's `@@` section. */
export interface ChangeHunk {
  /** First line in the original (1-based); the line before it when empty. */
  beforeStart: number
  beforeCount: number
  afterStart: number
  afterCount: number
  lines: ChangeLine[]
}

export interface Changes {
  hunks: ChangeHunk[]
  added: number
  removed: number
  /** Whether the original's last line ends without a line break. */
  beforeOpenEnd: boolean
  afterOpenEnd: boolean
  beforeLines: number
  afterLines: number
}

/** Lines of context around each change, as `git diff` keeps. */
export const CONTEXT_LINES = 3

function linesOf(text: string) {
  if (!text) return { lines: [] as string[], openEnd: false }
  const lines = text.split('\n')
  const openEnd = lines.at(-1) !== ''
  if (!openEnd) lines.pop()
  return { lines, openEnd }
}

type Step = Pick<ChangeLine, 'kind' | 'text'>

const MAX_TABLE = 16_000_000

// The shortest edit between two line lists: common ends first, then the
// longest common subsequence of what is left.
function steps(before: string[], after: string[]): Step[] {
  let head = 0
  while (
    head < before.length &&
    head < after.length &&
    before[head] === after[head]
  )
    head++
  let tail = 0
  while (
    tail < before.length - head &&
    tail < after.length - head &&
    before[before.length - 1 - tail] === after[after.length - 1 - tail]
  )
    tail++
  const a = before.slice(head, before.length - tail)
  const b = after.slice(head, after.length - tail)
  const ends = (list: string[], kind: Step['kind']) =>
    list.map((text) => ({ kind, text }))
  // Past this size the table would take too much memory: the middle shows
  // as replaced whole.
  if (a.length * b.length > MAX_TABLE)
    return [
      ...ends(before.slice(0, head), 'same'),
      ...ends(a, 'removed'),
      ...ends(b, 'added'),
      ...ends(before.slice(before.length - tail), 'same'),
    ]
  const width = b.length + 1
  const common = new Uint32Array((a.length + 1) * width)
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      common[i * width + j] =
        a[i] === b[j]
          ? common[(i + 1) * width + j + 1]! + 1
          : Math.max(common[(i + 1) * width + j]!, common[i * width + j + 1]!)
  const middle: Step[] = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      middle.push({ kind: 'same', text: a[i++]! })
      j++
    } else if (
      j < b.length &&
      (i === a.length ||
        common[i * width + j + 1]! >= common[(i + 1) * width + j]!)
    )
      middle.push({ kind: 'added', text: b[j++]! })
    else middle.push({ kind: 'removed', text: a[i++]! })
  }
  // Removals before additions within each run of changes, as patches read.
  const ordered: Step[] = []
  let run: Step[] = []
  const flush = () => {
    ordered.push(
      ...run.filter(({ kind }) => kind === 'removed'),
      ...run.filter(({ kind }) => kind === 'added'),
    )
    run = []
  }
  for (const step of middle) {
    if (step.kind === 'same') {
      flush()
      ordered.push(step)
    } else run.push(step)
  }
  flush()
  return [
    ...ends(before.slice(0, head), 'same'),
    ...ordered,
    ...ends(before.slice(before.length - tail), 'same'),
  ]
}

// A last line without a line break differs from the same line with one.
const OPEN_END = '\u0000'

/** What changed from `before` (the original) to `after` (the version). */
export function changesBetween(before: string, after: string): Changes {
  const from = linesOf(before)
  const to = linesOf(after)
  const mark = (lines: string[], openEnd: boolean) =>
    openEnd ? [...lines.slice(0, -1), `${lines.at(-1)}${OPEN_END}`] : lines
  const numbered: ChangeLine[] = []
  let beforeLine = 0
  let afterLine = 0
  for (const step of steps(
    mark(from.lines, from.openEnd),
    mark(to.lines, to.openEnd),
  )) {
    const text = step.text.replace(OPEN_END, '')
    if (step.kind === 'same')
      numbered.push({ ...step, text, before: ++beforeLine, after: ++afterLine })
    else if (step.kind === 'removed')
      numbered.push({ ...step, text, before: ++beforeLine, after: null })
    else numbered.push({ ...step, text, before: null, after: ++afterLine })
  }

  const hunks: ChangeHunk[] = []
  let index = 0
  while (index < numbered.length) {
    if (numbered[index]!.kind === 'same') {
      index++
      continue
    }
    const start = Math.max(0, index - CONTEXT_LINES)
    let end = index
    // Changes closer than twice the context share a hunk.
    while (end < numbered.length) {
      let next = end
      while (next < numbered.length && numbered[next]!.kind !== 'same') next++
      let gap = next
      while (gap < numbered.length && numbered[gap]!.kind === 'same') gap++
      end = next
      if (gap < numbered.length && gap - next <= CONTEXT_LINES * 2) end = gap
      else break
    }
    const stop = Math.min(numbered.length, end + CONTEXT_LINES)
    const lines = numbered.slice(start, stop)
    const beforeCount = lines.filter(({ kind }) => kind !== 'added').length
    const afterCount = lines.filter(({ kind }) => kind !== 'removed').length
    const firstBefore = lines.find(({ before }) => before !== null)?.before
    const firstAfter = lines.find(({ after }) => after !== null)?.after
    hunks.push({
      // An empty side starts at the line before it, as unified diffs count.
      beforeStart: firstBefore ?? lineBefore(numbered, start, 'before'),
      beforeCount,
      afterStart: firstAfter ?? lineBefore(numbered, start, 'after'),
      afterCount,
      lines,
    })
    index = stop
  }

  return {
    hunks,
    added: numbered.filter(({ kind }) => kind === 'added').length,
    removed: numbered.filter(({ kind }) => kind === 'removed').length,
    beforeOpenEnd: from.openEnd,
    afterOpenEnd: to.openEnd,
    beforeLines: from.lines.length,
    afterLines: to.lines.length,
  }
}

function lineBefore(
  lines: ChangeLine[],
  index: number,
  side: 'before' | 'after',
) {
  for (let at = index - 1; at >= 0; at--) {
    const value = lines[at]![side]
    if (value !== null) return value
  }
  return 0
}

const range = (start: number, count: number) =>
  count === 1 ? `${start}` : `${start},${count}`

/** A hunk's `@@ -a,b +c,d @@` line. */
export const hunkHeader = (hunk: ChangeHunk) =>
  `@@ -${range(hunk.beforeStart, hunk.beforeCount)} +${range(hunk.afterStart, hunk.afterCount)} @@`

const NO_NEWLINE = '\\ No newline at end of file'

/**
 * The changes as a unified patch for the file at `path` in the app's
 * repository (`frontend/app/…`), applied from its root with `git apply`;
 * empty when nothing changed.
 */
export function unifiedPatch(changes: Changes, path: string) {
  if (!changes.hunks.length) return ''
  const out = [
    `diff --git a/${path} b/${path}`,
    `--- a/${path}`,
    `+++ b/${path}`,
  ]
  for (const hunk of changes.hunks) {
    out.push(hunkHeader(hunk))
    for (const line of hunk.lines) {
      const sign =
        line.kind === 'same' ? ' ' : line.kind === 'removed' ? '-' : '+'
      out.push(`${sign}${line.text}`)
      const lastBefore =
        line.before === changes.beforeLines && changes.beforeOpenEnd
      const lastAfter =
        line.after === changes.afterLines && changes.afterOpenEnd
      if (
        (line.kind === 'removed' && lastBefore) ||
        (line.kind === 'added' && lastAfter) ||
        (line.kind === 'same' && (lastBefore || lastAfter))
      )
        out.push(NO_NEWLINE)
    }
  }
  return `${out.join('\n')}\n`
}

/** The file name at the end of a path. */
export const fileNameOf = (path: string) => path.split('/').at(-1) ?? path
