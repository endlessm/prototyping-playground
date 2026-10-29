// The order of the modules' blocks on Home. Locally your own work comes
// first; on the deployed site, what colleagues come for.

export interface HomeBlockOrder {
  id: string
  order: { local?: number; deployed?: number }
}

const DEFAULT_ORDER = 50

export function orderHomeBlocks<T extends HomeBlockOrder>(
  blocks: T[],
  local: boolean,
): T[] {
  const place = (block: T) =>
    block.order[local ? 'local' : 'deployed'] ?? DEFAULT_ORDER
  return [...blocks].sort((a, b) => place(a) - place(b))
}
