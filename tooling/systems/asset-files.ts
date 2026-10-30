// Where a system's asset files are served: the files of its asset pages
// (its `assets/` folder and the copied app's images) at
// `<base>_system-assets/<systemId>/<file inside the system's folder>`. The
// development server answers from the folder; the build publishes only these
// files, for active systems. Plain, so the studio's pages can import it.
export const SYSTEM_ASSETS_ROUTE = '_system-assets/'

/** The address of one of a system's asset files. */
export const assetUrl = (base: string, systemId: string, file: string) =>
  `${base}${SYSTEM_ASSETS_ROUTE}${systemId}/${file
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`
