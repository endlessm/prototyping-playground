// Which actions a prototype's menus offer, in the studio's menu groups
// (`app/utils/menus.ts`): reach it (open in a code editor, show in the file
// browser, copy its link or path), change it (rename, duplicate, archive,
// then what other modules add), delete it, last and alone. Locally anyone
// can reach a prototype; only its owner or an Admin changes it. An archived
// prototype offers only Restore and Delete, and nothing to anyone else. The
// file service checks again on every change.

export type PrototypeActionId =
  | 'open'
  | 'reveal'
  | 'copyLink'
  | 'copyPath'
  | 'rename'
  | 'duplicate'
  | 'archive'
  | 'restore'
  | 'delete'

export interface PrototypeMenuContext {
  /** The studio is running locally. */
  local: boolean
  /** You may change the prototype: its owner or an Admin, locally. */
  editable: boolean
  archived: boolean
}

export function prototypeMenu<T>(
  { local, editable, archived }: PrototypeMenuContext,
  item: (id: PrototypeActionId) => T,
  contributed: T[] = [],
): T[][] {
  const ids = (list: (PrototypeActionId | false)[]) =>
    list.filter((id): id is PrototypeActionId => Boolean(id)).map(item)
  const groups = archived
    ? [ids([editable && 'restore']), ids([editable && 'delete'])]
    : [
        ids([
          local && 'open',
          local && 'reveal',
          'copyLink',
          local && 'copyPath',
        ]),
        editable
          ? [...ids(['rename', 'duplicate', 'archive']), ...contributed]
          : [],
        ids([editable && 'delete']),
      ]
  return groups.filter((group) => group.length > 0)
}
