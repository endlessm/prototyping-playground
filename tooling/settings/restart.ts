import { IDENTITY_TAG } from '../restart/names.ts'

// The dev server that served a page names itself in this meta tag. How a tab
// waits out a restart is the restart handoff's (`../restart/handoff.ts`).
export const INSTANCE_META = IDENTITY_TAG
