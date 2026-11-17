/**
 * Whether a prototype is yours: you own it, or, without an owner, it is in
 * your folder. Who may change it adds Admins (`useMayChange`).
 */
export const isOwnPrototype = (
  me: { key: string | null; studioId?: string },
  prototype: { owner: string | null; contributor: string },
) =>
  Boolean(me.key) &&
  (prototype.owner
    ? prototype.owner === me.studioId
    : prototype.contributor === me.key)
