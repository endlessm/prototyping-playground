// Finding a diagram comment's target again after the diagram is drawn
// again: by the Mermaid ID the source gives it, then by its label. Mermaid
// numbers the elements it draws in drawing order, so the ID is read out of
// the drawn element's own ID without that number.
import { describe, expect, test } from 'vitest'
import {
  findDiagramElement,
  mermaidEdge,
  mermaidNodeId,
  type DiagramElement,
} from '../../src/modules/diagrams/types/diagram/anchors'

describe('the Mermaid ID of a drawn element', () => {
  test("a step's ID is its source ID, without the drawing's number", () => {
    const svg = 'mermaid-v1-3'
    expect(mermaidNodeId(`${svg}-flowchart-age-1`, svg)).toBe('age')
    expect(mermaidNodeId(`${svg}-flowchart-a_b-6`, svg)).toBe('a_b')
    expect(mermaidNodeId(`${svg}-flowchart-sign-in-12`, svg)).toBe('sign-in')
  })

  test("an arrow's ends are found among the diagram's steps", () => {
    const steps = new Set(['start', 'age', 'a_b', 'invite'])
    expect(mermaidEdge('L_start_age_0', steps)).toEqual({
      from: 'start',
      to: 'age',
      index: 0,
    })
    expect(mermaidEdge('L_a_b_invite_2', steps)).toEqual({
      from: 'a_b',
      to: 'invite',
      index: 2,
    })
    expect(mermaidEdge('L_gone_age_0', steps)).toBeNull()
  })
})

describe('re-finding a diagram target [CM-14] [CM-23]', () => {
  const element = (
    kind: DiagramElement['kind'],
    mermaid: string,
    label: string,
  ): DiagramElement => ({ kind, mermaid, label })

  test('by its Mermaid ID, whatever its label is now', () => {
    const now = [
      element('step', 'home', 'Step "Home"'),
      element('step', 'age', 'Step "Older than 18?"'),
    ]
    expect(
      findDiagramElement(now, element('step', 'age', 'Step "Under 18?"')),
    ).toBe(now[1])
  })

  test('by its label when its ID changed', () => {
    const now = [
      element('step', 'home', 'Step "Home"'),
      element('step', 'minor', 'Step "Under 18?"'),
    ]
    expect(
      findDiagramElement(now, element('step', 'age', 'Step "Under 18?"')),
    ).toBe(now[1])
  })

  test('only among elements of its kind', () => {
    const now = [
      element('group', 'age', 'Group "Under 18?"'),
      element('arrow', 'start --> age', 'Arrow "Sign in" → "Under 18?"'),
    ]
    expect(
      findDiagramElement(now, element('step', 'age', 'Step "Under 18?"')),
    ).toBeNull()
    expect(
      findDiagramElement(
        now,
        element('arrow', 'start --> age', 'Arrow "Start" → "Age"'),
      ),
    ).toBe(now[1])
  })

  test('is not found when both its ID and its label are gone', () => {
    const now = [element('step', 'home', 'Step "Home"')]
    expect(
      findDiagramElement(now, element('step', 'age', 'Step "Under 18?"')),
    ).toBeNull()
  })
})
