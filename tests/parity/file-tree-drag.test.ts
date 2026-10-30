import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixture Tree (tests/fixtures/parity): Home, and Details and
// sign-in in a folder "flows". The new studio runs on the committed
// fixtures, so each drag here is shown and then let go on the row it
// started from, where nothing is dropped: nothing moves. Dropping,
// Alt+arrows and repairing links are the browser scenarios'
// (tests/e2e/file-tree-moves.test.ts). Arranging needs someone who may
// change the prototype: Bernardo, its owner, as the GitHub CLI resolves
// him on this computer.
const TREE = 'tree000000000001'
const HOME = 'vtrhme0000000001'

scenario(
  '[SH-83] [PR-57] dragging in the file tree: a line where the row will land, a folder highlighted',
  async ({ page, url, step }) => {
    const link = (name: string) => page.getByRole('link', { name, exact: true })
    await page.goto(`${url}prototypes/${TREE}/artifacts/${HOME}`)
    await expect
      .poll(() => link('Details').isVisible(), { timeout: 120_000 })
      .toBe(true)
    // Until the dev server's file service answers, the tree is read-only.
    await page.waitForTimeout(3_000)

    const box = async (name: string) =>
      (await page.getByText(name, { exact: true }).first().boundingBox())!
    const middle = (where: {
      x: number
      y: number
      width: number
      height: number
    }) => [where.x + where.width / 2, where.y + where.height / 2] as const

    /** Drags `name` to a spot, takes the step, and lets go where it began. */
    async function show(
      name: string,
      to: readonly [number, number],
      title: string,
    ) {
      const start = middle(await box(name))
      await page.mouse.move(...start)
      await page.mouse.down()
      await page.mouse.move(...to, { steps: 10 })
      await page.waitForTimeout(300)
      await step(title)
      await page.mouse.move(...start, { steps: 10 })
      await page.mouse.up()
    }

    const home = await box('Home')
    await show(
      'Details',
      [home.x + home.width / 2, home.y + 1],
      'Dragging Details to the top edge of Home: a line above it',
    )
    await show(
      'Home',
      middle(await box('Flows')),
      'Dragging Home onto the folder Flows: the folder highlights',
    )
    await expect.poll(() => link('Details').isVisible()).toBe(true)
    await expect.poll(() => link('Home').isVisible()).toBe(true)
  },
)
