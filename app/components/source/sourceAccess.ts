// What the source editor needs from the page that opens it: reading and
// saving one file. The caller decides where the file is; the server decides
// who may save it, and says why not.

export interface SourceFile {
  /** Where the file is, from the studio's root. */
  path: string
  content: string
  /** Changes whenever the content does. */
  version: string
  editable: boolean
  /** Why it can't be saved. */
  reason?: string
}

export interface SourceAccess {
  read: () => Promise<SourceFile>
  /** Saves over version `base`; fails with code `changed` if it moved on. */
  write: (
    content: string,
    base: string,
  ) => Promise<{ version: string; warnings: string[] }>
}
