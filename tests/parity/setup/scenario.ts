// A parity scenario: one script, driven by accessible roles and names, run
// against each studio. `step(name)` saves a screenshot for the report.
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { chromium, type Browser, type Page } from 'playwright'
import { afterAll, beforeAll, describe, inject, test } from 'vitest'
import type { Side } from '../../../tooling/parity/fixtures'
import { record } from './steps'

export interface ScenarioContext {
  page: Page
  /** The studio's Home, ending in a slash. */
  url: string
  side: Side
  /** The studio's folder, for scenarios that change its files. */
  root: string
  /** Saves a full-page screenshot of what is on screen now. */
  step: (name: string) => Promise<void>
}

const SIDE_NAMES: Record<Side, string> = {
  vue: 'new studio',
  react: 'React studio',
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/\[[a-z]{2}-\d+\]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Name a scenario after the checklist rows it covers, for example
 * `[PR-21] opening a prototype’s view`.
 */
export function scenario(
  name: string,
  run: (context: ScenarioContext) => Promise<void>,
) {
  describe(name, () => {
    const parity = inject('parity')
    let browser: Browser | undefined
    beforeAll(async () => {
      browser = await chromium.launch({ headless: true })
    })
    afterAll(async () => {
      await browser?.close()
    })

    for (const side of ['vue', 'react'] as const) {
      const studio = parity.studios[side]
      test.skipIf(!studio)(SIDE_NAMES[side], async () => {
        // The same window and preferences for both studios.
        const context = await browser!.newContext({
          viewport: { width: 1440, height: 900 },
          colorScheme: 'light',
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()
        const folder = slug(name)
        mkdirSync(path.join(parity.run, folder), { recursive: true })
        let index = 0
        const step = async (stepName: string) => {
          index += 1
          await page.evaluate(() => document.fonts.ready)
          const image = `${folder}/${String(index).padStart(2, '0')}-${slug(stepName)}.${side}.png`
          await page.screenshot({
            path: path.join(parity.run, image),
            fullPage: true,
          })
          record(parity.run, {
            scenario: name,
            side,
            index,
            step: stepName,
            image,
          })
        }
        try {
          await run({ page, url: studio!.url, root: studio!.root, side, step })
        } catch (error) {
          record(parity.run, {
            scenario: name,
            side,
            error: (error as Error).message,
          })
          await page
            .screenshot({
              path: path.join(parity.run, folder, `failed.${side}.png`),
            })
            .catch(() => {})
          throw error
        } finally {
          await context.close()
        }
      })
    }
  })
}
