import type { InjectionKey } from 'vue'

// A view provides this to turn its welcome card's first steps into a checklist people tick themselves, celebrated
// with a green wave once every step is ticked. Provided rather than passed so one view opts in without the place
// pages threading a prop through.
export const celebrateKey: InjectionKey<boolean> = Symbol('celebrate')
