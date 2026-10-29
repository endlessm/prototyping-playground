import { expect } from 'vitest'
import { scenario } from './setup/scenario'

// The parity fixture Screens (tests/fixtures/parity), in Endless Studios: a
// dashboard of copied app components whose states change the locale, the
// signed-in user and the sample data. The new studio declares them as the
// view's and states' `system`; the React studio passes them to VueScreen.
const SCREENS = 'screens000000001'
const DASHBOARD = 'vdashbard0000001'
const SPANISH = 'sspan00000000001'
const SIGNED_OUT = 'ssgnd00000000001'
const NO_EVENTS = 'snevents00000001'

scenario(
  '[SY-173] [SY-178] [SY-179] [SY-181] an Endless Studios screen with its locale, user and sample data per state',
  async ({ page, url, step }) => {
    const address = (id: string) =>
      `${url}prototypes/${SCREENS}/artifacts/${id}`
    const view = page.locator('iframe').first().contentFrame()
    const sees = (text: string | RegExp, timeout = 60_000) =>
      expect
        .poll(() => view.getByText(text).first().isVisible(), { timeout })
        .toBe(true)

    await page.goto(address(DASHBOARD))
    await sees('Welcome Back!', 120_000)
    await sees('alex.admin')
    await sees('Game jam kickoff')
    await step('The view’s own options: an admin, in English, with events')

    await page.goto(address(SPANISH))
    await sees('¡Bienvenido de nuevo!')
    await sees('ana.learner')
    await sees('Game jam kickoff')
    await step('A state in Spanish, signed in as the learner')

    await page.goto(address(SIGNED_OUT))
    await sees('Welcome Back!')
    await expect
      .poll(() => view.getByRole('button', { name: /log ?in/i }).isVisible())
      .toBe(true)
    await step('A state signed out')

    await page.goto(address(NO_EVENTS))
    await sees('No Upcoming Events')
    await sees('alex.admin')
    await step('A state with no sample events')
  },
)
