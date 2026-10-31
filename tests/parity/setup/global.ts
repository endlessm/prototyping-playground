// Starts both studios once for the whole parity run, and writes the report
// when it ends. Only the servers started here are stopped here.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { TestProject } from 'vitest/node'
import type { Side } from '../../../tooling/parity/fixtures'
import {
  prepareReactStudio,
  startReactStudio,
} from '../../../tooling/parity/react-studio'
import {
  renderParityReport,
  type StepRecord,
} from '../../../tooling/parity/report'
import { freePort, startDevServer } from '../../e2e/setup/studio'
import { STEPS } from './steps'

export interface ParityStudio {
  url: string
  label: string
  /** The studio's folder, for scenarios that change its files. */
  root: string
}

declare module 'vitest' {
  export interface ProvidedContext {
    parity: { run: string; studios: Partial<Record<Side, ParityStudio>> }
  }
}

export default async function setup(project: TestProject) {
  const started = new Date().toISOString()
  const run = path.resolve(
    process.env.STUDIO_PARITY_OUT ??
      path.join('.scratch/parity/runs', started.replace(/[:.]/g, '-')),
  )
  mkdirSync(run, { recursive: true })
  const ref = process.env.STUDIO_PARITY_REF ?? 'main'
  const sides = (process.env.STUDIO_PARITY_SIDES ?? 'vue,react')
    .split(',')
    .map((side) => side.trim())

  const stops: (() => Promise<void>)[] = []
  const studios: Partial<Record<Side, ParityStudio>> = {}
  const starts = await Promise.allSettled([
    sides.includes('vue') &&
      startDevServer({ STUDIO_PROTOTYPES: 'tests/fixtures/parity/vue' }).then(
        (studio) => {
          stops.push(studio.stop)
          studios.vue = {
            url: studio.url,
            label: `this checkout, ${studio.url}`,
            root: process.cwd(),
          }
        },
      ),
    sides.includes('react') &&
      prepareReactStudio({ ref })
        .then(async (copy) =>
          startReactStudio(copy, { port: await freePort() }),
        )
        .then((studio) => {
          stops.push(studio.stop)
          studios.react = {
            url: studio.url,
            label: `${ref} at ${studio.commit.slice(0, 8)}, ${studio.url}, copied to ${studio.root}`,
            root: studio.root,
          }
        }),
  ])
  const stopAll = () => Promise.all(stops.map((stop) => stop()))
  const failed = starts.find((start) => start.status === 'rejected')
  if (failed) {
    await stopAll()
    throw failed.reason
  }
  project.provide('parity', { run, studios })

  return async () => {
    await stopAll()
    const file = path.join(run, STEPS)
    const records: StepRecord[] = existsSync(file)
      ? readFileSync(file, 'utf8')
          .split('\n')
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : []
    const report = path.join(run, 'index.html')
    writeFileSync(
      report,
      renderParityReport({
        started,
        sides: {
          vue: studios.vue?.label ?? 'not run',
          react: studios.react?.label ?? 'not run',
        },
        records,
      }),
    )
    console.log(`Parity report: ${report}`)
  }
}
