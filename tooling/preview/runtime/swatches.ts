// Runs inside a Breakdown's preview document: the colour each colour knob's
// class paints with here, so the studio can show the system's own colours
// beside their names. Read from the document's stylesheet itself, which
// names every class a knob can write, through a hidden probe.

/** Each class's colour: its background for `bg-*`, its text for `text-*`. */
export function measureSwatches(classes: string[]): Record<string, string> {
  const probe = document.createElement('span')
  probe.setAttribute('aria-hidden', 'true')
  probe.style.cssText =
    'position: absolute; width: 0; height: 0; overflow: hidden; pointer-events: none;'
  document.body.append(probe)
  const found: Record<string, string> = {}
  for (const name of classes) {
    probe.className = name
    const style = getComputedStyle(probe)
    found[name] = name.startsWith('bg-') ? style.backgroundColor : style.color
  }
  probe.remove()
  return found
}
