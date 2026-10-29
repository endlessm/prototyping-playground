import { defineConfig } from 'vitest/config'

// `yarn parity [scenario file filter]`: the parity scenarios against the new
// studio and the React studio on `main`. Not part of `yarn test:full`: it
// copies and installs the React studio and runs both dev servers.
export default defineConfig({
  test: {
    name: 'parity',
    include: ['tests/parity/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['tests/parity/setup/global.ts'],
    // Installing the React studio and starting both studios cold take
    // minutes on Windows.
    hookTimeout: 900_000,
    testTimeout: 180_000,
    // Each scenario runs against both studios, one at a time.
    fileParallelism: false,
  },
})
