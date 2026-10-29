// Copied Endless Studios components rendered with Vue's server renderer
// through `createStudiosApp`, the factory every preview document uses. The
// modules load through the system's own preview pipeline (its Vue, Nuxt UI,
// auto-imports, `~/` and stand-in aliases), so they compile and resolve as
// they do in a preview document.
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { createServer, type ViteDevServer } from 'vite'
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { previewConfig } from '../../tooling/preview/pipeline.ts'
import { loadSystems } from '../../tooling/systems/registry.ts'

const ROOT = path.resolve(import.meta.dirname, '../..')
const SCREENS = path.join(ROOT, 'tests/fixtures/endless-studios')
const posix = (file: string) => file.split(path.sep).join('/')

type Options = { props?: Record<string, unknown>; system?: unknown }
type Factory = (options: {
  component: unknown
  props?: Record<string, unknown>
  system?: unknown
  ssr?: boolean
}) => unknown

let server: ViteDevServer
let workDir: string
let systemDir: string
let factory: Factory
let renderToString: (app: unknown) => Promise<string>
const warnings: string[] = []
const infos: string[] = []

beforeAll(async () => {
  const config = JSON.parse(
    readFileSync(path.join(ROOT, 'studio.config.json'), 'utf8'),
  )
  const { systems } = await loadSystems(ROOT, config)
  const system = systems.find(({ key }) => key === 'endless-studios')!
  systemDir = system.dir
  // Inside the checkout, so the document's root resolves the studio's packages.
  mkdirSync(path.join(ROOT, '.e2e'), { recursive: true })
  workDir = mkdtempSync(path.join(ROOT, '.e2e', 'es-app-'))
  const preview = await previewConfig(
    { key: system.id, system },
    {
      root: ROOT,
      workDir,
      baseURL: '/',
      prototypesDir: SCREENS,
      views: () => [],
    },
    'serve',
  )
  server = await createServer({
    ...preview,
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false, ws: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    ssr: { noExternal: ['@nuxt/ui'] },
  })
  const app = system.spec.app.factory
  factory = (
    await server.ssrLoadModule(posix(path.join(system.dir, app.from)))
  )[app.name]
  ;({ renderToString } = await server.ssrLoadModule('vue/server-renderer'))
  vi.spyOn(console, 'warn').mockImplementation((...args) => {
    warnings.push(args.join(' '))
  })
  vi.spyOn(console, 'info').mockImplementation((...args) => {
    infos.push(args.map((arg) => JSON.stringify(arg)).join(' '))
  })
}, 120_000)

afterAll(async () => {
  vi.restoreAllMocks()
  await server?.close()
  if (workDir) rmSync(workDir, { recursive: true, force: true })
})

/** A component's file: copied app source (`~/…`) or a test screen. */
const resolve = (file: string) =>
  file.startsWith('~/')
    ? path.join(systemDir, 'studios', file.slice(2))
    : path.join(SCREENS, file)

async function html(file: string, options: Options = {}) {
  const { default: component } = await server.ssrLoadModule(
    posix(resolve(file)),
  )
  return renderToString(factory({ ...options, component, ssr: true }))
}

