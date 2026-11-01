import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The welcome opens for a contributor whose profile hasn't seen it yet:
// Bernardo's flag is set back to false for the scenario, then the profile
// is put back exactly as it was. The steps differ by design (the Endless
// welcome is shorter); the pairs compare the dialog's frame, controls,
// illustrations and the second step's tabs, also in dark mode.
scenario(
  '[SH-130] [SH-131] [SH-132] The welcome on a first visit',
  async ({ page, url, root, step: save }) => {
    // Screenshots after the dialog has finished fading in and changing
    // step, with the pointer off its buttons.
    const step = async (name: string) => {
      await page.mouse.move(1, 899)
      // A looping animation elsewhere never ends: give up after 5 s.
      await page
        .waitForFunction(
          () =>
            document
              .getAnimations()
              .every((animation) => animation.playState !== 'running'),
          undefined,
          { timeout: 5_000 },
        )
        .catch(() => undefined)
      await save(name)
    }
    const file = path.join(root, 'contributors', 'bernardo.json')
    const original = readFileSync(file, 'utf8')
    const profile = JSON.parse(original)
    profile.preferences.onboarding = { welcomeDismissed: false }
    writeFileSync(file, `${JSON.stringify(profile, null, 2)}\n`)
    try {
      await page.goto(url)
      const dialog = page.getByRole('dialog')
      await expect
        .poll(() => dialog.isVisible(), { timeout: 120_000 })
        .toBe(true)
      await step('The first step')
      await page.getByRole('button', { name: 'Show me around' }).click()
      await expect
        .poll(() => page.getByRole('button', { name: 'Back' }).isVisible())
        .toBe(true)
      await step('The second step')
      // Its tabs: React's "Make it yours" and the Endless Studios step both
      // have Theme & components, Context and Skills.
      for (const tab of ['Context', 'Skills']) {
        await dialog.getByRole('button', { name: tab, exact: true }).click()
        await expect
          .poll(() =>
            dialog
              .getByRole('button', { name: tab, exact: true })
              .getAttribute('aria-pressed'),
          )
          .toBe('true')
        await step(`The second step, ${tab}`)
      }
      await page.emulateMedia({ colorScheme: 'dark' })
      await step('The second step in dark mode')
      await page.emulateMedia({ colorScheme: 'light' })
      const next = page.getByRole('button', { name: 'Next', exact: true })
      while (await next.count()) await next.click()
      await expect
        .poll(() =>
          page.getByRole('button', { name: 'Explore my studio' }).isVisible(),
        )
        .toBe(true)
      await step('The last step')
      await page.getByRole('button', { name: 'Explore my studio' }).click()
      await expect.poll(() => dialog.count()).toBe(0)
      await step('Home after the welcome')
    } finally {
      writeFileSync(file, original)
    }
  },
)
