// Shared rules for the studio's menus (dropdown and right-click menus).

/**
 * Arranges a menu's items into groups, with a divider between groups. Items
 * that don't apply (`false`, `null`, `undefined`) are dropped, then groups
 * with nothing left. Groups are never merged, so every menu lists the same
 * kinds of group in the same order: create here, reach it (view source, open
 * in editor, reveal, copy link or path), change it (lo-fi or hi-fi, type
 * actions, rename), then delete, last and alone.
 */
export function menuGroups<T>(
  groups: (T | false | null | undefined)[][],
): T[][] {
  return groups
    .map((group) => group.filter((item): item is T => Boolean(item)))
    .filter((group) => group.length > 0)
}

/**
 * Wraps a menu action so it runs once the menu has closed, and a dialog or
 * name field it opens isn't dismissed by the same click. A failure is
 * reported with its message.
 */
export function afterMenuCloses(
  action: () => unknown,
  failed: (message: string) => void,
) {
  return () => {
    setTimeout(async () => {
      try {
        await action()
      } catch (error) {
        failed(error instanceof Error ? error.message : String(error))
      }
    }, 0)
  }
}
