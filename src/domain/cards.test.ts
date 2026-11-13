import { describe, expect, it } from 'vitest'
import { normalizeAnswer, parseCardText } from './cards'

describe('parseCardText', () => {
  it('parses one card per non-empty line and splits only on the first equals sign', () => {
    expect(parseCardText('  Hallo = Hello = hi\nNur Vorderseite\n\n')).toEqual({
      cards: [
        { front: 'Hallo', back: 'Hello = hi' },
        { front: 'Nur Vorderseite', back: '' },
      ],
      duplicates: 0,
    })
  })

  it('skips duplicate fronts ignoring case and surrounding whitespace', () => {
    expect(parseCardText('Wort = eins\n WORT = zwei\nneu = drei', [' wort '])).toEqual({
      cards: [{ front: 'neu', back: 'drei' }],
      duplicates: 2,
    })
  })

  it('normalizes answers by trimming, collapsing whitespace, and ignoring case', () => {
    expect(normalizeAnswer('  Guten   TAG ')).toBe('guten tag')
  })
})
