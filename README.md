# Endless Design Studio

A prototyping sandbox for the Endless team: interactive prototypes built from Endless Studios' own screens, with documents, diagrams and canvases alongside, made with coding agents.

This branch is the rewrite of the studio in Nuxt and Vue ([ADR 0003](docs/adr/0003-rewrite-in-vue-as-an-independent-studio.md)). The React studio it replaces is on `main`.

## Run it

You need Node 22.18 or later in the 22 line (`mise install` reads `mise.toml`) and corepack (`corepack enable`), which provides yarn 4.

```sh
yarn install
yarn dev
```

## Check it

```sh
yarn lint
yarn format:check
yarn typecheck
yarn test        # unit and integration tests
yarn test:full   # every test, including the browser scenarios
yarn parity      # the parity scenarios against this studio and the React studio on main
yarn build       # the static site, in .output/public
yarn preview     # serve the static site locally
yarn build:inspect
```

Set `STUDIO_BASE_PATH` (for example `/studio/`) when building a site that is served under a sub-path, and `STUDIO_PUBLIC_URL` for its public address.

## License

[MIT](LICENSE).
