// Permanent identities: 16 lowercase Crockford base32 characters (80 random
// bits), as ADR 0001 and the resource identity context describe.
export const RESOURCE_ID = /^[0-9abcdefghjkmnpqrstvwxyz]{16}$/

export function isResourceId(value: unknown): value is string {
  return typeof value === 'string' && RESOURCE_ID.test(value)
}
