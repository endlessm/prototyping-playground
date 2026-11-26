// A face flies from where it was picked to where it lands, on an arc, growing to its new size, and the landed face
// gives a small bounce, the way the reference split-the-bill demo adds a person to the stack. The flight is a copy
// drawn above everything, popovers included, so it can leave a list that closes or stays open; the real face waits
// hidden until the copy arrives. `to` is asked for until it exists, since the landing spot may still be rendering.
export function flyFace(from: Element | null | undefined, to: () => HTMLElement | null | undefined) {
  if (!from || matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const doc = from.ownerDocument
  const start = from.getBoundingClientRect()
  const ghost = from.cloneNode(true) as HTMLElement
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${start.left}px`,
    top: `${start.top}px`,
    width: `${start.width}px`,
    height: `${start.height}px`,
    margin: '0',
    zIndex: '1000',
    pointerEvents: 'none',
    borderRadius: '999px',
    overflow: 'hidden',
    filter: 'none',
    opacity: '1',
  })
  doc.body.appendChild(ghost)

  let tries = 0
  const launch = () => {
    const target = to()
    if (!target) {
      if (tries++ < 40) requestAnimationFrame(launch)
      else ghost.remove()
      return
    }
    target.style.visibility = 'hidden'
    const end = target.getBoundingClientRect()
    const dx = end.left + end.width / 2 - (start.left + start.width / 2)
    const dy = end.top + end.height / 2 - (start.top + start.height / 2)
    const scale = target.offsetWidth / start.width
    const lift = Math.min(48, Math.abs(dx) * 0.25 + 16)
    ghost
      .animate(
        [
          { transform: 'translate(0, 0) scale(1)', boxShadow: '0 0 0 rgb(0 0 0 / 0)' },
          {
            transform: `translate(${dx * 0.5}px, ${dy * 0.5 - lift}px) scale(${((1 + scale) / 2) * 1.08})`,
            boxShadow: '0 12px 24px -6px rgb(0 0 0 / 0.25)',
            offset: 0.5,
          },
          { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, boxShadow: '0 0 0 rgb(0 0 0 / 0)' },
        ],
        { duration: 560, easing: 'cubic-bezier(0.45, 0, 0.2, 1)' },
      )
      .finished.then(() => {
        ghost.remove()
        target.style.visibility = ''
        target.animate([{ transform: 'scale(1.14)' }, { transform: 'scale(0.96)', offset: 0.6 }, { transform: 'scale(1)' }], {
          duration: 360,
          easing: 'ease-out',
        })
      })
  }
  requestAnimationFrame(launch)
}