async function text(file: string, options: Options = {}) {
  return (await html(file, options))
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

describe('the Endless Studios app factory', () => {
  test('[SY-196] [SY-178] the dashboard hero shows the English locale titles', async () => {
    const hero = await text('~/components/Dashboard/Hero.vue', {
      props: { loggedIn: true },
    })
    expect(hero).toMatch(/Embark on a Game-Making/)
    expect(hero).toMatch(/Enter the World of Threadbare/)
  })

  test('[SY-196] [SY-179] signed out, the hero shows the signed-out slide instead of the signed-in one', async () => {
    const hero = await text('~/components/Dashboard/Hero.vue', {
      props: { loggedIn: false },
      system: { user: null },
    })
    expect(hero).toMatch(/A shared space to learn game making/)
    expect(hero).not.toMatch(/Enter the World of Threadbare/)
  })

  test('[SY-196] the onboarding card shows its title and both actions', async () => {
    const card = await text('~/components/Dashboard/OnboardingCard.vue')
    expect(card).toMatch(/Welcome to the Endless Studios Platform!/)
    expect(card).toMatch(/Explore programs/)
    expect(card).toMatch(/I have an access code/)
  })

  test('[SY-196] the program tile renders', async () => {
    expect(await text('~/components/Dashboard/ProgramTileEmpty.vue')).toMatch(
      /Intro unity/,
    )
  })

  test('[SY-196] [SY-178] [SY-173] another locale changes the copy', async () => {
    const english = await text('~/components/Dashboard/OnboardingCard.vue')
    const spanish = await text('~/components/Dashboard/OnboardingCard.vue', {
      system: { locale: 'es' },
    })
    expect(spanish).not.toBe(english)
    expect(spanish).not.toMatch(/Explore programs/)
  })

  test('[SY-179] the sample users answer the app’s role checks, and so does a custom user', async () => {
    const roles = async (user: unknown) =>
      (await text('AuthScreen.vue', { system: { user } })).replace(
        /^.*?User: /,
        '',
      )
    expect(await roles(undefined)).toBe('Ana Roles: loggedIn isAdult')
    expect(await roles('mentor')).toBe('Marco Roles: loggedIn isAdult')
    expect(await roles('admin')).toBe(
      'Alex Roles: loggedIn isAdmin isLeader isAdult',
    )
    expect(await roles(null)).toBe('nobody Roles: none')
    const custom = {
      id: 7,
      username: 'kim',
      first_name: 'Kim',
      last_name: 'Lee',
      email: 'kim@example.org',
      age_category: 'digital_youth',
      roles: [3, 14, 19, 20, 22, 23].map((id) => ({ id })),
    }
    expect(await roles(custom)).toBe(
      'Kim Roles: loggedIn isLeader isEditor isProgramAdmin isProgramManager isInstitutionAdmin isCohortAdmin isMinor',
    )
  })

  test('[SY-179] sign-in, sign-up and sign-out requests are logged, and the chosen user stays', async () => {
    infos.length = 0
    expect(await text('AuthScreen.vue')).toContain('User: Ana')
    expect(infos.join('\n')).toMatch(/login requested/)
    expect(infos.join('\n')).toMatch(/logout requested/)
    expect(infos).toContain('"[Endless Studios] navigate to" "/signup/"')
  })

  test('[SY-180] the sample’s getters, mutations and actions run over the app’s initial state', async () => {
    const sample = {
      getters: { programCount: 1 },
      mutations: {
        SET_NOTIFICATIONS: (state: Record<string, unknown>, count: unknown) => {
          state.systemNotificationCount = count
        },
      },
      actions: {
        loadPrograms: (
          { state }: { state: { user: Record<string, unknown> } },
          names: unknown,
        ) => {
          state.user.individualPrograms = names
        },
      },
    }
    const screen = await text('StoreSampleScreen.vue', { system: { sample } })
    expect(screen).toContain('Notifications: 3')
    expect(screen).toContain('Programs: Intro to Godot')
    // From the app's initial state, which the sample doesn't mention.
    expect(screen).toContain('Admin for: 0')
    expect(screen).toContain('Getter: 1')
  })

  test('[SY-181] GraphQL answers from sample responses by operation name, with the query’s own options', async () => {
    warnings.length = 0
    const sample = {
      queries: {
        Program: (variables: Record<string, unknown>) => ({
          program: { name: `Program ${String(variables.id)}` },
        }),
        Rename: { rename: 'renamed' },
      },
    }
    const signedIn = await text('GraphQLScreen.vue', { system: { sample } })
    expect(signedIn).toContain('Program: Program 4')
    expect(signedIn).toContain('Raw: Program 5')
    expect(signedIn).toContain('Transformed: PROGRAM 6')
    expect(signedIn).toContain('Skipped: skipped')
    expect(signedIn).toContain('Member: Program 8')
    expect(signedIn).toContain('Guest: guests only')
    expect(signedIn).toContain('Requested: Program 10')
    expect(signedIn).toContain('Mutated: renamed')
    const signedOut = await text('GraphQLScreen.vue', {
      system: { sample, user: null },
    })
    expect(signedOut).toContain('Member: members only')
    expect(signedOut).toContain('Guest: Program 9')
    // Subscriptions emit nothing and graphql-request's client isn't stood in;
    // each is reported once.
    expect(
      warnings.filter((line) => line.includes('subscriptions')),
    ).toHaveLength(1)
    expect(
      warnings.filter((line) => line.includes('GraphQLClient')),
    ).toHaveLength(1)
  })

  test('[SY-182] a streaming query gives one page of sample items and no more, and nothing when signed out', async () => {
    const sample = {
      queries: {
        Games: (variables: Record<string, unknown>) => ({
          games: [
            { id: 1, title: `Pong (limit ${String(variables.limit)})` },
            { id: 2, title: `Snake (offset ${String(variables.offset)})` },
          ],
        }),
      },
    }
    const screen = await text('StreamingScreen.vue', { system: { sample } })
    expect(screen).toContain('Games: Pong (limit 2), Snake (offset 0)')
    expect(screen).toContain('More: no')
    const signedOut = await text('StreamingScreen.vue', {
      system: { sample, user: null },
    })
    expect(signedOut).toContain('Games: none')
  })

  test('[SY-183] dates, shared state, profile pictures, the unread count, backend errors, the infinite list and app constants work in the screen’s locale', async () => {
    infos.length = 0
    const english = await text('HelpersScreen.vue')
    expect(english).toContain('Date: November 4, 2026')
    expect(english).toContain('Ago: 2 days ago')
    expect(english).toContain('Visits: 2')
    expect(english).toContain('Picture: default me.png')
    expect(english).toContain('Unread: 0')
    expect(english).toContain('Dashboard: /leader/dashboard/')
    expect(english).toContain('Seen: true')
    expect(english).toContain('Game Pong')
    expect(english).toContain('No games')
    expect(infos.join('\n')).toMatch(/error toast:.*Server down/)
    // A new screen starts its own shared state.
    const spanish = await text('HelpersScreen.vue', {
      system: {
        locale: 'es',
        sample: {
          queries: {
            NOTIFICATIONS_COUNT: {
              getUnreadNotificationsCount: { unread_notifications_count: 4 },
            },
          },
        },
      },
    })
    expect(spanish).toContain('Date: noviembre 4, 2026')
    expect(spanish).toContain('Ago: hace 2 días')
    expect(spanish).toContain('Visits: 2')
    expect(spanish).toContain('Unread: 4')
  })

  test('[SY-177] [SY-178] [SY-179] [SY-180] [SY-181] [SY-183] the stand-ins never resolve to the studio’s own Nuxt runtime', async () => {
    for (const screen of [
      'AuthScreen.vue',
      'GraphQLScreen.vue',
      'HelpersScreen.vue',
      'NavigationScreen.vue',
      'StoreSampleScreen.vue',
      'StreamingScreen.vue',
      'TranslationScreen.vue',
    ])
      await html(screen)
    const loaded = [...server.moduleGraph.idToModuleMap.keys()].map((id) =>
      posix(id),
    )
    expect(loaded.some((id) => id.includes('/runtime/nuxt-app.ts'))).toBe(true)
    const studio = posix(ROOT)
    expect(
      loaded.filter(
        (id) =>
          /\/node_modules\/(nuxt|@nuxt\/kit|@nuxtjs\/[^/]+|vue-router|vuex|vue-i18n|graphql-request)\//.test(
            id,
          ) ||
          id.startsWith(`${studio}/.nuxt`) ||
          id.startsWith(`${studio}/app/`) ||
          /^(#app|#imports)/.test(id),
      ),
    ).toEqual([])
  })

  test('[SY-178] translations follow the app’s message syntax, with English as the fallback', async () => {
    const english = await text('TranslationScreen.vue')
    expect(english).toContain('Named: Learners with 100+ XP')
    expect(english).toContain('One: 1 Learner')
    expect(english).toContain('Many: 5 Learners')
    expect(english).toContain(
      "Literal: User name can't contain: !,%,@,#,$,^,*,?,~",
    )
    expect(english).toContain('Fallback: 2 users')
    expect(english).toContain('Known: true false')
    expect(english).toContain('Messages: string')
    const spanish = await text('TranslationScreen.vue', {
      system: { locale: 'es' },
    })
    expect(spanish).toContain('Many: 5 Estudiantes')
    expect(spanish).toContain('Fallback: 2 users')
  })

  test('[SY-178] [SY-185] an unknown locale is reported once and the screen shows English', async () => {
    warnings.length = 0
    const screen = await text('TranslationScreen.vue', {
      system: { locale: 'fr' },
    })
    await text('TranslationScreen.vue', { system: { locale: 'fr' } })
    expect(screen).toContain('Many: 5 Learners')
    expect(warnings.filter((line) => line.includes('"fr"'))).toHaveLength(1)
  })

  test('[SY-196] [SY-181] upcoming events renders from a sample query response, and is empty without one', async () => {
    const sample = {
      queries: {
        UpcomingEventInstances: {
          upcomingEventInstances: [
            {
              id: 1,
              title: 'Game jam kickoff',
              start: '2026-11-04T15:00:00Z',
              event: { id: 9 },
            },
          ],
        },
      },
    }
    const events = await text('~/components/Dashboard/UpcomingEvents.vue', {
      system: { sample },
    })
    expect(events).toMatch(/Upcoming Events/)
    expect(events).toMatch(/Game jam kickoff/)
    expect(await text('~/components/Dashboard/UpcomingEvents.vue')).toMatch(
      /No Upcoming Events/,
    )
  })

  test('[SY-196] [SY-180] [SY-185] seeded store state renders; unknown actions, unmocked queries and missing keys fail softly, once', async () => {
    warnings.length = 0
    const options = {
      system: {
        sample: {
          state: {
            systemNotificationCount: 7,
            user: { completedOnboarding: false },
          },
        },
      },
    }
    const screen = await text('StoreScreen.vue', options)
    await text('StoreScreen.vue', options)
    expect(screen).toMatch(/Notifications: 7/)
    expect(screen).toMatch(/Onboarding done: no/)
    expect(screen).toMatch(/Unmocked: 0/)
    expect(screen).toMatch(/no_such\.key/)
    for (const gap of [
      'triggerSystemNotifications',
      'OPEN_MODAL',
      'Unmocked',
      'no_such.key',
    ])
      expect(
        warnings.filter((line) => line.includes(gap)),
        `${gap} is reported once`,
      ).toHaveLength(1)
  })

  test('[SY-177] router calls, navigateTo and <NuxtLink> log their destination instead of leaving the screen', async () => {
    infos.length = 0
    const screen = await html('NavigationScreen.vue')
    expect(screen).toMatch(/<a href="\/explore\/"[^>]*>Explore<\/a>/)
    expect(screen).toMatch(/Route: \//)
    expect(infos).toContain('"[Endless Studios] navigate to" "/programs/"')
    expect(infos).toContain(
      '"[Endless Studios] navigate to" {"path":"/profile/ana.learner/"}',
    )
  })

  test('[SY-196] [SY-179] [SY-173] the profile card shows the chosen sample user, and signed out shows login instead', async () => {
    expect(await text('ProfileScreen.vue')).toMatch(/ana\.learner/)
    expect(
      await text('ProfileScreen.vue', { system: { user: 'mentor' } }),
    ).toMatch(/marco\.mentor/)
    expect(
      await text('ProfileScreen.vue', { system: { user: 'admin' } }),
    ).toMatch(/alex\.admin/)
    const signedOut = await text('ProfileScreen.vue', {
      system: { user: null },
    })
    expect(signedOut).not.toMatch(/ana\.learner|Edit profile/)
    expect(signedOut).toMatch(/Log ?in/i)
  })
})
