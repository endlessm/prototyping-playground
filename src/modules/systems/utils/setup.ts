// The setup panel's prompt: what a designer pastes into their agent to set
// up a new system, by one of the two Vue paths, routed to the
// setup-design-system skill.

export type SetupPath = 'vue' | 'nuxt-ui'

export interface SetupChoices {
  /** The system's folder key and name. */
  key: string
  label: string
  path: SetupPath
  /** The Vue app or component library to bring in. */
  source?: string
  /** A DESIGN.md link or path, for Nuxt UI. */
  designMd?: string
  /** What the designer wants to build. */
  build?: string
  /** Components they already know they want, for Nuxt UI. */
  components?: string
}

export function setupPrompt(choices: SetupChoices): string {
  const { key, label, path } = choices
  const value = (text?: string) => text?.trim() ?? ''
  const skill = `Use the setup-design-system skill for system “${key}”.`
  const build = value(choices.build)
    ? [`I want to build:\n${value(choices.build)}`]
    : []
  if (path === 'vue')
    return [
      `Bring my existing Vue app into “${label}” (system “${key}”) and suggest what to bring into Studio first.`,
      ...(value(choices.source) ? [`Source:\n${value(choices.source)}`] : []),
      ...build,
      `${skill} Show me the plan before importing.`,
    ].join('\n\n')
  return [
    `Help me set up “${label}” (system “${key}”) starting from Nuxt UI.`,
    ...(value(choices.designMd)
      ? [
          `Use this DESIGN.md as my design direction: ${value(choices.designMd)}`,
        ]
      : []),
    ...build,
    ...(value(choices.components)
      ? [`Please include: ${value(choices.components)}`]
      : []),
    `${skill} Start with the theme and assets, and show them in Studio for my review.`,
  ].join('\n\n')
}
