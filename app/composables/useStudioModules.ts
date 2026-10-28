import modules from '#studio/modules'

// The enabled modules, as the build saw them. Switching a module on or off
// takes a dev server restart.
export function useStudioModules() {
  return modules
}

export function useStudioModule(id: string) {
  return modules.find((module) => module.id === id)
}
