// Which actions a system's "…" menu offers, in the studio's menu groups
// (`app/utils/menus.ts`), as the prototype menu: reach it (open in a code
// editor, show in the file browser, copy its link or path), change it
// (rename, set as default, archive), delete it, last and alone. Locally a
// registered contributor reaches a system; Admins and its maintainers
// rename it; Admins make it the default, archive and delete it. An
// archived system offers Admins only Restore and Delete. The dev server
// checks again on every change.

export type SystemActionId =
  | 'open'
  | 'reveal'
  | 'copyLink'
  | 'copyPath'
  | 'rename'
  | 'setDefault'
  /** On the default system: "Default system", disabled. */
  | 'isDefault'
  | 'archive'
  | 'restore'
  | 'delete'

export interface SystemMenuContext {
  /** The studio runs locally and you are a registered contributor. */
  local: boolean
  admin: boolean
  /** An Admin or one of the system's maintainers. */
  maintainer: boolean
  archived: boolean
  isDefault: boolean
}

export function systemMenu<T>(
  { local, admin, maintainer, archived, isDefault }: SystemMenuContext,
  item: (id: SystemActionId) => T,
): T[][] {
  const ids = (list: (SystemActionId | false)[]) =>
    list.filter((id): id is SystemActionId => Boolean(id)).map(item)
  const manage = local && admin
  const groups = archived
    ? [ids([manage && 'restore']), ids([manage && 'delete'])]
    : [
        ids([
          local && 'open',
          local && 'reveal',
          'copyLink',
          local && 'copyPath',
        ]),
        ids([
          local && maintainer && 'rename',
          manage && (isDefault ? 'isDefault' : 'setDefault'),
          manage && 'archive',
        ]),
        ids([manage && 'delete']),
      ]
  return groups.filter((group) => group.length > 0)
}
