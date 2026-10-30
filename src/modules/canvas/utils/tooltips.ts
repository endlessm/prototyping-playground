/**
 * An Excalidraw control's title, "Rectangle — R or 2", as the tooltip shows
 * it: the name, then each shortcut key as a key cap.
 */
export function tooltipParts(title: string) {
  const [label = '', shortcut] = title.split(/\s+—\s+/)
  return {
    label: label.trim(),
    keys: shortcut
      ? shortcut
          .split(/\s+or\s+/)
          .map((key) => key.trim())
          .filter(Boolean)
      : [],
  }
}
