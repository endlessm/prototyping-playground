import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'integration',
          include: ['tests/integration/**/*.test.ts'],
          environment: 'node',
          testTimeout: 60_000,
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.ts'],
          environment: 'node',
          // Building the static site and starting Nuxt cold take minutes on
          // Windows.
          hookTimeout: 600_000,
          testTimeout: 60_000,
          // A cold page takes seconds to load on Windows, so waits for an address,
          // a title or an element get 15 s instead of Vitest's 1 s default.
          expect: { poll: { timeout: 15_000 } },
          // The scenarios share the dev server and the static build.
          fileParallelism: false,
        },
      },
    ],
  },
})
