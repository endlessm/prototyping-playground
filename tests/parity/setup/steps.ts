import { appendFileSync } from 'node:fs'
import path from 'node:path'
import type { StepRecord } from '../../../tooling/parity/report'

/** Each run's screenshots and failures, one JSON line each, read into the report. */
export const STEPS = 'steps.jsonl'

export function record(run: string, entry: StepRecord) {
  appendFileSync(path.join(run, STEPS), `${JSON.stringify(entry)}\n`)
}
